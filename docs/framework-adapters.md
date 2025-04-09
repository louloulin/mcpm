# MCPM 3.0 框架适配器

MCPM 3.0 提供了强大的框架适配器系统，使开发者能够轻松地将MCP工具集成到各种AI框架中。本文档详细介绍了适配器系统的设计、使用方法以及支持的框架。

## 概述

框架适配器系统是MCPM 3.0的核心特性之一，它解决了MCP工具与流行AI框架集成的挑战。通过适配器，开发者可以：

- 在熟悉的框架中无缝使用MCP工具
- 避免编写重复的集成代码
- 享受统一的API体验
- 自动处理参数转换和结果格式化

## 支持的框架

目前，MCPM 3.0支持以下框架的适配器：

1. **LangChain** - 将MCP工具作为LangChain的Tool或Agent使用
2. **Mastra** - 在Mastra平台中注册和使用MCP工具
3. **Chainlit** - 在Chainlit聊天应用中集成MCP工具
4. **LlamaIndex** - 作为LlamaIndex的工具和检索器使用MCP工具
5. **Haystack** - 在Haystack管道中使用MCP工具作为节点
6. **Flowise** - 在Flowise流程图中使用MCP工具作为组件
7. **AutoGen** - 将MCP工具注册为AutoGen的工具函数
8. **Semantic Kernel** - 作为Semantic Kernel的插件和技能使用MCP工具

## 基本使用

### 创建适配器

使用适配器的基本模式如下：

```javascript
// 导入所需模块
const { createAdapter } = require('mcpm/v3/adapters');
const { MCPClient } = require('mcpm/v3/client');

// 创建MCP客户端
const client = new MCPClient({
  server: 'https://your-mcp-server.com'
});

// 创建适配器
const adapter = createAdapter('langchain', { client });

// 初始化适配器
await adapter.init();

// 使用适配器...
// (具体使用方法因框架而异)

// 关闭适配器
await adapter.close();
```

你也可以使用特定的适配器类直接创建:

```javascript
const { LangChainAdapter } = require('mcpm/v3/adapters');

const adapter = new LangChainAdapter({
  client,
  // 适配器特定选项...
});
```

### 自动检测和集成

MCPM提供了自动检测并集成到所有可用框架的功能:

```javascript
const { integrateWithFrameworks } = require('mcpm/v3/adapters');

// 自动集成到所有可用框架
const adapters = await integrateWithFrameworks({
  server: 'https://your-mcp-server.com'
});

// 使用特定框架的适配器
const langchainAdapter = adapters.langchain;
const mastraAdapter = adapters.mastra;
// ...
```

## 各框架适配器使用示例

### LangChain

```javascript
const { LangChainAdapter } = require('mcpm/v3/adapters');
const { ChatOpenAI } = require('langchain/chat_models/openai');
const { AgentExecutor, createReactAgent } = require('langchain/agents');

// 创建适配器
const adapter = new LangChainAdapter({
  client,
  toolPrefix: 'mcp_'
});
await adapter.init();

// 获取LangChain工具
const tools = await adapter.createAllTools();

// 创建LangChain代理
const model = new ChatOpenAI({ temperature: 0 });
const agent = createReactAgent(model, tools);
const executor = AgentExecutor.fromAgentAndTools({
  agent,
  tools
});

// 执行代理
const result = await executor.run("分析以下文本的情感: '这是一个令人激动的消息!'");
console.log(result);
```

### LlamaIndex

```javascript
const { LlamaIndexAdapter } = require('mcpm/v3/adapters');
const { VectorStoreIndex, Document } = require('llamaindex');

// 创建适配器
const adapter = new LlamaIndexAdapter({
  client,
  registrationOptions: {
    autoRegister: true,
    toolNamePrefix: 'mcp'
  }
});
await adapter.init();

// 获取LlamaIndex工具
const textAnalyzerTool = await adapter.getRegisteredTool('textAnalyzer');

// 创建检索器
const retriever = await adapter.createRetriever('documentSearch');

// 使用检索器创建索引
const documents = [
  new Document({ text: "这是第一个文档" }),
  new Document({ text: "这是第二个文档" })
];
const index = await VectorStoreIndex.fromDocuments(documents);

// 使用索引和工具查询
const queryEngine = index.asQueryEngine({ 
  retriever,
  additionalTools: [textAnalyzerTool]
});
const response = await queryEngine.query("查找关于文档的信息");
```

### Haystack

```javascript
const { HaystackAdapter } = require('mcpm/v3/adapters');
const { Pipeline } = require('haystack-ai');

// 创建适配器
const adapter = new HaystackAdapter({
  client,
  autoRegisterNodes: true
});
await adapter.init();

// 注册特定工具
const textAnalyzerNode = await adapter.registerTool('textAnalyzer', {
  name: 'MCPTextAnalyzer',
  inputMapping: {
    content: 'text' // 将Haystack的content参数映射到MCP的text参数
  }
});

// 创建管道
const pipeline = await adapter.createPipeline(['textAnalyzer', 'imageGenerator']);

// 运行管道
const result = await pipeline.run({
  documents: [{ content: "这是一段需要分析的文本" }]
});
```

