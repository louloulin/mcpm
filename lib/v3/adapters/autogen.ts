/**
 * MCPM 3.0 AutoGen框架适配器
 * 
 * 该适配器允许将MCP工具无缝集成到AutoGen项目中，
 * 使AutoGen用户能够直接使用MCP工具作为Agent的工具。
 */

import { BaseAdapter, AdapterOptions } from './types';
import { MCPClient } from '../client';

/**
 * AutoGen适配器选项
 */
export interface AutoGenAdapterOptions extends AdapterOptions {
  /**
   * 是否自动注册工具
   * @default true
   */
  autoRegister?: boolean;
  
  /**
   * 工具名称前缀
   * @default 'mcp_'
   */
  toolPrefix?: string;
}

/**
 * AutoGen框架适配器
 * 
 * 允许将MCP工具作为AutoGen Agent工具使用
 */
export class AutoGenAdapter implements BaseAdapter {
  /**
   * 适配器名称
   */
  public readonly name = 'autogen';

  /**
   * 适配器版本
   */
  public readonly version = '1.0.0';

  /**
   * AutoGen相关API和类型
   */
  private autogen: any = null;

  /**
   * MCP客户端实例
   */
  private client: MCPClient;

  /**
   * 适配器选项
   */
  protected options: AutoGenAdapterOptions;

  /**
   * 已注册工具映射
   */
  protected registeredTools: Map<string, any> = new Map();

  /**
   * 调试模式
   */
  private debug: boolean;

  /**
   * 创建AutoGen适配器
   * @param options 适配器选项
   */
  constructor(options: AutoGenAdapterOptions) {
    this.options = {
      autoRegister: true,
      toolPrefix: 'mcp_',
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
   * 导入AutoGen依赖并准备适配器
   */
  async init(): Promise<void> {
    try {
      // 尝试导入AutoGen
      try {
        // @ts-ignore - 动态导入
        this.autogen = await import('autogen');
      } catch (error: any) {
        throw new Error(`请安装AutoGen依赖: npm install autogen - ${error.message}`);
      }

      // 连接到MCP服务器
      await this.client.connect();

      // 如果自动注册开启，则注册所有工具
      if (this.options.autoRegister) {
        await this.registerAllTools();
      }

      if (this.debug) {
        console.log(`[AutoGenAdapter] 已初始化，注册了 ${this.registeredTools.size} 个工具`);
      }
    } catch (error) {
      console.error('[AutoGenAdapter] 初始化失败:', error);
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
        console.log('[AutoGenAdapter] 已关闭');
      }
    } catch (error) {
      console.error('[AutoGenAdapter] 关闭失败:', error);
      throw error;
    }
  }

  /**
   * 注册所有MCP工具到AutoGen
   * @returns 注册的工具数量
   */
  async registerAllTools(): Promise<number> {
    if (!this.autogen) {
      throw new Error('AutoGen适配器尚未初始化');
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

      if (this.debug) {
        console.log(`[AutoGenAdapter] 已注册 ${registered} 个工具到AutoGen`);
      }

      return registered;
    } catch (error) {
      console.error('获取工具列表失败:', error);
      return 0;
    }
  }

  /**
   * 注册单个MCP工具到AutoGen
   * 
   * @param toolName 工具名称
   * @returns 注册的AutoGen工具定义
   */
  async registerTool(toolName: string): Promise<any> {
    if (!this.autogen) {
      throw new Error('AutoGen适配器尚未初始化');
    }

    // 如果已经注册过，则直接返回
    if (this.registeredTools.has(toolName)) {
      return this.registeredTools.get(toolName);
    }
    
    try {
      // 获取工具信息
      const serverInfo = await this.client.connect();
      const tools = serverInfo.tools || [];
      const toolInfo = tools.find((tool: any) => tool.name === toolName);

      if (!toolInfo) {
        throw new Error(`工具不存在: ${toolName}`);
      }

      // 创建工具函数
      const toolFunction = async (args: Record<string, any>) => {
        try {
          // 调用MCP工具
          const response = await this.client.callTool(toolName, args);
          
          if (!response.success) {
            throw new Error(response.error || `执行工具 ${toolName} 失败`);
          }
          
          return response.data;
        } catch (error) {
          console.error(`执行工具 ${toolName} 失败:`, error);
          throw error;
        }
      };
      
      // 创建AutoGen工具定义
      const prefix = this.options.toolPrefix || 'mcp_';
      const autoGenToolName = `${prefix}${toolName}`;
      
      // 构建AutoGen工具定义
      const toolDefinition = {
        name: autoGenToolName,
        description: toolInfo.description || `MCP tool: ${toolName}`,
        parameters: this.convertParamsToAutoGenFormat(toolInfo.parameters),
        func: toolFunction
      };
      
      // 保存工具定义
      this.registeredTools.set(toolName, toolDefinition);
      
      if (this.debug) {
        console.log(`[AutoGenAdapter] 已注册AutoGen工具: ${autoGenToolName}`);
      }
      
      return toolDefinition;
    } catch (error) {
      console.error(`注册工具 ${toolName} 失败:`, error);
      throw error;
    }
  }

  /**
   * 将MCP参数定义转换为AutoGen格式
   * 
   * @param parameters MCP参数定义
   * @returns AutoGen参数定义
   */
  private convertParamsToAutoGenFormat(parameters: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {
      type: "object",
      properties: {},
      required: []
    };
    
    // 转换属性定义
    for (const [name, schema] of Object.entries(parameters)) {
      result.properties[name] = {
        description: schema.description || `Parameter ${name}`,
        type: schema.type || 'string'
      };
      
      // 如果是必需参数，添加到required数组
      if (schema.required !== false) {
        result.required.push(name);
      }
    }
    
    return result;
  }

  /**
   * 创建AutoGen代理配置
   * 
   * @param config 代理配置基础
   * @returns 增强的代理配置
   */
  createAgentConfig(config: any = {}): any {
    if (!this.autogen) {
      throw new Error('AutoGen适配器尚未初始化');
    }
    
    // 获取所有工具定义
    const tools = Array.from(this.registeredTools.values());
    
    // 增强配置
    return {
      ...config,
      tools: [...(config.tools || []), ...tools]
    };
  }

  /**
   * 获取注册的工具
   * 
   * @param toolName 工具名称
   * @returns AutoGen工具定义或undefined
   */
  getRegisteredTool(toolName: string): any {
    return this.registeredTools.get(toolName);
  }

  /**
   * 获取所有注册的工具
   * 
   * @returns AutoGen工具定义映射
   */
  getAllRegisteredTools(): Map<string, any> {
    return this.registeredTools;
  }

  /**
   * 创建一组工具，可直接用于AutoGen代理
   * 
   * @returns 可供AutoGen使用的工具数组
   */
  getToolsArray(): any[] {
    return Array.from(this.registeredTools.values());
  }
} 