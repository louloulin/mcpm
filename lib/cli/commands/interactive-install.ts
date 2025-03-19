import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs';
import inquirer from 'inquirer';
import axios from 'axios';
import { getConfig } from '../utils/config';
import { installServer } from '../utils/server';

/**
 * 交互式安装命令
 */
export function interactiveInstallCommand(program: Command): void {
  program
    .command('interactive-install')
    .alias('ii')
    .description('交互式安装MCP服务器')
    .option('-p, --path <path>', '安装路径')
    .option('-g, --global', '全局安装')
    .action(async (options) => {
      const config = getConfig();
      const spinner = ora('正在从注册表获取可用服务器列表...').start();
      
      try {
        // 获取服务器列表
        const response = await axios.get(`${config.registry.url}/api/servers?limit=100&sort=downloads`);
        const servers = response.data.servers;
        
        spinner.succeed('获取服务器列表成功');
        
        if (servers.length === 0) {
          console.log(chalk.yellow('没有可用的服务器'));
          return;
        }
        
        // 准备选择列表
        const choices = servers.map((server: any) => ({
          name: `${server.name} (${server.key}) - ${server.description || '无描述'}`,
          value: server
        }));
        
        // 提示用户选择服务器
        const { selectedServer } = await inquirer.prompt([
          {
            type: 'list',
            name: 'selectedServer',
            message: '选择要安装的服务器:',
            choices,
            pageSize: 15
          }
        ]);
        
        // 获取安装路径
        let installPath = options.path;
        
        if (options.global) {
          installPath = config.servers.installPath;
        } else if (!installPath) {
          const { customPath } = await inquirer.prompt([
            {
              type: 'input',
              name: 'customPath',
              message: '请输入安装路径(留空使用当前目录):',
              default: process.cwd()
            }
          ]);
          installPath = customPath;
        }
        
        // 检查是否已安装
        const serverKey = selectedServer.key;
        const serverInstallPath = path.join(installPath, serverKey);
        
        if (fs.existsSync(serverInstallPath)) {
          const { shouldReinstall } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'shouldReinstall',
              message: `服务器 ${serverKey} 已经安装，是否重新安装?`,
              default: false
            }
          ]);
          
          if (!shouldReinstall) {
            console.log(chalk.yellow('安装已取消'));
            return;
          }
        }
        
        // 选择版本
        const { version } = await inquirer.prompt([
          {
            type: 'list',
            name: 'version',
            message: '选择要安装的版本:',
            choices: [
              { name: `最新版本 (${selectedServer.version})`, value: 'latest' },
              { name: '选择其他版本', value: 'other' }
            ]
          }
        ]);
        
        let selectedVersion = selectedServer.version;
        
        // 如果选择其他版本，获取版本列表
        if (version === 'other') {
          spinner.start('获取版本列表...');
          
          try {
            const versionResponse = await axios.get(`${config.registry.url}/api/servers/${serverKey}/versions`);
            const versions = versionResponse.data.versions;
            
            spinner.succeed('获取版本列表成功');
            
            if (versions.length === 0) {
              console.log(chalk.yellow('没有可用的版本'));
              return;
            }
            
            // 按版本号排序(新版本在前)
            versions.sort((a: any, b: any) => {
              if (a.version > b.version) return -1;
              if (a.version < b.version) return 1;
              return 0;
            });
            
            const versionChoices = versions.map((v: any) => ({
              name: `${v.version} - ${new Date(v.publishedAt).toLocaleDateString()}`,
              value: v.version
            }));
            
            const { selectedVersionFromList } = await inquirer.prompt([
              {
                type: 'list',
                name: 'selectedVersionFromList',
                message: '选择版本:',
                choices: versionChoices,
                pageSize: 10
              }
            ]);
            
            selectedVersion = selectedVersionFromList;
          } catch (error: any) {
            spinner.fail('获取版本列表失败');
            console.error(chalk.red(error.message));
            return;
          }
        }
        
        // 获取服务器详细信息(如果选择了非最新版本)
        if (version === 'other') {
          spinner.start(`获取服务器 ${serverKey}@${selectedVersion} 详细信息...`);
          
          try {
            const serverDetailResponse = await axios.get(`${config.registry.url}/api/servers/${serverKey}/versions/${selectedVersion}`);
            const serverDetail = serverDetailResponse.data;
            
            // 更新服务器信息
            selectedServer.version = selectedVersion;
            selectedServer.env = serverDetail.env || {};
            selectedServer.config = serverDetail.config || {};
            
            spinner.succeed('获取服务器详细信息成功');
          } catch (error: any) {
            spinner.fail('获取服务器详细信息失败');
            console.error(chalk.red(error.message));
            return;
          }
        }
        
        // 配置环境变量
        const envVars: Record<string, string> = {};
        
        if (selectedServer.env && Object.keys(selectedServer.env).length > 0) {
          console.log(chalk.bold('\n配置环境变量:'));
          
          for (const [key, info] of Object.entries(selectedServer.env)) {
            const envInfo = info as any;
            const { value } = await inquirer.prompt([
              {
                type: 'input',
                name: 'value',
                message: `${key}${envInfo.required ? ' (必填)' : ''}: ${envInfo.description || ''}`,
                default: envInfo.default || undefined,
                validate: (input) => {
                  if (envInfo.required && !input) {
                    return '此环境变量是必填的';
                  }
                  return true;
                }
              }
            ]);
            
            if (value) {
              envVars[key] = value;
            }
          }
        }
        
        // 确认安装
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: `确认安装 ${serverKey}@${selectedVersion} 到 ${installPath}?`,
            default: true
          }
        ]);
        
        if (!confirm) {
          console.log(chalk.yellow('安装已取消'));
          return;
        }
        
        // 安装服务器
        spinner.start(`正在安装 ${serverKey}@${selectedVersion}...`);
        
        try {
          // 创建服务器对象
          const serverObj = {
            ...selectedServer,
            version: selectedVersion,
            env: envVars
          };
          
          await installServer(serverObj, installPath);
          
          spinner.succeed(`服务器 ${serverKey}@${selectedVersion} 安装成功!`);
          
          // 显示使用说明
          console.log(chalk.bold('\n使用说明:'));
          console.log(`安装路径: ${chalk.cyan(path.join(installPath, serverKey))}`);
          
          if (Object.keys(envVars).length > 0) {
            console.log(chalk.bold('\n环境变量:'));
            
            for (const [key, value] of Object.entries(envVars)) {
              console.log(`${key}=${value}`);
            }
          }
          
          // 询问是否立即运行
          const { runNow } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'runNow',
              message: '是否立即运行服务器?',
              default: false
            }
          ]);
          
          if (runNow) {
            console.log(chalk.bold('\n运行服务器:'));
            const command = `cd "${path.join(installPath, serverKey)}" && node index.js`;
            console.log(chalk.cyan(`> ${command}`));
            
            // 这里可以添加实际运行服务器的代码
            console.log(chalk.yellow('请手动运行上述命令来启动服务器'));
          }
        } catch (error: any) {
          spinner.fail(`安装服务器失败: ${error.message}`);
        }
      } catch (error: any) {
        spinner.fail('获取服务器列表失败');
        console.error(chalk.red(error.message));
      }
    });
} 