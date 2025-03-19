import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import axios from 'axios';
import { getConfig, updateConfig } from '../utils/config';
import * as readline from 'readline';
import { createInterface } from 'readline';

export function loginCommand(program: Command): void {
  program
    .command('login')
    .description('登录到MCP服务器仓库')
    .option('-u, --username <username>', '用户名')
    .option('-p, --password <password>', '密码')
    .option('-t, --token <token>', '直接使用访问令牌')
    .action(async (options) => {
      try {
        const config = getConfig();
        
        // 如果已经有令牌，询问是否重新登录
        if (config.registry.token && !options.token && !options.username) {
          console.log(chalk.yellow('您已经登录'));
          const rl = createInterface({
            input: process.stdin,
            output: process.stdout
          });
          
          const answer = await new Promise<string>((resolve) => {
            rl.question('是否重新登录？(y/N) ', resolve);
          });
          
          rl.close();
          
          if (answer.toLowerCase() !== 'y') {
            return;
          }
        }
        
        // 如果提供了令牌，则直接使用
        if (options.token) {
          await validateAndSaveToken(options.token, config);
          return;
        }
        
        // 如果没有提供用户名，则交互式输入
        let username = options.username;
        let password = options.password;
        
        if (!username) {
          username = await promptInput('用户名: ');
        }
        
        if (!password) {
          password = await promptInput('密码: ', true);
        }
        
        // 登录并获取令牌
        const spinner = ora('正在登录...').start();
        
        try {
          const response = await axios.post(`${config.registry.url}/api/v1/auth/login`, {
            username,
            password
          });
          
          const { token } = response.data;
          
          // 保存令牌
          updateConfig({
            registry: {
              token
            }
          });
          
          spinner.succeed('登录成功');
        } catch (error: any) {
          spinner.fail('登录失败');
          
          if (error.response && error.response.status === 401) {
            console.error(chalk.red('用户名或密码错误'));
          } else if (error.response && error.response.data && error.response.data.error) {
            console.error(chalk.red(`登录失败: ${error.response.data.error}`));
          } else {
            console.error(chalk.red(`登录失败: ${error.message}`));
          }
        }
      } catch (error: any) {
        console.error(chalk.red(`登录失败: ${error.message}`));
      }
    });
}

/**
 * 验证令牌并保存
 */
async function validateAndSaveToken(token: string, config: any): Promise<void> {
  const spinner = ora('正在验证令牌...').start();
  
  try {
    // 验证令牌
    await axios.get(`${config.registry.url}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // 保存令牌
    updateConfig({
      registry: {
        token
      }
    });
    
    spinner.succeed('令牌验证成功');
  } catch (error: any) {
    spinner.fail('令牌验证失败');
    
    if (error.response && error.response.status === 401) {
      console.error(chalk.red('无效的令牌'));
    } else {
      console.error(chalk.red(`验证失败: ${error.message}`));
    }
    
    throw error;
  }
}

/**
 * 提示用户输入
 */
async function promptInput(question: string, isPassword = false): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  // 密码模式处理
  if (isPassword) {
    process.stdout.write(question);
    rl.close();
    
    return new Promise((resolve) => {
      const stdin = process.stdin;
      stdin.setRawMode(true);
      stdin.resume();
      stdin.setEncoding('utf-8');
      
      let password = '';
      stdin.on('data', (key: any) => {
        const char = key.toString();
        
        // 回车键完成输入
        if (char === '\r' || char === '\n') {
          process.stdout.write('\n');
          stdin.setRawMode(false);
          stdin.pause();
          resolve(password);
          return;
        }
        
        // 退格键处理
        if (char === '\b' || char === '\x7f') {
          if (password.length > 0) {
            password = password.slice(0, -1);
            process.stdout.write('\b \b');
          }
          return;
        }
        
        // 处理 Ctrl+C
        if (char === '\u0003') {
          process.stdout.write('\n');
          process.exit();
        }
        
        password += char;
        process.stdout.write('*');
      });
    });
  }
  
  // 普通输入
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
} 