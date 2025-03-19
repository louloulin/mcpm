import { Command } from 'commander';
import chalk from 'chalk';
import path from 'path';
import { getConfig } from '../utils/config';
import { getInstalledServers } from '../utils/server';

export function listCommand(program: Command): void {
  program
    .command('list')
    .alias('ls')
    .description('列出已安装的MCP服务器')
    .option('-p, --path <path>', '指定安装路径')
    .option('-g, --global', '使用全局安装路径', false)
    .option('-j, --json', '以JSON格式输出', false)
    .action((options) => {
      try {
        const config = getConfig();
        
        // 确定安装路径
        let installPath = config.servers.installPath;
        if (options.path) {
          installPath = options.path;
        } else if (!options.global) {
          installPath = path.join(process.cwd(), '.mcpr', 'servers');
        }
        
        // 获取已安装的服务器
        const servers = getInstalledServers(installPath);
        
        if (servers.length === 0) {
          console.log(chalk.yellow(`在 ${installPath} 中未找到已安装的服务器`));
          return;
        }
        
        // JSON输出
        if (options.json) {
          console.log(JSON.stringify(servers, null, 2));
          return;
        }
        
        // 表格输出
        console.log(chalk.bold(`在 ${installPath} 中发现 ${servers.length} 个已安装的服务器:\n`));
        
        console.log(
          chalk.cyan(padRight('名称', 20)) + 
          chalk.cyan(padRight('标识符', 15)) + 
          chalk.cyan(padRight('版本', 10)) + 
          chalk.cyan(padRight('命令', 10)) +
          chalk.cyan('描述')
        );
        
        console.log('-'.repeat(80));
        
        servers.forEach(server => {
          console.log(
            padRight(server.name || '', 20) + 
            padRight(server.key, 15) + 
            padRight(server.version || '', 10) + 
            padRight(server.command || '', 10) +
            truncate(server.description || '', 50)
          );
        });
        
        console.log('\n提示: 使用 "mcpr info <key>" 查看详细信息');
      } catch (error: any) {
        console.error(chalk.red(`获取服务器列表失败: ${error.message}`));
      }
    });
}

/**
 * 右侧填充字符串
 */
function padRight(str: string, length: number): string {
  return (str + ' '.repeat(length)).substring(0, length);
}

/**
 * 截断字符串
 */
function truncate(str: string, length: number): string {
  return str.length > length ? str.substring(0, length - 3) + '...' : str;
} 