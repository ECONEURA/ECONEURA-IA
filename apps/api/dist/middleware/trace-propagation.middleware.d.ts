import { Request, Response, NextFunction } from 'express';
import { Span } from '@opentelemetry/api';
interface ExtendedRequest extends Request {
    traceContext?: {
        traceId: string;
        spanId: string;
        parentSpanId?: string;
        requestId: string;
        correlationId: string;
    };
    span?: Span;
    startTime?: number;
}
export declare function tracePropagationMiddleware(): (req: ExtendedRequest, res: Response, next: NextFunction) => void;
export declare function outgoingTracePropagationMiddleware(): (req: Request, res: Response, next: NextFunction) => void;
export declare function getCurrentTraceContext(): ExtendedRequest['traceContext'] | undefined;
export declare function createChildSpanWithPropagation(parentSpan: Span, name: string, attributes?: Record<string, string | number | boolean>): Span;
export declare function propagateTraceToOutgoingRequest(headers?: Record<string, string>): Record<string, string>;
export declare function traceLoggingMiddleware(): (req: ExtendedRequest, res: Response, next: NextFunction) => void;
export declare function traceValidationMiddleware(): (req: ExtendedRequest, res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=trace-propagation.middleware.d.ts.map