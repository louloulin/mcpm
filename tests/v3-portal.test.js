/**
 * MCPM 3.0 开发者门户测试
 * 
 * 测试门户的功能和API
 */

const assert = require('assert');
const { describe, test, before, after } = require('./test-framework');
const http = require('http');
const DevPortal = require('../lib/v3/portal');

describe('MCPM 3.0 开发者门户', () => {
  let portal = null;
  
  // 在测试前创建门户实例
  before(async () => {
    portal = new DevPortal({
      port: 3200,
      enableAuth: true
    });
    await portal.init();
    await portal.start();
  });
  
  // 测试结束后关闭门户
  after(async () => {
    if (portal) {
      await portal.stop();
    }
  });
  
  test('模块导出', () => {
    assert.strictEqual(typeof DevPortal, 'function', 'DevPortal应该是一个构造函数');
    assert.strictEqual(typeof DevPortal.prototype.init, 'function', 'DevPortal应有init方法');
    assert.strictEqual(typeof DevPortal.prototype.start, 'function', 'DevPortal应有start方法');
    assert.strictEqual(typeof DevPortal.prototype.stop, 'function', 'DevPortal应有stop方法');
  });
  
  test('门户配置', () => {
    const defaultPortal = new DevPortal();
    assert.strictEqual(defaultPortal.options.port, 8080, '默认端口应为8080');
    assert.strictEqual(defaultPortal.options.enableAuth, true, '默认应启用身份验证');
    
    const customPortal = new DevPortal({
      port: 3000,
      enableAuth: false,
      apiBasePath: '/custom/api'
    });
    assert.strictEqual(customPortal.options.port, 3000, '自定义端口应正确设置');
    assert.strictEqual(customPortal.options.enableAuth, false, '应禁用身份验证');
    assert.strictEqual(customPortal.options.apiBasePath, '/custom/api', '自定义API路径应正确设置');
  });
  
  test('服务器启动和停止', async () => {
    const testPortal = new DevPortal({
      port: 3201
    });
    
    await testPortal.init();
    await testPortal.start();
    
    // 检查服务器是否在运行
    try {
      await new Promise((resolve, reject) => {
        http.get('http://localhost:3201', (res) => {
          assert.strictEqual(res.statusCode, 200, '服务器应返回200状态码');
          resolve();
        }).on('error', reject);
      });
    } finally {
      await testPortal.stop();
    }
  });
  
  test('API端点 - 登录', async () => {
    // 创建测试用户
    portal.users.set('test-user', {
      id: 'test-user',
      username: 'testuser',
      password: 'password123',
      role: 'user'
    });
    
    // 测试登录API
    const loginResponse = await makeRequest('/api/portal/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username: 'testuser',
        password: 'password123'
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    assert.strictEqual(loginResponse.status, 200, '登录应成功');
    assert.ok(loginResponse.data.token, '应返回令牌');
    assert.strictEqual(loginResponse.data.user.username, 'testuser', '应返回用户信息');
  });
  
  test('API端点 - 服务管理', async () => {
    // 获取登录令牌
    const loginResponse = await makeRequest('/api/portal/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username: 'testuser',
        password: 'password123'
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const token = loginResponse.data.token;
    
    // 创建服务
    const createResponse = await makeRequest('/api/portal/services', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Service',
        url: 'http://localhost:3000',
        description: 'A test service'
      }),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    assert.strictEqual(createResponse.status, 201, '创建服务应成功');
    assert.strictEqual(createResponse.data.name, 'Test Service', '应返回创建的服务');
    
    const serviceId = createResponse.data.id;
    
    // 获取服务列表
    const listResponse = await makeRequest('/api/portal/services', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    assert.strictEqual(listResponse.status, 200, '获取服务列表应成功');
    assert.ok(Array.isArray(listResponse.data), '应返回服务数组');
    assert.strictEqual(listResponse.data.length, 1, '应有一个服务');
    
    // 获取单个服务
    const getResponse = await makeRequest(`/api/portal/services/${serviceId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    assert.strictEqual(getResponse.status, 200, '获取服务应成功');
    assert.strictEqual(getResponse.data.id, serviceId, '应返回正确的服务');
    
    // 更新服务
    const updateResponse = await makeRequest(`/api/portal/services/${serviceId}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: 'Updated Service',
        status: 'running'
      }),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    assert.strictEqual(updateResponse.status, 200, '更新服务应成功');
    assert.strictEqual(updateResponse.data.name, 'Updated Service', '应更新服务名称');
    assert.strictEqual(updateResponse.data.status, 'running', '应更新服务状态');
    
    // 删除服务
    const deleteResponse = await makeRequest(`/api/portal/services/${serviceId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    assert.strictEqual(deleteResponse.status, 204, '删除服务应成功');
    
    // 验证删除
    const listAfterDeleteResponse = await makeRequest('/api/portal/services', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    assert.strictEqual(listAfterDeleteResponse.data.length, 0, '删除后应没有服务');
  });
  
  /**
   * 发送HTTP请求的辅助函数
   * @param {string} path - 请求路径
   * @param {Object} options - 请求选项
   * @returns {Promise<Object>} - 响应对象
   */
  async function makeRequest(path, options = {}) {
    return new Promise((resolve, reject) => {
      const requestOptions = {
        hostname: 'localhost',
        port: 3200,
        path,
        method: options.method || 'GET',
        headers: options.headers || {}
      };
      
      const req = http.request(requestOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          const response = {
            status: res.statusCode,
            headers: res.headers,
            data: null
          };
          
          if (data && res.headers['content-type']?.includes('application/json')) {
            try {
              response.data = JSON.parse(data);
            } catch (e) {
              reject(new Error(`Failed to parse JSON: ${e.message}`));
              return;
            }
          }
          
          resolve(response);
        });
      });
      
      req.on('error', reject);
      
      if (options.body) {
        req.write(options.body);
      }
      
      req.end();
    });
  }
});

// 如果直接运行此文件
if (require.main === module) {
  // 执行测试
  describe.run().then(
    () => console.log('所有测试通过'),
    (err) => {
      console.error('测试失败:', err);
      process.exit(1);
    }
  );
} 