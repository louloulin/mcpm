# 创建自定义适配器

除了内置的LangChain、Mastra和Chainlit适配器外，MCPM 3.0还提供了扩展机制，允许开发者为其他AI框架创建自定义适配器。本指南将介绍如何构建自定义适配器。

## 基础知识

所有MCPM适配器都遵循相同的基本结构，需要实现`BaseAdapter`接口：

```typescript
interface BaseAdapter {
  // 适配器名称
  name: string;
  
  // 适配器版本
  version: string;
  
  // 初始化适配器
  init(options?: Record<string, any>): Promise<void>;
  
  // 关闭适配器释放资源
  close(): Promise<void>;
}
```

## 创建自定义适配器

### 步骤1: 创建适配器类

首先，创建一个新的JavaScript或TypeScript文件，例如`my-framework-adapter.js`，实现`BaseAdapter`接口：

```javascript
const { MCPClient } = require('mcpm').v3;

class MyFrameworkAdapter {
  /**
   * 适配器名称
   */
  name = 'my-framework';
  
  /**
   * 适配器版本
   */
  version = '1.0.0';
  
  /**
   * 创建适配器实例
   * @param {Object} options 适配器选项
   */
  constructor(options = {}) {
    // 初始化客户端
    this.client = options.client instanceof MCPClient
      ? options.client
      : new MCPClient(options.client);
    
    // 设置选项
    this.debug = options.debug ?? false;
    this.toolPrefix = options.toolPrefix ?? 'mcp:';
    
    // 框架特定选项
    this.frameworkOption1 = options.frameworkOption1;
    this.frameworkOption2 = options.frameworkOption2;
  }
  
  /**
   * 初始化适配器
   */
  async init() {
    try {
      // 连接到服务器并发现工具
      await this.client.connect();
      
      if (this.debug) {
        console.log(`[MyFrameworkAdapter] 已连接到MCP服务器，发现 ${Object.keys(this.client.tools).length} 个工具`);
      }
      
      // 框架特定初始化逻辑
      // ...
      
    } catch (error) {
      console.error('[MyFrameworkAdapter] 初始化失败:', error);
      throw error;
    }
  }
  
  /**
   * 关闭适配器
   */
  async close() {
    try {
      await this.client.close();
      
      if (this.debug) {
        console.log('[MyFrameworkAdapter] 已关闭');
      }
      
      // 框架特定清理逻辑
      // ...
      
    } catch (error) {
      console.error('[MyFrameworkAdapter] 关闭失败:', error);
      throw error;
    }
  }
}

module.exports = MyFrameworkAdapter;
```

### 步骤2: 实现工具包装逻辑

接下来，添加工具包装逻辑，将MCP工具转换为您的框架可识别的格式：

```javascript
/**
 * 创建工具包装器
 * @param {Object} options 工具选项
 * @returns {Object} 框架特定的工具对象
 */
createTool(options) {
  const {
    name = options.toolName,
    description = `MCP 工具: ${options.toolName}`,
    toolName,
    client = this.client,
    paramsMapper,
    resultMapper
  } = options;
  
  // 创建符合您框架格式的工具对象
  const tool = {
    name: this.toolPrefix ? `${this.toolPrefix}${name}` : name,
    description,
    
    // 框架特定的属性
    type: 'mcp_tool',
    
    // 框架特定的调用方法
    async call(params) {
      try {
        // 参数映射
        const mappedParams = paramsMapper ? paramsMapper(params) : params;
        
        // 调用MCP工具
        const result = await client.callTool(toolName, mappedParams);
        
        // 结果映射
        return resultMapper ? resultMapper(result.data) : result.data;
      } catch (error) {
        console.error(`[MyFrameworkAdapter] 工具 ${name} 调用失败:`, error);
        throw error;
      }
    }
  };
  
  // 添加框架特定的方法或属性
  tool.frameworkSpecificMethod = function() {
    // 实现逻辑
  };
  
  return tool;
}

/**
 * 创建所有可用工具的包装器
 * @returns {Array} 工具数组
 */
async createAllTools() {
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
    console.log(`[MyFrameworkAdapter] 已创建 ${tools.length} 个工具`);
  }
  
  return tools;
}
```

