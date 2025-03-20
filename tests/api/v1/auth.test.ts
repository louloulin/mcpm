import { NextRequest } from 'next/server';
import httpMocks from 'node-mocks-http';
import { GET as getMeHandler } from '@/app/api/v1/auth/me/route';
import { POST as loginHandler } from '@/app/api/v1/auth/login/route';
import { POST as createTokenHandler } from '@/app/api/v1/auth/tokens/route';
import { GET as validateTokenHandler } from '@/app/api/v1/auth/validate/route';

// 模拟 NextRequest
function createMockRequest(method: 'GET' | 'POST' | 'PUT' | 'DELETE', url: string, body?: any, headers?: any) {
  const req = httpMocks.createRequest({
    method,
    url,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  });
  
  if (body) {
    req.body = body;
  }
  
  // 模拟 NextRequest 的 json 方法
  (req as any).json = async () => body;
  
  return req as unknown as NextRequest;
}

describe('认证API测试', () => {
  describe('GET /api/v1/auth/me', () => {
    it('应该返回访客状态（未登录）', async () => {
      // 直接调用handler函数，不需要请求对象
      const res = await getMeHandler();
      
      const data = await res.json();
      expect(data.status).toBe('success');
      expect(data.data.isLoggedIn).toBe(false);
      expect(data.data.role).toBe('guest');
    });
  });
  
  describe('POST /api/v1/auth/login', () => {
    it('使用正确的凭据应该返回令牌和用户信息', async () => {
      const req = createMockRequest('POST', '/api/v1/auth/login', {
        username: 'admin',
        password: 'securepassword123'
      });
      
      const res = await loginHandler(req);
      const data = await res.json();
      
      expect(data.token).toBeDefined();
      expect(data.user).toBeDefined();
      expect(data.user.username).toBe('admin');
      expect(data.user.role).toBe('admin');
      expect(data.expires_at).toBeDefined();
    });
    
    it('使用错误的凭据应该返回401错误', async () => {
      const req = createMockRequest('POST', '/api/v1/auth/login', {
        username: 'admin',
        password: 'wrongpassword'
      });
      
      const res = await loginHandler(req);
      expect(res.status).toBe(401);
      
      const data = await res.json();
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('invalid_credentials');
    });
  });
  
  describe('POST /api/v1/auth/tokens', () => {
    it('应该创建新的API令牌', async () => {
      const req = createMockRequest('POST', '/api/v1/auth/tokens', {
        name: 'Test Token',
        expires_in: 3600,
        scopes: ['read:servers', 'read:users']
      }, {
        Authorization: 'Bearer valid-session-token'
      });
      
      const res = await createTokenHandler(req);
      const data = await res.json();
      
      expect(data.token).toBeDefined();
      expect(data.token).toMatch(/^mcpm_api_/);
      expect(data.name).toBe('Test Token');
      expect(data.scopes).toEqual(['read:servers', 'read:users']);
      expect(data.created_at).toBeDefined();
      expect(data.expires_at).toBeDefined();
    });
    
    it('没有名称应该返回400错误', async () => {
      const req = createMockRequest('POST', '/api/v1/auth/tokens', {
        expires_in: 3600,
        scopes: ['read:servers']
      }, {
        Authorization: 'Bearer valid-session-token'
      });
      
      const res = await createTokenHandler(req);
      expect(res.status).toBe(400);
      
      const data = await res.json();
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('invalid_request');
    });
  });
  
  describe('GET /api/v1/auth/validate', () => {
    it('对有效令牌应该返回令牌信息', async () => {
      const req = createMockRequest('GET', '/api/v1/auth/validate', null, {
        Authorization: 'Bearer mcpm_api_validtoken123'
      });
      
      const res = await validateTokenHandler(req);
      const data = await res.json();
      
      expect(data.valid).toBe(true);
      expect(data.token_info).toBeDefined();
      expect(data.token_info.user_id).toBeDefined();
      expect(data.token_info.scopes).toBeDefined();
    });
    
    it('对无效令牌应该返回401错误', async () => {
      const req = createMockRequest('GET', '/api/v1/auth/validate', null, {
        Authorization: 'Bearer invalid-token'
      });
      
      const res = await validateTokenHandler(req);
      expect(res.status).toBe(401);
      
      const data = await res.json();
      expect(data.valid).toBe(false);
    });
    
    it('没有令牌应该返回401错误', async () => {
      const req = createMockRequest('GET', '/api/v1/auth/validate');
      
      const res = await validateTokenHandler(req);
      expect(res.status).toBe(401);
      
      const data = await res.json();
      expect(data.valid).toBe(false);
    });
  });
}); 