import { exec } from 'child_process';
import * as dotenv from 'dotenv';
import { exit } from 'process';

// 加载环境变量
dotenv.config();

/**
 * 生成数据库迁移文件
 * 基于schema.ts和现有数据库的比较来创建新的迁移文件
 */
function generateMigration() {
  console.log('🔄 正在生成数据库迁移文件...');
  
  const command = 'npx drizzle-kit generate:pg';
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ 执行错误: ${error.message}`);
      exit(1);
    }
    
    if (stderr) {
      console.error(`❌ 错误输出: ${stderr}`);
      exit(1);
    }
    
    console.log(`✅ 迁移文件生成成功: \n${stdout}`);
    exit(0);
  });
}

// 开始生成迁移
console.log('🚀 开始生成数据库迁移文件');
generateMigration(); 