/**
 * MCPM 3.0 框架适配器 - JavaScript兼容版本
 */

// 基础适配器接口
class BaseAdapter {
  constructor() {
    this.name = 'base';
    this.version = '1.0.0';
  }
  
  async init() {
    console.log('基础适配器初始化');
  }
  
  async close() {
    console.log('基础适配器关闭');
  }
}

// LangChain适配器
class LangChainAdapter extends BaseAdapter {
  constructor(options = {}) {
    super();
    this.name = 'langchain';
    this.client = options.client;
    this.debug = options.debug || false;
    this.toolPrefix = options.toolPrefix || 'mcp:';
    this.addRetry = options.addRetry || false;
  }
  
  async init() {
    if (this.client) {
      await this.client.connect();
    }
    if (this.debug) {
      console.log('LangChain适配器已初始化');
    }
  }
  
  async close() {
    if (this.client) {
      await this.client.close();
    }
    if (this.debug) {
      console.log('LangChain适配器已关闭');
    }
  }
  
  createTool(options) {
    const {
      name = options.toolName,
      description = `MCP 工具: ${options.toolName}`,
      toolName,
      client = this.client,
      paramsMapper,
      resultMapper
    } = options;
    
    return {
      name: this.toolPrefix ? `${this.toolPrefix}${name}` : name,
      description,
      
      async _call(args) {
        try {
          const mappedParams = paramsMapper ? paramsMapper(args) : args;
          const result = await client.callTool(toolName, mappedParams);
          return resultMapper ? resultMapper(result.data) : result.data;
        } catch (error) {
          console.error(`工具 ${name} 调用失败:`, error);
          throw error;
        }
      }
    };
  }
  
  async createAllTools() {
    const tools = [];
    if (this.client) {
      for (const toolName of Object.keys(this.client.tools || {})) {
        tools.push(this.createTool({
          name: toolName,
          toolName,
          client: this.client,
          description: `MCP 工具: ${toolName}`
        }));
      }
    }
    return tools;
  }
}

// Mastra适配器
class MastraAdapter extends BaseAdapter {
  constructor(options = {}) {
    super();
    this.name = 'mastra';
    this.client = options.client;
    this.debug = options.debug || false;
    this.toolPrefix = options.toolPrefix || 'mcp:';
    this.category = options.category || 'MCPTools';
    this.asActions = options.asActions || false;
  }
  
  async init() {
    if (this.client) {
      await this.client.connect();
    }
    if (this.debug) {
      console.log('Mastra适配器已初始化');
    }
  }
  
  async close() {
    if (this.client) {
      await this.client.close();
    }
    if (this.debug) {
      console.log('Mastra适配器已关闭');
    }
  }
  
