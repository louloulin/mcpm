import { db } from '@/lib/database';
import { servers, serverTags, serverRecommendations, serverDownloads, serverViews, serverFavorites, serverRatings, users } from '@/lib/database/schema';
import { eq, desc, sql, and, inArray } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

/**
 * 服务器推荐系统
 * 基于用户行为和偏好数据生成个性化服务器推荐
 */
export class RecommendationService {
  /**
   * 为指定用户生成服务器推荐
   * @param userId 用户ID
   * @param limit 返回结果限制
   * @returns 推荐的服务器列表
   */
  public async getRecommendationsForUser(userId: string, limit: number = 10) {
    // 1. 检查是否已有生成的推荐
    const existingRecs = await db.select()
      .from(serverRecommendations)
      .where(eq(serverRecommendations.userId, userId))
      .orderBy(desc(serverRecommendations.score))
      .limit(limit);

    // 如果已有足够的推荐，直接返回
    if (existingRecs.length >= limit) {
      return this.formatRecommendations(existingRecs);
    }

    // 2. 否则生成新的推荐
    await this.generateRecommendations(userId);

    // 3. 重新获取推荐
    const freshRecs = await db.select()
      .from(serverRecommendations)
      .where(eq(serverRecommendations.userId, userId))
      .orderBy(desc(serverRecommendations.score))
      .limit(limit);

    return this.formatRecommendations(freshRecs);
  }

  /**
   * 格式化推荐结果，包含服务器详细信息
   */
  private async formatRecommendations(recommendations: any[]) {
    if (recommendations.length === 0) {
      return [];
    }

    // 获取推荐的服务器IDs
    const serverIds = recommendations.map(rec => rec.serverId);

    // 获取服务器详细信息
    const serverDetails = await db.select({
      id: servers.id,
      name: servers.name,
      description: servers.description,
      version: servers.version,
      downloads: servers.downloads,
      rating: servers.rating,
    })
    .from(servers)
    .where(inArray(servers.id, serverIds));

    // 将详细信息和推荐原因合并
    return recommendations.map(rec => {
      const server = serverDetails.find(s => s.id === rec.serverId);
      return {
        ...server,
        score: rec.score,
        reason: rec.reason
      };
    });
  }

  /**
   * 生成用户的推荐列表
   */
  private async generateRecommendations(userId: string) {
    try {
      console.log(`为用户 ${userId} 生成推荐...`);

      // 1. 获取用户历史数据
      const [userDownloads, userViews, userFavorites, userRatings] = await Promise.all([
        db.select({serverId: serverDownloads.serverId})
          .from(serverDownloads)
          .where(eq(serverDownloads.userId, userId)),
        
        db.select({serverId: serverViews.serverId})
          .from(serverViews)
          .where(eq(serverViews.userId, userId)),
        
        db.select({serverId: serverFavorites.serverId})
          .from(serverFavorites)
          .where(eq(serverFavorites.userId, userId)),
        
        db.select({serverId: serverRatings.serverId, rating: serverRatings.rating})
          .from(serverRatings)
          .where(eq(serverRatings.userId, userId))
      ]);

      // 用户交互过的所有服务器ID
      const interactedServerIds = new Set([
        ...userDownloads.map(d => d.serverId),
        ...userViews.map(v => v.serverId),
        ...userFavorites.map(f => f.serverId),
        ...userRatings.map(r => r.serverId)
      ]);

      // 如果用户没有任何历史记录，使用热门推荐
      if (interactedServerIds.size === 0) {
        await this.generatePopularRecommendations(userId);
        return;
      }

      // 2. 获取用户喜欢的服务器标签
      const userPreferredTags = await this.getUserPreferredTags(userId);

      // 3. 协同过滤: 找到与该用户有相似口味的其他用户
      const similarUsers = await this.findSimilarUsers(userId, Array.from(interactedServerIds));

      // 4. 生成候选推荐列表
      const recommendations = await this.generateCandidateRecommendations(
        userId, 
        interactedServerIds, 
        userPreferredTags,
        similarUsers
      );

      // 5. 清理旧的推荐
      await db.delete(serverRecommendations)
        .where(eq(serverRecommendations.userId, userId));

      // 6. 保存新的推荐到数据库
      if (recommendations.length > 0) {
        const recommendationValues = recommendations.map(rec => ({
          id: uuidv4(),
          userId,
          serverId: rec.serverId,
          score: rec.score,
          reason: rec.reason,
          createdAt: new Date(),
          updatedAt: new Date()
        }));

        await db.insert(serverRecommendations).values(recommendationValues);
      }

      console.log(`为用户 ${userId} 生成了 ${recommendations.length} 条推荐`);
    } catch (error) {
      console.error('生成推荐时出错:', error);
      throw error;
    }
  }

