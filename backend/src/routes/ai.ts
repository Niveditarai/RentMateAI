import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import { authorize } from '../middleware/roleMiddleware';
import { computeCompatibility } from '../controllers/aiController';

const router = Router();

router.post('/compatibility', protect, authorize('tenant'), computeCompatibility);

export default router;
