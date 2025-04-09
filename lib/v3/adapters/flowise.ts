/**
 * MCPM 3.0 Flowise框架适配器
 * 
 * 该适配器允许将MCP工具无缝集成到Flowise项目中，
 * 使Flowise用户能够直接在流程图中使用MCP工具。
 */

import { BaseAdapter, AdapterOptions } from './types';
import { MCPClient } from '../client';

/**
 * Flowise适配器选项
 */
export interface FlowiseAdapterOptions extends AdapterOptions {
  /**
   * 是否自动注册组件
   * @default true
   */
  autoRegister?: boolean;
  
  /**
   * 组件类别
   * @default 'MCP Tools'
   */
  category?: string;
  
  /**
   * 图标URL
   */
  iconUrl?: string;
}

/**
 * Flowise框架适配器
 * 
 * 允许将MCP工具作为Flowise节点使用
 */
export class FlowiseAdapter implements BaseAdapter {
  /**
   * 适配器名称
   */
  public readonly name = 'flowise';

  /**
   * 适配器版本
   */
  public readonly version = '1.0.0';

  /**
   * Flowise相关API和类型
   */
  private flowise: any = null;

  /**
   * MCP客户端实例
   */
  private client: MCPClient;

  /**
   * 适配器选项
   */
  protected options: FlowiseAdapterOptions;

  /**
   * 已注册组件映射
   */
  protected registeredComponents: Map<string, any> = new Map();

  /**
   * 调试模式
   */
  private debug: boolean;

  /**
   * 创建Flowise适配器
   * @param options 适配器选项
   */
  constructor(options: FlowiseAdapterOptions) {
    this.options = {
      autoRegister: true,
      category: 'MCP Tools',
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
   * 导入Flowise依赖并准备适配器
   */
  async init(): Promise<void> {
    try {
      // 尝试导入Flowise
      try {
        // @ts-ignore - 动态导入
        this.flowise = await import('flowise-components');
      } catch (error: any) {
        throw new Error(`请安装Flowise依赖: npm install flowise-components - ${error.message}`);
      }

      // 连接到MCP服务器
      await this.client.connect();

      // 如果自动注册开启，则注册所有工具为组件
      if (this.options.autoRegister) {
        await this.registerAllTools();
      }

      if (this.debug) {
        console.log(`[FlowiseAdapter] 已初始化，注册了 ${this.registeredComponents.size} 个组件`);
      }
    } catch (error) {
      console.error('[FlowiseAdapter] 初始化失败:', error);
      throw error;
    }
  }

  /**
   * 关闭适配器
   */
  async close(): Promise<void> {
    try {
      await this.client.close();
      this.registeredComponents.clear();
      
      if (this.debug) {
        console.log('[FlowiseAdapter] 已关闭');
      }
    } catch (error) {
      console.error('[FlowiseAdapter] 关闭失败:', error);
      throw error;
    }
  }

  /**
   * 注册所有MCP工具为Flowise组件
   * @returns 注册的组件数量
   */
  async registerAllTools(): Promise<number> {
    if (!this.flowise) {
      throw new Error('Flowise适配器尚未初始化');
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
        console.log(`[FlowiseAdapter] 已注册 ${registered} 个工具为Flowise组件`);
      }

      return registered;
    } catch (error) {
      console.error('获取工具列表失败:', error);
      return 0;
    }
  }

  /**
   * 注册单个MCP工具为Flowise组件
   * 
   * @param toolName 工具名称
   * @returns 注册的Flowise组件
   */
  async registerTool(toolName: string): Promise<any> {
    if (!this.flowise) {
      throw new Error('Flowise适配器尚未初始化');
    }

    // 如果已经注册过，则直接返回
    if (this.registeredComponents.has(toolName)) {
      return this.registeredComponents.get(toolName);
    }
    
    try {
      // 获取工具信息
      const serverInfo = await this.client.connect();
      const tools = serverInfo.tools || [];
      const toolInfo = tools.find((tool: any) => tool.name === toolName);

      if (!toolInfo) {
        throw new Error(`工具不存在: ${toolName}`);
      }

      // 创建Flowise组件类
      const componentClass = this.createFlowiseComponentClass(toolInfo);
      
      // 注册到组件管理器
      this.registeredComponents.set(toolName, componentClass);
      
      // 向Flowise注册组件
      if (this.flowise.componentRegister && typeof this.flowise.componentRegister.register === 'function') {
        this.flowise.componentRegister.register(componentClass);
        
        if (this.debug) {
          console.log(`[FlowiseAdapter] 已向Flowise注册组件: ${toolInfo.name}`);
        }
      }
      
      return componentClass;
    } catch (error) {
      console.error(`注册工具 ${toolName} 失败:`, error);
      throw error;
    }
  }

  /**
   * 创建Flowise组件类
   * 
   * @param toolInfo 工具信息
   * @returns Flowise组件类
   */
  private createFlowiseComponentClass(toolInfo: any): any {
    const { name, description, parameters } = toolInfo;
    const category = this.options.category || 'MCP Tools';
    const iconUrl = this.options.iconUrl || 'https://cdn.jsdelivr.net/gh/mcpjs/assets/logo.png';
    
    // 创建组件类
    return class MCPComponent {
      static nodeType = 'MCPComponent';
      static nodeName = name;
      static description = description || `MCP tool: ${name}`;
      static icon = iconUrl;
      static category = category;
      
      // 输入参数
      static inputs = this.convertParamsToFlowiseInputs(parameters);
      
      // 输出参数
      static outputs = [
        {
          name: 'output',
          title: '输出',
          description: '工具执行结果'
        }
      ];
      
      // 组件构造函数
      constructor() {
        this.client = this.client;
        this.toolName = name;
      }
      
      // 组件执行函数
      async run(inputs: Record<string, any>, options: any) {
        try {
          // 调用MCP工具
          const response = await this.client.callTool(this.toolName, inputs);
          
          if (!response.success) {
            throw new Error(response.error || '执行失败');
          }
          
          return {
            output: response.data
          };
        } catch (error) {
          console.error(`执行工具 ${this.toolName} 失败:`, error);
          throw error;
        }
      }
      
      // 将MCP参数转换为Flowise输入
      static convertParamsToFlowiseInputs(parameters: Record<string, any>) {
        const inputs = [];
        
        for (const [name, schema] of Object.entries(parameters)) {
          inputs.push({
            name,
            title: schema.title || name,
            description: schema.description || `参数 ${name}`,
            type: this.convertSchemaTypeToFlowiseType(schema.type),
            required: schema.required !== false,
            list: schema.type === 'array',
            default: schema.default
          });
        }
        
        return inputs;
      }
      
      // 将MCP模式类型转换为Flowise类型
      static convertSchemaTypeToFlowiseType(schemaType: string) {
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
    };
  }

  /**
   * 获取注册的组件
   * 
   * @param toolName 工具名称
   * @returns Flowise组件类或undefined
   */
  getRegisteredComponent(toolName: string): any {
    return this.registeredComponents.get(toolName);
  }

  /**
   * 获取所有注册的组件
   * 
   * @returns Flowise组件类映射
   */
  getAllRegisteredComponents(): Map<string, any> {
    return this.registeredComponents;
  }
} 