  /**
   * 为新用户生成热门推荐
   */
  private async generatePopularRecommendations(userId: string) {
    // 获取下载量最高的服务器
    const popularServers = await db.select({
      id: servers.id,
      downloads: servers.downloads,
      rating: servers.rating
    })
    .from(servers)
    .orderBy(desc(servers.downloads))
    .limit(10);

    // 生成推荐数据
    const recommendations = popularServers.map(server => ({
      serverId: server.id,
      score: (server.downloads / 1000) + (parseFloat(server.rating.toString()) * 2), // 简单评分公式
      reason: '热门服务器'
    }));

    // 保存推荐
    if (recommendations.length > 0) {
      const recommendationValues = recommendations.map(rec => ({
        id: uuidv4(),
        userId,
        serverId: rec.serverId,
        score: rec.score,
        reason: rec.reason,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      await db.insert(serverRecommendations).values(recommendationValues);
    }
  }

  /**
   * 获取用户偏好的标签
   */
  private async getUserPreferredTags(userId: string) {
    // 获取用户交互过的服务器
    const userServers = await db.select({
      serverId: sql<string>`DISTINCT server_id`
    })
    .from(sql`(
      SELECT server_id FROM server_downloads WHERE user_id = ${userId}
      UNION
      SELECT server_id FROM server_favorites WHERE user_id = ${userId}
      UNION
      SELECT server_id FROM server_ratings WHERE user_id = ${userId} AND rating >= 4
    ) AS user_interactions`);

    if (userServers.length === 0) {
      return [];
    }

    // 获取这些服务器的标签
    const serverIds = userServers.map(s => s.serverId);
    
    const tagCounts = await db.select({
      tagId: serverTags.tagId,
      count: sql<number>`COUNT(*)`
    })
    .from(serverTags)
    .where(inArray(serverTags.serverId, serverIds))
    .groupBy(serverTags.tagId)
    .orderBy(desc(sql`COUNT(*)`));

    return tagCounts;
  }

  /**
   * 查找与指定用户有相似偏好的用户
   */
  private async findSimilarUsers(userId: string, interactedServerIds: string[]) {
    if (interactedServerIds.length === 0) {
      return [];
    }

    // 找到也下载/收藏/评价过相同服务器的用户
    const similarUsers = await db.select({
      userId: sql<string>`DISTINCT user_id`,
      commonInteractions: sql<number>`COUNT(DISTINCT server_id)`
    })
    .from(sql`(
      SELECT user_id, server_id FROM server_downloads WHERE server_id IN (${sql.join(interactedServerIds)}) AND user_id != ${userId}
      UNION
      SELECT user_id, server_id FROM server_favorites WHERE server_id IN (${sql.join(interactedServerIds)}) AND user_id != ${userId}
      UNION
      SELECT user_id, server_id FROM server_ratings WHERE server_id IN (${sql.join(interactedServerIds)}) AND user_id != ${userId}
    ) AS similar_users`)
    .groupBy(sql`user_id`)
    .having(sql`COUNT(DISTINCT server_id) >= 2`) // 至少有2个共同交互才算相似
    .orderBy(desc(sql`COUNT(DISTINCT server_id)`))
    .limit(10);

    return similarUsers;
  }

  /**
   * 生成候选推荐
   */
  private async generateCandidateRecommendations(
    userId: string, 
    interactedServerIds: Set<string>,
    userPreferredTags: any[],
    similarUsers: any[]
  ) {
    // 合并推荐来源的结果
    let allCandidates: {serverId: string, score: number, source: string}[] = [];

    // 1. 从相似用户中获取推荐
    if (similarUsers.length > 0) {
      const similarUserIds = similarUsers.map(u => u.userId);
      
      const similarUserServers = await db.select({
        serverId: sql<string>`DISTINCT server_id`
      })
      .from(sql`(
        SELECT server_id FROM server_downloads WHERE user_id IN (${sql.join(similarUserIds)})
        UNION
        SELECT server_id FROM server_favorites WHERE user_id IN (${sql.join(similarUserIds)})
        UNION
        SELECT server_id FROM server_ratings WHERE user_id IN (${sql.join(similarUserIds)}) AND rating >= 4
      ) AS similar_user_servers`)
      .where(sql`server_id NOT IN (${sql.join(Array.from(interactedServerIds))})`);

      // 为每个候选服务器评分
      for (const server of similarUserServers) {
        // 这里用一个简单的模型: 有多少相似用户互动过这个服务器
        const interactionCount = await db.select({
          count: sql<number>`COUNT(*)`
        })
        .from(sql`(
          SELECT user_id FROM server_downloads WHERE server_id = ${server.serverId} AND user_id IN (${sql.join(similarUserIds)})
          UNION
          SELECT user_id FROM server_favorites WHERE server_id = ${server.serverId} AND user_id IN (${sql.join(similarUserIds)})
          UNION
          SELECT user_id FROM server_ratings WHERE server_id = ${server.serverId} AND user_id IN (${sql.join(similarUserIds)})
        ) AS interactions`);

        const score = interactionCount[0]?.count || 0;
        
        if (score > 0) {
          allCandidates.push({
            serverId: server.serverId,
            score: score * 2, // 协同过滤的推荐权重较高
            source: '相似用户也喜欢这个服务器'
          });
        }
      }
    }

    // 2. 基于内容的推荐: 使用用户偏好的标签
    if (userPreferredTags.length > 0) {
      const preferredTagIds = userPreferredTags.map(t => t.tagId);
      
      const tagBasedServers = await db.select({
        serverId: serverTags.serverId,
        tagCount: sql<number>`COUNT(DISTINCT ${serverTags.tagId})`
      })
      .from(serverTags)
      .where(
        and(
          inArray(serverTags.tagId, preferredTagIds),
          sql`server_id NOT IN (${sql.join(Array.from(interactedServerIds))})`
        )
      )
      .groupBy(serverTags.serverId)
      .orderBy(desc(sql`COUNT(DISTINCT ${serverTags.tagId})`));

      for (const server of tagBasedServers) {
        allCandidates.push({
          serverId: server.serverId,
          score: server.tagCount * 1.5, // 基于标签的推荐权重适中
          source: '基于您感兴趣的标签'
        });
      }
    }

    // 3. 补充热门推荐
    if (allCandidates.length < 5) {
      const popularServers = await db.select({
        id: servers.id,
        downloads: servers.downloads,
        rating: servers.rating
      })
      .from(servers)
      .where(sql`id NOT IN (${sql.join(Array.from(interactedServerIds))})`)
      .orderBy(desc(servers.downloads))
      .limit(5);

      for (const server of popularServers) {
        // 避免重复
        if (!allCandidates.some(c => c.serverId === server.id)) {
          allCandidates.push({
            serverId: server.id,
            score: (server.downloads / 1000) + (parseFloat(server.rating.toString()) * 0.5), // 热门推荐权重较低
            source: '热门服务器'
          });
        }
      }
    }

    // 对结果排序并合并相同服务器的不同来源
    const merged = new Map<string, {serverId: string, score: number, sources: string[]}>();
    
    for (const candidate of allCandidates) {
      if (merged.has(candidate.serverId)) {
        const existing = merged.get(candidate.serverId)!;
        existing.score += candidate.score;
        existing.sources.push(candidate.source);
      } else {
        merged.set(candidate.serverId, {
          serverId: candidate.serverId,
          score: candidate.score,
          sources: [candidate.source]
        });
      }
    }

    // 转换为最终推荐格式
    return Array.from(merged.values())
      .sort((a, b) => b.score - a.score)
      .map(item => ({
        serverId: item.serverId,
        score: item.score,
        reason: item.sources.join('、')
      }));
  }
}

// 导出单例
export const recommendationService = new RecommendationService(); 