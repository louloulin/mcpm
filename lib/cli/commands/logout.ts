import { Command } from 'commander';
import chalk from 'chalk';
import { getConfig, updateConfig } from '../utils/config';

export function logoutCommand(program: Command): void {
  program
    .command('logout')
    .description('退出MCP服务器仓库登录')
    .action(() => {
      try {
        const config = getConfig();
        
        // 检查是否已登录
        if (!config.registry.token) {
          console.log(chalk.yellow('您尚未登录'));
          return;
        }
        
        // 清除令牌
        updateConfig({
          registry: {
            url: config.registry.url, // 保留现有的URL
            token: undefined // 清除令牌
          }
        });
        
        console.log(chalk.green('已成功退出登录'));
      } catch (error: any) {
        console.error(chalk.red(`退出登录失败: ${error.message}`));
      }
    });
} 