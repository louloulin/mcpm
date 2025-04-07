/**
 * MCPM 3.0 Mastra适配器示例
 * 
 * 本示例展示了如何将MCP工具集成到Mastra应用中
 */

const { v3 } = require('../..');
const { MastraAdapter } = v3.adapters;

// 创建客户端实例
const client = new v3.MCPClient({
  server: 'http://localhost:3100', // 使用示例服务器
  autoDiscovery: true,
  debug: true
});

// 创建Mastra适配器
const adapter = new MastraAdapter({
  client,
  debug: true,
  toolPrefix: 'mcp_',
  category: 'MCP工具',
  asActions: true
});

async function runExample() {
  console.log('===== MCPM 3.0 Mastra适配器示例 =====\n');
  
  try {
    // 初始化适配器
    console.log('初始化适配器...');
    await adapter.init();
    
    // 创建单个工具
    console.log('\n创建工具...');
    const translationTool = adapter.createTool({
      name: 'translator',  // 自定义名称
      toolName: 'translate', // MCP工具名称（假设服务器有此工具）
      description: '将文本从一种语言翻译为另一种语言',
      category: '翻译工具',
      asAction: true,
      // 参数映射函数（可选）
      paramsMapper: (params) => ({
        text: params.content || params.text,
        targetLanguage: params.target || params.targetLanguage || 'en',
        sourceLanguage: params.source || params.sourceLanguage || 'auto'
      }),
      // 结果映射函数（可选）
      resultMapper: (result) => ({
        translated: result.translatedText,
        from: result.sourceLanguage,
        to: result.targetLanguage
      })
    });
    
    console.log('已创建工具:', translationTool.name);
    console.log('工具描述:', translationTool.description);
    console.log('工具类别:', translationTool.category);
    
    // 模拟工具调用 (在实际的Mastra应用中会由框架调用)
    console.log('\n调用工具...');
    try {
      const result = await translationTool.invoke({
        content: "Hello world, this is a test of the MCP translation tool.",
        target: "zh"
      });
      
      console.log('调用结果:');
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      console.log('工具调用失败（这是预期的，因为示例服务器可能没有翻译工具）');
      console.log('错误:', error.message);
    }
    
    // 创建数据转换工具（已知存在于示例服务器）
    console.log('\n创建数据转换工具...');
    const dataTransformTool = adapter.createTool({
      name: 'data_transformer',
      toolName: 'dataTransform',
      description: '转换数据格式，如JSON到CSV、XML到JSON等',
      category: '数据工具',
      asAction: true
    });
    
    // 模拟工具调用
    console.log('\n调用数据转换工具...');
    try {
      const result = await dataTransformTool.invoke({
        data: { users: [{ name: "张三", age: 30 }, { name: "李四", age: 25 }] },
        sourceFormat: "json",
        targetFormat: "yaml"
      });
      
      console.log('调用结果:');
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      // 这个调用可能会失败，因为需要API密钥
      console.log('工具调用可能失败（因为服务器要求API密钥）');
      console.log('错误:', error.message);
    }
    
    // 创建所有工具
    console.log('\n创建所有可用工具...');
    const allTools = await adapter.createAllTools();
    console.log(`已创建 ${allTools.length} 个工具:`);
    allTools.forEach(tool => {
      console.log(`- ${tool.name} (${tool.category}): ${tool.description.substring(0, 60)}...`);
    });
    
    // 在实际的Mastra应用中，你会这样使用这些工具:
    console.log('\n在Mastra中的用法示例:');
    console.log(`
// 1. 引入适配器
const { v3 } = require('mcpm');
const { MastraAdapter } = v3.adapters;
import { Agent } from '@mastra/core';

// 2. 创建适配器
const adapter = new MastraAdapter({
  client: {
    server: 'https://your-mcp-server.com',
    autoDiscovery: true
  },
  asActions: true
});
await adapter.init();

// 3. 创建所有工具
const mcpTools = await adapter.createAllTools();

// 4. 创建Mastra代理
const agent = new Agent({
  name: 'MCPAgent',
  model: 'openai:gpt-4',
  tools: mcpTools
});

// 5. 运行代理
const result = await agent.run({
  input: "将这段文本翻译成中文: 'Artificial intelligence is transforming the world'",
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