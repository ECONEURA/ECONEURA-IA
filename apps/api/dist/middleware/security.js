import { securityManagerService } from '../lib/security-manager.service.js';
import { structuredLogger } from '../lib/structured-logger.js';
export const rateLimitMiddleware = (maxRequests) => {
    return (req, res, next) => {
        const key = req.ip || 'unknown';
        if (securityManagerService.isIPBlocked(key)) {
            res.status(403).json({
                success: false,
                error: 'IP blocked due to security violations'
            });
            return;
        }
        const rateLimitResult = securityManagerService.checkRateLimit(key, maxRequests);
        if (!rateLimitResult.allowed) {
            res.set({
                'X-RateLimit-Limit': maxRequests || 100,
                'X-RateLimit-Remaining': rateLimitResult.remaining,
                'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
                'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
            });
            res.status(429).json({
                success: false,
                error: 'Rate limit exceeded',
                retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
            });
            return;
        }
        res.set({
            'X-RateLimit-Limit': maxRequests || 100,
            'X-RateLimit-Remaining': rateLimitResult.remaining,
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString()
        });
        next();
    };
};
export const jwtAuthMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
            success: false,
            error: 'Authentication required',
            code: 'UNAUTHORIZED'
        });
        return;
    }
    const token = authHeader.substring(7);
    try {
        const payload = securityManagerService.verifyToken(token, 'access');
        req.user = {
            id: payload.userId,
            organizationId: payload.organizationId,
            roles: payload.roles || [],
            permissions: payload.permissions || []
        };
        next();
    }
    catch (error) {
        res.status(401).json({
            success: false,
            error: 'Invalid or expired token',
            code: 'INVALID_TOKEN'
        });
    }
};
export const csrfMiddleware = (req, res, next) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        const token = req.headers['x-csrf-token'];
        const sessionToken = req.session?.csrfToken;
        if (!securityManagerService.verifyCSRFToken(token, sessionToken)) {
            res.status(403).json({
                success: false,
                error: 'CSRF token validation failed',
                code: 'CSRF_ERROR'
            });
            return;
        }
    }
    next();
};
export const sanitizeMiddleware = (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
        req.body = sanitizeObject(req.body);
    }
    if (req.query && typeof req.query === 'object') {
        req.query = sanitizeObject(req.query);
    }
    if (req.params && typeof req.params === 'object') {
        req.params = sanitizeObject(req.params);
    }
    next();
};
export const securityHeadersMiddleware = (req, res, next) => {
    res.setHeader('Content-Security-Policy', "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: https:; " +
        "font-src 'self' data:; " +
        "connect-src 'self' https:; " +
        "frame-ancestors 'none';");
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
    if (process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
    next();
};
export const ipFilterMiddleware = (whitelist, blacklist) => {
    return (req, res, next) => {
        const ip = req.ip || req.connection.remoteAddress || 'unknown';
        if (blacklist && blacklist.includes(ip)) {
            securityManagerService.recordSecurityEvent({
                type: 'authorization',
                severity: 'high',
                source: { ip, userAgent: req.headers['user-agent'] || 'unknown' },
                details: { reason: 'IP in blacklist', endpoint: req.path, method: req.method },
                blocked: true,
                action: 'blocked'
            });
            res.status(403).json({
                success: false,
                error: 'Access denied'
            });
            return;
        }
        if (whitelist && !whitelist.includes(ip)) {
            securityManagerService.recordSecurityEvent({
                type: 'authorization',
                severity: 'medium',
                source: { ip, userAgent: req.headers['user-agent'] || 'unknown' },
                details: { reason: 'IP not in whitelist', endpoint: req.path, method: req.method },
                blocked: true,
                action: 'blocked'
            });
            res.status(403).json({
                success: false,
                error: 'Access denied'
            });
            return;
        }
        next();
    };
};
export const requestSizeLimiter = (maxSize = 1024 * 1024) => {
    return (req, res, next) => {
        const contentLength = parseInt(req.headers['content-length'] || '0');
        if (contentLength > maxSize) {
            securityManagerService.recordSecurityEvent({
                type: 'suspicious_activity',
                severity: 'medium',
                source: {
                    ip: req.ip || 'unknown',
                    userAgent: req.headers['user-agent'] || 'unknown'
                },
                details: {
                    reason: 'Request too large',
                    endpoint: req.path,
                    method: req.method,
                    metadata: { size: contentLength, maxSize }
                },
                blocked: true,
                action: 'blocked'
            });
            res.status(413).json({
                success: false,
                error: 'Request entity too large'
            });
            return;
        }
        next();
    };
};
export const suspiciousActivityMiddleware = (req, res, next) => {
    const ip = req.ip || 'unknown';
    const userAgent = req.headers['user-agent'] || '';
    const suspiciousPatterns = [
        /bot/i,
        /crawler/i,
        /spider/i,
        /scraper/i,
        /curl/i,
        /wget/i,
        /python/i,
        /java/i
    ];
    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));
    if (isSuspicious) {
        securityManagerService.recordSecurityEvent({
            type: 'suspicious_activity',
            severity: 'low',
            source: { ip, userAgent },
            details: {
                reason: 'Suspicious user agent detected',
                endpoint: req.path,
                method: req.method,
                metadata: { userAgent }
            },
            blocked: false,
            action: 'logged'
        });
    }
    const now = Date.now();
    const requestKey = `${ip}_${req.path}`;
    if (req.method !== 'GET') {
        securityManagerService.recordSecurityEvent({
            type: 'suspicious_activity',
            severity: 'low',
            source: { ip, userAgent },
            details: {
                reason: 'Non-GET request detected',
                endpoint: req.path,
                method: req.method
            },
            blocked: false,
            action: 'logged'
        });
    }
    next();
};
function sanitizeObject(obj) {
    if (typeof obj === 'string') {
        return securityManagerService.sanitizeInput(obj);
    }
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
    }
    if (obj && typeof obj === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            sanitized[key] = sanitizeObject(value);
        }
        return sanitized;
    }
    return obj;
}
export const generateCSRFToken = (req, res, next) => {
    if (!req.session) {
        req.session = {};
    }
    if (!req.session.csrfToken) {
        req.session.csrfToken = securityManagerService.generateCSRFToken();
    }
    res.setHeader('X-CSRF-Token', req.session.csrfToken);
    next();
};
export const organizationMiddleware = (req, res, next) => {
    const orgId = req.headers['x-org'];
    if (!orgId) {
        res.status(400).json({
            success: false,
            error: 'Organization ID required',
            code: 'MISSING_ORG_ID'
        });
        return;
    }
    if (req.user && req.user.organizationId !== orgId) {
        securityManagerService.recordSecurityEvent({
            type: 'authorization',
            severity: 'high',
            source: {
                ip: req.ip || 'unknown',
                userAgent: req.headers['user-agent'] || 'unknown',
                userId: req.user.id,
                organizationId: orgId
            },
            details: {
                reason: 'User accessing different organization',
                endpoint: req.path,
                method: req.method,
                metadata: {
                    userOrgId: req.user.organizationId,
                    requestedOrgId: orgId
                }
            },
            blocked: true,
            action: 'blocked'
        });
        res.status(403).json({
            success: false,
            error: 'Access denied to organization',
            code: 'ORG_ACCESS_DENIED'
        });
        return;
    }
    req.organizationId = orgId;
    next();
};
export const securityLoggingMiddleware = (req, res, next) => {
    const startTime = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        if (req.method !== 'GET' || req.path.includes('/admin') || req.path.includes('/api/')) {
            structuredLogger.info('Security request logged', {
                method: req.method,
                path: req.path,
                statusCode: res.statusCode,
                duration,
                ip: req.ip,
                userAgent: req.headers['user-agent'],
                userId: req.user?.id,
                organizationId: req.organizationId,
                requestId: req.headers['x-request-id']
            });
        }
        if (res.statusCode >= 400) {
            securityManagerService.recordSecurityEvent({
                type: 'authorization',
                severity: res.statusCode >= 500 ? 'high' : 'medium',
                source: {
                    ip: req.ip || 'unknown',
                    userAgent: req.headers['user-agent'] || 'unknown',
                    userId: req.user?.id,
                    organizationId: req.organizationId
                },
                details: {
                    reason: `HTTP ${res.statusCode}`,
                    endpoint: req.path,
                    method: req.method,
                    metadata: { statusCode: res.statusCode, duration }
                },
                blocked: false,
                action: 'logged'
            });
        }
    });
    next();
};
//# sourceMappingURL=security.js.map