import { eq, like, sql } from 'drizzle-orm';
import { db } from '../index';
import { tags, type Tag, type NewTag } from '../schema';

/**
 * 标签仓库类 - 封装标签相关的所有数据库操作
 */
export class TagRepository {
  /**
   * 获取所有标签
   */
  async getAll(): Promise<Tag[]> {
    return db.select().from(tags).orderBy(tags.name);
  }

  /**
   * 通过ID查找标签
   */
  async findById(id: number): Promise<Tag | undefined> {
    const result = await db.select().from(tags).where(eq(tags.id, id)).limit(1);
    return result[0];
  }

  /**
   * 通过名称查找标签
   */
  async findByName(name: string): Promise<Tag | undefined> {
    const result = await db.select().from(tags).where(eq(tags.name, name)).limit(1);
    return result[0];
  }

  /**
   * 搜索标签
   */
  async search(query: string, limit = 10): Promise<Tag[]> {
    return db
      .select()
      .from(tags)
      .where(like(tags.name, `%${query}%`))
      .orderBy(tags.name)
      .limit(limit);
  }

  /**
   * 创建新标签
   */
  async create(data: { name: string; description?: string; color?: string }): Promise<Tag> {
    // 检查标签名是否已存在
    const existingTag = await this.findByName(data.name);
    if (existingTag) {
      throw new Error('标签名已存在');
    }

    // 创建新标签
    const newTag: NewTag = {
      name: data.name,
      description: data.description || null,
      color: data.color || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 插入标签并返回插入的数据
    const [createdTag] = await db.insert(tags).values(newTag).returning();
    return createdTag;
  }

  /**
   * 更新标签
   */
  async update(id: number, data: Partial<Omit<Tag, 'id' | 'createdAt'>>): Promise<Tag> {
    // 检查标签是否存在
    const existingTag = await this.findById(id);
    if (!existingTag) {
      throw new Error('标签不存在');
    }

    // 如果要更新名称，检查是否与其他标签冲突
    if (data.name && data.name !== existingTag.name) {
      const existingName = await this.findByName(data.name);
      if (existingName) {
        throw new Error('标签名已存在');
      }
    }

    // 设置更新时间
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };

    // 更新标签并返回更新后的数据
    const [updatedTag] = await db
      .update(tags)
      .set(updateData)
      .where(eq(tags.id, id))
      .returning();

    return updatedTag;
  }

  /**
   * 删除标签
   */
  async delete(id: number): Promise<boolean> {
    // 检查标签是否存在
    const existingTag = await this.findById(id);
    if (!existingTag) {
      throw new Error('标签不存在');
    }

    // 删除标签
    await db.delete(tags).where(eq(tags.id, id));

    return true;
  }

  /**
   * 获取热门标签
   */
  async getPopular(limit = 10): Promise<{ id: number; name: string; count: number }[]> {
    // 这里需要联合serverTags表查询，根据使用次数排序
    const result = await db.execute(sql`
      SELECT t.id, t.name, COUNT(st.server_id) as count
      FROM tags t
      LEFT JOIN server_tags st ON t.id = st.tag_id
      GROUP BY t.id, t.name
      ORDER BY count DESC
      LIMIT ${limit}
    `);

    return result.rows.map(row => ({
      id: Number(row.id),
      name: row.name as string,
      count: Number(row.count),
    }));
  }
}

// 创建和导出仓库实例
export const tagRepository = new TagRepository(); 