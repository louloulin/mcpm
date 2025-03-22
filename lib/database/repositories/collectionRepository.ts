import { sql, eq, like, desc, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../index';
import { serverCollections, collectionServers, servers, users } from '../schema';
import type { ServerCollection, NewServerCollection, CollectionServer } from '../schema';

/**
 * 服务器集合仓库类 - 封装集合相关的数据库操作
 */
export class CollectionRepository {
  /**
   * 通过ID查找集合
   */
  async findById(id: string): Promise<ServerCollection | undefined> {
    const result = await db.select().from(serverCollections).where(eq(serverCollections.id, id)).limit(1);
    return result[0];
  }

  /**
   * 通过slug查找集合
   */
  async findBySlug(slug: string): Promise<ServerCollection | undefined> {
    const result = await db.select().from(serverCollections).where(eq(serverCollections.slug, slug)).limit(1);
    return result[0];
  }

  /**
   * 获取所有公开集合
   */
  async getAll(limit = 20, offset = 0): Promise<{ items: ServerCollection[]; total: number }> {
    // 查询公开集合
    const items = await db
      .select()
      .from(serverCollections)
      .where(eq(serverCollections.isPublic, true))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(serverCollections.createdAt));

    // 获取总计数
    const [{ count }] = await db
      .select({ count: sql`count(*)` })
      .from(serverCollections)
      .where(eq(serverCollections.isPublic, true));

    return {
      items,
      total: Number(count),
    };
  }

  /**
   * 获取用户创建的集合
   */
  async getUserCollections(userId: string, limit = 20, offset = 0): Promise<{ items: ServerCollection[]; total: number }> {
    // 查询用户创建的集合
    const items = await db
      .select()
      .from(serverCollections)
      .where(eq(serverCollections.createdBy, userId))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(serverCollections.createdAt));

    // 获取总计数
    const [{ count }] = await db
      .select({ count: sql`count(*)` })
      .from(serverCollections)
      .where(eq(serverCollections.createdBy, userId));

    return {
      items,
      total: Number(count),
    };
  }

  /**
   * 搜索集合
   */
  async search(query: string, limit = 20, offset = 0): Promise<{ items: ServerCollection[]; total: number }> {
    const searchPattern = `%${query}%`;
    // 搜索集合
    const items = await db
      .select()
      .from(serverCollections)
      .where(
        and(
          eq(serverCollections.isPublic, true),
          like(serverCollections.name, searchPattern)
        )
      )
      .limit(limit)
      .offset(offset)
      .orderBy(desc(serverCollections.createdAt));

    // 获取总计数
    const [{ count }] = await db
      .select({ count: sql`count(*)` })
      .from(serverCollections)
      .where(
        and(
          eq(serverCollections.isPublic, true),
          like(serverCollections.name, searchPattern)
        )
      );

    return {
      items,
      total: Number(count),
    };
  }

  /**
   * 创建新集合
   */
  async create(data: {
    name: string;
    description?: string;
    slug?: string;
    coverImage?: string;
    createdBy?: string;
    isPublic?: boolean;
  }): Promise<ServerCollection> {
    // 生成唯一slug
    let slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    // 检查slug是否已存在
    const existingCollection = await this.findBySlug(slug);
    if (existingCollection) {
      // 如果已存在，添加随机后缀
      slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
    }

    // 创建新集合数据
    const newCollection: NewServerCollection = {
      id: uuidv4(),
      name: data.name,
      description: data.description || null,
      slug,
      coverImage: data.coverImage || null,
      createdBy: data.createdBy || null,
      isPublic: data.isPublic !== undefined ? data.isPublic : true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 插入集合并返回插入的数据
    const [createdCollection] = await db.insert(serverCollections).values(newCollection).returning();
    return createdCollection;
  }

  /**
   * 更新集合
   */
  async update(id: string, data: Partial<Omit<ServerCollection, 'id' | 'createdAt'>>): Promise<ServerCollection> {
    // 检查集合是否存在
    const existingCollection = await this.findById(id);
    if (!existingCollection) {
      throw new Error('集合不存在');
    }

    // 如果更新了slug，检查是否与其他集合重复
    if (data.slug && data.slug !== existingCollection.slug) {
      const existingSlug = await this.findBySlug(data.slug);
      if (existingSlug && existingSlug.id !== id) {
        throw new Error('集合标识符已存在');
      }
    }

    // 更新集合
    const [updatedCollection] = await db
      .update(serverCollections)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(serverCollections.id, id))
      .returning();

    return updatedCollection;
  }

  /**
   * 删除集合
   */
  async delete(id: string): Promise<boolean> {
    // 检查集合是否存在
    const existingCollection = await this.findById(id);
    if (!existingCollection) {
      throw new Error('集合不存在');
    }

    // 删除集合
    await db.delete(serverCollections).where(eq(serverCollections.id, id));

    return true;
  }

  /**
   * 向集合添加服务器
   */
  async addServer(collectionId: string, serverId: string, order?: number): Promise<CollectionServer> {
    // 检查集合和服务器是否存在
    const [collection, server] = await Promise.all([
      this.findById(collectionId),
      db.select().from(servers).where(eq(servers.id, serverId)).limit(1),
    ]);

    if (!collection) {
      throw new Error('集合不存在');
    }

    if (!server[0]) {
      throw new Error('服务器不存在');
    }

    // 检查是否已添加
    const existing = await db
      .select()
      .from(collectionServers)
      .where(
        and(
          eq(collectionServers.collectionId, collectionId),
          eq(collectionServers.serverId, serverId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    // 如果未指定顺序，获取当前最大顺序
    let serverOrder = order;
    if (serverOrder === undefined) {
      const maxOrder = await db
        .select({ max: sql`MAX(${collectionServers.order})` })
        .from(collectionServers)
        .where(eq(collectionServers.collectionId, collectionId));
      
      serverOrder = (maxOrder[0]?.max as number || 0) + 1;
    }

    // 添加服务器到集合
    const [collectionServer] = await db
      .insert(collectionServers)
      .values({
        id: uuidv4(),
        collectionId,
        serverId,
        order: serverOrder,
        createdAt: new Date(),
      })
      .returning();

    return collectionServer;
  }

  /**
   * 从集合移除服务器
   */
  async removeServer(collectionId: string, serverId: string): Promise<boolean> {
    // 从集合中删除服务器
    await db
      .delete(collectionServers)
      .where(
        and(
          eq(collectionServers.collectionId, collectionId),
          eq(collectionServers.serverId, serverId)
        )
      );

    return true;
  }

  /**
   * 更新集合中服务器的顺序
   */
  async updateServerOrder(collectionId: string, serverOrders: {serverId: string, order: number}[]): Promise<boolean> {
    // 检查集合是否存在
    const collection = await this.findById(collectionId);
    if (!collection) {
      throw new Error('集合不存在');
    }

    // 批量更新服务器顺序
    for (const { serverId, order } of serverOrders) {
      await db
        .update(collectionServers)
        .set({ order })
        .where(
          and(
            eq(collectionServers.collectionId, collectionId),
            eq(collectionServers.serverId, serverId)
          )
        );
    }

    return true;
  }

  /**
   * 获取集合中的服务器
   */
  async getCollectionServers(collectionId: string, limit = 100, offset = 0): Promise<{ items: any[]; total: number }> {
    // 检查集合是否存在
    const collection = await this.findById(collectionId);
    if (!collection) {
      throw new Error('集合不存在');
    }

    // 联合查询获取集合中的服务器信息
    const items = await db
      .select({
        id: servers.id,
        name: servers.name,
        description: servers.description,
        version: servers.version,
        downloads: servers.downloads,
        rating: servers.rating,
        order: collectionServers.order,
      })
      .from(collectionServers)
      .innerJoin(servers, eq(collectionServers.serverId, servers.id))
      .where(eq(collectionServers.collectionId, collectionId))
      .orderBy(collectionServers.order)
      .limit(limit)
      .offset(offset);

    // 获取总计数
    const [{ count }] = await db
      .select({ count: sql`count(*)` })
      .from(collectionServers)
      .where(eq(collectionServers.collectionId, collectionId));

    return {
      items,
      total: Number(count),
    };
  }

  /**
   * 获取精选集合
   */
  async getFeatured(limit = 5): Promise<ServerCollection[]> {
    return db
      .select()
      .from(serverCollections)
      .where(eq(serverCollections.isPublic, true))
      .orderBy(desc(serverCollections.createdAt))
      .limit(limit);
  }
}

// 导出单例实例
export const collectionRepository = new CollectionRepository(); 