# LangChain适配器

LangChain适配器允许您在LangChain应用中无缝使用MCP工具。通过这个适配器，您可以将MCP工具转换为LangChain工具，并在Agent和Chain中轻松使用。

## 安装

确保已安装MCPM 3.0：

```bash
npm install mcpm@3
```

如果您要在LangChain项目中使用，还需安装LangChain：

```bash
npm install langchain
```

## 基本用法

### 创建适配器

```javascript
const { v3 } = require('mcpm');
const { LangChainAdapter } = v3.adapters;

// 创建适配器实例
const adapter = new LangChainAdapter({
  // MCP客户端配置
  client: {
    server: 'http://localhost:3100',
    autoDiscovery: true
  },
  // 适配器选项
  debug: true,               // 启用调试日志
  toolPrefix: 'mcp_',        // 工具名称前缀
  addRetry: true,            // 添加重试逻辑
  registerGlobally: false    // 是否全局注册工具
});

// 初始化适配器
await adapter.init();
```

### 创建单个工具

```javascript
const textAnalysisTool = adapter.createTool({
  name: 'text_analysis',      // 自定义工具名称
  toolName: 'textAnalysis',   // MCP工具名称
  description: '分析文本内容，提取情感、关键词和统计信息',
  
  // 可选：参数映射函数
  paramsMapper: (params) => ({
    text: params.content || params.text,
    language: params.language || 'en'
  }),
  
  // 可选：结果映射函数
  resultMapper: (result) => ({
    sentiment: result.sentiment?.label || 'neutral',
    keywords: result.keywords || [],
    wordCount: result.statistics?.wordCount
  })
});

// 使用工具
const result = await textAnalysisTool._call({
  content: "LangChain是一个强大的框架，帮助开发者构建基于大型语言模型的应用。",
  language: "zh"
});

console.log(result);
```

### 创建所有工具

```javascript
// 创建所有可用MCP工具的LangChain工具包装器
const tools = await adapter.createAllTools();

// 在LangChain中使用这些工具
console.log(`已创建 ${tools.length} 个LangChain工具`);
```

### 在LangChain Agent中使用

```javascript
import { initializeAgentExecutorWithOptions } from "langchain/agents";
import { ChatOpenAI } from "langchain/chat_models/openai";

// 创建LLM
const model = new ChatOpenAI({
  modelName: "gpt-4",
  temperature: 0
});

// 创建Agent
const executor = await initializeAgentExecutorWithOptions(
  tools,  // MCP工具
  model,
  {
    agentType: "chat-conversational-react-description",
    verbose: true
  }
);

// 执行Agent
const result = await executor.invoke({
  input: "分析这段文本的情感: '我非常喜欢这款产品，质量很好，价格合理。'",
});

console.log(result.output);
```

## 配置选项

LangChain适配器支持以下配置选项：

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| client | MCPClient \| Object | 必填 | MCP客户端实例或配置选项 |
| autoDiscoverTools | boolean | true | 是否自动发现并包装所有工具 |
| debug | boolean | false | 是否启用调试日志 |
| toolPrefix | string | 'mcp:' | 工具名称前缀 |
| addRetry | boolean | false | 是否为工具添加重试逻辑 |
| registerGlobally | boolean | false | 是否将工具添加到LangChain全局工具注册表 |

## 工具创建选项

在创建单个工具时，支持以下选项：

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| name | string | toolName | 工具名称 |
| toolName | string | 必填 | MCP工具名称 |
| description | string | `MCP 工具: ${toolName}` | 工具描述 |
| client | MCPClient | 适配器的client | MCP客户端实例 |
| paramsMapper | Function | identity | 参数映射函数 |
| resultMapper | Function | identity | 结果映射函数 |
| withRetry | boolean | addRetry | 是否添加重试逻辑 |

## 完整示例

以下是将MCP工具与LangChain一起使用的完整示例：

```javascript
const { v3 } = require('mcpm');
const { LangChainAdapter } = v3.adapters;
const { ChatOpenAI } = require('langchain/chat_models/openai');
const { initializeAgentExecutorWithOptions } = require('langchain/agents');

async function main() {
  // 创建适配器
  const adapter = new LangChainAdapter({
    client: {
      server: 'http://localhost:3100',
      apiKey: process.env.MCP_API_KEY,
      autoDiscovery: true
    },
    debug: true,
    toolPrefix: 'mcp_'
  });
  
  try {
    // 初始化适配器
    await adapter.init();
    
    // 创建工具
    const tools = await adapter.createAllTools();
    
    // 创建LLM
    const model = new ChatOpenAI({
      modelName: "gpt-4",
      temperature: 0
    });
    
    // 创建Agent
    const executor = await initializeAgentExecutorWithOptions(
      tools,
      model,
      {
        agentType: "chat-conversational-react-description",
        verbose: true
      }
    );
    
    // 运行Agent
    const result = await executor.invoke({
      input: "使用MCP工具分析这段文本：'人工智能正在改变世界，为各行各业带来创新和效率提升。'",
    });
    
    console.log(result.output);
  } finally {
    // 关闭适配器
    await adapter.close();
  }
}

main().catch(console.error);
```

## 最佳实践

- 为工具添加有意义的前缀（如`mcp_`），以便在LangChain中区分MCP工具和其他工具
- 使用`paramsMapper`和`resultMapper`函数使MCP工具更好地与LangChain工作流集成
- 在创建工具时提供详细描述，帮助LLM理解何时以及如何使用工具
- 完成使用后务必调用`adapter.close()`释放资源

## 疑难解答

如果您在使用LangChain适配器时遇到问题，请检查：

1. MCP服务器是否可访问且正在运行
2. LangChain版本是否兼容（建议使用v0.0.200+）
3. 是否正确传递了所有必需参数
4. 如果启用了调试模式（`debug: true`），检查控制台日志 