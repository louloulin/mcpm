import { Router } from 'express';
import UserController from '../controllers/UserController';
import { requireAuth, requireAdmin } from '../middlewares/authMiddleware';

const router = Router();

// 认证路由
router.post('/register', UserController.register);
router.post('/login', UserController.login);

// 用户路由
router.get('/me', requireAuth, UserController.getCurrent);
router.get('/', requireAdmin, UserController.getAll);
router.get('/:id', requireAuth, UserController.getById);
router.put('/:id', requireAuth, UserController.update);
router.delete('/:id', requireAuth, UserController.delete);

export default router;