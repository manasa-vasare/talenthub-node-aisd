import { Router } from 'express';
import {
  getProfile,
  updateConsent,
  eraseProfile,
  getMyApplications,
  getMyInterviews,
  getMyOffers,
} from '../controllers/studentController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);
router.use(requireRole(['student']));

router.get('/profile', getProfile);
router.put('/consent', updateConsent);
router.post('/erase', eraseProfile);
router.get('/applications', getMyApplications);
router.get('/interviews', getMyInterviews);
router.get('/offers', getMyOffers);

export default router;

