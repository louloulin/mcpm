import { sql } from 'drizzle-orm';
import { db } from '../index';
import { servers } from '../schema';
import { serverRepository } from './serverRepository';

/**
 * 统计数据接口
 */
export interface StatsOverview {
  totalServers: number;
  totalDownloads: number;
  popularTags: Array<{ tag: string; count: number }>;
  recentUpdates: number;
}

/**
 * 统计仓库类 - 封装统计相关的数据库操作
 */
export class StatsRepository {
  /**
   * 获取总览统计数据
   */
  async getOverview(): Promise<StatsOverview> {
    // 查询服务器总数
    const [{ count: totalServers }] = await db
      .select({ count: sql`count(*)` })
      .from(servers);

    // 查询总下载量
    const [{ total: totalDownloads }] = await db
      .select({ total: sql`sum(downloads)` })
      .from(servers);

    // 查询最近一周更新的服务器数量
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const [{ count: recentUpdates }] = await db
      .select({ count: sql`count(*)` })
      .from(servers)
      .where(sql`${servers.updatedAt} >= ${oneWeekAgo}`);

    // 获取热门标签（假设tags字段是JSON数组，这里需要根据实际数据库类型调整）
    // 由于无法在SQL中直接提取JSON数组元素并计数，这里简化处理
    // 在实际应用中，可能需要更复杂的查询或应用层处理
    const popularTags: Array<{ tag: string; count: number }> = [];

    return {
      totalServers: Number(totalServers),
      totalDownloads: Number(totalDownloads) || 0,
      popularTags,
      recentUpdates: Number(recentUpdates),
    };
  }

  /**
   * 获取热门服务器
   */
  async getPopularServers(limit = 5) {
    return serverRepository.getPopular(limit);
  }
}

// 创建和导出仓库实例
export const statsRepository = new StatsRepository(); 