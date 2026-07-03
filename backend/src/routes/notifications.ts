import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import { getNotifications, markRead, markAllRead } from '../controllers/notificationController';

const router = Router();

router.get('/', protect, getNotifications);
router.put('/mark-all-read', protect, markAllRead);
router.put('/:id/read', protect, markRead);

export default router;
