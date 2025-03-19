import { Router } from 'express';
import ServerController from '../controllers/ServerController';
import { requireAuth } from '../middlewares/authMiddleware';

const router = Router();

// 公共路由
router.get('/', ServerController.getAll);
router.get('/search', ServerController.search);
router.get('/:id', ServerController.getById);
router.get('/key/:key', ServerController.getByKey);
router.post('/:id/download', ServerController.recordDownload);

// 需要认证的路由
router.post('/', requireAuth, ServerController.create);
router.put('/:id', requireAuth, ServerController.update);
router.delete('/:id', requireAuth, ServerController.delete);

export default router; 