  createTool(options) {
    const {
      name = options.toolName,
      description = `MCP 工具: ${options.toolName}`,
      toolName,
      client = this.client,
      paramsMapper,
      resultMapper,
      category = this.category,
      asAction = this.asActions
    } = options;
    
    const toolName_display = this.toolPrefix ? `${this.toolPrefix}${name}` : name;
    
    const tool = {
      name: toolName_display,
      description,
      category,
      
      async invoke(params) {
        try {
          const mappedParams = paramsMapper ? paramsMapper(params) : params;
          const result = await client.callTool(toolName, mappedParams);
          return resultMapper ? resultMapper(result.data) : result.data;
        } catch (error) {
          console.error(`工具 ${name} 调用失败:`, error);
          throw error;
        }
      }
    };
    
    if (asAction) {
      tool.runAsAction = async (agent, params) => {
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
  
  async createAllTools() {
    const tools = [];
    if (this.client) {
      for (const toolName of Object.keys(this.client.tools || {})) {
        tools.push(this.createTool({
          name: toolName,
          toolName,
          client: this.client,
          description: `MCP 工具: ${toolName}`
        }));
      }
    }
    return tools;
  }
}

// Chainlit适配器
class ChainlitAdapter extends BaseAdapter {
  constructor(options = {}) {
    super();
    this.name = 'chainlit';
    this.client = options.client;
    this.debug = options.debug || false;
    this.toolPrefix = options.toolPrefix || 'mcp:';
    this.showMetadata = options.showMetadata !== false;
    this.displayInUI = options.displayInUI !== false;
    this.measureExecutionTime = options.measureExecutionTime !== false;
  }
  
  async init() {
    if (this.client) {
      await this.client.connect();
    }
    if (this.debug) {
      console.log('Chainlit适配器已初始化');
    }
  }
  
  async close() {
    if (this.client) {
      await this.client.close();
    }
    if (this.debug) {
      console.log('Chainlit适配器已关闭');
    }
  }
  
  createTool(options) {
    const {
      name = options.toolName,
      description = `MCP 工具: ${options.toolName}`,
      toolName,
      client = this.client,
      paramsMapper,
      resultMapper,
      showMetadata = this.showMetadata,
      displayInUI = this.displayInUI,
      measureExecutionTime = this.measureExecutionTime
    } = options;
    
    const toolName_display = this.toolPrefix ? `${this.toolPrefix}${name}` : name;
    
    return {
      name: toolName_display,
      description,
      displayInUI,
      metadata: { type: 'mcp_tool', toolName },
      
      async execute(params, chainlitContext) {
        try {
          const startTime = measureExecutionTime ? Date.now() : 0;
          const mappedParams = paramsMapper ? paramsMapper(params) : params;
          
          if (chainlitContext && showMetadata && typeof chainlitContext.sendMessage === 'function') {
            chainlitContext.sendMessage({
              content: `执行 MCP 工具: ${toolName}`,
              type: 'tool_start',
              metadata: {
                tool: toolName_display,
                params: mappedParams
              }
            });
          }
          
          const result = await client.callTool(toolName, mappedParams);
          const mappedResult = resultMapper ? resultMapper(result.data) : result.data;
          
          const executionTime = measureExecutionTime ? Date.now() - startTime : 0;
          
          if (chainlitContext && showMetadata && typeof chainlitContext.sendMessage === 'function') {
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
          
          return mappedResult;
        } catch (error) {
          console.error(`工具 ${name} 执行失败:`, error);
          
          if (chainlitContext && showMetadata && typeof chainlitContext.sendMessage === 'function') {
            chainlitContext.sendMessage({
              content: `MCP 工具 ${toolName} 执行失败: ${error.message || '未知错误'}`,
              type: 'tool_error',
              metadata: {
                tool: toolName_display,
                error: error.message || '未知错误'
              }
            });
          }
          
          throw error;
        }
      }
    };
  }
  
  async createAllTools() {
    const tools = [];
    if (this.client) {
      for (const toolName of Object.keys(this.client.tools || {})) {
        tools.push(this.createTool({
          name: toolName,
          toolName,
          client: this.client,
          description: `MCP 工具: ${toolName}`
        }));
      }
    }
    return tools;
  }
  
  registerTool(tool, chainlit) {
    try {
      if (chainlit && typeof chainlit.register_tool === 'function') {
        chainlit.register_tool({
          name: tool.name,
          description: tool.description,
          execute: async (params) => {
            return await tool.execute(params, chainlit);
          },
          display_in_ui: tool.displayInUI
        });
        
        if (this.debug) {
          console.log(`已注册工具 ${tool.name} 到 Chainlit`);
        }
      } else {
        console.warn(`无法注册工具 ${tool.name}，Chainlit API 不可用`);
      }
    } catch (error) {
      console.error(`注册工具 ${tool.name} 失败:`, error);
      throw error;
    }
  }
}

// 工厂函数
function createAdapter(framework, options = {}) {
  switch (framework) {
    case 'langchain':
      return new LangChainAdapter(options);
    case 'mastra':
      return new MastraAdapter(options);
    case 'chainlit':
      return new ChainlitAdapter(options);
    default:
      throw new Error(`不支持的框架类型: ${framework}`);
  }
}

// 导出
module.exports = {
  BaseAdapter,
  LangChainAdapter,
  MastraAdapter,
  ChainlitAdapter,
  createAdapter
}; 