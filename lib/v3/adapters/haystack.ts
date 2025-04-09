/**
 * MCPM 3.0 Haystack框架适配器
 * 
 * 该适配器允许将MCP工具无缝集成到Haystack项目中，
 * 使开发者能够使用MCP工具作为Haystack管道的组件。
 */

import { BaseAdapter, AdapterOptions, MCPToolWrapperOptions } from './types';
import { MCPClient } from '../client';

/**
 * Haystack适配器选项
 */
export interface HaystackAdapterOptions extends AdapterOptions {
  /**
   * 是否自动将工具注册为Haystack组件
   * @default true
   */
  autoRegisterNodes?: boolean;
  
  /**
   * 默认批处理大小
   * @default 10
   */
  defaultBatchSize?: number;
}

/**
 * Haystack工具选项
 */
export interface HaystackToolOptions {
  /**
   * 节点名称
   */
  name: string;
  
  /**
   * 节点描述
   */
  description?: string;
  
  /**
   * 输入键映射
   */
  inputMapping?: Record<string, string>;
  
  /**
   * 输出键映射
   */
  outputMapping?: Record<string, string>;
  
  /**
   * 批处理大小
   */
  batchSize?: number;
}

/**
 * Haystack框架适配器
 * 
 * 允许将MCP工具作为Haystack管道的节点使用
 */
export class HaystackAdapter implements BaseAdapter {
  /**
   * 适配器名称
   */
  public readonly name = 'haystack';

  /**
   * 适配器版本
   */
  public readonly version = '1.0.0';

  /**
   * Haystack相关API和类型
   */
  private haystack: any = null;

  /**
   * MCP客户端实例
   */
  private client: MCPClient;

  /**
   * 适配器选项
   */
  protected options: HaystackAdapterOptions;

  /**
   * 已注册节点映射
   */
  protected registeredNodes: Map<string, any> = new Map();

  /**
   * 调试模式
   */
  private debug: boolean;

