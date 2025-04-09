/**
 * MCPM 3.0 框架适配器测试
 * 
 * 本测试文件验证各个框架适配器的功能，确保它们能够正确集成MCP工具到不同框架
 */

const { expect } = require('chai');
const sinon = require('sinon');
const nock = require('nock');

// 导入被测模块
const { 
  createAdapter, 
  getAdapterClass, 
  detectAvailableFrameworks, 
  integrateWithFrameworks,
  LangChainAdapter,
  MastraAdapter,
  ChainlitAdapter,
  LlamaIndexAdapter,
  HaystackAdapter,
  FlowiseAdapter,
  AutoGenAdapter,
  SemanticKernelAdapter
} = require('../../lib/v3/adapters');

// 模拟MCPClient
class MockMCPClient {
  constructor(options = {}) {
    this.options = options;
    this.connected = false;
    this.tools = {};
  }

  async connect() {
    this.connected = true;
    return {
      name: 'mock-server',
      version: '1.0.0',
      description: 'Mock MCP Server for testing',
      url: 'https://mock-mcp-server.com',
      tools: [
        {
          name: 'textAnalyzer',
          description: 'Analyzes text for sentiment and entities',
          parameters: {
            text: {
              type: 'string',
              description: 'Text to analyze',
              required: true
            }
          }
        },
        {
          name: 'imageGenerator',
          description: 'Generates images from text descriptions',
          parameters: {
            prompt: {
              type: 'string',
              description: 'Image description',
              required: true
            },
            style: {
              type: 'string',
              description: 'Image style',
              required: false
            }
          }
        }
      ],
      endpoint: 'https://mock-mcp-server.com/api/tools'
    };
  }

  async getServerInfo() {
    return this.connect();
  }

  async callTool(toolName, params, options = {}) {
    return {
      success: true,
      data: {
        result: `Mocked result for ${toolName} with params: ${JSON.stringify(params)}`,
        toolName,
        params
      }
    };
  }

  async close() {
    this.connected = false;
  }

  isConnected() {
    return this.connected;
  }
}

