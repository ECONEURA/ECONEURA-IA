import rateLimit from 'express-rate-limit';
import { structuredLogger } from '../lib/structured-logger.js';
import { getDatabaseService } from '@econeura/db';
import { eq } from 'drizzle-orm';
import { organizations } from '@econeura/db/schema';
const orgRateLimits = new Map();
const rateLimitMetrics = new Map();
setInterval(() => {
    const now = Date.now();
    for (const [key, limit] of orgRateLimits.entries()) {
        if (limit.resetTime < now) {
            orgRateLimits.delete(key);
        }
    }
}, 60000);
const SUBSCRIPTION_LIMITS = {
    'enterprise': {
        requests: 10000,
        windowMs: 15 * 60 * 1000,
        burstLimit: 100,
        aiRequests: 1000,
        priority: 1
    },
    'pro': {
        requests: 5000,
        windowMs: 15 * 60 * 1000,
        burstLimit: 50,
        aiRequests: 500,
        priority: 2
    },
    'basic': {
        requests: 1000,
        windowMs: 15 * 60 * 1000,
        burstLimit: 20,
        aiRequests: 100,
        priority: 3
    },
    'free': {
        requests: 100,
        windowMs: 15 * 60 * 1000,
        burstLimit: 5,
        aiRequests: 10,
        priority: 4
    },
    'demo': {
        requests: 50,
        windowMs: 15 * 60 * 1000,
        burstLimit: 3,
        aiRequests: 5,
        priority: 5
    }
};
async function getOrgRateLimitConfig(orgId) {
    try {
        const db = getDatabaseService().getDatabase();
        const org = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
        if (org.length === 0) {
            return SUBSCRIPTION_LIMITS.free;
        }
        const subscriptionTier = org[0].subscriptionTier;
        return SUBSCRIPTION_LIMITS[subscriptionTier] || SUBSCRIPTION_LIMITS.free;
    }
    catch (error) {
        structuredLogger.error('Failed to get organization rate limit config', error);
        return SUBSCRIPTION_LIMITS.free;
    }
}
async function checkOrgRateLimit(orgId, endpoint) {
    const now = Date.now();
    const config = await getOrgRateLimitConfig(orgId);
    const orgLimit = orgRateLimits.get(orgId);
    if (!orgLimit || orgLimit.resetTime < now) {
        const newLimit = {
            organizationId: orgId,
            subscriptionTier: config.priority.toString(),
            requests: 1,
            resetTime: now + config.windowMs,
            lastRequest: now,
            blockedRequests: 0,
            totalRequests: 1
        };
        orgRateLimits.set(orgId, newLimit);
        return {
            allowed: true,
            remaining: config.requests - 1,
            resetTime: newLimit.resetTime,
            tier: config.priority.toString(),
            burstAllowed: true
        };
    }
    const timeSinceLastRequest = now - orgLimit.lastRequest;
    const burstAllowed = timeSinceLastRequest > (60000 / config.burstLimit);
    if (orgLimit.requests >= config.requests) {
        orgLimit.blockedRequests++;
        orgLimit.totalRequests++;
        return {
            allowed: false,
            remaining: 0,
            resetTime: orgLimit.resetTime,
            tier: config.priority.toString(),
            burstAllowed: false
        };
    }
    orgLimit.requests++;
    orgLimit.lastRequest = now;
    orgLimit.totalRequests++;
    return {
        allowed: true,
        remaining: config.requests - orgLimit.requests,
        resetTime: orgLimit.resetTime,
        tier: config.priority.toString(),
        burstAllowed
    };
}
function getRateLimitMetrics(orgId) {
    const orgLimit = orgRateLimits.get(orgId);
    if (!orgLimit)
        return null;
    const metrics = rateLimitMetrics.get(orgId) || {
        totalRequests: 0,
        blockedRequests: 0,
        averageResponseTime: 0,
        peakRequestsPerMinute: 0,
        lastReset: Date.now()
    };
    return {
        ...metrics,
        totalRequests: orgLimit.totalRequests,
        blockedRequests: orgLimit.blockedRequests
    };
}
export const rateLimitOrg = async (req, res, next) => {
    const startTime = Date.now();
    const orgId = req.headers['x-org-id'];
    const endpoint = req.path;
    const method = req.method;
    if (!orgId) {
        return res.status(400).json({
            error: 'Missing x-org-id header',
            timestamp: new Date().toISOString()
        });
    }
    try {
        const rateLimitResult = await checkOrgRateLimit(orgId, endpoint);
        res.set({
            'X-RateLimit-Limit': rateLimitResult.remaining + rateLimitResult.remaining,
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
            'X-RateLimit-Tier': rateLimitResult.tier,
            'X-RateLimit-Burst-Allowed': rateLimitResult.burstAllowed.toString()
        });
        if (!rateLimitResult.allowed) {
            const processingTime = Date.now() - startTime;
            structuredLogger.warn('Rate limit exceeded', {
                orgId,
                endpoint,
                method,
                tier: rateLimitResult.tier,
                remaining: rateLimitResult.remaining,
                resetTime: rateLimitResult.resetTime,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                processingTime
            });
            return res.status(429).json({
                error: 'Rate limit exceeded',
                message: `Organization ${orgId} has exceeded the rate limit`,
                tier: rateLimitResult.tier,
                remaining: rateLimitResult.remaining,
                resetTime: new Date(rateLimitResult.resetTime).toISOString(),
                retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
                timestamp: new Date().toISOString()
            });
        }
        const processingTime = Date.now() - startTime;
        structuredLogger.info('Rate limit check passed', {
            orgId,
            endpoint,
            method,
            tier: rateLimitResult.tier,
            remaining: rateLimitResult.remaining,
            burstAllowed: rateLimitResult.burstAllowed,
            processingTime
        });
        next();
    }
    catch (error) {
        const processingTime = Date.now() - startTime;
        structuredLogger.error('Rate limit check failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            orgId,
            endpoint,
            method,
            processingTime
        });
        next();
    }
};
export const standardRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        structuredLogger.warn('Standard rate limit exceeded', {
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
        res.status(429).json({
            error: 'Too many requests',
            message: 'Rate limit exceeded. Please try again later.',
            retryAfter: 15 * 60
        });
    }
});
export const budgetGuard = (req, res, next) => {
    const orgId = req.headers['x-org-id'];
    const estimatedCost = req.headers['x-est-cost-eur'];
    if (!orgId) {
        return next();
    }
    const budget = getOrgBudget(orgId);
    const currentUsage = getOrgUsage(orgId);
    const cost = parseFloat(estimatedCost) || 0;
    if (currentUsage + cost > budget) {
        structuredLogger.warn('Budget exceeded', {
            orgId,
            budget,
            currentUsage,
            estimatedCost: cost
        });
        return res.status(429).json({
            error: 'Budget exceeded',
            message: `Organization ${orgId} has exceeded its budget`,
            budget,
            currentUsage,
            estimatedCost: cost
        });
    }
    next();
};
function getOrgBudget(orgId) {
    const budgets = {
        'enterprise': 1000,
        'business': 500,
        'starter': 100,
        'demo': 10
    };
    return budgets[orgId] || budgets.starter;
}
function getOrgUsage(orgId) {
    return Math.random() * 50;
}
export const endpointRateLimit = (maxRequests, windowMs = 15 * 60 * 1000) => {
    return rateLimit({
        windowMs,
        max: maxRequests,
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req) => {
            const orgId = req.headers['x-org-id'];
            const endpoint = req.path;
            return `${orgId}:${endpoint}`;
        },
        handler: (req, res) => {
            const orgId = req.headers['x-org-id'];
            const endpoint = req.path;
            structuredLogger.warn('Endpoint rate limit exceeded', {
                orgId,
                endpoint,
                maxRequests,
                windowMs
            });
            res.status(429).json({
                error: 'Endpoint rate limit exceeded',
                message: `Too many requests to ${endpoint}`,
                retryAfter: Math.ceil(windowMs / 1000)
            });
        }
    });
};
export const userRateLimit = (maxRequests, windowMs = 15 * 60 * 1000) => {
    return rateLimit({
        windowMs,
        max: maxRequests,
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req) => {
            const orgId = req.headers['x-org-id'];
            const userId = req.headers['x-user-id'];
            return `${orgId}:${userId}`;
        },
        handler: (req, res) => {
            const orgId = req.headers['x-org-id'];
            const userId = req.headers['x-user-id'];
            structuredLogger.warn('User rate limit exceeded', {
                orgId,
                userId,
                maxRequests,
                windowMs
            });
            res.status(429).json({
                error: 'User rate limit exceeded',
                message: `User ${userId} has exceeded the rate limit`,
                retryAfter: Math.ceil(windowMs / 1000)
            });
        }
    });
};
//# sourceMappingURL=rate-limit-org.js.map