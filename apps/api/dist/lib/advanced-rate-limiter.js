import { logger } from './logger.js';
import { prometheus } from '../middleware/observability.js';
export class AdvancedRateLimiter {
    rules = new Map();
    requestCounts = new Map();
    stats;
    cleanupInterval;
    requestHistory = [];
    constructor() {
        this.stats = {
            totalRequests: 0,
            allowedRequests: 0,
            blockedRequests: 0,
            averageResponseTime: 0,
            peakRequestsPerSecond: 0,
            currentRequestsPerSecond: 0
        };
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 60000);
        logger.info('Advanced Rate Limiter initialized', {
            features: [
                'multiple_rules',
                'pattern_matching',
                'priority_system',
                'statistics',
                'prometheus_metrics',
                'cleanup_automation'
            ]
        });
    }
    registerRule(rule) {
        this.rules.set(rule.id, rule);
        logger.info('Rate limit rule registered', {
            id: rule.id,
            name: rule.name,
            pattern: rule.pattern,
            maxRequests: rule.config.maxRequests,
            windowMs: rule.config.windowMs,
            enabled: rule.enabled,
            priority: rule.priority
        });
    }
    unregisterRule(ruleId) {
        const rule = this.rules.get(ruleId);
        if (rule) {
            this.rules.delete(ruleId);
            logger.info('Rate limit rule unregistered', { id: ruleId });
        }
    }
    async checkLimit(req, res) {
        const startTime = Date.now();
        try {
            const rule = this.findMatchingRule(req);
            if (!rule || !rule.enabled) {
                return { allowed: true };
            }
            const key = this.generateKey(req, rule);
            const current = this.requestCounts.get(key);
            const now = Date.now();
            const windowStart = now - rule.config.windowMs;
            let count = 0;
            let resetTime = now + rule.config.windowMs;
            if (current && current.resetTime > now) {
                count = current.count;
                resetTime = current.resetTime;
            }
            if (count >= rule.config.maxRequests) {
                this.stats.blockedRequests++;
                this.recordRequest(false, startTime);
                this.recordMetrics(rule.id, false, Date.now() - startTime);
                this.setRateLimitHeaders(res, {
                    limit: rule.config.maxRequests,
                    remaining: 0,
                    reset: new Date(resetTime),
                    retryAfter: Math.ceil((resetTime - now) / 1000)
                });
                if (rule.config.onLimitReached) {
                    rule.config.onLimitReached(req, res);
                }
                logger.warn('Rate limit exceeded', {
                    ruleId: rule.id,
                    key,
                    count,
                    limit: rule.config.maxRequests,
                    resetTime: new Date(resetTime).toISOString()
                });
                return {
                    allowed: false,
                    info: {
                        limit: rule.config.maxRequests,
                        remaining: 0,
                        reset: new Date(resetTime),
                        retryAfter: Math.ceil((resetTime - now) / 1000)
                    }
                };
            }
            this.requestCounts.set(key, {
                count: count + 1,
                resetTime
            });
            this.stats.allowedRequests++;
            this.recordRequest(true, startTime);
            this.recordMetrics(rule.id, true, Date.now() - startTime);
            this.setRateLimitHeaders(res, {
                limit: rule.config.maxRequests,
                remaining: rule.config.maxRequests - count - 1,
                reset: new Date(resetTime)
            });
            logger.debug('Rate limit check passed', {
                ruleId: rule.id,
                key,
                count: count + 1,
                limit: rule.config.maxRequests,
                remaining: rule.config.maxRequests - count - 1
            });
            return {
                allowed: true,
                info: {
                    limit: rule.config.maxRequests,
                    remaining: rule.config.maxRequests - count - 1,
                    reset: new Date(resetTime)
                }
            };
        }
        catch (error) {
            logger.error('Rate limit check failed', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return { allowed: true };
        }
    }
    findMatchingRule(req) {
        const rules = Array.from(this.rules.values())
            .filter(rule => rule.enabled)
            .sort((a, b) => b.priority - a.priority);
        for (const rule of rules) {
            if (this.matchesPattern(req, rule.pattern)) {
                return rule;
            }
        }
        return null;
    }
    matchesPattern(req, pattern) {
        try {
            return req.path.includes(pattern) || req.url.includes(pattern);
        }
        catch (error) {
            logger.error('Pattern matching failed', {
                pattern,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return false;
        }
    }
    generateKey(req, rule) {
        if (rule.config.keyGenerator) {
            return rule.config.keyGenerator(req);
        }
        const ip = req.ip || req.connection?.remoteAddress || 'unknown';
        const userAgent = req.get('User-Agent') || 'unknown';
        const path = req.path || req.url || 'unknown';
        return `${rule.id}:${ip}:${path}:${userAgent}`;
    }
    setRateLimitHeaders(res, info) {
        if (res.setHeader) {
            res.setHeader('X-RateLimit-Limit', info.limit);
            res.setHeader('X-RateLimit-Remaining', info.remaining);
            res.setHeader('X-RateLimit-Reset', Math.ceil(info.reset.getTime() / 1000));
            if (info.retryAfter) {
                res.setHeader('Retry-After', info.retryAfter);
            }
            res.setHeader('X-RateLimit-Limit', info.limit);
            res.setHeader('X-RateLimit-Remaining', info.remaining);
            res.setHeader('X-RateLimit-Reset', Math.ceil(info.reset.getTime() / 1000));
        }
    }
    recordRequest(allowed, startTime) {
        this.stats.totalRequests++;
        const now = Date.now();
        this.requestHistory.push({ timestamp: now, allowed });
        const cutoff = now - 60000;
        this.requestHistory = this.requestHistory.filter(r => r.timestamp > cutoff);
        this.stats.currentRequestsPerSecond = this.requestHistory.length;
        if (this.stats.currentRequestsPerSecond > this.stats.peakRequestsPerSecond) {
            this.stats.peakRequestsPerSecond = this.stats.currentRequestsPerSecond;
        }
    }
    recordMetrics(ruleId, allowed, duration) {
        if (allowed) {
            prometheus.rateLimitAllowed.inc({ ruleId });
        }
        else {
            prometheus.rateLimitBlocked.inc({ ruleId });
        }
        prometheus.rateLimitDuration.observe({ ruleId }, duration / 1000);
        prometheus.rateLimitTotal.inc({ ruleId });
    }
    cleanup() {
        const now = Date.now();
        let cleanedCount = 0;
        for (const [key, entry] of this.requestCounts.entries()) {
            if (entry.resetTime <= now) {
                this.requestCounts.delete(key);
                cleanedCount++;
            }
        }
        if (cleanedCount > 0) {
            logger.debug('Rate limiter cleanup completed', { entriesCleaned: cleanedCount });
        }
    }
    getStats() {
        return { ...this.stats };
    }
    getRule(ruleId) {
        return this.rules.get(ruleId);
    }
    getAllRules() {
        return Array.from(this.rules.values());
    }
    toggleRule(ruleId, enabled) {
        const rule = this.rules.get(ruleId);
        if (rule) {
            rule.enabled = enabled;
            logger.info('Rate limit rule toggled', { ruleId, enabled });
        }
    }
    resetLimit(key) {
        this.requestCounts.delete(key);
        logger.info('Rate limit reset', { key });
    }
    resetAllLimits() {
        this.requestCounts.clear();
        logger.info('All rate limits reset');
    }
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.rules.clear();
        this.requestCounts.clear();
        this.requestHistory = [];
        logger.info('Advanced Rate Limiter destroyed');
    }
}
export const rateLimitMetrics = {
    rateLimitTotal: new prometheus.Counter({
        name: 'econeura_rate_limit_total',
        help: 'Total number of rate limit checks',
        labelNames: ['ruleId']
    }),
    rateLimitAllowed: new prometheus.Counter({
        name: 'econeura_rate_limit_allowed_total',
        help: 'Total number of allowed requests',
        labelNames: ['ruleId']
    }),
    rateLimitBlocked: new prometheus.Counter({
        name: 'econeura_rate_limit_blocked_total',
        help: 'Total number of blocked requests',
        labelNames: ['ruleId']
    }),
    rateLimitDuration: new prometheus.Histogram({
        name: 'econeura_rate_limit_duration_seconds',
        help: 'Rate limit check duration in seconds',
        labelNames: ['ruleId'],
        buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1]
    })
};
export const advancedRateLimiter = new AdvancedRateLimiter();
//# sourceMappingURL=advanced-rate-limiter.js.map