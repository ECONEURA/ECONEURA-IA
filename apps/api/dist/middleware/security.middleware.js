import { securityService } from '../lib/security.service.js';
import { structuredLogger } from '../lib/structured-logger.js';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { body, validationResult } from 'express-validator';
export const securityHeadersMiddleware = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
});
export const inputValidationMiddleware = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => error.msg);
        securityService.recordAuditLog({
            action: 'VALIDATION_ERROR',
            resource: req.path,
            ipAddress: req.ip || 'unknown',
            userAgent: req.get('User-Agent') || 'unknown',
            details: { errors: errorMessages, body: req.body }
        });
        res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errorMessages
        });
        return;
    }
    next();
};
export const sanitizationMiddleware = (req, res, next) => {
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
export const suspiciousActivityMiddleware = (req, res, next) => {
    const ipAddress = req.ip || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    const originalSend = res.send;
    res.send = function (data) {
        if (res.statusCode >= 400) {
            securityService.detectSuspiciousActivity(req.user?.id || 'anonymous', req.user?.organizationId || 'unknown', `${req.method} ${req.path}`, ipAddress, userAgent, { statusCode: res.statusCode, response: data });
        }
        return originalSend.call(this, data);
    };
    next();
};
export const auditMiddleware = (req, res, next) => {
    const startTime = Date.now();
    const originalSend = res.send;
    res.send = function (data) {
        const duration = Date.now() - startTime;
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) ||
            res.statusCode >= 400) {
            securityService.recordAuditLog({
                userId: req.user?.id,
                organizationId: req.user?.organizationId,
                action: `${req.method} ${req.path}`,
                resource: req.path,
                ipAddress: req.ip || 'unknown',
                userAgent: req.get('User-Agent') || 'unknown',
                details: {
                    method: req.method,
                    url: req.url,
                    statusCode: res.statusCode,
                    duration,
                    requestId: req.requestId,
                    body: sanitizeSensitiveData(req.body),
                    query: req.query,
                    params: req.params
                }
            });
        }
        return originalSend.call(this, data);
    };
    next();
};
export const createRateLimitMiddleware = (options) => {
    return rateLimit({
        windowMs: options.windowMs,
        max: options.max,
        message: options.message || 'Too many requests from this IP',
        skipSuccessfulRequests: options.skipSuccessfulRequests || false,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            securityService.recordSecurityEvent({
                type: 'RATE_LIMIT',
                severity: 'MEDIUM',
                ipAddress: req.ip || 'unknown',
                userAgent: req.get('User-Agent') || 'unknown',
                details: {
                    endpoint: `${req.method} ${req.path}`,
                    limit: options.max,
                    window: options.windowMs
                }
            });
            res.status(429).json({
                success: false,
                message: 'Rate limit exceeded',
                retryAfter: Math.ceil(options.windowMs / 1000)
            });
        }
    });
};
export const ipValidationMiddleware = async (req, res, next) => {
    const ipAddress = req.ip || 'unknown';
    try {
        const isBlocked = await securityService.isIPBlocked(ipAddress);
        if (isBlocked) {
            securityService.recordSecurityEvent({
                type: 'UNAUTHORIZED_ACCESS',
                severity: 'HIGH',
                ipAddress,
                userAgent: req.get('User-Agent') || 'unknown',
                details: {
                    endpoint: `${req.method} ${req.path}`,
                    reason: 'Blocked IP attempt'
                }
            });
            res.status(403).json({
                success: false,
                message: 'Access denied'
            });
            return;
        }
        next();
    }
    catch (error) {
        structuredLogger.error('IP validation error', error, { ipAddress });
        next();
    }
};
export const tokenValidationMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        securityService.recordSecurityEvent({
            type: 'UNAUTHORIZED_ACCESS',
            severity: 'MEDIUM',
            ipAddress: req.ip || 'unknown',
            userAgent: req.get('User-Agent') || 'unknown',
            details: {
                endpoint: `${req.method} ${req.path}`,
                reason: 'No token provided'
            }
        });
        res.status(401).json({
            success: false,
            message: 'No token provided'
        });
        return;
    }
    next();
};
export const permissionMiddleware = (requiredPermissions) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }
        next();
    };
};
export const responseEncryptionMiddleware = (req, res, next) => {
    const sensitiveEndpoints = ['/v1/users', '/v1/auth/me'];
    const isSensitive = sensitiveEndpoints.some(endpoint => req.path.startsWith(endpoint));
    if (isSensitive) {
        const originalSend = res.send;
        res.send = function (data) {
            try {
                const encryptedData = securityService.encryptData(JSON.stringify(data));
                res.set('X-Encrypted', 'true');
                return originalSend.call(this, encryptedData);
            }
            catch (error) {
                structuredLogger.error('Response encryption error', error);
                return originalSend.call(this, data);
            }
        };
    }
    next();
};
function sanitizeObject(obj) {
    if (typeof obj !== 'object' || obj === null) {
        return typeof obj === 'string' ? securityService.sanitizeInput(obj) : obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
    }
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
}
function sanitizeSensitiveData(data) {
    if (typeof data !== 'object' || data === null) {
        return data;
    }
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'ssn', 'creditCard'];
    const sanitized = { ...data };
    for (const field of sensitiveFields) {
        if (sanitized[field]) {
            sanitized[field] = '[REDACTED]';
        }
    }
    return sanitized;
}
export const commonValidators = {
    email: body('email').isEmail().normalizeEmail(),
    password: body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
    name: body('name').isLength({ min: 1, max: 100 }).trim().escape(),
    phone: body('phone').isMobilePhone(),
    url: body('url').isURL(),
    uuid: body('id').isUUID(),
    organizationId: body('organizationId').isUUID(),
    page: body('page').optional().isInt({ min: 1 }),
    limit: body('limit').optional().isInt({ min: 1, max: 100 })
};
//# sourceMappingURL=security.middleware.js.map