/**
 * MCPM 3.0 Semantic Kernel框架适配器
 * 
 * 该适配器允许将MCP工具无缝集成到Semantic Kernel项目中，
 * 使Semantic Kernel用户能够直接使用MCP工具作为插件和技能。
 */

import { BaseAdapter, AdapterOptions } from './types';
import { MCPClient } from '../client';

/**
 * Semantic Kernel适配器选项
 */
export interface SemanticKernelAdapterOptions extends AdapterOptions {
  /**
   * 是否自动注册插件
   * @default true
   */
  autoRegister?: boolean;
  
  /**
   * 插件名称前缀
   * @default 'MCP'
   */
  pluginNamePrefix?: string;
  
  /**
   * 技能名称
   * @default 'MCPSkill'
   */
  skillName?: string;
}

/**
 * Semantic Kernel框架适配器
 * 
 * 允许将MCP工具作为Semantic Kernel的插件和技能使用
 */
export class SemanticKernelAdapter implements BaseAdapter {
  /**
   * 适配器名称
   */
  public readonly name = 'semantickernel';

  /**
   * 适配器版本
   */
  public readonly version = '1.0.0';

  /**
   * Semantic Kernel相关API和类型
   */
  private semanticKernel: any = null;

  /**
   * MCP客户端实例
   */
  private client: MCPClient;

  /**
   * 适配器选项
   */
  protected options: SemanticKernelAdapterOptions;

  /**
   * 已注册插件映射
   */
  protected registeredPlugins: Map<string, any> = new Map();

  /**
   * 调试模式
   */
  private debug: boolean;

