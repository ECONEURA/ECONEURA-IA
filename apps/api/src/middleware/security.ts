import { Request, Response, NextFunction } from 'express';
import { securityManagerService } from '../lib/security-manager.service.js';
import { structuredLogger } from '../lib/structured-logger.js';

// Security Middleware - MEJORA 4
// Middleware de seguridad avanzada con rate limiting, CSRF, sanitización y JWT

// Rate Limiting Middleware
export const rateLimitMiddleware = (maxRequests?: number) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip || 'unknown';

    // Verificar si la IP está bloqueada
    if (securityManagerService.isIPBlocked(key)) {
      res.status(403).json({
        success: false,
        error: 'IP blocked due to security violations'
      });
      return;
    }

    const rateLimitResult = securityManagerService.checkRateLimit(key, maxRequests);

    if (!rateLimitResult.allowed) {
      res.set({
        'X-RateLimit-Limit': maxRequests || 100,
        'X-RateLimit-Remaining': rateLimitResult.remaining,
        'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
        'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
      });

      res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
      });
      return;
    }

    res.set({
      'X-RateLimit-Limit': maxRequests || 100,
      'X-RateLimit-Remaining': rateLimitResult.remaining,
      'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString()
        });

        next();
  };
};

// JWT Authentication Middleware
export const jwtAuthMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'UNAUTHORIZED'
    });
          return;
        }

  const token = authHeader.substring(7);

  try {
    const payload = securityManagerService.verifyToken(token, 'access');

    // Añadir información del usuario a la request
    req.user = {
      id: payload.userId,
      organizationId: payload.organizationId,
      roles: payload.roles || [],
      permissions: payload.permissions || []
    };

        next();
      } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
      code: 'INVALID_TOKEN'
    });
  }
};

// CSRF Protection Middleware
export const csrfMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Solo aplicar CSRF a métodos que modifican datos
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const token = req.headers['x-csrf-token'] as string;
    const sessionToken = req.session?.csrfToken;

    if (!securityManagerService.verifyCSRFToken(token, sessionToken)) {
      res.status(403).json({
        success: false,
        error: 'CSRF token validation failed',
        code: 'CSRF_ERROR'
      });
      return;
    }
        }

        next();
};

// Input Sanitization Middleware
export const sanitizeMiddleware = (req: Request, res: Response, next: NextFunction): void => {
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

// Security Headers Middleware
export const securityHeadersMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Content Security Policy
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' https:; " +
    "frame-ancestors 'none';"
  );

  // X-Frame-Options
  res.setHeader('X-Frame-Options', 'DENY');

  // X-Content-Type-Options
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // X-XSS-Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy
  res.setHeader('Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
  );

  // Strict Transport Security (solo en producción)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  next();
};

// IP Whitelist/Blacklist Middleware
export const ipFilterMiddleware = (whitelist?: string[], blacklist?: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';

    // Verificar blacklist
    if (blacklist && blacklist.includes(ip)) {
      securityManagerService.recordSecurityEvent({
        type: 'authorization',
        severity: 'high',
        source: { ip, userAgent: req.headers['user-agent'] || 'unknown' },
        details: { reason: 'IP in blacklist', endpoint: req.path, method: req.method },
        blocked: true,
        action: 'blocked'
      });

      res.status(403).json({
            success: false,
        error: 'Access denied'
      });
      return;
    }

    // Verificar whitelist
    if (whitelist && !whitelist.includes(ip)) {
      securityManagerService.recordSecurityEvent({
        type: 'authorization',
        severity: 'medium',
        source: { ip, userAgent: req.headers['user-agent'] || 'unknown' },
        details: { reason: 'IP not in whitelist', endpoint: req.path, method: req.method },
        blocked: true,
        action: 'blocked'
      });

      res.status(403).json({
            success: false,
        error: 'Access denied'
      });
      return;
        }

        next();
  };
};

