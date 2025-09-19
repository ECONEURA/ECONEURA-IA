export interface RetryOptions {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
    backoffFactor: number;
    retryCondition?: (error: Error) => boolean;
}
export declare class ErrorHandler {
    private static defaultRetryOptions;
    static withRetry<T>(operation: () => Promise<T>, options?: Partial<RetryOptions>): Promise<T>;
    static withTimeout<T>(operation: Promise<T>, timeoutMs: number, timeoutMessage?: string): Promise<T>;
    static handleAsyncError(target: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor;
    static createErrorResponse(error: Error, statusCode?: number, context?: Record<string, unknown>): {
        success: boolean;
        error: {
            id: string;
            message: string;
            statusCode: number;
            timestamp: string;
            context: Record<string, unknown>;
        };
    };
    static isRetryableError(error: Error): boolean;
    static isClientError(error: Error): boolean;
    static isServerError(error: Error): boolean;
    private static sleep;
}
export declare class CustomError extends Error {
    readonly statusCode: number;
    readonly isOperational: boolean;
    readonly context?: Record<string, unknown>;
    constructor(message: string, statusCode?: number, isOperational?: boolean, context?: Record<string, unknown>);
}
export declare class ValidationError extends CustomError {
    constructor(message: string, context?: Record<string, unknown>);
}
export declare class NotFoundError extends CustomError {
    constructor(message: string, context?: Record<string, unknown>);
}
export declare class UnauthorizedError extends CustomError {
    constructor(message: string, context?: Record<string, unknown>);
}
export declare class ForbiddenError extends CustomError {
    constructor(message: string, context?: Record<string, unknown>);
}
export declare class ConflictError extends CustomError {
    constructor(message: string, context?: Record<string, unknown>);
}
export declare class RateLimitError extends CustomError {
    constructor(message: string, context?: Record<string, unknown>);
}
export declare class ServiceUnavailableError extends CustomError {
    constructor(message: string, context?: Record<string, unknown>);
}
//# sourceMappingURL=error-handler.d.ts.map