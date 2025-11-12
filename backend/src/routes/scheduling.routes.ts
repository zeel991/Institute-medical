import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.middleware.ts';
import { authenticate, authorize } from '../middleware/auth.middleware.ts';
import {
  createAppointment,
  getAppointments,
  updateAppointment,
} from '../controllers/scheduling.controller.ts';

const router = Router();

// Student (Resident, Staff, Admin) can create an appointment
router.post(
  '/',
  authenticate,
  [
    body('scheduledTime').isISO8601().withMessage('Valid scheduled time is required'),
    body('reason').notEmpty().withMessage('Reason for appointment is required'),
  ],
  validate,
  createAppointment
);

// Get all appointments (role filtered)
router.get('/', authenticate, getAppointments);

// Manage appointment (Medical Staff/Admin only)
router.put('/:id', authenticate, authorize('admin', 'medical_staff'), updateAppointment);

export default router;
