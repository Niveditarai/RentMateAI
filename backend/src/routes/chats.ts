import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import { getChats, getMessages, sendMessage } from '../controllers/chatController';

const router = Router();

router.get('/', protect, getChats);
router.get('/:chatId/messages', protect, getMessages);
router.post('/messages', protect, sendMessage);

export default router;
