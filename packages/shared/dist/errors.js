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
export class NotFoundError extends AppError {
    constructor(message) {
        super(404, 'NOT_FOUND', message);
    }
}
export class ConflictError extends AppError {
    constructor(message) {
        super(409, 'CONFLICT', message);
    }
}
export class TooManyRequestsError extends AppError {
    constructor(message) {
        super(429, 'TOO_MANY_REQUESTS', message);
    }
}
export class InternalError extends AppError {
    constructor(message) {
        super(500, 'INTERNAL_ERROR', message, false);
    }
}
export function isAppError(error) {
    return error instanceof AppError;
}
export function createHttpError(statusCode, message) {
    const codeMap = {
        400: 'BAD_REQUEST',
        401: 'UNAUTHORIZED',
        403: 'FORBIDDEN',
        404: 'NOT_FOUND',
        409: 'CONFLICT',
        429: 'TOO_MANY_REQUESTS',
        500: 'INTERNAL_SERVER_ERROR'
    };
    return new AppError(statusCode, codeMap[statusCode] || 'UNKNOWN_ERROR', message, statusCode < 500);
}
export function enrichError(error, context) {
    if (isAppError(error)) {
        return Object.assign(error, { context });
    }
    const appError = new InternalError(error.message);
    return Object.assign(appError, { context, originalError: error });
}
//# sourceMappingURL=errors.js.map