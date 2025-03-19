import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { exit } from 'process';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

import * as schema from '../lib/database/schema';
import { users, tags, servers } from '../lib/database/schema';

// 加载环境变量
dotenv.config();

// 数据库连接配置
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/mcpsvr';

/**
 * 数据库种子函数 - 填充初始数据
 */
async function seedDatabase() {
  console.log('🔄 正在连接到数据库...');
  
  try {
    const sql = postgres(connectionString);
    const db = drizzle(sql, { schema });

    console.log('🔄 正在填充初始数据...');
    
    // 创建管理员用户
    const adminExists = await db.select().from(users).where(eq(users.username, 'admin')).limit(1);
    
    if (adminExists.length === 0) {
      console.log('📝 创建管理员用户...');
      
      const adminPasswordHash = await bcrypt.hash('admin123', 10);
      
      await db.insert(users).values({
        id: uuidv4(),
        username: 'admin',
        email: 'admin@example.com',
        passwordHash: adminPasswordHash,
        fullName: '系统管理员',
        role: 'admin',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    
    // 创建基础标签
    const basicTags = [
      { name: 'AI', color: '#3B82F6', description: 'AI相关服务器' },
      { name: 'Chat', color: '#10B981', description: '聊天相关服务器' },
      { name: 'Tools', color: '#F59E0B', description: '工具类服务器' },
      { name: 'RAG', color: '#8B5CF6', description: 'RAG相关服务器' },
      { name: 'Voice', color: '#EC4899', description: '语音相关服务器' },
      { name: 'Image', color: '#EF4444', description: '图像相关服务器' },
    ];
    
    for (const tag of basicTags) {
      const existingTag = await db.select().from(tags).where(eq(tags.name, tag.name)).limit(1);
      
      if (existingTag.length === 0) {
        console.log(`📝 创建标签: ${tag.name}`);
        
        await db.insert(tags).values({
          name: tag.name,
          color: tag.color,
          description: tag.description,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }
    
    // 创建示例服务器
    const sampleServerExists = await db.select().from(servers).where(eq(servers.key, 'sample-server')).limit(1);
    
    if (sampleServerExists.length === 0) {
      console.log('📝 创建示例服务器...');
      
      await db.insert(servers).values({
        id: uuidv4(),
        key: 'sample-server',
        name: '示例服务器',
        version: '1.0.0',
        description: '这是一个示例服务器，展示基本功能',
        authorId: (await db.select().from(users).where(eq(users.username, 'admin')).limit(1))[0]?.id,
        homepage: 'https://example.com',
        repository: 'https://github.com/example/sample-server',
        license: 'MIT',
        startCommand: 'npx start-server',
        downloads: 0,
        rating: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    
    console.log('✅ 数据库种子完成！');
    
    await sql.end();
    exit(0);
  } catch (error) {
    console.error('❌ 数据库种子失败:', error);
    exit(1);
  }
}

// 开始填充数据
console.log('🚀 开始数据库初始化填充');
seedDatabase(); 