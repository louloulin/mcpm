import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 数据库连接配置
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/mcpm',
});

// 创建 Drizzle 实例
export const db = drizzle(pool, { schema });

// 导出 schema 以便在其他地方使用
export { schema }; 