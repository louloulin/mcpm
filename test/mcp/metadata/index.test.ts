import { describe, it, expect } from 'vitest';
import metadata from '../../../lib/mcp/metadata';
import {
  MCPServerDefinition,
  MCPServerType,
  MCPServerStatus,
  MCPCompatibilityInfo,
  MCPResourceRequirements,
  MCPScreenshot,
  MCPExample,
  MCPReview
} from '../../../lib/mcp/types';

describe('MCP元数据模块', () => {
  // 创建基础测试服务器
  const createTestServer = (): MCPServerDefinition => ({
    name: 'test-server',
    version: '1.0.0',
    description: '测试服务器',
    url: 'http://localhost:3000',
    type: MCPServerType.APP,
    status: MCPServerStatus.ACTIVE,
    author: 'Test Author',
    homepage: 'http://localhost:3000/docs',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-02T00:00:00Z'
  });

  describe('validateMetadata', () => {
    it('应该验证有效的元数据', () => {
      const validMetadata = {
        category: 'test',
        keywords: ['test', 'mcp'],
        maintainers: [
          { name: 'Test User', email: 'test@example.com', url: 'https://example.com' }
        ],
        support: {
          email: 'support@example.com',
          url: 'https://support.example.com',
          documentation: 'https://docs.example.com'
        }
      };

      const result = metadata.validateMetadata(validMetadata);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('应该识别无效的元数据', () => {
      const invalidMetadata = {
        maintainers: [
          { name: '', email: 'invalid-email', url: 'invalid-url' }
        ],
        support: {
          email: 'invalid-email',
          url: 'invalid-url'
        },
        ratings: {
          average: 6, // 超出范围
          reviews: [
            { userId: '', rating: 0, createdAt: '' } // 无效的评论
          ]
        }
      };

      const result = metadata.validateMetadata(invalidMetadata);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
      
      // 检查特定错误
      expect(result.errors).toContain('维护者 #1 缺少名称');
      expect(result.errors).toContain('维护者 #1 邮箱格式无效');
      expect(result.errors).toContain('维护者 #1 URL格式无效');
      expect(result.errors).toContain('支持邮箱格式无效');
      expect(result.errors).toContain('支持url链接格式无效');
      expect(result.errors).toContain('平均评分必须在1-5之间');
      expect(result.errors).toContain('评论 #1 缺少用户ID');
      expect(result.errors).toContain('评论 #1 评分必须在1-5之间');
      expect(result.errors).toContain('评论 #1 缺少创建时间');
    });
  });

  describe('extractMetadata', () => {
    it('应该从服务器定义中提取元数据', () => {
      const server = createTestServer();
      const extractedMetadata = metadata.extractMetadata(server);

      expect(extractedMetadata.keywords).toEqual(server.tags || []);
      expect(extractedMetadata.category).toBe(server.type);
      expect(extractedMetadata.maintainers).toHaveLength(1);
      expect(extractedMetadata.maintainers?.[0].name).toBe(server.author);
      expect(extractedMetadata.support?.documentation).toBe(server.homepage);
      expect(extractedMetadata.stats?.firstPublished).toBe(server.createdAt);
      expect(extractedMetadata.stats?.lastUpdated).toBe(server.updatedAt);
    });

    it('应该返回已有的元数据', () => {
      const existingMetadata = {
        category: 'custom-category',
        keywords: ['custom']
      };
      const server = {
        ...createTestServer(),
        metadata: existingMetadata
      };

      const result = metadata.extractMetadata(server);
      expect(result).toBe(existingMetadata);
    });
  });

  describe('enhanceMetadata', () => {
    it('应该增强服务器元数据', () => {
      const server = createTestServer();
      const enhanced = metadata.enhanceMetadata(server);

      expect(enhanced.metadata).toBeDefined();
      expect(enhanced.tags).toBeDefined();
      expect(enhanced.createdAt).toBeDefined();
      expect(enhanced.updatedAt).toBeDefined();
      
      // 检查日期更新
      expect(new Date(enhanced.updatedAt!).getTime()).toBeGreaterThanOrEqual(
        new Date(server.updatedAt!).getTime()
      );
    });
  });

  describe('兼容性和资源信息', () => {
    it('应该添加兼容性信息', () => {
      const server = createTestServer();
      const compatibility: MCPCompatibilityInfo = {
        clients: ['web', 'mobile'],
        os: ['windows', 'macos', 'linux'],
        languages: ['en', 'zh']
      };

      const updated = metadata.addCompatibilityInfo(server, compatibility);
      
      expect(updated.metadata?.compatibility).toBeDefined();
      expect(updated.metadata?.compatibility?.clients).toEqual(compatibility.clients);
      expect(updated.metadata?.compatibility?.os).toEqual(compatibility.os);
      expect(updated.metadata?.compatibility?.languages).toEqual(compatibility.languages);
    });

    it('应该添加资源要求', () => {
      const server = createTestServer();
      const resources: MCPResourceRequirements = {
        cpu: '2',
        memory: '1024',
        storage: '10000'
      };

      const updated = metadata.addResourceRequirements(server, resources);
      
      expect(updated.metadata?.resources).toBeDefined();
      expect(updated.metadata?.resources?.cpu).toBe(resources.cpu);
      expect(updated.metadata?.resources?.memory).toBe(resources.memory);
      expect(updated.metadata?.resources?.storage).toBe(resources.storage);
    });
  });

  describe('屏幕截图和示例', () => {
    it('应该添加屏幕截图', () => {
      const server = createTestServer();
      const screenshots: MCPScreenshot[] = [
        {
          title: '主页',
          url: 'https://example.com/screenshot1.png',
          thumbnailUrl: 'https://example.com/screenshot1-thumb.png'
        },
        {
          title: '控制台',
          url: 'https://example.com/screenshot2.png'
        }
      ];

      const updated = metadata.addScreenshots(server, screenshots);
      
      expect(updated.metadata?.screenshots).toBeDefined();
      expect(updated.metadata?.screenshots).toHaveLength(screenshots.length);
      expect(updated.metadata?.screenshots?.[0].title).toBe(screenshots[0].title);
      expect(updated.metadata?.screenshots?.[0].url).toBe(screenshots[0].url);
    });

    it('应该添加使用示例', () => {
      const server = createTestServer();
      const examples: MCPExample[] = [
        {
          title: '基本使用',
          content: 'console.log("Hello World")',
          language: 'javascript'
        },
        {
          title: '高级用法',
          content: 'const server = new Server();',
          language: 'typescript'
        }
      ];

      const updated = metadata.addExamples(server, examples);
      
      expect(updated.metadata?.examples).toBeDefined();
      expect(updated.metadata?.examples).toHaveLength(examples.length);
      expect(updated.metadata?.examples?.[0].title).toBe(examples[0].title);
      expect(updated.metadata?.examples?.[0].content).toBe(examples[0].content);
    });
  });

  describe('评分系统', () => {
    it('应该添加用户评分', () => {
      const server = createTestServer();
      const review: MCPReview = {
        userId: 'user1',
        userName: 'Test User',
        rating: 4,
        comment: '很好用',
        createdAt: new Date().toISOString()
      };

      const updated = metadata.addReview(server, review);
      
      expect(updated.metadata?.ratings).toBeDefined();
      expect(updated.metadata?.ratings?.reviews).toHaveLength(1);
      expect(updated.metadata?.ratings?.average).toBe(4);
      expect(updated.metadata?.ratings?.count).toBe(1);
      expect(updated.metadata?.ratings?.distribution?.['4']).toBe(1);
    });

    it('应该更新现有评分', () => {
      const server = createTestServer();
      const initialReview: MCPReview = {
        userId: 'user1',
        rating: 3,
        createdAt: new Date().toISOString()
      };
      
      // 添加第一个评分
      let updated = metadata.addReview(server, initialReview);
      expect(updated.metadata?.ratings?.average).toBe(3);
      
      // 更新评分
      const updatedReview: MCPReview = {
        userId: 'user1',
        rating: 5,
        createdAt: new Date().toISOString()
      };
      
      updated = metadata.addReview(updated, updatedReview);
      
      expect(updated.metadata?.ratings?.reviews).toHaveLength(1);
      expect(updated.metadata?.ratings?.average).toBe(5);
      expect(updated.metadata?.ratings?.reviews?.[0].rating).toBe(5);
    });

    it('应该删除用户评分', () => {
      const server = createTestServer();
      
      // 添加两个评分
      const review1: MCPReview = {
        userId: 'user1',
        rating: 4,
        createdAt: new Date().toISOString()
      };
      
      const review2: MCPReview = {
        userId: 'user2',
        rating: 2,
        createdAt: new Date().toISOString()
      };
      
      let updated = metadata.addReview(server, review1);
      updated = metadata.addReview(updated, review2);
      
      expect(updated.metadata?.ratings?.reviews).toHaveLength(2);
      expect(updated.metadata?.ratings?.average).toBe(3); // (4+2)/2 = 3
      
      // 删除第一个评分
      updated = metadata.removeReview(updated, 'user1');
      
      expect(updated.metadata?.ratings?.reviews).toHaveLength(1);
      expect(updated.metadata?.ratings?.average).toBe(2);
      expect(updated.metadata?.ratings?.count).toBe(1);
    });

    it('应该获取评分摘要', () => {
      const server = createTestServer();
      
      // 添加多个评分
      const reviews = [
        { userId: 'user1', rating: 5, createdAt: new Date().toISOString() },
        { userId: 'user2', rating: 4, createdAt: new Date().toISOString() },
        { userId: 'user3', rating: 4, createdAt: new Date().toISOString() },
        { userId: 'user4', rating: 3, createdAt: new Date().toISOString() },
        { userId: 'user5', rating: 2, createdAt: new Date().toISOString() }
      ];
      
      let updated = server;
      for (const review of reviews) {
        updated = metadata.addReview(updated, review);
      }
      
      const summary = metadata.getRatingSummary(updated);
      
      expect(summary.average).toBe(3.6); // (5+4+4+3+2)/5 = 3.6
      expect(summary.count).toBe(5);
      expect(summary.distribution['5']).toBe(1);
      expect(summary.distribution['4']).toBe(2);
      expect(summary.distribution['3']).toBe(1);
      expect(summary.distribution['2']).toBe(1);
      // 应该没有1星评分
      expect(summary.distribution['1']).toBeFalsy();
    });
  });
}); 