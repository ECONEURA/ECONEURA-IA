import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../services/prisma';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    organizationId: string;
    role: string;
  };
  organization?: {
    id: string;
    name: string;
    slug: string;
  };
}

/**
 * JWT Authentication middleware
 * Verifies JWT token and attaches user information to request
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ 
        error: 'Authorization header missing or invalid',
        code: 'AUTH_MISSING_TOKEN'
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error('JWT_SECRET environment variable not configured');
      res.status(500).json({ 
        error: 'Server configuration error',
        code: 'AUTH_CONFIG_ERROR'
      });
      return;
    }

    // Verify JWT token
    const decoded = jwt.verify(token, jwtSecret) as any;
    
    // Fetch user from database with organization info
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        }
      }
    });

    if (!user || !user.isActive) {
      res.status(401).json({ 
        error: 'User not found or inactive',
        code: 'AUTH_USER_INVALID'
      });
      return;
    }

    // Attach user info to request
    req.user = {
      id: user.id,
      email: user.email,
      organizationId: user.organizationId,
      role: user.role,
    };

    req.organization = user.organization;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ 
        error: 'Invalid token',
        code: 'AUTH_TOKEN_INVALID'
      });
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ 
        error: 'Token expired',
        code: 'AUTH_TOKEN_EXPIRED'
      });
      return;
    }

    res.status(500).json({ 
      error: 'Authentication failed',
      code: 'AUTH_INTERNAL_ERROR'
    });
  }
};

/**
 * Role-based authorization middleware
 * Checks if user has required role
 */
export const authorize = (requiredRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
      return;
    }

    if (!requiredRoles.includes(req.user.role)) {
      res.status(403).json({ 
        error: 'Insufficient permissions',
        code: 'AUTH_INSUFFICIENT_PERMISSIONS',
        required: requiredRoles,
        current: req.user.role
      });
      return;
    }

    next();
  };
};

/**
 * Organization scope middleware
 * Ensures user can only access resources from their organization
 */
export const requireOrganizationScope = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || !req.organization) {
    res.status(401).json({ 
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
    return;
  }

  // Add organization filter to query params for downstream controllers
  req.query.organizationId = req.user.organizationId;
  
  next();
};