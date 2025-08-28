import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as authController from '../controllers/auth.controller';

const router = Router();

/**
 * @route POST /auth/register
 * @desc Register new user and organization
 * @access Public
 */
router.post('/register', authController.register);

/**
 * @route POST /auth/login
 * @desc Authenticate user and get tokens
 * @access Public
 */
router.post('/login', authController.login);

/**
 * @route POST /auth/refresh
 * @desc Refresh access token using refresh token
 * @access Public
 */
router.post('/refresh', authController.refreshToken);

/**
 * @route GET /auth/profile
 * @desc Get current user profile
 * @access Private
 */
router.get('/profile', authenticate, authController.getProfile);

/**
 * @route POST /auth/logout
 * @desc Logout user
 * @access Private
 */
router.post('/logout', authenticate, authController.logout);

export default router;