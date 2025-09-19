interface TraceSpan {
    id: string;
    traceId: string;
    parentId?: string;
    name: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    tags: Record<string, string | number | boolean>;
    logs: Array<{
        timestamp: number;
        message: string;
        data?: any;
    }>;
    children: TraceSpan[];
}
interface TraceContext {
    traceId: string;
    spanId: string;
    parentId?: string;
}
declare class TracingSystem {
    private traces;
    private activeSpans;
    private readonly MAX_TRACES;
    generateTraceId(): string;
    generateSpanId(): string;
    startSpan(name: string, parentContext?: TraceContext): TraceContext;
    endSpan(spanId: string, tags?: Record<string, string | number | boolean>): void;
    addTag(spanId: string, key: string, value: string | number | boolean): void;
    addLog(spanId: string, message: string, data?: any): void;
    getTrace(traceId: string): TraceSpan | undefined;
    getTraces(): TraceSpan[];
    getAllTraces(): TraceSpan[];
    getActiveSpans(): TraceSpan[];
    traceHttpRequest(method: string, path: string, handler: () => Promise<any>): Promise<any>;
    traceAIRequest(model: string, provider: string, handler: () => Promise<any>): Promise<any>;
    traceDatabaseQuery(query: string, handler: () => Promise<any>): Promise<any>;
    exportTraces(): any[];
    private flattenSpans;
    cleanup(maxAgeMs?: number): void;
    getStats(): any;
}
export declare const tracing: TracingSystem;
export {};
//# sourceMappingURL=tracing.d.ts.map