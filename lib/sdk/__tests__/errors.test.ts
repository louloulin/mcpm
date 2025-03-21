/**
 * 错误类单元测试
 */

import {
  MCPError,
  ApiError,
  ValidationError,
  AuthenticationError,
  ConfigurationError,
  TimeoutError,
  ResourceNotFoundError,
  RetryFailedError
} from '../../errors';

describe('错误类', () => {
  describe('MCPError', () => {
    it('应正确初始化基础错误', () => {
      const error = new MCPError('测试错误');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(MCPError);
      expect(error.name).toBe('MCPError');
      expect(error.message).toBe('测试错误');
    });
  });
  
  describe('ApiError', () => {
    it('应正确初始化API错误', () => {
      const error = new ApiError('API请求失败', 404, { reason: 'Not Found' });
      
      expect(error).toBeInstanceOf(MCPError);
      expect(error).toBeInstanceOf(ApiError);
      expect(error.name).toBe('ApiError');
      expect(error.message).toBe('API请求失败');
      expect(error.statusCode).toBe(404);
      expect(error.data).toEqual({ reason: 'Not Found' });
    });
    
    it('应使用默认状态码和数据', () => {
      const error = new ApiError('API请求失败');
      
      expect(error.statusCode).toBe(0);
      expect(error.data).toEqual({});
    });
    
    it('状态检查方法应正确工作', () => {
      const error = new ApiError('请求被拒绝', 403);
      
      expect(error.isStatus(403)).toBe(true);
      expect(error.isStatus(404)).toBe(false);
      expect(error.isUnauthorized()).toBe(false);
      expect(error.isForbidden()).toBe(true);
      expect(error.isNotFound()).toBe(false);
      expect(error.isServerError()).toBe(false);
      
      const serverError = new ApiError('服务器错误', 500);
      expect(serverError.isServerError()).toBe(true);
    });
  });
  
  describe('ValidationError', () => {
    it('应正确初始化验证错误', () => {
      const errors = {
        name: ['名称不能为空'],
        email: ['邮箱格式无效']
      };
      const error = new ValidationError('输入验证失败', errors);
      
      expect(error).toBeInstanceOf(MCPError);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('输入验证失败');
      expect(error.errors).toEqual(errors);
    });
    
    it('应使用默认错误对象', () => {
      const error = new ValidationError('输入验证失败');
      expect(error.errors).toEqual({});
    });
  });
  
  describe('AuthenticationError', () => {
    it('应正确初始化认证错误', () => {
      const error = new AuthenticationError('登录失败');
      
      expect(error).toBeInstanceOf(MCPError);
      expect(error).toBeInstanceOf(AuthenticationError);
      expect(error.name).toBe('AuthenticationError');
      expect(error.message).toBe('登录失败');
    });
    
    it('应使用默认消息', () => {
      const error = new AuthenticationError();
      expect(error.message).toBe('认证失败');
    });
  });
  
  describe('ConfigurationError', () => {
    it('应正确初始化配置错误', () => {
      const error = new ConfigurationError('缺少必要的配置项');
      
      expect(error).toBeInstanceOf(MCPError);
      expect(error).toBeInstanceOf(ConfigurationError);
      expect(error.name).toBe('ConfigurationError');
      expect(error.message).toBe('缺少必要的配置项');
    });
  });
  
  describe('TimeoutError', () => {
    it('应正确初始化超时错误', () => {
      const error = new TimeoutError('fetchData', 5000);
      
      expect(error).toBeInstanceOf(MCPError);
      expect(error).toBeInstanceOf(TimeoutError);
      expect(error.name).toBe('TimeoutError');
      expect(error.operationName).toBe('fetchData');
      expect(error.timeoutMs).toBe(5000);
      expect(error.message).toContain('fetchData');
      expect(error.message).toContain('5000');
    });
  });
  
  describe('ResourceNotFoundError', () => {
    it('应正确初始化资源未找到错误', () => {
      const error = new ResourceNotFoundError('User', '123');
      
      expect(error).toBeInstanceOf(MCPError);
      expect(error).toBeInstanceOf(ResourceNotFoundError);
      expect(error.name).toBe('ResourceNotFoundError');
      expect(error.resourceType).toBe('User');
      expect(error.resourceId).toBe('123');
      expect(error.message).toContain('User');
      expect(error.message).toContain('123');
    });
  });
  
  describe('RetryFailedError', () => {
    it('应正确初始化重试失败错误', () => {
      const originalError = new Error('原始错误');
      const error = new RetryFailedError('请求失败', 3, originalError);
      
      expect(error).toBeInstanceOf(MCPError);
      expect(error).toBeInstanceOf(RetryFailedError);
      expect(error.name).toBe('RetryFailedError');
      expect(error.message).toBe('请求失败');
      expect(error.attempts).toBe(3);
      expect(error.originalError).toBe(originalError);
    });
    
    it('应允许originalError为null', () => {
      const error = new RetryFailedError('请求失败', 3);
      expect(error.originalError).toBeNull();
    });
  });
}); 