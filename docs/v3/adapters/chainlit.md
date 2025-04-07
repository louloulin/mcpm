# Chainlit适配器

Chainlit适配器允许您在Chainlit应用中无缝使用MCP工具。通过这个适配器，您可以将MCP工具集成到Chainlit UI中，提供可视化的工具执行和调试能力。

## 安装

确保已安装MCPM 3.0：

```bash
npm install mcpm@3
```

如果您要在Chainlit项目中使用，还需安装Chainlit：

```bash
pip install chainlit
```

## 基本用法

### 创建适配器

```javascript
const { v3 } = require('mcpm');
const { ChainlitAdapter } = v3.adapters;

// 创建适配器实例
const adapter = new ChainlitAdapter({
  // MCP客户端配置
  client: {
    server: 'http://localhost:3100',
    autoDiscovery: true
  },
  // 适配器选项
  debug: true,                   // 启用调试日志
  toolPrefix: 'mcp_',            // 工具名称前缀
  showMetadata: true,            // 在UI中显示工具元数据
  displayInUI: true,             // 在UI中直接显示工具
  measureExecutionTime: true     // 测量工具执行时间
});

// 初始化适配器
await adapter.init();
```

### 创建单个工具

```javascript
const imageAnalysisTool = adapter.createTool({
  name: 'image_analyzer',        // 自定义工具名称
  toolName: 'imageAnalysis',     // MCP工具名称
  description: '分析图像内容，识别对象和场景',
  displayInUI: true,             // 在UI中显示
  showMetadata: true,            // 显示元数据
  
  // 可选：参数映射函数
  paramsMapper: (params) => ({
    imageUrl: params.url || params.imageUrl,
    options: params.options || { detectObjects: true }
  }),
  
  // 可选：结果映射函数
  resultMapper: (result) => ({
    objects: result.objects || [],
    scene: result.scene || 'unknown',
    tags: result.tags || []
  })
});

// 使用工具 (在Chainlit环境中)
const result = await imageAnalysisTool.execute({
  url: "https://example.com/image.jpg"
}, chainlitContext);

console.log(result);
```

### 创建所有工具

```javascript
// 创建所有可用MCP工具的Chainlit工具包装器
const tools = await adapter.createAllTools();

// 在Chainlit中使用这些工具
console.log(`已创建 ${tools.length} 个Chainlit工具`);
```

### 注册工具到Chainlit

```javascript
// 在Chainlit环境中注册工具
// 注意：此方法需要在Chainlit环境中调用
for (const tool of tools) {
  adapter.registerTool(tool, cl); // cl 是Chainlit实例
}
```

## 在Chainlit应用中使用

以下是一个完整的Python Chainlit应用示例，展示如何集成MCP工具：

```python
import chainlit as cl
from chainlit.element import Element
from chainlit.input_widget import Select, Slider

# 导入MCPM Node.js模块
import mcpm
from mcpm.v3.adapters import ChainlitAdapter

# 创建适配器
adapter = None

@cl.on_chat_start
async def setup():
    global adapter
    
    # 初始化适配器
    adapter = ChainlitAdapter(
        client={
            "server": "http://localhost:3100",
            "autoDiscovery": True
        },
        displayInUI=True,
        showMetadata=True,
        measureExecutionTime=True
    )
    
    await adapter.init()
    
    # 创建所有工具
    tools = await adapter.createAllTools()
    
    # 注册工具到Chainlit
    for tool in tools:
        adapter.registerTool(tool, cl)
    
    # 存储在用户会话中
    cl.user_session.set("tools", tools)
    
    # 发送欢迎消息
    await cl.Message(
        content="我是MCP助手，可以帮您分析文本、图像和数据。请告诉我您需要什么帮助！",
        elements=[
            Element(
                "image", 
                url="https://example.com/mcp-logo.png",
                name="MCP Logo"
            )
        ]
    ).send()

@cl.on_message
async def main(message: cl.Message):
    tools = cl.user_session.get("tools")
    
    # 根据消息内容使用相应的工具
    if "分析文本" in message.content:
        # 查找文本分析工具
        text_tool = next((t for t in tools if "text" in t.name.lower()), None)
        
        if text_tool:
            # 显示加载状态
            await cl.Message(content="正在分析文本...").send()
            
            # 执行工具
            result = await text_tool.execute({
                "text": message.content,
                "language": "zh",
                "options": {
                    "includeSentiment": True,
                    "includeKeywords": True
                }
            }, cl)
            
            # 发送结果
            elements = []
            if result.get("keywords"):
                elements.append(
                    Element("plot", 
                            value={
                                "type": "bar", 
                                "data": {
                                    "labels": result["keywords"][:5],
                                    "datasets": [{
                                        "label": "相关性",
                                        "data": [0.9, 0.8, 0.7, 0.6, 0.5]
                                    }]
                                }
                            },
                            name="关键词分析"
                    )
                )
            
            await cl.Message(
                content=f"分析结果:\n情感: {result.get('sentiment', 'neutral')}\n关键词: {', '.join(result.get('keywords', [])[:5])}",
                elements=elements
            ).send()
        else:
            await cl.Message(content="抱歉，找不到文本分析工具").send()
    else:
        await cl.Message(content="我可以帮您分析文本、图像和数据。请指定您需要的服务，例如'分析文本：...'").send()

@cl.on_stop
async def on_stop():
    global adapter
    # 关闭适配器
    if adapter:
        await adapter.close()
```

