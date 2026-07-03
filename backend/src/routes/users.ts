import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import { getProfile, updateProfile, updatePassword, deleteAccount } from '../controllers/userController';

const router = Router();

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, updatePassword);
router.delete('/delete-account', protect, deleteAccount);

export default router;
