import { Request, Response } from 'express';
import StatsModel from '../models/StatsModel';
import ServerModel from '../models/ServerModel';

class StatsController {
  /**
   * 获取系统概览统计信息
   */
  async getOverview(req: Request, res: Response) {
    try {
      // 获取关键统计数据
      const serverCount = ServerModel.getTotalCount();
      const downloadCount = this.getTotalDownloads();
      const activeUsers = StatsModel.getActiveUsers().count;
      
      // 获取最近7天的每日下载数据
      const dailyDownloads = this.getDailyDownloads(7);
      
      // 获取热门服务器
      const popularServers = StatsModel.getPopularServers(5);
      
      return res.json({
        summary: {
          serverCount,
          downloadCount,
          activeUsers
        },
        dailyDownloads,
        popularServers
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || '获取统计数据失败' });
    }
  }
  
  /**
   * 获取访问日志
   */
  async getAccessLogs(req: Request, res: Response) {
    try {
      // 检查用户权限 - 需要管理员权限
      if (req.user && req.user.role !== 'admin') {
        return res.status(403).json({ error: '无权访问日志数据' });
      }
      
      const { limit, offset, endpoint, startDate, endDate } = req.query;
      
      const options: any = {};
      if (limit) options.limit = parseInt(limit as string);
      if (offset) options.offset = parseInt(offset as string);
      if (endpoint) options.endpoint = endpoint as string;
      if (startDate) options.startDate = startDate as string;
      if (endDate) options.endDate = endDate as string;
      
      const logs = StatsModel.getAccessLogs(options);
      return res.json(logs);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || '获取访问日志失败' });
    }
  }
  
  /**
   * 获取下载历史
   */
  async getDownloadHistory(req: Request, res: Response) {
    try {
      // 检查用户权限 - 需要管理员权限
      if (req.user && req.user.role !== 'admin') {
        return res.status(403).json({ error: '无权访问下载历史数据' });
      }
      
      const { limit, offset, serverId, startDate, endDate } = req.query;
      
      const options: any = {};
      if (limit) options.limit = parseInt(limit as string);
      if (offset) options.offset = parseInt(offset as string);
      if (serverId) options.server_id = serverId as string;
      if (startDate) options.startDate = startDate as string;
      if (endDate) options.endDate = endDate as string;
      
      const history = StatsModel.getDownloadHistory(options);
      return res.json(history);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || '获取下载历史失败' });
    }
  }
  
  /**
   * 获取热门服务器
   */
  async getPopularServers(req: Request, res: Response) {
    try {
      const { limit } = req.query;
      const count = limit ? parseInt(limit as string) : 10;
      
      const servers = StatsModel.getPopularServers(count);
      return res.json(servers);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || '获取热门服务器失败' });
    }
  }
  
  /**
   * 记录下载
   */
  async recordDownload(req: Request, res: Response) {
    try {
      const { serverId } = req.params;
      
      // 检查服务器是否存在
      const server = ServerModel.getById(serverId);
      if (!server) {
        return res.status(404).json({ error: '服务器不存在' });
      }
      
      // 记录下载
      const downloadId = StatsModel.logDownload({
        server_id: serverId,
        user_id: req.user?.id,
        ip_address: req.ip
      });
      
      return res.status(200).json({
        success: true,
        downloadId
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || '记录下载失败' });
    }
  }
  
  /**
   * 获取总下载量
   */
  private getTotalDownloads() {
    const result = ServerModel.db.prepare('SELECT SUM(downloads) as total FROM servers').get() as { total: number };
    return result.total || 0;
  }
  
  /**
   * 获取每日下载数据
   */
  private getDailyDownloads(days: number) {
    const result = ServerModel.db.prepare(`
      SELECT 
        date(timestamp) as date, 
        COUNT(*) as count 
      FROM download_history 
      WHERE timestamp >= datetime('now', ?) 
      GROUP BY date(timestamp) 
      ORDER BY date
    `).all(`-${days} day`) as { date: string; count: number }[];
    
    // 填充没有数据的日期
    const dailyData: Record<string, number> = {};
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      dailyData[dateString] = 0;
    }
    
    // 填入实际数据
    result.forEach(item => {
      dailyData[item.date] = item.count;
    });
    
    // 转换为数组格式并排序
    return Object.entries(dailyData)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}

export default new StatsController(); 