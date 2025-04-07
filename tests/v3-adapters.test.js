/**
 * MCPM 3.0 框架适配器测试
 */

// 使用内置的 assert 模块代替 Jest
const assert = require('assert');

// 直接导入适配器模块
const adapters = require('../lib/v3/adapters');
const { BaseAdapter, LangChainAdapter, MastraAdapter, ChainlitAdapter, createAdapter } = adapters;

// 简单测试框架
function describe(name, fn) {
  console.log(`\n=== ${name} ===`);
  fn();
}

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
  } catch (err) {
    console.error(`❌ ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

// 模拟 MCPClient 和工具
class MockMCPClient {
  constructor(options = {}) {
    this.options = options;
    this.connected = false;
    this.tools = {
      textAnalysis: {},
      translate: {},
      dataTransform: {}
    };
  }
  
  async connect() {
    this.connected = true;
    return { 
      name: 'mock-server', 
      version: '1.0.0',
      tools: Object.keys(this.tools).map(name => ({ name }))
    };
  }
  
  async close() {
    this.connected = false;
  }
  
  async callTool(toolName, params) {
    // 简单的模拟工具调用结果
    if (toolName === 'textAnalysis') {
      return { 
        success: true,
        data: {
          sentiment: { score: 0.5, label: 'positive' },
          keywords: ['test', 'mock', 'adapter'],
          statistics: { characterCount: 100, wordCount: 20, sentenceCount: 2 }
        }
      };
    } else if (toolName === 'translate') {
      return {
        success: true,
        data: {
          translatedText: `[${params.targetLanguage}] ${params.text}`,
          sourceLanguage: params.sourceLanguage || 'auto',
          targetLanguage: params.targetLanguage
        }
      };
    } else if (toolName === 'dataTransform') {
      return {
        success: true,
        data: {
          converted: true,
          sourceFormat: params.sourceFormat,
          targetFormat: params.targetFormat,
          sampleOutput: `Mock ${params.targetFormat} output`
        }
      };
    } else {
      throw new Error(`未知工具: ${toolName}`);
    }
  }
  
  // 添加一个模拟的isConnected方法
  isConnected() {
    return this.connected;
  }
}

// 测试
describe('MCPM 3.0 框架适配器', () => {
  // 首先检查适配器模块
  test('适配器模块', () => {
    console.log("适配器模块:", adapters);
    assert(adapters, '适配器模块应该存在');
    assert(createAdapter, '应该有createAdapter函数');
    assert(BaseAdapter, '应该有BaseAdapter类');
    assert(LangChainAdapter, '应该有LangChainAdapter类');
    assert(MastraAdapter, '应该有MastraAdapter类');
    assert(ChainlitAdapter, '应该有ChainlitAdapter类');
  });
  
  test('适配器工厂函数', () => {
    const mockClient = new MockMCPClient();
    
    // 测试创建LangChain适配器
    const langchainAdapter = createAdapter('langchain', { client: mockClient });
    assert(langchainAdapter instanceof LangChainAdapter, '应该创建LangChainAdapter实例');
    
    // 测试创建Mastra适配器
    const mastraAdapter = createAdapter('mastra', { client: mockClient });
    assert(mastraAdapter instanceof MastraAdapter, '应该创建MastraAdapter实例');
    
    // 测试创建Chainlit适配器
    const chainlitAdapter = createAdapter('chainlit', { client: mockClient });
    assert(chainlitAdapter instanceof ChainlitAdapter, '应该创建ChainlitAdapter实例');
    
    // 测试无效框架
    try {
      createAdapter('unknown', { client: mockClient });
      assert.fail('应该抛出错误');
    } catch (error) {
      assert(error.message.includes('不支持的框架'), '应该有正确的错误消息');
    }
  });
  
  test('LangChain适配器基本功能', async () => {
    const mockClient = new MockMCPClient();
    const adapter = new LangChainAdapter({ client: mockClient });
    
    // 初始化
    await adapter.init();
    assert(mockClient.connected, '客户端应该已连接');
    
    // 创建工具
    const tool = adapter.createTool({
      name: 'test_tool',
      toolName: 'textAnalysis',
      description: '测试工具'
    });
    
    assert(tool, '应该创建工具');
    assert.strictEqual(tool.name, 'mcp:test_tool', '工具名称应该正确');
    assert.strictEqual(tool.description, '测试工具', '工具描述应该正确');
    assert(typeof tool._call === 'function', '工具应该有_call方法');
    
    // 调用工具
    const result = await tool._call({ text: 'test' });
    assert(result, '应该返回结果');
    assert(result.sentiment, '结果应该包含sentiment');
    assert(Array.isArray(result.keywords), '结果应该包含keywords数组');
    
    // 关闭适配器
    await adapter.close();
    assert(!mockClient.connected, '客户端应该已断开连接');
  });
  
  test('Mastra适配器基本功能', async () => {
    const mockClient = new MockMCPClient();
    const adapter = new MastraAdapter({ 
      client: mockClient,
      category: 'TestTools',
      asActions: true
    });
    
    // 初始化
    await adapter.init();
    assert(mockClient.connected, '客户端应该已连接');
    
    // 创建工具
    const tool = adapter.createTool({
      name: 'translate_tool',
      toolName: 'translate',
      description: '翻译工具'
    });
    
    assert(tool, '应该创建工具');
    assert.strictEqual(tool.name, 'mcp:translate_tool', '工具名称应该正确');
    assert.strictEqual(tool.description, '翻译工具', '工具描述应该正确');
    assert.strictEqual(tool.category, 'TestTools', '工具类别应该正确');
    assert(typeof tool.invoke === 'function', '工具应该有invoke方法');
    assert(tool.runAsAction, '工具应该有runAsAction方法');
    
    // 调用工具
    const result = await tool.invoke({ 
      text: 'Hello world', 
      targetLanguage: 'zh' 
    });
    
    assert(result, '应该返回结果');
    assert(result.translatedText, '结果应该包含translatedText');
    assert.strictEqual(result.targetLanguage, 'zh', '目标语言应该正确');
    
    // 关闭适配器
    await adapter.close();
    assert(!mockClient.connected, '客户端应该已断开连接');
  });
  
  test('Chainlit适配器基本功能', async () => {
    const mockClient = new MockMCPClient();
    const adapter = new ChainlitAdapter({ 
      client: mockClient,
      showMetadata: true,
      displayInUI: true
    });
    
    // 初始化
    await adapter.init();
    assert(mockClient.connected, '客户端应该已连接');
    
    // 创建工具
    const tool = adapter.createTool({
      name: 'data_tool',
      toolName: 'dataTransform',
      description: '数据转换工具'
    });
    
    assert(tool, '应该创建工具');
    assert.strictEqual(tool.name, 'mcp:data_tool', '工具名称应该正确');
    assert.strictEqual(tool.description, '数据转换工具', '工具描述应该正确');
    assert(tool.displayInUI, '工具应该显示在UI中');
    assert(typeof tool.execute === 'function', '工具应该有execute方法');
    
    // 模拟Chainlit上下文
    const mockChainlit = {
      messages: [],
      sendMessage(message) {
        this.messages.push(message);
      }
    };
    
    // 调用工具
    const result = await tool.execute({ 
      data: { test: true },
      sourceFormat: 'json',
      targetFormat: 'yaml'
    }, mockChainlit);
    
    assert(result, '应该返回结果');
    assert(result.converted, '结果应该包含converted');
    assert.strictEqual(result.sourceFormat, 'json', '源格式应该正确');
    assert.strictEqual(result.targetFormat, 'yaml', '目标格式应该正确');
    
    // 验证Chainlit消息
    assert(mockChainlit.messages.length > 0, '应该发送Chainlit消息');
    
    // 模拟注册工具
    mockChainlit.register_tool = function(toolDef) {
      this.registeredTool = toolDef;
    };
    
    adapter.registerTool(tool, mockChainlit);
    assert(mockChainlit.registeredTool, '应该注册工具');
    assert.strictEqual(mockChainlit.registeredTool.name, tool.name, '注册的工具名称应该正确');
    
    // 关闭适配器
    await adapter.close();
    assert(!mockClient.connected, '客户端应该已断开连接');
  });
}); 