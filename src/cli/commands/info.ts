import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import axios from 'axios';
import { getConfig } from '../utils/config';
import { getInstalledServers } from '../utils/server';
import path from 'path';

export function infoCommand(program: Command): void {
  program
    .command('info')
    .description('显示MCP服务器详情')
    .argument('<key>', 'MCP服务器标识符')
    .option('-p, --path <path>', '指定本地安装路径')
    .option('-g, --global', '使用全局安装路径', false)
    .option('-r, --registry', '从仓库获取信息', false)
    .action(async (key, options) => {
      try {
        const config = getConfig();
        
        // 如果指定从仓库获取信息
        if (options.registry) {
          await showRegistryServerInfo(key, config);
          return;
        }
        
        // 确定安装路径
        let installPath = config.servers.installPath;
        if (options.path) {
          installPath = options.path;
        } else if (!options.global) {
          installPath = path.join(process.cwd(), '.mcpr', 'servers');
        }
        
        // 获取已安装的服务器
        const servers = getInstalledServers(installPath);
        
        // 查找指定的服务器
        const server = servers.find(s => s.key === key);
        
        if (!server) {
          console.log(chalk.yellow(`服务器 ${key} 未在 ${installPath} 中安装`));
          console.log(chalk.dim('提示: 使用 "--registry" 参数从仓库获取信息'));
          return;
        }
        
        // 显示本地服务器信息
        displayServerInfo(server, installPath);
      } catch (error: any) {
        console.error(chalk.red(`获取服务器信息失败: ${error.message}`));
      }
    });
}

/**
 * 从仓库获取服务器信息
 */
async function showRegistryServerInfo(key: string, config: any): Promise<void> {
  const spinner = ora(`正在获取 ${key} 的信息...`).start();
  
  try {
    // 获取服务器信息
    const response = await axios.get(`${config.registry.url}/api/v1/servers/${key}`, {
      headers: config.registry.token 
        ? { Authorization: `Bearer ${config.registry.token}` }
        : {}
    });
    
    spinner.stop();
    
    // 显示服务器信息
    displayServerInfo(response.data);
  } catch (error: any) {
    spinner.fail('获取失败');
    console.error(chalk.red(error.response?.data?.error || error.message));
  }
}

/**
 * 显示服务器信息
 */
function displayServerInfo(server: any, installPath?: string): void {
  console.log(chalk.bold('\n服务器信息:'));
  console.log(`  ${chalk.cyan('名称:')} ${server.name}`);
  console.log(`  ${chalk.cyan('标识符:')} ${server.key}`);
  console.log(`  ${chalk.cyan('版本:')} ${server.version}`);
  
  if (server.description) {
    console.log(`  ${chalk.cyan('描述:')} ${server.description}`);
  }
  
  if (server.homepage) {
    console.log(`  ${chalk.cyan('主页:')} ${server.homepage}`);
  }
  
  if (server.license) {
    console.log(`  ${chalk.cyan('许可证:')} ${server.license}`);
  }
  
  if (installPath) {
    console.log(`  ${chalk.cyan('安装路径:')} ${path.join(installPath, server.key)}`);
  }
  
  // 显示启动命令
  console.log(chalk.bold('\n启动命令:'));
  if (server.command) {
    console.log(`  ${chalk.green(server.command)} ${server.args ? server.args.join(' ') : ''}`);
  } else {
    console.log(chalk.yellow('  未指定启动命令'));
  }
  
  // 显示环境变量
  if (server.env && Object.keys(server.env).length > 0) {
    console.log(chalk.bold('\n环境变量:'));
    Object.entries(server.env).forEach(([key, value]) => {
      console.log(`  ${chalk.green(key)}=${value || '<需要配置>'}`);
    });
  }
  
  // 显示工具
  if (server.tools && server.tools.length > 0) {
    console.log(chalk.bold('\n提供的工具:'));
    server.tools.forEach((tool: any) => {
      console.log(`  ${chalk.green(tool.name)}${tool.description ? ` - ${tool.description}` : ''}`);
      
      if (tool.parameters && tool.parameters.length > 0) {
        console.log('    参数:');
        tool.parameters.forEach((param: any) => {
          console.log(`      ${chalk.yellow(param.name)} (${param.type})${param.required ? ' [必填]' : ''}`);
          if (param.description) {
            console.log(`        ${param.description}`);
          }
        });
      }
    });
  }
  
  // 显示标签
  if (server.tags && server.tags.length > 0) {
    console.log(chalk.bold('\n标签:'));
    console.log(`  ${server.tags.map((tag: string) => chalk.bgBlue.white(` ${tag} `)).join(' ')}`);
  }
  
  // 显示兼容客户端
  if (server.compatibleClients && server.compatibleClients.length > 0) {
    console.log(chalk.bold('\n兼容客户端:'));
    console.log(`  ${server.compatibleClients.join(', ')}`);
  }
  
  // 显示使用提示
  if (!installPath) {
    console.log(chalk.bold('\n安装命令:'));
    console.log(`  ${chalk.green('mcpr install')} ${server.key}`);
  }
} 