import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.middleware.ts';
import { authenticate, authorize } from '../middleware/auth.middleware.ts';
import {
  getMedicines,
  createMedicine,
  updateMedicine,
  deleteMedicine,
} from '../controllers/medicine.controller.ts';

const router = Router();

// GET: All users can check inventory (Availability Checker)
router.get('/', authenticate, getMedicines);

// Management Routes (Admin/Medical Staff only)
router.post(
  '/',
  authenticate,
  authorize('admin', 'medical_staff'),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('stockLevel').isInt({ min: 0 }).withMessage('Stock level must be a non-negative integer'),
    body('unit').trim().notEmpty().withMessage('Unit is required'),
  ],
  validate,
  createMedicine
);

router.put('/:id', authenticate, authorize('admin', 'medical_staff'), updateMedicine);
router.delete('/:id', authenticate, authorize('admin'), deleteMedicine); // Admin only delete

export default router;
