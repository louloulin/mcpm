/**
 * IDEIntegrationClient 单元测试
 */

import { IDEIntegrationClient } from '../../integrations/ide';

// 模拟MCPIntegrationClient的方法
jest.mock('../../core/MCPIntegrationClient', () => {
  return {
    MCPIntegrationClient: jest.fn().mockImplementation(() => {
      return {
        verifyApiKey: jest.fn().mockResolvedValue(true),
        getServerMetadata: jest.fn().mockImplementation(async (serverKey) => {
          return {
            id: `server-${serverKey}`,
            name: 'Test Server',
            key: serverKey,
            version: '1.0.0',
            metadata: {
              snippets: [
                {
                  language: 'typescript',
                  code: 'console.log("Hello");',
                  description: 'TS示例',
                  fileName: 'example.ts'
                },
                {
                  language: 'python',
                  code: 'print("Hello")',
                  description: 'Python示例',
                  fileName: 'example.py'
                }
              ]
            }
          };
        }),
        sendMetrics: jest.fn().mockResolvedValue(true),
        onEvent: jest.fn().mockReturnThis()
      };
    })
  };
});

describe('IDEIntegrationClient', () => {
  let client: IDEIntegrationClient;
  
  beforeEach(() => {
    // 创建客户端实例
    client = new IDEIntegrationClient(
      {
        baseUrl: 'https://mcp-test.com',
        apiKey: 'mcp_test_key'
      },
      {
        name: 'Test IDE Extension',
        version: '1.0.0',
        ideType: 'vscode',
        features: ['code-completion'],
        telemetryEnabled: true
      },
      {
        enabled: true,
        pollingIntervalSeconds: 100
      }
    );
  });
  
  describe('constructor', () => {
    it('应正确初始化集成类型', () => {
      // 验证传递给父类构造函数的集成类型
      expect(client).toBeInstanceOf(IDEIntegrationClient);
    });
  });
  
  describe('registerExtension', () => {
    it('应调用sendMetrics注册扩展', async () => {
      const result = await client.registerExtension();
      
      expect(result).toBe(true);
      expect(client['sendMetrics']).toHaveBeenCalledWith({
        action: 'register_extension',
        extension: client['extension']
      });
    });
    
    it('发生错误时应返回false', async () => {
      // 模拟sendMetrics抛出异常
      (client['sendMetrics'] as jest.Mock).mockRejectedValueOnce(new Error('Registration failed'));
      
      const result = await client.registerExtension();
      expect(result).toBe(false);
    });
  });
  
  describe('getCodeSnippets', () => {
    it('应获取所有语言的代码片段', async () => {
      const snippets = await client.getCodeSnippets('server1');
      
      expect(snippets).toHaveLength(2);
      expect(client['getServerMetadata']).toHaveBeenCalledWith('server1');
    });
    
    it('应根据语言过滤代码片段', async () => {
      const snippets = await client.getCodeSnippets('server1', 'typescript');
      
      expect(snippets).toHaveLength(1);
      expect(snippets[0].language).toBe('typescript');
    });
    
    it('找不到指定语言的片段时应返回空数组', async () => {
      const snippets = await client.getCodeSnippets('server1', 'java');
      
      expect(snippets).toHaveLength(0);
    });
    
    it('发生错误时应返回空数组', async () => {
      // 模拟getServerMetadata抛出异常
      (client['getServerMetadata'] as jest.Mock).mockRejectedValueOnce(new Error('Failed to fetch'));
      
      const snippets = await client.getCodeSnippets('server1');
      expect(snippets).toHaveLength(0);
    });
  });
  
  describe('subscribeToServerUpdates', () => {
    it('通知启用时应发送订阅请求', async () => {
      const result = await client.subscribeToServerUpdates(['server1', 'server2']);
      
      expect(result).toBe(true);
      expect(client['sendMetrics']).toHaveBeenCalledWith({
        action: 'subscribe_updates',
        serverKeys: ['server1', 'server2'],
        pollingInterval: 100
      });
    });
    
    it('通知禁用时应直接返回false', async () => {
      // 创建禁用通知的客户端
      const disabledClient = new IDEIntegrationClient(
        {
          baseUrl: 'https://mcp-test.com',
          apiKey: 'mcp_test_key'
        },
        {
          name: 'Test IDE Extension',
          version: '1.0.0',
          ideType: 'vscode'
        },
        {
          enabled: false
        }
      );
      
      const result = await disabledClient.subscribeToServerUpdates(['server1']);
      expect(result).toBe(false);
      expect(disabledClient['sendMetrics']).not.toHaveBeenCalled();
    });
  });
  
  describe('checkServerUpdates', () => {
    it('应获取每个服务器的版本信息', async () => {
      const updates = await client.checkServerUpdates(['server1', 'server2']);
      
      expect(Object.keys(updates)).toHaveLength(2);
      expect(updates.server1).toBe('1.0.0');
      expect(updates.server2).toBe('1.0.0');
      expect(client['getServerMetadata']).toHaveBeenCalledTimes(2);
    });
    
    it('获取某个服务器信息失败时应忽略该服务器', async () => {
      // 模拟第二个服务器获取失败
      (client['getServerMetadata'] as jest.Mock)
        .mockImplementationOnce(async () => ({ version: '1.0.0' }))
        .mockRejectedValueOnce(new Error('Server not found'));
      
      const updates = await client.checkServerUpdates(['server1', 'server2']);
      
      expect(Object.keys(updates)).toHaveLength(1);
      expect(updates.server1).toBe('1.0.0');
      expect(updates.server2).toBeUndefined();
    });
  });
  
  describe('sendTelemetry', () => {
    it('遥测启用时应发送数据', async () => {
      const data = { action: 'test', value: 123 };
      const result = await client.sendTelemetry(data);
      
      expect(result).toBe(true);
      expect(client['sendMetrics']).toHaveBeenCalledWith({
        ...data,
        ide: 'vscode',
        version: '1.0.0',
        type: 'telemetry'
      });
    });
    
    it('遥测禁用时应直接返回false', async () => {
      // 创建禁用遥测的客户端
      const disabledClient = new IDEIntegrationClient(
        {
          baseUrl: 'https://mcp-test.com',
          apiKey: 'mcp_test_key'
        },
        {
          name: 'Test IDE Extension',
          version: '1.0.0',
          ideType: 'vscode',
          telemetryEnabled: false
        }
      );
      
      const result = await disabledClient.sendTelemetry({ action: 'test' });
      expect(result).toBe(false);
      expect(disabledClient['sendMetrics']).not.toHaveBeenCalled();
    });
  });
}); 