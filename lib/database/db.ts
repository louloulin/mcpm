import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 获取并记录数据库连接字符串（隐藏密码）
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres';
console.log('数据库连接字符串:', connectionString.replace(/:[^:]*@/, ':******@'));

// 数据库连接配置
const pool = new Pool({
  connectionString,
});

// 添加连接错误处理
pool.on('error', (err) => {
  console.error('数据库连接池错误:', err);
});

// 测试连接
pool.query('SELECT NOW()', [])
  .then(res => {
    console.log('数据库连接成功! 服务器时间:', res.rows[0].now);
  })
  .catch(err => {
    console.error('数据库连接测试失败:', err);
  });

// 创建 Drizzle 实例
export const db = drizzle(pool, { schema });

// 导出 schema 以便在其他地方使用
export { schema }; 