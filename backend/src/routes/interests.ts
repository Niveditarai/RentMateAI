import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import { authorize } from '../middleware/roleMiddleware';
import { createInterest, getInterests, updateInterestStatus } from '../controllers/interestController';

const router = Router();

router.post('/', protect, authorize('tenant'), createInterest);
router.get('/', protect, getInterests);
router.put('/:id/status', protect, authorize('owner', 'admin'), updateInterestStatus);

export default router;