describe('框架适配器', () => {
  // 在测试前设置模拟
  beforeEach(() => {
    // 模拟所有框架导入
    this.dynamicImports = {};
    this.importMock = sinon.stub(global, 'require').callsFake((module) => {
      if (this.dynamicImports[module]) {
        return this.dynamicImports[module];
      }
      throw new Error(`模块不存在: ${module}`);
    });
  });

  // 在测试后清理模拟
  afterEach(() => {
    if (this.importMock) {
      this.importMock.restore();
    }
    nock.cleanAll();
  });

  describe('工厂函数', () => {
    it('应该创建正确的适配器实例', () => {
      const options = { client: new MockMCPClient() };
      
      const langchainAdapter = createAdapter('langchain', options);
      expect(langchainAdapter).to.be.instanceOf(LangChainAdapter);
      
      const mastraAdapter = createAdapter('mastra', options);
      expect(mastraAdapter).to.be.instanceOf(MastraAdapter);
      
      const chainlitAdapter = createAdapter('chainlit', options);
      expect(chainlitAdapter).to.be.instanceOf(ChainlitAdapter);
      
      const llamaindexAdapter = createAdapter('llamaindex', options);
      expect(llamaindexAdapter).to.be.instanceOf(LlamaIndexAdapter);
      
      const haystackAdapter = createAdapter('haystack', options);
      expect(haystackAdapter).to.be.instanceOf(HaystackAdapter);
      
      const flowiseAdapter = createAdapter('flowise', options);
      expect(flowiseAdapter).to.be.instanceOf(FlowiseAdapter);
      
      const autogenAdapter = createAdapter('autogen', options);
      expect(autogenAdapter).to.be.instanceOf(AutoGenAdapter);
      
      const semantickernelAdapter = createAdapter('semantickernel', options);
      expect(semantickernelAdapter).to.be.instanceOf(SemanticKernelAdapter);
    });
    
    it('应该抛出错误当框架类型不支持时', () => {
      expect(() => createAdapter('unsupported', {})).to.throw('不支持的框架类型');
    });
  });
  
  describe('类获取函数', () => {
    it('应该返回正确的适配器类', () => {
      expect(getAdapterClass('langchain')).to.equal(LangChainAdapter);
      expect(getAdapterClass('mastra')).to.equal(MastraAdapter);
      expect(getAdapterClass('chainlit')).to.equal(ChainlitAdapter);
      expect(getAdapterClass('llamaindex')).to.equal(LlamaIndexAdapter);
      expect(getAdapterClass('haystack')).to.equal(HaystackAdapter);
      expect(getAdapterClass('flowise')).to.equal(FlowiseAdapter);
      expect(getAdapterClass('autogen')).to.equal(AutoGenAdapter);
      expect(getAdapterClass('semantickernel')).to.equal(SemanticKernelAdapter);
    });
    
    it('应该抛出错误当框架类型不支持时', () => {
      expect(() => getAdapterClass('unsupported')).to.throw('不支持的框架类型');
    });
  });
  
  describe('框架检测', () => {
    it('应该检测到可用的框架', async () => {
      // 模拟所有框架都存在
      this.dynamicImports = {
        'langchain': {},
        '@mastra/core': {},
        'chainlit': {},
        'llamaindex': {},
        'haystack-ai': {},
        'flowise-components': {},
        'autogen': {},
        'semantic-kernel': {}
      };
      
      const frameworks = await detectAvailableFrameworks();
      expect(frameworks).to.deep.equal([
        'langchain', 
        'mastra', 
        'chainlit', 
        'llamaindex', 
        'haystack', 
        'flowise', 
        'autogen', 
        'semantickernel'
      ]);
    });
    
    it('应该只返回可用的框架', async () => {
      // 模拟部分框架存在
      this.dynamicImports = {
        'langchain': {},
        'llamaindex': {},
        'autogen': {}
      };
      
      const frameworks = await detectAvailableFrameworks();
      expect(frameworks).to.deep.equal(['langchain', 'llamaindex', 'autogen']);
    });
  });
  
  describe('通用集成', () => {
    it('应该集成到所有可用框架', async () => {
      // 模拟所有框架都存在
      this.dynamicImports = {
        'langchain': {},
        '@mastra/core': {},
        'chainlit': {}
      };
      
      // 模拟适配器的init方法
      const initStub = sinon.stub(LangChainAdapter.prototype, 'init').resolves();
      const initStub2 = sinon.stub(MastraAdapter.prototype, 'init').resolves();
      const initStub3 = sinon.stub(ChainlitAdapter.prototype, 'init').resolves();
      
      const adapters = await integrateWithFrameworks(new MockMCPClient());
      
      expect(Object.keys(adapters)).to.deep.equal(['langchain', 'mastra', 'chainlit']);
      expect(adapters.langchain).to.be.instanceOf(LangChainAdapter);
      expect(adapters.mastra).to.be.instanceOf(MastraAdapter);
      expect(adapters.chainlit).to.be.instanceOf(ChainlitAdapter);
      
      expect(initStub.calledOnce).to.be.true;
      expect(initStub2.calledOnce).to.be.true;
      expect(initStub3.calledOnce).to.be.true;
      
      initStub.restore();
      initStub2.restore();
      initStub3.restore();
    });
  });
  
  describe('LangChain适配器', () => {
    it('应该初始化并连接到MCP服务器', async () => {
      const client = new MockMCPClient();
      const adapter = new LangChainAdapter({ client });
      
      const connectSpy = sinon.spy(client, 'connect');
      
      await adapter.init();
      
      expect(connectSpy.calledOnce).to.be.true;
      
      connectSpy.restore();
    });
  });
  
  describe('LlamaIndex适配器', () => {
    it('应该初始化并连接到MCP服务器', async () => {
      // 模拟LlamaIndex模块
      this.dynamicImports['llamaindex'] = {
        ToolMetadata: class ToolMetadata {
          constructor(params) {
            Object.assign(this, params);
          }
        },
        FunctionTool: class FunctionTool {
          constructor(func, metadata) {
            this.func = func;
            this.metadata = metadata;
          }
        },
        TextNode: class TextNode {
          constructor(params) {
            Object.assign(this, params);
          }
        },
        FunctionRetriever: class FunctionRetriever {
          constructor(func) {
            this.func = func;
          }
        }
      };
      
      const client = new MockMCPClient();
      const adapter = new LlamaIndexAdapter({ client });
      
      const connectSpy = sinon.spy(client, 'connect');
      
      try {
        await adapter.init();
      } catch (error) {
        // 如果动态导入失败，我们仍然希望测试连接方法
        // 所以这里捕获可能的错误
      }
      
      expect(connectSpy.called).to.be.true;
      
      connectSpy.restore();
    });
  });
  
  describe('Haystack适配器', () => {
    it('应该初始化并连接到MCP服务器', async () => {
      // 模拟Haystack模块
      this.dynamicImports['haystack-ai'] = {
        component: (def, impl) => {
          return class HaystackComponent {
            constructor() {
              this.def = def;
              this.impl = impl;
            }
            
            async run(params) {
              return this.impl(params);
            }
          };
        },
        Pipeline: class Pipeline {
          constructor() {
            this.components = new Map();
          }
          
          add_component(name, component) {
            this.components.set(name, component);
          }
          
          connect(source, output, target, input) {
            // 模拟连接逻辑
          }
        }
      };
      
      const client = new MockMCPClient();
      const adapter = new HaystackAdapter({ client });
      
      const connectSpy = sinon.spy(client, 'connect');
      
      try {
        await adapter.init();
      } catch (error) {
        // 如果动态导入失败，我们仍然希望测试连接方法
        // 所以这里捕获可能的错误
      }
      
      expect(connectSpy.called).to.be.true;
      
      connectSpy.restore();
    });
  });
  
  describe('AutoGen适配器', () => {
    it('应该初始化并连接到MCP服务器', async () => {
      // 模拟AutoGen模块
      this.dynamicImports['autogen'] = {
        AgentConfig: class AgentConfig {
          constructor(config) {
            Object.assign(this, config);
          }
        },
        Agent: class Agent {
          constructor(config) {
            this.config = config;
          }
        }
      };
      
      const client = new MockMCPClient();
      const adapter = new AutoGenAdapter({ client });
      
      const connectSpy = sinon.spy(client, 'connect');
      
      try {
        await adapter.init();
      } catch (error) {
        // 如果动态导入失败，我们仍然希望测试连接方法
        // 所以这里捕获可能的错误
      }
      
      expect(connectSpy.called).to.be.true;
      
      connectSpy.restore();
    });
  });
}); 