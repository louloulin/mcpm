import db from '../../database/db';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export interface User {
  id: string;
  username: string;
  email?: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserInput {
  username: string;
  email?: string;
  password: string;
}

class UserModel {
  /**
   * 获取所有用户
   */
  getAll(options: { limit?: number; offset?: number } = {}) {
    const { limit = 100, offset = 0 } = options;
    const users = db.prepare(`
      SELECT id, username, email, is_verified, created_at, updated_at
      FROM users
      LIMIT ? OFFSET ?
    `).all(limit, offset) as User[];
    
    return users;
  }
  
  /**
   * 通过ID获取用户
   */
  getById(id: string) {
    const user = db.prepare(`
      SELECT id, username, email, is_verified, created_at, updated_at
      FROM users
      WHERE id = ?
    `).get(id) as User | undefined;
    
    return user || null;
  }
  
  /**
   * 通过用户名获取用户
   */
  getByUsername(username: string) {
    const user = db.prepare(`
      SELECT id, username, email, is_verified, created_at, updated_at
      FROM users
      WHERE username = ?
    `).get(username) as User | undefined;
    
    return user || null;
  }
  
  /**
   * 通过邮箱获取用户
   */
  getByEmail(email: string) {
    if (!email) return null;
    
    const user = db.prepare(`
      SELECT id, username, email, is_verified, created_at, updated_at
      FROM users
      WHERE email = ?
    `).get(email) as User | undefined;
    
    return user || null;
  }
  
  /**
   * 创建用户
   */
  create(userData: UserInput) {
    // 检查用户名是否已存在
    const existingUsername = this.getByUsername(userData.username);
    if (existingUsername) {
      throw new Error('用户名已存在');
    }
    
    // 检查邮箱是否已存在
    if (userData.email) {
      const existingEmail = this.getByEmail(userData.email);
      if (existingEmail) {
        throw new Error('邮箱已存在');
      }
    }
    
    const id = uuidv4();
    const now = new Date().toISOString();
    const passwordHash = this.hashPassword(userData.password);
    
    db.prepare(`
      INSERT INTO users (id, username, email, password_hash, is_verified, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      userData.username,
      userData.email || null,
      passwordHash,
      false,
      now,
      now
    );
    
    return this.getById(id);
  }
  
  /**
   * 更新用户
   */
  update(id: string, userData: Partial<UserInput & { is_verified?: boolean }>) {
    const user = this.getById(id);
    if (!user) return null;
    
    const now = new Date().toISOString();
    
    let updateQuery = 'UPDATE users SET updated_at = ?';
    const params: any[] = [now];
    
    if (userData.username) {
      // 检查用户名是否已被其他用户使用
      const existingUsername = this.getByUsername(userData.username);
      if (existingUsername && existingUsername.id !== id) {
        throw new Error('用户名已存在');
      }
      
      updateQuery += ', username = ?';
      params.push(userData.username);
    }
    
    if (userData.email !== undefined) {
      // 检查邮箱是否已被其他用户使用
      if (userData.email) {
        const existingEmail = this.getByEmail(userData.email);
        if (existingEmail && existingEmail.id !== id) {
          throw new Error('邮箱已存在');
        }
      }
      
      updateQuery += ', email = ?';
      params.push(userData.email || null);
    }
    
    if (userData.password) {
      const passwordHash = this.hashPassword(userData.password);
      updateQuery += ', password_hash = ?';
      params.push(passwordHash);
    }
    
    if (userData.is_verified !== undefined) {
      updateQuery += ', is_verified = ?';
      params.push(userData.is_verified ? 1 : 0);
    }
    
    updateQuery += ' WHERE id = ?';
    params.push(id);
    
    db.prepare(updateQuery).run(...params);
    
    return this.getById(id);
  }
  
  /**
   * 删除用户
   */
  delete(id: string) {
    const result = db.prepare('DELETE FROM users WHERE id = ?').run(id);
    return result.changes > 0;
  }
  
  /**
   * 验证用户凭据
   */
  authenticate(username: string, password: string) {
    const user = db.prepare(`
      SELECT id, username, email, password_hash, is_verified, created_at, updated_at
      FROM users
      WHERE username = ?
    `).get(username) as (User & { password_hash: string }) | undefined;
    
    if (!user) return null;
    
    const passwordHash = this.hashPassword(password);
    if (passwordHash !== user.password_hash) return null;
    
    // 去除敏感信息
    const { password_hash, ...safeUser } = user;
    return safeUser;
  }
  
  /**
   * 哈希密码
   */
  private hashPassword(password: string): string {
    return crypto
      .createHash('sha256')
      .update(password + process.env.JWT_SECRET)
      .digest('hex');
  }
}

export default new UserModel(); 