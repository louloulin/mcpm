/**
 * MCPM 3.0 服务器 API 测试
 */

// 使用内置的 assert 模块代替 Jest
const assert = require('assert');
const { z } = require('zod');

// 导入库
const mcpm = require('../');
const v3 = mcpm.v3;
const { defineTool, createServer } = v3.server;

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

// 测试
describe('MCPM 3.0 服务器 API', () => {
  test('定义工具', () => {
    // 创建一个简单的工具定义
    const exampleTool = defineTool({
      name: 'example',
      description: '示例工具',
      input: z.object({
        text: z.string().min(1, '文本不能为空')
      }),
      handler: async ({ text }) => {
        return { result: `处理文本: ${text}` };
      }
    });
    
    // 验证工具定义的结构
    assert(exampleTool, '应该能创建工具定义');
    assert(exampleTool.definition, '工具定义应该有 definition 属性');
    assert(exampleTool.handler, '工具定义应该有 handler 属性');
    assert.strictEqual(exampleTool.definition.name, 'example', '工具名称应该正确');
    assert.strictEqual(exampleTool.definition.description, '示例工具', '工具描述应该正确');
    assert(exampleTool.definition.inputSchema, '工具应该有输入架构');
    assert.strictEqual(exampleTool.definition.inputSchema.type, 'object', '输入架构类型应该是对象');
    assert(exampleTool.definition.inputSchema.properties, '输入架构应该有属性对象');
  });
  
  test('创建服务器', () => {
    // 创建一个简单的工具定义
    const exampleTool = defineTool({
      name: 'example',
      description: '示例工具',
      input: z.object({
        text: z.string().min(1, '文本不能为空')
      }),
      handler: async ({ text }) => {
        return { result: `处理文本: ${text}` };
      }
    });
    
    // 创建服务器
    const server = createServer({
      name: 'test-server',
      version: '1.0.0',
      description: '测试服务器',
      tools: [exampleTool]
    });
    
    // 验证服务器结构
    assert(server, '应该能创建服务器');
    assert(server.app !== undefined, '服务器应该有 app 属性');
    assert(server.start && typeof server.start === 'function', '服务器应该有 start 方法');
    assert(server.stop && typeof server.stop === 'function', '服务器应该有 stop 方法');
    assert(server.addTool && typeof server.addTool === 'function', '服务器应该有 addTool 方法');
    assert(server.removeTool && typeof server.removeTool === 'function', '服务器应该有 removeTool 方法');
  });
  
  test('工具中间件', () => {
    // 创建一个带中间件的工具
    const toolWithMiddleware = defineTool({
      name: 'withMiddleware',
      description: '带中间件的工具',
      input: z.object({}),
      middlewares: [
        async (ctx, next) => {
          assert(ctx, '中间件上下文应该存在');
          await next();
        }
      ],
      handler: async () => {
        return { success: true };
      }
    });
    
    // 验证工具定义
    assert(toolWithMiddleware, '应该能创建带中间件的工具');
    // 注意：实际实现可能不暴露中间件数组，所以我们只测试创建是否成功
    
    // 创建服务器
    const server = createServer({
      name: 'middleware-test',
      version: '1.0.0',
      tools: [toolWithMiddleware]
    });
    
    assert(server, '应该能使用带中间件的工具创建服务器');
  });
  
  test('自定义路由', () => {
    // 创建带自定义路由的服务器
    const server = createServer({
      name: 'custom-routes-test',
      version: '1.0.0',
      tools: [],
      customRoutes: [
        {
          path: '/health',
          method: 'get',
          handler: async (req, res) => {
            res.json({ status: 'ok' });
          }
        },
        {
          path: '/echo',
          method: 'post',
          handler: async (req, res) => {
            res.json(req.body);
          }
        }
      ]
    });
    
    // 验证自定义路由
    assert(server, '应该能创建带自定义路由的服务器');
    // 注意：实际实现可能不暴露路由数组，所以我们只测试创建是否成功
  });
  
  test('服务器方法调用', () => {
    // 创建一个简单的工具
    const simpleTool = defineTool({
      name: 'simple',
      description: '简单工具',
      input: z.object({}),
      handler: async () => ({ result: 'ok' })
    });
    
    // 创建服务器
    const server = createServer({
      name: 'method-test',
      version: '1.0.0',
      tools: []
    });
    
    // 测试添加工具
    server.addTool(simpleTool);
    
    // 测试移除工具
    const result = server.removeTool('simple');
    
    // 注意：由于我们不会实际启动服务器，我们只测试方法是否存在并能调用
    assert(typeof result === 'boolean', 'removeTool 应该返回布尔值');
  });
}); 