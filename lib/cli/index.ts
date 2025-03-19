#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import { searchCommand } from './commands/search';
import { installCommand } from './commands/install';
import { uninstallCommand } from './commands/uninstall';
import { updateCommand } from './commands/update';
import { listCommand } from './commands/list';
import { infoCommand } from './commands/info';
import { syncCommand } from './commands/sync';
import { configCommand } from './commands/config';
import { loginCommand } from './commands/login';
import { logoutCommand } from './commands/logout';
import { publishCommand } from './commands/publish';

// 创建CLI程序
const program = new Command();

// 显示欢迎消息
console.log(
  chalk.cyan(
    figlet.textSync('MCPR CLI', { horizontalLayout: 'full' })
  )
);

// 设置程序信息
program
  .name('mcpr')
  .description('MCP服务器仓库客户端')
  .version('1.0.0');

// 注册所有命令
configCommand(program);
searchCommand(program);
infoCommand(program);
installCommand(program);
uninstallCommand(program);
updateCommand(program);
listCommand(program);
syncCommand(program);
loginCommand(program);
logoutCommand(program);
publishCommand(program);

// 添加帮助信息
program.on('--help', () => {
  console.log('');
  console.log(chalk.cyan('示例:'));
  console.log('  $ mcpr search postgres');
  console.log('  $ mcpr install Postgres');
  console.log('  $ mcpr info Postgres');
  console.log('  $ mcpr update');
  console.log('');
  console.log(chalk.cyan('文档:'));
  console.log('  https://registry.mcpr.io/docs');
});

// 解析命令行参数
program.parse(process.argv);

// 如果没有提供参数，显示帮助信息
if (!process.argv.slice(2).length) {
  program.outputHelp();
} 