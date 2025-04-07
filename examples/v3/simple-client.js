/**
 * MCPM 3.0 简化客户端示例
 * 
 * 这个示例展示了如何使用MCPM 3.0的客户端API调用MCP服务
 */

const { v3 } = require('../../lib');
const { MCPClient } = v3.client;

// 创建客户端
const client = new MCPClient({
  server: 'http://localhost:3000', // 连接到本地服务器
  debug: true, // 启用调试模式
  cacheStrategy: 'memory', // 使用内存缓存
  timeout: 5000 // 5秒超时
});

// 异步调用函数
async function runExample() {
  try {
    console.log('连接到MCP服务器...');
    
    // 连接到服务器获取元数据
    const serverInfo = await client.connect();
    console.log(`成功连接到服务器: ${serverInfo.name}@${serverInfo.version}`);
    console.log(`可用工具: ${serverInfo.tools.map(t => t.name).join(', ')}`);
    
    // 使用问候工具 - 方法1：使用工具代理
    console.log('\n== 使用工具代理调用问候工具 ==');
    const greetingResult = await client.tools.greeting({
      name: '张三',
      formal: true
    });
    
    console.log('问候结果:', greetingResult.data.message);
    
    // 使用翻译工具 - 方法2：使用callTool方法
    console.log('\n== 使用callTool方法调用翻译工具 ==');
    const translateResult = await client.callTool('translate', {
      text: '你好，世界！',
      targetLanguage: 'en'
    });
    
    if (translateResult.success) {
      console.log('翻译结果:', translateResult.data.translatedText);
      console.log('执行时间:', translateResult.metadata?.executionTime, 'ms');
    } else {
      console.error('翻译失败:', translateResult.error);
    }
    
    // 错误处理示例
    console.log('\n== 错误处理示例 ==');
    const invalidResult = await client.tools.translate({
      // 故意省略必需的参数
      text: '测试文本'
      // 没有提供targetLanguage
    });
    
    if (!invalidResult.success) {
      console.log('预期的错误:', invalidResult.error);
    }
    
    // 缓存示例
    console.log('\n== 缓存示例 ==');
    console.log('第一次调用(无缓存):');
    const firstCall = await client.tools.greeting({ name: '李四' });
    console.log(`执行时间: ${firstCall.metadata?.executionTime}ms`);
    
    console.log('第二次调用(使用缓存):');
    const secondCall = await client.tools.greeting({ name: '李四' });
    console.log(`来自缓存: ${secondCall.metadata?.cache?.hit}`);
    
    // 清理
    client.close();
    
  } catch (error) {
    console.error('发生错误:', error.message);
  }
}

// 运行示例
runExample().catch(console.error); 