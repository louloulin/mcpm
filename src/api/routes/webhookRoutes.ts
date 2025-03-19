import { Router } from 'express';
import WebhookController from '../controllers/WebhookController';

const router = Router();

// Glama Webhook接收端点
router.post('/glama', WebhookController.receiveGlamaEvent.bind(WebhookController));

export default router; 