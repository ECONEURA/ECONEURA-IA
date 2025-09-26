import { Router } from 'express';
import { z } from 'zod';

import { structuredLogger } from '../lib/structured-logger.js';
import { authService } from '../lib/auth.service.js';
import { rbacService } from '../lib/rbac.service.js';
import { authenticateToken } from '../middleware/auth.js';
import { getDatabaseService } from '../lib/database.service.js';
const router = Router();
const loginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
    organizationId: z.string().uuid().optional(),
    rememberMe: z.boolean().default(false),
    mfaToken: z.string().optional()
});
const refreshTokenSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh token is required')
});
const logoutSchema = z.object({
    sessionId: z.string().optional()
});
const createApiKeySchema = z.object({
    permissions: z.array(z.string()).min(1, 'At least one permission is required'),
    expiresIn: z.number().min(1).max(365).default(90)
});
const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Password confirmation is required')
}).refine(data => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
});
router.post('/login', async (req, res) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] || `req_${Date.now()}`;
    try {
        const validation = loginSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({
                error: 'Validation error',
                message: validation.error.errors.map(e => e.message).join(', '),
                requestId,
                timestamp: new Date().toISOString()
            });
            return;
        }
        const loginData = validation.data;
        const loginResult = await authService.login(loginData);
        const processingTime = Date.now() - startTime;
        structuredLogger.info('Login successful', {
            requestId,
            email: loginData.email,
            organizationId: loginResult.user.organizationId,
            userId: loginResult.user.id,
            processingTime
        });
        res.json({
            success: true,
            data: loginResult,
            requestId,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        const processingTime = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        structuredLogger.error('Login failed', {
            error: errorMessage,
            requestId,
            email: req.body.email,
            processingTime
        });
        res.status(401).json({
            error: 'Login failed',
            message: errorMessage,
            requestId,
            timestamp: new Date().toISOString()
        });
    }
});
router.post('/refresh', async (req, res) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] || `req_${Date.now()}`;
    try {
        const validation = refreshTokenSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({
                error: 'Validation error',
                message: validation.error.errors.map(e => e.message).join(', '),
                requestId,
                timestamp: new Date().toISOString()
            });
            return;
        }
        const { refreshToken } = validation.data;
        const tokenResult = await authService.refreshToken(refreshToken);
        const processingTime = Date.now() - startTime;
        structuredLogger.info('Token refreshed', {
            requestId,
            processingTime
        });
        res.json({
            success: true,
            data: tokenResult,
            requestId,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        const processingTime = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        structuredLogger.error('Token refresh failed', {
            error: errorMessage,
            requestId,
            processingTime
        });
        res.status(401).json({
            error: 'Token refresh failed',
            message: errorMessage,
            requestId,
            timestamp: new Date().toISOString()
        });
    }
});
router.post('/logout', authenticateToken, async (req, res) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] || `req_${Date.now()}`;
    try {
        const validation = logoutSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({
                error: 'Validation error',
                message: validation.error.errors.map(e => e.message).join(', '),
                requestId,
                timestamp: new Date().toISOString()
            });
            return;
        }
        const { sessionId } = validation.data;
        const userSessionId = req.user?.sessionId || sessionId;
        if (!userSessionId) {
            res.status(400).json({
                error: 'Session ID required',
                message: 'Session ID is required for logout',
                requestId,
                timestamp: new Date().toISOString()
            });
            return;
        }
        await authService.logout(userSessionId);
        const processingTime = Date.now() - startTime;
        structuredLogger.info('Logout successful', {
            requestId,
            userId: req.user?.id,
            sessionId: userSessionId,
            processingTime
        });
        res.json({
            success: true,
            message: 'Logged out successfully',
            requestId,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        const processingTime = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        structuredLogger.error('Logout failed', {
            error: errorMessage,
            requestId,
            userId: req.user?.id,
            processingTime
        });
        res.status(500).json({
            error: 'Logout failed',
            message: errorMessage,
            requestId,
            timestamp: new Date().toISOString()
        });
    }
});
router.post('/logout-all', authenticateToken, async (req, res) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] || `req_${Date.now()}`;
    try {
        if (!req.user?.id) {
            res.status(400).json({
                error: 'User ID required',
                message: 'User ID is required for logout all',
                requestId,
                timestamp: new Date().toISOString()
            });
            return;
        }
        await authService.logoutAllSessions(req.user.id);
        const processingTime = Date.now() - startTime;
        structuredLogger.info('Logout all successful', {
            requestId,
            userId: req.user.id,
            processingTime
        });
        res.json({
            success: true,
            message: 'Logged out from all sessions successfully',
            requestId,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        const processingTime = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        structuredLogger.error('Logout all failed', {
            error: errorMessage,
            requestId,
            userId: req.user?.id,
            processingTime
        });
        res.status(500).json({
            error: 'Logout all failed',
            message: errorMessage,
            requestId,
            timestamp: new Date().toISOString()
        });
    }
});
router.post('/api-keys', authenticateToken, async (req, res) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] || `req_${Date.now()}`;
    try {
        if (!req.user?.id || !req.user?.organizationId) {
            res.status(400).json({
                error: 'User context required',
                message: 'User ID and organization ID are required',
                requestId,
                timestamp: new Date().toISOString()
            });
            return;
        }
        const validation = createApiKeySchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({
                error: 'Validation error',
                message: validation.error.errors.map(e => e.message).join(', '),
                requestId,
                timestamp: new Date().toISOString()
            });
            return;
        }
        const { permissions } = validation.data;
        const apiKeyResult = await authService.createApiKey(req.user.id, req.user.organizationId, permissions);
        const processingTime = Date.now() - startTime;
        structuredLogger.info('API key created', {
            requestId,
            userId: req.user.id,
            organizationId: req.user.organizationId,
            permissions,
            processingTime
        });
        res.json({
            success: true,
            data: apiKeyResult,
            requestId,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        const processingTime = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        structuredLogger.error('API key creation failed', {
            error: errorMessage,
            requestId,
            userId: req.user?.id,
            processingTime
        });
        res.status(500).json({
            error: 'API key creation failed',
            message: errorMessage,
            requestId,
            timestamp: new Date().toISOString()
        });
    }
});
router.get('/me', authenticateToken, async (req, res) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] || `req_${Date.now()}`;
    try {
        if (!req.user) {
            res.status(401).json({
                error: 'Authentication required',
                message: 'User must be authenticated',
                requestId,
                timestamp: new Date().toISOString()
            });
            return;
        }
        const userRoles = await rbacService.getUserRoles(req.user.id, req.user.organizationId);
        const userPermissions = await rbacService.getUserPermissions(req.user.id, req.user.organizationId);
        const processingTime = Date.now() - startTime;
        res.json({
            success: true,
            data: {
                user: req.user,
                roles: userRoles,
                permissions: userPermissions
            },
            requestId,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        const processingTime = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        structuredLogger.error('Get user info failed', {
            error: errorMessage,
            requestId,
            userId: req.user?.id,
            processingTime
        });
        res.status(500).json({
            error: 'Get user info failed',
            message: errorMessage,
            requestId,
            timestamp: new Date().toISOString()
        });
    }
});
router.get('/permissions', authenticateToken, async (req, res) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] || `req_${Date.now()}`;
    try {
        if (!req.user?.id || !req.user?.organizationId) {
            res.status(400).json({
                error: 'User context required',
                message: 'User ID and organization ID are required',
                requestId,
                timestamp: new Date().toISOString()
            });
            return;
        }
        const permissions = await rbacService.getUserPermissions(req.user.id, req.user.organizationId);
        const processingTime = Date.now() - startTime;
        res.json({
            success: true,
            data: {
                permissions: permissions.map(p => ({
                    id: p.id,
                    name: p.name,
                    resource: p.resource,
                    action: p.action,
                    description: p.description,
                    category: p.category
                }))
            },
            requestId,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        const processingTime = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        structuredLogger.error('Get permissions failed', {
            error: errorMessage,
            requestId,
            userId: req.user?.id,
            processingTime
        });
        res.status(500).json({
            error: 'Get permissions failed',
            message: errorMessage,
            requestId,
            timestamp: new Date().toISOString()
        });
    }
});
router.post('/change-password', authenticateToken, async (req, res) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] || `req_${Date.now()}`;
    try {
        if (!req.user?.id) {
            res.status(400).json({
                error: 'User context required',
                message: 'User ID is required',
                requestId,
                timestamp: new Date().toISOString()
            });
            return;
        }
        const validation = changePasswordSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({
                error: 'Validation error',
                message: validation.error.errors.map(e => e.message).join(', '),
                requestId,
                timestamp: new Date().toISOString()
            });
            return;
        }
        const { currentPassword, newPassword } = validation.data;
        try {
            const prisma = getDatabaseService();
            const user = await prisma.user.findUnique({
                where: { id: req.user.id }
            });
            if (!user) {
                res.status(404).json({
                    success: false,
                    error: {
                        code: 'USER_NOT_FOUND',
                        message: 'User not found'
                    }
                });
                return;
            }
            const bcrypt = await import('bcrypt');
            const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
            if (!isCurrentPasswordValid) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_CURRENT_PASSWORD',
                        message: 'Current password is incorrect'
                    }
                });
                return;
            }
            const saltRounds = 12;
            const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
            await prisma.user.update({
                where: { id: req.user.id },
                data: {
                    passwordHash: newPasswordHash,
                    passwordChangedAt: new Date()
                }
            });
        }
        catch (error) {
            structuredLogger.error('Password change failed', {
                userId: req.user.id,
                error: error.message
            });
            res.status(500).json({
                success: false,
                error: {
                    code: 'PASSWORD_CHANGE_FAILED',
                    message: 'Failed to change password'
                }
            });
            return;
        }
        const processingTime = Date.now() - startTime;
        structuredLogger.info('Password change requested', {
            requestId,
            userId: req.user.id,
            processingTime
        });
        res.json({
            success: true,
            message: 'Password change functionality not yet implemented',
            requestId,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        const processingTime = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        structuredLogger.error('Password change failed', {
            error: errorMessage,
            requestId,
            userId: req.user?.id,
            processingTime
        });
        res.status(500).json({
            error: 'Password change failed',
            message: errorMessage,
            requestId,
            timestamp: new Date().toISOString()
        });
    }
});
router.get('/health', optionalAuth, async (req, res) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] || `req_${Date.now()}`;
    try {
        const processingTime = Date.now() - startTime;
        res.json({
            success: true,
            data: {
                status: 'healthy',
                service: 'auth',
                version: '1.0.0',
                timestamp: new Date().toISOString(),
                processingTime,
                authenticated: !!req.user
            },
            requestId,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        const processingTime = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        structuredLogger.error('Auth health check failed', {
            error: errorMessage,
            requestId,
            processingTime
        });
        res.status(500).json({
            error: 'Auth health check failed',
            message: errorMessage,
            requestId,
            timestamp: new Date().toISOString()
        });
    }
});
export { router as authRouter };
//# sourceMappingURL=auth.js.map