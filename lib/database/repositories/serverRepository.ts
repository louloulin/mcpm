import { sql, eq, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../index';
import { servers } from '../schema';
import type { Server, NewServer } from '../schema';

/**
 * 服务器仓库类 - 封装服务器相关的所有数据库操作
 */
export class ServerRepository {
  /**
   * 通过ID查找服务器
   */
  async findById(id: string): Promise<Server | undefined> {
    const result = await db.select().from(servers).where(eq(servers.id, id)).limit(1);
    return result[0];
  }

  /**
   * 通过唯一标识符查找服务器
   */
  async findByKey(key: string): Promise<Server | undefined> {
    const result = await db.select().from(servers).where(eq(servers.key, key)).limit(1);
    return result[0];
  }

  /**
   * 获取所有服务器
   */
  async getAll(limit = 20, offset = 0): Promise<{ items: Server[]; total: number }> {
    // 查询服务器
    const items = await db
      .select()
      .from(servers)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(servers.createdAt));

    // 获取总计数
    const [{ count }] = await db
      .select({ count: sql`count(*)` })
      .from(servers);

    return {
      items,
      total: Number(count),
    };
  }

  /**
   * 搜索服务器
   */
  async search(
    searchQuery: string, 
    options: { 
      tagIds?: string[]; 
      sort?: 'newest' | 'oldest' | 'downloads' | 'rating';
      minRating?: number;
      toolsRequired?: string[];
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ items: Server[]; total: number }> {
    const { 
      tagIds = [], 
      sort = 'newest',
      minRating = 0,
      toolsRequired = [],
      limit = 20,
      offset = 0
    } = options;

    // 构建基本搜索条件
    const searchPattern = `%${searchQuery}%`;
    let query = sql`
      SELECT DISTINCT s.*
      FROM servers s
      WHERE s.name LIKE ${searchPattern}
    `;

    // 添加最低评分筛选
    if (minRating > 0) {
      query = sql`
        ${query}
        AND CAST(s.rating AS NUMERIC) >= ${minRating}
      `;
    }

    // 如果有标签过滤条件，添加标签筛选
    if (tagIds.length > 0) {
      query = sql`
        ${query}
        AND s.id IN (
          SELECT server_id
          FROM server_tags
          WHERE tag_id = ANY(${tagIds})
        )
      `;
    }

    // 如果有工具要求过滤条件，添加工具筛选
    if (toolsRequired.length > 0) {
      query = sql`
        ${query}
        AND s.id IN (
          SELECT DISTINCT server_id
          FROM server_tools
          WHERE tool_name = ANY(${toolsRequired})
        )
      `;
    }

    // 添加排序
    const orderBy = (() => {
      switch (sort) {
        case 'oldest':
          return sql`s.created_at ASC`;
        case 'downloads':
          return sql`s.downloads DESC`;
        case 'rating':
          return sql`s.rating DESC`;
        default: // newest
          return sql`s.created_at DESC`;
      }
    })();

    // 执行查询获取分页数据
    const result = await db.execute<Server>(sql`
      ${query}
      ORDER BY ${orderBy}
      LIMIT ${limit}
      OFFSET ${offset}
    `);

    // 执行计数查询
    const countResult = await db.execute<{ count: string }>(sql`
      SELECT COUNT(DISTINCT s.id) as count
      FROM (${query}) s
    `);

    return {
      items: result.rows,
      total: Number(countResult.rows[0].count)
    };
  }

  /**
   * 创建新服务器
   */
  async create(data: {
    name: string;
    description?: string;
    homepage?: string;
    repository?: string;
    authorId?: string;
    version?: string;
    license?: string;
    startCommand?: string;
    url: string;
    type: string;
  }): Promise<Server> {
    // 生成唯一标识符
    const key = data.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    // 检查标识符是否已存在
    const existingServer = await this.findByKey(key);
    if (existingServer) {
      throw new Error('服务器标识符已存在');
    }

    // 创建新服务器数据
    const newServer: NewServer = {
      id: uuidv4(),
      key,
      name: data.name,
      version: data.version || '1.0.0',
      description: data.description || null,
      homepage: data.homepage || null,
      repository: data.repository || null,
      license: data.license || null,
      startCommand: data.startCommand || null,
      authorId: data.authorId || null,
      downloads: 0,
      rating: '0',
      url: data.url,
      type: data.type,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 插入服务器并返回插入的数据
    const [createdServer] = await db.insert(servers).values(newServer).returning();
    return createdServer;
  }

  /**
   * 更新服务器
   */
  async update(id: string, data: Partial<Omit<Server, 'id' | 'key' | 'createdAt'>>): Promise<Server> {
    // 检查服务器是否存在
    const existingServer = await this.findById(id);
    if (!existingServer) {
      throw new Error('服务器不存在');
    }

    // 设置更新时间
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };

    // 更新服务器并返回更新后的数据
    const [updatedServer] = await db
      .update(servers)
      .set(updateData)
      .where(eq(servers.id, id))
      .returning();

    return updatedServer;
  }

  /**
   * 更新服务器下载量
   */
  async incrementDownloads(id: string): Promise<void> {
    await db
      .update(servers)
      .set({
        downloads: sql`${servers.downloads} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(servers.id, id));
  }

  /**
   * 评价服务器 - 通过评分表更新服务器评分
   */
  async updateRating(id: string): Promise<Server> {
    // 获取当前服务器
    const server = await this.findById(id);
    if (!server) {
      throw new Error('服务器不存在');
    }

    // 从评分表计算平均评分
    const result = await db.execute(
      sql`SELECT AVG(score) as avg_rating, COUNT(*) as rating_count 
          FROM ratings WHERE server_id = ${id}`
    );
    
    const avgRating = result.rows[0]?.avg_rating || 0;
    
    // 更新服务器评分
    const [updatedServer] = await db
      .update(servers)
      .set({
        rating: avgRating.toString(),
        updatedAt: new Date(),
      })
      .where(eq(servers.id, id))
      .returning();

    return updatedServer;
  }

  /**
   * 删除服务器
   */
  async delete(id: string): Promise<boolean> {
    // 检查服务器是否存在
    const existingServer = await this.findById(id);
    if (!existingServer) {
      throw new Error('服务器不存在');
    }

    // 删除服务器
    await db.delete(servers).where(eq(servers.id, id));

    return true;
  }

  /**
   * 获取推荐服务器
   */
  async getPopular(limit = 5): Promise<Server[]> {
    return db
      .select()
      .from(servers)
      .orderBy(desc(servers.downloads))
      .limit(limit);
  }
}

// 创建和导出仓库实例
export const serverRepository = new ServerRepository(); 