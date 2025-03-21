import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { sql } from 'drizzle-orm';
import * as schema from '@/lib/database/schema';

// 创建测试数据库连接池
const pool = new Pool({
  connectionString: process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/test'
});

// 创建Drizzle ORM实例
export const testDb = drizzle(pool, { schema });
export const testPool = pool;

// 清理测试数据
export async function clearTestData() {
  await testDb.execute(sql`TRUNCATE TABLE webhooks CASCADE`);
}

// 关闭数据库连接
export async function closeTestDb() {
  await pool.end();
} 