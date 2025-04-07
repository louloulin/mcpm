/**
 * MCPM 3.0 Chainlit 适配器
 * 
 * 本适配器允许将 MCP 工具集成到 Chainlit 应用中，使开发者可以在 Chainlit UI 中可视化地使用和调试 MCP 服务。
 */

import { MCPClient } from '../client';
import { BaseAdapter, AdapterOptions, MCPToolWrapperOptions } from './types';

/**
 * Chainlit适配器配置选项
 */
export interface ChainlitAdapterOptions extends AdapterOptions {
  /**
   * 是否在Chainlit界面中显示工具元数据
   */
  showMetadata?: boolean;
  
  /**
   * 是否在UI中直接可见工具
   */
  displayInUI?: boolean;
  
  /**
   * 是否显示工具执行时间
   */
  measureExecutionTime?: boolean;
}

/**
 * Chainlit工具装饰选项
 */
export interface ChainlitToolOptions {
  /**
   * 工具名称
   */
  name: string;
  
  /**
   * 工具描述
   */
  description: string;
  
  /**
   * 是否显示工具元数据
   */
  showMetadata?: boolean;
  
  /**
   * 是否在UI中显示
   */
  displayInUI?: boolean;
  
  /**
   * 是否显示执行时间
   */
  measureExecutionTime?: boolean;
}

/**
 * MCPM 到 Chainlit 的适配器实现
 */
export class ChainlitAdapter implements BaseAdapter {
  /**
   * 适配器名称
   */
  public readonly name = 'chainlit';
  
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
   * 是否显示元数据
   */
  private showMetadata: boolean;
  
  /**
   * 是否在UI中显示
   */
  private displayInUI: boolean;
  
  /**
   * 是否测量执行时间
   */
  private measureExecutionTime: boolean;
  
  /**
   * 创建Chainlit适配器实例
   * @param options 适配器配置选项
   */
  constructor(options: ChainlitAdapterOptions) {
    // 初始化客户端
    this.client = options.client instanceof MCPClient
      ? options.client
      : new MCPClient(options.client);
    
    // 设置选项
    this.autoDiscoverTools = options.autoDiscoverTools ?? true;
    this.debug = options.debug ?? false;
    this.toolPrefix = options.toolPrefix ?? 'mcp:';
    this.showMetadata = options.showMetadata ?? true;
    this.displayInUI = options.displayInUI ?? true;
    this.measureExecutionTime = options.measureExecutionTime ?? true;
  }
  
