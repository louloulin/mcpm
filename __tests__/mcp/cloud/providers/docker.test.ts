/**
 * Docker云提供者测试
 */
import { DockerProvider, DockerConfig } from '../../../../lib/mcp/cloud/providers/docker';
import { MCPServerDefinition, MCPCloudHostingConfig, MCPCloudProviderType } from '../../../../lib/mcp/types';
import { DockerCredentials, DeploymentProgressCallback } from '../../../../lib/mcp/cloud/types';

// 创建测试用的服务器定义
const testServer: MCPServerDefinition = {
  name: 'TestServer',
  version: '1.0.0',
  url: 'http://example.com/test-server',
  type: 'tool' as any,
  status: 'active' as any,
  description: '测试Docker服务器'
};

// Docker凭证
const testCredentials: DockerCredentials = {
  registryUrl: 'https://registry.example.com',
  username: 'testuser',
  password: 'testpassword'
};

// Docker配置
const testDockerConfig: DockerConfig = {
  imageName: 'test-image',
  containerName: 'test-container',
  ports: {
    '8080': '80'
  },
  volumes: {
    '/data': '/app/data'
  },
  environment: {
    'NODE_ENV': 'production'
  },
  restartPolicy: 'always',
  useCompose: true
};

// 创建测试用的云托管配置
const testConfig: MCPCloudHostingConfig = {
  providerType: MCPCloudProviderType.DOCKER,
  providerConfig: testDockerConfig
};

describe('DockerProvider', () => {
  let provider: DockerProvider;
  
  beforeEach(() => {
    provider = new DockerProvider(testCredentials);
  });
  
  test('应该具有正确的提供者类型', () => {
    expect(provider.type).toBe(MCPCloudProviderType.DOCKER);
  });
  
  test('应该能够部署服务器', async () => {
    // 模拟进度回调
    const progressCallback: DeploymentProgressCallback = jest.fn();
    
    // 执行部署
    const result = await provider.deploy(testServer, testConfig, progressCallback);
    
    // 验证结果
    expect(result.status).toBe('success');
    expect(result.url).toContain('localhost:');
    expect(result.metadata?.containerName).toBe('test-container');
    expect(result.metadata?.imageName).toBe('test-image');
    
    // 验证回调被调用
    expect(progressCallback).toHaveBeenCalled();
    expect(progressCallback).toHaveBeenCalledWith('完成', '部署完成', 100);
  });
  
  test('应该能够使用默认值部署', async () => {
    // 使用最小配置
    const minConfig: MCPCloudHostingConfig = {
      providerType: MCPCloudProviderType.DOCKER,
    };
    
    // 执行部署
    const result = await provider.deploy(testServer, minConfig);
    
    // 验证结果
    expect(result.status).toBe('success');
    expect(result.url).toContain('localhost:8080');
    expect(result.metadata?.containerName).toContain('mcp-server-testserver');
  });
  
  test('应该能够更新部署', async () => {
    // 执行部署
    const deployResult = await provider.deploy(testServer, testConfig);
    
    // 测试服务器更新
    const updatedServer = {
      ...testServer,
      version: '1.0.1'
    };
    
    // 执行更新
    const updateResult = await provider.update(
      deployResult.id,
      updatedServer,
      testConfig
    );
    
    // 验证结果
    expect(updateResult.status).toBe('success');
    expect(updateResult.metadata?.updated).toBe(true);
    expect(updateResult.metadata?.serverName).toBe(testServer.name);
    expect(updateResult.metadata?.version).toBe('1.0.1');
  });
  
  test('应该能够删除部署', async () => {
    // 执行部署
    const deployResult = await provider.deploy(testServer, testConfig);
    
    // 执行删除
    const removeResult = await provider.remove(deployResult.id);
    
    // 验证结果
    expect(removeResult).toBe(true);
  });
  
  test('应该能够获取部署状态', async () => {
    // 执行部署
    const deployResult = await provider.deploy(testServer, testConfig);
    
    // 获取状态
    const statusResult = await provider.getStatus(deployResult.id);
    
    // 验证结果
    expect(statusResult.status).toBe('success');
    expect(statusResult.id).toBe(deployResult.id);
    expect(statusResult.metadata?.state).toBe('running');
  });
  
  test('应该能够获取部署日志', async () => {
    // 执行部署
    const deployResult = await provider.deploy(testServer, testConfig);
    
    // 获取日志
    const logs = await provider.getLogs(deployResult.id);
    
    // 验证结果
    expect(logs).toContain('MCP Server container started');
    expect(logs).toContain('Health check passed');
  });
}); 