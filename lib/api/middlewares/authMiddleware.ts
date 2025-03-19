import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import UserModel from '../models/UserModel';

/**
 * 验证JWT令牌
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return next(); // 继续，但不设置用户信息
  }
  
  try {
    const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret_key_change_this_in_production';
    const decoded = jwt.verify(token, jwtSecret) as { id: string };
    
    // 查找用户
    const user = UserModel.getById(decoded.id);
    if (user) {
      // 简单的角色分配逻辑，可根据需要调整
      const role = user.username === 'admin' ? 'admin' : 'user';
      
      // 将用户信息附加到请求对象
      req.user = {
        id: user.id,
        role
      };
    }
    
    next();
  } catch (error) {
    // 令牌无效，但仍继续（作为未认证用户）
    next();
  }
};

/**
 * 要求用户已登录
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: '需要登录' });
  }
  
  next();
};

/**
 * 要求用户具有管理员权限
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: '需要登录' });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  
  next();
}; 