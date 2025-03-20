import { db } from '../../database/db';
import { users } from '../../database/schema';
import { eq } from 'drizzle-orm';
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
  async getAll(options: { limit?: number; offset?: number } = {}) {
    const { limit = 100, offset = 0 } = options;
    
    const result = await db
      .select({
        id: users.id,
        username: users.name,
        email: users.email,
        is_verified: users.isVerified,
        created_at: users.createdAt,
        updated_at: users.updatedAt
      })
      .from(users)
      .limit(limit)
      .offset(offset);
    
    return result;
  }
  
  /**
   * 通过ID获取用户
   */
  async getById(id: string) {
    const result = await db
      .select({
        id: users.id,
        username: users.name,
        email: users.email,
        is_verified: users.isVerified,
        created_at: users.createdAt,
        updated_at: users.updatedAt
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    
    return result.length > 0 ? result[0] : null;
  }
  
  /**
   * 通过用户名获取用户
   */
  async getByUsername(username: string) {
    const result = await db
      .select({
        id: users.id,
        username: users.name,
        email: users.email,
        is_verified: users.isVerified,
        created_at: users.createdAt,
        updated_at: users.updatedAt
      })
      .from(users)
      .where(eq(users.name, username))
      .limit(1);
    
    return result.length > 0 ? result[0] : null;
  }
  
  /**
   * 通过邮箱获取用户
   */
  async getByEmail(email: string) {
    if (!email) return null;
    
    const result = await db
      .select({
        id: users.id,
        username: users.name,
        email: users.email,
        is_verified: users.isVerified,
        created_at: users.createdAt,
        updated_at: users.updatedAt
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    return result.length > 0 ? result[0] : null;
  }
  
  /**
   * 创建用户
   */
  async create(userData: UserInput) {
    // 检查用户名是否已存在
    const existingUsername = await this.getByUsername(userData.username);
    if (existingUsername) {
      throw new Error('用户名已存在');
    }
    
    // 检查邮箱是否已存在
    if (userData.email) {
      const existingEmail = await this.getByEmail(userData.email);
      if (existingEmail) {
        throw new Error('邮箱已存在');
      }
    }
    
    const id = uuidv4();
    const now = new Date();
    const passwordHash = this.hashPassword(userData.password);
    
    await db.insert(users).values({
      id,
      name: userData.username,
      email: userData.email || '',
      password: passwordHash,
      isVerified: false,
      createdAt: now,
      updatedAt: now
    });
    
    return await this.getById(id);
  }
  
  /**
   * 更新用户
   */
  async update(id: string, userData: Partial<UserInput & { is_verified?: boolean }>) {
    const user = await this.getById(id);
    if (!user) return null;
    
    const updateData: any = {
      updatedAt: new Date()
    };
    
    if (userData.username) {
      // 检查用户名是否已被其他用户使用
      const existingUsername = await this.getByUsername(userData.username);
      if (existingUsername && existingUsername.id !== id) {
        throw new Error('用户名已存在');
      }
      
      updateData.name = userData.username;
    }
    
    if (userData.email !== undefined) {
      // 检查邮箱是否已被其他用户使用
      if (userData.email) {
        const existingEmail = await this.getByEmail(userData.email);
        if (existingEmail && existingEmail.id !== id) {
          throw new Error('邮箱已存在');
        }
      }
      
      updateData.email = userData.email || '';
    }
    
    if (userData.password) {
      updateData.password = this.hashPassword(userData.password);
    }
    
    if (userData.is_verified !== undefined) {
      updateData.isVerified = userData.is_verified;
    }
    
    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id));
    
    return await this.getById(id);
  }
  
  /**
   * 删除用户
   */
  async delete(id: string) {
    const result = await db
      .delete(users)
      .where(eq(users.id, id));
    
    return !!result;
  }
  
  /**
   * 验证用户凭据
   */
  async authenticate(username: string, password: string) {
    const result = await db
      .select({
        id: users.id,
        username: users.name,
        email: users.email,
        password_hash: users.password,
        is_verified: users.isVerified,
        created_at: users.createdAt,
        updated_at: users.updatedAt
      })
      .from(users)
      .where(eq(users.name, username))
      .limit(1);
    
    if (result.length === 0) return null;
    
    const user = result[0];
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