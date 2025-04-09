/**
 * MCPM 3.0 LlamaIndex框架适配器
 * 
 * 该适配器允许MCP工具无缝集成到LlamaIndex项目中，
 * 使LlamaIndex用户能够直接使用MCP工具作为检索、处理和生成组件。
 */

import { BaseAdapter, AdapterOptions } from './types';
import { MCPClient } from '../client';
import { MCPTool } from '../../mcp/types';

/**
 * LlamaIndex适配器选项
 */
export interface LlamaIndexAdapterOptions extends AdapterOptions {
  /** 
   * 自定义工具响应处理函数
   */
  responseHandler?: (response: any) => any;
  
  /**
   * 工具注册选项
   */
  registrationOptions?: {
    /**
     * 是否自动向LlamaIndex注册工具
     * @default true
     */
    autoRegister?: boolean;
    
    /**
     * 工具名称前缀
     * @default 'mcp'
     */
    toolNamePrefix?: string;
  };
}

/**
 * LlamaIndex框架适配器
 * 
 * 允许将MCP工具作为LlamaIndex的工具和检索器使用
 */
export class LlamaIndexAdapter implements BaseAdapter {
  /**
   * 适配器名称
   */
  public readonly name = 'llamaindex';

  /**
   * 适配器版本
   */
  public readonly version = '1.0.0';

  /**
   * LlamaIndex相关API和类型
   */
  private llamaIndex: any = null;

  /**
   * MCP客户端实例
   */
  private client: MCPClient;

  /**
   * 适配器选项
   */
  protected options: LlamaIndexAdapterOptions;

  /**
   * 已注册工具映射
   */
  protected registeredTools: Map<string, any> = new Map();

  /**
   * 调试模式
   */
  private debug: boolean;

  /**
   * 创建LlamaIndex适配器
   * @param options 适配器选项
   */
  constructor(options: LlamaIndexAdapterOptions) {
    this.options = {
      registrationOptions: {
        autoRegister: true,
        toolNamePrefix: 'mcp'
      },
      ...options
    };

    // 初始化客户端
    this.client = options.client instanceof MCPClient
      ? options.client
      : new MCPClient(options.client);

    this.debug = options.debug ?? false;
  }

  /**
   * 初始化适配器
   * 
   * 导入LlamaIndex依赖并准备适配器
   * @returns 初始化完成的适配器
   */
  async init(): Promise<void> {
    try {
      // 尝试导入LlamaIndex
      try {
        // @ts-ignore - 动态导入
        this.llamaIndex = await import('llamaindex');
      } catch (error: any) {
        throw new Error(`请安装LlamaIndex依赖: npm install llamaindex - ${error.message}`);
      }

      // 如果自动注册开启，则注册所有工具
      if (this.options.registrationOptions?.autoRegister) {
        await this.registerAllTools();
      }

      if (this.debug) {
        console.log(`[LlamaIndexAdapter] 已初始化，发现 ${this.registeredTools.size} 个工具`);
      }
    } catch (error) {
      console.error('[LlamaIndexAdapter] 初始化失败:', error);
      throw error;
    }
  }

  /**
   * 关闭适配器
   */
  async close(): Promise<void> {
    try {
      await this.client.close();
      this.registeredTools.clear();
      
      if (this.debug) {
        console.log('[LlamaIndexAdapter] 已关闭');
      }
    } catch (error) {
      console.error('[LlamaIndexAdapter] 关闭失败:', error);
      throw error;
    }
  }

  /**
   * 注册所有MCP工具到LlamaIndex
   * 
   * @returns 注册的工具数量
   */
  async registerAllTools(): Promise<number> {
    if (!this.llamaIndex) {
      throw new Error('LlamaIndex适配器尚未初始化');
    }

    try {
      // 获取所有可用工具
      const serverInfo = await this.client.connect();
      const allTools = serverInfo.tools || [];
      
      let registered = 0;
      for (const tool of allTools) {
        try {
          await this.registerTool(tool.name);
          registered++;
        } catch (error) {
          console.warn(`注册工具 ${tool.name} 失败:`, error);
        }
      }

      return registered;
    } catch (error) {
      console.error('获取工具列表失败:', error);
      return 0;
    }
  }

