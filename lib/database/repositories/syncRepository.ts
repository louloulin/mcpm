import { eq, desc, sql } from 'drizzle-orm';
import { db } from '../index';
import { syncHistory, type SyncRecord, type NewSyncRecord } from '../schema';

/**
 * 同步记录仓库类 - 封装同步记录相关的所有数据库操作
 */
export class SyncRepository {
  /**
   * 获取所有同步记录
   */
  async getAll(limit = 20, offset = 0): Promise<{ items: SyncRecord[]; total: number }> {
    // 查询同步记录
    const items = await db
      .select()
      .from(syncHistory)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(syncHistory.startedAt));

    // 获取总计数
    const [{ count }] = await db
      .select({ count: sql`count(*)` })
      .from(syncHistory);

    return {
      items,
      total: Number(count),
    };
  }

  /**
   * 获取最新的同步记录
   */
  async getLatest(): Promise<SyncRecord | undefined> {
    const results = await db
      .select()
      .from(syncHistory)
      .orderBy(desc(syncHistory.startedAt))
      .limit(1);
    
    return results[0];
  }

  /**
   * 创建新的同步记录
   */
  async create(data: {
    source: string;
    status: string;
    details?: string;
  }): Promise<SyncRecord> {
    // 创建新同步记录数据
    const newRecord: NewSyncRecord = {
      source: data.source,
      status: data.status,
      details: data.details || null,
      startedAt: new Date(),
      completedAt: data.status !== 'pending' ? new Date() : null,
    };

    // 插入同步记录并返回插入的数据
    const [createdRecord] = await db.insert(syncHistory).values(newRecord).returning();
    return createdRecord;
  }

  /**
   * 更新同步记录状态
   */
  async updateStatus(
    id: number, 
    status: string, 
    details?: string
  ): Promise<SyncRecord> {
    // 构建更新数据
    const updateData: Partial<SyncRecord> = {
      status,
      completedAt: new Date(),
    };

    // 如果提供了详情，则更新详情
    if (details) {
      updateData.details = details;
    }

    // 更新记录并返回更新后的数据
    const [updatedRecord] = await db
      .update(syncHistory)
      .set(updateData)
      .where(eq(syncHistory.id, id))
      .returning();

    return updatedRecord;
  }

  /**
   * 通过ID查找同步记录
   */
  async findById(id: number): Promise<SyncRecord | undefined> {
    const result = await db.select().from(syncHistory).where(eq(syncHistory.id, id)).limit(1);
    return result[0];
  }
}

// 创建和导出仓库实例
export const syncRepository = new SyncRepository(); 