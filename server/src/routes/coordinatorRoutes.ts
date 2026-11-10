import { Router } from 'express';
import {
  bulkShortlist,
  getStats,
  getAuditLogs,
  getAllStudents,
} from '../controllers/coordinatorController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);
router.use(requireRole(['coordinator']));

router.post('/bulk-shortlist/:jobId', bulkShortlist);
router.get('/stats', getStats);
router.get('/audit-logs', getAuditLogs);
router.get('/students', getAllStudents);

export default router;

