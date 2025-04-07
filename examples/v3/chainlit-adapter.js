/**
 * MCPM 3.0 Chainlit适配器示例
 * 
 * 本示例展示了如何将MCP工具集成到Chainlit应用中
 * 注意: 这只是一个模拟示例，实际使用需要在Chainlit环境中运行
 */

const { v3 } = require('../..');
const { ChainlitAdapter } = v3.adapters;

// 创建客户端实例
const client = new v3.MCPClient({
  server: 'http://localhost:3100', // 使用示例服务器
  autoDiscovery: true,
  debug: true
});

// 创建Chainlit适配器
const adapter = new ChainlitAdapter({
  client,
  debug: true,
  toolPrefix: 'mcp_',
  showMetadata: true,
  displayInUI: true,
  measureExecutionTime: true
});

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
    console.log('---');
  }
}

async function runExample() {
  console.log('===== MCPM 3.0 Chainlit适配器示例 =====\n');
  
  try {
    // 初始化适配器
    console.log('初始化适配器...');
    await adapter.init();
    
    // 创建模拟Chainlit环境
    const mockChainlit = new MockChainlitContext();
    
    // 创建单个工具
    console.log('\n创建工具...');
    const textAnalysisTool = adapter.createTool({
      name: 'text_analyzer',
      toolName: 'textAnalysis',
      description: '分析文本内容，提取情感、关键词和统计信息',
      displayInUI: true,
      showMetadata: true
    });
    
    console.log('已创建工具:', textAnalysisTool.name);
    console.log('工具描述:', textAnalysisTool.description);
    
    // 模拟工具调用 (在实际的Chainlit应用中会由框架调用)
    console.log('\n调用工具...');
    const result = await textAnalysisTool.execute({
      text: "Chainlit是一个强大的工具，可以帮助开发者构建交互式AI应用的用户界面。它为大型语言模型提供了直观的界面。",
      language: "zh",
      options: {
        includeSentiment: true,
        includeKeywords: true,
        includeStatistics: true
      }
    }, mockChainlit);
    
    console.log('\n调用结果:');
    console.log(JSON.stringify(result, null, 2));
    
    // 注册工具到Chainlit
    console.log('\n模拟注册工具到Chainlit...');
    
    // 模拟Chainlit注册API
    mockChainlit.register_tool = function(toolDef) {
      console.log(`[Chainlit] 注册工具: ${toolDef.name}`);
      console.log(`[Chainlit] 描述: ${toolDef.description}`);
      console.log(`[Chainlit] 显示在UI: ${toolDef.display_in_ui}`);
      console.log('---');
    };
    
    // 注册工具
    adapter.registerTool(textAnalysisTool, mockChainlit);
    
    // 创建所有工具
    console.log('\n创建所有可用工具...');
    const allTools = await adapter.createAllTools();
    console.log(`已创建 ${allTools.length} 个工具:`);
    allTools.forEach(tool => {
      console.log(`- ${tool.name}: ${tool.description.substring(0, 60)}...`);
      
      // 注册到模拟Chainlit
      adapter.registerTool(tool, mockChainlit);
    });
    
    // 在实际的Chainlit应用中，你会这样使用这些工具:
    console.log('\n在实际Chainlit应用中的使用示例:');
    console.log(`
# app.py
import chainlit as cl
from chainlit.element import Element
from chainlit.input_widget import Select, Slider

# 导入MCPM
import mcpm
from mcpm.v3.adapters import ChainlitAdapter

# 创建适配器
adapter = ChainlitAdapter(
    client={
        "server": "https://your-mcp-server.com",
        "autoDiscovery": True
    },
    displayInUI=True,
    showMetadata=True
)

@cl.on_chat_start
async def setup():
    # 初始化适配器
    await adapter.init()
    
    # 创建所有工具
    tools = await adapter.createAllTools()
    
    # 注册工具到Chainlit
    for tool in tools:
        adapter.registerTool(tool, cl)
    
    # 存储在用户会话中
    cl.user_session.set("tools", tools)

@cl.on_message
async def main(message: cl.Message):
    tools = cl.user_session.get("tools")
    
    # 使用工具处理消息
    if "analyze" in message.content.lower():
        text_analysis_tool = next(t for t in tools if t.name == "mcp_textAnalysis")
        result = await text_analysis_tool.execute({
            "text": message.content
        }, cl)
        
        await cl.Message(
            content=f"分析结果:\\n情感: {result.get('sentiment', 'neutral')}\\n关键词: {', '.join(result.get('keywords', []))}"
        ).send()
    else:
        await cl.Message(content="我可以帮您分析文本，请输入包含'analyze'的消息").send()
`);
    
  } catch (error) {
    console.error('示例运行出错:', error);
  } finally {
    // 关闭适配器
    console.log('\n关闭适配器...');
    await adapter.close();
    console.log('示例完成!');
  }
}

// 运行示例
runExample().catch(console.error); 