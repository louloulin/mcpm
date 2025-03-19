import { and, eq, like, desc, asc, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../index';
import { servers, serverTags, tags, type Server, type NewServer } from '../schema';

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
    query: string, 
    options: { 
      tagIds?: number[]; 
      sort?: 'newest' | 'oldest' | 'downloads' | 'rating';
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ items: Server[]; total: number }> {
    const { 
      tagIds = [], 
      sort = 'newest',
      limit = 20,
      offset = 0
    } = options;

    // 构建基本搜索条件
    const searchPattern = `%${query}%`;
    let whereClause = like(servers.name, searchPattern);

    // 根据排序方式确定排序字段
    let orderByClause;
    switch (sort) {
      case 'newest':
        orderByClause = [desc(servers.createdAt)];
        break;
      case 'oldest':
        orderByClause = [asc(servers.createdAt)];
        break;
      case 'downloads':
        orderByClause = [desc(servers.downloads)];
        break;
      case 'rating':
        orderByClause = [desc(servers.rating)];
        break;
      default:
        orderByClause = [desc(servers.createdAt)];
    }

    // 执行基本查询
    let query1 = db
      .select()
      .from(servers)
      .where(whereClause);

    // 如果有标签过滤条件，执行联接查询
    if (tagIds.length > 0) {
      query1 = db
        .select()
        .from(servers)
        .innerJoin(serverTags, eq(servers.id, serverTags.serverId))
        .where(and(
          whereClause,
          tagIds.length > 0 ? serverTags.tagId.in(tagIds) : undefined
        ));
    }

    // 添加排序和分页
    const items = await query1
      .orderBy(...orderByClause)
      .limit(limit)
      .offset(offset);

    // 执行计数查询
    const [{ count }] = await db
      .select({ count: sql`count(distinct ${servers.id})` })
      .from(servers)
      .where(whereClause);

    return {
      items: items.map(row => 'serverId' in row ? row.servers : row),
      total: Number(count),
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
      rating: 0,
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
        rating: parseFloat(avgRating.toFixed(1)),
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