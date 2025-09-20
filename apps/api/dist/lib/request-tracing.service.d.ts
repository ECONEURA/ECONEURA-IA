export interface TraceContext {
    traceId: string;
    spanId: string;
    parentSpanId?: string;
    operation: string;
    startTime: number;
    metadata: Record<string, any>;
}
export declare class RequestTracingService {
    private traces;
    createTrace(operation: string, metadata?: Record<string, any>): TraceContext;
    createSpan(traceId: string, operation: string, metadata?: Record<string, any>): TraceContext;
    finishTrace(traceId: string, metadata?: Record<string, any>): void;
}
export declare const requestTracingService: RequestTracingService;
//# sourceMappingURL=request-tracing.service.d.ts.map