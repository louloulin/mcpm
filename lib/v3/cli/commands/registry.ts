/**
 * MCPM 3.0 注册表命令
 * 提供注册表管理和搜索功能
 */

import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import chalk from 'chalk';
import ora from 'ora';
import { FederatedRegistry, RemoteRegistry, ServiceSearchOptions } from '../../registry';
import { MCPServerDefinition, MCPTool } from '../../../mcp/types';

// 使用类型断言处理表格库
// @ts-ignore
import Table from 'cli-table3';

// 扩展服务器定义类型
interface ExtendedServerInfo extends MCPServerDefinition {
  // 可能包含工具列表
  tools?: MCPTool[];
}

// 文件系统Promise API
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

// 配置文件路径
const CONFIG_DIR = path.join(process.env.HOME || process.env.USERPROFILE || '.', '.mcpm');
const REGISTRY_CONFIG = path.join(CONFIG_DIR, 'registries.json');

// 注册表配置
interface RegistriesConfig {
  sources: Array<{
    id: string;
    url: string;
    priority: number;
    credentials?: string;
  }>;
  default?: string;
}

/**
 * 获取注册表配置
 * @returns 注册表配置
 */
async function getRegistriesConfig(): Promise<RegistriesConfig> {
  try {
    // 确保配置目录存在
    await mkdir(CONFIG_DIR, { recursive: true });
    
    // 读取配置文件
    const configData = await readFile(REGISTRY_CONFIG, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    // 如果配置文件不存在，则返回默认配置
    return {
      sources: [
        {
          id: 'mcpm',
          url: 'https://registry.mcpm.io',
          priority: 1
        }
      ],
      default: 'mcpm'
    };
  }
}

/**
 * 保存注册表配置
 * @param config 注册表配置
 */
async function saveRegistriesConfig(config: RegistriesConfig): Promise<void> {
  // 确保配置目录存在
  await mkdir(CONFIG_DIR, { recursive: true });
  
  // 写入配置文件
  await writeFile(REGISTRY_CONFIG, JSON.stringify(config, null, 2), 'utf8');
}

/**
 * 创建联合注册表
 * @returns 联合注册表实例
 */
async function createFederatedRegistry(): Promise<FederatedRegistry> {
  // 获取配置
  const config = await getRegistriesConfig();
  
  // 创建联合注册表
  const registry = new FederatedRegistry();
  
  // 添加注册表源
  for (const source of config.sources) {
    registry.addSource(source.id, new RemoteRegistry({
      url: source.url,
      priority: source.priority,
      credentials: source.credentials
    }));
  }
  
  return registry;
}

/**
 * 添加注册表源
 * @param id 源ID
 * @param url 源URL
 * @param priority 优先级
 * @param credentials 凭据
 */
export async function addRegistrySource(
  id: string,
  url: string,
  priority: number = 100,
  credentials?: string
): Promise<void> {
  // 获取配置
  const config = await getRegistriesConfig();
  
  // 检查ID是否已存在
  const existingIndex = config.sources.findIndex(s => s.id === id);
  
  if (existingIndex >= 0) {
    // 更新现有源
    config.sources[existingIndex] = {
      id,
      url,
      priority,
      credentials
    };
    
    console.log(chalk.green(`已更新注册表源 ${id}`));
  } else {
    // 添加新源
    config.sources.push({
      id,
      url,
      priority,
      credentials
    });
    
    console.log(chalk.green(`已添加注册表源 ${id}`));
  }
  
  // 保存配置
  await saveRegistriesConfig(config);
}

/**
 * 移除注册表源
 * @param id 源ID
 */
export async function removeRegistrySource(id: string): Promise<void> {
  // 获取配置
  const config = await getRegistriesConfig();
  
  // 检查ID是否存在
  const existingIndex = config.sources.findIndex(s => s.id === id);
  
  if (existingIndex < 0) {
    console.log(chalk.yellow(`注册表源 ${id} 不存在`));
    return;
  }
  
  // 检查是否为默认源
  if (config.default === id) {
    console.log(chalk.yellow(`注册表源 ${id} 是默认源，请先设置其他默认源`));
    return;
  }
  
  // 移除源
  config.sources = config.sources.filter(s => s.id !== id);
  
  // 保存配置
  await saveRegistriesConfig(config);
  
  console.log(chalk.green(`已移除注册表源 ${id}`));
}

/**
 * 设置默认注册表源
 * @param id 源ID
 */
export async function setDefaultRegistrySource(id: string): Promise<void> {
  // 获取配置
  const config = await getRegistriesConfig();
  
  // 检查ID是否存在
  const existingIndex = config.sources.findIndex(s => s.id === id);
  
  if (existingIndex < 0) {
    console.log(chalk.yellow(`注册表源 ${id} 不存在`));
    return;
  }
  
  // 设置默认源
  config.default = id;
  
  // 保存配置
  await saveRegistriesConfig(config);
  
  console.log(chalk.green(`已将 ${id} 设为默认注册表源`));
}

/**
 * 列出所有注册表源
 */
export async function listRegistrySources(): Promise<void> {
  // 获取配置
  const config = await getRegistriesConfig();
  
  // 创建表格
  const table = new Table({
    head: ['ID', '默认', 'URL', '优先级', '状态'],
    style: { head: ['cyan'] }
  });
  
  // 添加源到表格
  for (const source of config.sources) {
    // 检查源状态
    let status = '未知';
    
    try {
      const registry = new RemoteRegistry({
        url: source.url,
        priority: source.priority,
        credentials: source.credentials,
        timeout: 3000 // 设置较短的超时时间
      });
      
      // 尝试搜索一个空结果，测试连接
      await registry.search({ limit: 1 });
      status = chalk.green('在线');
    } catch (error) {
      status = chalk.red('离线');
    }
    
    table.push([
      source.id,
      config.default === source.id ? chalk.green('✓') : '',
      source.url,
      source.priority.toString(),
      status
    ]);
  }
  
  // 输出表格
  console.log(table.toString());
}

/**
 * 搜索服务
 * @param options 搜索选项
 * @param all 是否搜索所有源
 */
export async function searchServices(
  options: ServiceSearchOptions,
  all: boolean = false
): Promise<void> {
  // 获取配置
  const config = await getRegistriesConfig();
  
  // 创建联合注册表
  const registry = await createFederatedRegistry();
  
  // 启动加载动画
  const spinner = ora('正在搜索服务...').start();
  
  try {
    // 执行搜索
    const result = await registry.search(options);
    
    // 停止加载动画
    spinner.stop();
    
    // 检查结果
    if (result.items.length === 0) {
      console.log(chalk.yellow('未找到匹配的服务'));
      return;
    }
    
    // 创建表格
    const table = new Table({
      head: ['ID', '名称', '版本', '标签', '来源'],
      style: { head: ['cyan'] }
    });
    
    // 添加结果到表格
    for (const item of result.items) {
      table.push([
        item.id,
        item.name,
        item.version,
        (item.tags || []).join(', '),
        item.source
      ]);
    }
    
    // 输出表格
    console.log(table.toString());
    console.log(`共找到 ${result.total} 个结果，显示 ${result.items.length} 个`);
  } catch (error) {
    // 停止加载动画
    spinner.stop();
    
    console.error(chalk.red('搜索失败:'), error);
  }
}

/**
 * 获取服务详情
 * @param id 服务ID
 */
export async function getServiceInfo(id: string): Promise<void> {
  // 创建联合注册表
  const registry = await createFederatedRegistry();
  
  // 启动加载动画
  const spinner = ora(`正在获取服务 ${id} 的详情...`).start();
  
  try {
    // 获取服务详情
    const service = await registry.getService(id) as ExtendedServerInfo;
    
    // 停止加载动画
    spinner.stop();
    
    // 输出详情
    console.log(chalk.cyan('服务ID:'), id);
    console.log(chalk.cyan('名称:'), service.name);
    console.log(chalk.cyan('版本:'), service.version);
    console.log(chalk.cyan('描述:'), service.description || '无');
    console.log(chalk.cyan('URL:'), service.url);
    console.log(chalk.cyan('类型:'), service.type);
    console.log(chalk.cyan('状态:'), service.status);
    
    // 输出工具信息
    console.log(chalk.cyan('\n工具:'));
    
    if (!service.tools || service.tools.length === 0) {
      console.log('无工具');
    } else {
      const toolsTable = new Table({
        head: ['名称', '描述'],
        style: { head: ['cyan'] }
      });
      
      for (const tool of service.tools) {
        toolsTable.push([
          tool.name,
          tool.description || '无描述'
        ]);
      }
      
      console.log(toolsTable.toString());
    }
  } catch (error) {
    // 停止加载动画
    spinner.stop();
    
    console.error(chalk.red('获取服务详情失败:'), error);
  }
}

/**
 * 安装服务
 * @param id 服务ID
 * @param destination 目标路径
 */
export async function installService(id: string, destination: string): Promise<void> {
  // 创建联合注册表
  const registry = await createFederatedRegistry();
  
  // 启动加载动画
  const spinner = ora(`正在安装服务 ${id}...`).start();
  
  try {
    // 安装服务
    const installedPath = await registry.install(id, destination);
    
    // 停止加载动画
    spinner.stop();
    
    console.log(chalk.green(`服务 ${id} 已安装到 ${installedPath}`));
  } catch (error) {
    // 停止加载动画
    spinner.stop();
    
    console.error(chalk.red('安装服务失败:'), error);
  }
} 