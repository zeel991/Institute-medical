import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import {
  getFacilities,
  createFacility,
  updateFacility,
  deleteFacility,
} from '../controllers/facilities.controller';

const router = Router();

router.get('/', authenticate, getFacilities);
router.post('/', authenticate, authorize('admin'), createFacility);
router.put('/:id', authenticate, authorize('admin'), updateFacility);
router.delete('/:id', authenticate, authorize('admin'), deleteFacility);

export default router;
