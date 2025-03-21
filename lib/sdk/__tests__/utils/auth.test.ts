/**
 * 身份验证工具函数单元测试
 */

import { createAuthHeaders, validateApiKey, parseToken, extractTokenFromHeader } from '../../utils/auth';
import { AuthenticationError } from '../../errors';

describe('身份验证工具', () => {
  describe('createAuthHeaders', () => {
    it('应生成带有Bearer前缀的认证头', () => {
      const apiKey = 'test_api_key';
      const header = createAuthHeaders(apiKey);
      
      expect(header).toEqual({
        'Authorization': 'Bearer test_api_key'
      });
    });
    
    it('空API密钥应返回空对象', () => {
      const header = createAuthHeaders('');
      expect(header).toEqual({});
    });
    
    it('undefined API密钥应返回空对象', () => {
      const header = createAuthHeaders(undefined);
      expect(header).toEqual({});
    });
  });
  
  describe('validateApiKey', () => {
    it('有效的API密钥应通过验证', () => {
      const validApiKeys = [
        'mcp_1234567890abcdef',
        'mcp_test_1234567890abcdef',
        'mcp_live_1234567890abcdef'
      ];
      
      validApiKeys.forEach(key => {
        expect(() => validateApiKey(key)).not.toThrow();
      });
    });
    
    it('无效格式的API密钥应抛出错误', () => {
      const invalidApiKeys = [
        '',             // 空字符串
        'invalid_key',  // 无效前缀
        'mcp_',         // 只有前缀
        'mcp_123'       // 长度不足
      ];
      
      invalidApiKeys.forEach(key => {
        expect(() => validateApiKey(key)).toThrow(AuthenticationError);
      });
    });
    
    it('应验证前缀是否为mcp', () => {
      expect(() => validateApiKey('invalid_1234567890abcdef')).toThrow(
        'API密钥格式无效，必须以"mcp_"开头'
      );
    });
    
    it('应验证密钥长度', () => {
      expect(() => validateApiKey('mcp_short')).toThrow(
        '密钥长度无效，至少应包含10个字符'
      );
    });
  });
  
  describe('parseToken', () => {
    it('应解析有效的JWT令牌', () => {
      // 一个示例JWT，结构为 header.payload.signature
      const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      
      const payload = parseToken(jwt);
      expect(payload).toEqual({
        sub: '1234567890',
        name: 'John Doe',
        iat: 1516239022
      });
    });
    
    it('无效JWT格式应抛出错误', () => {
      const invalidTokens = [
        '',              // 空字符串
        'not.a.jwt',     // 格式无效
        'header.payload' // 缺少签名
      ];
      
      invalidTokens.forEach(token => {
        expect(() => parseToken(token)).toThrow(AuthenticationError);
      });
    });
    
    it('无效Base64编码应抛出错误', () => {
      // 包含无效Base64的JWT
      const invalidBase64Token = 'header.@invalid@.signature';
      
      expect(() => parseToken(invalidBase64Token)).toThrow(AuthenticationError);
    });
    
    it('非JSON负载应抛出错误', () => {
      // Base64编码的非JSON字符串
      const nonJsonPayload = 'header.' + btoa('not-json') + '.signature';
      
      expect(() => parseToken(nonJsonPayload)).toThrow(AuthenticationError);
    });
  });
  
  describe('extractTokenFromHeader', () => {
    it('应从有效的Authorization头中提取令牌', () => {
      const authHeader = 'Bearer token123';
      const token = extractTokenFromHeader(authHeader);
      
      expect(token).toBe('token123');
    });
    
    it('空认证头应抛出错误', () => {
      expect(() => extractTokenFromHeader('')).toThrow(AuthenticationError);
      expect(() => extractTokenFromHeader(undefined)).toThrow(AuthenticationError);
    });
    
    it('格式错误的认证头应抛出错误', () => {
      const invalidHeaders = [
        'token123',          // 缺少Bearer前缀
        'Basic token123',    // 错误的认证方案
        'Bearer'             // 缺少令牌
      ];
      
      invalidHeaders.forEach(header => {
        expect(() => extractTokenFromHeader(header)).toThrow(AuthenticationError);
      });
    });
  });
}); 