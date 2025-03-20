import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import axios from 'axios';
import path from 'path';
import fs from 'fs';
import { getConfig } from '../utils/config';
import { getInstalledServers, installServer } from '../utils/server';

export function installCommand(program: Command): void {
  program
    .command('install')
    .alias('i')
    .description('安装MCP服务器')
    .argument('<key>', 'MCP服务器标识符')
    .option('-p, --path <path>', '指定安装路径')
    .option('-g, --global', '安装到全局路径', false)
    .option('-f, --force', '强制重新安装', false)
    .option('-v, --version <version>', '指定版本')
    .action(async (key, options) => {
      try {
        const config = getConfig();
        
        // 确定安装路径
        let installPath = config.servers.installPath;
        if (options.path) {
          installPath = options.path;
        } else if (!options.global) {
          installPath = path.join(process.cwd(), '.mcpm', 'servers');
        }
        
        // 确保安装路径存在
        if (!fs.existsSync(installPath)) {
          fs.mkdirSync(installPath, { recursive: true });
        }
        
        // 检查是否已安装
        const servers = getInstalledServers(installPath);
        const existingServer = servers.find(s => s.key === key);
        
        if (existingServer && !options.force) {
          console.log(chalk.yellow(`服务器 ${key} 已经安装在 ${installPath} 中`));
          console.log(chalk.dim('提示: 使用 "--force" 选项重新安装'));
          return;
        }
        
        // 获取服务器信息
        const spinner = ora(`正在获取 ${key} 的信息...`).start();
        
        let serverInfo;
        try {
          // 获取服务器信息
          const url = options.version 
            ? `${config.registry.url}/api/v1/servers/${key}/versions/${options.version}`
            : `${config.registry.url}/api/v1/servers/${key}`;
            
          const response = await axios.get(url, {
            headers: config.registry.token 
              ? { Authorization: `Bearer ${config.registry.token}` }
              : {}
          });
          
          serverInfo = response.data;
          spinner.text = `正在安装 ${serverInfo.name || key} v${serverInfo.version}...`;
        } catch (error: any) {
          spinner.fail('获取服务器信息失败');
          
          if (error.response && error.response.status === 404) {
            console.error(chalk.red(`服务器 ${key} ${options.version ? `版本 ${options.version} ` : ''}不存在`));
          } else {
            console.error(chalk.red(error.response?.data?.error || error.message));
          }
          
          return;
        }
        
        try {
          // 安装服务器
          await installServer(serverInfo, installPath);
          
          spinner.succeed(`服务器 ${serverInfo.name || key} v${serverInfo.version} 安装成功`);
          
          // 记录下载
          await axios.post(`${config.registry.url}/api/v1/stats/download/${serverInfo.id}`, {}, {
            headers: config.registry.token 
              ? { Authorization: `Bearer ${config.registry.token}` }
              : {}
          }).catch(() => {
            // 下载计数失败不影响安装
          });
          
          // 显示使用提示
          console.log(chalk.bold('\n使用方法:'));
          
          // 显示是否有需要配置的环境变量
          const envVars = Object.entries(serverInfo.env || {});
          if (envVars.length > 0) {
            console.log(chalk.yellow('请配置以下环境变量:'));
            envVars.forEach(([key, value]) => {
              console.log(`  ${chalk.bold(key)}=${value || '<需要配置>'}`);
            });
            console.log();
          }
          
          // 显示运行命令
          if (serverInfo.command) {
            console.log(`运行命令: ${chalk.green(serverInfo.command)} ${serverInfo.args ? serverInfo.args.join(' ') : ''}`);
          }
          
          console.log(`查看详情: ${chalk.green('mcpm info')} ${key}`);
        } catch (error: any) {
          spinner.fail('安装失败');
          console.error(chalk.red(error.message));
        }
      } catch (error: any) {
        console.error(chalk.red(`安装失败: ${error.message}`));
      }
    });
} 