import { z } from 'zod';
export const ErrorSchema = z.object({
    code: z.string(),
    message: z.string(),
    traceId: z.string().optional(),
    timestamp: z.string().datetime(),
    path: z.string().optional(),
    method: z.string().optional(),
    statusCode: z.number().min(100).max(599),
    details: z.record(z.unknown()).optional(),
    stack: z.string().optional(),
});
export const ErrorResponseSchema = z.object({
    success: z.literal(false),
    error: ErrorSchema,
    requestId: z.string().optional(),
    correlationId: z.string().optional(),
});
export const ERROR_CODES = {
    AUTH_REQUIRED: 'AUTH_REQUIRED',
    AUTH_INVALID: 'AUTH_INVALID',
    AUTH_EXPIRED: 'AUTH_EXPIRED',
    AUTH_INSUFFICIENT_PERMISSIONS: 'AUTH_INSUFFICIENT_PERMISSIONS',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    VALIDATION_REQUIRED: 'VALIDATION_REQUIRED',
    VALIDATION_INVALID_FORMAT: 'VALIDATION_INVALID_FORMAT',
    VALIDATION_OUT_OF_RANGE: 'VALIDATION_OUT_OF_RANGE',
    DATABASE_ERROR: 'DATABASE_ERROR',
    DATABASE_CONNECTION_ERROR: 'DATABASE_CONNECTION_ERROR',
    DATABASE_QUERY_ERROR: 'DATABASE_QUERY_ERROR',
    DATABASE_CONSTRAINT_ERROR: 'DATABASE_CONSTRAINT_ERROR',
    EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
    EXTERNAL_SERVICE_TIMEOUT: 'EXTERNAL_SERVICE_TIMEOUT',
    EXTERNAL_SERVICE_UNAVAILABLE: 'EXTERNAL_SERVICE_UNAVAILABLE',
    BUSINESS_LOGIC_ERROR: 'BUSINESS_LOGIC_ERROR',
    RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
    RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
    OPERATION_NOT_ALLOWED: 'OPERATION_NOT_ALLOWED',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
    MAINTENANCE_MODE: 'MAINTENANCE_MODE',
};
export const ERROR_MESSAGES = {
    [ERROR_CODES.AUTH_REQUIRED]: 'Authentication required',
    [ERROR_CODES.AUTH_INVALID]: 'Invalid authentication credentials',
    [ERROR_CODES.AUTH_EXPIRED]: 'Authentication token has expired',
    [ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS]: 'Insufficient permissions',
    [ERROR_CODES.VALIDATION_ERROR]: 'Validation error',
    [ERROR_CODES.VALIDATION_REQUIRED]: 'Required field is missing',
    [ERROR_CODES.VALIDATION_INVALID_FORMAT]: 'Invalid format',
    [ERROR_CODES.VALIDATION_OUT_OF_RANGE]: 'Value is out of allowed range',
    [ERROR_CODES.DATABASE_ERROR]: 'Database error',
    [ERROR_CODES.DATABASE_CONNECTION_ERROR]: 'Database connection error',
    [ERROR_CODES.DATABASE_QUERY_ERROR]: 'Database query error',
    [ERROR_CODES.DATABASE_CONSTRAINT_ERROR]: 'Database constraint violation',
    [ERROR_CODES.EXTERNAL_SERVICE_ERROR]: 'External service error',
    [ERROR_CODES.EXTERNAL_SERVICE_TIMEOUT]: 'External service timeout',
    [ERROR_CODES.EXTERNAL_SERVICE_UNAVAILABLE]: 'External service unavailable',
    [ERROR_CODES.BUSINESS_LOGIC_ERROR]: 'Business logic error',
    [ERROR_CODES.RESOURCE_NOT_FOUND]: 'Resource not found',
    [ERROR_CODES.RESOURCE_ALREADY_EXISTS]: 'Resource already exists',
    [ERROR_CODES.OPERATION_NOT_ALLOWED]: 'Operation not allowed',
    [ERROR_CODES.RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded',
    [ERROR_CODES.INTERNAL_SERVER_ERROR]: 'Internal server error',
    [ERROR_CODES.SERVICE_UNAVAILABLE]: 'Service unavailable',
    [ERROR_CODES.MAINTENANCE_MODE]: 'Service is in maintenance mode',
};
export const ERROR_STATUS_MAPPING = {
    [ERROR_CODES.AUTH_REQUIRED]: 401,
    [ERROR_CODES.AUTH_INVALID]: 401,
    [ERROR_CODES.AUTH_EXPIRED]: 401,
    [ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS]: 403,
    [ERROR_CODES.VALIDATION_ERROR]: 400,
    [ERROR_CODES.VALIDATION_REQUIRED]: 400,
    [ERROR_CODES.VALIDATION_INVALID_FORMAT]: 400,
    [ERROR_CODES.VALIDATION_OUT_OF_RANGE]: 400,
    [ERROR_CODES.DATABASE_ERROR]: 500,
    [ERROR_CODES.DATABASE_CONNECTION_ERROR]: 503,
    [ERROR_CODES.DATABASE_QUERY_ERROR]: 500,
    [ERROR_CODES.DATABASE_CONSTRAINT_ERROR]: 409,
    [ERROR_CODES.EXTERNAL_SERVICE_ERROR]: 502,
    [ERROR_CODES.EXTERNAL_SERVICE_TIMEOUT]: 504,
    [ERROR_CODES.EXTERNAL_SERVICE_UNAVAILABLE]: 503,
    [ERROR_CODES.BUSINESS_LOGIC_ERROR]: 400,
    [ERROR_CODES.RESOURCE_NOT_FOUND]: 404,
    [ERROR_CODES.RESOURCE_ALREADY_EXISTS]: 409,
    [ERROR_CODES.OPERATION_NOT_ALLOWED]: 403,
    [ERROR_CODES.RATE_LIMIT_EXCEEDED]: 429,
    [ERROR_CODES.INTERNAL_SERVER_ERROR]: 500,
    [ERROR_CODES.SERVICE_UNAVAILABLE]: 503,
    [ERROR_CODES.MAINTENANCE_MODE]: 503,
};
export class AppError extends Error {
    code;
    statusCode;
    details;
    traceId;
    constructor(code, message, details, traceId) {
        super(message || ERROR_MESSAGES[code]);
        this.name = 'AppError';
        this.code = code;
        this.statusCode = ERROR_STATUS_MAPPING[code];
        this.details = details;
        this.traceId = traceId;
    }
    toJSON() {
        return {
            code: this.code,
            message: this.message,
            traceId: this.traceId,
            timestamp: new Date().toISOString(),
            statusCode: this.statusCode,
            details: this.details,
            stack: this.stack,
        };
    }
}
export class ValidationError extends AppError {
    constructor(message, details, traceId) {
        super(ERROR_CODES.VALIDATION_ERROR, message, details, traceId);
        this.name = 'ValidationError';
    }
}
export class AuthenticationError extends AppError {
    constructor(code = ERROR_CODES.AUTH_INVALID, message, traceId) {
        super(code, message, undefined, traceId);
        this.name = 'AuthenticationError';
    }
}
export class AuthorizationError extends AppError {
    constructor(message, traceId) {
        super(ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS, message, undefined, traceId);
        this.name = 'AuthorizationError';
    }
}
export class DatabaseError extends AppError {
    constructor(message, details, traceId) {
        super(ERROR_CODES.DATABASE_ERROR, message, details, traceId);
        this.name = 'DatabaseError';
    }
}
export class ExternalServiceError extends AppError {
    constructor(message, details, traceId) {
        super(ERROR_CODES.EXTERNAL_SERVICE_ERROR, message, details, traceId);
        this.name = 'ExternalServiceError';
    }
}
export class BusinessLogicError extends AppError {
    constructor(message, details, traceId) {
        super(ERROR_CODES.BUSINESS_LOGIC_ERROR, message, details, traceId);
        this.name = 'BusinessLogicError';
    }
}
export class ResourceNotFoundError extends AppError {
    constructor(resource, traceId) {
        super(ERROR_CODES.RESOURCE_NOT_FOUND, `${resource} not found`, { resource }, traceId);
        this.name = 'ResourceNotFoundError';
    }
}
export class RateLimitError extends AppError {
    constructor(message, details, traceId) {
        super(ERROR_CODES.RATE_LIMIT_EXCEEDED, message, details, traceId);
        this.name = 'RateLimitError';
    }
}
export function generateTraceId() {
    return `trace_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}
export function isAppError(error) {
    return error instanceof AppError;
}
export function isZodError(error) {
    return error instanceof z.ZodError;
}
export function isDatabaseError(error) {
    if (error instanceof DatabaseError)
        return true;
    const errorMessage = error instanceof Error ? error.message : String(error);
    const dbErrorPatterns = [
        'connection',
        'query',
        'constraint',
        'duplicate',
        'foreign key',
        'unique',
        'not null',
        'timeout',
    ];
    return dbErrorPatterns.some(pattern => errorMessage.toLowerCase().includes(pattern));
}
export function isExternalServiceError(error) {
    if (error instanceof ExternalServiceError)
        return true;
    const errorMessage = error instanceof Error ? error.message : String(error);
    const externalErrorPatterns = [
        'timeout',
        'unavailable',
        'service',
        'api',
        'http',
        'network',
        'connection refused',
    ];
    return externalErrorPatterns.some(pattern => errorMessage.toLowerCase().includes(pattern));
}
export function mapZodErrorToAppError(zodError, traceId) {
    const details = {};
    zodError.errors.forEach((error) => {
        const path = error.path.join('.');
        details[path] = {
            message: error.message,
            code: error.code,
            received: error.received,
        };
    });
    return new ValidationError('Validation failed', details, traceId);
}
export function mapDatabaseErrorToAppError(error, operation, traceId) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    let code = ERROR_CODES.DATABASE_ERROR;
    if (isDatabaseError(error)) {
        if (errorMessage.includes('connection')) {
            code = ERROR_CODES.DATABASE_CONNECTION_ERROR;
        }
        else if (errorMessage.includes('constraint') || errorMessage.includes('duplicate')) {
            code = ERROR_CODES.DATABASE_CONSTRAINT_ERROR;
        }
        else if (errorMessage.includes('query')) {
            code = ERROR_CODES.DATABASE_QUERY_ERROR;
        }
    }
    return new DatabaseError(`Database error during ${operation}: ${errorMessage}`, { operation, originalError: errorMessage }, traceId);
}
export function mapExternalServiceErrorToAppError(error, service, traceId) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    let code = ERROR_CODES.EXTERNAL_SERVICE_ERROR;
    if (isExternalServiceError(error)) {
        if (errorMessage.includes('timeout')) {
            code = ERROR_CODES.EXTERNAL_SERVICE_TIMEOUT;
        }
        else if (errorMessage.includes('unavailable')) {
            code = ERROR_CODES.EXTERNAL_SERVICE_UNAVAILABLE;
        }
    }
    return new ExternalServiceError(`External service error from ${service}: ${errorMessage}`, { service, originalError: errorMessage }, traceId);
}
export default {
    ErrorSchema,
    ErrorResponseSchema,
    ERROR_CODES,
    ERROR_MESSAGES,
    ERROR_STATUS_MAPPING,
    AppError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    DatabaseError,
    ExternalServiceError,
    BusinessLogicError,
    ResourceNotFoundError,
    RateLimitError,
    generateTraceId,
    isAppError,
    isZodError,
    isDatabaseError,
    isExternalServiceError,
    mapZodErrorToAppError,
    mapDatabaseErrorToAppError,
    mapExternalServiceErrorToAppError,
};
//# sourceMappingURL=index.js.map