/**
 * AIAssistantClient 单元测试
 */

import { AIAssistantClient, ToolCallRequest, SessionContext } from '../../integrations/ai';

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
            tools: [
              {
                name: 'code-generator',
                description: '生成代码',
                parameters: {
                  language: { type: 'string' },
                  prompt: { type: 'string' }
                },
                required_parameters: ['prompt']
              },
              {
                name: 'knowledge-search',
                description: '搜索知识库',
                parameters: {
                  query: { type: 'string' },
                  max_results: { type: 'number' }
                },
                required_parameters: ['query']
              }
            ],
            metadata: {
              modelConfig: {
                model: 'gpt-4',
                temperature: 0.7,
                max_tokens: 2000
              }
            }
          };
        }),
        sendMetrics: jest.fn().mockResolvedValue(true),
        onEvent: jest.fn().mockReturnThis()
      };
    })
  };
});

describe('AIAssistantClient', () => {
  let client: AIAssistantClient;
  
  beforeEach(() => {
    // 创建客户端实例
    client = new AIAssistantClient(
      {
        baseUrl: 'https://mcp-test.com',
        apiKey: 'mcp_test_key'
      },
      {
        name: 'Test AI Assistant',
        version: '1.0.0',
        assistantType: 'chatbot',
        capabilities: ['code-generation'],
        telemetryEnabled: true
      }
    );
  });
  
  describe('constructor', () => {
    it('应正确初始化AI助手', () => {
      expect(client).toBeInstanceOf(AIAssistantClient);
    });
  });
  
  describe('registerAssistant', () => {
    it('应调用sendMetrics注册AI助手', async () => {
      const result = await client.registerAssistant();
      
      expect(result).toBe(true);
      expect(client['sendMetrics']).toHaveBeenCalledWith({
        action: 'register_assistant',
        assistant: client['assistant']
      });
    });
    
    it('发生错误时应返回false', async () => {
      // 模拟sendMetrics抛出异常
      (client['sendMetrics'] as jest.Mock).mockRejectedValueOnce(new Error('Registration failed'));
      
      const result = await client.registerAssistant();
      expect(result).toBe(false);
    });
  });
  
  describe('getAvailableTools', () => {
    it('应获取服务器可用工具列表', async () => {
      const tools = await client.getAvailableTools('server1');
      
      expect(tools).toHaveLength(2);
      expect(tools[0].name).toBe('code-generator');
      expect(tools[1].name).toBe('knowledge-search');
      expect(client['getServerMetadata']).toHaveBeenCalledWith('server1');
    });
    
    it('服务器无工具时应返回空数组', async () => {
      // 模拟无工具的元数据
      (client['getServerMetadata'] as jest.Mock).mockResolvedValueOnce({
        id: 'server-empty',
        name: 'Empty Server',
        key: 'empty',
        version: '1.0.0'
      });
      
      const tools = await client.getAvailableTools('empty');
      expect(tools).toHaveLength(0);
    });
    
    it('发生错误时应返回空数组', async () => {
      // 模拟getServerMetadata抛出异常
      (client['getServerMetadata'] as jest.Mock).mockRejectedValueOnce(new Error('Failed to fetch'));
      
      const tools = await client.getAvailableTools('server1');
      expect(tools).toHaveLength(0);
    });
  });
  
  describe('callTool', () => {
    it('应成功调用工具并返回结果', async () => {
      const request: ToolCallRequest = {
        toolName: 'code-generator',
        parameters: {
          language: 'typescript',
          prompt: 'Create a React component'
        },
        callId: 'call-123'
      };
      
      const session: SessionContext = {
        sessionId: 'session-456',
        userId: 'user-789'
      };
      
      // 模拟sendMetrics返回结果
      (client['sendMetrics'] as jest.Mock).mockResolvedValueOnce({
        code: 'export function Component() { return <div>Hello</div>; }'
      });
      
      const response = await client.callTool('server1', request, session);
      
      expect(response.callId).toBe('call-123');
      expect(response.result).toHaveProperty('code');
      expect(response.statusCode).toBe(200);
      expect(client['sendMetrics']).toHaveBeenCalledWith({
        action: 'tool_call',
        serverKey: 'server1',
        toolName: request.toolName,
        parameters: request.parameters,
        callId: request.callId,
        session
      });
    });
    
    it('调用工具失败时应返回包含错误的响应', async () => {
      // 模拟sendMetrics返回失败
      (client['sendMetrics'] as jest.Mock).mockResolvedValueOnce(null);
      
      const request: ToolCallRequest = {
        toolName: 'invalid-tool',
        parameters: {},
        callId: 'call-fail'
      };
      
      const response = await client.callTool('server1', request);
      
      expect(response.callId).toBe('call-fail');
      expect(response.result).toBeNull();
      expect(response.error).toBeDefined();
      expect(response.statusCode).toBe(500);
    });
    
    it('发生异常时应返回包含错误信息的响应', async () => {
      // 模拟sendMetrics抛出异常
      (client['sendMetrics'] as jest.Mock).mockRejectedValueOnce(new Error('Tool execution failed'));
      
      const request: ToolCallRequest = {
        toolName: 'code-generator',
        parameters: {},
        callId: 'call-error'
      };
      
      const response = await client.callTool('server1', request);
      
      expect(response.callId).toBe('call-error');
      expect(response.result).toBeNull();
      expect(response.error).toBe('Tool execution failed');
      expect(response.statusCode).toBe(500);
    });
  });
  
  describe('batchCallTools', () => {
    it('应成功批量调用工具', async () => {
      const requests: ToolCallRequest[] = [
        {
          toolName: 'code-generator',
          parameters: { language: 'typescript', prompt: 'Hello' },
          callId: 'call-1'
        },
        {
          toolName: 'knowledge-search',
          parameters: { query: 'React', max_results: 3 },
          callId: 'call-2'
        }
      ];
      
      // 模拟callTool方法返回结果
      const mockCallTool = jest.spyOn(client, 'callTool')
        .mockResolvedValueOnce({
          callId: 'call-1',
          result: { code: 'console.log("Hello");' },
          statusCode: 200
        })
        .mockResolvedValueOnce({
          callId: 'call-2',
          result: { results: ['Result 1', 'Result 2'] },
          statusCode: 200
        });
      
      const responses = await client.batchCallTools('server1', requests);
      
      expect(responses).toHaveLength(2);
      expect(responses[0].callId).toBe('call-1');
      expect(responses[1].callId).toBe('call-2');
      expect(mockCallTool).toHaveBeenCalledTimes(2);
    });
    
    it('单个工具调用失败不应影响其他工具调用', async () => {
      const requests: ToolCallRequest[] = [
        { toolName: 'tool1', parameters: {}, callId: 'call-1' },
        { toolName: 'tool2', parameters: {}, callId: 'call-2' }
      ];
      
      // 模拟第一个调用成功，第二个调用失败
      const mockCallTool = jest.spyOn(client, 'callTool')
        .mockResolvedValueOnce({
          callId: 'call-1',
          result: { success: true },
          statusCode: 200
        })
        .mockRejectedValueOnce(new Error('Tool call failed'));
      
      const responses = await client.batchCallTools('server1', requests);
      
      expect(responses).toHaveLength(2);
      expect(responses[0].statusCode).toBe(200);
      expect(responses[1].error).toBeDefined();
      expect(mockCallTool).toHaveBeenCalledTimes(2);
    });
  });
  
  describe('getModelConfig', () => {
    it('应获取服务器模型配置', async () => {
      const config = await client.getModelConfig('server1');
      
      expect(config).toHaveProperty('model', 'gpt-4');
      expect(config).toHaveProperty('temperature', 0.7);
      expect(config).toHaveProperty('max_tokens', 2000);
      expect(client['getServerMetadata']).toHaveBeenCalledWith('server1');
    });
    
    it('服务器无模型配置时应返回空对象', async () => {
      // 模拟无模型配置的元数据
      (client['getServerMetadata'] as jest.Mock).mockResolvedValueOnce({
        id: 'server-empty',
        name: 'Empty Server',
        key: 'empty',
        version: '1.0.0',
        metadata: {}
      });
      
      const config = await client.getModelConfig('empty');
      expect(config).toEqual({});
    });
    
    it('发生错误时应返回空对象', async () => {
      // 模拟getServerMetadata抛出异常
      (client['getServerMetadata'] as jest.Mock).mockRejectedValueOnce(new Error('Failed to fetch'));
      
      const config = await client.getModelConfig('server1');
      expect(config).toEqual({});
    });
  });
  
  describe('sendUsageStats', () => {
    it('遥测启用时应发送使用统计', async () => {
      const data = { action: 'test', value: 123 };
      const result = await client.sendUsageStats(data);
      
      expect(result).toBe(true);
      expect(client['sendMetrics']).toHaveBeenCalledWith({
        ...data,
        assistant: 'Test AI Assistant',
        version: '1.0.0',
        type: 'usage_stats'
      });
    });
    
    it('遥测禁用时应直接返回false', async () => {
      // 创建禁用遥测的客户端
      const disabledClient = new AIAssistantClient(
        {
          baseUrl: 'https://mcp-test.com',
          apiKey: 'mcp_test_key'
        },
        {
          name: 'Test AI Assistant',
          version: '1.0.0',
          assistantType: 'chatbot',
          telemetryEnabled: false
        }
      );
      
      const result = await disabledClient.sendUsageStats({ action: 'test' });
      expect(result).toBe(false);
      expect(disabledClient['sendMetrics']).not.toHaveBeenCalled();
    });
  });
}); 