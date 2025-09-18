export class AppError extends Error {
    code;
    statusCode;
    context;
    constructor(message, code, statusCode = 500, context) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.context = context;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
export class ValidationError extends AppError {
    constructor(message, context) {
        super(message, 'VALIDATION_ERROR', 400, context);
    }
}
export class AuthenticationError extends AppError {
    constructor(message, context) {
        super(message, 'AUTHENTICATION_ERROR', 401, context);
    }
}
export class AuthorizationError extends AppError {
    constructor(message, context) {
        super(message, 'AUTHORIZATION_ERROR', 403, context);
    }
}
export class NotFoundError extends AppError {
    constructor(message, context) {
        super(message, 'NOT_FOUND', 404, context);
    }
}
export class ConflictError extends AppError {
    constructor(message, context) {
        super(message, 'CONFLICT', 409, context);
    }
}
export class RateLimitError extends AppError {
    constructor(message, context) {
        super(message, 'RATE_LIMIT', 429, context);
    }
}
export class IntegrationError extends AppError {
    constructor(message, context) {
        super(message, 'INTEGRATION_ERROR', 502, context);
    }
}
export class DatabaseError extends AppError {
    constructor(message, context) {
        super(message, 'DATABASE_ERROR', 503, context);
    }
}
export class AIError extends AppError {
    constructor(message, context) {
        super(message, 'AI_ERROR', 503, context);
    }
}
export class TimeoutError extends AppError {
    constructor(message, context) {
        super(message, 'TIMEOUT', 504, context);
    }
}
export function createError(error) {
    if (error instanceof AppError) {
        return error;
    }
    if (error instanceof Error) {
        return new AppError(error.message, 'INTERNAL_ERROR', 500);
    }
    return new AppError('An unexpected error occurred', 'INTERNAL_ERROR', 500);
}
//# sourceMappingURL=index.js.map