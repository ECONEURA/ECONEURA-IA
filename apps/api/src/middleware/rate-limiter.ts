// Advanced Rate Limiting Middleware
import { Request, Response, NextFunction } from 'express';
import { RateLimitError } from '../lib/error-handler.js';
import { structuredLogger } from '../lib/structured-logger.js';

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
  onLimitReached?: (req: Request, res: Response) => void;
  message?: string;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

export class RateLimiter {
  private static instance: RateLimiter;
  private limits: Map<string, { count: number; resetTime: number }> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, data] of this.limits.entries()) {
      if (data.resetTime <= now) {
        this.limits.delete(key);
      }
    }
  }

  private getKey(req: Request, keyGenerator?: (req: Request) => string): string {
    if (keyGenerator) {
      return keyGenerator(req);
    }

    // Default key generation based on IP and user
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userId = req.headers['x-user-id'] as string || 'anonymous';
    const organizationId = req.headers['x-organization-id'] as string || 'default';
    
    return `${ip}:${userId}:${organizationId}`;
  }

  private getLimitInfo(key: string, limit: number): RateLimitInfo {
    const data = this.limits.get(key);
    if (!data) {
      return {
        limit,
        remaining: limit,
        reset: Date.now() + 60000 // Default 1 minute window
      };
    }

    const now = Date.now();
    if (data.resetTime <= now) {
      return {
        limit,
        remaining: limit,
        reset: now + 60000
      };
    }

    return {
      limit,
      remaining: Math.max(0, limit - data.count),
      reset: data.resetTime
    };
  }

  checkLimit(key: string, limit: number, windowMs: number): RateLimitInfo {
    const now = Date.now();
    const data = this.limits.get(key);

    if (!data || data.resetTime <= now) {
      // New window or expired window
      this.limits.set(key, {
        count: 1,
        resetTime: now + windowMs
      });

      return {
        limit,
        remaining: limit - 1,
        reset: now + windowMs
      };
    }

    if (data.count >= limit) {
      // Limit exceeded
      return {
        limit,
        remaining: 0,
        reset: data.resetTime,
        retryAfter: Math.ceil((data.resetTime - now) / 1000)
      };
    }

    // Increment count
    data.count++;
    this.limits.set(key, data);

    return {
      limit,
      remaining: limit - data.count,
      reset: data.resetTime
    };
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.limits.clear();
  }
}

export class RateLimitMiddleware {
  static create(config: RateLimitConfig) {
    const rateLimiter = RateLimiter.getInstance();

    return (req: Request, res: Response, next: NextFunction) => {
      try {
        const key = rateLimiter.getKey(req, config.keyGenerator);
        const limitInfo = rateLimiter.checkLimit(key, config.maxRequests, config.windowMs);

        // Set rate limit headers
        if (config.standardHeaders) {
          res.set({
            'RateLimit-Limit': limitInfo.limit.toString(),
            'RateLimit-Remaining': limitInfo.remaining.toString(),
            'RateLimit-Reset': new Date(limitInfo.reset).toISOString()
          });
        }

        if (config.legacyHeaders) {
          res.set({
            'X-RateLimit-Limit': limitInfo.limit.toString(),
            'X-RateLimit-Remaining': limitInfo.remaining.toString(),
            'X-RateLimit-Reset': Math.ceil(limitInfo.reset / 1000).toString()
          });
        }

        if (limitInfo.remaining < 0) {
          // Rate limit exceeded
          if (config.legacyHeaders && limitInfo.retryAfter) {
            res.set('Retry-After', limitInfo.retryAfter.toString());
          }

          structuredLogger.warn('Rate limit exceeded', {
            requestId: req.headers['x-request-id'] as string,
            operation: 'rate_limit',
            key,
            limit: limitInfo.limit,
            remaining: limitInfo.remaining,
            reset: new Date(limitInfo.reset).toISOString()
          });

          if (config.onLimitReached) {
            config.onLimitReached(req, res);
          }

          const error = new RateLimitError(
            config.message || 'Too many requests, please try again later',
            {
              limit: limitInfo.limit,
              remaining: limitInfo.remaining,
              reset: limitInfo.reset,
              retryAfter: limitInfo.retryAfter
            }
          );

          return res.status(429).json({
            success: false,
            error: {
              message: error.message,
              statusCode: 429,
              timestamp: new Date().toISOString(),
              context: error.context
            }
          });
        }

        next();
      } catch (error) {
        structuredLogger.error('Rate limiting error', error as Error, {
          requestId: req.headers['x-request-id'] as string,
          operation: 'rate_limit'
        });
        next(error);
      }
    };
  }

