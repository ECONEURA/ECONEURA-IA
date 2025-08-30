import { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger.js";

interface SecurityConfig {
  enableCORS: boolean;
  enableRateLimit: boolean;
  enableHelmet: boolean;
  enableContentSecurityPolicy: boolean;
  allowedOrigins: string[];
  maxRequestSize: string;
}

class SecurityMiddleware {
  private config: SecurityConfig = {
    enableCORS: true,
    enableRateLimit: true,
    enableHelmet: true,
    enableContentSecurityPolicy: true,
    allowedOrigins: ['http://localhost:3000', 'https://econeura.com'],
    maxRequestSize: '2mb'
  };

  // Middleware de CORS personalizado
  corsMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    
    if (this.config.enableCORS && origin) {
      if (this.config.allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
      } else {
        logger.warn(`CORS blocked origin: ${origin}`, {
          endpoint: req.path,
          method: req.method,
          ip: req.ip
        });
        return res.status(403).json({ error: 'Origin not allowed' });
      }
    }

    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-Id, X-Org-Id');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    next();
  };

  // Middleware de headers de seguridad
  securityHeaders = (req: Request, res: Response, next: NextFunction) => {
    // Headers básicos de seguridad
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'DENY');
    res.header('X-XSS-Protection', '1; mode=block');
    res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

    // Content Security Policy
    if (this.config.enableContentSecurityPolicy) {
      const csp = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self'",
        "connect-src 'self' https://api.openai.com https://api.bing.microsoft.com",
        "frame-ancestors 'none'"
      ].join('; ');
      
      res.header('Content-Security-Policy', csp);
    }

    next();
  };

  // Middleware de validación de tamaño de request
  requestSizeLimit = (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    const maxSize = this.parseSize(this.config.maxRequestSize);
    
    if (contentLength > maxSize) {
      logger.warn(`Request too large: ${contentLength} bytes`, {
        endpoint: req.path,
        method: req.method,
        ip: req.ip,
        maxSize
      });
      return res.status(413).json({ error: 'Request entity too large' });
    }

    next();
  };

  // Middleware de validación de headers requeridos
  requiredHeaders = (req: Request, res: Response, next: NextFunction) => {
    const requiredHeaders = ['x-request-id'];
    const missingHeaders = requiredHeaders.filter(header => !req.headers[header.toLowerCase()]);

    if (missingHeaders.length > 0) {
      logger.warn(`Missing required headers: ${missingHeaders.join(', ')}`, {
        endpoint: req.path,
        method: req.method,
        ip: req.ip
      });
      return res.status(400).json({ 
        error: `Missing required headers: ${missingHeaders.join(', ')}` 
      });
    }

    next();
  };

  // Middleware de sanitización de input
  sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
    // Sanitizar body
    if (req.body) {
      req.body = this.sanitizeObject(req.body);
    }

    // Sanitizar query params
    if (req.query) {
      req.query = this.sanitizeObject(req.query);
    }

    next();
  };

  // Middleware de logging de seguridad
  securityLogging = (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;
      
      // Log eventos de seguridad importantes
      if (statusCode >= 400) {
        logger.warn(`Security event: ${statusCode} on ${req.method} ${req.path}`, {
          endpoint: req.path,
          method: req.method,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          duration,
          statusCode
        });
      }

      // Log requests sospechosos
      if (this.isSuspiciousRequest(req)) {
        logger.error(`Suspicious request detected`, {
          endpoint: req.path,
          method: req.method,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          headers: req.headers,
          body: req.body
        });
      }
    });

    next();
  };

  // Middleware de validación de organización
  validateOrganization = (req: Request, res: Response, next: NextFunction) => {
    const orgId = req.headers['x-org-id'] as string;
    
    if (!orgId) {
      logger.warn('Missing organization ID', {
        endpoint: req.path,
        method: req.method,
        ip: req.ip
      });
      return res.status(400).json({ error: 'Organization ID required' });
    }

    // Validar formato del org ID
    if (!/^[a-zA-Z0-9-_]+$/.test(orgId)) {
      logger.warn(`Invalid organization ID format: ${orgId}`, {
        endpoint: req.path,
        method: req.method,
        ip: req.ip
      });
      return res.status(400).json({ error: 'Invalid organization ID format' });
    }

    // Agregar org ID al request para uso posterior
    (req as any).orgId = orgId;
    next();
  };

  private parseSize(size: string): number {
    const units: { [key: string]: number } = {
      'b': 1,
      'kb': 1024,
      'mb': 1024 * 1024,
      'gb': 1024 * 1024 * 1024
    };

    const match = size.toLowerCase().match(/^(\d+)([kmg]?b)$/);
    if (!match) return 1024 * 1024; // 1MB por defecto

    const value = parseInt(match[1]);
    const unit = match[2] || 'b';
    return value * (units[unit] || 1);
  }

  private sanitizeObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return this.sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = this.sanitizeObject(value);
    }

    return sanitized;
  }

  private sanitizeString(value: any): string {
    if (typeof value !== 'string') return value;
    
    // Remover caracteres peligrosos
    return value
      .replace(/[<>]/g, '') // Remover < y >
      .replace(/javascript:/gi, '') // Remover javascript:
      .replace(/on\w+=/gi, '') // Remover event handlers
      .trim();
  }

  private isSuspiciousRequest(req: Request): boolean {
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+=/i,
      /union\s+select/i,
      /drop\s+table/i,
      /exec\s*\(/i,
      /eval\s*\(/i
    ];

    const userAgent = req.headers['user-agent'] || '';
    const body = JSON.stringify(req.body || {});
    const query = JSON.stringify(req.query || {});

    return suspiciousPatterns.some(pattern => 
      pattern.test(userAgent) || 
      pattern.test(body) || 
      pattern.test(query)
    );
  }

  // Método para actualizar configuración
  updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('Security configuration updated', this.config);
  }

  // Método para obtener configuración actual
  getConfig(): SecurityConfig {
    return { ...this.config };
  }
}

export const securityMiddleware = new SecurityMiddleware();
