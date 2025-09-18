export declare class AppError extends Error {
    statusCode: number;
    code: string;
    isOperational: boolean;
    constructor(statusCode: number, code: string, message: string, isOperational?: boolean);
}
export declare class ValidationError extends AppError {
    constructor(message: string);
}
export declare class AuthenticationError extends AppError {
    constructor(message: string);
}
export declare class AuthorizationError extends AppError {
    constructor(message: string);
}
export declare class NotFoundError extends AppError {
    constructor(message: string);
}
export declare class ConflictError extends AppError {
    constructor(message: string);
}
export declare class TooManyRequestsError extends AppError {
    constructor(message: string);
}
export declare class InternalError extends AppError {
    constructor(message: string);
}
export declare function isAppError(error: unknown): error is AppError;
export declare function createHttpError(statusCode: number, message: string): AppError;
export interface ErrorContext {
    path?: string;
    value?: unknown;
    constraint?: string;
    details?: Record<string, unknown>;
}
export declare function enrichError(error: Error, context?: ErrorContext): AppError;
//# sourceMappingURL=errors.d.ts.map