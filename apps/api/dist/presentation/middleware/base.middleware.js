import { z } from 'zod';
import jwt from 'jsonwebtoken';
export const validateRequest = (schema) => {
    return (req, res, next) => {
        try {
            if (schema.body) {
                req.body = schema.body.parse(req.body);
            }
            if (schema.params) {
                req.params = schema.params.parse(req.params);
            }
            if (schema.query) {
                req.query = schema.query.parse(req.query);
            }
            if (schema.headers) {
                req.headers = schema.headers.parse(req.headers);
            }
            next();
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                const validationErrors = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message,
                    code: err.code
                }));
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Validation failed',
                        details: validationErrors
                    }
                });
                return;
            }
            next(error);
        }
    };
};
export const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        res.status(401).json({
            success: false,
            error: {
                code: 'UNAUTHORIZED',
                message: 'Authentication token is required'
            }
        });
        return;
    }
    const validateJWT = (token) => {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
            return decoded;
        }
        catch (error) {
            throw new Error('Invalid or expired token');
        }
    };
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({
            success: false,
            error: {
                code: 'INVALID_AUTH_HEADER',
                message: 'Missing or invalid authorization header'
            }
        });
        return;
    }
    try {
        const token = authHeader.substring(7);
        const decoded = validateJWT(token);
        req.user = {
            id: decoded.userId || decoded.sub,
            email: decoded.email,
            organizationId: decoded.organizationId || req.headers['x-organization-id'] || 'org-123',
            role: decoded.role || 'user',
            permissions: decoded.permissions || []
        };
    }
    catch (error) {
        res.status(401).json({
            success: false,
            error: {
                code: 'INVALID_TOKEN',
                message: 'Invalid or expired token'
            }
        });
        return;
    }
    next();
};
export const authorize = (requiredPermissions = []) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'User not authenticated'
                }
            });
            return;
        }
        const verifyPermissions = (user, permissions) => {
            if (!permissions || permissions.length === 0)
                return true;
            if (user.role === 'admin' || user.role === 'superadmin')
                return true;
            return permissions.some(perm => user.permissions?.includes(perm));
        };
        if (requiredPermissions.length > 0 && !verifyPermissions(req.user, requiredPermissions)) {
            res.status(403).json({
                success: false,
                error: {
                    code: 'INSUFFICIENT_PERMISSIONS',
                    message: `Required permissions: ${requiredPermissions.join(', ')}`,
                    required: requiredPermissions,
                    userPermissions: req.user?.permissions || []
                }
            });
            return;
        }
        next();
    };
};
export const errorHandler = (error, req, res, next) => {
    console.error('Error:', error);
    if (error.name === 'ValidationError') {
        res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: error.message
            }
        });
        return;
    }
    if (error.name === 'NotFoundError') {
        res.status(404).json({
            success: false,
            error: {
                code: 'NOT_FOUND',
                message: error.message
            }
        });
        return;
    }
    if (error.name === 'ConflictError') {
        res.status(409).json({
            success: false,
            error: {
                code: 'CONFLICT',
                message: error.message
            }
        });
        return;
    }
    res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred'
        }
    });
};
export const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: `Route ${req.method} ${req.path} not found`
        }
    });
};
export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
export const requestLogger = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
    });
    next();
};
export const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
    const requests = new Map();
    return (req, res, next) => {
        const clientId = req.ip || req.connection.remoteAddress || 'unknown';
        const now = Date.now();
        const clientData = requests.get(clientId);
        if (!clientData || now > clientData.resetTime) {
            requests.set(clientId, {
                count: 1,
                resetTime: now + windowMs
            });
            next();
            return;
        }
        if (clientData.count >= maxRequests) {
            res.status(429).json({
                success: false,
                error: {
                    code: 'RATE_LIMIT_EXCEEDED',
                    message: 'Too many requests, please try again later'
                }
            });
            return;
        }
        clientData.count++;
        next();
    };
};
export const corsHandler = (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Organization-ID');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
    }
    next();
};
//# sourceMappingURL=base.middleware.js.map