  // Predefined rate limit configurations
  static readonly configs = {
    // Strict rate limiting for authentication endpoints
    auth: RateLimitMiddleware.create({
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5, // 5 attempts per window
      message: 'Too many authentication attempts, please try again later',
      standardHeaders: true,
      legacyHeaders: true,
      keyGenerator: (req) => `auth:${req.ip}:${req.headers['x-user-id'] || 'anonymous'}`
    }),

    // Moderate rate limiting for API endpoints
    api: RateLimitMiddleware.create({
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100, // 100 requests per window
      message: 'API rate limit exceeded, please try again later',
      standardHeaders: true,
      legacyHeaders: true
    }),

    // Generous rate limiting for read operations
    read: RateLimitMiddleware.create({
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 1000, // 1000 requests per window
      message: 'Read operation rate limit exceeded, please try again later',
      standardHeaders: true,
      legacyHeaders: true
    }),

    // Strict rate limiting for write operations
    write: RateLimitMiddleware.create({
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 50, // 50 requests per window
      message: 'Write operation rate limit exceeded, please try again later',
      standardHeaders: true,
      legacyHeaders: true
    }),

    // Very strict rate limiting for sensitive operations
    sensitive: RateLimitMiddleware.create({
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 10, // 10 requests per hour
      message: 'Sensitive operation rate limit exceeded, please try again later',
      standardHeaders: true,
      legacyHeaders: true,
      keyGenerator: (req) => `sensitive:${req.headers['x-user-id'] || req.ip}`
    }),

    // Rate limiting for file uploads
    upload: RateLimitMiddleware.create({
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 20, // 20 uploads per hour
      message: 'File upload rate limit exceeded, please try again later',
      standardHeaders: true,
      legacyHeaders: true
    }),

    // Rate limiting for webhook endpoints
    webhook: RateLimitMiddleware.create({
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 100, // 100 webhook calls per minute
      message: 'Webhook rate limit exceeded, please try again later',
      standardHeaders: true,
      legacyHeaders: true,
      keyGenerator: (req) => `webhook:${req.headers['x-webhook-id'] || req.ip}`
    }),

    // Rate limiting for search operations
    search: RateLimitMiddleware.create({
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 200, // 200 searches per minute
      message: 'Search rate limit exceeded, please try again later',
      standardHeaders: true,
      legacyHeaders: true
    }),

    // Rate limiting for report generation
    reports: RateLimitMiddleware.create({
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 5, // 5 reports per hour
      message: 'Report generation rate limit exceeded, please try again later',
      standardHeaders: true,
      legacyHeaders: true
    }),

    // Rate limiting for GDPR operations
    gdpr: RateLimitMiddleware.create({
      windowMs: 24 * 60 * 60 * 1000, // 24 hours
      maxRequests: 3, // 3 GDPR requests per day
      message: 'GDPR operation rate limit exceeded, please try again tomorrow',
      standardHeaders: true,
      legacyHeaders: true,
      keyGenerator: (req) => `gdpr:${req.headers['x-user-id'] || req.ip}`
    }),

    // Rate limiting for RLS policy operations
    rls: RateLimitMiddleware.create({
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 20, // 20 RLS operations per hour
      message: 'RLS operation rate limit exceeded, please try again later',
      standardHeaders: true,
      legacyHeaders: true
    }),

    // Rate limiting for SEPA operations
    sepa: RateLimitMiddleware.create({
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 10, // 10 SEPA operations per hour
      message: 'SEPA operation rate limit exceeded, please try again later',
      standardHeaders: true,
      legacyHeaders: true
    })
  };

  // Dynamic rate limiting based on user tier
  static createTieredRateLimit(tier: 'free' | 'premium' | 'enterprise') {
    const limits = {
      free: { windowMs: 15 * 60 * 1000, maxRequests: 100 },
      premium: { windowMs: 15 * 60 * 1000, maxRequests: 500 },
      enterprise: { windowMs: 15 * 60 * 1000, maxRequests: 2000 }
    };

    const config = limits[tier];

    return RateLimitMiddleware.create({
      ...config,
      message: `Rate limit exceeded for ${tier} tier, please upgrade for higher limits`,
      standardHeaders: true,
      legacyHeaders: true,
      keyGenerator: (req) => `${tier}:${req.headers['x-user-id'] || req.ip}`
    });
  }

  // Organization-based rate limiting
  static createOrganizationRateLimit(organizationId: string, maxRequests: number = 1000) {
    return RateLimitMiddleware.create({
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests,
      message: 'Organization rate limit exceeded, please try again later',
      standardHeaders: true,
      legacyHeaders: true,
      keyGenerator: (req) => `org:${organizationId}`
    });
  }
}
