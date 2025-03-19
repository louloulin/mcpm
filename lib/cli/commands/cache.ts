import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs';
import os from 'os';
import inquirer from 'inquirer';
import prettyBytes from 'pretty-bytes';
import { getConfig, updateConfig } from '../utils/config';

// 缓存目录结构
const CACHE_DIRS = {
  servers: 'servers',   // 服务器下载缓存
  assets: 'assets',     // 资源文件缓存
  metadata: 'metadata', // 元数据缓存
  temp: 'temp'          // 临时文件
};

// 缓存项类型
interface CacheItem {
  name: string;
  path: string;
  size: number;
  ctime: Date;
  mtime: Date;
}

/**
 * 获取默认缓存目录
 */
function getDefaultCacheDir(): string {
  return path.join(os.homedir(), '.mcpr', 'cache');
}

/**
 * 获取缓存目录路径
 * @param config 配置
 * @param subDir 子目录
 */
function getCacheDir(config: any, subDir?: string): string {
  // 从配置中获取缓存目录，如果未设置则使用默认值
  const cacheDir = config.cache?.dir || getDefaultCacheDir();
  
  if (subDir) {
    return path.join(cacheDir, subDir);
  }
  
  return cacheDir;
}

/**
 * 确保缓存目录存在
 * @param dirPath 目录路径
 */
function ensureCacheDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * 获取目录大小
 * @param dirPath 目录路径
 */
function getDirSize(dirPath: string): number {
  if (!fs.existsSync(dirPath)) {
    return 0;
  }
  
  let size = 0;
  
  // 递归读取目录中的文件
  function readDir(dir: string) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        readDir(filePath);
      } else {
        size += stat.size;
      }
    }
  }
  
  readDir(dirPath);
  return size;
}

/**
 * 列出缓存项
 * @param dirPath 目录路径
 * @param pattern 文件匹配模式
 */
function listCacheItems(dirPath: string, pattern?: string): CacheItem[] {
  if (!fs.existsSync(dirPath)) {
    return [];
  }
  
  const items: CacheItem[] = [];
  
  // 递归读取目录
  function readDir(dir: string, baseName: string = '') {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      const relativePath = baseName ? path.join(baseName, file) : file;
      
      // 如果是目录，递归读取
      if (stat.isDirectory()) {
        // 添加目录本身
        items.push({
          name: relativePath,
          path: filePath,
          size: getDirSize(filePath),
          ctime: stat.ctime,
          mtime: stat.mtime
        });
        
        // 递归读取子目录
        readDir(filePath, relativePath);
      } else {
        // 如果有匹配模式，检查文件名是否匹配
        if (pattern && !file.includes(pattern)) {
          continue;
        }
        
        // 添加文件
        items.push({
          name: relativePath,
          path: filePath,
          size: stat.size,
          ctime: stat.ctime,
          mtime: stat.mtime
        });
      }
    }
  }
  
  readDir(dirPath);
  return items;
}

/**
 * 清理缓存目录
 * @param dirPath 目录路径
 * @param pattern 文件匹配模式
 * @param olderThan 早于指定天数的文件
 */
function cleanCache(dirPath: string, pattern?: string, olderThan?: number): number {
  if (!fs.existsSync(dirPath)) {
    return 0;
  }
  
  let totalSize = 0;
  const now = new Date();
  
  // 递归清理目录
  function cleanDir(dir: string) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      // 检查是否满足匹配条件
      const isMatch = !pattern || file.includes(pattern);
      
      // 检查是否满足时间条件
      let isOlderThanDays = true;
      if (olderThan) {
        const mtime = new Date(stat.mtime);
        const diffDays = (now.getTime() - mtime.getTime()) / (1000 * 60 * 60 * 24);
        isOlderThanDays = diffDays > olderThan;
      }
      
      if (stat.isDirectory()) {
        // 递归清理子目录
        cleanDir(filePath);
        
        // 如果目录变空则删除
        if (fs.readdirSync(filePath).length === 0) {
          fs.rmdirSync(filePath);
        }
      } else if (isMatch && isOlderThanDays) {
        // 累加文件大小
        totalSize += stat.size;
        
        // 删除文件
        fs.unlinkSync(filePath);
      }
    }
  }
  
  cleanDir(dirPath);
  return totalSize;
}

/**
 * 注册缓存管理命令
 */
