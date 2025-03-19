import { sql, eq } from 'drizzle-orm';
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
 * 开发者统计数据接口
 */
export interface DeveloperStats {
  totalServers: number;           // 开发者的服务器总数
  totalDownloads: number;         // 开发者的服务器总下载量
  averageRating: number;          // 开发者的服务器平均评分
  mostPopularServer: {            // 最受欢迎的服务器
    id: string;
    name: string;
    key: string;
    downloads: number;
    rating: string;
  } | null;
  recentServers: Array<{         // 最近的服务器
    id: string;
    name: string;
    key: string;
    createdAt: Date | null;
    downloads: number;
  }>;
  downloadTrend: Array<{         // 下载趋势（最近30天）
    date: string;                // 格式：YYYY-MM-DD
    count: number;
  }>;
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

  /**
   * 获取开发者统计数据
   * @param developerId 开发者ID
   */
  async getDeveloperStats(developerId: string): Promise<DeveloperStats> {
    // 查询开发者的服务器总数
    const [{ count: totalServers }] = await db
      .select({ count: sql`count(*)` })
      .from(servers)
      .where(eq(servers.authorId, developerId));

    // 查询开发者的服务器总下载量
    const [{ total: totalDownloads }] = await db
      .select({ total: sql`sum(downloads)` })
      .from(servers)
      .where(eq(servers.authorId, developerId));

    // 查询开发者的服务器平均评分
    const [{ avgRating }] = await db
      .select({ avgRating: sql`avg(rating)` })
      .from(servers)
      .where(eq(servers.authorId, developerId));

    // 查询开发者最受欢迎的服务器
    const mostPopularServers = await db
      .select({
        id: servers.id,
        name: servers.name,
        key: servers.key,
        downloads: servers.downloads,
        rating: servers.rating
      })
      .from(servers)
      .where(eq(servers.authorId, developerId))
      .orderBy(sql`downloads DESC`)
      .limit(1);

    // 查询开发者最近的服务器
    const recentServers = await db
      .select({
        id: servers.id,
        name: servers.name,
        key: servers.key,
        createdAt: servers.createdAt,
        downloads: servers.downloads
      })
      .from(servers)
      .where(eq(servers.authorId, developerId))
      .orderBy(sql`created_at DESC`)
      .limit(5);

    // 构建下载趋势数据（这里只是简单模拟，实际需要更复杂的查询）
    // 在实际应用中，需要按日期聚合下载数据
    const downloadTrend: Array<{ date: string; count: number }> = [];
    
    // 填充过去30天的空数据
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      downloadTrend.push({
        date: date.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 100) // 示例数据，实际需要从数据库查询
      });
    }

    return {
      totalServers: Number(totalServers),
      totalDownloads: Number(totalDownloads) || 0,
      averageRating: Number(avgRating) || 0,
      mostPopularServer: mostPopularServers.length > 0 ? mostPopularServers[0] : null,
      recentServers,
      downloadTrend
    };
  }
}

// 创建和导出仓库实例
export const statsRepository = new StatsRepository(); 