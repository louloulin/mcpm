import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

export default defineConfig({
  schema: './lib/database/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5433/mcpm",
  },
  verbose: true,
  strict: true,
});