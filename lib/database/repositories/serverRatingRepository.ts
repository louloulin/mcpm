import { and, eq, desc, sql } from 'drizzle-orm';
import { db } from '../index';
import { serverRatings, servers } from '../schema';

/**
 * 服务器评分仓库类 - 封装服务器评分相关的所有数据库操作
 */
export class ServerRatingRepository {
  /**
   * 添加或更新服务器评分
   */
  async rateServer(serverId: string, userId: string, rating: number, comment?: string) {
    // 开启事务
    return await db.transaction(async (tx) => {
      // 检查是否已存在评分
      const existingRating = await tx
        .select()
        .from(serverRatings)
        .where(
          and(
            eq(serverRatings.serverId, serverId),
            eq(serverRatings.userId, userId)
          )
        )
        .limit(1);

      if (existingRating.length > 0) {
        // 更新现有评分
        await tx
          .update(serverRatings)
          .set({
            rating: rating.toString(),
            comment,
            updatedAt: new Date()
          })
          .where(
            and(
              eq(serverRatings.serverId, serverId),
              eq(serverRatings.userId, userId)
            )
          );
      } else {
        // 添加新评分
        await tx
          .insert(serverRatings)
          .values({
            serverId,
            userId,
            rating: rating.toString(),
            comment
          });
      }

      // 更新服务器的总体评分
      const ratings = await tx
        .select({
          avgRating: sql<number>`AVG(${serverRatings.rating})`,
          count: sql<number>`COUNT(*)`
        })
        .from(serverRatings)
        .where(eq(serverRatings.serverId, serverId));

      await tx
        .update(servers)
        .set({
          rating: ratings[0].avgRating?.toString() || '0',
          ratingCount: ratings[0].count || 0,
          totalRatings: sql`${servers.totalRatings} + 1`
        })
        .where(eq(servers.id, serverId));
    });
  }

  /**
   * 获取服务器的评分列表
   */
  async getServerRatings(serverId: string, limit = 10, offset = 0) {
    const ratings = await db
      .select()
      .from(serverRatings)
      .where(eq(serverRatings.serverId, serverId))
      .orderBy(desc(serverRatings.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(serverRatings)
      .where(eq(serverRatings.serverId, serverId));

    return {
      items: ratings,
      total: Number(count)
    };
  }

  /**
   * 获取用户对服务器的评分
   */
  async getUserRating(serverId: string, userId: string) {
    const rating = await db
      .select()
      .from(serverRatings)
      .where(
        and(
          eq(serverRatings.serverId, serverId),
          eq(serverRatings.userId, userId)
        )
      )
      .limit(1);

    return rating[0];
  }

  /**
   * 删除用户对服务器的评分
   */
  async deleteRating(serverId: string, userId: string) {
    return await db.transaction(async (tx) => {
      // 删除评分
      await tx
        .delete(serverRatings)
        .where(
          and(
            eq(serverRatings.serverId, serverId),
            eq(serverRatings.userId, userId)
          )
        );

      // 更新服务器的总体评分
      const ratings = await tx
        .select({
          avgRating: sql<number>`AVG(${serverRatings.rating})`,
          count: sql<number>`COUNT(*)`
        })
        .from(serverRatings)
        .where(eq(serverRatings.serverId, serverId));

      await tx
        .update(servers)
        .set({
          rating: ratings[0].avgRating?.toString() || '0',
          ratingCount: ratings[0].count || 0
        })
        .where(eq(servers.id, serverId));
    });
  }
}

// Export a singleton instance
export const serverRatingRepository = new ServerRatingRepository(); 