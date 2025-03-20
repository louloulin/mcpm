import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import axios from 'axios';
import { getConfig } from '../utils/config';

export function syncCommand(program: Command): void {
  program
    .command('sync')
    .description('同步MCP服务器仓库')
    .option('-f, --force', '强制同步', false)
    .action(async (options) => {
      const spinner = ora('正在同步仓库...').start();
      
      try {
        const config = getConfig();
        
        // 发送同步请求
        const response = await axios.post(
          `${config.registry.url}/api/v1/sync`, 
          { force: options.force },
          { 
            headers: config.registry.token 
              ? { Authorization: `Bearer ${config.registry.token}` }
              : {}
          }
        );
        
        spinner.succeed('仓库同步成功');
        
        // 显示同步结果
        const result = response.data;
        
        console.log(chalk.bold('\n同步统计:'));
        console.log(`  总共: ${chalk.cyan(result.total || 0)} 个服务器`);
        console.log(`  新增: ${chalk.green(result.added || 0)} 个`);
        console.log(`  更新: ${chalk.yellow(result.updated || 0)} 个`);
        console.log(`  删除: ${chalk.red(result.removed || 0)} 个`);
        console.log(`  失败: ${chalk.red(result.failed || 0)} 个`);
        
        // 如果有失败项目，显示失败详情
        if (result.failed && result.failed > 0 && result.failedItems) {
          console.log(chalk.bold('\n失败详情:'));
          
          result.failedItems.forEach((item: any, index: number) => {
            console.log(`  ${index + 1}. ${chalk.red(item.name || item.key || '未知')}`);
            if (item.error) {
              console.log(`     原因: ${item.error}`);
            }
          });
        }
      } catch (error: any) {
        spinner.fail('仓库同步失败');
        
        if (error.response && error.response.status === 401) {
          console.error(chalk.red('未授权，请使用 "mcpm login" 命令登录'));
        } else if (error.response && error.response.data && error.response.data.error) {
          console.error(chalk.red(`同步失败: ${error.response.data.error}`));
        } else {
          console.error(chalk.red(`同步失败: ${error.message}`));
        }
      }
    });
} 