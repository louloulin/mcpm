import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { 
  checkMCPServerHealth,
  buildHealthCheckUrl,
  analyzeHealthCheck
} from '../../../lib/mcp/validator/health';
import { MCPServerDefinition, MCPServerType, MCPServerStatus, MCPServerHealthStatus } from '../../../lib/mcp/types';

// 模拟axios
vi.mock('axios');

describe('健康检查工具', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // 模拟Date.now()以确保测试的一致性
    vi.spyOn(Date, 'now').mockImplementation(() => 1000);
    // 模拟toISOString()以确保测试的一致性
    vi.spyOn(Date.prototype, 'toISOString').mockImplementation(() => '2023-01-01T00:00:00.000Z');
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  // 创建测试服务器定义
  const createTestServer = (url: string = 'http://localhost:3000'): MCPServerDefinition => ({
    name: 'test-server',
    version: '1.0.0',
    description: 'Test Server',
    url,
    type: MCPServerType.APP,
    status: MCPServerStatus.ACTIVE
  });
  
  describe('buildHealthCheckUrl', () => {
    it('应该正确构建健康检查URL', () => {
      expect(buildHealthCheckUrl('http://localhost:3000')).toBe('http://localhost:3000/health');
      expect(buildHealthCheckUrl('http://localhost:3000/')).toBe('http://localhost:3000/health');
      expect(buildHealthCheckUrl('http://localhost:3000/api')).toBe('http://localhost:3000/api/health');
      expect(buildHealthCheckUrl('http://localhost:3000/api/')).toBe('http://localhost:3000/api/health');
    });
    
    it('应该处理无效URL', () => {
      expect(buildHealthCheckUrl('invalid')).toBe('invalid/health');
    });
  });
  
  describe('checkMCPServerHealth', () => {
    it('应该报告健康的服务器', async () => {
      // 模拟成功的响应
      (axios.get as any).mockResolvedValueOnce({
        status: 200,
        data: {
          status: 'healthy',
          version: '1.0.0',
          tools: ['tool1', 'tool2']
        }
      });
      
      const server = createTestServer();
      const result = await checkMCPServerHealth(server);
      
      expect(result.status).toBe(MCPServerHealthStatus.HEALTHY);
      expect(result.timestamp).toBe('2023-01-01T00:00:00.000Z');
      expect(result.details).toEqual({
        latency: 0,
        version: '1.0.0',
        tools: ['tool1', 'tool2']
      });
    });
    
    it('应该检测版本不匹配', async () => {
      // 模拟响应，但版本不匹配
      (axios.get as any).mockResolvedValueOnce({
        status: 200,
        data: {
          status: 'healthy',
          version: '1.1.0', // 与服务器定义中的1.0.0不匹配
          tools: ['tool1', 'tool2']
        }
      });
      
      const server = createTestServer();
      const result = await checkMCPServerHealth(server);
      
      expect(result.status).toBe(MCPServerHealthStatus.DEGRADED);
      expect(result.message).toContain('服务器版本不匹配');
    });
    
    it('应该检测服务器自报的非健康状态', async () => {
      // 模拟服务器报告自身非健康状态
      (axios.get as any).mockResolvedValueOnce({
        status: 200,
        data: {
          status: 'degraded',
          message: '性能问题',
          version: '1.0.0'
        }
      });
      
      const server = createTestServer();
      const result = await checkMCPServerHealth(server);
      
      expect(result.status).toBe(MCPServerHealthStatus.DEGRADED);
      expect(result.message).toContain('服务器报告状态不健康');
    });
    
    it('应该检测没有工具的服务器', async () => {
      // 模拟服务器没有提供工具
      (axios.get as any).mockResolvedValueOnce({
        status: 200,
        data: {
          status: 'healthy',
          version: '1.0.0',
          tools: []
        }
      });
      
      const server = createTestServer();
      const result = await checkMCPServerHealth(server);
      
      expect(result.status).toBe(MCPServerHealthStatus.DEGRADED);
      expect(result.message).toContain('服务器未提供任何工具');
    });
    
    it('应该处理HTTP错误状态码', async () => {
      // 模拟HTTP错误
      (axios.get as any).mockResolvedValueOnce({
        status: 500,
        statusText: 'Internal Server Error'
      });
      
      const server = createTestServer();
      const result = await checkMCPServerHealth(server);
      
      expect(result.status).toBe(MCPServerHealthStatus.UNHEALTHY);
      expect(result.message).toContain('服务器响应状态码异常: 500');
    });
    
    it('应该处理网络超时', async () => {
      // 模拟网络超时
      (axios.get as any).mockRejectedValueOnce({
        isAxiosError: true,
        code: 'ECONNABORTED',
        message: 'timeout of 5000ms exceeded'
      });
      
      const server = createTestServer();
      const result = await checkMCPServerHealth(server, 5000);
      
      expect(result.status).toBe(MCPServerHealthStatus.UNHEALTHY);
      expect(result.message).toContain('健康检查超时');
    });
    
    it('应该处理域名解析失败', async () => {
      // 模拟域名解析失败
      (axios.get as any).mockRejectedValueOnce({
        isAxiosError: true,
        code: 'ENOTFOUND',
        message: 'getaddrinfo ENOTFOUND nonexistent.example.com'
      });
      
      const server = createTestServer('http://nonexistent.example.com');
      const result = await checkMCPServerHealth(server);
      
      expect(result.status).toBe(MCPServerHealthStatus.UNHEALTHY);
      expect(result.message).toContain('找不到服务器主机');
    });
    
    it('应该处理其他类型的错误', async () => {
      // 模拟未知错误
      (axios.get as any).mockRejectedValueOnce(new Error('未知错误'));
      
      const server = createTestServer();
      const result = await checkMCPServerHealth(server);
      
      expect(result.status).toBe(MCPServerHealthStatus.UNHEALTHY);
      expect(result.message).toContain('未知错误');
    });
  });
  
  describe('analyzeHealthCheck', () => {
    it('应该解析健康状态', () => {
      const result = analyzeHealthCheck({
        status: MCPServerHealthStatus.HEALTHY,
        message: '服务器正常',
        timestamp: '2023-01-01T00:00:00.000Z'
      });
      
      expect(result).toContain('服务器状态良好');
      expect(result).toContain('服务器正常');
    });
    
    it('应该解析降级状态', () => {
      const result = analyzeHealthCheck({
        status: MCPServerHealthStatus.DEGRADED,
        message: '性能问题',
        timestamp: '2023-01-01T00:00:00.000Z'
      });
      
      expect(result).toContain('服务器状态降级');
      expect(result).toContain('性能问题');
    });
    
    it('应该解析不健康状态', () => {
      const result = analyzeHealthCheck({
        status: MCPServerHealthStatus.UNHEALTHY,
        message: '连接失败',
        timestamp: '2023-01-01T00:00:00.000Z'
      });
      
      expect(result).toContain('服务器不健康');
      expect(result).toContain('连接失败');
    });
    
    it('应该解析未知状态', () => {
      const result = analyzeHealthCheck({
        status: MCPServerHealthStatus.UNKNOWN,
        message: '无法确定状态',
        timestamp: '2023-01-01T00:00:00.000Z'
      });
      
      expect(result).toContain('服务器状态未知');
      expect(result).toContain('无法确定状态');
    });
  });
}); 