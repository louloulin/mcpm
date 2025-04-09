/**
 * MCPM 3.0 托管服务选项测试
 * 
 * 测试托管服务选项功能，包括服务创建、部署和管理
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');
const nock = require('nock'); // HTTP请求模拟
const HostingService = require('../lib/v3/community/hosting');

describe('托管服务选项测试', () => {
  let hostingService;
  let tempDir;
  const mockApiUrl = 'https://hosting.mcpm.io';
  const mockToken = 'test-token-12345';

  // 设置模拟API响应
  const setupMockApi = () => {
    // 服务列表
    nock(mockApiUrl)
      .get('/api/v1/services')
      .reply(200, [
        {
          id: 'service-1',
          name: 'test-service-1',
          description: '测试服务1',
          status: 'running',
          tier: 'standard',
          createdAt: Date.now() - 3600000,
          updatedAt: Date.now() - 1800000
        },
        {
          id: 'service-2',
          name: 'test-service-2',
          description: '测试服务2',
          status: 'stopped',
          tier: 'premium',
          createdAt: Date.now() - 7200000,
          updatedAt: Date.now() - 3600000
        }
      ]);
    
    // 部署列表
    nock(mockApiUrl)
      .get('/api/v1/deployments')
      .reply(200, [
        {
          id: 'deployment-1',
          serviceId: 'service-1',
          status: 'success',
          createdAt: Date.now() - 3000000,
          completedAt: Date.now() - 2900000
        },
        {
          id: 'deployment-2',
          serviceId: 'service-2',
          status: 'failed',
          createdAt: Date.now() - 5000000,
          completedAt: Date.now() - 4900000,
          error: '构建失败'
        }
      ]);
    
    // 使用数据
    nock(mockApiUrl)
      .get('/api/v1/usage')
      .reply(200, {
        'service-1': {
          cpu: 15.5,
          memory: 128.3,
          requests: 1250,
          bandwidth: 2048
        },
        'service-2': {
          cpu: 0,
          memory: 0,
          requests: 0,
          bandwidth: 0
        }
      });
    
    // 创建服务
    nock(mockApiUrl)
      .post('/api/v1/services')
      .reply(201, (uri, requestBody) => {
        const data = typeof requestBody === 'string' ? JSON.parse(requestBody) : requestBody;
        return {
          id: `service-${Date.now()}`,
          ...data,
          status: 'pending',
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
      });
    
    // 部署服务
    nock(mockApiUrl)
      .post('/api/v1/deployments')
      .reply(201, (uri, requestBody) => {
        const data = typeof requestBody === 'string' ? JSON.parse(requestBody) : requestBody;
        return {
          id: `deployment-${Date.now()}`,
          ...data,
          status: 'pending',
          createdAt: Date.now()
        };
      });
    
    // 价格套餐
    nock(mockApiUrl)
      .get('/api/v1/pricing')
      .reply(200, {
        standard: {
          name: 'Standard',
          price: 5,
          description: '标准套餐',
          limits: {
            cpu: 1,
            memory: 512,
            requests: 100000,
            bandwidth: 100
          }
        },
        premium: {
          name: 'Premium',
          price: 20,
          description: '高级套餐',
          limits: {
            cpu: 2,
            memory: 1024,
            requests: 500000,
            bandwidth: 500
          }
        },
        enterprise: {
          name: 'Enterprise',
          price: 100,
          description: '企业套餐',
          limits: {
            cpu: 4,
            memory: 4096,
            requests: 5000000,
            bandwidth: 2000
          }
        }
      });
    
    // 服务域名
    nock(mockApiUrl)
      .get('/api/v1/services/service-1/domains')
      .reply(200, [
        {
          domain: 'service-1.mcpm.io',
          type: 'system',
          verified: true
        },
        {
          domain: 'example.com',
          type: 'custom',
          verified: true
        }
      ]);
    
    // 服务日志
    nock(mockApiUrl)
      .get('/api/v1/services/service-1/logs')
      .query(true)
      .reply(200, [
        {
          timestamp: Date.now() - 3600000,
          level: 'info',
          message: '服务已启动'
        },
        {
          timestamp: Date.now() - 1800000,
          level: 'error',
          message: '数据库连接错误'
        }
      ]);
    
    // 服务环境变量
    nock(mockApiUrl)
      .get('/api/v1/services/service-1/environment')
      .reply(200, {
        NODE_ENV: 'production',
        DATABASE_URL: 'postgres://user:pass@host/db',
        API_KEY: '****'
      });
    
    // 更新服务
    nock(mockApiUrl)
      .patch('/api/v1/services/service-1')
      .reply(200, (uri, requestBody) => {
        const data = typeof requestBody === 'string' ? JSON.parse(requestBody) : requestBody;
        return {
          id: 'service-1',
          name: 'test-service-1',
          description: data.description || '测试服务1',
          status: 'running',
          tier: 'standard',
          createdAt: Date.now() - 3600000,
          updatedAt: Date.now()
        };
      });
    
    // 删除服务
    nock(mockApiUrl)
      .delete('/api/v1/services/service-2')
      .reply(204);
    
    // 重启服务
    nock(mockApiUrl)
      .post('/api/v1/services/service-1/restart')
      .reply(200, {
        success: true,
        restarted: true,
        message: '服务重启中'
      });
    
    // 添加自定义域名
    nock(mockApiUrl)
      .post('/api/v1/services/service-1/domains')
      .reply(201, (uri, requestBody) => {
        const data = typeof requestBody === 'string' ? JSON.parse(requestBody) : requestBody;
        return {
          domain: data.domain,
          type: 'custom',
          verified: false,
          dnsRecords: [
            {
              type: 'CNAME',
              name: data.domain,
              value: 'verify.mcpm.io'
            }
          ]
        };
      });
    
    // 删除自定义域名
    nock(mockApiUrl)
      .delete('/api/v1/services/service-1/domains/example.org')
      .reply(204);
    
    // 设置环境变量
    nock(mockApiUrl)
      .put('/api/v1/services/service-1/environment')
      .reply(200, (uri, requestBody) => {
        return {
          success: true,
          updated: true,
          requiresRestart: true
        };
      });
  };

  // 测试前设置
  before(async () => {
    // 创建临时目录
    tempDir = path.join(os.tmpdir(), `mcpm-hosting-test-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });

    // 设置模拟API
    setupMockApi();

    // 创建托管服务实例
    hostingService = new HostingService({
      storageDir: tempDir,
      apiBaseUrl: `${mockApiUrl}/api/v1`,
      token: mockToken,
      autoRefresh: false // 禁用自动刷新以便于测试
    });

    // 初始化托管服务
    await hostingService.init();
  });

  // 测试后清理
  after(async () => {
    // 清理临时目录
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.error('清理临时目录失败:', error);
    }
    
    // 清理所有nock模拟
    nock.cleanAll();
  });

  // 测试HostingService类导出
  it('应正确导出HostingService类', () => {
    assert.strictEqual(typeof HostingService, 'function', 'HostingService应该是一个类');
    assert.strictEqual(typeof hostingService.init, 'function', '应该有init方法');
    assert.strictEqual(typeof hostingService.getServices, 'function', '应该有getServices方法');
    assert.strictEqual(typeof hostingService.createService, 'function', '应该有createService方法');
    assert.strictEqual(typeof hostingService.deployService, 'function', '应该有deployService方法');
  });

  // 测试初始化
  it('应正确初始化', () => {
    assert.strictEqual(hostingService.isInitialized, true, '应该已初始化');
    assert.strictEqual(hostingService.services.size, 2, '应该加载了2个服务');
    assert.strictEqual(hostingService.deployments.size, 2, '应该加载了2个部署');
    assert.strictEqual(hostingService.usageData.size, 2, '应该加载了2个服务的使用数据');
  });

  // 测试获取服务列表
  it('应正确获取服务列表', () => {
    const services = hostingService.getServices();
    assert.strictEqual(services.length, 2, '应该有2个服务');
    assert.strictEqual(services[0].name, 'test-service-1', '第一个服务名称应匹配');
    assert.strictEqual(services[1].name, 'test-service-2', '第二个服务名称应匹配');
  });

  // 测试过滤服务
  it('应正确过滤服务', () => {
    // 按状态过滤
    const runningServices = hostingService.getServices({ status: ['running'] });
    assert.strictEqual(runningServices.length, 1, '应该有1个运行中的服务');
    assert.strictEqual(runningServices[0].status, 'running', '服务状态应为running');
    
    // 按套餐过滤
    const premiumServices = hostingService.getServices({ tier: 'premium' });
    assert.strictEqual(premiumServices.length, 1, '应该有1个高级套餐服务');
    assert.strictEqual(premiumServices[0].tier, 'premium', '服务套餐应为premium');
    
    // 按名称搜索
    const searchResults = hostingService.getServices({ search: 'service-1' });
    assert.strictEqual(searchResults.length, 1, '搜索应匹配1个服务');
    assert.strictEqual(searchResults[0].id, 'service-1', '搜索结果ID应匹配');
  });

  // 测试获取服务详情
  it('应正确获取服务详情', () => {
    const service = hostingService.getService('service-1');
    assert.ok(service, '应该找到服务');
    assert.strictEqual(service.id, 'service-1', '服务ID应匹配');
    assert.strictEqual(service.name, 'test-service-1', '服务名称应匹配');
    assert.strictEqual(service.status, 'running', '服务状态应匹配');
  });

  // 测试获取服务部署
  it('应正确获取服务部署', () => {
    const deployments = hostingService.getServiceDeployments('service-1');
    assert.strictEqual(deployments.length, 1, '应该有1个部署');
    assert.strictEqual(deployments[0].id, 'deployment-1', '部署ID应匹配');
    assert.strictEqual(deployments[0].status, 'success', '部署状态应匹配');
  });

  // 测试获取服务使用数据
  it('应正确获取服务使用数据', () => {
    const usage = hostingService.getServiceUsage('service-1');
    assert.ok(usage, '应该找到使用数据');
    assert.strictEqual(usage.cpu, 15.5, 'CPU使用应匹配');
    assert.strictEqual(usage.memory, 128.3, '内存使用应匹配');
    assert.strictEqual(usage.requests, 1250, '请求数应匹配');
  });

  // 测试创建服务
  it('应正确创建服务', async () => {
    const serviceData = {
      name: 'new-test-service',
      description: '新测试服务',
      repositoryUrl: 'https://github.com/example/test-service',
      branch: 'main'
    };

    const result = await hostingService.createService(serviceData);

    assert.strictEqual(result.success, true, '创建应成功');
    assert.ok(result.service, '应返回服务数据');
    assert.strictEqual(result.service.name, serviceData.name, '服务名称应匹配');
    assert.strictEqual(result.service.description, serviceData.description, '服务描述应匹配');
    assert.strictEqual(result.service.status, 'pending', '服务状态应为pending');
  });

  // 测试服务数据验证
  it('应验证服务数据', () => {
    // 缺少必需字段
    assert.throws(() => {
      hostingService.validateServiceData({
        name: 'test-service'
        // 缺少repositoryUrl和branch
      });
    }, /缺少必需字段/, '应检测到缺少必需字段');
    
    // 无效的名称格式
    assert.throws(() => {
      hostingService.validateServiceData({
        name: 'test service', // 包含空格
        repositoryUrl: 'https://github.com/example/test-service',
        branch: 'main'
      });
    }, /无效的名称格式/, '应检测到无效的名称格式');
  });
  
  // 测试部署服务
  it('应正确部署服务', async () => {
    const deployData = {
      commitId: 'abc123',
      deployMessage: '测试部署'
    };

    const result = await hostingService.deployService('service-1', deployData);

    assert.strictEqual(result.success, true, '部署应成功');
    assert.ok(result.deployment, '应返回部署数据');
    assert.strictEqual(result.deployment.serviceId, 'service-1', '服务ID应匹配');
    assert.strictEqual(result.deployment.commitId, deployData.commitId, '提交ID应匹配');
    assert.strictEqual(result.deployment.deployMessage, deployData.deployMessage, '部署消息应匹配');
    assert.strictEqual(result.deployment.status, 'pending', '部署状态应为pending');
  });

  // 测试获取价格套餐
  it('应正确获取价格套餐', async () => {
    const result = await hostingService.getPricingTiers();

    assert.strictEqual(result.success, true, '获取套餐应成功');
    assert.ok(result.pricing, '应返回套餐数据');
    assert.ok(result.pricing.standard, '应包含标准套餐');
    assert.ok(result.pricing.premium, '应包含高级套餐');
    assert.ok(result.pricing.enterprise, '应包含企业套餐');
  });

  // 测试获取服务域名
  it('应正确获取服务域名', async () => {
    const result = await hostingService.getServiceDomains('service-1');

    assert.strictEqual(result.success, true, '获取域名应成功');
    assert.ok(Array.isArray(result.domains), '应返回域名数组');
    assert.strictEqual(result.domains.length, 2, '应有2个域名');
    assert.strictEqual(result.domains[0].domain, 'service-1.mcpm.io', '系统域名应匹配');
    assert.strictEqual(result.domains[1].domain, 'example.com', '自定义域名应匹配');
  });

  // 测试获取服务日志
  it('应正确获取服务日志', async () => {
    const result = await hostingService.getServiceLogs('service-1', {
      limit: 10,
      level: 'info'
    });

    assert.strictEqual(result.success, true, '获取日志应成功');
    assert.ok(Array.isArray(result.logs), '应返回日志数组');
    assert.ok(result.logs.length > 0, '应有日志条目');
  });

  // 测试获取服务环境变量
  it('应正确获取服务环境变量', async () => {
    const result = await hostingService.getServiceEnvironment('service-1');

    assert.strictEqual(result.success, true, '获取环境变量应成功');
    assert.ok(result.environment, '应返回环境变量');
    assert.strictEqual(result.environment.NODE_ENV, 'production', 'NODE_ENV应匹配');
    assert.strictEqual(result.environment.DATABASE_URL, 'postgres://user:pass@host/db', 'DATABASE_URL应匹配');
  });

  // 测试更新服务
  it('应正确更新服务', async () => {
    const updateData = {
      description: '更新后的测试服务1'
    };

    const result = await hostingService.updateService('service-1', updateData);

    assert.strictEqual(result.success, true, '更新应成功');
    assert.ok(result.service, '应返回服务数据');
    assert.strictEqual(result.service.description, updateData.description, '服务描述应匹配');
  });

  // 测试重启服务
  it('应正确重启服务', async () => {
    const result = await hostingService.restartService('service-1');

    assert.strictEqual(result.success, true, '重启应成功');
    assert.strictEqual(result.restarted, true, '应标记为已重启');
  });

  // 测试添加自定义域名
  it('应正确添加自定义域名', async () => {
    const result = await hostingService.addCustomDomain('service-1', 'example.org');

    assert.strictEqual(result.success, true, '添加域名应成功');
    assert.strictEqual(result.domain, 'example.org', '域名应匹配');
    assert.strictEqual(result.type, 'custom', '类型应为custom');
    assert.strictEqual(result.verified, false, '验证状态应为false');
  });

  // 测试设置环境变量
  it('应正确设置环境变量', async () => {
    const variables = {
      NODE_ENV: 'production',
      DEBUG: 'false',
      API_KEY: 'new-api-key'
    };

    const result = await hostingService.setServiceEnvironment('service-1', variables);

    assert.strictEqual(result.success, true, '设置环境变量应成功');
    assert.strictEqual(result.updated, true, '应标记为已更新');
    assert.strictEqual(result.requiresRestart, true, '应提示需要重启');
  });

  // 测试删除服务
  it('应正确删除服务', async () => {
    const result = await hostingService.deleteService('service-2');

    assert.strictEqual(result.success, true, '删除应成功');
    assert.strictEqual(hostingService.getService('service-2'), null, '服务应已删除');
  });
}); 