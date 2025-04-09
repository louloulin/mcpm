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
export * from './llamaindex';
export * from './haystack';
export * from './flowise';
export * from './autogen';
export * from './semantickernel';

// 导入类型
import { MCPClient } from '../client';
import { AdapterOptions, BaseAdapter } from './types';
import { LangChainAdapter, LangChainAdapterOptions } from './langchain';
import { MastraAdapter, MastraAdapterOptions } from './mastra';
import { ChainlitAdapter, ChainlitAdapterOptions } from './chainlit';
import { LlamaIndexAdapter, LlamaIndexAdapterOptions } from './llamaindex';
import { HaystackAdapter, HaystackAdapterOptions } from './haystack';
import { FlowiseAdapter, FlowiseAdapterOptions } from './flowise';
import { AutoGenAdapter, AutoGenAdapterOptions } from './autogen';
import { SemanticKernelAdapter, SemanticKernelAdapterOptions } from './semantickernel';

/**
 * 支持的框架类型
 */
export type FrameworkType = 
  | 'langchain' 
  | 'mastra' 
  | 'chainlit' 
  | 'llamaindex' 
  | 'haystack' 
  | 'flowise' 
  | 'autogen' 
  | 'semantickernel';

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
  framework: 'llamaindex', 
  options: LlamaIndexAdapterOptions
): LlamaIndexAdapter;
export function createAdapter(
  framework: 'haystack', 
  options: HaystackAdapterOptions
): HaystackAdapter;
export function createAdapter(
  framework: 'flowise', 
  options: FlowiseAdapterOptions
): FlowiseAdapter;
export function createAdapter(
  framework: 'autogen', 
  options: AutoGenAdapterOptions
): AutoGenAdapter;
export function createAdapter(
  framework: 'semantickernel', 
  options: SemanticKernelAdapterOptions
): SemanticKernelAdapter;
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
    case 'llamaindex':
      return new LlamaIndexAdapter(options as LlamaIndexAdapterOptions);
    case 'haystack':
      return new HaystackAdapter(options as HaystackAdapterOptions);
    case 'flowise':
      return new FlowiseAdapter(options as FlowiseAdapterOptions);
    case 'autogen':
      return new AutoGenAdapter(options as AutoGenAdapterOptions);
    case 'semantickernel':
      return new SemanticKernelAdapter(options as SemanticKernelAdapterOptions);
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
export function getAdapterClass(framework: 'llamaindex'): typeof LlamaIndexAdapter;
export function getAdapterClass(framework: 'haystack'): typeof HaystackAdapter;
export function getAdapterClass(framework: 'flowise'): typeof FlowiseAdapter;
export function getAdapterClass(framework: 'autogen'): typeof AutoGenAdapter;
export function getAdapterClass(framework: 'semantickernel'): typeof SemanticKernelAdapter;
export function getAdapterClass(framework: FrameworkType): any {
  switch (framework) {
    case 'langchain':
      return LangChainAdapter;
    case 'mastra':
      return MastraAdapter;
    case 'chainlit':
      return ChainlitAdapter;
    case 'llamaindex':
      return LlamaIndexAdapter;
    case 'haystack':
      return HaystackAdapter;
    case 'flowise':
      return FlowiseAdapter;
    case 'autogen':
      return AutoGenAdapter;
    case 'semantickernel':
      return SemanticKernelAdapter;
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
    
    // 检测 llamaindex
    try {
      await import('llamaindex');
      available.push('llamaindex');
    } catch (error) {
      // 不可用，忽略
    }
    
    // 检测 haystack
    try {
      await import('haystack-ai');
      available.push('haystack');
    } catch (error) {
      // 不可用，忽略
    }
    
    // 检测 flowise
    try {
      await import('flowise-components');
      available.push('flowise');
    } catch (error) {
      // 不可用，忽略
    }
    
    // 检测 autogen
    try {
      await import('autogen');
      available.push('autogen');
    } catch (error) {
      // 不可用，忽略
    }
    
    // 检测 semantickernel
    try {
      await import('semantic-kernel');
      available.push('semantickernel');
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