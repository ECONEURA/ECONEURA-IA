import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { structuredLogger } from '../lib/structured-logger.js';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    orgId: string;
    role: string;
    permissions: string[];
  };
}

interface JWTPayload {
  userId: string;
  email: string;
  orgId: string;
  role: string;
  permissions: string[];
  iat: number;
  exp: number;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header',
        timestamp: new Date().toISOString()
      });
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET || 'dev-secret-change-in-production';
    
    const decoded = jwt.verify(token, secret) as JWTPayload;
    
    // Add user info to request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      orgId: decoded.orgId,
      role: decoded.role,
      permissions: decoded.permissions
    };
    
    // Add org ID to headers for RLS
    req.headers['x-org-id'] = decoded.orgId;
    req.headers['x-user-id'] = decoded.userId;
    
    structuredLogger.debug('User authenticated', {
      userId: decoded.userId,
      email: decoded.email,
      orgId: decoded.orgId,
      role: decoded.role
    });
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token',
        timestamp: new Date().toISOString()
      });
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token expired',
        timestamp: new Date().toISOString()
      });
    }
    
    structuredLogger.error('Authentication error', error as Error);
    
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Authentication failed',
      timestamp: new Date().toISOString()
    });
  }
}

export function requirePermission(permission: string) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
        timestamp: new Date().toISOString()
      });
    }
    
    const hasPermission = req.user.permissions.includes(permission) || 
                         req.user.permissions.includes('*:*') ||
                         req.user.role === 'admin';
    
    if (!hasPermission) {
      structuredLogger.warn('Permission denied', {
        userId: req.user.id,
        requiredPermission: permission,
        userPermissions: req.user.permissions,
        path: req.path
      });
      
      return res.status(403).json({
        error: 'Forbidden',
        message: `Permission '${permission}' required`,
        timestamp: new Date().toISOString()
      });
    }
    
    next();
  };
}

export function requireRole(role: string) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
        timestamp: new Date().toISOString()
      });
    }
    
    if (req.user.role !== role && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Role '${role}' required`,
        timestamp: new Date().toISOString()
      });
    }
    
    next();
  };
}

export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  const secret = process.env.JWT_SECRET || 'dev-secret-change-in-production';
  const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
  
  return jwt.sign(payload, secret, { expiresIn });
}

export function verifyToken(token: string): JWTPayload {
  const secret = process.env.JWT_SECRET || 'dev-secret-change-in-production';
  return jwt.verify(token, secret) as JWTPayload;
}
