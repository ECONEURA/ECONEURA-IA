import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';
import { logger } from '@econeura/shared/logging';
import { ApiError } from './problemJson.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    orgId: string;
    sessionId: string;
  };
}

/**
 * Middleware to authenticate JWT tokens
 */
export const authenticateJWT = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new ApiError(401, 'missing_authorization', 'Missing authorization', 'Authorization header is required');
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'invalid_authorization', 'Invalid authorization', 'Authorization must be a Bearer token');
    }

    const token = authHeader.substring(7);

    try {
      const payload = await authService.verifyAccessToken(token);
      
      // Attach user info to request
      req.user = {
        id: payload.userId,
        orgId: payload.orgId,
        sessionId: payload.sessionId,
      };

      // Store in res.locals for logging
      res.locals.userId = payload.userId;
      res.locals.orgId = payload.orgId;
      res.locals.sessionId = payload.sessionId;

      // Log authentication
      logger.debug('User authenticated', {
        userId: req.user.id,
        orgId: req.user.orgId,
        sessionId: req.user.sessionId,
        path: req.path,
        method: req.method,
      });

      next();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(401, 'invalid_token', 'Invalid token', 'Token verification failed');
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to require specific permissions
 */
export const requirePermission = (permission: string, scope: 'organization' | 'own' = 'organization') => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new ApiError(401, 'not_authenticated', 'Not authenticated', 'Authentication required');
      }

      const hasPermission = await authService.checkPermission(
        req.user.id,
        req.user.orgId,
        permission,
        scope
      );

      if (!hasPermission) {
        // Log permission denial
        logger.warn('Permission denied', {
          userId: req.user.id,
          orgId: req.user.orgId,
          permission,
          scope,
          path: req.path,
          method: req.method,
        });

        throw new ApiError(
          403,
          'insufficient_permissions',
          'Insufficient permissions',
          `Permission '${permission}' is required for this action`
        );
      }

      // Log permission grant
      logger.debug('Permission granted', {
        userId: req.user.id,
        orgId: req.user.orgId,
        permission,
        scope,
        path: req.path,
        method: req.method,
      });

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware for optional authentication
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No auth provided, continue without user
    return next();
  }

  // Try to authenticate but don't fail if it doesn't work
  const token = authHeader.substring(7);

  try {
    const payload = await authService.verifyAccessToken(token);
    
    req.user = {
      id: payload.userId,
      orgId: payload.orgId,
      sessionId: payload.sessionId,
    };

    // Store in res.locals for logging
    res.locals.userId = payload.userId;
    res.locals.orgId = payload.orgId;
    res.locals.sessionId = payload.sessionId;

    logger.debug('Optional auth successful', {
      userId: req.user.id,
      orgId: req.user.orgId,
      path: req.path,
    });
  } catch {
    // Invalid token, continue without user
    logger.debug('Optional auth failed, continuing without user', {
      path: req.path,
    });
  }

  next();
};

// Legacy export for compatibility
export const requireAuth = authenticateJWT;

// Typed request interface for other middlewares
export type AuthenticatedRequest = AuthRequest;