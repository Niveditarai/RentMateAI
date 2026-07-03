import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import { authorize } from '../middleware/roleMiddleware';
import {
  createListing,
  getListings,
  getListingById,
  updateListing,
  deleteListing,
  toggleListingFilled
} from '../controllers/listingController';

const router = Router();

router.post('/', protect, authorize('owner', 'admin'), createListing);
router.get('/', protect, getListings);
router.get('/:id', protect, getListingById);
router.put('/:id', protect, authorize('owner', 'admin'), updateListing);
router.delete('/:id', protect, authorize('owner', 'admin'), deleteListing);
router.put('/:id/filled', protect, authorize('owner', 'admin'), toggleListingFilled);

export default router;
