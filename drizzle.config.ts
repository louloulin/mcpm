import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// 加载环境变量
dotenv.config();

// 数据库连接配置
const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/mcpsvr";

// Drizzle配置
export default defineConfig({
  schema: "./lib/database/schema.ts",
  out: "./drizzle",
  driver: "pg",
  dbCredentials: {
    connectionString,
  },
  // 严格模式会检查迁移文件的正确性
  strict: true,
  // 详细输出日志
  verbose: true,
}); 