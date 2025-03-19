import { Request, Response } from 'express';
import SyncModel from '../models/SyncModel';
import syncScheduler from '../../sync/syncScheduler';

class SyncController {
  /**
   * 获取所有同步记录
   */
  async getAll(req: Request, res: Response) {
    try {
      const { limit, offset } = req.query;
      
      const options: { limit?: number; offset?: number } = {};
      if (limit) options.limit = parseInt(limit as string);
      if (offset) options.offset = parseInt(offset as string);
      
      const records = SyncModel.getAll(options);
      return res.json(records);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || '获取同步记录失败' });
    }
  }
  
  /**
   * 获取最新的同步记录
   */
  async getLatest(req: Request, res: Response) {
    try {
      const { source } = req.query;
      const record = SyncModel.getLatest(source as string);
      
      if (!record) {
        return res.status(404).json({ error: '尚无完成的同步记录' });
      }
      
      return res.json(record);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || '获取最新同步记录失败' });
    }
  }
  
  /**
   * 获取特定同步记录
   */
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const recordId = parseInt(id);
      
      if (isNaN(recordId)) {
        return res.status(400).json({ error: '无效的同步记录ID' });
      }
      
      const record = SyncModel.getById(recordId);
      
      if (!record) {
        return res.status(404).json({ error: '同步记录不存在' });
      }
      
      return res.json(record);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || '获取同步记录失败' });
    }
  }
  
  /**
   * 触发同步
   */
  async triggerSync(req: Request, res: Response) {
    try {
      const { source } = req.body;
      
      // 检查用户权限 - 需要管理员权限
      if (req.user && req.user.role !== 'admin') {
        return res.status(403).json({ error: '无权执行同步操作' });
      }
      
      // 检查是否已经有正在进行的同步
      const pendingSync = SyncModel.getPendingSync(source);
      if (pendingSync) {
        return res.status(409).json({
          error: '已有正在进行的同步',
          syncId: pendingSync.id
        });
      }
      
      // 使用调度器触发同步
      const syncId = await syncScheduler.triggerSync();
      
      if (!syncId) {
        return res.status(500).json({ error: '无法触发同步' });
      }
      
      return res.status(202).json({
        message: '同步已触发',
        syncId
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || '触发同步失败' });
    }
  }
}

export default new SyncController(); 