### AutoGen

```javascript
const { AutoGenAdapter } = require('mcpm/v3/adapters');
const { Agent, AgentBuilder } = require('autogen');

// 创建适配器
const adapter = new AutoGenAdapter({
  client,
  autoRegister: true,
  toolPrefix: 'mcp_'
});
await adapter.init();

// 获取所有工具
const tools = adapter.getToolsArray();

// 创建增强的代理配置
const config = adapter.createAgentConfig({
  name: "MCPAssistant",
  description: "一个使用MCP工具的助手",
  llm: {
    model: "gpt-4"
  }
});

// 创建代理
const agent = new Agent(config);

// 使用代理
const response = await agent.chat("分析以下文本的情感: '这是一个令人激动的消息!'");
```

### Semantic Kernel

```javascript
const { SemanticKernelAdapter } = require('mcpm/v3/adapters');
const { Kernel } = require('semantic-kernel');

// 创建适配器
const adapter = new SemanticKernelAdapter({
  client,
  autoRegister: true,
  pluginNamePrefix: 'MCP'
});
await adapter.init();

// 创建Semantic Kernel实例
const kernel = new Kernel();

// 导入所有插件
await adapter.importPluginsToKernel(kernel);

// 或者创建单个技能
const skill = await adapter.createSkill();
kernel.plugins.add(skill);

// 使用插件
const result = await kernel.invoke('MCPTextAnalyzer', 'textAnalyzer', {
  text: "这是一段需要分析的文本"
});
```

## 高级功能

### 参数映射

大多数适配器支持参数映射，允许开发者在框架参数和MCP工具参数之间建立映射关系:

```javascript
const tool = adapter.createTool({
  toolName: 'textAnalyzer',
  paramsMapper: (params) => {
    // 转换参数
    return {
      text: params.content,
      options: {
        language: params.lang || 'zh',
        ...params.options
      }
    };
  },
  resultMapper: (result) => {
    // 转换结果
    return {
      sentiment: result.sentiment,
      entities: result.entities,
      language: result.detectedLanguage
    };
  }
});
```

### 批处理支持

部分适配器(如Haystack)支持批量处理:

```javascript
const node = await adapter.registerTool('textAnalyzer', {
  batchSize: 10, // 一次处理10个文档
  // ...
});
```

### 自定义响应处理

适配器通常允许自定义响应处理函数:

```javascript
const adapter = new LlamaIndexAdapter({
  client,
  responseHandler: (response) => {
    // 自定义响应处理逻辑
    return {
      processed: true,
      data: response.data,
      // ...
    };
  }
});
```

## 创建自定义适配器

如果需要创建自定义适配器，可以实现`BaseAdapter`接口:

```javascript
const { BaseAdapter } = require('mcpm/v3/adapters');

class CustomFrameworkAdapter implements BaseAdapter {
  public readonly name = 'customframework';
  public readonly version = '1.0.0';
  
  constructor(options) {
    // 初始化适配器
  }
  
  async init() {
    // 初始化逻辑
  }
  
  async close() {
    // 关闭资源
  }
  
  // 自定义方法...
}
```

## 最佳实践

1. **使用自动发现** - 尽可能使用适配器的自动发现功能，让适配器自动注册所有可用工具。

2. **错误处理** - 适当处理工具调用错误，提供优雅的错误处理机制。

3. **参数映射** - 当框架参数与MCP工具参数不匹配时，使用参数映射功能。

4. **资源管理** - 使用完适配器后调用`close()`方法释放资源。

5. **类型转换** - 注意不同框架的类型转换规则，确保数据类型正确映射。

## 常见问题

### 适配器初始化失败

如果适配器初始化失败，通常是因为:

1. 相关框架未安装 - 请安装相应的框架依赖
2. MCP服务器不可达 - 检查服务器URL和凭据
3. 版本不兼容 - 确保框架版本与适配器兼容

### 工具不可用

如果特定工具不可用，可能是因为:

1. 工具名称错误 - 检查工具名称拼写
2. 服务器未提供该工具 - 确认服务器是否提供此工具
3. 权限问题 - 检查是否有调用该工具的权限

### 参数类型错误

如果遇到参数类型错误，可以:

1. 使用参数映射器转换参数类型
2. 确保传递正确的参数类型
3. 检查工具的参数定义

## 结论

MCPM 3.0的框架适配器系统提供了一种强大的方式，使开发者能够在各种AI框架中无缝使用MCP工具。通过统一的接口和自动转换机制，适配器系统大大降低了集成的复杂度，让开发者能够专注于业务逻辑而非集成细节。

随着AI框架生态系统的不断发展，我们将持续扩展适配器系统，支持更多框架和功能。 