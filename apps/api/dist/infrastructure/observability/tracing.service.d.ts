import { Span, SpanKind, SpanStatusCode } from '@opentelemetry/api';
import { Request, Response, NextFunction } from 'express';
export interface TraceContext {
    traceId: string;
    spanId: string;
    parentSpanId?: string;
    operation: string;
    service: string;
    userId?: string;
    organizationId?: string;
    requestId?: string;
    metadata?: Record<string, any>;
}
export interface SpanOptions {
    kind?: SpanKind;
    attributes?: Record<string, string | number | boolean>;
    startTime?: number;
    endTime?: number;
}
export declare class TracingService {
    private static instance;
    private tracer;
    private constructor();
    static getInstance(): TracingService;
    createSpan(name: string, options?: SpanOptions): Span;
    createHttpSpan(req: Request, res: Response, options?: SpanOptions): Span;
    createDatabaseSpan(operation: string, table: string, options?: SpanOptions): Span;
    createExternalApiSpan(service: string, endpoint: string, options?: SpanOptions): Span;
    createBusinessSpan(operation: string, organizationId: string, options?: SpanOptions): Span;
    executeWithSpan<T>(name: string, operation: () => Promise<T>, options?: SpanOptions): Promise<T>;
    executeWithHttpSpan<T>(req: Request, res: Response, operation: () => Promise<T>, options?: SpanOptions): Promise<T>;
    setSpanAttributes(span: Span, attributes: Record<string, string | number | boolean>): void;
    addSpanEvent(span: Span, name: string, attributes?: Record<string, string | number | boolean>): void;
    setSpanStatus(span: Span, status: {
        code: SpanStatusCode;
        message?: string;
    }): void;
    recordSpanException(span: Span, error: Error): void;
    getCurrentSpan(): Span | undefined;
    getCurrentTraceId(): string | undefined;
    getCurrentSpanId(): string | undefined;
    getTraceContext(): TraceContext | undefined;
    httpTracingMiddleware(): (req: Request, res: Response, next: NextFunction) => void;
    createChildSpan(parentSpan: Span, name: string, options?: SpanOptions): Span;
    tracePerformance<T>(operation: string, fn: () => Promise<T>, options?: SpanOptions): Promise<T>;
    traceError(error: Error, context?: Record<string, any>): void;
    traceBusinessOperation(operation: string, organizationId: string, context?: Record<string, any>): Span;
}
export declare const tracing: TracingService;
declare global {
    namespace Express {
        interface Request {
            span?: Span;
        }
    }
}
//# sourceMappingURL=tracing.service.d.ts.map