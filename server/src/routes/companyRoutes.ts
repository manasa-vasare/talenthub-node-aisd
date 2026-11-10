import { Router } from 'express';
import {
  getMyJobs,
  getCompanyApplicants,
  getJobApplicants,
} from '../controllers/companyController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);
router.use(requireRole(['company', 'coordinator']));

router.get('/my-jobs', getMyJobs);
router.get('/applicants', getCompanyApplicants);
router.get('/job/:jobId/applicants', getJobApplicants);

export default router;

