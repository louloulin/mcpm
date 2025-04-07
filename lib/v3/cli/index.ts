/**
 * MCPM 3.0 CLI实现
 * 命令行交互界面实现
 */

import { Command } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import {
  createServer,
  createClient,
  addRegistrySource,
  removeRegistrySource,
  setDefaultRegistrySource,
  listRegistrySources,
  searchServices,
  getServiceInfo,
  installService
} from './commands';

// 创建程序实例
const program = new Command();

/**
 * 初始化CLI
 */
export function initCLI(): void {
  // 设置CLI基本信息
  program
    .name('mcpm')
    .description('MCPM 3.0 CLI - Model Context Protocol包管理器')
    .version('3.0.0');
  
  // 显示标题
  console.log(
    chalk.blue(
      figlet.textSync('MCPM 3.0', {
        font: 'Standard',
        horizontalLayout: 'default',
        verticalLayout: 'default'
      })
    )
  );
  
  // 创建命令
  program
    .command('create')
    .description('创建MCP服务器或客户端')
    .option('-n, --name <name>', '项目名称')
    .option('-o, --output <dir>', '输出目录', '.')
    .option('-d, --declarative', '使用声明式API', false)
    .option('-t, --typescript', '使用TypeScript', true)
    .option('-g, --git', '初始化Git仓库', false)
    .option('-i, --install', '安装依赖', false)
    .option('-c, --client', '创建客户端而非服务器', false)
    .option('-f, --framework <framework>', '客户端框架 (langchain|mastra|chainlit)', 'mastra')
    .action(async (options) => {
      try {
        if (options.client) {
          await createClient({
            name: options.name || 'mcp-client',
            outputDir: options.output,
            typescript: options.typescript,
            git: options.git,
            install: options.install,
            framework: options.framework
          });
        } else {
          await createServer({
            name: options.name || 'mcp-server',
            outputDir: options.output,
            declarative: options.declarative,
            typescript: options.typescript,
            git: options.git,
            install: options.install
          });
        }
      } catch (error) {
        console.error(chalk.red('创建失败:'), error);
      }
    });
  
  // 注册表命令
  const registry = program
    .command('registry')
    .description('管理MCPM注册表');
  
  // 注册表列表命令
  registry
    .command('list')
    .description('列出所有注册表源')
    .action(async () => {
      try {
        await listRegistrySources();
      } catch (error) {
        console.error(chalk.red('列表获取失败:'), error);
      }
    });
  
  // 添加注册表源
  registry
    .command('add')
    .description('添加或更新注册表源')
    .argument('<id>', '注册表源ID')
    .argument('<url>', '注册表源URL')
    .option('-p, --priority <priority>', '优先级 (数字越小，优先级越高)', '100')
    .option('-c, --credentials <credentials>', '身份验证凭据')
    .action(async (id, url, options) => {
      try {
        await addRegistrySource(
          id, 
          url, 
          parseInt(options.priority, 10), 
          options.credentials
        );
      } catch (error) {
        console.error(chalk.red('添加失败:'), error);
      }
    });
  
  // 移除注册表源
  registry
    .command('remove')
    .description('移除注册表源')
    .argument('<id>', '注册表源ID')
    .action(async (id) => {
      try {
        await removeRegistrySource(id);
      } catch (error) {
        console.error(chalk.red('移除失败:'), error);
      }
    });
  
  // 设置默认注册表源
  registry
    .command('default')
    .description('设置默认注册表源')
    .argument('<id>', '注册表源ID')
    .action(async (id) => {
      try {
        await setDefaultRegistrySource(id);
      } catch (error) {
        console.error(chalk.red('设置默认源失败:'), error);
      }
    });
  
  // 搜索命令
  program
    .command('search')
    .description('搜索MCP服务')
    .argument('[query]', '搜索关键词')
    .option('-t, --tag <tags...>', '按标签筛选')
    .option('-a, --author <author>', '按作者筛选')
    .option('-c, --category <category>', '按类别筛选')
    .option('-l, --limit <limit>', '结果数量限制', '10')
    .option('--all', '搜索所有注册表源', false)
    .action(async (query, options) => {
      try {
        await searchServices({
          query,
          tags: options.tag,
          author: options.author,
          category: options.category,
          limit: parseInt(options.limit, 10)
        }, options.all);
      } catch (error) {
        console.error(chalk.red('搜索失败:'), error);
      }
    });
  
  // 查看服务信息
  program
    .command('info')
    .description('查看MCP服务详情')
    .argument('<id>', '服务ID')
    .action(async (id) => {
      try {
        await getServiceInfo(id);
      } catch (error) {
        console.error(chalk.red('获取信息失败:'), error);
      }
    });
  
  // 安装服务
  program
    .command('install')
    .description('安装MCP服务')
    .argument('<id>', '服务ID')
    .option('-d, --destination <dir>', '安装目标路径', '.')
    .action(async (id, options) => {
      try {
        await installService(id, options.destination);
      } catch (error) {
        console.error(chalk.red('安装失败:'), error);
      }
    });
  
  // 解析命令行参数
  program.parse(process.argv);
  
  // 如果没有参数，显示帮助信息
  if (process.argv.length <= 2) {
    program.help();
  }
} 