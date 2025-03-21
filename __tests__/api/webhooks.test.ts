import { describe, expect, it, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { GET, POST } from '@/app/api/v1/webhooks/route';
import { GET as getWebhook, PATCH, DELETE } from '@/app/api/v1/webhooks/[id]/route';
import { POST as triggerEvent } from '@/app/api/v1/webhooks/events/route';
import { webhooks } from '@/lib/database/schema';
import { getServerSession } from 'next-auth';
import { eq } from 'drizzle-orm';
import { createNextRequest } from '../utils/test-utils';
import { testDb, testPool } from '../utils/test-db';
import { sql } from 'drizzle-orm';
import type { NewWebhook } from '@/lib/database/schema';

// 替换原始数据库连接
vi.mock('@/lib/database', () => ({
  db: testDb
}));

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn()
}));

// Mock fetch
vi.stubGlobal('fetch', vi.fn());

describe('Webhooks API', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com'
  };

  const mockSession = {
    user: mockUser
  };

  beforeAll(async () => {
    // 清理测试数据
    await testDb.execute(sql`TRUNCATE TABLE webhooks CASCADE`);
  });

  afterAll(async () => {
    // 清理测试数据并关闭连接池
    await testDb.execute(sql`TRUNCATE TABLE webhooks CASCADE`);
    await testPool.end();
  });

  beforeEach(() => {
    // 重置所有模拟
    vi.resetAllMocks();
    (getServerSession as any).mockResolvedValue(mockSession);
  });

  afterEach(async () => {
    // 清理测试数据
    await testDb.execute(sql`TRUNCATE TABLE webhooks CASCADE`);
  });

  describe('GET /api/v1/webhooks', () => {
    it('should return an empty array when no webhooks exist', async () => {
      const req = createNextRequest({
        method: 'GET',
        url: '/api/v1/webhooks'
      });

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual([]);
    });

    it('should return all webhooks for the authenticated user', async () => {
      // Create a test webhook
      const webhook = {
        id: 'webhook-123',
        url: 'https://example.com/webhook',
        events: ['user.created', 'user.updated'],
        active: true,
        secret: 'test-secret',
        userId: mockUser.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await testDb.insert(webhooks).values({
        url: webhook.url,
        events: webhook.events,
        active: webhook.active,
        secret: webhook.secret,
        userId: webhook.userId
      });

      const req = createNextRequest({
        method: 'GET',
        url: '/api/v1/webhooks'
      });

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0]).toMatchObject({
        id: webhook.id,
        url: webhook.url,
        events: webhook.events,
        active: webhook.active
      });
    });
  });

  describe('POST /api/v1/webhooks', () => {
    it('should create a new webhook', async () => {
      const webhookData = {
        url: 'https://example.com/webhook',
        events: ['user.created'],
        active: true
      };

      const req = createNextRequest({
        method: 'POST',
        url: '/api/v1/webhooks',
        body: webhookData
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toMatchObject({
        url: webhookData.url,
        events: webhookData.events,
        active: webhookData.active,
        userId: mockUser.id
      });
      expect(data.id).toBeDefined();
      expect(data.secret).toBeDefined();
      expect(data.createdAt).toBeDefined();
      expect(data.updatedAt).toBeDefined();

      // Verify the webhook was created in the database
      const savedWebhook = await testDb.query.webhooks.findFirst({
        where: eq(webhooks.id, data.id)
      });

      expect(savedWebhook).toBeDefined();
      expect(savedWebhook).toMatchObject({
        url: webhookData.url,
        events: webhookData.events,
        active: webhookData.active,
        userId: mockUser.id
      });
    });

    it('should return 400 for invalid webhook data', async () => {
      const invalidData = {
        // Missing required url field
        events: ['user.created'],
        active: true
      };

      const req = createNextRequest({
        method: 'POST',
        url: '/api/v1/webhooks',
        body: invalidData
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('should return 401 when user is not authenticated', async () => {
      (getServerSession as any).mockResolvedValue(null);

      const webhookData = {
        url: 'https://example.com/webhook',
        events: ['user.created'],
        active: true
      };

      const req = createNextRequest({
        method: 'POST',
        url: '/api/v1/webhooks',
        body: webhookData
      });

      const response = await POST(req);
      expect(response.status).toBe(401);
    });

    it('should return 400 for invalid URL format', async () => {
      const invalidData = {
        url: 'not-a-url',  // Invalid URL format
        events: ['user.created'],
        active: true
      };

      const req = createNextRequest({
        method: 'POST',
        url: '/api/v1/webhooks',
        body: invalidData
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toMatch(/invalid.*url/i);
    });

    it('should return 400 for non-HTTPS URL', async () => {
      const invalidData = {
        url: 'http://example.com/webhook',  // Non-HTTPS URL
        events: ['user.created'],
        active: true
      };

      const req = createNextRequest({
        method: 'POST',
        url: '/api/v1/webhooks',
        body: invalidData
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toMatch(/https.*required/i);
    });

    it('should return 400 for invalid event types', async () => {
      const invalidData = {
        url: 'https://example.com/webhook',
        events: ['invalid.event'],  // Invalid event type
        active: true
      };

      const req = createNextRequest({
        method: 'POST',
        url: '/api/v1/webhooks',
        body: invalidData
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toMatch(/invalid.*event/i);
    });

    it('should return 400 for empty events array', async () => {
      const invalidData = {
        url: 'https://example.com/webhook',
        events: [],  // Empty events array
        active: true
      };

      const req = createNextRequest({
        method: 'POST',
        url: '/api/v1/webhooks',
        body: invalidData
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toMatch(/events.*required/i);
    });

    it('should return 400 for duplicate event types', async () => {
      const invalidData = {
        url: 'https://example.com/webhook',
        events: ['user.created', 'user.created'],  // Duplicate event type
        active: true
      };

      const req = createNextRequest({
        method: 'POST',
        url: '/api/v1/webhooks',
        body: invalidData
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toMatch(/duplicate.*event/i);
    });
  });

  describe('GET /api/v1/webhooks/[id]', () => {
    it('should return 404 for non-existent webhook', async () => {
      const req = createNextRequest({
        method: 'GET'
      });

      const response = await getWebhook(req, { params: { id: 'non-existent' } });
      expect(response.status).toBe(404);
    });

    it('should return webhook details', async () => {
      const webhook = {
        id: 'webhook-123',
        userId: mockUser.id,
        url: 'https://example.com/webhook',
        events: ['server.created'],
        secret: 'test-secret',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await testDb.insert(webhooks).values(webhook);

      const req = createNextRequest({
        method: 'GET'
      });

      const response = await getWebhook(req, { params: { id: webhook.id } });
      const data = await response.json();

      expect(data.id).toBe(webhook.id);
      expect(data.secret).toMatch(/^[a-f0-9]{8}\.\.\.$/);
    });
  });

  describe('PATCH /api/v1/webhooks/[id]', () => {
    let webhook: NewWebhook & { id: string };

    beforeEach(async () => {
      // Create a test webhook
      webhook = {
        id: 'webhook-123',
        url: 'https://example.com/webhook',
        events: ['user.created'],
        active: true,
        secret: 'test-secret',
        userId: mockUser.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await testDb.insert(webhooks).values({
        url: webhook.url,
        events: webhook.events,
        active: webhook.active,
        secret: webhook.secret,
        userId: webhook.userId
      });
    });

    it('should update an existing webhook', async () => {
      const updates = {
        url: 'https://example.com/webhook2',
        events: ['user.created', 'user.updated'],
        active: false
      };

      const req = createNextRequest({
        method: 'PATCH',
        url: `/api/v1/webhooks/${webhook.id}`,
        body: updates
      });

      const response = await PATCH(req, { params: { id: webhook.id } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        ...webhook,
        ...updates,
        updatedAt: expect.any(String)
      });

      // Verify the webhook was updated in the database
      const updatedWebhook = await testDb.query.webhooks.findFirst({
        where: eq(webhooks.id, webhook.id)
      });

      expect(updatedWebhook).toBeDefined();
      expect(updatedWebhook).toMatchObject({
        ...webhook,
        ...updates
      });
    });

    it('should return 404 for non-existent webhook', async () => {
      const req = createNextRequest({
        method: 'PATCH',
        url: '/api/v1/webhooks/non-existent',
        body: { url: 'https://example.com/webhook2' }
      });

      const response = await PATCH(req, { params: { id: 'non-existent' } });
      expect(response.status).toBe(404);
    });

    it('should return 401 when user is not authenticated', async () => {
      (getServerSession as any).mockResolvedValue(null);

      const req = createNextRequest({
        method: 'PATCH',
        url: `/api/v1/webhooks/${webhook.id}`,
        body: { url: 'https://example.com/webhook2' }
      });

      const response = await PATCH(req, { params: { id: webhook.id } });
      expect(response.status).toBe(401);
    });

    it('should return 400 when updating with invalid URL', async () => {
      const updates = {
        url: 'not-a-url'  // Invalid URL format
      };

      const req = createNextRequest({
        method: 'PATCH',
        url: `/api/v1/webhooks/${webhook.id}`,
        body: updates
      });

      const response = await PATCH(req, { params: { id: webhook.id } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toMatch(/invalid.*url/i);
    });

    it('should return 400 when updating with invalid event types', async () => {
      const updates = {
        events: ['invalid.event']  // Invalid event type
      };

      const req = createNextRequest({
        method: 'PATCH',
        url: `/api/v1/webhooks/${webhook.id}`,
        body: updates
      });

      const response = await PATCH(req, { params: { id: webhook.id } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toMatch(/invalid.*event/i);
    });
  });

  describe('DELETE /api/v1/webhooks/[id]', () => {
    let webhook: NewWebhook & { id: string };

    beforeEach(async () => {
      // Create a test webhook
      webhook = {
        id: 'webhook-123',
        url: 'https://example.com/webhook',
        events: ['user.created'],
        active: true,
        secret: 'test-secret',
        userId: mockUser.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await testDb.insert(webhooks).values({
        url: webhook.url,
        events: webhook.events,
        active: webhook.active,
        secret: webhook.secret,
        userId: webhook.userId
      });
    });

    it('should delete an existing webhook', async () => {
      const req = createNextRequest({
        method: 'DELETE',
        url: `/api/v1/webhooks/${webhook.id}`
      });

      const response = await DELETE(req, { params: { id: webhook.id } });
      expect(response.status).toBe(204);

      // Verify the webhook was deleted from the database
      const deletedWebhook = await testDb.query.webhooks.findFirst({
        where: eq(webhooks.id, webhook.id)
      });

      expect(deletedWebhook).toBeNull();
    });

    it('should return 404 for non-existent webhook', async () => {
      const req = createNextRequest({
        method: 'DELETE',
        url: '/api/v1/webhooks/non-existent'
      });

      const response = await DELETE(req, { params: { id: 'non-existent' } });
      expect(response.status).toBe(404);
    });

    it('should return 401 when user is not authenticated', async () => {
      (getServerSession as any).mockResolvedValue(null);

      const req = createNextRequest({
        method: 'DELETE',
        url: `/api/v1/webhooks/${webhook.id}`
      });

      const response = await DELETE(req, { params: { id: webhook.id } });
      expect(response.status).toBe(401);
    });

    it('should return 403 when user tries to delete another user\'s webhook', async () => {
      const otherUserWebhook = {
        id: 'webhook-456',
        url: 'https://example.com/webhook',
        events: ['user.created'],
        active: true,
        secret: 'test-secret',
        userId: 'other-user-id',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await testDb.insert(webhooks).values({
        url: otherUserWebhook.url,
        events: otherUserWebhook.events,
        active: otherUserWebhook.active,
        secret: otherUserWebhook.secret,
        userId: otherUserWebhook.userId
      });

      const req = createNextRequest({
        method: 'DELETE',
        url: `/api/v1/webhooks/${otherUserWebhook.id}`
      });

      const response = await DELETE(req, { params: { id: otherUserWebhook.id } });
      expect(response.status).toBe(403);

      // Verify the webhook was not deleted
      const webhook = await testDb.query.webhooks.findFirst({
        where: eq(webhooks.id, otherUserWebhook.id)
      });

      expect(webhook).not.toBeNull();
    });
  });

  describe('POST /api/v1/webhooks/events', () => {
    let webhook: NewWebhook & { id: string };

    beforeEach(async () => {
      // Create a test webhook
      webhook = {
        id: 'webhook-123',
        url: 'https://example.com/webhook',
        events: ['user.created'],
        active: true,
        secret: 'test-secret',
        userId: mockUser.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await testDb.insert(webhooks).values({
        url: webhook.url,
        events: webhook.events,
        active: webhook.active,
        secret: webhook.secret,
        userId: webhook.userId
      });

      // Reset fetch mock
      (global.fetch as jest.Mock).mockReset();
    });

    it('should trigger webhooks for the specified event', async () => {
      const eventData = {
        type: 'user.created',
        data: {
          id: 'user-456',
          email: 'newuser@example.com'
        }
      };

      const req = createNextRequest({
        method: 'POST',
        url: '/api/v1/webhooks/events',
        body: eventData
      });

      // Mock the fetch response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200
      });

      const response = await triggerEvent(req);
      expect(response.status).toBe(200);

      // Verify that fetch was called with the correct arguments
      expect(global.fetch).toHaveBeenCalledWith(webhook.url, expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'X-Webhook-Signature': expect.any(String),
          'X-Event-Type': eventData.type
        }),
        body: JSON.stringify(eventData)
      }));
    });

    it('should not trigger inactive webhooks', async () => {
      // Update webhook to be inactive
      await testDb.update(webhooks)
        .set({ active: false })
        .where(eq(webhooks.id, webhook.id));

      const eventData = {
        type: 'user.created',
        data: {
          id: 'user-456',
          email: 'newuser@example.com'
        }
      };

      const req = createNextRequest({
        method: 'POST',
        url: '/api/v1/webhooks/events',
        body: eventData
      });

      const response = await triggerEvent(req);
      expect(response.status).toBe(200);

      // Verify that fetch was not called
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should not trigger webhooks for unsubscribed events', async () => {
      const eventData = {
        type: 'user.deleted',  // Webhook is not subscribed to this event
        data: {
          id: 'user-456'
        }
      };

      const req = createNextRequest({
        method: 'POST',
        url: '/api/v1/webhooks/events',
        body: eventData
      });

      const response = await triggerEvent(req);
      expect(response.status).toBe(200);

      // Verify that fetch was not called
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid event type', async () => {
      const eventData = {
        type: '',  // Empty event type
        data: {}
      };

      const req = createNextRequest({
        method: 'POST',
        url: '/api/v1/webhooks/events',
        body: eventData
      });

      const response = await triggerEvent(req);
      expect(response.status).toBe(400);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', async () => {
      (getServerSession as any).mockResolvedValue(null);

      const eventData = {
        type: 'user.created',
        data: {}
      };

      const req = createNextRequest({
        method: 'POST',
        url: '/api/v1/webhooks/events',
        body: eventData
      });

      const response = await triggerEvent(req);
      expect(response.status).toBe(401);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle webhook delivery failures gracefully', async () => {
      const eventData = {
        type: 'user.created',
        data: {
          id: 'user-456',
          email: 'newuser@example.com'
        }
      };

      const req = createNextRequest({
        method: 'POST',
        url: '/api/v1/webhooks/events',
        body: eventData
      });

      // Mock a failed webhook delivery
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const response = await triggerEvent(req);
      expect(response.status).toBe(200);  // The API should still return 200 even if delivery fails

      // Verify that fetch was called
      expect(global.fetch).toHaveBeenCalledWith(webhook.url, expect.any(Object));
    });

    it('should include a valid HMAC signature in the webhook request', async () => {
      const eventData = {
        type: 'user.created',
        data: {
          id: 'user-456',
          email: 'newuser@example.com'
        }
      };

      const req = createNextRequest({
        method: 'POST',
        url: '/api/v1/webhooks/events',
        body: eventData
      });

      // Mock the fetch response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200
      });

      const response = await triggerEvent(req);
      expect(response.status).toBe(200);

      // Verify that fetch was called with a valid HMAC signature
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const options = fetchCall[1];
      const signature = options.headers['X-Webhook-Signature'];

      expect(signature).toBeDefined();
      expect(signature).toMatch(/^t=\d+,v1=[a-f0-9]{64}$/);  // Format: t=timestamp,v1=signature
    });

    it('should retry failed webhook deliveries', async () => {
      const eventData = {
        type: 'user.created',
        data: {
          id: 'user-456',
          email: 'newuser@example.com'
        }
      };

      const req = createNextRequest({
        method: 'POST',
        url: '/api/v1/webhooks/events',
        body: eventData
      });

      // Mock fetch to fail twice and succeed on third try
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200
        });

      const response = await triggerEvent(req);
      expect(response.status).toBe(200);

      // Verify that fetch was called three times
      expect(global.fetch).toHaveBeenCalledTimes(3);
      expect(global.fetch).toHaveBeenCalledWith(webhook.url, expect.any(Object));
    });

    it('should handle non-200 responses from webhook endpoints', async () => {
      const eventData = {
        type: 'user.created',
        data: {
          id: 'user-456',
          email: 'newuser@example.com'
        }
      };

      const req = createNextRequest({
        method: 'POST',
        url: '/api/v1/webhooks/events',
        body: eventData
      });

      // Mock fetch to return a 500 error
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      const response = await triggerEvent(req);
      expect(response.status).toBe(200);  // API should still return 200

      // Verify that fetch was called
      expect(global.fetch).toHaveBeenCalledWith(webhook.url, expect.any(Object));
    });

    it('should respect webhook timeout settings', async () => {
      const eventData = {
        type: 'user.created',
        data: {
          id: 'user-456',
          email: 'newuser@example.com'
        }
      };

      const req = createNextRequest({
        method: 'POST',
        url: '/api/v1/webhooks/events',
        body: eventData
      });

      // Mock fetch to delay for longer than the timeout
      (global.fetch as jest.Mock).mockImplementationOnce(() => new Promise(resolve => {
        setTimeout(() => {
          resolve({
            ok: true,
            status: 200
          });
        }, 5000);  // 5 seconds delay
      }));

      const response = await triggerEvent(req);
      expect(response.status).toBe(200);

      // Verify that fetch was called with a timeout
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const options = fetchCall[1];
      expect(options.signal).toBeDefined();  // AbortSignal should be present
    });

    it('should handle concurrent webhook deliveries', async () => {
      const eventData = {
        type: 'user.created',
        data: {
          id: 'user-456',
          email: 'newuser@example.com'
        }
      };

      // Create multiple webhooks with different URLs
      const testWebhooks = await Promise.all([1, 2, 3].map(async (num) => {
        const webhook = {
          url: `https://example.com/webhook${num}`,
          events: ['user.created'],
          active: true,
          secret: `test-secret-${num}`,
          userId: mockUser.id
        };

        await testDb.insert(webhooks).values(webhook);
        return webhook;
      }));

      const req = createNextRequest({
        method: 'POST',
        url: '/api/v1/webhooks/events',
        body: eventData
      });

      // Clear previous mocks and set up new ones for each webhook
      vi.clearAllMocks();
      
      // Mock fetch to resolve after random delays
      testWebhooks.forEach(() => {
        (global.fetch as jest.Mock).mockImplementationOnce(() => new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              status: 200
            });
          }, Math.random() * 100);  // Random delay up to 100ms for faster tests
        }));
      });

      const response = await triggerEvent(req);
      expect(response.status).toBe(200);

      // Verify that all webhooks were triggered
      expect(global.fetch).toHaveBeenCalledTimes(testWebhooks.length);
      testWebhooks.forEach((webhook) => {
        expect(global.fetch).toHaveBeenCalledWith(webhook.url, expect.any(Object));
      });
    });
  });
}); 