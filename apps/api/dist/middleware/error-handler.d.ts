import { Request, Response, NextFunction } from 'express';
export interface ErrorHandlerConfig {
    includeStack: boolean;
    logErrors: boolean;
    logLevel: 'error' | 'warn' | 'info';
    sanitizeErrors: boolean;
    rateLimitWindow: number;
    rateLimitMax: number;
}
export declare function createErrorHandler(config?: Partial<ErrorHandlerConfig>): (error: unknown, req: Request, res: Response, next: NextFunction) => void;
export declare function createNotFoundHandler(): (req: Request, res: Response, next: NextFunction) => void;
export declare function asyncHandler<T extends any[], R>(fn: (...args: T) => Promise<R>): (...args: T) => Promise<R>;
export declare function errorBoundary<T extends any[], R>(fn: (...args: T) => Promise<R>): (...args: T) => Promise<R>;
export declare function createHealthCheckErrorHandler(): (error: unknown, req: Request, res: Response, next: NextFunction) => void;
declare const _default: {
    createErrorHandler: typeof createErrorHandler;
    createNotFoundHandler: typeof createNotFoundHandler;
    createHealthCheckErrorHandler: typeof createHealthCheckErrorHandler;
    asyncHandler: typeof asyncHandler;
    errorBoundary: typeof errorBoundary;
};
export default _default;
//# sourceMappingURL=error-handler.d.ts.map