  /**
   * 创建Haystack适配器
   * @param options 适配器选项
   */
  constructor(options: HaystackAdapterOptions) {
    this.options = {
      autoRegisterNodes: true,
      defaultBatchSize: 10,
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
   * 导入Haystack依赖并准备适配器
   * @returns 初始化完成的适配器
   */
  async init(): Promise<void> {
    try {
      // 尝试导入Haystack
      try {
        // @ts-ignore - 动态导入
        this.haystack = await import('haystack-ai');
      } catch (error: any) {
        throw new Error(`请安装Haystack依赖: npm install haystack-ai - ${error.message}`);
      }

      // 连接到MCP服务器
      await this.client.connect();

      // 如果自动注册开启，则注册所有工具为节点
      if (this.options.autoRegisterNodes) {
        await this.registerAllTools();
      }

      if (this.debug) {
        console.log(`[HaystackAdapter] 已初始化，注册了 ${this.registeredNodes.size} 个节点`);
      }
    } catch (error) {
      console.error('[HaystackAdapter] 初始化失败:', error);
      throw error;
    }
  }

  /**
   * 关闭适配器
   */
  async close(): Promise<void> {
    try {
      await this.client.close();
      this.registeredNodes.clear();
      
      if (this.debug) {
        console.log('[HaystackAdapter] 已关闭');
      }
    } catch (error) {
      console.error('[HaystackAdapter] 关闭失败:', error);
      throw error;
    }
  }

  /**
   * 注册所有MCP工具为Haystack节点
   * @returns 注册的节点数量
   */
  async registerAllTools(): Promise<number> {
    if (!this.haystack) {
      throw new Error('Haystack适配器尚未初始化');
    }

    try {
      // 获取所有工具
      const serverInfo = await this.client.getServerInfo();
      const tools = serverInfo.tools || [];
      
      let registered = 0;
      for (const tool of tools) {
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
   * 注册单个MCP工具为Haystack节点
   * 
   * @param toolName 工具名称
   * @param options 节点选项
   * @returns 注册的Haystack节点
   */
  async registerTool(toolName: string, options: HaystackToolOptions = {}): Promise<any> {
    if (!this.haystack) {
      throw new Error('Haystack适配器尚未初始化');
    }

    // 如果已经注册过，则直接返回
    if (this.registeredNodes.has(toolName)) {
      return this.registeredNodes.get(toolName);
    }
    
    try {
      // 获取工具信息
      const serverInfo = await this.client.getServerInfo();
      const tools = serverInfo.tools || [];
      const toolInfo = tools.find(tool => tool.name === toolName);

      if (!toolInfo) {
        throw new Error(`工具不存在: ${toolName}`);
      }

      // 创建Haystack组件类
      const { component } = this.haystack;
      const nodeName = options.name || `MCP${toolName.charAt(0).toUpperCase() + toolName.slice(1)}`;
      const nodeDescription = options.description || toolInfo.description || `MCP tool: ${toolName}`;
      
      // 构建Haystack组件
      const MCPNode = component(
        // 组件定义
        {
          name: nodeName,
          description: nodeDescription,
          parameters: this.convertParamsToHaystackFormat(toolInfo.parameters),
          outputs: ["documents"]
        },
        // 组件实现
        async (params: any, state: any) => {
          try {
            // 获取输入文档
            const documents = params.documents || [];
            const batchSize = options.batchSize || this.options.defaultBatchSize || 10;
            
            // 处理批量文档
            const results = [];
            for (let i = 0; i < documents.length; i += batchSize) {
              const batch = documents.slice(i, i + batchSize);
              
              // 映射输入参数
              const toolParams: Record<string, any> = { ...params };
              if (options.inputMapping) {
                Object.entries(options.inputMapping).forEach(([haystackKey, mcpKey]) => {
                  if (params[haystackKey] !== undefined) {
                    toolParams[mcpKey] = params[haystackKey];
                    delete toolParams[haystackKey];
                  }
                });
              }
              
              // 添加批处理文档到参数
              toolParams.documents = batch;
              
              // 调用MCP工具
              const response = await this.client.callTool(toolName, toolParams);
              
              // 映射输出结果
              const processedResults = this.processToolResults(response.data, options.outputMapping);
              results.push(...processedResults);
            }
            
            return { documents: results };
          } catch (error) {
            console.error(`执行Haystack节点 ${nodeName} 失败:`, error);
            throw error;
          }
        }
      );
      
      // 注册节点
      this.registeredNodes.set(toolName, MCPNode);
      
      if (this.debug) {
        console.log(`[HaystackAdapter] 已注册Haystack节点: ${nodeName}`);
      }
      
      return MCPNode;
    } catch (error) {
      console.error(`注册工具 ${toolName} 为Haystack节点失败:`, error);
      throw error;
    }
  }

  /**
   * 将MCP参数定义转换为Haystack格式
   * 
   * @param parameters MCP参数定义
   * @returns Haystack参数定义
   */
  private convertParamsToHaystackFormat(parameters: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const [name, schema] of Object.entries(parameters)) {
      result[name] = {
        description: schema.description || `Parameter ${name}`,
        type: this.convertSchemaTypeToHaystackType(schema.type),
        required: schema.required !== false
      };
    }
    
    return result;
  }

  /**
   * 将MCP模式类型转换为Haystack类型
   * 
   * @param schemaType MCP模式类型
   * @returns Haystack类型
   */
  private convertSchemaTypeToHaystackType(schemaType: string): string {
    switch (schemaType) {
      case 'string':
        return 'str';
      case 'number':
      case 'integer':
        return 'float';
      case 'boolean':
        return 'bool';
      case 'array':
        return 'list';
      case 'object':
        return 'dict';
      default:
        return 'str';
    }
  }

  /**
   * 处理工具结果
   * 
   * @param data 工具返回数据
   * @param outputMapping 输出映射
   * @returns 处理后的数据
   */
  private processToolResults(data: any, outputMapping?: Record<string, string>): any[] {
    // 确保结果是数组
    const results = Array.isArray(data) ? data : [data];
    
    // 如果有输出映射，应用映射
    if (outputMapping) {
      return results.map(item => {
        const mapped: Record<string, any> = { ...item };
        
        Object.entries(outputMapping).forEach(([mcpKey, haystackKey]) => {
          if (item[mcpKey] !== undefined) {
            mapped[haystackKey] = item[mcpKey];
            delete mapped[mcpKey];
          }
        });
        
        return mapped;
      });
    }
    
    return results;
  }

  /**
   * 获取注册的节点
   * 
   * @param toolName 工具名称
   * @returns Haystack节点或undefined
   */
  getRegisteredNode(toolName: string): any {
    return this.registeredNodes.get(toolName);
  }

  /**
   * 获取所有注册的节点
   * 
   * @returns Haystack节点映射
   */
  getAllRegisteredNodes(): Map<string, any> {
    return this.registeredNodes;
  }
  
  /**
   * 创建Haystack管道
   * 
   * @param toolNames 要包含的工具名称数组
   * @returns Haystack管道
   */
  async createPipeline(toolNames: string[]): Promise<any> {
    if (!this.haystack) {
      throw new Error('Haystack适配器尚未初始化');
    }
    
    const { Pipeline } = this.haystack;
    
    // 确保所有工具都已注册
    for (const toolName of toolNames) {
      if (!this.registeredNodes.has(toolName)) {
        await this.registerTool(toolName);
      }
    }
    
    // 创建管道
    const pipeline = new Pipeline();
    
    // 添加节点到管道
    toolNames.forEach((toolName, index) => {
      const node = this.registeredNodes.get(toolName);
      if (!node) {
        throw new Error(`节点未注册: ${toolName}`);
      }
      
      // 添加到管道
      pipeline.add_component(`mcp_${toolName}`, node);
      
      // 如果不是第一个节点，连接到前一个节点
      if (index > 0) {
        const prevToolName = toolNames[index - 1];
        pipeline.connect(`mcp_${prevToolName}`, "documents", `mcp_${toolName}`, "documents");
      }
    });
    
    return pipeline;
  }
} 