import { Router } from 'express';
import { authController } from '../controllers/auth';

const router = Router();

// POST /auth/login - User login
router.post('/login', authController.login);

// POST /auth/refresh - Refresh token
router.post('/refresh', authController.refreshToken);

// POST /auth/logout - User logout
router.post('/logout', authController.logout);

// GET /auth/me - Get current user
router.get('/me', authController.getCurrentUser);

export default router;
