import { startSyncScheduler, stopSyncScheduler } from '@/lib/server';

// 在应用启动时运行
if (process.env.NODE_ENV !== 'development') {
  console.log('Starting sync scheduler...');
  startSyncScheduler();
  
  // 设置关闭处理
  process.on('SIGTERM', () => {
    console.log('Received SIGTERM signal, shutting down...');
    stopSyncScheduler();
    process.exit(0);
  });
  
  process.on('SIGINT', () => {
    console.log('Received SIGINT signal, shutting down...');
    stopSyncScheduler();
    process.exit(0);
  });
}

export {}; 