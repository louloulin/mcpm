import { statsRepository } from '../lib/database/repositories/statsRepository';
import { db } from '../lib/database/index';

// 模拟模块
jest.mock('../lib/database/index');
jest.mock('drizzle-orm');

describe('StatsRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getOverview', () => {
    it('should return stats overview data', async () => {
      // 模拟DB查询
      const mockSelect = jest.fn().mockReturnThis();
      const mockFrom = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockReturnThis();
      
      // 设置模拟返回值
      const mockData = [
        { count: 100 }, // 服务器总数
        { total: 5000 }, // 下载总量
        { count: 25 } // 最近更新
      ];
      
      // 模拟select.from.where链式调用
      db.select = mockSelect;
      db.select().from = mockFrom;
      db.select().from().where = mockWhere;
      
      // 设置最终返回值
      db.select().from().where.mockResolvedValueOnce([{ count: 100 }]);
      db.select().from.mockResolvedValueOnce([{ total: 5000 }]);
      db.select().from().where.mockResolvedValueOnce([{ count: 25 }]);
      
      // 执行测试
      const result = await statsRepository.getOverview();
      
      // 验证结果
      expect(result).toEqual({
        totalServers: 100,
        totalDownloads: 5000,
        popularTags: [],
        recentUpdates: 25,
      });
    });
  });

  describe('getDeveloperStats', () => {
    it('should return developer stats data', async () => {
      // 模拟数据库返回
      const mockData = {
        servers: [{ count: 5 }],
        downloads: [{ total: 1000 }],
        rating: [{ avgRating: 4.5 }],
        popular: [{ 
          id: '1', 
          name: 'Test Server', 
          key: 'test-server', 
          downloads: 500, 
          rating: '4.8' 
        }],
        recent: [{ 
          id: '2', 
          name: 'Recent Server', 
          key: 'recent-server', 
          createdAt: new Date(), 
          downloads: 100 
        }]
      };
      
      // 设置模拟方法
      const mockSelect = jest.fn().mockReturnThis();
      const mockFrom = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockReturnThis();
      const mockOrderBy = jest.fn().mockReturnThis();
      const mockLimit = jest.fn();
      
      db.select = mockSelect;
      db.select().from = mockFrom;
      db.select().from().where = mockWhere;
      db.select().from().where.orderBy = mockOrderBy;
      db.select().from().where.orderBy.limit = mockLimit;
      
      // 设置返回值
      mockLimit.mockResolvedValueOnce(mockData.servers); // 服务器数量
      mockLimit.mockResolvedValueOnce(mockData.downloads); // 下载量
      mockLimit.mockResolvedValueOnce(mockData.rating); // 评分
      mockLimit.mockResolvedValueOnce(mockData.popular); // 热门服务器
      mockLimit.mockResolvedValueOnce(mockData.recent); // 最近服务器
      
      // 执行测试
      const result = await statsRepository.getDeveloperStats('user-id');
      
      // 验证数据格式
      expect(result).toHaveProperty('totalServers');
      expect(result).toHaveProperty('totalDownloads');
      expect(result).toHaveProperty('averageRating');
      expect(result).toHaveProperty('mostPopularServer');
      expect(result).toHaveProperty('recentServers');
      expect(result).toHaveProperty('downloadTrend');
      
      // 验证数据值
      expect(result.downloadTrend).toHaveLength(30); // 应该有30天的数据
    });
  });
}); 