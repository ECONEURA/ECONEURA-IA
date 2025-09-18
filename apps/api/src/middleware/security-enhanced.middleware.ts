/**
 * Enhanced Security Middleware
 * PR-102: Security & CORS (api) - helmet y cors
 * 
 * Middleware de seguridad mejorado con helmet y CORS robustos
 */

import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { structuredLogger } from '../lib/structured-logger.js';

// Configuración de CORS mejorada
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Lista de orígenes permitidos
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'https://econeura.com',
      'https://www.econeura.com',
      'https://app.econeura.com',
      'https://staging.econeura.com',
      'https://dev.econeura.com'
    ];

    // Permitir requests sin origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Verificar si el origin está en la lista permitida
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Log de intento de acceso desde origen no permitido
    structuredLogger.warn('CORS: Origin not allowed', {
      origin,
      allowedOrigins,
      timestamp: new Date().toISOString()
    });

    callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Org-ID',
    'X-User-ID',
    'X-Correlation-ID',
    'X-Tenant-ID',
    'X-User-Role',
    'X-Permissions',
    'X-Session-ID',
    'X-Request-ID',
    'X-CSRF-Token',
    'X-API-Key',
    'X-Client-Version',
    'X-Client-Platform',
    'Accept',
    'Accept-Language',
    'Accept-Encoding',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: [
    'X-System-Mode',
    'X-Est-Cost-EUR',
    'X-Budget-Pct',
    'X-Latency-ms',
    'X-Route',
    'X-RLS-Policies-Applied',
    'X-RLS-Rules-Evaluated',
    'X-RLS-Execution-Time',
    'X-RLS-Tenant-Isolation',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'X-Cache-Status',
    'X-Response-Time',
    'X-Request-ID'
  ],
  maxAge: 86400, // 24 horas
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Configuración de Helmet mejorada
const helmetOptions = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'", // Solo para desarrollo
        "https://cdn.jsdelivr.net",
        "https://unpkg.com"
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
        "https://cdn.jsdelivr.net"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "data:"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https:",
        "blob:"
      ],
      connectSrc: [
        "'self'",
        "https:",
        "wss:",
        "ws:"
      ],
      mediaSrc: [
        "'self'",
        "data:",
        "blob:"
      ],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: []
    },
    reportOnly: false
  },
  crossOriginEmbedderPolicy: false, // Deshabilitado para compatibilidad
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000, // 1 año
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true
};

// Middleware de CORS mejorado
export const enhancedCorsMiddleware = cors(corsOptions);

// Middleware de Helmet mejorado
export const enhancedHelmetMiddleware = helmet(helmetOptions);

// Middleware de headers de seguridad adicionales
export const additionalSecurityHeadersMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Headers de seguridad adicionales
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'cross-origin'
  });

  // Headers específicos para API
  res.set({
    'X-API-Version': '1.0.0',
    'X-API-Environment': process.env.NODE_ENV || 'development',
    'X-Response-Time': Date.now().toString()
  });

  next();
};

// Middleware de validación de headers de seguridad
export const securityHeadersValidationMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Validar headers requeridos para ciertas operaciones
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH' || req.method === 'DELETE') {
    const contentType = req.headers['content-type'];
    
    if (!contentType || !contentType.includes('application/json')) {
      structuredLogger.warn('Security: Invalid content type', {
        contentType,
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });
    }
  }

  // Validar User-Agent
  const userAgent = req.headers['user-agent'];
  if (!userAgent || userAgent.length < 10) {
    structuredLogger.warn('Security: Suspicious user agent', {
      userAgent,
      path: req.path,
      ip: req.ip
    });
  }

  next();
};

// Middleware de logging de seguridad
export const securityLoggingMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  
  // Log de request
  structuredLogger.info('Security: Request received', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    origin: req.headers.origin,
    referer: req.headers.referer,
    timestamp: new Date().toISOString()
  });

  // Interceptar respuesta para logging
  const originalSend = res.send;
  res.send = function(data: any): Response {
    const responseTime = Date.now() - startTime;
    
    // Log de respuesta
    structuredLogger.info('Security: Response sent', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString()
    });

    return originalSend.call(this, data);
  };

  next();
};

// Middleware de protección contra ataques comunes
export const attackProtectionMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Protección contra path traversal
  if (req.path.includes('..') || req.path.includes('~')) {
    structuredLogger.warn('Security: Path traversal attempt', {
      path: req.path,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    return res.status(400).json({
      success: false,
      error: 'Invalid path',
      code: 'PATH_TRAVERSAL_DETECTED'
    });
  }

  // Protección contra inyección SQL básica
  const suspiciousPatterns = [
    /union\s+select/i,
    /drop\s+table/i,
    /delete\s+from/i,
    /insert\s+into/i,
    /update\s+set/i,
    /script\s*>/i,
    /<script/i,
    /javascript:/i,
    /vbscript:/i,
    /onload=/i,
    /onerror=/i
  ];

  const queryString = JSON.stringify(req.query);
  const bodyString = JSON.stringify(req.body);
  const pathString = req.path;

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(queryString) || pattern.test(bodyString) || pattern.test(pathString)) {
      structuredLogger.warn('Security: Suspicious pattern detected', {
        pattern: pattern.toString(),
        path: req.path,
        query: req.query,
        body: req.body,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });
      
      return res.status(400).json({
        success: false,
        error: 'Suspicious request detected',
        code: 'SUSPICIOUS_PATTERN_DETECTED'
      });
    }
  }

  next();
};

