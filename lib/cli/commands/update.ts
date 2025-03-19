import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import axios from 'axios';
import path from 'path';
import { getConfig } from '../utils/config';
import { getInstalledServers, installServer, uninstallServer } from '../utils/server';

export function updateCommand(program: Command): void {
  program
    .command('update')
    .description('更新MCP服务器')
    .argument('[key]', 'MCP服务器标识符，不指定则更新所有')
    .option('-p, --path <path>', '指定安装路径')
    .option('-g, --global', '全局安装路径', false)
    .option('-f, --force', '强制更新即使版本相同', false)
    .action(async (key, options) => {
      const config = getConfig();
      
      // 确定安装路径
      let installPath = config.servers.installPath;
      if (options.path) {
        installPath = options.path;
      } else if (!options.global) {
        installPath = path.join(process.cwd(), '.mcpr', 'servers');
      }
      
      // 获取已安装的服务器
      const installedServers = getInstalledServers(installPath);
      
      if (installedServers.length === 0) {
        console.log(chalk.yellow(`在 ${installPath} 中未找到已安装的服务器`));
        return;
      }
      
      // 如果指定了服务器标识符
      if (key) {
        const server = installedServers.find(s => s.key === key);
        if (!server) {
          console.log(chalk.yellow(`服务器 ${key} 未在 ${installPath} 中安装`));
          return;
        }
        
        await updateServer(server, installPath, config, options.force);
      } else {
        // 更新所有服务器
        console.log(chalk.cyan(`正在检查 ${installedServers.length} 个服务器的更新...`));
        
        for (const server of installedServers) {
          await updateServer(server, installPath, config, options.force);
        }
        
        console.log(chalk.green('所有服务器更新检查完成'));
      }
    });
}

/**
 * 更新单个服务器
 */
async function updateServer(server: any, installPath: string, config: any, force: boolean): Promise<void> {
  const spinner = ora(`正在检查 ${server.name || server.key} 的更新...`).start();
  
  try {
    // 获取最新服务器信息
    const response = await axios.get(`${config.registry.url}/api/v1/servers/${server.key}`, {
      headers: config.registry.token 
        ? { Authorization: `Bearer ${config.registry.token}` }
        : {}
    });
    
    const latestServer = response.data;
    
    // 检查版本
    if (latestServer.version === server.version && !force) {
      spinner.succeed(`${server.name || server.key} 已是最新版本 (${server.version})`);
      return;
    }
    
    // 有更新或强制更新
    spinner.text = `正在更新 ${server.name || server.key} 从 ${server.version} 到 ${latestServer.version}...`;
    
    // 卸载旧版本
    uninstallServer(server.key, installPath);
    
    // 安装新版本
    await installServer(latestServer, installPath);
    
    spinner.succeed(`${server.name || server.key} 已更新到版本 ${latestServer.version}`);
    
    // 记录下载
    await axios.post(`${config.registry.url}/api/v1/stats/download/${latestServer.id}`, {}, {
      headers: config.registry.token 
        ? { Authorization: `Bearer ${config.registry.token}` }
        : {}
    });
  } catch (error: any) {
    spinner.fail(`更新 ${server.name || server.key} 失败`);
    console.error(chalk.red(error.response?.data?.error || error.message));
  }
} 