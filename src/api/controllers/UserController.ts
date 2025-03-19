import { Request, Response } from 'express';
import UserModel, { UserInput } from '../models/UserModel';
import jwt from 'jsonwebtoken';

class UserController {
  /**
   * 获取所有用户
   */
  async getAll(req: Request, res: Response) {
    try {
      const { limit, offset } = req.query;
      
      const options: { limit?: number; offset?: number } = {};
      if (limit) options.limit = parseInt(limit as string);
      if (offset) options.offset = parseInt(offset as string);
      
      const users = UserModel.getAll(options);
      return res.json(users);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || '获取用户列表失败' });
    }
  }
  
  /**
   * 获取当前用户信息
   */
  async getCurrent(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: '未登录' });
      }
      
      const user = UserModel.getById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: '用户不存在' });
      }
      
      return res.json(user);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || '获取用户信息失败' });
    }
  }
  
  /**
   * 通过ID获取用户
   */
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = UserModel.getById(id);
      
      if (!user) {
        return res.status(404).json({ error: '用户不存在' });
      }
      
      return res.json(user);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || '获取用户失败' });
    }
  }
  
  /**
   * 注册新用户
   */
  async register(req: Request, res: Response) {
    try {
      const userData: UserInput = req.body;
      
      // 验证必填字段
      if (!userData.username || !userData.password) {
        return res.status(400).json({ error: '用户名和密码是必填的' });
      }
      
      try {
        const user = UserModel.create(userData);
        
        // 生成token
        const token = this.generateToken(user.id);
        
        return res.status(201).json({
          user,
          token
        });
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    } catch (error: any) {
      return res.status(500).json({ error: error.message || '用户注册失败' });
    }
  }
  
  /**
   * 用户登录
   */
  async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: '用户名和密码是必填的' });
      }
      
      const user = UserModel.authenticate(username, password);
      if (!user) {
        return res.status(401).json({ error: '用户名或密码错误' });
      }
      
      // 生成token
      const token = this.generateToken(user.id);
      
      return res.json({
        user,
        token
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || '登录失败' });
    }
  }
  
  /**
   * 更新用户信息
   */
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userData = req.body;
      
      // 权限检查 - 只有自己或管理员可以更新
      if (req.user && req.user.id !== id && req.user.role !== 'admin') {
        return res.status(403).json({ error: '无权更新此用户' });
      }
      
      try {
        const user = UserModel.update(id, userData);
        if (!user) {
          return res.status(404).json({ error: '用户不存在' });
        }
        
        return res.json(user);
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    } catch (error: any) {
      return res.status(500).json({ error: error.message || '更新用户失败' });
    }
  }
  
  /**
   * 删除用户
   */
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // 权限检查 - 只有自己或管理员可以删除
      if (req.user && req.user.id !== id && req.user.role !== 'admin') {
        return res.status(403).json({ error: '无权删除此用户' });
      }
      
      const result = UserModel.delete(id);
      if (result) {
        return res.status(204).send();
      } else {
        return res.status(404).json({ error: '用户不存在' });
      }
    } catch (error: any) {
      return res.status(500).json({ error: error.message || '删除用户失败' });
    }
  }
  
  /**
   * 生成JWT令牌
   */
  private generateToken(userId: string): string {
    return jwt.sign(
      { id: userId },
      process.env.JWT_SECRET || 'your_jwt_secret_key_change_this_in_production',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }
}

export default new UserController(); 