/**
 * MCPM 3.0 Mastra 适配器
 * 
 * 本适配器允许将 MCP 工具集成到 Mastra 框架中，使开发者可以在 Mastra 应用中无缝使用 MCP 服务。
 */

import { MCPClient } from '../client';
import { BaseAdapter, AdapterOptions, MCPToolWrapperOptions } from './types';

/**
 * Mastra适配器配置选项
 */
export interface MastraAdapterOptions extends AdapterOptions {
  /**
   * 工具类别
   */
  category?: string;
  
  /**
   * 是否将工具作为可调用的动作添加到Agent
   */
  asActions?: boolean;
}

/**
 * Mastra工具装饰选项
 */
export interface MastraToolOptions {
  /**
   * 工具名称
   */
  name: string;
  
  /**
   * 工具描述
   */
  description: string;
  
  /**
   * 工具类别
   */
  category?: string;
  
  /**
   * 是否作为动作添加
   */
  asAction?: boolean;
}

/**
 * MCPM 到 Mastra 的适配器实现
 */
export class MastraAdapter implements BaseAdapter {
  /**
   * 适配器名称
   */
  public readonly name = 'mastra';
  
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
   * 工具类别
   */
  private category: string;
  
  /**
   * 是否作为动作添加
   */
  private asActions: boolean;
  
  /**
   * 创建Mastra适配器实例
   * @param options 适配器配置选项
   */
  constructor(options: MastraAdapterOptions) {
    // 初始化客户端
    this.client = options.client instanceof MCPClient
      ? options.client
      : new MCPClient(options.client);
    
    // 设置选项
    this.autoDiscoverTools = options.autoDiscoverTools ?? true;
    this.debug = options.debug ?? false;
    this.toolPrefix = options.toolPrefix ?? 'mcp:';
    this.category = options.category ?? 'MCPTools';
    this.asActions = options.asActions ?? false;
  }
  
  /**
   * 初始化适配器
   */
  public async init(): Promise<void> {
    try {
      // 连接到服务器并发现工具
      await this.client.connect();
      
      if (this.debug) {
        console.log(`[MastraAdapter] 已连接到 MCP 服务器，发现 ${Object.keys(this.client.tools).length} 个工具`);
      }
      
      // 如果启用自动发现，创建所有工具的包装器
      if (this.autoDiscoverTools) {
        // 这里我们不直接实现工具创建，因为这需要依赖 Mastra
        // 实际使用时，用户需要通过 createTool 方法手动创建
        if (this.debug) {
          console.log('[MastraAdapter] 自动发现工具启用，但需要手动创建工具包装器');
        }
      }
    } catch (error) {
      console.error('[MastraAdapter] 初始化失败:', error);
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
        console.log('[MastraAdapter] 已关闭');
      }
    } catch (error) {
      console.error('[MastraAdapter] 关闭失败:', error);
      throw error;
    }
  }
  
  /**
   * 将 MCP 工具包装为 Mastra 工具
   * @param options 工具包装选项
   * @returns Mastra 工具实例
   */
  public createTool(options: MCPToolWrapperOptions & MastraToolOptions) {
    const {
      name = options.toolName,
      description = `MCP 工具: ${options.toolName}`,
      client = this.client,
      toolName,
      paramsMapper,
      resultMapper,
      category = this.category,
      asAction = this.asActions
    } = options;
    
    const toolName_display = this.toolPrefix ? `${this.toolPrefix}${name}` : name;
    
    // 这里我们返回一个符合 Mastra 工具接口的对象
    // 注意：由于我们不直接依赖 Mastra，返回的是一个通用对象，
    // 用户需要将此对象传递给 Mastra 的工具系统
    const tool = {
      name: toolName_display,
      description,
      category,
      
      // 调用方法
      async invoke(params: Record<string, any>) {
        try {
          // 应用参数映射
          const mappedParams = paramsMapper ? paramsMapper(params) : params;
          
          // 调用 MCP 工具
          const result = await client.callTool(toolName, mappedParams);
          
          // 应用结果映射
          return resultMapper ? resultMapper(result.data) : result.data;
        } catch (error) {
          console.error(`[MastraAdapter] 工具 ${name} 调用失败:`, error);
          throw error;
        }
      }
    };
    
    // 如果配置为动作，添加动作方法
    if (asAction) {
      // @ts-ignore 因为我们没有直接引入Mastra类型
      tool.runAsAction = async (agent: any, params: Record<string, any>) => {
        try {
          const result = await tool.invoke(params);
          
          return {
            result,
            metadata: {
              tool: toolName_display,
              params
            }
          };
        } catch (error) {
          return {
            error: error.message,
            metadata: {
              tool: toolName_display,
              params
            }
          };
        }
      };
    }
    
    return tool;
  }
  
  /**
   * 将所有可用的 MCP 工具包装为 Mastra 工具
   * @returns Mastra 工具数组
   */
  public async createAllTools() {
    // 确保客户端已连接
    if (!this.client.connected) {
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
      console.log(`[MastraAdapter] 已创建 ${tools.length} 个 Mastra 工具`);
    }
    
    return tools;
  }
} 