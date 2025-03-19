import { GlamaSync } from '../api/services/GlamaSync';
import SyncModel from '../api/models/SyncModel';

/**
 * 同步调度器
 * 负责按计划执行同步任务
 */
class SyncScheduler {
  private interval: NodeJS.Timeout | null = null;
  private syncIntervalMs: number;
  
  constructor() {
    // 默认为24小时
    this.syncIntervalMs = parseInt(process.env.SYNC_INTERVAL || '86400000');
  }
  
  /**
   * 启动同步调度
   */
  start(): void {
    if (this.interval) {
      this.stop();
    }
    
    console.log(`启动同步调度，间隔: ${this.syncIntervalMs}ms (${this.syncIntervalMs / 3600000}小时)`);
    
    // 立即执行一次同步
    this.performSync();
    
    // 设置定期同步
    this.interval = setInterval(() => {
      this.performSync();
    }, this.syncIntervalMs);
  }
  
  /**
   * 停止同步调度
   */
  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      console.log('同步调度已停止');
    }
  }
  
  /**
   * 执行同步
   */
  private async performSync(): Promise<void> {
    // 检查是否有正在进行的同步
    const pendingSync = SyncModel.getPendingSync();
    if (pendingSync) {
      console.log(`已有正在进行的同步 (ID: ${pendingSync.id})，跳过本次同步`);
      return;
    }
    
    try {
      console.log('开始执行同步操作');
      
      // 创建同步记录
      const syncId = SyncModel.create('glama');
      
      // 执行同步
      const syncService = new GlamaSync();
      const result = await syncService.sync();
      
      // 更新同步记录
      SyncModel.update(syncId, {
        status: 'completed',
        details: JSON.stringify(result)
      });
      
      console.log(`同步完成 (ID: ${syncId})，结果:`, result);
    } catch (error: any) {
      console.error('执行同步时出错:', error);
    }
  }
  
  /**
   * 手动触发同步
   */
  async triggerSync(): Promise<number | null> {
    // 检查是否有正在进行的同步
    const pendingSync = SyncModel.getPendingSync();
    if (pendingSync) {
      console.log(`已有正在进行的同步 (ID: ${pendingSync.id})，无法触发新同步`);
      return null;
    }
    
    try {
      // 创建同步记录
      const syncId = SyncModel.create('glama');
      
      // 异步执行同步，不等待完成
      this.performSyncById(syncId).catch(error => {
        console.error(`同步 ${syncId} 执行失败:`, error);
      });
      
      return syncId;
    } catch (error: any) {
      console.error('触发同步时出错:', error);
      return null;
    }
  }
  
  /**
   * 根据ID执行同步
   */
  private async performSyncById(syncId: number): Promise<void> {
    try {
      // 执行同步
      const syncService = new GlamaSync();
      const result = await syncService.sync();
      
      // 更新同步记录
      SyncModel.update(syncId, {
        status: 'completed',
        details: JSON.stringify(result)
      });
      
      console.log(`同步完成 (ID: ${syncId})，结果:`, result);
    } catch (error: any) {
      // 更新同步记录为失败
      SyncModel.update(syncId, {
        status: 'failed',
        details: error.message || '同步失败'
      });
      
      console.error(`同步 ${syncId} 执行失败:`, error);
      throw error;
    }
  }
}

// 导出单例
export default new SyncScheduler(); 