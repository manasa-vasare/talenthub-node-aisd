import { Router } from 'express';
import {
  applyForJob,
  getApplication,
  getApplicationLogs,
  updateStatus,
} from '../controllers/applicationController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.post('/apply', requireRole(['student']), applyForJob);
router.get('/:id', getApplication);
router.get('/:id/logs', getApplicationLogs);
router.patch('/:id/status', requireRole(['company', 'coordinator']), updateStatus);

export default router;

