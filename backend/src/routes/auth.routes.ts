import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.middleware.ts';
import { register, login, refreshToken } from '../controllers/auth.controller.ts';
import { authenticate, authorize } from '../middleware/auth.middleware.ts';

const router = Router();

// PUBLIC ROUTE: Only residents and medical staff can self-register
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').trim().notEmpty().withMessage('Name is required'),
    // Note: Removed 'admin' and 'facility_manager' options for public access
    body('role').optional().isIn(['medical_staff', 'resident']).withMessage('Invalid role for public registration'),
  ],
  validate,
  register
);

// ADMIN ROUTE: Admin can create all roles except 'admin'
router.post(
  '/admin/register',
  authenticate,
  authorize('admin'),
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').trim().notEmpty().withMessage('Name is required'),
    // Note: Removed 'admin' option for creation to prevent multiple super-admins
    body('role').isIn(['medical_staff', 'facility_manager', 'resident']).withMessage('A valid staff/resident role is required for admin creation'),
  ],
  validate,
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);

router.post(
  '/refresh',
  [body('refreshToken').notEmpty().withMessage('Refresh token is required')],
  validate,
  refreshToken
);

export default router;
