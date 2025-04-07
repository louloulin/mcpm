# Mastra适配器

Mastra适配器允许您在Mastra应用中无缝使用MCP工具。通过这个适配器，您可以将MCP工具转换为Mastra工具，并在Mastra Agent和Workflow中使用。

## 安装

确保已安装MCPM 3.0：

```bash
npm install mcpm@3
```

如果您要在Mastra项目中使用，还需安装Mastra：

```bash
npm install @mastra/core
```

## 基本用法

### 创建适配器

```javascript
const { v3 } = require('mcpm');
const { MastraAdapter } = v3.adapters;

// 创建适配器实例
const adapter = new MastraAdapter({
  // MCP客户端配置
  client: {
    server: 'http://localhost:3100',
    autoDiscovery: true
  },
  // 适配器选项
  debug: true,             // 启用调试日志
  toolPrefix: 'mcp_',      // 工具名称前缀
  category: 'MCPTools',    // 工具类别
  asActions: true          // 是否作为动作添加到Agent
});

// 初始化适配器
await adapter.init();
```

### 创建单个工具

```javascript
const translationTool = adapter.createTool({
  name: 'translator',       // 自定义工具名称
  toolName: 'translate',    // MCP工具名称
  description: '将文本从一种语言翻译到另一种语言',
  category: '翻译工具',     // 自定义类别
  asAction: true,           // 作为动作添加
  
  // 可选：参数映射函数
  paramsMapper: (params) => ({
    text: params.content || params.text,
    targetLanguage: params.target || params.targetLanguage || 'en',
    sourceLanguage: params.source || params.sourceLanguage || 'auto'
  }),
  
  // 可选：结果映射函数
  resultMapper: (result) => ({
    translated: result.translatedText,
    from: result.sourceLanguage,
    to: result.targetLanguage
  })
});

// 使用工具
const result = await translationTool.invoke({
  content: "Mastra是一个用于构建AI应用的强大框架。",
  target: "en"
});

console.log(result);
```

### 创建所有工具

```javascript
// 创建所有可用MCP工具的Mastra工具包装器
const tools = await adapter.createAllTools();

// 在Mastra中使用这些工具
console.log(`已创建 ${tools.length} 个Mastra工具`);
```

### 在Mastra Agent中使用

```javascript
import { Agent } from '@mastra/core';

// 创建Mastra代理
const agent = new Agent({
  name: 'TranslationAgent',
  model: 'openai:gpt-4',
  tools: tools, // MCP工具
  memory: true
});

// 运行代理
const result = await agent.run({
  input: "将这段文本翻译成英语: '人工智能的发展速度令人惊叹，每天都有新的突破。'"
});

console.log(result.output);
```

## 配置选项

Mastra适配器支持以下配置选项：

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| client | MCPClient \| Object | 必填 | MCP客户端实例或配置选项 |
| autoDiscoverTools | boolean | true | 是否自动发现并包装所有工具 |
| debug | boolean | false | 是否启用调试日志 |
| toolPrefix | string | 'mcp:' | 工具名称前缀 |
| category | string | 'MCPTools' | 工具类别 |
| asActions | boolean | false | 是否将工具作为可调用的动作添加到Agent |

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
| category | string | 适配器的category | 工具类别 |
| asAction | boolean | 适配器的asActions | 是否作为动作添加 |

## 完整示例

以下是将MCP工具与Mastra一起使用的完整示例：

```javascript
const { v3 } = require('mcpm');
const { MastraAdapter } = v3.adapters;
const { Agent, Workflow } = require('@mastra/core');

async function main() {
  // 创建适配器
  const adapter = new MastraAdapter({
    client: {
      server: 'http://localhost:3100',
      apiKey: process.env.MCP_API_KEY,
      autoDiscovery: true
    },
    debug: true,
    toolPrefix: 'mcp_',
    category: 'MCP服务',
    asActions: true
  });
  
  try {
    // 初始化适配器
    await adapter.init();
    
    // 创建工具
    const mcpTools = await adapter.createAllTools();
    
    // 创建一个数据分析工具
    const dataAnalysisTool = adapter.createTool({
      name: 'data_analysis',
      toolName: 'dataAnalysis',
      description: '分析数据集，提取统计信息和洞察',
      category: '数据工具',
      asAction: true
    });
    
    // 创建Mastra代理
    const agent = new Agent({
      name: 'MCPDataAgent',
      model: 'openai:gpt-4',
      tools: [
        ...mcpTools,
        // 添加其他Mastra原生工具
      ],
      memory: true,
      description: '一个使用MCP工具进行数据分析的助手'
    });
    
    // 创建工作流
    const workflow = new Workflow({
      name: 'DataAnalysisWorkflow',
      steps: [
        {
          name: 'analyzeData',
          tool: 'mcp_data_analysis',
          inputs: {
            data: '{{$input.data}}',
            options: {
              includeStats: true,
              includeVisualizations: true
            }
          }
        },
        {
          name: 'summarize',
          agent: agent,
          inputs: {
            input: '基于这些数据分析结果，提供一份简洁的摘要：{{$steps.analyzeData.output}}'
          }
        }
      ]
    });
    
    // 运行工作流
    const result = await workflow.run({
      data: [
        { name: "产品A", sales: 120, region: "北区" },
        { name: "产品B", sales: 85, region: "东区" },
        { name: "产品C", sales: 200, region: "南区" },
        { name: "产品D", sales: 150, region: "西区" }
      ]
    });
    
    console.log(result.output);
  } finally {
    // 关闭适配器
    await adapter.close();
  }
}

main().catch(console.error);
```

## 与Mastra特有功能集成

### 使用MCP工具作为Agent动作

当将`asAction`设置为`true`时，MCP工具会被包装为Mastra Agent可直接调用的动作：

```javascript
// 创建带有runAsAction方法的工具
const reportTool = adapter.createTool({
  name: 'generate_report',
  toolName: 'reportGenerator',
  description: '生成数据报告',
  asAction: true
});

// 在Agent中使用此工具
const agent = new Agent({
  name: 'ReportAgent',
  model: 'openai:gpt-4',
  tools: [reportTool]
});

// Agent可以通过动作直接调用工具
const result = await agent.run({
  input: "为上个月的销售数据生成报告"
});
```

### 在Mastra Workflow中使用MCP工具

MCP工具可以无缝集成到Mastra工作流中：

```javascript
const workflow = new Workflow({
  name: 'TranslationWorkflow',
  steps: [
    {
      name: 'translateToEnglish',
      tool: 'mcp_translator',  // MCP翻译工具
      inputs: {
        text: '{{$input.text}}',
        target: 'en'
      }
    },
    {
      name: 'summarize',
      tool: 'mcp_textAnalysis',  // MCP文本分析工具
      inputs: {
        text: '{{$steps.translateToEnglish.output.translated}}',
        options: {
          includeSummary: true
        }
      }
    }
  ]
});
```

## 最佳实践

- 为工具添加有意义的类别，以便在Mastra UI中更好地组织工具
- 使用`asActions`选项使MCP工具可以直接由Agent调用
- 使用`paramsMapper`和`resultMapper`函数使MCP工具与Mastra的数据流和输入/输出格式兼容
- 完成使用后务必调用`adapter.close()`释放资源

## 疑难解答

如果您在使用Mastra适配器时遇到问题，请检查：

1. MCP服务器是否可访问且正在运行
2. Mastra版本是否兼容（建议使用v1.0.0+）
3. 是否正确传递了所有必需参数
4. 如果启用了调试模式（`debug: true`），检查控制台日志 