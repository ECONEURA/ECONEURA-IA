import { Request, Response, NextFunction } from 'express';
interface ExtendedRequest extends Request {
    requestId?: string;
    traceContext?: {
        traceId: string;
        spanId: string;
        parentId?: string;
    };
    startTime?: number;
}
export declare function observabilityMiddleware(req: ExtendedRequest, res: Response, next: NextFunction): void;
export declare function errorObservabilityMiddleware(error: any, req: ExtendedRequest, res: Response, next: NextFunction): void;
export declare function healthCheckMiddleware(req: Request, res: Response, next: NextFunction): void;
export declare function startCleanupScheduler(): void;
export declare function startSystemMetricsScheduler(): void;
export {};
//# sourceMappingURL=observability.d.ts.map