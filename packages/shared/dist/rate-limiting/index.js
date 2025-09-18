import { z } from 'zod';
export const RateLimitConfigSchema = z.object({
    windowMs: z.number().min(1000).default(60000),
    maxRequests: z.number().min(1).default(100),
    keyGenerator: z.function().optional(),
    skipSuccessfulRequests: z.boolean().default(false),
    skipFailedRequests: z.boolean().default(false),
    message: z.string().default('Too many requests, please try again later.'),
    standardHeaders: z.boolean().default(true),
    legacyHeaders: z.boolean().default(false),
    handler: z.function().optional(),
    onLimitReached: z.function().optional()
});
export const RateLimitRuleSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    windowMs: z.number().min(1000),
    maxRequests: z.number().min(1),
    keyType: z.enum(['ip', 'api_key', 'user', 'custom']),
    keyField: z.string().optional(),
    conditions: z.record(z.any()).default({}),
    message: z.string().optional(),
    enabled: z.boolean().default(true)
});
export const RateLimitResultSchema = z.object({
    allowed: z.boolean(),
    remaining: z.number().min(0),
    resetTime: z.number(),
    totalHits: z.number().min(0),
    windowStart: z.number(),
    windowEnd: z.number(),
    key: z.string(),
    rule: z.string()
});
export class MemoryRateLimitStore {
    store = new Map();
    timers = new Map();
    async get(key) {
        return this.store.get(key) || null;
    }
    async set(key, entry, ttl) {
        this.store.set(key, entry);
        const existingTimer = this.timers.get(key);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }
        const timer = setTimeout(() => {
            this.store.delete(key);
            this.timers.delete(key);
        }, ttl);
        this.timers.set(key, timer);
    }
    async delete(key) {
        this.store.delete(key);
        const timer = this.timers.get(key);
        if (timer) {
            clearTimeout(timer);
            this.timers.delete(key);
        }
    }
    async clear() {
        this.store.clear();
        this.timers.forEach(timer => clearTimeout(timer));
        this.timers.clear();
    }
    getStats() {
        return {
            totalKeys: this.store.size,
            memoryUsage: this.store.size * 100
        };
    }
}
export class RateLimiter {
    config;
    store;
    rules = new Map();
    constructor(config = {}, store) {
        this.config = RateLimitConfigSchema.parse(config);
        this.store = store || new MemoryRateLimitStore();
    }
    addRule(rule) {
        const validatedRule = RateLimitRuleSchema.parse(rule);
        this.rules.set(validatedRule.id, validatedRule);
    }
    removeRule(ruleId) {
        return this.rules.delete(ruleId);
    }
    getRule(ruleId) {
        return this.rules.get(ruleId);
    }
    getAllRules() {
        return Array.from(this.rules.values());
    }
    async checkLimit(request, ruleId) {
        const rule = ruleId ? this.rules.get(ruleId) : this.getDefaultRule();
        if (!rule || !rule.enabled) {
            return this.createAllowedResult(request, rule);
        }
        const key = this.generateKey(request, rule);
        const now = Date.now();
        const windowStart = this.calculateWindowStart(now, rule.windowMs);
        const windowEnd = windowStart + rule.windowMs;
        const existing = await this.store.get(key);
        if (!existing || existing.windowStart !== windowStart) {
            const newEntry = {
                count: 1,
                windowStart,
                windowEnd,
                firstRequest: now,
                lastRequest: now
            };
            await this.store.set(key, newEntry, rule.windowMs);
            return {
                allowed: true,
                remaining: rule.maxRequests - 1,
                resetTime: windowEnd,
                totalHits: 1,
                windowStart,
                windowEnd,
                key,
                rule: rule.id
            };
        }
        if (existing.count >= rule.maxRequests) {
            const result = {
                allowed: false,
                remaining: 0,
                resetTime: windowEnd,
                totalHits: existing.count,
                windowStart: existing.windowStart,
                windowEnd: existing.windowEnd,
                key,
                rule: rule.id
            };
            if (this.config.onLimitReached) {
                this.config.onLimitReached(request, result);
            }
            return result;
        }
        const updatedEntry = {
            ...existing,
            count: existing.count + 1,
            lastRequest: now
        };
        await this.store.set(key, updatedEntry, rule.windowMs);
        return {
            allowed: true,
            remaining: rule.maxRequests - updatedEntry.count,
            resetTime: windowEnd,
            totalHits: updatedEntry.count,
            windowStart: existing.windowStart,
            windowEnd: existing.windowEnd,
            key,
            rule: rule.id
        };
    }
    generateKey(request, rule) {
        switch (rule.keyType) {
            case 'ip':
                return `ip:${request.ip || 'unknown'}`;
            case 'api_key':
                return `api_key:${request.apiKey || 'unknown'}`;
            case 'user':
                return `user:${request.userId || 'anonymous'}`;
            case 'custom':
                if (rule.keyField && request.customKey) {
                    return `custom:${rule.keyField}:${request.customKey}`;
                }
                return `custom:${request.customKey || 'unknown'}`;
            default:
                return `default:${request.ip || 'unknown'}`;
        }
    }
    calculateWindowStart(now, windowMs) {
        return Math.floor(now / windowMs) * windowMs;
    }
    getDefaultRule() {
        return {
            id: 'default',
            name: 'Default Rate Limit',
            windowMs: this.config.windowMs,
            maxRequests: this.config.maxRequests,
            keyType: 'ip',
            enabled: true
        };
    }
    createAllowedResult(request, rule) {
        const now = Date.now();
        const windowMs = rule?.windowMs || this.config.windowMs;
        const maxRequests = rule?.maxRequests || this.config.maxRequests;
        const windowStart = this.calculateWindowStart(now, windowMs);
        const windowEnd = windowStart + windowMs;
        return {
            allowed: true,
            remaining: maxRequests,
            resetTime: windowEnd,
            totalHits: 0,
            windowStart,
            windowEnd,
            key: this.generateKey(request, rule || this.getDefaultRule()),
            rule: rule?.id || 'default'
        };
    }
    async resetLimit(key) {
        await this.store.delete(key);
    }
    async getLimitInfo(key) {
        return this.store.get(key);
    }
    async clearAllLimits() {
        await this.store.clear();
    }
    getStats() {
        return {
            rules: this.rules.size,
            storeStats: this.store instanceof MemoryRateLimitStore
                ? this.store.getStats()
                : { totalKeys: 'unknown', memoryUsage: 'unknown' }
        };
    }
}
export function createRateLimitMiddleware(limiter, ruleId) {
    return async (req, res, next) => {
        try {
            const request = {
                ip: req.ip || req.connection.remoteAddress,
                apiKey: req.headers['x-api-key'],
                userId: req.user?.id,
                customKey: req.headers['x-custom-key'],
                headers: req.headers,
                method: req.method,
                path: req.path
            };
            const result = await limiter.checkLimit(request, ruleId);
            req.rateLimit = result;
            if (limiter.config.standardHeaders) {
                res.set({
                    'X-RateLimit-Limit': result.rule,
                    'X-RateLimit-Remaining': result.remaining.toString(),
                    'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
                    'X-RateLimit-Window': result.windowEnd.toString()
                });
            }
            if (limiter.config.legacyHeaders) {
                res.set({
                    'X-RateLimit-Limit': result.rule,
                    'X-RateLimit-Remaining': result.remaining.toString(),
                    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString()
                });
            }
            if (!result.allowed) {
                const message = limiter.getRule(ruleId || 'default')?.message ||
                    limiter.config.message;
                if (limiter.config.handler) {
                    limiter.config.handler(req, res, next);
                }
                else {
                    res.status(429).json({
                        error: 'Rate limit exceeded',
                        message,
                        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
                        limit: result.rule,
                        remaining: result.remaining,
                        resetTime: result.resetTime
                    });
                }
                return;
            }
            next();
        }
        catch (error) {
            console.error('Rate limiting error:', error);
            next();
        }
    };
}
export const RateLimitPresets = {
    api: {
        windowMs: 15 * 60 * 1000,
        maxRequests: 1000,
        message: 'API rate limit exceeded'
    },
    strict: {
        windowMs: 15 * 60 * 1000,
        maxRequests: 100,
        message: 'Rate limit exceeded for sensitive endpoint'
    },
    login: {
        windowMs: 15 * 60 * 1000,
        maxRequests: 5,
        message: 'Too many login attempts, please try again later'
    },
    passwordReset: {
        windowMs: 60 * 60 * 1000,
        maxRequests: 3,
        message: 'Too many password reset attempts'
    },
    upload: {
        windowMs: 60 * 60 * 1000,
        maxRequests: 10,
        message: 'File upload rate limit exceeded'
    },
    ai: {
        windowMs: 60 * 1000,
        maxRequests: 10,
        message: 'AI endpoint rate limit exceeded'
    }
};
export function createRateLimiter(config = {}, store) {
    return new RateLimiter(config, store);
}
export function createPresetRateLimiter(preset, store) {
    const config = RateLimitPresets[preset];
    return new RateLimiter(config, store);
}
export default RateLimiter;
//# sourceMappingURL=index.js.map