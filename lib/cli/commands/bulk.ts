import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs';
import inquirer from 'inquirer';
import { getConfig } from '../utils/config';
import { getInstalledServers, installServer, uninstallServer } from '../utils/server';
import axios from 'axios';

/**
 * 批量操作类型
 */
enum BulkOperationType {
  INSTALL = 'install',
  UPDATE = 'update',
  UNINSTALL = 'uninstall'
}

/**
 * 服务器批量操作规范
 */
interface BulkSpec {
  // 服务器标识符列表
  servers: string[];
  // 操作类型
  operation: BulkOperationType;
  // 安装路径(可选)
  installPath?: string;
  // 版本约束(可选, 仅用于安装/更新)
  version?: Record<string, string>;
}

/**
 * 解析批量操作规范文件
 * @param filePath 规范文件路径
 */
function parseBulkSpecFile(filePath: string): BulkSpec {
  try {
    // 读取文件
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // 解析JSON
    const spec = JSON.parse(fileContent);
    
    // 验证必要字段
    if (!spec.servers || !Array.isArray(spec.servers)) {
      throw new Error('规范文件缺少"servers"数组');
    }
    
    if (!spec.operation) {
      throw new Error('规范文件缺少"operation"字段');
    }
    
    // 验证操作类型
    if (!Object.values(BulkOperationType).includes(spec.operation)) {
      throw new Error(`不支持的操作类型: ${spec.operation}`);
    }
    
    return spec;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      throw new Error(`找不到规范文件: ${filePath}`);
    }
    
    if (error instanceof SyntaxError) {
      throw new Error('规范文件不是有效的JSON格式');
    }
    
    throw error;
  }
}

/**
 * 执行批量操作
 * @param spec 批量操作规范
 * @param config 配置
 */
async function executeBulkOperation(spec: BulkSpec, config: any): Promise<void> {
  const { servers, operation } = spec;
  
  // 确定安装路径
  let installPath = spec.installPath || config.servers.installPath;
  
  // 确保安装路径存在
  if (operation !== BulkOperationType.UNINSTALL && !fs.existsSync(installPath)) {
    fs.mkdirSync(installPath, { recursive: true });
  }
  
  // 获取已安装的服务器
  const installedServers = getInstalledServers(installPath);
  const installedKeys = installedServers.map(s => s.key);
  
  // 执行操作
  const results: Record<string, { success: boolean; message: string }> = {};
  
  // 操作计数
  let successCount = 0;
  let failCount = 0;
  let skipCount = 0;
  
  for (const serverKey of servers) {
    const spinner = ora(`正在处理 ${serverKey}...`).start();
    
    try {
      switch (operation) {
        case BulkOperationType.INSTALL:
          if (installedKeys.includes(serverKey) && !spec.version?.[serverKey]) {
            spinner.info(`服务器 ${serverKey} 已安装，跳过`);
            results[serverKey] = { success: true, message: '已安装，跳过' };
            skipCount++;
            continue;
          }
          
          // 获取服务器信息
          let url = `${config.registry.url}/api/v1/servers/${serverKey}`;
          if (spec.version?.[serverKey]) {
            url = `${config.registry.url}/api/v1/servers/${serverKey}/versions/${spec.version[serverKey]}`;
          }
          
          const response = await axios.get(url, {
            headers: config.registry.token 
              ? { Authorization: `Bearer ${config.registry.token}` }
              : {}
          });
          
          const serverInfo = response.data;
          
          // 安装服务器
          await installServer(serverInfo, installPath);
          
          spinner.succeed(`服务器 ${serverKey} 安装成功`);
          results[serverKey] = { success: true, message: '安装成功' };
          successCount++;
          
          // 记录下载
          await axios.post(`${config.registry.url}/api/v1/stats/download/${serverInfo.id}`, {}, {
            headers: config.registry.token 
              ? { Authorization: `Bearer ${config.registry.token}` }
              : {}
          }).catch(() => {
            // 下载计数失败不影响安装
          });
          break;
          
        case BulkOperationType.UPDATE:
          if (!installedKeys.includes(serverKey)) {
            spinner.info(`服务器 ${serverKey} 未安装，跳过`);
            results[serverKey] = { success: true, message: '未安装，跳过' };
            skipCount++;
            continue;
          }
          
          // 获取最新或指定版本的服务器信息
          let updateUrl = `${config.registry.url}/api/v1/servers/${serverKey}`;
          if (spec.version?.[serverKey]) {
            updateUrl = `${config.registry.url}/api/v1/servers/${serverKey}/versions/${spec.version[serverKey]}`;
          }
          
          const updateResponse = await axios.get(updateUrl, {
            headers: config.registry.token 
              ? { Authorization: `Bearer ${config.registry.token}` }
              : {}
          });
          
          const updateInfo = updateResponse.data;
          
          // 检查当前安装的版本
          const currentServer = installedServers.find(s => s.key === serverKey);
          
          if (currentServer && currentServer.version === updateInfo.version) {
            spinner.info(`服务器 ${serverKey} 已是最新版本 ${updateInfo.version}，跳过`);
            results[serverKey] = { success: true, message: `已是最新版本 ${updateInfo.version}，跳过` };
            skipCount++;
            continue;
          }
          
          // 先卸载再安装
          uninstallServer(serverKey, installPath);
          await installServer(updateInfo, installPath);
          
          spinner.succeed(`服务器 ${serverKey} 更新到 ${updateInfo.version} 成功`);
          results[serverKey] = { success: true, message: `更新到 ${updateInfo.version} 成功` };
          successCount++;
          break;
          
        case BulkOperationType.UNINSTALL:
          if (!installedKeys.includes(serverKey)) {
            spinner.info(`服务器 ${serverKey} 未安装，跳过`);
            results[serverKey] = { success: true, message: '未安装，跳过' };
            skipCount++;
            continue;
          }
          
          // 卸载服务器
          uninstallServer(serverKey, installPath);
          
          spinner.succeed(`服务器 ${serverKey} 卸载成功`);
          results[serverKey] = { success: true, message: '卸载成功' };
          successCount++;
          break;
      }
    } catch (error: any) {
      spinner.fail(`服务器 ${serverKey} 操作失败`);
      results[serverKey] = { success: false, message: error.message };
      failCount++;
    }
  }
  
  // 打印结果摘要
  console.log('\n批量操作结果摘要:');
  console.log(`总操作数: ${servers.length}`);
  console.log(`成功: ${chalk.green(successCount)}`);
  console.log(`失败: ${chalk.red(failCount)}`);
  console.log(`跳过: ${chalk.yellow(skipCount)}`);
  
  // 打印详细结果
  console.log('\n详细结果:');
  for (const [serverKey, result] of Object.entries(results)) {
    const statusColor = result.success ? chalk.green : chalk.red;
    console.log(`  ${serverKey}: ${statusColor(result.message)}`);
  }
}

