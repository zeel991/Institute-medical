import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware.ts';
import {
  getOrCreateMedicalRecord,
  updateMedicalRecord,
  getMedicalLogs,
  createMedicalLog,
} from '../controllers/medical.controller.ts';

const router = Router();

// BASE ACCESS: Restricted to Medical Staff and Admin
router.use(authenticate, authorize('admin', 'medical_staff'));

// Medical Record Management (Baseline data: allergies, blood type)
router.get('/:userId/record', getOrCreateMedicalRecord);
router.put('/:userId/record', updateMedicalRecord);

// Medical Log/History Management
router.get('/:userId/logs', getMedicalLogs);
router.post('/:userId/logs', createMedicalLog);

export default router;
