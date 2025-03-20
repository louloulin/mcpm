import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './api/routes';
import { errorHandler, notFoundHandler } from './api/middlewares/errorMiddleware';
import { accessLogger } from './api/middlewares/statsMiddleware';
import syncScheduler from './sync/syncScheduler';

// 加载环境变量
dotenv.config();

// 创建Express应用
const app = express();

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 访问日志
app.use(accessLogger);

// API路由
app.use('/api/v1', routes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404处理
app.use('*', notFoundHandler);

// 错误处理
app.use(errorHandler);

// 导出同步调度器
export const startSyncScheduler = () => {
  if (process.env.NODE_ENV !== 'test') {
    syncScheduler.start();
    console.log('同步调度器已启动');
  }
};

export const stopSyncScheduler = () => {
  syncScheduler.stop();
  console.log('同步调度器已停止');
};

// 导出Express应用
export default app; 