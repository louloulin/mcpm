import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import { and, eq, gt } from 'drizzle-orm';
import schedule from 'node-cron';
import { db } from '@/lib/database';
import { users } from '@/lib/database/schema';
import { UpdateNotifier } from './api/services/UpdateNotifier';
import { RecommendationService } from './api/services/RecommendationService';
import { initSwagger } from './api/documentation/swagger';

// 加载环境变量
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

// 创建Express应用
const app = express();

// 基础中间件
app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// 初始化API文档
initSwagger(app);

/**
 * 初始化服务
 */
function initializeServices() {
  // 初始化更新通知器并设置定时任务
  const updateNotifier = new UpdateNotifier();
  
  // 每12小时检查一次更新
  schedule.schedule('0 */12 * * *', () => {
    console.log('[UpdateNotifier] 开始检查依赖更新...');
    updateNotifier.checkDependencyUpdates().catch(err => {
      console.error('[UpdateNotifier] 检查依赖更新时出错:', err);
    });
  });
  
  // 服务启动后1分钟执行首次检查
  setTimeout(() => {
    console.log('[UpdateNotifier] 执行首次依赖更新检查...');
    updateNotifier.checkDependencyUpdates().catch(err => {
      console.error('[UpdateNotifier] 首次检查依赖更新时出错:', err);
    });
  }, 60 * 1000);

  // 初始化推荐服务
  const recommendationService = new RecommendationService();
  
  // 每24小时为活跃用户更新推荐
  schedule.schedule('0 0 * * *', async () => {
    try {
      console.log('[RecommendationService] 开始为活跃用户生成推荐...');
      
      // 获取过去7天内活跃的用户
      const date = new Date();
      date.setDate(date.getDate() - 7);
      
      const activeUsers = await db.select().from(users).where(
        and(
          eq(users.isActive, true),
          gt(users.lastLoginAt, date)
        )
      );
      
      console.log(`[RecommendationService] 找到 ${activeUsers.length} 个活跃用户`);
      
      // 为每个用户生成推荐
      for (const user of activeUsers) {
        await recommendationService.generateRecommendationsForUser(user.id);
      }
      
      console.log('[RecommendationService] 推荐生成完成');
    } catch (error) {
      console.error('[RecommendationService] 生成推荐时出错:', error);
    }
  });
}

// 初始化各种服务
initializeServices();

// 启动服务器
const server = app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://${HOST}:${PORT}`);
  console.log(`📚 API文档地址: http://${HOST}:${PORT}/api-docs`);
});

// 处理进程终止信号
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，优雅关闭中...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('收到 SIGINT 信号，优雅关闭中...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

export default app;