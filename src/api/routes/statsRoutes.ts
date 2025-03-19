import { Router } from 'express';
import StatsController from '../controllers/StatsController';
import { requireAdmin, requireAuth } from '../middlewares/authMiddleware';

const router = Router();

// 公共路由
router.get('/', StatsController.getOverview.bind(StatsController));
router.get('/popular', StatsController.getPopularServers.bind(StatsController));

// 需要用户登录
router.post('/download/:serverId', requireAuth, StatsController.recordDownload.bind(StatsController));

// 需要管理员权限的路由
router.get('/access-logs', requireAdmin, StatsController.getAccessLogs.bind(StatsController));
router.get('/download-history', requireAdmin, StatsController.getDownloadHistory.bind(StatsController));

export default router; 