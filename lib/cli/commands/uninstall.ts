import { Command } from 'commander';
import chalk from 'chalk';
import path from 'path';
import { getConfig } from '../utils/config';
import { getInstalledServers, uninstallServer } from '../utils/server';

export function uninstallCommand(program: Command): void {
  program
    .command('uninstall')
    .description('卸载MCP服务器')
    .argument('<key>', 'MCP服务器标识符')
    .option('-p, --path <path>', '指定安装路径')
    .option('-g, --global', '从全局路径卸载', false)
    .action(async (key, options) => {
      try {
        const config = getConfig();
        
        // 确定安装路径
        let installPath = config.servers.installPath;
        if (options.path) {
          installPath = options.path;
        } else if (!options.global) {
          installPath = path.join(process.cwd(), '.mcpr', 'servers');
        }
        
        // 检查服务器是否存在
        const servers = getInstalledServers(installPath);
        const server = servers.find(s => s.key === key);
        
        if (!server) {
          console.log(chalk.yellow(`服务器 ${key} 未在 ${installPath} 中安装`));
          return;
        }
        
        // 卸载服务器
        uninstallServer(key, installPath);
        
        console.log(chalk.green(`服务器 ${server.name || key} 已成功卸载`));
      } catch (error: any) {
        console.error(chalk.red(`卸载失败: ${error.message}`));
      }
    });
} 