import { ZodError } from 'zod';
import { logger } from './logger.js';
import { metrics } from './metrics.js';
function headerToString(h) {
    if (!h)
        return undefined;
    return Array.isArray(h) ? h[0] : h;
}
export class AppError extends Error {
    statusCode;
    code;
    isOperational;
    constructor(statusCode, code, message, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = isOperational;
        Object.setPrototypeOf(this, AppError.prototype);
    }
}
export class ValidationError extends AppError {
    constructor(message) {
        super(400, 'VALIDATION_ERROR', message);
    }
}
export class AuthenticationError extends AppError {
    constructor(message) {
        super(401, 'AUTHENTICATION_ERROR', message);
    }
}
export class AuthorizationError extends AppError {
    constructor(message) {
        super(403, 'AUTHORIZATION_ERROR', message);
    }
}
export const errorHandler = (error, req, res, next) => {
    logger.error('Error occurred: ' + error.message);
    try {
        const safeLogger = logger;
        const hasDebug = safeLogger && typeof safeLogger.debug === 'function';
        if (hasDebug) {
            const stack = process.env.NODE_ENV === 'development' && error && typeof error['stack'] === 'string'
                ? String(error['stack'])
                : undefined;
            const r = req;
            safeLogger.debug?.('Error context', {
                error: { name: error.name, message: error.message, stack, code: error instanceof AppError ? error.code : 'INTERNAL_ERROR' },
                request: {
                    method: req.method,
                    url: r.originalUrl || r.path || req.url,
                    params: req.params,
                    query: req.query,
                    requestId: headerToString(req.headers?.['x-request-id']),
                    orgId: headerToString(req.headers?.['x-org-id'])
                }
            });
        }
    }
    catch { }
    try {
        const m = metrics;
        const recordError = m.recordError;
        const increment = m.increment;
        const rr = req;
        const routePath = rr.route?.path || rr.path || req.url;
        if (typeof recordError === 'function') {
            recordError(error instanceof AppError ? error.code : 'INTERNAL_ERROR', req.method, routePath);
        }
        else if (typeof increment === 'function') {
            increment(error instanceof AppError ? error.code : 'INTERNAL_ERROR', { method: req.method });
        }
    }
    catch (e) { }
    if (error instanceof ZodError) {
        return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Invalid request data', errors: error.errors });
    }
    if (error instanceof AppError) {
        return res.status(error.statusCode).json({ code: error.code, message: error.message });
    }
    const isDev = process.env.NODE_ENV === 'development';
    return res.status(500).json({ code: 'INTERNAL_ERROR', message: isDev ? error.message : 'An unexpected error occurred', ...(isDev && { stack: error.stack }) });
};
export const notFoundHandler = (req, res, next) => {
    const error = new AppError(404, 'NOT_FOUND', `Route ${req.method} ${req.url} not found`);
    next(error);
};
export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
//# sourceMappingURL=errors.js.map