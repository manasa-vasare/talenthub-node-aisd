import { Router } from 'express';
import multer from 'multer';
import {
  issueOffer,
  acceptOffer,
  downloadOfferLetter,
} from '../controllers/offerController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});

const router = Router();

router.use(authenticateToken);

router.post('/issue', requireRole(['company', 'coordinator']), upload.single('offer_letter'), issueOffer);
router.post('/:applicationId/accept', requireRole(['student']), acceptOffer);
router.get('/document/:key', downloadOfferLetter);

export default router;