  /**
   * 创建Semantic Kernel适配器
   * @param options 适配器选项
   */
  constructor(options: SemanticKernelAdapterOptions) {
    this.options = {
      autoRegister: true,
      pluginNamePrefix: 'MCP',
      skillName: 'MCPSkill',
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
   * 导入Semantic Kernel依赖并准备适配器
   */
  async init(): Promise<void> {
    try {
      // 尝试导入Semantic Kernel
      try {
        // @ts-ignore - 动态导入
        this.semanticKernel = await import('semantic-kernel');
      } catch (error: any) {
        throw new Error(`请安装Semantic Kernel依赖: npm install semantic-kernel - ${error.message}`);
      }

      // 连接到MCP服务器
      await this.client.connect();

      // 如果自动注册开启，则注册所有工具为插件
      if (this.options.autoRegister) {
        await this.registerAllTools();
      }

      if (this.debug) {
        console.log(`[SemanticKernelAdapter] 已初始化，注册了 ${this.registeredPlugins.size} 个插件`);
      }
    } catch (error) {
      console.error('[SemanticKernelAdapter] 初始化失败:', error);
      throw error;
    }
  }

  /**
   * 关闭适配器
   */
  async close(): Promise<void> {
    try {
      await this.client.close();
      this.registeredPlugins.clear();
      
      if (this.debug) {
        console.log('[SemanticKernelAdapter] 已关闭');
      }
    } catch (error) {
      console.error('[SemanticKernelAdapter] 关闭失败:', error);
      throw error;
    }
  }

  /**
   * 注册所有MCP工具为Semantic Kernel插件
   * @returns 注册的插件数量
   */
  async registerAllTools(): Promise<number> {
    if (!this.semanticKernel) {
      throw new Error('Semantic Kernel适配器尚未初始化');
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
        console.log(`[SemanticKernelAdapter] 已注册 ${registered} 个工具为Semantic Kernel插件`);
      }

      return registered;
    } catch (error) {
      console.error('获取工具列表失败:', error);
      return 0;
    }
  }

  /**
   * 注册单个MCP工具为Semantic Kernel插件
   * 
   * @param toolName 工具名称
   * @returns 注册的Semantic Kernel插件
   */
  async registerTool(toolName: string): Promise<any> {
    if (!this.semanticKernel) {
      throw new Error('Semantic Kernel适配器尚未初始化');
    }

    // 如果已经注册过，则直接返回
    if (this.registeredPlugins.has(toolName)) {
      return this.registeredPlugins.get(toolName);
    }
    
    try {
      // 获取工具信息
      const serverInfo = await this.client.connect();
      const tools = serverInfo.tools || [];
      const toolInfo = tools.find((tool: any) => tool.name === toolName);

      if (!toolInfo) {
        throw new Error(`工具不存在: ${toolName}`);
      }

      // 创建Semantic Kernel插件函数
      const { KernelPlugin, KernelFunction } = this.semanticKernel;
      
      // 创建函数实现
      const functionImpl = async (context: any, ...args: any[]) => {
        try {
          // 从上下文和参数创建输入
          const inputs = this.extractInputsFromContext(context, toolInfo.parameters);
          
          // 调用MCP工具
          const response = await this.client.callTool(toolName, inputs);
          
          if (!response.success) {
            throw new Error(response.error || `执行工具 ${toolName} 失败`);
          }
          
          return response.data;
        } catch (error) {
          console.error(`执行工具 ${toolName} 失败:`, error);
          throw error;
        }
      };
      
      // 创建Semantic Kernel函数
      const skFunction = KernelFunction.fromFunction(
        functionImpl,
        toolInfo.description || `MCP tool: ${toolName}`,
        this.convertParamsToSemanticKernelParams(toolInfo.parameters)
      );
      
      // 创建插件名称
      const prefix = this.options.pluginNamePrefix || 'MCP';
      const pluginName = `${prefix}${toolName.charAt(0).toUpperCase() + toolName.slice(1)}`;
      
      // 创建插件
      const plugin = new KernelPlugin(pluginName);
      plugin.addFunction(toolName, skFunction);
      
      // 保存到映射
      this.registeredPlugins.set(toolName, plugin);
      
      if (this.debug) {
        console.log(`[SemanticKernelAdapter] 已注册插件: ${pluginName}`);
      }
      
      return plugin;
    } catch (error) {
      console.error(`注册工具 ${toolName} 失败:`, error);
      throw error;
    }
  }

  /**
   * 将MCP参数定义转换为Semantic Kernel参数定义
   * 
   * @param parameters MCP参数定义
   * @returns Semantic Kernel参数定义
   */
  private convertParamsToSemanticKernelParams(parameters: Record<string, any>): any[] {
    const params = [];
    
    for (const [name, schema] of Object.entries(parameters)) {
      params.push({
        name,
        description: schema.description || `Parameter ${name}`,
        defaultValue: schema.default,
        isRequired: schema.required !== false
      });
    }
    
    return params;
  }

  /**
   * 从上下文和变量中提取输入参数
   * 
   * @param context Semantic Kernel上下文
   * @param parameters 参数定义
   * @returns 输入参数
   */
  private extractInputsFromContext(context: any, parameters: Record<string, any>): Record<string, any> {
    const inputs: Record<string, any> = {};
    
    // 从上下文变量中提取参数
    if (context && context.variables) {
      for (const [name] of Object.entries(parameters)) {
        if (context.variables.has(name)) {
          inputs[name] = context.variables.get(name);
        }
      }
    }
    
    return inputs;
  }

  /**
   * 将所有注册的插件导入到Semantic Kernel中
   * 
   * @param kernel Semantic Kernel实例
   * @returns 已导入插件数量
   */
  async importPluginsToKernel(kernel: any): Promise<number> {
    if (!this.semanticKernel) {
      throw new Error('Semantic Kernel适配器尚未初始化');
    }
    
    if (!kernel) {
      throw new Error('未提供有效的Semantic Kernel实例');
    }
    
    let imported = 0;
    
    for (const [, plugin] of this.registeredPlugins.entries()) {
      try {
        kernel.plugins.add(plugin);
        imported++;
      } catch (error) {
        console.error('导入插件失败:', error);
      }
    }
    
    if (this.debug) {
      console.log(`[SemanticKernelAdapter] 已导入 ${imported} 个插件到Kernel`);
    }
    
    return imported;
  }

  /**
   * 创建包含所有MCP工具的技能
   * 
   * @returns Semantic Kernel技能
   */
  async createSkill(): Promise<any> {
    if (!this.semanticKernel) {
      throw new Error('Semantic Kernel适配器尚未初始化');
    }
    
    const { KernelPlugin } = this.semanticKernel;
    const skillName = this.options.skillName || 'MCPSkill';
    
    // 创建技能
    const skill = new KernelPlugin(skillName);
    
    // 获取所有工具并添加到技能
    const serverInfo = await this.client.connect();
    const allTools = serverInfo.tools || [];
    
    for (const tool of allTools) {
      try {
        const plugin = await this.registerTool(tool.name);
        const func = plugin.getFunction(tool.name);
        skill.addFunction(tool.name, func);
      } catch (error) {
        console.warn(`为技能添加工具 ${tool.name} 失败:`, error);
      }
    }
    
    if (this.debug) {
      console.log(`[SemanticKernelAdapter] 已创建技能 ${skillName} 包含 ${allTools.length} 个工具`);
    }
    
    return skill;
  }

  /**
   * 获取注册的插件
   * 
   * @param toolName 工具名称
   * @returns Semantic Kernel插件或undefined
   */
  getRegisteredPlugin(toolName: string): any {
    return this.registeredPlugins.get(toolName);
  }

  /**
   * 获取所有注册的插件
   * 
   * @returns Semantic Kernel插件映射
   */
  getAllRegisteredPlugins(): Map<string, any> {
    return this.registeredPlugins;
  }
} 