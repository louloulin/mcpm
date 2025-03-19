import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { exit } from 'process';

// 加载环境变量
dotenv.config();

// 数据库连接配置
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/mcpsvr';

// 迁移函数 - 应用所有迁移
async function runMigration() {
  console.log('🔄 正在连接到数据库...');
  
  try {
    const sql = postgres(connectionString, { max: 1 });
    const db = drizzle(sql);

    console.log('🔄 正在执行迁移...');
    
    await migrate(db, { migrationsFolder: './drizzle' });
    
    console.log('✅ 迁移完成！');
    
    await sql.end();
    exit(0);
  } catch (error) {
    console.error('❌ 迁移失败:', error);
    exit(1);
  }
}

// 开始执行迁移
console.log('🚀 开始数据库迁移过程');
runMigration(); 