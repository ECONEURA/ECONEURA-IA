// Security Headers and CORS Configuration for ECONEURA
import { Request, Response, NextFunction } from 'express';
import { structuredLogger } from '../lib/structured-logger.js';

export interface SecurityConfig {
  cors: {
    origin: string | string[] | boolean;
    methods: string[];
    allowedHeaders: string[];
    exposedHeaders: string[];
    credentials: boolean;
    maxAge: number;
  };
  headers: {
    contentSecurityPolicy: string;
    xFrameOptions: string;
    xContentTypeOptions: boolean;
    xXSSProtection: boolean;
    referrerPolicy: string;
    permissionsPolicy: string;
    strictTransportSecurity: {
      maxAge: number;
      includeSubDomains: boolean;
      preload: boolean;
    };
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests: boolean;
    skipFailedRequests: boolean;
  };
}

export class SecurityMiddleware {
  private static defaultConfig: SecurityConfig = {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://econeura.com', 'https://app.econeura.com']
        : ['http://localhost:3000', 'http://localhost:3001'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-API-Key',
        'X-User-ID',
        'X-Organization-ID',
        'X-Request-ID',
        'X-Trace-ID',
        'X-Span-ID'
      ],
      exposedHeaders: [
        'X-Request-ID',
        'X-Trace-ID',
        'X-Span-ID',
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'X-RateLimit-Reset'
      ],
      credentials: true,
      maxAge: 86400 // 24 hours
    },
    headers: {
      contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';",
      xFrameOptions: 'DENY',
      xContentTypeOptions: true,
      xXSSProtection: true,
      referrerPolicy: 'strict-origin-when-cross-origin',
      permissionsPolicy: 'camera=(), microphone=(), geolocation=(), payment=()',
      strictTransportSecurity: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
      }
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100,
      skipSuccessfulRequests: false,
      skipFailedRequests: false
    }
  };

  static createSecurityHeaders(config: Partial<SecurityConfig> = {}) {
    const finalConfig = { ...this.defaultConfig, ...config };

    return (req: Request, res: Response, next: NextFunction) => {
      try {
        // Content Security Policy
        res.setHeader('Content-Security-Policy', finalConfig.headers.contentSecurityPolicy);

        // X-Frame-Options
        res.setHeader('X-Frame-Options', finalConfig.headers.xFrameOptions);

        // X-Content-Type-Options
        if (finalConfig.headers.xContentTypeOptions) {
          res.setHeader('X-Content-Type-Options', 'nosniff');
        }

        // X-XSS-Protection
        if (finalConfig.headers.xXSSProtection) {
          res.setHeader('X-XSS-Protection', '1; mode=block');
        }

        // Referrer Policy
        res.setHeader('Referrer-Policy', finalConfig.headers.referrerPolicy);

        // Permissions Policy
        res.setHeader('Permissions-Policy', finalConfig.headers.permissionsPolicy);

        // Strict Transport Security (HTTPS only)
        if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
          const hsts = finalConfig.headers.strictTransportSecurity;
          let hstsHeader = `max-age=${hsts.maxAge}`;
          if (hsts.includeSubDomains) {
            hstsHeader += '; includeSubDomains';
          }
          if (hsts.preload) {
            hstsHeader += '; preload';
          }
          res.setHeader('Strict-Transport-Security', hstsHeader);
        }

        // Additional security headers
        res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
        res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
        res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

        // Cache control for sensitive endpoints
        if (req.path.includes('/auth/') || req.path.includes('/security/')) {
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        }

        // Request ID for tracing
        const requestId = req.headers['x-request-id'] as string || 
                         `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        res.setHeader('X-Request-ID', requestId);

        // Add request ID to request object for logging
        req.headers['x-request-id'] = requestId;

        structuredLogger.debug('Security headers applied', {
          requestId,
          operation: 'security_headers',
          path: req.path,
          method: req.method
        });

        next();
      } catch (error) {
        structuredLogger.error('Failed to apply security headers', error as Error, {
          operation: 'security_headers',
          path: req.path
        });
        next(error);
      }
    };
  }

  static createCORS(config: Partial<SecurityConfig> = {}) {
    const finalConfig = { ...this.defaultConfig, ...config };

    return (req: Request, res: Response, next: NextFunction) => {
      try {
        const origin = req.headers.origin as string;
        
        // Check if origin is allowed
        let allowedOrigin = false;
        if (typeof finalConfig.cors.origin === 'boolean') {
          allowedOrigin = finalConfig.cors.origin;
        } else if (Array.isArray(finalConfig.cors.origin)) {
          allowedOrigin = finalConfig.cors.origin.includes(origin);
        } else if (typeof finalConfig.cors.origin === 'string') {
          allowedOrigin = finalConfig.cors.origin === origin;
        }

        // Set CORS headers
        if (allowedOrigin) {
          res.setHeader('Access-Control-Allow-Origin', origin);
        }

        res.setHeader('Access-Control-Allow-Methods', finalConfig.cors.methods.join(', '));
        res.setHeader('Access-Control-Allow-Headers', finalConfig.cors.allowedHeaders.join(', '));
        res.setHeader('Access-Control-Expose-Headers', finalConfig.cors.exposedHeaders.join(', '));
        res.setHeader('Access-Control-Max-Age', finalConfig.cors.maxAge.toString());

        if (finalConfig.cors.credentials) {
          res.setHeader('Access-Control-Allow-Credentials', 'true');
        }

        // Handle preflight requests
        if (req.method === 'OPTIONS') {
          res.status(200).end();
          return;
        }

        structuredLogger.debug('CORS headers applied', {
          requestId: req.headers['x-request-id'] as string,
          operation: 'cors',
          origin,
          allowed: allowedOrigin,
          method: req.method
        });

        next();
      } catch (error) {
        structuredLogger.error('Failed to apply CORS headers', error as Error, {
          operation: 'cors',
          origin: req.headers.origin
        });
        next(error);
      }
    };
  }

  // IP whitelist middleware
  static createIPWhitelist(allowedIPs: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        const clientIP = req.ip || 
                        req.connection.remoteAddress || 
                        req.socket.remoteAddress ||
                        (req.connection as any)?.socket?.remoteAddress ||
                        req.headers['x-forwarded-for'] as string ||
                        req.headers['x-real-ip'] as string;

        const isAllowed = allowedIPs.includes(clientIP) || 
                         allowedIPs.some(ip => {
                           if (ip.includes('/')) {
                             // CIDR notation support
                             return this.isIPInCIDR(clientIP, ip);
                           }
                           return ip === clientIP;
                         });

        if (!isAllowed) {
          structuredLogger.security('IP not in whitelist', {
            requestId: req.headers['x-request-id'] as string,
            operation: 'ip_whitelist',
            clientIP,
            allowedIPs
          });

          return res.status(403).json({
            success: false,
            error: {
              message: 'Access denied: IP not in whitelist',
              statusCode: 403,
              timestamp: new Date().toISOString()
            }
          });
        }

        next();
      } catch (error) {
        structuredLogger.error('IP whitelist check failed', error as Error, {
          operation: 'ip_whitelist'
        });
        next(error);
      }
    };
  }

  // Request size limiter
  static createRequestSizeLimit(maxSize: string = '10mb') {
    return (req: Request, res: Response, next: NextFunction) => {
      const contentLength = parseInt(req.headers['content-length'] || '0');
      const maxSizeBytes = this.parseSize(maxSize);

      if (contentLength > maxSizeBytes) {
        structuredLogger.security('Request size exceeded', {
          requestId: req.headers['x-request-id'] as string,
          operation: 'request_size_limit',
          contentLength,
          maxSizeBytes
        });

        return res.status(413).json({
          success: false,
          error: {
            message: 'Request entity too large',
            statusCode: 413,
            timestamp: new Date().toISOString()
          }
        });
      }

      next();
    };
  }

  // API key validation
  static createAPIKeyValidation(validKeys: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        const apiKey = req.headers['x-api-key'] as string;

        if (!apiKey) {
          return res.status(401).json({
            success: false,
            error: {
              message: 'API key required',
              statusCode: 401,
              timestamp: new Date().toISOString()
            }
          });
        }

        if (!validKeys.includes(apiKey)) {
          structuredLogger.security('Invalid API key', {
            requestId: req.headers['x-request-id'] as string,
            operation: 'api_key_validation',
            providedKey: apiKey.substring(0, 8) + '...'
          });

          return res.status(401).json({
            success: false,
            error: {
              message: 'Invalid API key',
              statusCode: 401,
              timestamp: new Date().toISOString()
            }
          });
        }

        next();
      } catch (error) {
        structuredLogger.error('API key validation failed', error as Error, {
          operation: 'api_key_validation'
        });
        next(error);
      }
    };
  }

  // User agent validation
  static createUserAgentValidation(allowedUserAgents: string[] = []) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        const userAgent = req.headers['user-agent'] as string;

        if (allowedUserAgents.length > 0) {
          const isAllowed = allowedUserAgents.some(allowed => 
            userAgent.toLowerCase().includes(allowed.toLowerCase())
          );

          if (!isAllowed) {
            structuredLogger.security('User agent not allowed', {
              requestId: req.headers['x-request-id'] as string,
              operation: 'user_agent_validation',
              userAgent
            });

            return res.status(403).json({
              success: false,
              error: {
                message: 'User agent not allowed',
                statusCode: 403,
                timestamp: new Date().toISOString()
              }
            });
          }
        }

        next();
      } catch (error) {
        structuredLogger.error('User agent validation failed', error as Error, {
          operation: 'user_agent_validation'
        });
        next(error);
      }
    };
  }

  // Request sanitization
  static createRequestSanitization() {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        // Sanitize request body
        if (req.body && typeof req.body === 'object') {
          req.body = this.sanitizeObject(req.body);
        }

        // Sanitize query parameters
        if (req.query && typeof req.query === 'object') {
          req.query = this.sanitizeObject(req.query);
        }

        // Sanitize route parameters
        if (req.params && typeof req.params === 'object') {
          req.params = this.sanitizeObject(req.params);
        }

        next();
      } catch (error) {
        structuredLogger.error('Request sanitization failed', error as Error, {
          operation: 'request_sanitization'
        });
        next(error);
      }
    };
  }

  // Utility methods
  private static isIPInCIDR(ip: string, cidr: string): boolean {
    // Simple CIDR check - in production, use a proper CIDR library
    const [network, prefixLength] = cidr.split('/');
    const ipNum = this.ipToNumber(ip);
    const networkNum = this.ipToNumber(network);
    const mask = (0xffffffff << (32 - parseInt(prefixLength))) >>> 0;
    
    return (ipNum & mask) === (networkNum & mask);
  }

  private static ipToNumber(ip: string): number {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
  }

  private static parseSize(size: string): number {
    const units: Record<string, number> = {
      'b': 1,
      'kb': 1024,
      'mb': 1024 * 1024,
      'gb': 1024 * 1024 * 1024
    };

    const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)$/);
    if (!match) {
      return 10 * 1024 * 1024; // Default 10MB
    }

    const value = parseFloat(match[1]);
    const unit = match[2];
    return Math.floor(value * units[unit]);
  }

  private static sanitizeObject(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    if (typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const sanitizedKey = this.sanitizeString(key);
        sanitized[sanitizedKey] = this.sanitizeObject(value);
      }
      return sanitized;
    }

    return obj;
  }

  private static sanitizeString(str: string): string {
    if (typeof str !== 'string') {
      return str;
    }

    return str
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .replace(/script/gi, '') // Remove script tags
      .replace(/eval/gi, '') // Remove eval
      .replace(/expression/gi, '') // Remove CSS expressions
      .replace(/vbscript:/gi, '') // Remove vbscript protocol
      .replace(/data:/gi, '') // Remove data protocol
      .replace(/[\x00-\x1F\x7F]/g, ''); // Remove control characters
  }
}

// Predefined security configurations
export const securityConfigs = {
  // Development configuration
  development: {
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:3001'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['*'],
      exposedHeaders: ['*'],
      credentials: true,
      maxAge: 86400
    },
    headers: {
      contentSecurityPolicy: "default-src 'self' 'unsafe-inline' 'unsafe-eval';",
      xFrameOptions: 'SAMEORIGIN',
      xContentTypeOptions: true,
      xXSSProtection: true,
      referrerPolicy: 'no-referrer-when-downgrade',
      permissionsPolicy: 'camera=(), microphone=(), geolocation=()',
      strictTransportSecurity: {
        maxAge: 0,
        includeSubDomains: false,
        preload: false
      }
    }
  },

  // Production configuration
  production: {
    cors: {
      origin: ['https://econeura.com', 'https://app.econeura.com'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-API-Key',
        'X-User-ID',
        'X-Organization-ID',
        'X-Request-ID'
      ],
      exposedHeaders: ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
      credentials: true,
      maxAge: 86400
    },
    headers: {
      contentSecurityPolicy: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';",
      xFrameOptions: 'DENY',
      xContentTypeOptions: true,
      xXSSProtection: true,
      referrerPolicy: 'strict-origin-when-cross-origin',
      permissionsPolicy: 'camera=(), microphone=(), geolocation=(), payment=()',
      strictTransportSecurity: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }
  }
};
