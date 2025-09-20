import { RateLimitError } from '../lib/error-handler.js';
import { structuredLogger } from '../lib/structured-logger.js';
export class RateLimiter {
    static instance;
    limits = new Map();
    cleanupInterval;
    constructor() {
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 60000);
    }
    static getInstance() {
        if (!RateLimiter.instance) {
            RateLimiter.instance = new RateLimiter();
        }
        return RateLimiter.instance;
    }
    cleanup() {
        const now = Date.now();
        for (const [key, data] of this.limits.entries()) {
            if (data.resetTime <= now) {
                this.limits.delete(key);
            }
        }
    }
    getKey(req, keyGenerator) {
        if (keyGenerator) {
            return keyGenerator(req);
        }
        const ip = req.ip || req.connection.remoteAddress || 'unknown';
        const userId = req.headers['x-user-id'] || 'anonymous';
        const organizationId = req.headers['x-organization-id'] || 'default';
        return `${ip}:${userId}:${organizationId}`;
    }
    getLimitInfo(key, limit) {
        const data = this.limits.get(key);
        if (!data) {
            return {
                limit,
                remaining: limit,
                reset: Date.now() + 60000
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
    checkLimit(key, limit, windowMs) {
        const now = Date.now();
        const data = this.limits.get(key);
        if (!data || data.resetTime <= now) {
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
            return {
                limit,
                remaining: 0,
                reset: data.resetTime,
                retryAfter: Math.ceil((data.resetTime - now) / 1000)
            };
        }
        data.count++;
        this.limits.set(key, data);
        return {
            limit,
            remaining: limit - data.count,
            reset: data.resetTime
        };
    }
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.limits.clear();
    }
}
export class RateLimitMiddleware {
    static create(config) {
        const rateLimiter = RateLimiter.getInstance();
        return (req, res, next) => {
            try {
                const key = rateLimiter.getKey(req, config.keyGenerator);
                const limitInfo = rateLimiter.checkLimit(key, config.maxRequests, config.windowMs);
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
                    if (config.legacyHeaders && limitInfo.retryAfter) {
                        res.set('Retry-After', limitInfo.retryAfter.toString());
                    }
                    structuredLogger.warn('Rate limit exceeded', {
                        requestId: req.headers['x-request-id'],
                        operation: 'rate_limit',
                        key,
                        limit: limitInfo.limit,
                        remaining: limitInfo.remaining,
                        reset: new Date(limitInfo.reset).toISOString()
                    });
                    if (config.onLimitReached) {
                        config.onLimitReached(req, res);
                    }
                    const error = new RateLimitError(config.message || 'Too many requests, please try again later', {
                        limit: limitInfo.limit,
                        remaining: limitInfo.remaining,
                        reset: limitInfo.reset,
                        retryAfter: limitInfo.retryAfter
                    });
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
            }
            catch (error) {
                structuredLogger.error('Rate limiting error', error, {
                    requestId: req.headers['x-request-id'],
                    operation: 'rate_limit'
                });
                next(error);
            }
        };
    }
    static configs = {
        auth: RateLimitMiddleware.create({
            windowMs: 15 * 60 * 1000,
            maxRequests: 5,
            message: 'Too many authentication attempts, please try again later',
            standardHeaders: true,
            legacyHeaders: true,
            keyGenerator: (req) => `auth:${req.ip}:${req.headers['x-user-id'] || 'anonymous'}`
        }),
        api: RateLimitMiddleware.create({
            windowMs: 15 * 60 * 1000,
            maxRequests: 100,
            message: 'API rate limit exceeded, please try again later',
            standardHeaders: true,
            legacyHeaders: true
        }),
        read: RateLimitMiddleware.create({
            windowMs: 15 * 60 * 1000,
            maxRequests: 1000,
            message: 'Read operation rate limit exceeded, please try again later',
            standardHeaders: true,
            legacyHeaders: true
        }),
        write: RateLimitMiddleware.create({
            windowMs: 15 * 60 * 1000,
            maxRequests: 50,
            message: 'Write operation rate limit exceeded, please try again later',
            standardHeaders: true,
            legacyHeaders: true
        }),
        sensitive: RateLimitMiddleware.create({
            windowMs: 60 * 60 * 1000,
            maxRequests: 10,
            message: 'Sensitive operation rate limit exceeded, please try again later',
            standardHeaders: true,
            legacyHeaders: true,
            keyGenerator: (req) => `sensitive:${req.headers['x-user-id'] || req.ip}`
        }),
        upload: RateLimitMiddleware.create({
            windowMs: 60 * 60 * 1000,
            maxRequests: 20,
            message: 'File upload rate limit exceeded, please try again later',
            standardHeaders: true,
            legacyHeaders: true
        }),
        webhook: RateLimitMiddleware.create({
            windowMs: 60 * 1000,
            maxRequests: 100,
            message: 'Webhook rate limit exceeded, please try again later',
            standardHeaders: true,
            legacyHeaders: true,
            keyGenerator: (req) => `webhook:${req.headers['x-webhook-id'] || req.ip}`
        }),
        search: RateLimitMiddleware.create({
            windowMs: 60 * 1000,
            maxRequests: 200,
            message: 'Search rate limit exceeded, please try again later',
            standardHeaders: true,
            legacyHeaders: true
        }),
        reports: RateLimitMiddleware.create({
            windowMs: 60 * 60 * 1000,
            maxRequests: 5,
            message: 'Report generation rate limit exceeded, please try again later',
            standardHeaders: true,
            legacyHeaders: true
        }),
        gdpr: RateLimitMiddleware.create({
            windowMs: 24 * 60 * 60 * 1000,
            maxRequests: 3,
            message: 'GDPR operation rate limit exceeded, please try again tomorrow',
            standardHeaders: true,
            legacyHeaders: true,
            keyGenerator: (req) => `gdpr:${req.headers['x-user-id'] || req.ip}`
        }),
        rls: RateLimitMiddleware.create({
            windowMs: 60 * 60 * 1000,
            maxRequests: 20,
            message: 'RLS operation rate limit exceeded, please try again later',
            standardHeaders: true,
            legacyHeaders: true
        }),
        sepa: RateLimitMiddleware.create({
            windowMs: 60 * 60 * 1000,
            maxRequests: 10,
            message: 'SEPA operation rate limit exceeded, please try again later',
            standardHeaders: true,
            legacyHeaders: true
        })
    };
    static createTieredRateLimit(tier) {
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
    static createOrganizationRateLimit(organizationId, maxRequests = 1000) {
        return RateLimitMiddleware.create({
            windowMs: 15 * 60 * 1000,
            maxRequests,
            message: 'Organization rate limit exceeded, please try again later',
            standardHeaders: true,
            legacyHeaders: true,
            keyGenerator: (req) => `org:${organizationId}`
        });
    }
}
//# sourceMappingURL=rate-limiter.js.map