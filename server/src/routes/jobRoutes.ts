import { Router } from 'express';
import { listJobs, getJob, createJob, toggleJobStatus } from '../controllers/jobController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// Public / Authenticated listings
router.get('/', (req, res, next) => {
  // Optional auth for job listing: if auth header present, decode user, else proceed
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    authenticateToken(req, res, next);
  } else {
    next();
  }
}, listJobs);

router.get('/:id', (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    authenticateToken(req, res, next);
  } else {
    next();
  }
}, getJob);

// Company & Coordinator protected routes
router.post('/', authenticateToken, requireRole(['company', 'coordinator']), createJob);
router.patch('/:id/status', authenticateToken, requireRole(['company', 'coordinator']), toggleJobStatus);

export default router;

