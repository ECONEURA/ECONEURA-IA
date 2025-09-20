import { rateLimiter } from '../lib/rate-limiting.js';
import { logger } from '../lib/logger.js';
export function rateLimitMiddleware(req, res, next) {
    if (process.env.NODE_ENV === 'test' || process.env.RATE_LIMIT_DISABLED === 'true') {
        return next();
    }
    if (req.path === '/health' || req.path.startsWith('/v1/health') || req.path.startsWith('/metrics')) {
        return next();
    }
    const organizationId = req.headers['x-organization-id'] ||
        req.query.organizationId ||
        'default-org';
    const requestId = req.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    if (!rateLimiter.hasOrganization(organizationId)) {
        rateLimiter.addOrganization(organizationId, {});
    }
    const result = rateLimiter.isAllowed(organizationId, requestId);
    const cfg = rateLimiter.getEffectiveConfig(organizationId);
    res.set({
        'X-RateLimit-Limit': String(cfg.maxRequests),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
        'X-RateLimit-Strategy': cfg.strategy
    });
    if (result.retryAfter) {
        res.set('Retry-After', result.retryAfter.toString());
    }
    if (!result.allowed) {
        logger.warn('Rate limit exceeded', {
            organizationId,
            requestId,
            remaining: result.remaining,
            resetTime: new Date(result.resetTime).toISOString(),
            retryAfter: result.retryAfter || 0,
            method: req.method,
            path: req.path,
            ip: req.ip
        });
        res.status(429).json({
            error: 'Rate limit exceeded',
            message: 'Too many requests',
            retryAfter: result.retryAfter,
            resetTime: new Date(result.resetTime).toISOString(),
            requestId
        });
        return;
    }
    logger.debug('Rate limit check passed', {
        organizationId,
        requestId,
        remaining: result.remaining,
        method: req.method,
        path: req.path
    });
    req.organizationId = organizationId;
    req.requestId = requestId;
    next();
}
export function rateLimitByEndpoint(req, res, next) {
    const organizationId = req.organizationId || 'default-org';
    const endpoint = req.path;
    const method = req.method;
    const endpointOrgId = `${organizationId}:${method}:${endpoint}`;
    const endpointConfig = {
        windowMs: 60000,
        maxRequests: 50,
        strategy: 'sliding-window'
    };
    if (!rateLimiter.hasOrganization(endpointOrgId)) {
        rateLimiter.addOrganization(endpointOrgId, endpointConfig);
    }
    const result = rateLimiter.isAllowed(endpointOrgId, req.requestId || 'unknown');
    if (!result.allowed) {
        logger.warn('Endpoint rate limit exceeded', {
            organizationId,
            endpoint,
            method,
            requestId: req.requestId,
            remaining: result.remaining
        });
        res.status(429).json({
            error: 'Endpoint rate limit exceeded',
            message: `Too many requests to ${method} ${endpoint}`,
            retryAfter: result.retryAfter,
            resetTime: new Date(result.resetTime).toISOString(),
            requestId: req.requestId
        });
        return;
    }
    next();
}
export function rateLimitByUser(req, res, next) {
    const userId = req.headers['x-user-id'] ||
        req.query.userId ||
        req.ip;
    const organizationId = req.organizationId || 'default-org';
    const userOrgId = `${organizationId}:user:${userId}`;
    const userConfig = {
        windowMs: 60000,
        maxRequests: 30,
        strategy: 'token-bucket',
        burstSize: 5,
        refillRate: 1
    };
    if (!rateLimiter.hasOrganization(userOrgId)) {
        rateLimiter.addOrganization(userOrgId, userConfig);
    }
    const result = rateLimiter.isAllowed(userOrgId, req.requestId || 'unknown');
    if (!result.allowed) {
        logger.warn('User rate limit exceeded', {
            organizationId,
            userId,
            requestId: req.requestId,
            remaining: result.remaining
        });
        res.status(429).json({
            error: 'User rate limit exceeded',
            message: 'Too many requests from this user',
            retryAfter: result.retryAfter,
            resetTime: new Date(result.resetTime).toISOString(),
            requestId: req.requestId
        });
        return;
    }
    next();
}
export function rateLimitByApiKey(req, res, next) {
    const apiKey = req.headers.authorization?.replace('Bearer ', '') ||
        req.headers['x-api-key'];
    if (!apiKey) {
        next();
        return;
    }
    const organizationId = req.organizationId || 'default-org';
    const apiKeyOrgId = `${organizationId}:apikey:${apiKey}`;
    const apiKeyConfig = {
        windowMs: 60000,
        maxRequests: 200,
        strategy: 'sliding-window'
    };
    if (!rateLimiter.hasOrganization(apiKeyOrgId)) {
        rateLimiter.addOrganization(apiKeyOrgId, apiKeyConfig);
    }
    const result = rateLimiter.isAllowed(apiKeyOrgId, req.requestId || 'unknown');
    if (!result.allowed) {
        logger.warn('API key rate limit exceeded', {
            organizationId,
            apiKey: apiKey.substring(0, 8) + '...',
            requestId: req.requestId,
            remaining: result.remaining
        });
        res.status(429).json({
            error: 'API key rate limit exceeded',
            message: 'Too many requests with this API key',
            retryAfter: result.retryAfter,
            resetTime: new Date(result.resetTime).toISOString(),
            requestId: req.requestId
        });
        return;
    }
    next();
}
//# sourceMappingURL=rate-limiting.js.map