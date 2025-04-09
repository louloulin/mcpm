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
    
    it('应该正确转换工具为LangChain格式', async () => {
      // 模拟LangChain模块
      this.dynamicImports['langchain'] = {
        Tool: class Tool {
          constructor(params) {
            this.name = params.name;
            this.description = params.description;
            this.func = params.func;
          }
        }
      };
      
      const client = new MockMCPClient();
      const adapter = new LangChainAdapter({ client });
      
      await adapter.init();
      
      // 获取工具
      const tools = await adapter.createAllTools();
      
      expect(tools).to.be.an('array');
      expect(tools.length).to.equal(2);
      expect(tools[0].name).to.equal('textAnalyzer');
      expect(tools[1].name).to.equal('imageGenerator');
      
      // 测试工具调用
      const result = await tools[0].func({ text: 'Test text' });
      expect(result).to.include('Mocked result for textAnalyzer');
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
    
    it('应该正确创建检索器', async () => {
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
      
      await adapter.init();
      
      const retriever = await adapter.createRetriever('textAnalyzer');
      
      expect(retriever).to.be.an('object');
      expect(retriever.func).to.be.a('function');
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
    
    it('应该正确创建管道', async () => {
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
            this.connections = [];
          }
          
          add_component(name, component) {
            this.components.set(name, component);
          }
          
          connect(source, output, target, input) {
            this.connections.push({ source, output, target, input });
          }
          
          async run(params) {
            // 模拟管道运行
            const results = {};
            for (const [name, component] of this.components.entries()) {
              results[name] = await component.run(params);
            }
            return results;
          }
        }
      };
      
      const client = new MockMCPClient();
      const adapter = new HaystackAdapter({ client, autoRegisterNodes: true });
      
      await adapter.init();
      
      const pipeline = await adapter.createPipeline(['textAnalyzer', 'imageGenerator']);
      
      expect(pipeline).to.be.an('object');
      expect(pipeline.components.size).to.equal(2);
      expect(pipeline.components.has('textAnalyzer')).to.be.true;
      expect(pipeline.components.has('imageGenerator')).to.be.true;
    });
  });
  
  describe('Flowise适配器', () => {
    it('应该初始化并连接到MCP服务器', async () => {
      // 模拟Flowise模块
      this.dynamicImports['flowise-components'] = {
        INode: class INode {},
        INodeData: class INodeData {},
        INodeParams: class INodeParams {}
      };
      
      const client = new MockMCPClient();
      const adapter = new FlowiseAdapter({ client });
      
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
    
    it('应该正确创建组件节点', async () => {
      // 模拟Flowise模块
      this.dynamicImports['flowise-components'] = {
        INode: class INode {},
        INodeData: class INodeData {},
        INodeParams: class INodeParams {}
      };
      
      const client = new MockMCPClient();
      const adapter = new FlowiseAdapter({ client });
      
      await adapter.init();
      
      const component = await adapter.createComponent('textAnalyzer');
      
      expect(component).to.be.an('object');
      expect(component.label).to.equal('MCP Text Analyzer');
      expect(component.name).to.equal('mcpTextAnalyzer');
      expect(component.type).to.equal('MCPTool');
      expect(component.inputs).to.be.an('array');
      expect(component.outputs).to.be.an('array');
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
    
    it('应该创建增强的代理配置', async () => {
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
      
      await adapter.init();
      
      const config = adapter.createAgentConfig({
        name: "TestAgent",
        llm: { model: "gpt-4" }
      });
      
      expect(config).to.be.an('object');
      expect(config.name).to.equal('TestAgent');
      expect(config.llm.model).to.equal('gpt-4');
      expect(config.tools).to.be.an('array');
      expect(config.tools.length).to.equal(2); // textAnalyzer和imageGenerator
    });
  });
  
  describe('SemanticKernel适配器', () => {
    it('应该初始化并连接到MCP服务器', async () => {
      // 模拟Semantic Kernel模块
      this.dynamicImports['semantic-kernel'] = {
        Kernel: class Kernel {
          constructor() {
            this.plugins = new Map();
          }
        },
        KernelPlugin: class KernelPlugin {
          constructor(name) {
            this.name = name;
            this.functions = new Map();
          }
          
          addFunction(name, func) {
            this.functions.set(name, func);
            return this;
          }
        }
      };
      
      const client = new MockMCPClient();
      const adapter = new SemanticKernelAdapter({ client });
      
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
    
    it('应该创建有效的插件和技能', async () => {
      // 模拟Semantic Kernel模块
      this.dynamicImports['semantic-kernel'] = {
        Kernel: class Kernel {
          constructor() {
            this.plugins = {
              add: function(plugin) {
                this[plugin.name] = plugin;
              }
            };
          }
        },
        KernelPlugin: class KernelPlugin {
          constructor(name) {
            this.name = name;
            this.functions = new Map();
          }
          
          addFunction(name, func) {
            this.functions.set(name, { name, execute: func });
            return this;
          }
        }
      };
      
      const client = new MockMCPClient();
      const adapter = new SemanticKernelAdapter({ client, pluginNamePrefix: 'MCP' });
      
      await adapter.init();
      
      const skill = await adapter.createSkill();
      
      expect(skill).to.be.an('object');
      expect(skill.name).to.equal('MCPTools');
      expect(skill.functions.size).to.equal(2);
      expect(skill.functions.has('textAnalyzer')).to.be.true;
      expect(skill.functions.has('imageGenerator')).to.be.true;
      
      // 测试导入到内核
      const kernel = new this.dynamicImports['semantic-kernel'].Kernel();
      await adapter.importPluginsToKernel(kernel);
      
      expect(kernel.plugins.MCPTools).to.exist;
    });
  });
  
  describe('通用工具功能', () => {
    it('应该正确处理参数映射', async () => {
      const client = new MockMCPClient();
      const adapter = new LangChainAdapter({ client });
      
      await adapter.init();
      
      const customMapper = (params) => ({
        text: params.content,
        options: { language: params.lang || 'auto' }
      });
      
      const tool = await adapter.createTool({
        toolName: 'textAnalyzer',
        paramsMapper: customMapper
      });
      
      // 模拟工具调用来测试参数映射
      const callToolSpy = sinon.spy(client, 'callTool');
      
      await tool.func({ content: 'Hello', lang: 'en' });
      
      expect(callToolSpy.calledOnce).to.be.true;
      expect(callToolSpy.firstCall.args[0]).to.equal('textAnalyzer');
      expect(callToolSpy.firstCall.args[1]).to.deep.equal({
        text: 'Hello',
        options: { language: 'en' }
      });
      
      callToolSpy.restore();
    });
    
    it('应该正确处理结果映射', async () => {
      const client = new MockMCPClient();
      const adapter = new LangChainAdapter({ client });
      
      await adapter.init();
      
      const resultMapper = (result) => ({
        sentiment: result.result.includes('positive') ? 'positive' : 'neutral',
        original: result
      });
      
      const tool = await adapter.createTool({
        toolName: 'textAnalyzer',
        resultMapper
      });
      
      // 模拟callTool以返回特定结果
      sinon.stub(client, 'callTool').resolves({
        success: true,
        data: {
          result: 'positive sentiment detected',
          toolName: 'textAnalyzer',
          params: { text: 'Test' }
        }
      });
      
      const result = await tool.func({ text: 'Test' });
      
      expect(result).to.be.an('object');
      expect(result.sentiment).to.equal('positive');
      expect(result.original).to.be.an('object');
      
      client.callTool.restore();
    });
  });
}); 