import { NextRequest } from 'next/server';
import httpMocks from 'node-mocks-http';
import { GET as getWebhooksHandler, POST as createWebhookHandler } from '@/app/api/v1/webhooks/route';
import { GET as getWebhookHandler, PATCH as updateWebhookHandler, DELETE as deleteWebhookHandler } from '@/app/api/v1/webhooks/[id]/route';
import { POST as triggerEventHandler } from '@/app/api/v1/webhooks/events/route';

// 模拟 NextRequest
function createMockRequest(method: 'GET' | 'POST' | 'PATCH' | 'DELETE', url: string, body?: any, headers?: any) {
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
  
  // 模拟 NextRequest 的 nextUrl.searchParams
  (req as any).nextUrl = {
    searchParams: new URLSearchParams(url.includes('?') ? url.split('?')[1] : '')
  };
  
  return req as unknown as NextRequest;
}

describe('Webhooks API测试', () => {
  describe('GET /api/v1/webhooks', () => {
    it('应该返回所有webhooks', async () => {
      const req = createMockRequest('GET', '/api/v1/webhooks');
      const res = await getWebhooksHandler(req);
      
      const data = await res.json();
      expect(data.data).toBeDefined();
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.pagination).toBeDefined();
      expect(data.pagination.total).toBeDefined();
    });
    
    it('应该支持分页参数', async () => {
      const req = createMockRequest('GET', '/api/v1/webhooks?limit=5&offset=0');
      const res = await getWebhooksHandler(req);
      
      const data = await res.json();
      expect(data.pagination.limit).toBe(5);
      expect(data.pagination.offset).toBe(0);
    });
  });
  
  describe('POST /api/v1/webhooks', () => {
    it('应该创建新的webhook', async () => {
      const webhookData = {
        url: 'https://example.org/my-webhook',
        events: ['server.created', 'server.deleted']
      };
      
      const req = createMockRequest('POST', '/api/v1/webhooks', webhookData);
      const res = await createWebhookHandler(req);
      
      expect(res.status).toBe(201);
      
      const data = await res.json();
      expect(data.id).toBeDefined();
      expect(data.url).toBe(webhookData.url);
      expect(data.events).toEqual(webhookData.events);
      expect(data.secret).toBeDefined();
      expect(data.active).toBe(true);
      expect(data.created_at).toBeDefined();
    });
    
    it('缺少URL应该返回400错误', async () => {
      const webhookData = {
        events: ['server.created']
      };
      
      const req = createMockRequest('POST', '/api/v1/webhooks', webhookData);
      const res = await createWebhookHandler(req);
      
      expect(res.status).toBe(400);
      
      const data = await res.json();
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('invalid_request');
    });
    
    it('缺少事件应该返回400错误', async () => {
      const webhookData = {
        url: 'https://example.org/my-webhook'
      };
      
      const req = createMockRequest('POST', '/api/v1/webhooks', webhookData);
      const res = await createWebhookHandler(req);
      
      expect(res.status).toBe(400);
      
      const data = await res.json();
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('invalid_request');
    });
    
    it('无效URL格式应该返回400错误', async () => {
      const webhookData = {
        url: 'invalid-url',
        events: ['server.created']
      };
      
      const req = createMockRequest('POST', '/api/v1/webhooks', webhookData);
      const res = await createWebhookHandler(req);
      
      expect(res.status).toBe(400);
      
      const data = await res.json();
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('invalid_request');
    });
  });
  
  describe('GET /api/v1/webhooks/[id]', () => {
    it('应该返回单个webhook', async () => {
      const mockParams = { id: 'webhook-1' };
      const req = createMockRequest('GET', `/api/v1/webhooks/${mockParams.id}`);
      const res = await getWebhookHandler(req, { params: mockParams });
      
      const data = await res.json();
      expect(data.id).toBe(mockParams.id);
      expect(data.url).toBeDefined();
      expect(data.events).toBeDefined();
    });
    
    it('不存在的webhook ID应该返回404错误', async () => {
      const mockParams = { id: 'non-existent-id' };
      const req = createMockRequest('GET', `/api/v1/webhooks/${mockParams.id}`);
      const res = await getWebhookHandler(req, { params: mockParams });
      
      expect(res.status).toBe(404);
      
      const data = await res.json();
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('not_found');
    });
  });
  
  describe('PATCH /api/v1/webhooks/[id]', () => {
    it('应该更新webhook', async () => {
      const mockParams = { id: 'webhook-1' };
      const updateData = {
        url: 'https://updated-example.com/webhook',
        active: false
      };
      
      const req = createMockRequest('PATCH', `/api/v1/webhooks/${mockParams.id}`, updateData);
      const res = await updateWebhookHandler(req, { params: mockParams });
      
      const data = await res.json();
      expect(data.id).toBe(mockParams.id);
      expect(data.url).toBe(updateData.url);
      expect(data.active).toBe(updateData.active);
      // 确保其他字段未被修改
      expect(data.secret).toBeDefined();
      expect(data.events).toBeDefined();
    });
    
    it('不存在的webhook ID应该返回404错误', async () => {
      const mockParams = { id: 'non-existent-id' };
      const req = createMockRequest('PATCH', `/api/v1/webhooks/${mockParams.id}`, { active: false });
      const res = await updateWebhookHandler(req, { params: mockParams });
      
      expect(res.status).toBe(404);
      
      const data = await res.json();
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('not_found');
    });
  });
  
  describe('DELETE /api/v1/webhooks/[id]', () => {
    it('应该删除webhook', async () => {
      const mockParams = { id: 'webhook-1' };
      const req = createMockRequest('DELETE', `/api/v1/webhooks/${mockParams.id}`);
      const res = await deleteWebhookHandler(req, { params: mockParams });
      
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.message).toBeDefined();
    });
    
    it('不存在的webhook ID应该返回404错误', async () => {
      const mockParams = { id: 'non-existent-id' };
      const req = createMockRequest('DELETE', `/api/v1/webhooks/${mockParams.id}`);
      const res = await deleteWebhookHandler(req, { params: mockParams });
      
      expect(res.status).toBe(404);
      
      const data = await res.json();
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('not_found');
    });
  });
  
  describe('POST /api/v1/webhooks/events', () => {
    it('应该触发webhook事件', async () => {
      const eventData = {
        event_type: 'server.created',
        payload: {
          server_id: 'srv-123',
          name: 'Test Server',
          version: '1.0.0'
        }
      };
      
      const req = createMockRequest('POST', '/api/v1/webhooks/events', eventData);
      const res = await triggerEventHandler(req);
      
      const data = await res.json();
      expect(data.event).toBeDefined();
      expect(data.delivered).toBeGreaterThan(0);
      expect(data.successful).toBeDefined();
      expect(data.results).toBeDefined();
      expect(Array.isArray(data.results)).toBe(true);
    });
    
    it('缺少事件类型应该返回400错误', async () => {
      const eventData = {
        payload: { server_id: 'srv-123' }
      };
      
      const req = createMockRequest('POST', '/api/v1/webhooks/events', eventData);
      const res = await triggerEventHandler(req);
      
      expect(res.status).toBe(400);
      
      const data = await res.json();
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('invalid_request');
    });
    
    it('缺少负载应该返回400错误', async () => {
      const eventData = {
        event_type: 'server.created'
      };
      
      const req = createMockRequest('POST', '/api/v1/webhooks/events', eventData);
      const res = await triggerEventHandler(req);
      
      expect(res.status).toBe(400);
      
      const data = await res.json();
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('invalid_request');
    });
  });
});