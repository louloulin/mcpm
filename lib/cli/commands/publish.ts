import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { getConfig } from '../utils/config';

export function publishCommand(program: Command): void {
  program
    .command('publish')
    .description('发布MCP服务器到仓库')
    .option('-f, --file <path>', '服务器配置文件路径')
    .option('-d, --dir <path>', '服务器目录路径')
    .option('-u, --update', '更新现有服务器', false)
    .action(async (options) => {
      try {
        const config = getConfig();
        
        // 检查是否已登录
        if (!config.registry.token) {
          console.error(chalk.red('您尚未登录，请先使用 "mcpm login" 命令登录'));
          return;
        }
        
        // 获取服务器配置
        let serverConfig: any;
        
        if (options.file) {
          // 从文件读取配置
          const filePath = path.resolve(options.file);
          if (!fs.existsSync(filePath)) {
            console.error(chalk.red(`配置文件 ${filePath} 不存在`));
            return;
          }
          
          try {
            const fileExt = path.extname(filePath).toLowerCase();
            if (fileExt === '.json') {
              serverConfig = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            } else if (fileExt === '.yaml' || fileExt === '.yml') {
              serverConfig = yaml.load(fs.readFileSync(filePath, 'utf8'));
            } else {
              console.error(chalk.red('不支持的配置文件格式，请使用 .json 或 .yaml 文件'));
              return;
            }
          } catch (error: any) {
            console.error(chalk.red(`解析配置文件失败: ${error.message}`));
            return;
          }
        } else if (options.dir) {
          // 从目录读取配置
          const dirPath = path.resolve(options.dir);
          if (!fs.existsSync(dirPath)) {
            console.error(chalk.red(`目录 ${dirPath} 不存在`));
            return;
          }
          
          const packageJsonPath = path.join(dirPath, 'package.json');
          const mcpConfigPath = path.join(dirPath, 'mcp.json');
          
          if (fs.existsSync(mcpConfigPath)) {
            try {
              serverConfig = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));
            } catch (error: any) {
              console.error(chalk.red(`解析 mcp.json 失败: ${error.message}`));
              return;
            }
          } else if (fs.existsSync(packageJsonPath)) {
            try {
              const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
              if (packageJson.mcp) {
                serverConfig = packageJson.mcp;
              } else {
                console.error(chalk.red('package.json 中没有 mcp 配置'));
                return;
              }
            } catch (error: any) {
              console.error(chalk.red(`解析 package.json 失败: ${error.message}`));
              return;
            }
          } else {
            console.error(chalk.red('在指定目录中未找到 mcp.json 或 package.json 中的 mcp 配置'));
            return;
          }
        } else {
          // 在当前目录查找配置
          const currentDir = process.cwd();
          const mcpConfigPath = path.join(currentDir, 'mcp.json');
          const packageJsonPath = path.join(currentDir, 'package.json');
          
          if (fs.existsSync(mcpConfigPath)) {
            try {
              serverConfig = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));
            } catch (error: any) {
              console.error(chalk.red(`解析 mcp.json 失败: ${error.message}`));
              return;
            }
          } else if (fs.existsSync(packageJsonPath)) {
            try {
              const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
              if (packageJson.mcp) {
                serverConfig = packageJson.mcp;
              } else {
                console.error(chalk.red('package.json 中没有 mcp 配置'));
                return;
              }
            } catch (error: any) {
              console.error(chalk.red(`解析 package.json 失败: ${error.message}`));
              return;
            }
          } else {
            console.error(chalk.red('在当前目录中未找到 mcp.json 或 package.json 中的 mcp 配置'));
            console.error(chalk.dim('提示: 使用 "--file <path>" 指定配置文件，或 "--dir <path>" 指定目录'));
            return;
          }
        }
        
        // 验证服务器配置
        if (!validateServerConfig(serverConfig)) {
          return;
        }
        
        // 发布服务器
        const spinner = ora('正在发布服务器...').start();
        
        try {
          const url = options.update
            ? `${config.registry.url}/api/v1/servers/${serverConfig.key}`
            : `${config.registry.url}/api/v1/servers`;
          
          const method = options.update ? 'put' : 'post';
          
          const response = await axios({
            method,
            url,
            data: serverConfig,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${config.registry.token}`
            }
          });
          
          spinner.succeed(`服务器 ${serverConfig.name || serverConfig.key} 发布成功`);
          
          console.log('\n服务器信息:');
          console.log(`  名称: ${chalk.cyan(response.data.name || response.data.key)}`);
          console.log(`  标识符: ${chalk.cyan(response.data.key)}`);
          console.log(`  版本: ${chalk.green(response.data.version)}`);
          console.log(`  ID: ${response.data.id}`);
          
          console.log('\n用户可以通过以下命令安装:');
          console.log(`  ${chalk.green(`mcpm install ${response.data.key}`)}`);
        } catch (error: any) {
          spinner.fail('发布失败');
          
          if (error.response && error.response.status === 401) {
            console.error(chalk.red('您没有发布权限，请确认您的账户已验证'));
          } else if (error.response && error.response.status === 409) {
            console.error(chalk.red(`服务器 ${serverConfig.key} 已存在。如需更新，请使用 "--update" 选项`));
          } else if (error.response && error.response.data && error.response.data.error) {
            console.error(chalk.red(`发布失败: ${error.response.data.error}`));
          } else {
            console.error(chalk.red(`发布失败: ${error.message}`));
          }
        }
      } catch (error: any) {
        console.error(chalk.red(`发布失败: ${error.message}`));
      }
    });
}

/**
 * 验证服务器配置
 */
function validateServerConfig(config: any): boolean {
  const errors: string[] = [];
  
  // 检查必填字段
  if (!config.key) {
    errors.push('缺少必填字段: key');
  } else if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(config.key)) {
    errors.push('key 必须以字母开头，且只能包含字母和数字');
  }
  
  if (!config.version) {
    errors.push('缺少必填字段: version');
  }
  
  if (!config.command) {
    errors.push('缺少必填字段: command');
  }
  
  // 检查数组类型
  if (config.args && !Array.isArray(config.args)) {
    errors.push('args 字段必须是数组');
  }
  
  if (config.tags && !Array.isArray(config.tags)) {
    errors.push('tags 字段必须是数组');
  }
  
  // 检查工具定义
  if (config.tools) {
    if (!Array.isArray(config.tools)) {
      errors.push('tools 字段必须是数组');
    } else {
      config.tools.forEach((tool: any, index: number) => {
        if (!tool.name) {
          errors.push(`工具 #${index + 1} 缺少必填字段: name`);
        }
        
        if (tool.parameters) {
          if (!Array.isArray(tool.parameters)) {
            errors.push(`工具 "${tool.name}" 的 parameters 字段必须是数组`);
          } else {
            tool.parameters.forEach((param: any, paramIndex: number) => {
              if (!param.name) {
                errors.push(`工具 "${tool.name}" 的参数 #${paramIndex + 1} 缺少必填字段: name`);
              }
              if (!param.type) {
                errors.push(`工具 "${tool.name}" 的参数 "${param.name || `#${paramIndex + 1}`}" 缺少必填字段: type`);
              }
            });
          }
        }
      });
    }
  }
  
  // 输出错误
  if (errors.length > 0) {
    console.error(chalk.red('配置验证失败:'));
    errors.forEach(error => {
      console.error(chalk.red(`  - ${error}`));
    });
    return false;
  }
  
  return true;
} 