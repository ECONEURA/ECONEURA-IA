import { Request, Response, NextFunction } from 'express';
import { structuredLogger } from '../lib/structured-logger.js';
import { authService } from '../lib/auth.service.js';
import { getDatabaseService } from '@econeura/db';
import { eq, and, gte } from 'drizzle-orm';
import { users, organizations, sessions } from '@econeura/db/schema';

// ============================================================================
// AUTHENTICATION & AUTHORIZATION MIDDLEWARE
// ============================================================================

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    organizationId: string;
    permissions: string[];
    sessionId: string;
  };
}

interface AuthConfig {
  enableApiKeys: boolean;
  enableSessions: boolean;
  enableMFA: boolean;
  requireEmailVerification: boolean;
  enableRateLimiting: boolean;
  maxConcurrentSessions: number;
}

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================

export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const startTime = Date.now();

  try {
    // Check for API key first
    const apiKey = req.headers['x-api-key'] as string;
    if (apiKey) {
      const apiKeyAuth = await authenticateApiKey(apiKey, req);
      if (apiKeyAuth) {
        req.user = apiKeyAuth;
        return next();
      }
    }

    // Check for Bearer token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'Bearer token or API key required',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const token = authHeader.substring(7);
    const payload = authService.verifyToken(token);

    if (!payload || payload.type !== 'access') {
      res.status(401).json({
        error: 'Invalid token',
        message: 'Invalid or expired access token',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Verify session is still active
    const db = getDatabaseService().getDatabase();
    const session = await db.select()
      .from(sessions)
      .where(and(
        eq(sessions.id, payload.sessionId),
        eq(sessions.isActive, true),
        gte(sessions.expiresAt, new Date())
      ))
      .limit(1);

    if (session.length === 0) {
      res.status(401).json({
        error: 'Session expired',
        message: 'Session has expired or been invalidated',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Get user details
    const userResult = await db.select()
      .from(users)
      .innerJoin(organizations, eq(users.organizationId, organizations.id))
      .where(and(
        eq(users.id, payload.userId),
        eq(users.isActive, true)
      ))
      .limit(1);

    if (userResult.length === 0) {
      res.status(401).json({
        error: 'User not found',
        message: 'User account not found or inactive',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const user = userResult[0].users;
    const organization = userResult[0].organizations;

    // Check if organization is active
    if (!organization.isActive) {
      res.status(403).json({
        error: 'Organization inactive',
        message: 'Organization account is inactive',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Set user context
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      permissions: payload.permissions,
      sessionId: payload.sessionId
    };

    const processingTime = Date.now() - startTime;

    structuredLogger.info('Authentication successful', {
      userId: user.id,
      email: user.email,
      organizationId: user.organizationId,
      role: user.role,
      sessionId: payload.sessionId,
      processingTime
    });

    next();

  } catch (error) {
    const processingTime = Date.now() - startTime;

    structuredLogger.error('Authentication failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTime,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(401).json({
      error: 'Authentication failed',
      message: 'An error occurred during authentication',
      timestamp: new Date().toISOString()
    });
  }
};

// ============================================================================
// API KEY AUTHENTICATION
// ============================================================================

async function authenticateApiKey(apiKey: string, req: Request): Promise<AuthenticatedRequest['user'] | null> {
  try {
    const authResult = await authService.validateApiKey(apiKey);
    if (!authResult) {
      return null;
    }

    const db = getDatabaseService().getDatabase();
    const userResult = await db.select()
      .from(users)
      .innerJoin(organizations, eq(users.organizationId, organizations.id))
      .where(and(
        eq(users.id, authResult.userId),
        eq(users.isActive, true)
      ))
      .limit(1);

    if (userResult.length === 0) {
      return null;
    }

    const user = userResult[0].users;
    const organization = userResult[0].organizations;

    if (!organization.isActive) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      permissions: authResult.permissions,
      sessionId: 'api-key'
    };

  } catch (error) {
    structuredLogger.error('API key authentication failed', error as Error);
    return null;
  }
}

// ============================================================================
// AUTHORIZATION MIDDLEWARE
// ============================================================================

export const requirePermission = (permission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'User must be authenticated',
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (!req.user.permissions.includes(permission)) {
      structuredLogger.warn('Permission denied', {
        userId: req.user.id,
        permission,
        userPermissions: req.user.permissions,
        endpoint: req.path,
        method: req.method
      });

      res.status(403).json({
        error: 'Permission denied',
        message: `Required permission: ${permission}`,
        timestamp: new Date().toISOString()
      });
      return;
    }

    next();
  };
};

export const requireRole = (roles: string | string[]) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'User must be authenticated',
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      structuredLogger.warn('Role access denied', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
        endpoint: req.path,
        method: req.method
      });

      res.status(403).json({
        error: 'Access denied',
        message: `Required role: ${allowedRoles.join(' or ')}`,
        timestamp: new Date().toISOString()
      });
      return;
    }

    next();
  };
};

export const requireOrganization = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      error: 'Authentication required',
      message: 'User must be authenticated',
      timestamp: new Date().toISOString()
    });
    return;
  }

  const requestedOrgId = req.headers['x-organization-id'] as string || req.params.organizationId;

  if (requestedOrgId && requestedOrgId !== req.user.organizationId) {
    structuredLogger.warn('Organization access denied', {
      userId: req.user.id,
      userOrganizationId: req.user.organizationId,
      requestedOrganizationId: requestedOrgId,
      endpoint: req.path,
      method: req.method
    });

    res.status(403).json({
      error: 'Organization access denied',
      message: 'Access denied to this organization',
      timestamp: new Date().toISOString()
    });
    return;
  }

  next();
};

