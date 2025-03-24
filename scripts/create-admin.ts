import { db } from '../lib/database/db';
import { users } from '../lib/database/schema';
import bcrypt from 'bcryptjs';

async function createAdminUser() {
  try {
    console.log('开始创建管理员用户...');
    
    // 检查用户是否已存在
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, 'admin@example.com')
    });
    
    if (existingUser) {
      console.log('管理员用户已存在，跳过创建');
      return;
    }
    
    // 创建哈希密码
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    // 插入管理员用户
    const result = await db.insert(users).values({
      email: 'admin@example.com',
      name: 'Administrator',
      password: hashedPassword,
      role: 'admin',
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    console.log('管理员用户创建成功:', result[0]);
  } catch (error) {
    console.error('创建管理员用户失败:', error);
  } finally {
    process.exit(0);
  }
}

createAdminUser(); 