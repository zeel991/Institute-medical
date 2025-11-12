import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.ts';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
} from '../controllers/notifications.controller.ts';

const router = Router();

router.use(authenticate);

router.get('/', getNotifications);
router.get('/count', getUnreadCount);
router.patch('/:id/read', markAsRead);

export default router;
