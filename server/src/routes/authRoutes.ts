import { Router } from 'express';
import { login, registerStudent, registerCompany, getMe } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/login', login);
router.post('/register/student', registerStudent);
router.post('/register/company', registerCompany);
router.get('/me', authenticateToken, getMe);

export default router;

