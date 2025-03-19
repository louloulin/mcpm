/**
 * MCP云托管管理器测试
 */
import { MCPCloudHostingManager } from '../../../lib/mcp/cloud/manager';
import { MCPCloudProviderType, MCPServerDefinition, MCPCloudHostingConfig } from '../../../lib/mcp/types';
import { DeploymentProgressCallback } from '../../../lib/mcp/cloud/types';
import { DockerProvider } from '../../../lib/mcp/cloud/providers/docker';

// 创建测试用的服务器定义
const testServer: MCPServerDefinition = {
  name: 'TestServer',
  version: '1.0.0',
  url: 'http://example.com/test-server',
  type: 'tool' as any,
  status: 'active' as any,
  description: '测试云托管服务器'
};

// Docker配置
const testDockerConfig = {
  imageName: 'test-image',
  containerName: 'test-container',
  ports: {
    '8080': '80'
  }
};

// 创建测试用的云托管配置
const testConfig: MCPCloudHostingConfig = {
  providerType: MCPCloudProviderType.DOCKER,
  providerConfig: testDockerConfig
};

// 模拟Docker提供者
jest.mock('../../../lib/mcp/cloud/providers/docker');
const MockedDockerProvider = DockerProvider as jest.MockedClass<typeof DockerProvider>;

describe('MCPCloudHostingManager', () => {
  let manager: MCPCloudHostingManager;
  
  beforeEach(() => {
    // 清除所有mock的实现
    jest.clearAllMocks();
    
    // 设置Docker提供者的mock实现
    MockedDockerProvider.mockImplementation(() => ({
      type: MCPCloudProviderType.DOCKER,
      deploy: jest.fn().mockResolvedValue({
        id: 'test-deployment-id',
        status: 'success',
        url: 'http://localhost:8080',
        metadata: {
          containerName: 'test-container',
          imageName: 'test-image'
        }
      }),
      update: jest.fn().mockResolvedValue({
        id: 'test-deployment-id',
        status: 'success',
        url: 'http://localhost:8080',
        metadata: {
          updated: true
        }
      }),
      remove: jest.fn().mockResolvedValue(true),
      getStatus: jest.fn().mockResolvedValue({
        id: 'test-deployment-id',
        status: 'success',
        url: 'http://localhost:8080',
        metadata: {
          state: 'running'
        }
      }),
      getLogs: jest.fn().mockResolvedValue('Test logs')
    }));
    
    // 创建管理器实例
    manager = new MCPCloudHostingManager();
  });
  
  test('应该能够注册云提供者', () => {
    // 注册Docker提供者
    manager.registerProvider(new MockedDockerProvider());
    
    // 验证提供者已注册
    expect(manager.hasProvider(MCPCloudProviderType.DOCKER)).toBe(true);
  });
  
  test('应该能够获取已注册提供者', () => {
    // 注册Docker提供者
    const provider = new MockedDockerProvider();
    manager.registerProvider(provider);
    
    // 获取提供者
    const retrievedProvider = manager.getProvider(MCPCloudProviderType.DOCKER);
    
    // 验证是同一个提供者
    expect(retrievedProvider).toBe(provider);
  });
  
  test('当提供者不存在时应该抛出错误', () => {
    // 尝试获取未注册的提供者
    expect(() => {
      manager.getProvider(MCPCloudProviderType.DOCKER);
    }).toThrow('Cloud provider not registered: docker');
  });
  
  test('应该能够部署服务器', async () => {
    // 注册Docker提供者
    const provider = new MockedDockerProvider();
    manager.registerProvider(provider);
    
    // 模拟进度回调
    const progressCallback: DeploymentProgressCallback = jest.fn();
    
    // 执行部署
    const result = await manager.deploy(testServer, testConfig, progressCallback);
    
    // 验证结果
    expect(result.id).toBe('test-deployment-id');
    expect(result.status).toBe('success');
    expect(result.url).toBe('http://localhost:8080');
    
    // 验证提供者的deploy方法被调用
    expect(provider.deploy).toHaveBeenCalledWith(testServer, testConfig, progressCallback);
  });
  
  test('部署时如果提供者不存在应该抛出错误', async () => {
    // 尝试部署到未注册的提供者
    await expect(manager.deploy(testServer, testConfig)).rejects.toThrow(
      'Cloud provider not registered: docker'
    );
  });
  
  test('应该能够更新部署', async () => {
    // 注册Docker提供者
    const provider = new MockedDockerProvider();
    manager.registerProvider(provider);
    
    // 执行更新
    const result = await manager.update('test-deployment-id', testServer, testConfig);
    
    // 验证结果
    expect(result.status).toBe('success');
    expect(result.metadata?.updated).toBe(true);
    
    // 验证提供者的update方法被调用
    expect(provider.update).toHaveBeenCalledWith('test-deployment-id', testServer, testConfig, undefined);
  });
  
  test('应该能够删除部署', async () => {
    // 注册Docker提供者
    const provider = new MockedDockerProvider();
    manager.registerProvider(provider);
    
    // 执行删除
    const result = await manager.remove('test-deployment-id', MCPCloudProviderType.DOCKER);
    
    // 验证结果
    expect(result).toBe(true);
    
    // 验证提供者的remove方法被调用
    expect(provider.remove).toHaveBeenCalledWith('test-deployment-id');
  });
  
  test('应该能够获取部署状态', async () => {
    // 注册Docker提供者
    const provider = new MockedDockerProvider();
    manager.registerProvider(provider);
    
    // 获取状态
    const result = await manager.getStatus('test-deployment-id', MCPCloudProviderType.DOCKER);
    
    // 验证结果
    expect(result.status).toBe('success');
    expect(result.metadata?.state).toBe('running');
    
    // 验证提供者的getStatus方法被调用
    expect(provider.getStatus).toHaveBeenCalledWith('test-deployment-id');
  });
  
  test('应该能够获取部署日志', async () => {
    // 注册Docker提供者
    const provider = new MockedDockerProvider();
    manager.registerProvider(provider);
    
    // 获取日志
    const logs = await manager.getLogs('test-deployment-id', MCPCloudProviderType.DOCKER);
    
    // 验证结果
    expect(logs).toBe('Test logs');
    
    // 验证提供者的getLogs方法被调用
    expect(provider.getLogs).toHaveBeenCalledWith('test-deployment-id');
  });
});
