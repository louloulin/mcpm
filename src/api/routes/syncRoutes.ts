import { Router } from 'express';
import SyncController from '../controllers/SyncController';
import { requireAdmin } from '../middlewares/authMiddleware';

const router = Router();

// 公共路由
router.get('/', SyncController.getAll);
router.get('/latest', SyncController.getLatest);
router.get('/:id', SyncController.getById);

// 需要管理员权限的路由
router.post('/trigger', requireAdmin, SyncController.triggerSync);

export default router; 