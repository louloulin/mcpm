import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import axios from 'axios';
import { getConfig } from '../utils/config';

export function searchCommand(program: Command): void {
  program
    .command('search')
    .description('搜索MCP服务器')
    .argument('[query]', '搜索关键词')
    .option('-t, --tag <tag>', '按标签过滤')
    .option('-a, --author <author>', '按作者过滤')
    .option('-j, --json', '以JSON格式输出', false)
    .option('-l, --limit <number>', '限制结果数量', '20')
    .action(async (query, options) => {
      const spinner = ora('正在搜索...').start();
      
      try {
        const config = getConfig();
        
        // 构建查询参数
        const params: any = {
          limit: parseInt(options.limit)
        };
        
        if (query) {
          params.q = query;
        }
        
        if (options.tag) {
          params.tag = options.tag;
        }
        
        if (options.author) {
          params.author = options.author;
        }
        
        // 执行搜索
        const response = await axios.get(`${config.registry.url}/api/v1/search`, {
          params,
          headers: config.registry.token 
            ? { Authorization: `Bearer ${config.registry.token}` }
            : {}
        });
        
        const servers = response.data;
        
        spinner.stop();
        
        if (servers.length === 0) {
          console.log(chalk.yellow('未找到匹配的服务器'));
          return;
        }
        
        // JSON输出
        if (options.json) {
          console.log(JSON.stringify(servers, null, 2));
          return;
        }
        
        // 表格输出
        console.log(chalk.bold(`搜索结果 (${servers.length}):\n`));
        
        console.log(
          chalk.cyan(padRight('名称', 20)) + 
          chalk.cyan(padRight('标识符', 15)) + 
          chalk.cyan(padRight('版本', 10)) +
          chalk.cyan('描述')
        );
        
        console.log('-'.repeat(80));
        
        servers.forEach(server => {
          console.log(
            padRight(server.name || '', 20) + 
            padRight(server.key, 15) + 
            padRight(server.version || '', 10) +
            truncate(server.description || '', 60)
          );
        });
        
        console.log('\n提示: 使用 "mcpr info -r <key>" 查看详细信息');
        console.log('      使用 "mcpr install <key>" 安装服务器');
      } catch (error: any) {
        spinner.fail('搜索失败');
        
        if (error.response && error.response.status === 404) {
          console.error(chalk.red('搜索API不可用'));
        } else if (error.response && error.response.data && error.response.data.error) {
          console.error(chalk.red(`搜索失败: ${error.response.data.error}`));
        } else {
          console.error(chalk.red(`搜索失败: ${error.message}`));
        }
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