// Middleware de rate limiting por IP
export const ipBasedRateLimitMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const ip = req.ip || 'unknown';
  const key = `rate_limit:${ip}`;
  
  // Implementación básica de rate limiting
  // En producción, usar Redis o similar
  const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutos
  const maxRequests = 100; // 100 requests por ventana

  const current = rateLimitStore.get(key);
  
  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return next();
  }

  if (current.count >= maxRequests) {
    structuredLogger.warn('Security: Rate limit exceeded', {
      ip,
      count: current.count,
      maxRequests,
      resetTime: new Date(current.resetTime).toISOString()
    });
    
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil((current.resetTime - now) / 1000)
    });
  }

  current.count++;
  next();
};

// Middleware de validación de tamaño de request
export const requestSizeValidationMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const contentLength = parseInt(req.headers['content-length'] || '0');
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (contentLength > maxSize) {
    structuredLogger.warn('Security: Request too large', {
      contentLength,
      maxSize,
      path: req.path,
      ip: req.ip
    });
    
    return res.status(413).json({
      success: false,
      error: 'Request too large',
      code: 'REQUEST_TOO_LARGE',
      maxSize
    });
  }

  next();
};

// Middleware de validación de métodos HTTP
export const httpMethodValidationMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const allowedMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'];
  
  if (!allowedMethods.includes(req.method)) {
    structuredLogger.warn('Security: Invalid HTTP method', {
      method: req.method,
      path: req.path,
      ip: req.ip
    });
    
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      code: 'METHOD_NOT_ALLOWED',
      allowedMethods
    });
  }

  next();
};

// Middleware de validación de Content-Type
export const contentTypeValidationMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const contentType = req.headers['content-type'];
  const allowedTypes = [
    'application/json',
    'application/x-www-form-urlencoded',
    'multipart/form-data',
    'text/plain'
  ];

  // Solo validar para requests con body
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.headers['content-length'] !== '0') {
    if (!contentType || !allowedTypes.some(type => contentType.includes(type))) {
      structuredLogger.warn('Security: Invalid content type', {
        contentType,
        method: req.method,
        path: req.path,
        ip: req.ip
      });
      
      return res.status(400).json({
        success: false,
        error: 'Invalid content type',
        code: 'INVALID_CONTENT_TYPE',
        allowedTypes
      });
    }
  }

  next();
};

// Middleware de limpieza de headers
export const headerCleanupMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Remover headers sensibles antes de logging
  const sensitiveHeaders = ['authorization', 'x-api-key', 'x-csrf-token'];
  
  const cleanHeaders = { ...req.headers };
  sensitiveHeaders.forEach(header => {
    if (cleanHeaders[header]) {
      cleanHeaders[header] = '[REDACTED]';
    }
  });

  // Agregar headers limpios a la request para uso posterior
  (req as any).cleanHeaders = cleanHeaders;

  next();
};

// Middleware de validación de CORS preflight
export const corsPreflightValidationMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  if (req.method === 'OPTIONS') {
    const origin = req.headers.origin;
    const method = req.headers['access-control-request-method'];
    const headers = req.headers['access-control-request-headers'];

    structuredLogger.info('Security: CORS preflight request', {
      origin,
      method,
      headers,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Validar método solicitado
    const allowedMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'];
    if (method && !allowedMethods.includes(method)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid CORS method',
        code: 'INVALID_CORS_METHOD'
      });
    }
  }

  next();
};

// Middleware de monitoreo de seguridad
export const securityMonitoringMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const securityMetrics = {
    totalRequests: 0,
    blockedRequests: 0,
    suspiciousRequests: 0,
    corsRequests: 0,
    rateLimitedRequests: 0
  };

  // Incrementar contador de requests
  securityMetrics.totalRequests++;

  // Monitorear requests CORS
  if (req.headers.origin) {
    securityMetrics.corsRequests++;
  }

  // Interceptar respuestas para métricas
  const originalSend = res.send;
  res.send = function(data: any): Response {
    // Incrementar métricas basadas en status code
    if (res.statusCode === 403) {
      securityMetrics.blockedRequests++;
    } else if (res.statusCode === 400) {
      securityMetrics.suspiciousRequests++;
    } else if (res.statusCode === 429) {
      securityMetrics.rateLimitedRequests++;
    }

    // Log de métricas cada 100 requests
    if (securityMetrics.totalRequests % 100 === 0) {
      structuredLogger.info('Security: Metrics update', {
        ...securityMetrics,
        timestamp: new Date().toISOString()
      });
    }

    return originalSend.call(this, data);
  };

  next();
};

// Exportar configuración para uso en otros archivos
export const securityConfig = {
  cors: corsOptions,
  helmet: helmetOptions
};
