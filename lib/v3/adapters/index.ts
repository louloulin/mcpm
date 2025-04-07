/**
 * MCPM 3.0 框架适配器
 * 
 * 本模块提供了各种框架的适配器，使MCP服务能够轻松集成到不同的AI框架中
 */

// 导出所有适配器
export * from './types';
export * from './langchain';
export * from './mastra';
export * from './chainlit';

// 导入类型
import { MCPClient } from '../client';
import { AdapterOptions, BaseAdapter } from './types';
import { LangChainAdapter, LangChainAdapterOptions } from './langchain';
import { MastraAdapter, MastraAdapterOptions } from './mastra';
import { ChainlitAdapter, ChainlitAdapterOptions } from './chainlit';

/**
 * 支持的框架类型
 */
export type FrameworkType = 'langchain' | 'mastra' | 'chainlit';

/**
 * 适配器工厂函数，根据框架类型创建对应的适配器
 * @param framework 框架类型
 * @param options 适配器选项
 * @returns 适配器实例
 */
export function createAdapter(
  framework: 'langchain', 
  options: LangChainAdapterOptions
): LangChainAdapter;
export function createAdapter(
  framework: 'mastra', 
  options: MastraAdapterOptions
): MastraAdapter;
export function createAdapter(
  framework: 'chainlit', 
  options: ChainlitAdapterOptions
): ChainlitAdapter;
export function createAdapter(
  framework: FrameworkType,
  options: AdapterOptions
): BaseAdapter;
export function createAdapter(
  framework: FrameworkType,
  options: AdapterOptions
): BaseAdapter {
  switch (framework) {
    case 'langchain':
      return new LangChainAdapter(options as LangChainAdapterOptions);
    case 'mastra':
      return new MastraAdapter(options as MastraAdapterOptions);
    case 'chainlit':
      return new ChainlitAdapter(options as ChainlitAdapterOptions);
    default:
      throw new Error(`不支持的框架类型: ${framework}`);
  }
}

/**
 * 获取适配器类，用于直接实例化
 * @param framework 框架类型
 * @returns 适配器类
 */
export function getAdapterClass(framework: 'langchain'): typeof LangChainAdapter;
export function getAdapterClass(framework: 'mastra'): typeof MastraAdapter;
export function getAdapterClass(framework: 'chainlit'): typeof ChainlitAdapter;
export function getAdapterClass(framework: FrameworkType): any {
  switch (framework) {
    case 'langchain':
      return LangChainAdapter;
    case 'mastra':
      return MastraAdapter;
    case 'chainlit':
      return ChainlitAdapter;
    default:
      throw new Error(`不支持的框架类型: ${framework}`);
  }
}

/**
 * 检测可用的框架
 * 自动检测当前环境中安装的框架
 * @returns 可用框架列表
 */
export async function detectAvailableFrameworks(): Promise<FrameworkType[]> {
  const available: FrameworkType[] = [];
  
  // 尝试导入各个框架，检测是否可用
  try {
    // 检测 langchain
    try {
      // 这里使用动态导入，防止直接依赖
      await import('langchain');
      available.push('langchain');
    } catch (error) {
      // 不可用，忽略
    }
    
    // 检测 mastra
    try {
      await import('@mastra/core');
      available.push('mastra');
    } catch (error) {
      // 不可用，忽略
    }
    
    // 检测 chainlit
    try {
      await import('chainlit');
      available.push('chainlit');
    } catch (error) {
      // 不可用，忽略
    }
  } catch (error) {
    console.warn('检测可用框架时出错:', error);
  }
  
  return available;
}

/**
 * 通用集成函数，自动检测并集成到可用的框架
 * @param client MCP客户端或选项
 * @returns 已创建的适配器映射
 */
export async function integrateWithFrameworks(
  client: MCPClient | Record<string, any>
): Promise<Record<FrameworkType, BaseAdapter>> {
  const availableFrameworks = await detectAvailableFrameworks();
  const adapters: Record<string, BaseAdapter> = {};
  
  for (const framework of availableFrameworks) {
    try {
      const adapter = createAdapter(framework, { client });
      await adapter.init();
      adapters[framework] = adapter;
      
      console.log(`MCPM 已成功集成到 ${framework} 框架`);
    } catch (error) {
      console.error(`集成到 ${framework} 框架失败:`, error);
    }
  }
  
  return adapters as Record<FrameworkType, BaseAdapter>;
} 