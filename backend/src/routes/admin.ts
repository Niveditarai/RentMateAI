import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import { authorize } from '../middleware/roleMiddleware';
import { getAdminStats, getAdminUsers, deleteUser } from '../controllers/adminController';

const router = Router();

router.get('/stats', protect, authorize('admin'), getAdminStats);
router.get('/users', protect, authorize('admin'), getAdminUsers);
router.delete('/users/:id', protect, authorize('admin'), deleteUser);

export default router;
