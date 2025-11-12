import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware.ts';
import { getUsers } from '../controllers/users.controller.ts';

const router = Router();

router.get('/', authenticate, authorize('admin', 'facility_manager', 'medical_staff'), getUsers);

export default router;
