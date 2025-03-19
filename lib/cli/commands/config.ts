import { Command } from 'commander';
import chalk from 'chalk';
import { getConfig, updateConfig, Config } from '../utils/config';

export function configCommand(program: Command): void {
  program
    .command('config')
    .description('查看和设置配置选项')
    .option('-v, --view', '查看当前配置')
    .option('-s, --set <key=value>', '设置配置值')
    .option('-r, --registry <url>', '设置仓库地址')
    .option('-p, --path <path>', '设置服务器安装路径')
    .option('-a, --auto-update <boolean>', '设置是否自动更新')
    .action((options) => {
      try {
        const config = getConfig();
        
        // 查看配置
        if (options.view || (!options.set && !options.registry && !options.path && !options.autoUpdate)) {
          displayConfig(config);
          return;
        }
        
        // 设置配置
        const updates: Partial<Config> = {};
        
        // 通过 key=value 设置
        if (options.set) {
          const [key, value] = options.set.split('=');
          if (!key || value === undefined) {
            console.error(chalk.red('格式错误，请使用 key=value 格式'));
            return;
          }
          
          setNestedProperty(updates, key, parseValue(value));
        }
        
        // 设置仓库地址
        if (options.registry) {
          updates.registry = {
            ...(updates.registry || {}),
            url: options.registry
          };
        }
        
        // 设置服务器安装路径
        if (options.path) {
          updates.servers = {
            ...(updates.servers || {}),
            installPath: options.path
          };
        }
        
        // 设置自动更新
        if (options.autoUpdate !== undefined) {
          updates.servers = {
            ...(updates.servers || {}),
            autoUpdate: options.autoUpdate === 'true'
          };
        }
        
        // 更新配置
        const newConfig = updateConfig(updates);
        
        console.log(chalk.green('配置已更新:'));
        displayConfig(newConfig);
      } catch (error: any) {
        console.error(chalk.red(`配置操作失败: ${error.message}`));
      }
    });
}

/**
 * 显示配置
 */
function displayConfig(config: Config): void {
  console.log(chalk.bold('当前配置:'));
  
  console.log(chalk.cyan('仓库:'));
  console.log(`  URL: ${config.registry.url}`);
  console.log(`  Token: ${config.registry.token ? '已设置' : '未设置'}`);
  
  console.log(chalk.cyan('客户端:'));
  console.log(`  类型: ${config.client.type}`);
  console.log(`  配置路径: ${config.client.configPath}`);
  
  console.log(chalk.cyan('服务器:'));
  console.log(`  安装路径: ${config.servers.installPath}`);
  console.log(`  自动更新: ${config.servers.autoUpdate ? '是' : '否'}`);
}

/**
 * 设置嵌套属性
 */
function setNestedProperty(obj: any, path: string, value: any): void {
  const parts = path.split('.');
  const last = parts.pop();
  
  let current = obj;
  for (const part of parts) {
    current[part] = current[part] || {};
    current = current[part];
  }
  
  if (last) {
    current[last] = value;
  }
}

/**
 * 解析配置值
 */
function parseValue(value: string): any {
  // 尝试解析布尔值
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;
  
  // 尝试解析数字
  const num = Number(value);
  if (!isNaN(num) && value.trim() !== '') return num;
  
  // 默认为字符串
  return value;
} 