// ============================================================================
// OPTIONAL AUTHENTICATION
// ============================================================================

export const optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Check for API key first
    const apiKey = req.headers['x-api-key'] as string;
    if (apiKey) {
      const apiKeyAuth = await authenticateApiKey(apiKey, req);
      if (apiKeyAuth) {
        req.user = apiKeyAuth;
      }
    }

    // Check for Bearer token
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = authService.verifyToken(token);

      if (payload && payload.type === 'access') {
        const db = getDatabaseService().getDatabase();
        const session = await db.select()
          .from(sessions)
          .where(and(
            eq(sessions.id, payload.sessionId),
            eq(sessions.isActive, true),
            gte(sessions.expiresAt, new Date())
          ))
          .limit(1);

        if (session.length > 0) {
          const userResult = await db.select()
            .from(users)
            .innerJoin(organizations, eq(users.organizationId, organizations.id))
            .where(and(
              eq(users.id, payload.userId),
              eq(users.isActive, true)
            ))
            .limit(1);

          if (userResult.length > 0) {
            const user = userResult[0].users;
            req.user = {
              id: user.id,
              email: user.email,
              role: user.role,
              organizationId: user.organizationId,
              permissions: payload.permissions,
              sessionId: payload.sessionId
            };
          }
        }
      }
    }

    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

export const validateSession = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user || !req.user.sessionId) {
    res.status(401).json({
      error: 'Session required',
      message: 'Valid session required for this operation',
      timestamp: new Date().toISOString()
    });
    return;
  }

  try {
    const db = getDatabaseService().getDatabase();
    const session = await db.select()
      .from(sessions)
      .where(and(
        eq(sessions.id, req.user.sessionId),
        eq(sessions.isActive, true),
        gte(sessions.expiresAt, new Date())
      ))
      .limit(1);

    if (session.length === 0) {
      res.status(401).json({
        error: 'Session expired',
        message: 'Session has expired or been invalidated',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Update last activity
    await db.update(sessions)
      .set({
        lastActivityAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(sessions.id, req.user.sessionId));

    next();
  } catch (error) {
    structuredLogger.error('Session validation failed', error as Error);
    res.status(500).json({
      error: 'Session validation failed',
      message: 'An error occurred while validating the session',
      timestamp: new Date().toISOString()
    });
  }
};

// ============================================================================
// RATE LIMITING BY USER
// ============================================================================

export const userRateLimit = (maxRequests: number, windowMs: number = 15 * 60 * 1000) => {
  const userRequests = new Map<string, { count: number; resetTime: number }>();

  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next();
    }

    const now = Date.now();
    const key = `${req.user.id}:${req.user.organizationId}`;
    const userLimit = userRequests.get(key);

    if (!userLimit || userLimit.resetTime < now) {
      userRequests.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }

    if (userLimit.count >= maxRequests) {
      structuredLogger.warn('User rate limit exceeded', {
        userId: req.user.id,
        organizationId: req.user.organizationId,
        count: userLimit.count,
        maxRequests,
        windowMs
      });

      res.status(429).json({
        error: 'Rate limit exceeded',
        message: `User rate limit of ${maxRequests} requests per ${Math.ceil(windowMs / 1000 / 60)} minutes exceeded`,
        retryAfter: Math.ceil((userLimit.resetTime - now) / 1000),
        timestamp: new Date().toISOString()
      });
      return;
    }

    userLimit.count++;
    next();
  };
};

// ============================================================================
// MIDDLEWARE COMBINATIONS
// ============================================================================

export const requireAuth = [authenticateToken, requireOrganization];
export const requireAdmin = [authenticateToken, requireRole('admin'), requireOrganization];
export const requireManager = [authenticateToken, requireRole(['admin', 'manager']), requireOrganization];
export const requireEditor = [authenticateToken, requireRole(['admin', 'manager', 'editor']), requireOrganization];

export const requirePermissionAndAuth = (permission: string) => [
  authenticateToken,
  requirePermission(permission),
  requireOrganization
];

export const requireRoleAndAuth = (roles: string | string[]) => [
  authenticateToken,
  requireRole(roles),
  requireOrganization
];