### 步骤3: 添加框架特定功能

根据您的框架特点，添加特定的功能：

```javascript
/**
 * 将工具注册到框架的全局注册表
 * @param {Object} tool 工具对象
 */
registerToolToFramework(tool) {
  // 假设您的框架有一个全局工具注册表
  if (global.MyFramework && global.MyFramework.registerTool) {
    global.MyFramework.registerTool(tool);
    
    if (this.debug) {
      console.log(`[MyFrameworkAdapter] 已将工具 ${tool.name} 注册到框架`);
    }
  }
}

/**
 * 框架特定的配置方法
 * @param {Object} config 配置选项
 */
configureFramework(config) {
  // 实现特定于框架的配置逻辑
  if (this.debug) {
    console.log('[MyFrameworkAdapter] 框架配置已应用');
  }
}
```

## 注册自定义适配器

创建完适配器后，您可以将其添加到MCPM的适配器注册表中：

```javascript
const { v3 } = require('mcpm');
const MyFrameworkAdapter = require('./my-framework-adapter');

// 扩展适配器注册表
v3.adapters.MyFrameworkAdapter = MyFrameworkAdapter;

// 扩展createAdapter工厂函数
const originalCreateAdapter = v3.adapters.createAdapter;
v3.adapters.createAdapter = function(framework, options) {
  if (framework === 'my-framework') {
    return new MyFrameworkAdapter(options);
  }
  return originalCreateAdapter(framework, options);
};
```

## 完整示例

下面是一个完整的自定义适配器示例，用于集成MCP工具到假设的"AI-Framework"：

