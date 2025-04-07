/**
 * MCPM 3.0 基本功能测试
 */

// 使用内置的 assert 模块代替 Jest
const assert = require('assert');
const { z } = require('zod');

// 使用正确的路径导入库
const mcpm = require('../');
const v3 = mcpm.v3;

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
describe('MCPM 3.0 API', () => {
  test('导出正确的模块结构', () => {
    assert(v3, '应该导出 v3 模块');
    assert(v3.client, '应该导出 client 子模块');
    assert(v3.registry, '应该导出 registry 子模块');
    
    // 客户端API
    assert(v3.client.MCPClient, '应该导出 MCPClient 类');
    assert(typeof v3.client.MCPClient === 'function', 'MCPClient 应该是构造函数');
    
    // 注册表API
    assert(v3.registry.FederatedRegistry, '应该导出 FederatedRegistry 类');
    assert(v3.registry.RemoteRegistry, '应该导出 RemoteRegistry 类');
  });
  
  test('MCPClient 基本功能', () => {
    const { MCPClient } = v3.client;
    const client = new MCPClient({
      server: 'http://localhost:3000',
      debug: true
    });
    
    assert(client, '应该能创建客户端实例');
    assert(client.tools, '应该存在 tools 代理');
    
    // 确保工具代理正常工作，但不会真正连接服务器
    assert(typeof client.tools.testTool === 'function', '工具代理应该生成函数');
    
    // 测试清除缓存
    let error = null;
    try {
      client.clearCache();
    } catch (err) {
      error = err;
    }
    assert(!error, '清除缓存不应抛出错误');
    
    // 测试关闭
    error = null;
    try {
      client.close();
    } catch (err) {
      error = err;
    }
    assert(!error, '关闭客户端不应抛出错误');
  });
  
  test('FederatedRegistry 基本功能', () => {
    const { FederatedRegistry, RemoteRegistry } = v3.registry;
    const registry = new FederatedRegistry();
    
    assert(registry, '应该能创建联合注册表实例');
    
    // 添加源
    registry.addSource('test', new RemoteRegistry({
      url: 'http://localhost:5000'
    }));
    
    // 获取所有源
    const sources = registry.getSources();
    assert(sources.length === 1, '注册表源数量应为 1');
    assert(sources[0].id === 'test', '注册表源 ID 应为 test');
    
    // 获取默认源
    registry.setDefaultSource('test');
    const defaultSource = registry.getDefaultSource();
    assert(defaultSource === 'test', '默认源应为 test');
  });
}); 