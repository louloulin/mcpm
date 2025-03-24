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
import { initCommand } from './commands/init';
import { bulkCommand } from './commands/bulk';
import { cacheCommand } from './commands/cache';
import { interactiveInstallCommand } from './commands/interactive-install';
import { docsCommand } from './commands/docs';
import { scaffoldCommand } from './commands/scaffold';
import { deployCommand } from './commands/deploy';
import { statusCommand } from './commands/status';
import { logsCommand } from './commands/logs';
import { backupCommand } from './commands/backup';
import { restoreCommand } from './commands/restore';
import { languageCommand } from './commands/language';

// 创建CLI程序
const program = new Command();

// 显示欢迎消息
console.log(
  chalk.cyan(
    figlet.textSync('MCPM CLI', { horizontalLayout: 'full' })
  )
);

// 设置程序信息
program
  .name('mcpm')
  .description('MCP服务器仓库客户端')
  .version('1.0.0');

// 注册所有命令
configCommand(program);
searchCommand(program);
infoCommand(program);
installCommand(program);
interactiveInstallCommand(program);
uninstallCommand(program);
updateCommand(program);
listCommand(program);
syncCommand(program);
loginCommand(program);
logoutCommand(program);
publishCommand(program);
initCommand(program);
bulkCommand(program);
cacheCommand(program);
docsCommand(program);
scaffoldCommand(program);
deployCommand(program);
statusCommand(program);
logsCommand(program);
backupCommand(program);
restoreCommand(program);
languageCommand(program);

// 添加帮助信息
program.on('--help', () => {
  console.log('');
  console.log(chalk.cyan('示例:'));
  console.log('  $ mcpm search postgres');
  console.log('  $ mcpm install Postgres');
  console.log('  $ mcpm info Postgres');
  console.log('  $ mcpm update');
  console.log('  $ mcpm scaffold my-server');
  console.log('  $ mcpm deploy');
  console.log('  $ mcpm status');
  console.log('  $ mcpm logs');
  console.log('  $ mcpm backup');
  console.log('  $ mcpm restore');
  console.log('  $ mcpm language --set en');
  console.log('');
  console.log(chalk.cyan('文档:'));
  console.log('  https://registry.mcpm.io/docs');
});

// 解析命令行参数
program.parse(process.argv);

// 如果没有提供参数，显示帮助信息
if (!process.argv.slice(2).length) {
  program.outputHelp();
} 