## 配置选项

Chainlit适配器支持以下配置选项：

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| client | MCPClient \| Object | 必填 | MCP客户端实例或配置选项 |
| autoDiscoverTools | boolean | true | 是否自动发现并包装所有工具 |
| debug | boolean | false | 是否启用调试日志 |
| toolPrefix | string | 'mcp:' | 工具名称前缀 |
| showMetadata | boolean | true | 是否在Chainlit界面中显示工具元数据 |
| displayInUI | boolean | true | 是否在UI中直接可见工具 |
| measureExecutionTime | boolean | true | 是否显示工具执行时间 |

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
| showMetadata | boolean | 适配器的showMetadata | 是否显示工具元数据 |
| displayInUI | boolean | 适配器的displayInUI | 是否在UI中显示 |
| measureExecutionTime | boolean | 适配器的measureExecutionTime | 是否显示执行时间 |

## JavaScript完整示例

以下是在Node.js环境中模拟Chainlit上下文的完整示例：

```javascript
const { v3 } = require('mcpm');
const { ChainlitAdapter } = v3.adapters;

// 模拟Chainlit上下文
class MockChainlitContext {
  constructor() {
    this.messages = [];
  }
  
  sendMessage(message) {
    this.messages.push(message);
    console.log(`[Chainlit] ${message.type}: ${message.content}`);
    if (message.metadata) {
      console.log('[Chainlit] 元数据:', JSON.stringify(message.metadata, null, 2));
    }
  }
  
  register_tool(toolDef) {
    console.log(`[Chainlit] 注册工具: ${toolDef.name}`);
    console.log(`[Chainlit] 描述: ${toolDef.description}`);
  }
}

async function main() {
  // 创建适配器
  const adapter = new ChainlitAdapter({
    client: {
      server: 'http://localhost:3100',
      apiKey: process.env.MCP_API_KEY,
      autoDiscovery: true
    },
    debug: true,
    toolPrefix: 'mcp_',
    showMetadata: true,
    displayInUI: true
  });
  
  try {
    // 初始化适配器
    await adapter.init();
    
    // 创建模拟Chainlit环境
    const mockChainlit = new MockChainlitContext();
    
    // 创建文本分析工具
    const textAnalysisTool = adapter.createTool({
      name: 'text_analyzer',
      toolName: 'textAnalysis',
      description: '分析文本内容，提取情感、关键词和统计信息'
    });
    
    // 注册工具
    adapter.registerTool(textAnalysisTool, mockChainlit);
    
    // 模拟在Chainlit环境中调用工具
    console.log('\n调用工具...');
    const result = await textAnalysisTool.execute({
      text: "Chainlit是一个强大的工具，可以帮助开发者构建交互式AI应用的用户界面。",
      language: "zh",
      options: {
        includeSentiment: true,
        includeKeywords: true
      }
    }, mockChainlit);
    
    console.log('\n调用结果:');
    console.log(JSON.stringify(result, null, 2));
    
    // 创建所有工具
    console.log('\n创建并注册所有工具...');
    const allTools = await adapter.createAllTools();
    
    for (const tool of allTools) {
      adapter.registerTool(tool, mockChainlit);
    }
    
  } finally {
    // 关闭适配器
    await adapter.close();
  }
}

main().catch(console.error);
```

## Chainlit特有功能

### 工具执行可视化

Chainlit适配器会自动在UI中显示工具执行的过程和结果：

1. **工具开始执行**：显示工具名称、参数等信息
2. **工具执行结果**：显示返回的数据、执行时间等
3. **工具执行错误**：如果发生错误，显示错误信息

这使用户可以清楚地看到工具的执行过程，便于调试和理解。

### 工具参数表单

当工具在UI中可见时，用户可以直接通过Chainlit界面调用工具：

```python
@cl.action_callback("call_mcp_tool")
async def on_action(action):
    tool_name = action.value
    tools = cl.user_session.get("tools")
    
    # 找到对应的工具
    tool = next((t for t in tools if t.name == tool_name), None)
    if not tool:
        await cl.Message(content=f"找不到工具 {tool_name}").send()
        return
    
    # 创建参数输入表单
    await cl.Message(
        content=f"请提供 {tool.name} 的参数",
        elements=[
            cl.Input(id="param_text", label="文本内容"),
            cl.Select(id="param_language", label="语言", 
                      values=["zh", "en", "ja"], initial_value="zh")
        ]
    ).send()
    
    # 用户提交后处理
    @cl.on_form_submit
    async def handle_form(form_data):
        result = await tool.execute({
            "text": form_data["param_text"],
            "language": form_data["param_language"]
        }, cl)
        
        await cl.Message(content=f"执行结果: {result}").send()
```

## 最佳实践

- 启用`showMetadata`和`measureExecutionTime`选项，以便在Chainlit UI中提供更好的调试体验
- 使用描述性的工具名称和详细描述，帮助用户理解工具功能
- 使用`paramsMapper`和`resultMapper`函数使MCP工具更好地与Chainlit界面集成
- 完成使用后务必调用`adapter.close()`释放资源

## 疑难解答

如果您在使用Chainlit适配器时遇到问题，请检查：

1. MCP服务器是否可访问且正在运行
2. Chainlit版本是否兼容（建议使用v0.7.0+）
3. Python环境是否正确配置了Node.js互操作
4. 是否正确传递了Chainlit上下文到工具的execute方法
5. 如果启用了调试模式（`debug: true`），检查控制台日志 