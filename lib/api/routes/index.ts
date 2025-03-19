import { Router } from 'express';
import serverRoutes from './serverRoutes';
import userRoutes from './userRoutes';
import syncRoutes from './syncRoutes';
import statsRoutes from './statsRoutes';
import webhookRoutes from './webhookRoutes';

const router = Router();

router.use('/servers', serverRoutes);
router.use('/users', userRoutes);
router.use('/sync', syncRoutes);
router.use('/stats', statsRoutes);
router.use('/webhooks', webhookRoutes);

export default router; 