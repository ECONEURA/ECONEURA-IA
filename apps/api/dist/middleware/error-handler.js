import { AppError, AuthenticationError, AuthorizationError, ResourceNotFoundError, RateLimitError, generateTraceId, isAppError, isZodError, isDatabaseError, isExternalServiceError, mapZodErrorToAppError, mapDatabaseErrorToAppError, mapExternalServiceErrorToAppError, ERROR_CODES, } from '@econeura/shared/errors';
const defaultConfig = {
    includeStack: process.env.NODE_ENV !== 'production',
    logErrors: true,
    logLevel: 'error',
    sanitizeErrors: process.env.NODE_ENV === 'production',
    rateLimitWindow: 60000,
    rateLimitMax: 100,
};
export function createErrorHandler(config = {}) {
    const finalConfig = { ...defaultConfig, ...config };
    return (error, req, res, next) => {
        try {
            const traceId = req.headers['x-correlation-id'] || generateTraceId();
            res.setHeader('X-Correlation-ID', traceId);
            const appError = mapErrorToAppError(error, traceId, req);
            if (finalConfig.logErrors) {
                logError(appError, req, finalConfig.logLevel);
            }
            const sanitizedError = finalConfig.sanitizeErrors
                ? sanitizeError(appError, finalConfig.includeStack)
                : appError;
            const errorResponse = {
                success: false,
                error: sanitizedError.toJSON(),
                requestId: req.headers['x-request-id'],
                correlationId: traceId,
            };
            errorResponse.error.path = req.path;
            errorResponse.error.method = req.method;
            res.status(appError.statusCode).json(errorResponse);
        }
        catch (handlerError) {
            console.error('Error handler failed:', handlerError);
            res.status(500).json({
                success: false,
                error: {
                    code: ERROR_CODES.INTERNAL_SERVER_ERROR,
                    message: 'Internal server error',
                    timestamp: new Date().toISOString(),
                    statusCode: 500,
                    path: req.path,
                    method: req.method,
                },
                correlationId: req.headers['x-correlation-id'] || generateTraceId(),
            });
        }
    };
}
function mapErrorToAppError(error, traceId, req) {
    if (isAppError(error)) {
        return error;
    }
    if (isZodError(error)) {
        return mapZodErrorToAppError(error, traceId);
    }
    if (isDatabaseError(error)) {
        return mapDatabaseErrorToAppError(error, req.method, traceId);
    }
    if (isExternalServiceError(error)) {
        return mapExternalServiceErrorToAppError(error, 'unknown', traceId);
    }
    if (error && typeof error === 'object' && 'status' in error) {
        const status = error.status;
        if (status === 401) {
            return new AuthenticationError(ERROR_CODES.AUTH_REQUIRED, undefined, traceId);
        }
        if (status === 403) {
            return new AuthorizationError(undefined, traceId);
        }
        if (status === 404) {
            return new ResourceNotFoundError('Resource', traceId);
        }
        if (status === 429) {
            return new RateLimitError(undefined, undefined, traceId);
        }
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new AppError(ERROR_CODES.INTERNAL_SERVER_ERROR, errorMessage, { originalError: errorMessage }, traceId);
}
function logError(error, req, logLevel) {
    const logData = {
        timestamp: new Date().toISOString(),
        level: logLevel,
        error: {
            code: error.code,
            message: error.message,
            statusCode: error.statusCode,
            traceId: error.traceId,
        },
        request: {
            method: req.method,
            path: req.path,
            userAgent: req.headers['user-agent'],
            ip: req.ip,
            correlationId: req.headers['x-correlation-id'],
        },
        details: error.details,
    };
    switch (logLevel) {
        case 'error':
            console.error('Error occurred:', logData);
            break;
        case 'warn':
            console.warn('Warning occurred:', logData);
            break;
        case 'info':
            console.info('Info occurred:', logData);
            break;
    }
}
function sanitizeError(error, includeStack) {
    const sanitizedError = new AppError(error.code, error.message, error.details, error.traceId);
    if (!includeStack) {
        delete sanitizedError.stack;
    }
    if (sanitizedError.details) {
        sanitizedError.details = sanitizeDetails(sanitizedError.details);
    }
    return sanitizedError;
}
function sanitizeDetails(details) {
    const sanitized = {};
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth', 'credential'];
    for (const [key, value] of Object.entries(details)) {
        const isSensitive = sensitiveKeys.some(sensitiveKey => key.toLowerCase().includes(sensitiveKey));
        if (isSensitive) {
            sanitized[key] = '[REDACTED]';
        }
        else if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitizeDetails(value);
        }
        else {
            sanitized[key] = value;
        }
    }
    return sanitized;
}
export function createNotFoundHandler() {
    return (req, res, next) => {
        const traceId = req.headers['x-correlation-id'] || generateTraceId();
        res.setHeader('X-Correlation-ID', traceId);
        const error = new ResourceNotFoundError(`Route ${req.path}`, traceId);
        const errorResponse = {
            success: false,
            error: error.toJSON(),
            requestId: req.headers['x-request-id'],
            correlationId: traceId,
        };
        errorResponse.error.path = req.path;
        errorResponse.error.method = req.method;
        res.status(404).json(errorResponse);
    };
}
export function asyncHandler(fn) {
    return async (...args) => {
        try {
            return await fn(...args);
        }
        catch (error) {
            throw error;
        }
    };
}
export function errorBoundary(fn) {
    return async (...args) => {
        try {
            return await fn(...args);
        }
        catch (error) {
            console.error('Error in route handler:', error);
            throw error;
        }
    };
}
export function createHealthCheckErrorHandler() {
    return (error, req, res, next) => {
        if (req.path.includes('/health')) {
            res.status(503).json({
                success: false,
                error: {
                    code: ERROR_CODES.SERVICE_UNAVAILABLE,
                    message: 'Service unavailable',
                    timestamp: new Date().toISOString(),
                    statusCode: 503,
                    path: req.path,
                    method: req.method,
                },
                correlationId: req.headers['x-correlation-id'] || generateTraceId(),
            });
            return;
        }
        next(error);
    };
}
export default {
    createErrorHandler,
    createNotFoundHandler,
    createHealthCheckErrorHandler,
    asyncHandler,
    errorBoundary,
};
//# sourceMappingURL=error-handler.js.map