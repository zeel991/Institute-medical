import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { createLog, getLogs } from '../controllers/entryExit.controller';

const router = Router();

router.post('/', authenticate, createLog);
router.get('/', authenticate, getLogs);

export default router;
