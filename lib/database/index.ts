import { drizzle } from "drizzle-orm/vercel-postgres";
import { sql } from "@vercel/postgres";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { Pool } from 'pg';
import * as schema from "./schema";

// 确定环境
const isProduction = process.env.NODE_ENV === "production";

/**
 * 创建数据库连接
 * 生产环境和开发环境可以使用不同的数据库提供商
 */
export function createDb() {
  try {
    if (isProduction) {
      // 生产环境使用Vercel Postgres
      const db = drizzle(sql, { schema });
      console.log("已连接到Vercel Postgres数据库 (生产环境)");
      return db;
    } else {
      // 开发环境使用标准Postgres (适合本地开发)
      const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/mcpm";
      
      console.log(`正在连接到Postgres数据库 (开发环境): ${connectionString.replace(/:.+@/, ":****@")}`);
      
      // 创建标准pg Pool
      const pool = new Pool({ connectionString });
      
      // 使用drizzlePg创建ORM连接
      const db = drizzlePg(pool, { schema });
      
      console.log("已连接到Postgres数据库 (开发环境)");
      return db;
    }
  } catch (error) {
    console.error("数据库连接失败:", error);
    throw error;
  }
}

// 创建并导出数据库实例
export const db = createDb();

// 导出类型
export type Database = typeof db;

// 重新导出数据库模式
export * from "./schema"; 