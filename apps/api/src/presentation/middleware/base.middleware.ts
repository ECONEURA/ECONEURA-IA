import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';

// ============================================================================
// BASE MIDDLEWARE - Middleware base para todas las rutas
// ============================================================================

export interface ValidationSchema {
  body?: z.ZodSchema;
  params?: z.ZodSchema;
  query?: z.ZodSchema;
  headers?: z.ZodSchema;
}

// ========================================================================
// MIDDLEWARE DE VALIDACIÓN BASE
// ========================================================================

export const validateRequest = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validar body
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }

      // Validar params
      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }

      // Validar query
      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }

      // Validar headers
      if (schema.headers) {
        req.headers = schema.headers.parse(req.headers);
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));

        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: validationErrors
          }
        });
        return;
      }

      next(error);
    }
  };
};

// ========================================================================
// MIDDLEWARE DE AUTENTICACIÓN BASE
// ========================================================================

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication token is required'
      }
    });
    return;
  }

  // JWT validation implementation
  const validateJWT = (token: string) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as any;
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  };

  // Extract and validate JWT from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ 
      success: false,
      error: {
        code: 'INVALID_AUTH_HEADER',
        message: 'Missing or invalid authorization header'
      }
    });
    return;
  }

  try {
    const token = authHeader.substring(7);
    const decoded = validateJWT(token);
    
    req.user = {
      id: decoded.userId || decoded.sub,
      email: decoded.email,
      organizationId: decoded.organizationId || req.headers['x-organization-id'] as string || 'org-123',
      role: decoded.role || 'user',
      permissions: decoded.permissions || []
    };
  } catch (error) {
    res.status(401).json({ 
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token'
      }
    });
    return;
  }

  next();
};

// ========================================================================
// MIDDLEWARE DE AUTORIZACIÓN BASE
// ========================================================================

export const authorize = (requiredPermissions: string[] = []) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        }
      });
      return;
    }

    // Permission verification implementation
    const verifyPermissions = (user: any, permissions: string[]) => {
      if (!permissions || permissions.length === 0) return true; // No permission required
      if (user.role === 'admin' || user.role === 'superadmin') return true; // Admin access
      return permissions.some(perm => user.permissions?.includes(perm));
    };

    // Check if user has required permissions
    if (requiredPermissions.length > 0 && !verifyPermissions(req.user, requiredPermissions)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: `Required permissions: ${requiredPermissions.join(', ')}`,
          required: requiredPermissions,
          userPermissions: req.user?.permissions || []
        }
      });
      return;
    }

    next();
  };
};

// ========================================================================
// MIDDLEWARE DE MANEJO DE ERRORES BASE
// ========================================================================

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', error);

  // Error de validación
  if (error.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message
      }
    });
    return;
  }

  // Error de recurso no encontrado
  if (error.name === 'NotFoundError') {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: error.message
      }
    });
    return;
  }

  // Error de conflicto
  if (error.name === 'ConflictError') {
    res.status(409).json({
      success: false,
      error: {
        code: 'CONFLICT',
        message: error.message
      }
    });
    return;
  }

  // Error interno del servidor
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred'
    }
  });
};

// ========================================================================
// MIDDLEWARE DE MANEJO DE RUTAS NO ENCONTRADAS
// ========================================================================

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`
    }
  });
};

// ========================================================================
// MIDDLEWARE DE MANEJO ASÍNCRONO
// ========================================================================

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// ========================================================================
// MIDDLEWARE DE LOGGING
// ========================================================================

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
  });

  next();
};

// ========================================================================
// MIDDLEWARE DE RATE LIMITING BASE
// ========================================================================

export const rateLimit = (maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const clientId = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    
    const clientData = requests.get(clientId);
    
    if (!clientData || now > clientData.resetTime) {
      requests.set(clientId, {
        count: 1,
        resetTime: now + windowMs
      });
      next();
      return;
    }

    if (clientData.count >= maxRequests) {
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later'
        }
      });
      return;
    }

    clientData.count++;
    next();
  };
};

// ========================================================================
// MIDDLEWARE DE CORS BASE
// ========================================================================

export const corsHandler = (req: Request, res: Response, next: NextFunction): void => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Organization-ID');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
};