/**
 * 注册批量操作命令
 */
export function bulkCommand(program: Command): void {
  program
    .command('bulk')
    .description('批量执行MCP服务器操作')
    .argument('<specFile>', '批量操作规范文件路径')
    .option('-i, --interactive', '交互式确认每个操作', false)
    .action(async (specFile, options) => {
      try {
        const config = getConfig();
        
        // 解析规范文件
        const spec = parseBulkSpecFile(specFile);
        
        // 打印操作概述
        console.log(chalk.bold('批量操作概述:'));
        console.log(`操作类型: ${chalk.cyan(spec.operation)}`);
        console.log(`服务器数量: ${chalk.cyan(spec.servers.length)}`);
        
        if (spec.installPath) {
          console.log(`安装路径: ${chalk.cyan(spec.installPath)}`);
        }
        
        if (spec.version && Object.keys(spec.version).length > 0) {
          console.log(chalk.bold('\n版本约束:'));
          for (const [key, version] of Object.entries(spec.version)) {
            console.log(`  ${key}: ${chalk.cyan(version)}`);
          }
        }
        
        console.log(chalk.bold('\n服务器列表:'));
        for (const server of spec.servers) {
          console.log(`  - ${server}`);
        }
        
        // 交互式确认
        if (options.interactive) {
          let continueAll = false;
          
          for (const server of spec.servers) {
            if (continueAll) {
              continue;
            }
            
            const { action } = await inquirer.prompt([
              {
                type: 'list',
                name: 'action',
                message: `对服务器 ${server} 执行${spec.operation}操作?`,
                choices: [
                  { name: '是', value: 'yes' },
                  { name: '否', value: 'no' },
                  { name: '全部是', value: 'all' },
                  { name: '终止操作', value: 'abort' }
                ]
              }
            ]);
            
            if (action === 'no') {
              // 从列表中移除此服务器
              spec.servers = spec.servers.filter(s => s !== server);
            } else if (action === 'all') {
              continueAll = true;
            } else if (action === 'abort') {
              console.log(chalk.yellow('操作已终止'));
              return;
            }
          }
        } else {
          // 非交互式确认
          const { confirm } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: `确认执行上述批量${spec.operation}操作?`,
              default: false
            }
          ]);
          
          if (!confirm) {
            console.log(chalk.yellow('操作已终止'));
            return;
          }
        }
        
        // 执行批量操作
        await executeBulkOperation(spec, config);
      } catch (error: any) {
        console.error(chalk.red(`批量操作失败: ${error.message}`));
      }
    });
  
  // 子命令：生成规范文件模板
  program
    .command('bulk-template')
    .description('生成批量操作规范文件模板')
    .option('-o, --output <file>', '输出文件路径', 'bulk-spec.json')
    .option('-t, --type <type>', '操作类型', 'install')
    .action((options) => {
      try {
        // 验证操作类型
        if (!Object.values(BulkOperationType).includes(options.type as BulkOperationType)) {
          console.error(chalk.red(`不支持的操作类型: ${options.type}`));
          console.log(`支持的类型: ${Object.values(BulkOperationType).join(', ')}`);
          return;
        }
        
        // 创建模板
        const template: BulkSpec = {
          servers: ['server1', 'server2', 'server3'],
          operation: options.type as BulkOperationType,
          installPath: './servers',
          version: {
            server1: '1.0.0',
            server2: '2.0.0'
          }
        };
        
        // 写入文件
        fs.writeFileSync(options.output, JSON.stringify(template, null, 2));
        
        console.log(chalk.green(`批量操作规范模板已生成: ${options.output}`));
        console.log(chalk.dim('请编辑此文件以适应您的需求，然后使用 `mcpm bulk` 命令执行批量操作'));
      } catch (error: any) {
        console.error(chalk.red(`生成模板失败: ${error.message}`));
      }
    });
} 