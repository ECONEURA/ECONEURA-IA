import { Router } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service.js';
import { authenticateJWT, AuthRequest } from '../mw/auth.js';
import { asyncHandler } from '../mw/problemJson.js';
import { 
  LoginRequestSchema, 
  RefreshTokenRequestSchema, 
  LogoutRequestSchema 
} from '@econeura/shared';

const router = Router();

/**
 * POST /api/v1/auth/login
 * User login
 */
router.post('/login', asyncHandler(async (req, res) => {
  // Validate request body
  const data = LoginRequestSchema.parse(req.body);
  
  // Get client info
  const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
  const userAgent = req.get('user-agent');
  
  // Perform login
  const result = await authService.login(data, ipAddress, userAgent);
  
  res.json(result);
}));

/**
 * POST /api/v1/auth/refresh
 * Refresh access token
 */
router.post('/refresh', asyncHandler(async (req, res) => {
  // Validate request body
  const data = RefreshTokenRequestSchema.parse(req.body);
  
  // Refresh token
  const result = await authService.refreshAccessToken(data);
  
  res.json(result);
}));

/**
 * POST /api/v1/auth/logout
 * Logout user
 */
router.post('/logout', authenticateJWT, asyncHandler(async (req: AuthRequest, res) => {
  // Validate request body
  const data = req.body ? LogoutRequestSchema.parse(req.body) : {};
  
  // Perform logout
  await authService.logout(
    req.user!.id,
    req.user!.sessionId,
    data.refreshToken,
    data.allDevices
  );
  
  res.status(204).send();
}));

/**
 * GET /api/v1/auth/me
 * Get current user info
 */
router.get('/me', authenticateJWT, asyncHandler(async (req: AuthRequest, res) => {
  const result = await authService.getCurrentUser(req.user!.id, req.user!.orgId);
  
  // Mark current session
  result.sessions = result.sessions.map(s => ({
    ...s,
    isCurrent: s.id === req.user!.sessionId,
  }));
  
  res.json(result);
}));

/**
 * GET /api/v1/auth/sessions
 * Get user sessions
 */
router.get('/sessions', authenticateJWT, asyncHandler(async (req: AuthRequest, res) => {
  const result = await authService.getUserSessions(
    req.user!.id,
    req.user!.orgId,
    req.user!.sessionId
  );
  
  res.json(result);
}));

/**
 * DELETE /api/v1/auth/sessions/:id
 * Revoke a session
 */
router.delete('/sessions/:id', authenticateJWT, asyncHandler(async (req: AuthRequest, res) => {
  const sessionId = z.string().uuid().parse(req.params.id);
  
  await authService.revokeSession(sessionId, req.user!.id);
  
  res.status(204).send();
}));

/**
 * POST /api/v1/auth/verify
 * Verify if a token is valid (useful for frontend)
 */
router.post('/verify', authenticateJWT, asyncHandler(async (req: AuthRequest, res) => {
  // If we reach here, the token is valid
  res.json({
    valid: true,
    userId: req.user!.id,
    orgId: req.user!.orgId,
    sessionId: req.user!.sessionId,
  });
}));

/**
 * POST /api/v1/auth/change-organization
 * Switch to a different organization (for users in multiple orgs)
 */
router.post('/change-organization', authenticateJWT, asyncHandler(async (req: AuthRequest, res) => {
  const schema = z.object({
    organizationSlug: z.string().min(3).max(50),
  });
  
  const { organizationSlug } = schema.parse(req.body);
  
  // Get user's current session info
  const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
  const userAgent = req.get('user-agent');
  
  // Revoke current session
  await authService.logout(req.user!.id, req.user!.sessionId);
  
  // Create new session for different org
  // First get user email
  const currentUser = await authService.getCurrentUser(req.user!.id, req.user!.orgId);
  
  // Re-login with different org (we don't have password, so this is a simplified version)
  // In production, you might want to handle this differently
  const result = await authService.login(
    {
      email: currentUser.user.email,
      password: '', // This would need special handling
      organizationSlug,
    },
    ipAddress,
    userAgent
  );
  
  res.json(result);
}));

export default router;