/**
 * MCPM 3.0 LangChain 适配器
 * 
 * 本适配器允许将 MCP 工具集成到 LangChain 框架中，使开发者可以在 LangChain 应用中无缝使用 MCP 服务。
 */

import { MCPClient } from '../client';
import { BaseAdapter, AdapterOptions, MCPToolWrapperOptions } from './types';

/**
 * LangChain适配器配置选项
 */
export interface LangChainAdapterOptions extends AdapterOptions {
  /**
   * 是否为工具添加重试逻辑
   */
  addRetry?: boolean;
  
  /**
   * 是否将工具添加到全局工具注册表
   */
  registerGlobally?: boolean;
}

/**
 * LangChain工具装饰选项
 */
export interface LangChainToolOptions {
  /**
   * 工具名称
   */
  name: string;
  
  /**
   * 工具描述
   */
  description: string;
  
  /**
   * 是否需要添加重试逻辑
   */
  withRetry?: boolean;
}

/**
 * MCPM 到 LangChain 的适配器实现
 */
export class LangChainAdapter implements BaseAdapter {
  /**
   * 适配器名称
   */
  public readonly name = 'langchain';
  
  /**
   * 适配器版本
   */
  public readonly version = '1.0.0';
  
  /**
   * MCP 客户端实例
   */
  private client: MCPClient;
  
  /**
   * 是否自动发现工具
   */
  private autoDiscoverTools: boolean;
  
  /**
   * 调试模式
   */
  private debug: boolean;
  
  /**
   * 工具前缀
   */
  private toolPrefix: string;
  
  /**
   * 是否添加重试
   */
  private addRetry: boolean;
  
  /**
   * 是否全局注册
   */
  private registerGlobally: boolean;
  
  /**
   * 创建LangChain适配器实例
   * @param options 适配器配置选项
   */
  constructor(options: LangChainAdapterOptions) {
    // 初始化客户端
    this.client = options.client instanceof MCPClient
      ? options.client
      : new MCPClient(options.client);
    
    // 设置选项
    this.autoDiscoverTools = options.autoDiscoverTools ?? true;
    this.debug = options.debug ?? false;
    this.toolPrefix = options.toolPrefix ?? 'mcp:';
    this.addRetry = options.addRetry ?? false;
    this.registerGlobally = options.registerGlobally ?? false;
  }
  
  /**
   * 初始化适配器
   */
  public async init(): Promise<void> {
    try {
      // 连接到服务器并发现工具
      await this.client.connect();
      
      if (this.debug) {
        console.log(`[LangChainAdapter] 已连接到 MCP 服务器，发现 ${Object.keys(this.client.tools).length} 个工具`);
      }
      
      // 如果启用自动发现，创建所有工具的包装器
      if (this.autoDiscoverTools) {
        // 这里我们不直接实现工具创建，因为这需要依赖 LangChain
        // 实际使用时，用户需要通过 createTool 方法手动创建
        if (this.debug) {
          console.log('[LangChainAdapter] 自动发现工具启用，但需要手动创建工具包装器');
        }
      }
    } catch (error) {
      console.error('[LangChainAdapter] 初始化失败:', error);
      throw error;
    }
  }
  
  /**
   * 关闭适配器
   */
  public async close(): Promise<void> {
    try {
      await this.client.close();
      if (this.debug) {
        console.log('[LangChainAdapter] 已关闭');
      }
    } catch (error) {
      console.error('[LangChainAdapter] 关闭失败:', error);
      throw error;
    }
  }
  
  /**
   * 将 MCP 工具包装为 LangChain 工具
   * @param options 工具包装选项
   * @returns LangChain 工具实例
   */
  public createTool(options: MCPToolWrapperOptions & LangChainToolOptions) {
    const {
      name = options.toolName,
      description = `MCP 工具: ${options.toolName}`,
      client = this.client,
      toolName,
      paramsMapper,
      resultMapper,
      withRetry = this.addRetry
    } = options;
    
    // 这里我们返回一个符合 LangChain 工具接口的对象
    // 注意：由于我们不直接依赖 LangChain，返回的是一个通用对象，
    // 用户需要将此对象传递给 LangChain 的工具系统
    return {
      name: this.toolPrefix ? `${this.toolPrefix}${name}` : name,
      description,
      
      // 调用方法
      async _call(args: Record<string, any>) {
        try {
          // 应用参数映射
          const mappedParams = paramsMapper ? paramsMapper(args) : args;
          
          // 调用 MCP 工具
          const result = await client.callTool(toolName, mappedParams);
          
          // 应用结果映射
          return resultMapper ? resultMapper(result.data) : result.data;
        } catch (error) {
          console.error(`[LangChainAdapter] 工具 ${name} 调用失败:`, error);
          throw error;
        }
      }
    };
  }
  
  /**
   * 将所有可用的 MCP 工具包装为 LangChain 工具
   * @returns LangChain 工具数组
   */
  public async createAllTools() {
    // 确保客户端已连接
    if (!this.client.isConnected()) {
      await this.client.connect();
    }
    
    // 创建工具数组
    const tools = [];
    
    // 遍历客户端工具
    for (const toolName of Object.keys(this.client.tools)) {
      const tool = this.createTool({
        name: toolName,
        toolName,
        client: this.client,
        description: `MCP 工具: ${toolName}`
      });
      
      tools.push(tool);
    }
    
    if (this.debug) {
      console.log(`[LangChainAdapter] 已创建 ${tools.length} 个 LangChain 工具`);
    }
    
    return tools;
  }
} 