  /**
   * 初始化适配器
   */
  public async init(): Promise<void> {
    try {
      // 连接到服务器并发现工具
      await this.client.connect();
      
      if (this.debug) {
        console.log(`[ChainlitAdapter] 已连接到 MCP 服务器，发现 ${Object.keys(this.client.tools).length} 个工具`);
      }
      
      // 如果启用自动发现，注册所有工具
      if (this.autoDiscoverTools) {
        // 这里我们不直接实现工具创建，因为这需要依赖 Chainlit
        // 实际使用时，用户需要通过 createTool 和 registerTool 方法手动创建和注册
        if (this.debug) {
          console.log('[ChainlitAdapter] 自动发现工具启用，但需要手动创建和注册工具');
        }
      }
    } catch (error) {
      console.error('[ChainlitAdapter] 初始化失败:', error);
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
        console.log('[ChainlitAdapter] 已关闭');
      }
    } catch (error) {
      console.error('[ChainlitAdapter] 关闭失败:', error);
      throw error;
    }
  }
  
  /**
   * 将 MCP 工具包装为 Chainlit 工具
   * @param options 工具包装选项
   * @returns Chainlit 工具包装对象
   */
  public createTool(options: MCPToolWrapperOptions & ChainlitToolOptions) {
    const {
      name = options.toolName,
      description = `MCP 工具: ${options.toolName}`,
      client = this.client,
      toolName,
      paramsMapper,
      resultMapper,
      showMetadata = this.showMetadata,
      displayInUI = this.displayInUI,
      measureExecutionTime = this.measureExecutionTime
    } = options;
    
    const toolName_display = this.toolPrefix ? `${this.toolPrefix}${name}` : name;
    
    // 创建工具对象
    const tool = {
      name: toolName_display,
      description,
      displayInUI,
      metadata: { type: 'mcp_tool', toolName },
      
      // 执行函数
      async execute(params: Record<string, any>, chainlitContext?: any) {
        try {
          // 开始时间测量
          const startTime = measureExecutionTime ? Date.now() : 0;
          
          // 应用参数映射
          const mappedParams = paramsMapper ? paramsMapper(params) : params;
          
          // 如果有 Chainlit 上下文且启用了显示元数据
          if (chainlitContext && showMetadata) {
            // 假设 chainlitContext 有一个 sendMessage 方法
            // 实际使用时需要根据 Chainlit API 调整
            if (typeof chainlitContext.sendMessage === 'function') {
              chainlitContext.sendMessage({
                content: `执行 MCP 工具: ${toolName}`,
                type: 'tool_start',
                metadata: {
                  tool: toolName_display,
                  params: mappedParams
                }
              });
            }
          }
          
          // 调用 MCP 工具
          const result = await client.callTool(toolName, mappedParams);
          
          // 应用结果映射
          const mappedResult = resultMapper ? resultMapper(result.data) : result.data;
          
          // 完成时间测量
          const executionTime = measureExecutionTime ? Date.now() - startTime : 0;
          
          // 如果有 Chainlit 上下文且启用了显示元数据
          if (chainlitContext && showMetadata) {
            if (typeof chainlitContext.sendMessage === 'function') {
              chainlitContext.sendMessage({
                content: `MCP 工具 ${toolName} 执行完成`,
                type: 'tool_end',
                metadata: {
                  tool: toolName_display,
                  result: mappedResult,
                  executionTime: executionTime ? `${executionTime}ms` : undefined
                }
              });
            }
          }
          
          return mappedResult;
        } catch (error: any) {
          console.error(`[ChainlitAdapter] 工具 ${name} 执行失败:`, error);
          
          // 如果有 Chainlit 上下文且启用了显示元数据
          if (chainlitContext && showMetadata) {
            if (typeof chainlitContext.sendMessage === 'function') {
              chainlitContext.sendMessage({
                content: `MCP 工具 ${toolName} 执行失败: ${error.message}`,
                type: 'tool_error',
                metadata: {
                  tool: toolName_display,
                  error: error.message
                }
              });
            }
          }
          
          throw error;
        }
      }
    };
    
    return tool;
  }
  
  /**
   * 将所有可用的 MCP 工具包装为 Chainlit 工具
   * @returns Chainlit 工具数组
   */
  public async createAllTools() {
    // 确保客户端已连接
    try {
      // 检查连接状态，如果客户端提供此方法
      const isConnected = typeof this.client.isConnected === 'function' 
        ? this.client.isConnected() 
        : false;
        
      if (!isConnected) {
        await this.client.connect();
      }
    } catch (error) {
      // 如果没有 isConnected 方法，可能会出错，所以我们尝试连接
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
      console.log(`[ChainlitAdapter] 已创建 ${tools.length} 个 Chainlit 工具`);
    }
    
    return tools;
  }
  
  /**
   * 注册工具到 Chainlit 环境
   * 注意：此方法需要在有 Chainlit 环境的情况下使用
   * @param tool 要注册的工具
   * @param chainlit Chainlit 实例
   */
  public registerTool(tool: any, chainlit: any) {
    try {
      // 这里的实现取决于 Chainlit 的 API
      // 由于我们没有直接依赖 Chainlit，以下是一个模板实现
      if (chainlit && typeof chainlit.register_tool === 'function') {
        chainlit.register_tool({
          name: tool.name,
          description: tool.description,
          execute: async (params: Record<string, any>) => {
            return await tool.execute(params, chainlit);
          },
          display_in_ui: tool.displayInUI
        });
        
        if (this.debug) {
          console.log(`[ChainlitAdapter] 已注册工具 ${tool.name} 到 Chainlit`);
        }
      } else {
        console.warn(`[ChainlitAdapter] 无法注册工具 ${tool.name}，Chainlit API 不可用`);
      }
    } catch (error: any) {
      console.error(`[ChainlitAdapter] 注册工具 ${tool.name} 失败:`, error.message);
      throw error;
    }
  }
} 