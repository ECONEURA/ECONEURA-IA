export declare class AppError extends Error {
    readonly code: string;
    readonly statusCode: number;
    readonly context?: Record<string, unknown>;
    constructor(message: string, code: string, statusCode?: number, context?: Record<string, unknown>);
}
export declare class ValidationError extends AppError {
    constructor(message: string, context?: Record<string, unknown>);
}
export declare class AuthenticationError extends AppError {
    constructor(message: string, context?: Record<string, unknown>);
}
export declare class AuthorizationError extends AppError {
    constructor(message: string, context?: Record<string, unknown>);
}
export declare class NotFoundError extends AppError {
    constructor(message: string, context?: Record<string, unknown>);
}
export declare class ConflictError extends AppError {
    constructor(message: string, context?: Record<string, unknown>);
}
export declare class RateLimitError extends AppError {
    constructor(message: string, context?: Record<string, unknown>);
}
export declare class IntegrationError extends AppError {
    constructor(message: string, context?: Record<string, unknown>);
}
export declare class DatabaseError extends AppError {
    constructor(message: string, context?: Record<string, unknown>);
}
export declare class AIError extends AppError {
    constructor(message: string, context?: Record<string, unknown>);
}
export declare class TimeoutError extends AppError {
    constructor(message: string, context?: Record<string, unknown>);
}
export declare function createError(error: Error | AppError | unknown): AppError;
//# sourceMappingURL=index.d.ts.map