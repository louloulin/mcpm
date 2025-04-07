/**
 * MCPM 3.0 LangChain适配器示例
 * 
 * 本示例展示了如何将MCP工具集成到LangChain应用中
 */

const { v3 } = require('../..');
const { LangChainAdapter } = v3.adapters;

// 创建客户端实例
const client = new v3.MCPClient({
  server: 'http://localhost:3100', // 使用示例服务器
  autoDiscovery: true,
  debug: true
});

// 创建LangChain适配器
const adapter = new LangChainAdapter({
  client,
  debug: true,
  toolPrefix: 'mcp_'
});

async function runExample() {
  console.log('===== MCPM 3.0 LangChain适配器示例 =====\n');
  
  try {
    // 初始化适配器
    console.log('初始化适配器...');
    await adapter.init();
    
    // 创建单个工具
    console.log('\n创建工具...');
    const textAnalysisTool = adapter.createTool({
      name: 'text_analysis',  // 自定义名称
      toolName: 'textAnalysis', // MCP工具名称
      description: '分析文本内容，提取情感、关键词和统计信息',
      // 参数映射函数（可选）
      paramsMapper: (params) => ({
        text: params.content || params.text,
        language: params.language || 'en',
        options: params.options || {}
      }),
      // 结果映射函数（可选）
      resultMapper: (result) => ({
        sentiment: result.sentiment?.label || 'neutral',
        keywords: result.keywords || [],
        characterCount: result.statistics?.characterCount
      })
    });
    
    console.log('已创建工具:', textAnalysisTool.name);
    console.log('工具描述:', textAnalysisTool.description);
    
    // 模拟工具调用 (在实际的LangChain应用中会由框架调用)
    console.log('\n调用工具...');
    const result = await textAnalysisTool._call({
      content: "人工智能正在迅速发展，为各行各业带来了深刻的变革。机器学习和深度学习等技术使计算机能够从数据中学习并做出决策。",
      language: "zh"
    });
    
    console.log('调用结果:');
    console.log(JSON.stringify(result, null, 2));
    
    // 创建所有工具
    console.log('\n创建所有可用工具...');
    const allTools = await adapter.createAllTools();
    console.log(`已创建 ${allTools.length} 个工具:`);
    allTools.forEach(tool => {
      console.log(`- ${tool.name}: ${tool.description.substring(0, 60)}...`);
    });
    
    // 在实际的LangChain应用中，你会这样使用这些工具:
    console.log('\n在LangChain中的用法示例:');
    console.log(`
// 1. 引入适配器
const { v3 } = require('mcpm');
const { LangChainAdapter } = v3.adapters;

// 2. 创建适配器
const adapter = new LangChainAdapter({
  client: {
    server: 'https://your-mcp-server.com',
    autoDiscovery: true
  }
});
await adapter.init();

// 3. 创建所有工具
const tools = await adapter.createAllTools();

// 4. 在LangChain Agent中使用
import { initializeAgentExecutorWithOptions } from "langchain/agents";
import { ChatOpenAI } from "langchain/chat_models/openai";

const model = new ChatOpenAI({});
const executor = await initializeAgentExecutorWithOptions(
  tools,
  model,
  {
    agentType: "chat-conversational-react-description",
    verbose: true
  }
);

// 5. 执行代理
const result = await executor.invoke({
  input: "分析这段文本: 'AI将改变世界'",
});
console.log(result.output);
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