import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './api/routes';
import { errorHandler, notFoundHandler } from './api/middlewares/errorMiddleware';
import { accessLogger } from './api/middlewares/statsMiddleware';
import syncScheduler from './sync/syncScheduler';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { notificationWebSocketService } from './api/services/NotificationWebSocketService';
import { statsWebSocketService } from './api/services/StatsWebSocketService';

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

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = Number(process.env.PORT) || 3000;

// 初始化Next.js应用
const nextApp = next({ dev, hostname, port });
const nextHandle = nextApp.getRequestHandler();

/**
 * 启动服务器
 */
async function startServer() {
  try {
    // 准备Next.js应用
    await nextApp.prepare();
    
    // 创建HTTP服务器
    const server = createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url || '', true);
        await nextHandle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error occurred handling request:', err);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    });
    
    // 初始化WebSocket通知服务
    notificationWebSocketService.initialize(server);
    
    // 初始化实时统计WebSocket服务
    statsWebSocketService.initialize(server);
    
    // 启动服务器
    server.listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
    
    // 处理进程终止信号
    const signals = ['SIGINT', 'SIGTERM'];
    signals.forEach(signal => {
      process.on(signal, () => {
        console.log(`> ${signal} signal received. Closing server...`);
        
        // 关闭WebSocket服务
        notificationWebSocketService.close();
        statsWebSocketService.close();
        
        // 关闭HTTP服务器
        server.close(() => {
          console.log('> HTTP server closed');
          process.exit(0);
        });
      });
    });
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
}

// 导出启动函数
export { startServer };

// 导出Express应用
export default app; 