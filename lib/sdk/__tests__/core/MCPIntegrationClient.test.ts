/**
 * MCPIntegrationClient 单元测试
 */

import { MCPIntegrationClient } from '../../core/MCPIntegrationClient';
import { IntegrationType } from '../../../api/services/IntegrationService';
import { EventType } from '../../core/types';

// 模拟全局fetch
global.fetch = jest.fn();

describe('MCPIntegrationClient', () => {
  let client: MCPIntegrationClient;
  
  beforeEach(() => {
    // 重置fetch模拟
    (global.fetch as jest.Mock).mockReset();
    
    // 创建客户端实例
    client = new MCPIntegrationClient({
      baseUrl: 'https://mcp-test.com',
      apiKey: 'mcp_test_key',
      type: IntegrationType.CUSTOM,
      timeout: 1000,
      debug: true
    });
  });
  
  describe('constructor', () => {
    it('应正确初始化客户端实例', () => {
      expect(client).toBeInstanceOf(MCPIntegrationClient);
    });
  });
  
  describe('verifyApiKey', () => {
    it('验证API密钥成功应返回true', async () => {
      // 模拟成功响应
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          success: true,
          data: { valid: true }
        })
      });
      
      const result = await client.verifyApiKey();
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
    
    it('验证API密钥失败应返回false', async () => {
      // 模拟失败响应
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          success: true,
          data: { valid: false }
        })
      });
      
      const result = await client.verifyApiKey();
      expect(result).toBe(false);
    });
    
    it('请求异常应返回false', async () => {
      // 模拟网络异常
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      const result = await client.verifyApiKey();
      expect(result).toBe(false);
    });
  });
  
  describe('getServerMetadata', () => {
    it('成功获取服务器元数据', async () => {
      const mockMetadata = {
        id: 'server-1',
        name: 'Test Server',
        key: 'test-key',
        version: '1.0.0',
        tools: [{ name: 'test-tool' }]
      };
      
      // 模拟成功响应
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          success: true,
          data: mockMetadata
        })
      });
      
      const result = await client.getServerMetadata('test-key');
      expect(result).toEqual(mockMetadata);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
    
    it('获取元数据失败应抛出异常', async () => {
      // 模拟失败响应
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          success: false,
          error: 'Server not found'
        })
      });
      
      await expect(client.getServerMetadata('invalid-key')).rejects.toThrow();
    });
  });
  
  describe('getServerTools', () => {
    it('成功获取服务器工具列表', async () => {
      const mockTools = [
        { name: 'tool-1', description: 'Tool 1' },
        { name: 'tool-2', description: 'Tool 2' }
      ];
      
      // 模拟 getServerMetadata 返回带工具的元数据
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          success: true,
          data: {
            id: 'server-1',
            name: 'Test Server',
            key: 'test-key',
            version: '1.0.0',
            tools: mockTools
          }
        })
      });
      
      const result = await client.getServerTools('test-key');
      expect(result).toEqual(mockTools);
    });
    
    it('服务器无工具应返回空数组', async () => {
      // 模拟无工具的元数据
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          success: true,
          data: {
            id: 'server-1',
            name: 'Test Server',
            key: 'test-key',
            version: '1.0.0'
          }
        })
      });
      
      const result = await client.getServerTools('test-key');
      expect(result).toEqual([]);
    });
  });
  
  describe('sendMetrics', () => {
    it('成功发送指标数据', async () => {
      // 模拟成功响应
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          success: true
        })
      });
      
      const metrics = { action: 'test', value: 123 };
      const result = await client.sendMetrics(metrics);
      
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(1);
      
      // 确认请求方法和主体
      const [, options] = (global.fetch as jest.Mock).mock.calls[0];
      expect(options.method).toBe('POST');
      expect(options.body).toBe(JSON.stringify(metrics));
    });
    
    it('发送指标失败应返回false', async () => {
      // 模拟失败响应
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      const result = await client.sendMetrics({ action: 'test' });
      expect(result).toBe(false);
    });
  });
  
  describe('onEvent', () => {
    it('应正确注册事件监听器', () => {
      const handler = jest.fn();
      const spy = jest.spyOn(client, 'on');
      
      client.onEvent(EventType.SERVER_UPDATED, handler);
      
      expect(spy).toHaveBeenCalledWith(EventType.SERVER_UPDATED, handler);
    });
    
    it('应支持链式调用', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      
      const result = client
        .onEvent(EventType.SERVER_UPDATED, handler1)
        .onEvent(EventType.INTEGRATION_CREATED, handler2);
      
      expect(result).toBe(client);
    });
  });
}); 