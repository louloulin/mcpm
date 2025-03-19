import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import dotenv from "dotenv";

// 加载环境变量
dotenv.config();

// 数据库连接配置
const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/mcpsvr";

// 迁移运行函数
async function runMigration() {
  console.log("正在连接到数据库...");
  
  try {
    const client = postgres(connectionString);
    const db = drizzle(client);

    console.log("正在运行数据库迁移...");
    
    await migrate(db, { migrationsFolder: "./drizzle" });
    
    console.log("迁移完成！");
    
    await client.end();
    
    process.exit(0);
  } catch (error) {
    console.error("迁移失败:", error);
    process.exit(1);
  }
}

// 执行迁移
runMigration(); 