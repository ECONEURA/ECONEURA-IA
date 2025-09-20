import { Request, Response, NextFunction } from 'express';
import { CorrelationContext } from '@econeura/shared/correlation';
export interface CorrelationRequest extends Request {
    correlationId: string;
    requestId: string;
    traceId: string;
    spanId: string;
    parentSpanId?: string;
    correlationContext: CorrelationContext;
}
export interface CorrelationResponse extends Response {
    correlationId: string;
    requestId: string;
    traceId: string;
    spanId: string;
}
export declare function correlationMiddleware(req: CorrelationRequest, res: CorrelationResponse, next: NextFunction): void;
export declare function correlationLoggingMiddleware(req: CorrelationRequest, res: CorrelationResponse, next: NextFunction): void;
export declare function correlationPropagationMiddleware(req: CorrelationRequest, res: CorrelationResponse, next: NextFunction): void;
export declare function correlationErrorMiddleware(error: any, req: CorrelationRequest, res: CorrelationResponse, next: NextFunction): void;
export declare function getCorrelationContext(req: CorrelationRequest): CorrelationContext;
export declare function createChildSpanFromRequest(req: CorrelationRequest, operationName: string): CorrelationContext;
export declare function logWithCorrelation(req: CorrelationRequest, level: 'info' | 'warn' | 'error', message: string, data?: Record<string, unknown>): void;
export declare function addCorrelationToResponse(res: CorrelationResponse, data: any): any;
export declare function createMockCorrelationRequest(): Partial<CorrelationRequest>;
export declare function createMockCorrelationResponse(): Partial<CorrelationResponse>;
declare const _default: {
    correlationMiddleware: typeof correlationMiddleware;
    correlationLoggingMiddleware: typeof correlationLoggingMiddleware;
    correlationPropagationMiddleware: typeof correlationPropagationMiddleware;
    correlationErrorMiddleware: typeof correlationErrorMiddleware;
    getCorrelationContext: typeof getCorrelationContext;
    createChildSpanFromRequest: typeof createChildSpanFromRequest;
    logWithCorrelation: typeof logWithCorrelation;
    addCorrelationToResponse: typeof addCorrelationToResponse;
    createMockCorrelationRequest: typeof createMockCorrelationRequest;
    createMockCorrelationResponse: typeof createMockCorrelationResponse;
};
export default _default;
//# sourceMappingURL=correlation.d.ts.map