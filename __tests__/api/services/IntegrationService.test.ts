import { IntegrationService, IntegrationType } from '../../../lib/api/services/IntegrationService';
import { db } from '../../../lib/database';
import { integrations } from '../../../lib/database/schema';
import { eq } from 'drizzle-orm';

// 模拟数据库
jest.mock('../../../lib/database', () => ({
  db: {
    insert: jest.fn(),
    select: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  }
}));

describe('IntegrationService', () => {
  let integrationService: IntegrationService;
  
  // 测试数据
  const testIntegration = {
    id: 'test-integration-id',
    name: 'Test Integration',
    type: 'ide' as IntegrationType,
    apiKey: 'mcp_test_api_key',
    webhookUrl: 'https://example.com/webhook',
    settings: '{"setting1":"value1"}',
    userId: 'test-user-id',
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // 在每个测试之前重置
  beforeEach(() => {
    jest.clearAllMocks();
    integrationService = IntegrationService.getInstance();
  });
  
  describe('createIntegration', () => {
    it('should create a new integration', async () => {
      // 模拟数据库返回
      (db.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([testIntegration])
        })
      });
      
      // 执行测试
      const result = await integrationService.createIntegration({
        name: 'Test Integration',
        type: IntegrationType.IDE,
        webhookUrl: 'https://example.com/webhook',
        settings: { setting1: 'value1' },
        userId: 'test-user-id',
        enabled: true
      });
      
      // 验证结果
      expect(db.insert).toHaveBeenCalledWith(integrations);
      expect(result).toEqual({
        id: 'test-integration-id',
        name: 'Test Integration',
        type: 'ide',
        apiKey: 'mcp_test_api_key',
        webhookUrl: 'https://example.com/webhook',
        settings: { setting1: 'value1' },
        userId: 'test-user-id',
        enabled: true,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      });
    });
  });
  
  describe('getUserIntegrations', () => {
    it('should return all integrations for a user', async () => {
      // 模拟数据库返回
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([testIntegration])
        })
      });
      
      // 执行测试
      const result = await integrationService.getUserIntegrations('test-user-id');
      
      // 验证结果
      expect(db.select).toHaveBeenCalled();
      expect(result).toEqual([
        {
          id: 'test-integration-id',
          name: 'Test Integration',
          type: 'ide',
          apiKey: 'mcp_test_api_key',
          webhookUrl: 'https://example.com/webhook',
          settings: { setting1: 'value1' },
          userId: 'test-user-id',
          enabled: true,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date)
        }
      ]);
    });
  });
  
  describe('updateIntegration', () => {
    it('should update an integration', async () => {
      const updatedIntegration = {
        ...testIntegration,
        name: 'Updated Integration',
        settings: '{"setting1":"updated"}'
      };
      
      // 模拟数据库返回
      (db.update as jest.Mock).mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([updatedIntegration])
          })
        })
      });
      
      // 执行测试
      const result = await integrationService.updateIntegration('test-integration-id', {
        name: 'Updated Integration',
        settings: { setting1: 'updated' }
      });
      
      // 验证结果
      expect(db.update).toHaveBeenCalledWith(integrations);
      expect(result).toEqual({
        id: 'test-integration-id',
        name: 'Updated Integration',
        type: 'ide',
        apiKey: 'mcp_test_api_key',
        webhookUrl: 'https://example.com/webhook',
        settings: { setting1: 'updated' },
        userId: 'test-user-id',
        enabled: true,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      });
    });
  });
  
  describe('deleteIntegration', () => {
    it('should delete an integration', async () => {
      // 模拟数据库返回
      (db.delete as jest.Mock).mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([testIntegration])
        })
      });
      
      // 执行测试
      const result = await integrationService.deleteIntegration('test-integration-id');
      
      // 验证结果
      expect(db.delete).toHaveBeenCalledWith(integrations);
      expect(result).toBe(true);
    });
    
    it('should return false if integration does not exist', async () => {
      // 模拟数据库返回
      (db.delete as jest.Mock).mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([])
        })
      });
      
      // 执行测试
      const result = await integrationService.deleteIntegration('non-existent-id');
      
      // 验证结果
      expect(db.delete).toHaveBeenCalledWith(integrations);
      expect(result).toBe(false);
    });
  });
  
  describe('validateApiKey', () => {
    it('should validate a valid API key', async () => {
      // 模拟数据库返回
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([testIntegration])
        })
      });
      
      // 执行测试
      const result = await integrationService.validateApiKey('mcp_test_api_key');
      
      // 验证结果
      expect(db.select).toHaveBeenCalled();
      expect(result).toEqual({
        id: 'test-integration-id',
        name: 'Test Integration',
        type: 'ide',
        apiKey: 'mcp_test_api_key',
        webhookUrl: 'https://example.com/webhook',
        settings: { setting1: 'value1' },
        userId: 'test-user-id',
        enabled: true,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      });
    });
    
    it('should return null for invalid API key', async () => {
      // 模拟数据库返回
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([])
        })
      });
      
      // 执行测试
      const result = await integrationService.validateApiKey('invalid_key');
      
      // 验证结果
      expect(db.select).toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });
  
  describe('regenerateApiKey', () => {
    it('should regenerate API key', async () => {
      const newApiKey = 'mcp_new_api_key';
      
      // 模拟crypto.randomBytes
      jest.spyOn(global.crypto, 'randomBytes').mockImplementation(() => ({
        toString: () => 'new_api_key'
      } as any));
      
      // 模拟数据库返回
      (db.update as jest.Mock).mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(true)
        })
      });
      
      // 执行测试
      const result = await integrationService.regenerateApiKey('test-integration-id');
      
      // 验证结果
      expect(db.update).toHaveBeenCalledWith(integrations);
      expect(result).toBe('mcp_new_api_key');
    });
  });
}); 