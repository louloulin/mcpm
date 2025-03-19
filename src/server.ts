import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './api/routes';
import { authenticateToken } from './api/middlewares/authMiddleware';
import { errorHandler, notFoundHandler } from './api/middlewares/errorMiddleware';
import { accessLogger } from './api/middlewares/statsMiddleware';
import syncScheduler from './sync/syncScheduler';

// 加载环境变量
dotenv.config();

// 创建Express应用
const app = express();
const port = process.env.PORT || 4000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 验证令牌
app.use(authenticateToken);

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

// 启动服务器
app.listen(port, () => {
  console.log(`服务器运行在端口 ${port}`);
  
  // 启动同步调度器
  if (process.env.NODE_ENV !== 'test') {
    syncScheduler.start();
    console.log('同步调度器已启动');
  }
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，准备关闭');
  syncScheduler.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('收到 SIGINT 信号，准备关闭');
  syncScheduler.stop();
  process.exit(0);
});

export default app; 