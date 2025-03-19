import { and, eq, like, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { db } from '../index';
import { users, type User, type NewUser } from '../schema';

/**
 * 用户仓库类 - 封装用户相关的所有数据库操作
 */
export class UserRepository {
  /**
   * 通过ID查找用户
   */
  async findById(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  /**
   * 通过用户名查找用户
   */
  async findByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  /**
   * 通过电子邮箱查找用户
   */
  async findByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  /**
   * 搜索用户
   */
  async search(query: string, limit = 10, offset = 0): Promise<{ items: User[]; total: number }> {
    // 构建搜索条件
    const searchPattern = `%${query}%`;
    const whereClause = and(
      like(users.username, searchPattern)
    );

    // 查询匹配的用户
    const items = await db
      .select()
      .from(users)
      .where(whereClause)
      .limit(limit)
      .offset(offset);

    // 获取总计数
    const [{ count }] = await db
      .select({ count: sql`count(*)` })
      .from(users)
      .where(whereClause);

    return {
      items,
      total: Number(count),
    };
  }

  /**
   * 创建新用户
   */
  async create(data: {
    username: string;
    email: string;
    password: string;
    fullName?: string;
  }): Promise<User> {
    // 检查用户名是否已存在
    const existingUsername = await this.findByUsername(data.username);
    if (existingUsername) {
      throw new Error('用户名已存在');
    }

    // 检查电子邮箱是否已存在
    if (data.email) {
      const existingEmail = await this.findByEmail(data.email);
      if (existingEmail) {
        throw new Error('邮箱已被注册');
      }
    }

    // 哈希密码
    const passwordHash = await bcrypt.hash(data.password, 10);

    // 创建新用户数据
    const newUser: NewUser = {
      id: uuidv4(),
      username: data.username,
      email: data.email,
      passwordHash,
      fullName: data.fullName,
      isVerified: false,
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 插入用户并返回插入的数据
    const [createdUser] = await db.insert(users).values(newUser).returning();
    return createdUser;
  }

  /**
   * 更新用户
   */
  async update(id: string, data: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User> {
    // 检查用户是否存在
    const existingUser = await this.findById(id);
    if (!existingUser) {
      throw new Error('用户不存在');
    }

    // 如果要更新用户名，检查是否与其他用户冲突
    if (data.username && data.username !== existingUser.username) {
      const existingUsername = await this.findByUsername(data.username);
      if (existingUsername) {
        throw new Error('用户名已存在');
      }
    }

    // 如果要更新电子邮箱，检查是否与其他用户冲突
    if (data.email && data.email !== existingUser.email) {
      const existingEmail = await this.findByEmail(data.email);
      if (existingEmail) {
        throw new Error('邮箱已被注册');
      }
    }

    // 设置更新时间
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };

    // 更新用户并返回更新后的数据
    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();

    return updatedUser;
  }

  /**
   * 更新用户密码
   */
  async updatePassword(id: string, currentPassword: string, newPassword: string): Promise<boolean> {
    // 获取用户
    const user = await this.findById(id);
    if (!user || !user.passwordHash) {
      throw new Error('用户不存在或未设置密码');
    }

    // 验证当前密码
    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('当前密码不正确');
    }

    // 哈希新密码
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await db
      .update(users)
      .set({
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));

    return true;
  }

  /**
   * 删除用户
   */
  async delete(id: string): Promise<boolean> {
    // 检查用户是否存在
    const existingUser = await this.findById(id);
    if (!existingUser) {
      throw new Error('用户不存在');
    }

    // 删除用户
    await db.delete(users).where(eq(users.id, id));

    return true;
  }

  /**
   * 验证用户凭据
   */
  async validateCredentials(username: string, password: string): Promise<User | null> {
    // 查找用户
    const user = await this.findByUsername(username);
    if (!user || !user.passwordHash) {
      return null;
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }
}

// 创建和导出仓库实例
export const userRepository = new UserRepository(); 