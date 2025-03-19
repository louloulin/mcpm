import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

// 加载环境变量
dotenv.config();

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/mcpsvr";

export default defineConfig({
  schema: "./lib/database/schema.ts",
  out: "./drizzle",
  driver: "pg",
  dbCredentials: {
    connectionString,
  },
  verbose: true,
  strict: true,
}); 