export function cacheCommand(program: Command): void {
  const cache = program
    .command('cache')
    .description('管理MCP本地缓存');
  
  // 缓存信息子命令
  cache
    .command('info')
    .description('显示缓存信息')
    .action(() => {
      const config = getConfig();
      const cacheDir = getCacheDir(config);
      
      // 确保缓存目录存在
      ensureCacheDir(cacheDir);
      
      console.log(chalk.bold('MCP缓存信息:'));
      console.log(`缓存目录: ${chalk.cyan(cacheDir)}`);
      
      const totalItems: Record<string, number> = {};
      const totalSizes: Record<string, number> = {};
      
      // 遍历缓存子目录
      Object.entries(CACHE_DIRS).forEach(([key, dir]) => {
        const dirPath = path.join(cacheDir, dir);
        
        if (fs.existsSync(dirPath)) {
          const items = listCacheItems(dirPath);
          const size = getDirSize(dirPath);
          
          totalItems[key] = items.length;
          totalSizes[key] = size;
        } else {
          totalItems[key] = 0;
          totalSizes[key] = 0;
        }
      });
      
      // 汇总大小
      const totalSize = Object.values(totalSizes).reduce((acc, size) => acc + size, 0);
      
      // 打印结果
      console.log(chalk.bold('\n缓存内容:'));
      
      Object.entries(CACHE_DIRS).forEach(([key, dir]) => {
        const size = totalSizes[key];
        const itemCount = totalItems[key];
        
        console.log(`${key}: ${chalk.cyan(itemCount)} 项 (${chalk.yellow(prettyBytes(size))})`);
      });
      
      console.log(chalk.bold('\n总计:'));
      console.log(`${chalk.cyan(Object.values(totalItems).reduce((acc, count) => acc + count, 0))} 项 (${chalk.yellow(prettyBytes(totalSize))})`);
    });
  
  // 列出缓存内容子命令
  cache
    .command('list')
    .description('列出缓存内容')
    .option('-t, --type <type>', '缓存类型 (servers, assets, metadata, temp)', 'servers')
    .option('-p, --pattern <pattern>', '搜索模式')
    .option('-l, --limit <limit>', '限制结果数', '10')
    .action((options) => {
      const config = getConfig();
      const type = options.type;
      
      // 验证缓存类型
      if (!Object.keys(CACHE_DIRS).includes(type)) {
        console.error(chalk.red(`不支持的缓存类型: ${type}`));
        console.log(`支持的类型: ${Object.keys(CACHE_DIRS).join(', ')}`);
        return;
      }
      
      // 获取缓存目录
      const dirPath = path.join(getCacheDir(config), CACHE_DIRS[type as keyof typeof CACHE_DIRS]);
      
      // 确保缓存目录存在
      ensureCacheDir(dirPath);
      
      // 列出缓存项
      const items = listCacheItems(dirPath, options.pattern);
      
      // 按修改时间排序(最新的在前)
      items.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
      
      // 限制结果数
      const limit = parseInt(options.limit);
      const limitedItems = !isNaN(limit) && limit > 0 ? items.slice(0, limit) : items;
      
      console.log(chalk.bold(`${type}缓存内容:`));
      console.log(`目录: ${chalk.cyan(dirPath)}`);
      console.log(`总项目数: ${chalk.cyan(items.length)}`);
      
      if (options.pattern) {
        console.log(`搜索模式: ${chalk.cyan(options.pattern)}`);
      }
      
      if (items.length === 0) {
        console.log(chalk.yellow('\n缓存为空'));
        return;
      }
      
      console.log(chalk.bold('\n项目列表:'));
      
      limitedItems.forEach((item, index) => {
        console.log(`${index + 1}. ${item.name}`);
        console.log(`   大小: ${chalk.yellow(prettyBytes(item.size))}`);
        console.log(`   修改时间: ${chalk.cyan(item.mtime.toLocaleString())}`);
      });
      
      if (items.length > limitedItems.length) {
        console.log(chalk.dim(`\n...还有 ${items.length - limitedItems.length} 个项目未显示`));
      }
    });
  
  // 清理缓存子命令
  cache
    .command('clean')
    .description('清理缓存')
    .option('-t, --type <type>', '缓存类型 (servers, assets, metadata, temp, all)', 'temp')
    .option('-p, --pattern <pattern>', '文件匹配模式')
    .option('-d, --days <days>', '清理多少天前的缓存')
    .option('-f, --force', '跳过确认', false)
    .action(async (options) => {
      const config = getConfig();
      const type = options.type;
      const pattern = options.pattern;
      const days = options.days ? parseInt(options.days) : undefined;
      
      // 确定要清理的目录
      let dirs: string[] = [];
      
      if (type === 'all') {
        // 清理所有缓存
        dirs = Object.values(CACHE_DIRS).map(dir => path.join(getCacheDir(config), dir));
      } else if (Object.keys(CACHE_DIRS).includes(type)) {
        // 清理指定类型的缓存
        dirs = [path.join(getCacheDir(config), CACHE_DIRS[type as keyof typeof CACHE_DIRS])];
      } else {
        console.error(chalk.red(`不支持的缓存类型: ${type}`));
        console.log(`支持的类型: ${Object.keys(CACHE_DIRS).join(', ')}, all`);
        return;
      }
      
      // 构建描述
      let description = `清理${type === 'all' ? '所有' : type}缓存`;
      
      if (pattern) {
        description += ` (匹配: ${pattern})`;
      }
      
      if (days) {
        description += ` (${days}天前)`;
      }
      
      // 确认清理
      if (!options.force) {
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: `确认${description}?`,
            default: false
          }
        ]);
        
        if (!confirm) {
          console.log(chalk.yellow('操作已取消'));
          return;
        }
      }
      
      // 清理缓存
      const spinner = ora(`正在${description}...`).start();
      
      try {
        let totalSizeCleaned = 0;
        
        for (const dir of dirs) {
          if (fs.existsSync(dir)) {
            totalSizeCleaned += cleanCache(dir, pattern, days);
          }
        }
        
        spinner.succeed(`${description}完成`);
        console.log(`总共清理: ${chalk.yellow(prettyBytes(totalSizeCleaned))}`);
      } catch (error: any) {
        spinner.fail(`清理缓存失败`);
        console.error(chalk.red(error.message));
      }
    });
  
  // 配置缓存目录子命令
  cache
    .command('config')
    .description('配置缓存目录')
    .option('-d, --dir <directory>', '设置缓存目录')
    .option('-s, --show', '显示当前缓存配置', false)
    .option('-r, --reset', '重置为默认缓存目录', false)
    .action(async (options) => {
      const config = getConfig();
      
      // 显示当前配置
      if (options.show) {
        console.log(chalk.bold('当前缓存配置:'));
        console.log(`缓存目录: ${chalk.cyan(config.cache?.dir || getDefaultCacheDir())}`);
        console.log(`缓存限制: ${chalk.cyan(prettyBytes((config.cache?.sizeLimit || 500) * 1024 * 1024))}`);
        return;
      }
      
      // 重置为默认配置
      if (options.reset) {
        const defaultDir = getDefaultCacheDir();
        
        // 更新配置
        updateConfig({
          ...config,
          cache: {
            ...config.cache,
            dir: defaultDir
          }
        });
        
        console.log(`缓存目录已重置为默认: ${chalk.cyan(defaultDir)}`);
        return;
      }
      
      // 设置新的缓存目录
      if (options.dir) {
        const newDir = path.resolve(options.dir);
        
        // 确保目录存在
        ensureCacheDir(newDir);
        
        // 更新配置
        updateConfig({
          ...config,
          cache: {
            ...config.cache,
            dir: newDir
          }
        });
        
        console.log(`缓存目录已设置为: ${chalk.cyan(newDir)}`);
        
        // 询问是否迁移现有缓存
        const { migrate } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'migrate',
            message: '是否迁移现有缓存到新目录?',
            default: true
          }
        ]);
        
        if (migrate) {
          const oldDir = getCacheDir(config);
          
          if (fs.existsSync(oldDir)) {
            const spinner = ora('正在迁移缓存...').start();
            
            try {
              // 遍历缓存子目录
              Object.values(CACHE_DIRS).forEach(dir => {
                const srcDir = path.join(oldDir, dir);
                const destDir = path.join(newDir, dir);
                
                if (fs.existsSync(srcDir)) {
                  // 确保目标目录存在
                  ensureCacheDir(destDir);
                  
                  // 复制文件
                  const files = fs.readdirSync(srcDir);
                  
                  for (const file of files) {
                    const srcPath = path.join(srcDir, file);
                    const destPath = path.join(destDir, file);
                    
                    // 创建目录
                    if (fs.statSync(srcPath).isDirectory()) {
                      fs.mkdirSync(destPath, { recursive: true });
                    } else {
                      // 复制文件
                      fs.copyFileSync(srcPath, destPath);
                    }
                  }
                }
              });
              
              spinner.succeed('缓存迁移完成');
              
              // 询问是否删除旧缓存
              const { deleteOld } = await inquirer.prompt([
                {
                  type: 'confirm',
                  name: 'deleteOld',
                  message: '是否删除旧缓存目录?',
                  default: false
                }
              ]);
              
              if (deleteOld) {
                fs.rmSync(oldDir, { recursive: true, force: true });
                console.log(`旧缓存目录已删除: ${chalk.cyan(oldDir)}`);
              }
            } catch (error: any) {
              spinner.fail('缓存迁移失败');
              console.error(chalk.red(error.message));
            }
          }
        }
      } else {
        // 如果没有提供任何选项，显示当前配置
        console.log(chalk.bold('当前缓存配置:'));
        console.log(`缓存目录: ${chalk.cyan(config.cache?.dir || getDefaultCacheDir())}`);
        console.log(`缓存限制: ${chalk.cyan(prettyBytes((config.cache?.sizeLimit || 500) * 1024 * 1024))}`);
      }
    });
} 