import { Span, SpanKind } from '@opentelemetry/api';
import { Request, Response, NextFunction } from 'express';
export interface ObservabilityConfig {
    service: {
        name: string;
        version: string;
        environment: string;
        instance: string;
    };
    tracing: {
        enabled: boolean;
        samplingRate: number;
        maxSpansPerTrace: number;
        batchSize: number;
        exportTimeout: number;
    };
    metrics: {
        enabled: boolean;
        collectionInterval: number;
        customMetrics: boolean;
    };
    logging: {
        enabled: boolean;
        level: 'debug' | 'info' | 'warn' | 'error';
        structured: boolean;
    };
}
export interface TraceContext {
    traceId: string;
    spanId: string;
    parentSpanId?: string;
    operation: string;
    service: string;
    userId?: string;
    organizationId?: string;
    tenantId?: string;
    requestId?: string;
    metadata?: Record<string, any>;
}
export interface SpanMetrics {
    totalSpans: number;
    activeSpans: number;
    completedSpans: number;
    errorSpans: number;
    averageDuration: number;
    p95Duration: number;
    p99Duration: number;
}
export interface ServiceMetrics {
    requests: {
        total: number;
        successful: number;
        failed: number;
        rate: number;
    };
    latency: {
        average: number;
        p50: number;
        p95: number;
        p99: number;
    };
    errors: {
        total: number;
        rate: number;
        byType: Record<string, number>;
    };
    resources: {
        memory: {
            used: number;
            total: number;
            percentage: number;
        };
        cpu: {
            usage: number;
            load: number;
        };
    };
}
declare class ObservabilityOTelService {
    private static instance;
    private tracer;
    private meter;
    private config;
    private spanMetrics;
    private serviceMetrics;
    private activeSpans;
    private spanDurations;
    private constructor();
    static getInstance(): ObservabilityOTelService;
    private getDefaultConfig;
    private getDefaultSpanMetrics;
    private getDefaultServiceMetrics;
    private init;
    private initializeMetrics;
    createSpan(name: string, options?: {
        kind?: SpanKind;
        attributes?: Record<string, string | number | boolean>;
        parentSpan?: Span;
    }): Span;
    createHttpSpan(req: Request, res: Response, options?: {
        attributes?: Record<string, string | number | boolean>;
        parentSpan?: Span;
    }): Span;
    createDatabaseSpan(operation: string, table: string, options?: {
        attributes?: Record<string, string | number | boolean>;
        parentSpan?: Span;
    }): Span;
    createExternalApiSpan(service: string, endpoint: string, options?: {
        attributes?: Record<string, string | number | boolean>;
        parentSpan?: Span;
    }): Span;
    createBusinessSpan(operation: string, organizationId: string, options?: {
        attributes?: Record<string, string | number | boolean>;
        parentSpan?: Span;
    }): Span;
    executeWithSpan<T>(name: string, operation: () => Promise<T>, options?: {
        attributes?: Record<string, string | number | boolean>;
        parentSpan?: Span;
    }): Promise<T>;
    executeWithHttpSpan<T>(req: Request, res: Response, operation: () => Promise<T>, options?: {
        attributes?: Record<string, string | number | boolean>;
        parentSpan?: Span;
    }): Promise<T>;
    getCurrentSpan(): Span | undefined;
    getCurrentTraceId(): string | undefined;
    getCurrentSpanId(): string | undefined;
    getTraceContext(): TraceContext | undefined;
    private recordSpanCompletion;
    private recordHttpRequest;
    private updateDurationMetrics;
    private updateLatencyMetrics;
    private startSystemMetricsCollection;
    private collectSystemMetrics;
    private startCleanupScheduler;
    private cleanup;
    getConfig(): ObservabilityConfig;
    getSpanMetrics(): SpanMetrics;
    getServiceMetrics(): ServiceMetrics;
    getActiveSpans(): Span[];
    getActiveSpanCount(): number;
    httpTracingMiddleware(): (req: Request, res: Response, next: NextFunction) => void;
    createChildSpan(parentSpan: Span, name: string, options?: {
        attributes?: Record<string, string | number | boolean>;
    }): Span;
    traceError(error: Error, context?: Record<string, any>): void;
    traceBusinessOperation(operation: string, organizationId: string, context?: Record<string, any>): Span;
}
export declare const observabilityOTelService: ObservabilityOTelService;
declare global {
    namespace Express {
        interface Request {
            span?: Span;
            startTime?: number;
        }
    }
}
export {};
//# sourceMappingURL=observability-otel.service.d.ts.map