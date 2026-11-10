import { Router } from 'express';
import {
  scheduleRound,
  updateResult,
  getByApplication,
} from '../controllers/interviewController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/application/:applicationId', getByApplication);
router.post('/schedule', requireRole(['company', 'coordinator']), scheduleRound);
router.patch('/:id/result', requireRole(['company', 'coordinator']), updateResult);

export default router;