```javascript
/**
 * MCPM 3.0 AI-Framework 适配器
 * 
 * 本适配器允许将 MCP 工具集成到 AI-Framework 中
 */

const { MCPClient } = require('mcpm').v3;

/**
 * AI-Framework适配器配置选项
 */
class AIFrameworkAdapter {
  /**
   * 适配器名称
   */
  name = 'ai-framework';
  
  /**
   * 适配器版本
   */
  version = '1.0.0';
  
  /**
   * 创建适配器实例
   * @param {Object} options 适配器选项
   */
  constructor(options = {}) {
    // 初始化客户端
    this.client = options.client instanceof MCPClient
      ? options.client
      : new MCPClient(options.client);
    
    // 设置选项
    this.debug = options.debug ?? false;
    this.toolPrefix = options.toolPrefix ?? 'mcp:';
    this.useCache = options.useCache ?? true;
    this.timeout = options.timeout ?? 30000;
  }
  
  /**
   * 初始化适配器
   */
  async init() {
    try {
      // 连接到服务器并发现工具
      await this.client.connect();
      
      if (this.debug) {
        console.log(`[AIFrameworkAdapter] 已连接到MCP服务器，发现 ${Object.keys(this.client.tools).length} 个工具`);
      }
      
      // 初始化AI-Framework集成
      this.initFrameworkIntegration();
      
    } catch (error) {
      console.error('[AIFrameworkAdapter] 初始化失败:', error);
      throw error;
    }
  }
  
  /**
   * 初始化框架集成
   * @private
   */
  initFrameworkIntegration() {
    // 假设 AI-Framework 有一个全局配置对象
    if (global.AIFramework) {
      global.AIFramework.config.tools = {
        mcp: {
          enabled: true,
          prefix: this.toolPrefix,
          timeout: this.timeout
        }
      };
      
      if (this.debug) {
        console.log('[AIFrameworkAdapter] 已配置 AI-Framework 集成');
      }
    }
  }
  
  /**
   * 关闭适配器
   */
  async close() {
    try {
      await this.client.close();
      
      // 清理 AI-Framework 集成
      if (global.AIFramework) {
        global.AIFramework.config.tools.mcp.enabled = false;
      }
      
      if (this.debug) {
        console.log('[AIFrameworkAdapter] 已关闭');
      }
    } catch (error) {
      console.error('[AIFrameworkAdapter] 关闭失败:', error);
      throw error;
    }
  }
  
  /**
   * 创建工具包装器
   * @param {Object} options 工具选项
   * @returns {Object} AI-Framework工具对象
   */
  createTool(options) {
    const {
      name = options.toolName,
      description = `MCP 工具: ${options.toolName}`,
      toolName,
      client = this.client,
      paramsMapper,
      resultMapper
    } = options;
    
    // 创建 AI-Framework 工具对象
    const tool = {
      name: this.toolPrefix ? `${this.toolPrefix}${name}` : name,
      description,
      type: 'external',
      provider: 'mcp',
      
      // AI-Framework 的调用方法
      async process(input, context) {
        try {
          // 开始计时（用于调试）
          const startTime = Date.now();
          
          // 应用参数映射
          const params = paramsMapper ? paramsMapper(input) : input;
          
          // 添加上下文信息（如果 AI-Framework 需要）
          if (context) {
            params._context = context.id;
          }
          
          // 调用 MCP 工具
          const result = await client.callTool(toolName, params);
          
          // 结束计时
          const endTime = Date.now();
          
          // 应用结果映射
          const mappedResult = resultMapper ? resultMapper(result.data) : result.data;
          
          // 添加元数据（如果 AI-Framework 支持）
          if (this.debug) {
            mappedResult._meta = {
              executionTime: endTime - startTime,
              tool: toolName,
              timestamp: new Date().toISOString()
            };
          }
          
          return mappedResult;
          
        } catch (error) {
          console.error(`[AIFrameworkAdapter] 工具 ${name} 处理失败:`, error);
          
          // 返回符合 AI-Framework 错误格式的对象
          return {
            error: true,
            message: error.message,
            code: error.code || 'UNKNOWN_ERROR'
          };
        }
      }
    };
    
    // 添加 AI-Framework 特定方法
    tool.validate = function(input) {
      // 实现输入验证逻辑
      return { valid: true };
    };
    
    return tool;
  }
  
  /**
   * 创建所有可用工具的包装器
   * @returns {Array} AI-Framework工具数组
   */
  async createAllTools() {
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
      console.log(`[AIFrameworkAdapter] 已创建 ${tools.length} 个 AI-Framework 工具`);
    }
    
    return tools;
  }
  
  /**
   * 注册工具到 AI-Framework
   * @param {Object} tool 工具对象
   */
  registerTool(tool) {
    // 假设 AI-Framework 有一个工具注册API
    if (global.AIFramework && global.AIFramework.Tools) {
      global.AIFramework.Tools.register(tool);
      
      if (this.debug) {
        console.log(`[AIFrameworkAdapter] 已注册工具 ${tool.name} 到 AI-Framework`);
      }
    } else {
      console.warn(`[AIFrameworkAdapter] 无法注册工具，AI-Framework API不可用`);
    }
  }
  
  /**
   * 批量注册所有工具
   * @param {Array} tools 工具数组
   */
  registerAllTools(tools) {
    for (const tool of tools) {
      this.registerTool(tool);
    }
  }
}

module.exports = AIFrameworkAdapter;
```

## 适配器最佳实践

创建自定义适配器时，请遵循以下最佳实践：

1. **遵循BaseAdapter接口**：确保实现所有必需的方法。
2. **提供详细的调试信息**：使用调试选项输出有用的日志信息。
3. **提供参数映射**：使用`paramsMapper`和`resultMapper`使MCP工具更好地与框架集成。
4. **正确处理错误**：捕获并处理所有可能的错误情况。
5. **提供清理机制**：在`close()`方法中释放所有资源。
6. **编写详细文档**：为您的适配器提供清晰的文档和示例。

## 发布适配器

创建完成后，您可以将适配器发布为独立的npm包：

```bash
# 初始化包
npm init

# 添加依赖
npm install --save mcpm@3

# 发布到npm
npm publish
```

您的适配器包名可以遵循如下命名模式：`mcpm-framework-adapter`，例如：`mcpm-ai-framework-adapter`。

## 贡献到MCPM

如果您创建了高质量的适配器，欢迎将其贡献到MCPM官方存储库：

1. Fork MCPM仓库
2. 将您的适配器添加到`lib/v3/adapters/`目录
3. 更新`lib/v3/adapters/index.js`以包含您的适配器
4. 添加适当的测试和文档
5. 提交Pull Request

通过共享您的适配器，您将帮助扩展MCPM生态系统，使更多开发者受益！ 