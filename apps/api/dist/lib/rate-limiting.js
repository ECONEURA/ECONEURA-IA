import { logger } from './logger.js';
import { metrics } from './metrics.js';
export class IntelligentRateLimiter {
    organizations = new Map();
    states = new Map();
    defaultConfig = {
        windowMs: 60000,
        maxRequests: 100,
        strategy: 'sliding-window',
        burstSize: 10,
        refillRate: 1
    };
    constructor() {
        this.initializeDefaultOrganizations();
    }
    initializeDefaultOrganizations() {
        this.addOrganization('demo-org-1', {
            windowMs: 60000,
            maxRequests: 100,
            strategy: 'sliding-window',
            burstSize: 10,
            refillRate: 1
        });
        this.addOrganization('demo-org-2', {
            windowMs: 300000,
            maxRequests: 500,
            strategy: 'token-bucket',
            burstSize: 50,
            refillRate: 2
        });
        this.addOrganization('demo-org-3', {
            windowMs: 60000,
            maxRequests: 50,
            strategy: 'fixed-window',
            burstSize: 5,
            refillRate: 1
        });
        this.addOrganization('premium-org', {
            windowMs: 60000,
            maxRequests: 1000,
            strategy: 'token-bucket',
            burstSize: 100,
            refillRate: 10
        });
    }
    addOrganization(organizationId, config) {
        const fullConfig = {
            ...this.defaultConfig,
            ...config
        };
        const organization = {
            organizationId,
            config: fullConfig,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.organizations.set(organizationId, organization);
        this.states.set(organizationId, {
            tokens: fullConfig.burstSize || fullConfig.maxRequests,
            lastRefill: Date.now(),
            requestCount: 0,
            windowStart: Date.now()
        });
        logger.info('Organization rate limit added', {
            organizationId,
            config: fullConfig
        });
    }
    removeOrganization(organizationId) {
        const removed = this.organizations.delete(organizationId);
        this.states.delete(organizationId);
        if (removed) {
            logger.info('Organization rate limit removed', { organizationId });
        }
        return removed;
    }
    updateOrganization(organizationId, config) {
        const existing = this.organizations.get(organizationId);
        if (!existing) {
            return false;
        }
        const updatedConfig = {
            ...existing.config,
            ...config
        };
        existing.config = updatedConfig;
        existing.updatedAt = new Date();
        this.states.set(organizationId, {
            tokens: updatedConfig.burstSize || updatedConfig.maxRequests,
            lastRefill: Date.now(),
            requestCount: 0,
            windowStart: Date.now()
        });
        logger.info('Organization rate limit updated', {
            organizationId,
            config: updatedConfig
        });
        return true;
    }
    getEffectiveConfig(organizationId) {
        const organization = this.organizations.get(organizationId);
        return organization?.config ?? this.defaultConfig;
    }
    hasOrganization(organizationId) {
        return this.organizations.has(organizationId);
    }
    isAllowed(organizationId, requestId) {
        const organization = this.organizations.get(organizationId);
        if (!organization) {
            return this.isAllowedWithConfig(organizationId, this.defaultConfig, requestId);
        }
        return this.isAllowedWithConfig(organizationId, organization.config, requestId);
    }
    isAllowedWithConfig(organizationId, config, requestId) {
        const state = this.states.get(organizationId);
        if (!state) {
            return { allowed: false, remaining: 0, resetTime: Date.now() + config.windowMs };
        }
        const now = Date.now();
        let allowed = false;
        let remaining = 0;
        let resetTime = now + config.windowMs;
        let retryAfter;
        switch (config.strategy) {
            case 'token-bucket':
                ({ allowed, remaining, resetTime, retryAfter } = this.tokenBucketStrategy(state, config, now));
                break;
            case 'sliding-window':
                ({ allowed, remaining, resetTime } = this.slidingWindowStrategy(state, config, now));
                break;
            case 'fixed-window':
                ({ allowed, remaining, resetTime } = this.fixedWindowStrategy(state, config, now));
                break;
        }
        if (allowed) {
            state.requestCount++;
            if (config.strategy === 'token-bucket') {
                state.tokens = remaining;
                state.lastRefill = now;
            }
        }
        metrics.recordRateLimit(config.strategy, organizationId);
        if (!allowed) {
            logger.warn('Rate limit exceeded', {
                organizationId,
                strategy: config.strategy,
                remaining,
                retryAfter,
                requestId
            });
        }
        return { allowed, remaining, resetTime, retryAfter };
    }
    tokenBucketStrategy(state, config, now) {
        const timePassed = now - state.lastRefill;
        const tokensToAdd = Math.floor(timePassed / 1000) * (config.refillRate || 1);
        state.tokens = Math.min(config.burstSize || config.maxRequests, state.tokens + tokensToAdd);
        const allowed = state.tokens > 0;
        const remaining = allowed ? state.tokens - 1 : 0;
        const resetTime = now + (1000 / (config.refillRate || 1));
        const retryAfter = allowed ? undefined : Math.ceil(1000 / (config.refillRate || 1));
        return { allowed, remaining, resetTime, retryAfter };
    }
    slidingWindowStrategy(state, config, now) {
        const windowStart = now - config.windowMs;
        if (state.windowStart < windowStart) {
            state.requestCount = 0;
            state.windowStart = now;
        }
        const allowed = state.requestCount < config.maxRequests;
        const remaining = Math.max(0, config.maxRequests - state.requestCount);
        const resetTime = state.windowStart + config.windowMs;
        return { allowed, remaining, resetTime };
    }
    fixedWindowStrategy(state, config, now) {
        const currentWindow = Math.floor(now / config.windowMs);
        const stateWindow = Math.floor(state.windowStart / config.windowMs);
        if (currentWindow > stateWindow) {
            state.requestCount = 0;
            state.windowStart = now;
        }
        const allowed = state.requestCount < config.maxRequests;
        const remaining = Math.max(0, config.maxRequests - state.requestCount);
        const resetTime = (currentWindow + 1) * config.windowMs;
        return { allowed, remaining, resetTime };
    }
    getOrganizationStats(organizationId) {
        const organization = this.organizations.get(organizationId);
        const state = this.states.get(organizationId);
        if (!organization || !state) {
            return null;
        }
        const stats = {
            totalRequests: state.requestCount,
            currentTokens: state.tokens,
            lastRefill: new Date(state.lastRefill).toISOString(),
            windowStart: new Date(state.windowStart).toISOString(),
            utilization: (state.requestCount / organization.config.maxRequests) * 100
        };
        return { config: organization.config, state, stats };
    }
    getAllOrganizations() {
        return Array.from(this.organizations.values());
    }
    resetOrganization(organizationId) {
        const organization = this.organizations.get(organizationId);
        if (!organization) {
            return false;
        }
        this.states.set(organizationId, {
            tokens: organization.config.burstSize || organization.config.maxRequests,
            lastRefill: Date.now(),
            requestCount: 0,
            windowStart: Date.now()
        });
        logger.info('Organization rate limit reset', { organizationId });
        return true;
    }
    getGlobalStats() {
        const organizations = Array.from(this.organizations.values());
        const states = Array.from(this.states.values());
        return {
            totalOrganizations: organizations.length,
            totalRequests: states.reduce((sum, state) => sum + state.requestCount, 0),
            averageUtilization: states.length === 0 ? 0 : states.reduce((sum, state) => {
                const org = organizations.find(o => this.states.get(o.organizationId) === state);
                const max = org?.config.maxRequests || this.defaultConfig.maxRequests;
                return sum + (state.requestCount / Math.max(1, max)) * 100;
            }, 0) / states.length,
            strategies: {
                'token-bucket': organizations.filter(o => o.config.strategy === 'token-bucket').length,
                'sliding-window': organizations.filter(o => o.config.strategy === 'sliding-window').length,
                'fixed-window': organizations.filter(o => o.config.strategy === 'fixed-window').length
            }
        };
    }
}
export const rateLimiter = new IntelligentRateLimiter();
//# sourceMappingURL=rate-limiting.js.map