  /**
   * 注册单个MCP工具到LlamaIndex
   * 
   * @param toolName 工具名称
   * @returns 注册的LlamaIndex工具
   */
  async registerTool(toolName: string): Promise<any> {
    if (!this.llamaIndex) {
      throw new Error('LlamaIndex适配器尚未初始化');
    }

    // 如果已经注册过，则直接返回
    if (this.registeredTools.has(toolName)) {
      return this.registeredTools.get(toolName);
    }
    
    try {
      // 获取工具信息
      const serverInfo = await this.client.connect();
      const tools = serverInfo.tools || [];
      const toolInfo = tools.find((tool: MCPTool) => tool.name === toolName);

      if (!toolInfo) {
        throw new Error(`工具不存在: ${toolName}`);
      }

      // 创建LlamaIndex工具
      const { ToolMetadata, FunctionTool } = this.llamaIndex;
      
      const prefix = this.options.registrationOptions?.toolNamePrefix || 'mcp';
      const llamaToolName = `${prefix}_${toolName}`;
      
      // 创建工具元数据
      const metadata = new ToolMetadata({
        name: llamaToolName,
        description: toolInfo.description || `MCP tool: ${toolName}`,
        inputParams: this.convertParamsToLlamaIndexFormat(toolInfo.parameters),
      });

      // 创建函数实现
      const toolFunction = async (...args: any[]) => {
        try {
          // 转换参数从位置参数到命名参数
          const params = this.convertArgsToNamedParams(args, toolInfo.parameters);
          
          // 调用MCP工具
          const response = await this.client.callTool(toolName, params);
          
          // 处理响应
          if (this.options.responseHandler) {
            return this.options.responseHandler(response);
          }
          
          return response.data;
        } catch (error) {
          console.error(`执行工具 ${toolName} 失败:`, error);
          throw error;
        }
      };

      // 创建LlamaIndex工具
      const llamaTool = new FunctionTool(toolFunction, metadata);
      
      // 注册到工具管理器
      this.registeredTools.set(toolName, llamaTool);
      
      return llamaTool;
    } catch (error) {
      console.error(`注册工具 ${toolName} 失败:`, error);
      throw error;
    }
  }

  /**
   * 将MCP参数定义转换为LlamaIndex格式
   * 
   * @param parameters MCP参数定义
   * @returns LlamaIndex参数定义
   */
  private convertParamsToLlamaIndexFormat(parameters: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const [name, schema] of Object.entries(parameters)) {
      result[name] = {
        description: schema.description || `Parameter ${name}`,
        type: this.convertSchemaTypeToLlamaIndexType(schema.type),
        required: schema.required !== false
      };
    }
    
    return result;
  }

  /**
   * 将MCP模式类型转换为LlamaIndex类型
   * 
   * @param schemaType MCP模式类型
   * @returns LlamaIndex类型
   */
  private convertSchemaTypeToLlamaIndexType(schemaType: string): string {
    switch (schemaType) {
      case 'string':
        return 'string';
      case 'number':
      case 'integer':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'array':
        return 'array';
      case 'object':
        return 'object';
      default:
        return 'string';
    }
  }

  /**
   * 将位置参数转换为命名参数
   * 
   * @param args 位置参数
   * @param parameters 参数定义
   * @returns 命名参数
   */
  private convertArgsToNamedParams(args: any[], parameters: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
    const paramNames = Object.keys(parameters);
    
    // 映射位置参数到命名参数
    for (let i = 0; i < Math.min(args.length, paramNames.length); i++) {
      result[paramNames[i]] = args[i];
    }
    
    return result;
  }

  /**
   * 创建LlamaIndex检索器
   * 
   * @param toolName 工具名称
   * @param options 检索器选项
   * @returns LlamaIndex检索器
   */
  async createRetriever(toolName: string, options: any = {}): Promise<any> {
    if (!this.llamaIndex) {
      throw new Error('LlamaIndex适配器尚未初始化');
    }

    const { FunctionRetriever } = this.llamaIndex;
    
    // 创建检索函数
    const retrievalFunction = async (query: string) => {
      try {
        // 调用MCP工具
        const response = await this.client.callTool(toolName, { query, ...options });
        
        // 处理检索结果
        if (!response.data || !Array.isArray(response.data)) {
          return [];
        }
        
        // 转换为LlamaIndex Node格式
        const { TextNode } = this.llamaIndex;
        return response.data.map((item: any) => {
          return new TextNode({
            text: item.text || item.content || JSON.stringify(item),
            metadata: item.metadata || {}
          });
        });
      } catch (error) {
        console.error(`执行检索工具 ${toolName} 失败:`, error);
        return [];
      }
    };
    
    // 创建LlamaIndex检索器
    return new FunctionRetriever(retrievalFunction);
  }

  /**
   * 获取注册的工具
   * 
   * @param toolName 工具名称
   * @returns LlamaIndex工具或undefined
   */
  getRegisteredTool(toolName: string): any {
    return this.registeredTools.get(toolName);
  }

  /**
   * 获取所有注册的工具
   * 
   * @returns LlamaIndex工具映射
   */
  getAllRegisteredTools(): Map<string, any> {
    return this.registeredTools;
  }
} 