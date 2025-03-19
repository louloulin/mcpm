import { Request, Response, NextFunction } from 'express';
import StatsModel from '../models/StatsModel';

/**
 * 访问日志中间件
 * 记录API请求
 */
export const accessLogger = (req: Request, res: Response, next: NextFunction) => {
  // 排除健康检查等不需要记录的接口
  if (req.path === '/health' || req.path.startsWith('/api/v1/stats/access-logs')) {
    return next();
  }
  
  try {
    // 记录请求信息
    StatsModel.logAccess({
      endpoint: req.originalUrl,
      method: req.method,
      user_id: req.user?.id,
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });
  } catch (error) {
    // 即使记录失败也不影响请求处理
    console.error('记录访问日志失败:', error);
  }
  
  next();
}; 