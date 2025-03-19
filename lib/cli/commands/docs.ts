import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs';
import glob from 'glob';
import { generateApiDocs } from '../../api-docs/generator';
import { getConfig } from '../utils/config';

/**
 * 获取当前版本号
 */
function getCurrentVersion(): string {
  try {
    // 尝试从package.json获取版本
    const packageJsonPath = path.resolve(process.cwd(), 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      if (packageJson.version) {
        return packageJson.version;
      }
    }
    
    // 尝试从配置中获取版本（如果存在）
    const config = getConfig();
    if (config && typeof config === 'object' && 'version' in config) {
      return config.version as string;
    }
    
    // 默认版本
    return '1.0.0';
  } catch (error) {
    return '1.0.0';
  }
}

/**
 * 注册文档命令
 */
export function docsCommand(program: Command): void {
  const docs = program
    .command('docs')
    .description('API文档生成和管理工具');
  
  // 生成API文档子命令
  docs
    .command('generate')
    .description('生成API文档')
    .option('-i, --input <files>', '输入文件路径 (支持glob模式)', '**/*.ts')
    .option('-o, --output <dir>', '输出目录', 'docs/api')
    .option('-t, --title <title>', 'API文档标题', 'MCP Cloud API')
    .option('-v, --version <version>', 'API版本', getCurrentVersion())
    .option('-d, --description <desc>', 'API文档描述')
    .option('-b, --base-path <path>', 'API基础路径', '/api')
    .option('--ts, --typescript', '强制将所有文件作为TypeScript处理', false)
    .action(async (options) => {
      const spinner = ora('正在扫描源文件...').start();
      
      try {
        // 解析当前工作目录
        const cwd = process.cwd();
        
        // 查找匹配的源文件
        const files = glob.sync(options.input, {
          cwd,
          ignore: ['node_modules/**', 'dist/**', 'build/**', 'coverage/**']
        });
        
        if (files.length === 0) {
          spinner.fail(`未找到匹配 "${options.input}" 的源文件`);
          return;
        }
        
        spinner.text = `找到 ${files.length} 个源文件，正在生成文档...`;
        
        // 确保输出目录存在
        const outputDir = path.resolve(cwd, options.output);
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // 生成文档
        await generateApiDocs({
          inputFiles: files.map(file => path.resolve(cwd, file)),
          outputDir,
          title: options.title,
          version: options.version,
          description: options.description,
          basePath: options.basePath,
          typescript: options.typescript
        });
        
        spinner.succeed(`API文档生成完成，位于 ${chalk.cyan(outputDir)}`);
        console.log(`\n使用浏览器打开 ${chalk.cyan(path.join(outputDir, 'index.html'))} 查看文档`);
      } catch (error: any) {
        spinner.fail(`生成API文档失败: ${error.message}`);
        console.error(error);
      }
    });
  
  // 预览文档子命令
  docs
    .command('serve')
    .description('启动本地服务器预览文档')
    .option('-d, --dir <dir>', '文档目录', 'docs/api')
    .option('-p, --port <port>', '服务器端口', '8080')
    .action(async (options) => {
      try {
        const http = await import('http');
        const handler = await import('serve-handler');
        
        const docDir = path.resolve(process.cwd(), options.dir);
        
        if (!fs.existsSync(docDir)) {
          console.error(chalk.red(`错误: 文档目录 ${docDir} 不存在`));
          console.log(`请先运行 ${chalk.cyan('mcpr docs generate')} 生成文档`);
          return;
        }
        
        const server = http.createServer((request, response) => {
          return handler.default(request, response, {
            public: docDir
          });
        });
        
        server.listen(options.port, () => {
          console.log(`
${chalk.green('文档服务器已启动!')}
${chalk.bold('本地:')} ${chalk.cyan(`http://localhost:${options.port}`)}

按 ${chalk.bold('Ctrl+C')} 停止服务器
          `);
        });
      } catch (error: any) {
        console.error(chalk.red(`启动预览服务失败: ${error.message}`));
        if (error.code === 'MODULE_NOT_FOUND') {
          console.log(`请先安装 serve-handler: ${chalk.cyan('npm install serve-handler')}`);
        }
      }
    });
    
  // 清理文档子命令
  docs
    .command('clean')
    .description('清理生成的文档')
    .option('-d, --dir <dir>', '文档目录', 'docs/api')
    .option('-f, --force', '强制清理，不提示确认', false)
    .action(async (options) => {
      const docDir = path.resolve(process.cwd(), options.dir);
      
      if (!fs.existsSync(docDir)) {
        console.log(chalk.yellow(`文档目录 ${docDir} 不存在，无需清理`));
        return;
      }
      
      if (!options.force) {
        const inquirer = await import('inquirer');
        const { confirm } = await inquirer.default.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: `确定要删除 ${docDir} 中的所有文档吗？`,
            default: false
          }
        ]);
        
        if (!confirm) {
          console.log(chalk.yellow('清理操作已取消'));
          return;
        }
      }
      
      const spinner = ora(`正在清理文档目录 ${docDir}...`).start();
      
      try {
        // 递归删除目录
        fs.rmSync(docDir, { recursive: true, force: true });
        spinner.succeed(`文档目录 ${chalk.cyan(docDir)} 已清理`);
      } catch (error: any) {
        spinner.fail(`清理文档失败: ${error.message}`);
      }
    });
} 