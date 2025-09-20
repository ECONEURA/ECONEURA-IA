// ============================================================================
// SECURITY MIDDLEWARE - Middleware de seguridad avanzada
// ============================================================================

import { Request, Response, NextFunction } from 'express';
import { securityService } from '../lib/security.service.js';
import { structuredLogger } from '../lib/structured-logger.js';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { body, validationResult } from 'express-validator';

// ========================================================================
// INTERFACES
// ========================================================================

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    organizationId: string;
    email: string;
    role: string;
  };
  requestId?: string;
}

// ========================================================================
// MIDDLEWARE DE SEGURIDAD BÁSICA
// ========================================================================

export const securityHeadersMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// ========================================================================
// MIDDLEWARE DE VALIDACIÓN DE ENTRADA
// ========================================================================

export const inputValidationMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    
    securityService.recordAuditLog({
      action: 'VALIDATION_ERROR',
      resource: req.path,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      details: { errors: errorMessages, body: req.body }
    });

    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages
    });
    return;
  }

  next();
};

// ========================================================================
// MIDDLEWARE DE SANITIZACIÓN
// ========================================================================

export const sanitizationMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Sanitizar body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  // Sanitizar query parameters
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }

  // Sanitizar params
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }

  next();
};

// ========================================================================
// MIDDLEWARE DE DETECCIÓN DE ACTIVIDAD SOSPECHOSA
// ========================================================================

export const suspiciousActivityMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const ipAddress = req.ip || 'unknown';
  const userAgent = req.get('User-Agent') || 'unknown';
  
  // Interceptar respuesta para detectar patrones sospechosos
  const originalSend = res.send;
  res.send = function(data: any) {
    // Detectar respuestas de error frecuentes
    if (res.statusCode >= 400) {
      securityService.detectSuspiciousActivity(
        req.user?.id || 'anonymous',
        req.user?.organizationId || 'unknown',
        `${req.method} ${req.path}`,
        ipAddress,
        userAgent,
        { statusCode: res.statusCode, response: data }
      );
    }

    return originalSend.call(this, data);
  };

  next();
};

// ========================================================================
// MIDDLEWARE DE AUDITORÍA
// ========================================================================

export const auditMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  
  // Interceptar respuesta para registrar auditoría
  const originalSend = res.send;
  res.send = function(data: any) {
    const duration = Date.now() - startTime;
    
    // Registrar auditoría para operaciones importantes
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) || 
        res.statusCode >= 400) {
      
      securityService.recordAuditLog({
        userId: req.user?.id,
        organizationId: req.user?.organizationId,
        action: `${req.method} ${req.path}`,
        resource: req.path,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        details: {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration,
          requestId: req.requestId,
          body: sanitizeSensitiveData(req.body),
          query: req.query,
          params: req.params
        }
      });
    }

    return originalSend.call(this, data);
  };

  next();
};

// ========================================================================
// MIDDLEWARE DE RATE LIMITING AVANZADO
// ========================================================================

export const createRateLimitMiddleware = (options: {
  windowMs: number;
  max: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: options.message || 'Too many requests from this IP',
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      securityService.recordSecurityEvent({
        type: 'RATE_LIMIT',
        severity: 'MEDIUM',
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        details: {
          endpoint: `${req.method} ${req.path}`,
          limit: options.max,
          window: options.windowMs
        }
      });

      res.status(429).json({
        success: false,
        message: 'Rate limit exceeded',
        retryAfter: Math.ceil(options.windowMs / 1000)
      });
    }
  });
};

// ========================================================================
// MIDDLEWARE DE VALIDACIÓN DE IP
// ========================================================================

export const ipValidationMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const ipAddress = req.ip || 'unknown';
  
  try {
    const isBlocked = await securityService.isIPBlocked(ipAddress);
    
    if (isBlocked) {
      securityService.recordSecurityEvent({
        type: 'UNAUTHORIZED_ACCESS',
        severity: 'HIGH',
        ipAddress,
        userAgent: req.get('User-Agent') || 'unknown',
        details: {
          endpoint: `${req.method} ${req.path}`,
          reason: 'Blocked IP attempt'
        }
      });

      res.status(403).json({
        success: false,
        message: 'Access denied'
      });
      return;
    }

    next();
  } catch (error) {
    structuredLogger.error('IP validation error', error as Error, { ipAddress });
    next(); // Continuar en caso de error
  }
};

// ========================================================================
// MIDDLEWARE DE VALIDACIÓN DE TOKEN
// ========================================================================

export const tokenValidationMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    securityService.recordSecurityEvent({
      type: 'UNAUTHORIZED_ACCESS',
      severity: 'MEDIUM',
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      details: {
        endpoint: `${req.method} ${req.path}`,
        reason: 'No token provided'
      }
    });

    res.status(401).json({
      success: false,
      message: 'No token provided'
    });
    return;
  }

  // Aquí se validaría el token JWT
  // Por ahora, continuamos con el siguiente middleware
  next();
};

// ========================================================================
// MIDDLEWARE DE VALIDACIÓN DE PERMISOS
// ========================================================================

export const permissionMiddleware = (requiredPermissions: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    // Aquí se validarían los permisos del usuario
    // Por ahora, continuamos con el siguiente middleware
    next();
  };
};

// ========================================================================
// MIDDLEWARE DE ENCRIPTACIÓN DE RESPUESTAS
// ========================================================================

export const responseEncryptionMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Solo encriptar respuestas sensibles
  const sensitiveEndpoints = ['/v1/users', '/v1/auth/me'];
  const isSensitive = sensitiveEndpoints.some(endpoint => req.path.startsWith(endpoint));

  if (isSensitive) {
    const originalSend = res.send;
    res.send = function(data: any) {
      try {
        const encryptedData = securityService.encryptData(JSON.stringify(data));
        res.set('X-Encrypted', 'true');
        return originalSend.call(this, encryptedData);
      } catch (error) {
        structuredLogger.error('Response encryption error', error as Error);
        return originalSend.call(this, data);
      }
    };
  }

  next();
};

// ========================================================================
// FUNCIONES AUXILIARES
// ========================================================================

function sanitizeObject(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return typeof obj === 'string' ? securityService.sanitizeInput(obj) : obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeObject(value);
  }

  return sanitized;
}

function sanitizeSensitiveData(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sensitiveFields = ['password', 'token', 'secret', 'key', 'ssn', 'creditCard'];
  const sanitized = { ...data };

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

// ========================================================================
// VALIDADORES COMUNES
// ========================================================================

export const commonValidators = {
  email: body('email').isEmail().normalizeEmail(),
  password: body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
  name: body('name').isLength({ min: 1, max: 100 }).trim().escape(),
  phone: body('phone').isMobilePhone(),
  url: body('url').isURL(),
  uuid: body('id').isUUID(),
  organizationId: body('organizationId').isUUID(),
  page: body('page').optional().isInt({ min: 1 }),
  limit: body('limit').optional().isInt({ min: 1, max: 100 })
};