// Request Size Limiter Middleware
export const requestSizeLimiter = (maxSize: number = 1024 * 1024) => { // 1MB por defecto
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = parseInt(req.headers['content-length'] || '0');

    if (contentLength > maxSize) {
      securityManagerService.recordSecurityEvent({
        type: 'suspicious_activity',
        severity: 'medium',
        source: {
          ip: req.ip || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown'
        },
        details: {
          reason: 'Request too large',
          endpoint: req.path,
          method: req.method,
          metadata: { size: contentLength, maxSize }
        },
        blocked: true,
        action: 'blocked'
      });

      res.status(413).json({
              success: false,
        error: 'Request entity too large'
      });
      return;
        }

        next();
  };
};

// Suspicious Activity Detection Middleware
export const suspiciousActivityMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const ip = req.ip || 'unknown';
  const userAgent = req.headers['user-agent'] || '';

  // Detectar user agents sospechosos
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i
  ];

  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));

  if (isSuspicious) {
    securityManagerService.recordSecurityEvent({
      type: 'suspicious_activity',
      severity: 'low',
      source: { ip, userAgent },
      details: {
        reason: 'Suspicious user agent detected',
        endpoint: req.path,
        method: req.method,
        metadata: { userAgent }
      },
      blocked: false,
      action: 'logged'
    });
  }

  // Detectar múltiples requests rápidos
  const now = Date.now();
  const requestKey = `${ip}_${req.path}`;

  // En una implementación real, esto usaría Redis o similar
  // Por ahora, solo registramos la actividad
  if (req.method !== 'GET') {
    securityManagerService.recordSecurityEvent({
      type: 'suspicious_activity',
      severity: 'low',
      source: { ip, userAgent },
      details: {
        reason: 'Non-GET request detected',
        endpoint: req.path,
        method: req.method
      },
      blocked: false,
      action: 'logged'
    });
  }

  next();
};

// Helper function para sanitizar objetos
function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return securityManagerService.sanitizeInput(obj);
    }

    if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
    }

  if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }

    return obj;
  }

// Middleware para generar CSRF token
export const generateCSRFToken = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.session) {
    req.session = {} as any;
  }

  if (!req.session.csrfToken) {
    req.session.csrfToken = securityManagerService.generateCSRFToken();
  }

  res.setHeader('X-CSRF-Token', req.session.csrfToken);
  next();
};

// Middleware para validar organización
export const organizationMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const orgId = req.headers['x-org'] as string;

  if (!orgId) {
    res.status(400).json({
      success: false,
      error: 'Organization ID required',
      code: 'MISSING_ORG_ID'
    });
    return;
  }

  // Verificar que el usuario pertenece a la organización
  if (req.user && req.user.organizationId !== orgId) {
    securityManagerService.recordSecurityEvent({
      type: 'authorization',
      severity: 'high',
      source: {
        ip: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        userId: req.user.id,
        organizationId: orgId
      },
      details: {
        reason: 'User accessing different organization',
        endpoint: req.path,
        method: req.method,
        metadata: {
          userOrgId: req.user.organizationId,
          requestedOrgId: orgId
        }
      },
      blocked: true,
      action: 'blocked'
    });

    res.status(403).json({
      success: false,
      error: 'Access denied to organization',
      code: 'ORG_ACCESS_DENIED'
    });
    return;
  }

  req.organizationId = orgId;
  next();
};

// Middleware para logging de seguridad
export const securityLoggingMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;

    // Log requests sensibles
    if (req.method !== 'GET' || req.path.includes('/admin') || req.path.includes('/api/')) {
      structuredLogger.info('Security request logged', {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        userId: req.user?.id,
        organizationId: req.organizationId,
        requestId: req.headers['x-request-id']
      });
    }

    // Registrar errores de seguridad
    if (res.statusCode >= 400) {
      securityManagerService.recordSecurityEvent({
        type: 'authorization',
        severity: res.statusCode >= 500 ? 'high' : 'medium',
        source: {
          ip: req.ip || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown',
          userId: req.user?.id,
          organizationId: req.organizationId
        },
        details: {
          reason: `HTTP ${res.statusCode}`,
          endpoint: req.path,
          method: req.method,
          metadata: { statusCode: res.statusCode, duration }
        },
        blocked: false,
        action: 'logged'
      });
    }
  });

  next();
};
