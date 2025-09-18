import { Tracer, SpanKind, SpanStatusCode, Span } from '@opentelemetry/api';
export declare function initTracer(): Tracer;
export declare class TracingManager {
    private tracer;
    private activeSpans;
    constructor();
    startSpan(name: string, options?: {
        kind?: SpanKind;
        attributes?: Record<string, string | number | boolean>;
    }): Span;
    endSpan(name: string, options?: {
        status?: SpanStatusCode;
        error?: Error;
    }): void;
    withSpan<T>(name: string, fn: (span: Span) => Promise<T>, options?: {
        kind?: SpanKind;
        attributes?: Record<string, string | number | boolean>;
    }): Promise<T>;
    addEvent(spanName: string, eventName: string, attributes?: Record<string, string | number | boolean>): void;
    setAttributes(spanName: string, attributes: Record<string, string | number | boolean>): void;
}
export declare const tracingManager: TracingManager;
//# sourceMappingURL=tracing.d.ts.map