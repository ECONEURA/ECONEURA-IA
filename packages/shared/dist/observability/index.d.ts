import { z } from 'zod';
export declare const LogLevelSchema: z.ZodEnum<["debug", "info", "warn", "error", "fatal"]>;
export declare const LogEntrySchema: z.ZodObject<{
    level: z.ZodEnum<["debug", "info", "warn", "error", "fatal"]>;
    message: z.ZodString;
    timestamp: z.ZodString;
    service: z.ZodString;
    correlationId: z.ZodOptional<z.ZodString>;
    requestId: z.ZodOptional<z.ZodString>;
    userId: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    message?: string;
    timestamp?: string;
    metadata?: Record<string, unknown>;
    userId?: string;
    correlationId?: string;
    requestId?: string;
    service?: string;
    level?: "debug" | "info" | "warn" | "error" | "fatal";
}, {
    message?: string;
    timestamp?: string;
    metadata?: Record<string, unknown>;
    userId?: string;
    correlationId?: string;
    requestId?: string;
    service?: string;
    level?: "debug" | "info" | "warn" | "error" | "fatal";
}>;
export declare const MetricSchema: z.ZodObject<{
    name: z.ZodString;
    value: z.ZodNumber;
    timestamp: z.ZodString;
    labels: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    type: z.ZodEnum<["counter", "gauge", "histogram", "summary"]>;
}, "strip", z.ZodTypeAny, {
    value?: number;
    type?: "counter" | "gauge" | "histogram" | "summary";
    timestamp?: string;
    name?: string;
    labels?: Record<string, string>;
}, {
    value?: number;
    type?: "counter" | "gauge" | "histogram" | "summary";
    timestamp?: string;
    name?: string;
    labels?: Record<string, string>;
}>;
export declare const TraceSchema: z.ZodObject<{
    traceId: z.ZodString;
    spanId: z.ZodString;
    parentSpanId: z.ZodOptional<z.ZodString>;
    operationName: z.ZodString;
    startTime: z.ZodString;
    endTime: z.ZodOptional<z.ZodString>;
    duration: z.ZodOptional<z.ZodNumber>;
    tags: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    logs: z.ZodOptional<z.ZodArray<z.ZodObject<{
        timestamp: z.ZodString;
        fields: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    }, "strip", z.ZodTypeAny, {
        timestamp?: string;
        fields?: Record<string, unknown>;
    }, {
        timestamp?: string;
        fields?: Record<string, unknown>;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    traceId?: string;
    duration?: number;
    tags?: Record<string, string>;
    spanId?: string;
    parentSpanId?: string;
    operationName?: string;
    startTime?: string;
    endTime?: string;
    logs?: {
        timestamp?: string;
        fields?: Record<string, unknown>;
    }[];
}, {
    traceId?: string;
    duration?: number;
    tags?: Record<string, string>;
    spanId?: string;
    parentSpanId?: string;
    operationName?: string;
    startTime?: string;
    endTime?: string;
    logs?: {
        timestamp?: string;
        fields?: Record<string, unknown>;
    }[];
}>;
export declare const AlertSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    severity: z.ZodEnum<["low", "medium", "high", "critical"]>;
    status: z.ZodEnum<["firing", "resolved", "silenced"]>;
    description: z.ZodString;
    timestamp: z.ZodString;
    labels: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    annotations: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    status?: "firing" | "resolved" | "silenced";
    timestamp?: string;
    id?: string;
    name?: string;
    description?: string;
    severity?: "medium" | "low" | "high" | "critical";
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
}, {
    status?: "firing" | "resolved" | "silenced";
    timestamp?: string;
    id?: string;
    name?: string;
    description?: string;
    severity?: "medium" | "low" | "high" | "critical";
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
}>;
export type LogLevel = z.infer<typeof LogLevelSchema>;
export type LogEntry = z.infer<typeof LogEntrySchema>;
export type Metric = z.infer<typeof MetricSchema>;
export type Trace = z.infer<typeof TraceSchema>;
export type Alert = z.infer<typeof AlertSchema>;
export declare class StructuredLogger {
    private service;
    private correlationId?;
    private requestId?;
    private userId?;
    constructor(service: string);
    setContext(correlationId?: string, requestId?: string, userId?: string): void;
    private log;
    debug(message: string, metadata?: Record<string, unknown>): void;
    info(message: string, metadata?: Record<string, unknown>): void;
    warn(message: string, metadata?: Record<string, unknown>): void;
    error(message: string, metadata?: Record<string, unknown>): void;
    fatal(message: string, metadata?: Record<string, unknown>): void;
}
export declare class MetricsCollector {
    private metrics;
    recordCounter(name: string, value?: number, labels?: Record<string, string>): void;
    recordGauge(name: string, value: number, labels?: Record<string, string>): void;
    recordHistogram(name: string, value: number, labels?: Record<string, string>): void;
    recordSummary(name: string, value: number, labels?: Record<string, string>): void;
    private recordMetric;
    getMetrics(name?: string): Metric[];
    clearMetrics(name?: string): void;
}
export declare class Tracer {
    private activeSpans;
    startSpan(operationName: string, parentSpanId?: string): string;
    finishSpan(spanId: string, tags?: Record<string, string>): Trace | null;
    addTag(spanId: string, key: string, value: string): void;
    addLog(spanId: string, fields: Record<string, unknown>): void;
    private generateId;
    private getTraceId;
}
export declare class AlertManager {
    private alerts;
    createAlert(id: string, name: string, severity: Alert['severity'], description: string, labels?: Record<string, string>, annotations?: Record<string, string>): Alert;
    resolveAlert(id: string): Alert | null;
    silenceAlert(id: string): Alert | null;
    getAlerts(status?: Alert['status']): Alert[];
    getAlert(id: string): Alert | null;
}
export declare function generateCorrelationId(): string;
export declare function generateRequestId(): string;
export declare function generateTraceParent(): string;
declare const _default: {
    StructuredLogger: typeof StructuredLogger;
    MetricsCollector: typeof MetricsCollector;
    Tracer: typeof Tracer;
    AlertManager: typeof AlertManager;
    generateCorrelationId: typeof generateCorrelationId;
    generateRequestId: typeof generateRequestId;
    generateTraceParent: typeof generateTraceParent;
    LogLevelSchema: z.ZodEnum<["debug", "info", "warn", "error", "fatal"]>;
    LogEntrySchema: z.ZodObject<{
        level: z.ZodEnum<["debug", "info", "warn", "error", "fatal"]>;
        message: z.ZodString;
        timestamp: z.ZodString;
        service: z.ZodString;
        correlationId: z.ZodOptional<z.ZodString>;
        requestId: z.ZodOptional<z.ZodString>;
        userId: z.ZodOptional<z.ZodString>;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        message?: string;
        timestamp?: string;
        metadata?: Record<string, unknown>;
        userId?: string;
        correlationId?: string;
        requestId?: string;
        service?: string;
        level?: "debug" | "info" | "warn" | "error" | "fatal";
    }, {
        message?: string;
        timestamp?: string;
        metadata?: Record<string, unknown>;
        userId?: string;
        correlationId?: string;
        requestId?: string;
        service?: string;
        level?: "debug" | "info" | "warn" | "error" | "fatal";
    }>;
    MetricSchema: z.ZodObject<{
        name: z.ZodString;
        value: z.ZodNumber;
        timestamp: z.ZodString;
        labels: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        type: z.ZodEnum<["counter", "gauge", "histogram", "summary"]>;
    }, "strip", z.ZodTypeAny, {
        value?: number;
        type?: "counter" | "gauge" | "histogram" | "summary";
        timestamp?: string;
        name?: string;
        labels?: Record<string, string>;
    }, {
        value?: number;
        type?: "counter" | "gauge" | "histogram" | "summary";
        timestamp?: string;
        name?: string;
        labels?: Record<string, string>;
    }>;
    TraceSchema: z.ZodObject<{
        traceId: z.ZodString;
        spanId: z.ZodString;
        parentSpanId: z.ZodOptional<z.ZodString>;
        operationName: z.ZodString;
        startTime: z.ZodString;
        endTime: z.ZodOptional<z.ZodString>;
        duration: z.ZodOptional<z.ZodNumber>;
        tags: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        logs: z.ZodOptional<z.ZodArray<z.ZodObject<{
            timestamp: z.ZodString;
            fields: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        }, "strip", z.ZodTypeAny, {
            timestamp?: string;
            fields?: Record<string, unknown>;
        }, {
            timestamp?: string;
            fields?: Record<string, unknown>;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        traceId?: string;
        duration?: number;
        tags?: Record<string, string>;
        spanId?: string;
        parentSpanId?: string;
        operationName?: string;
        startTime?: string;
        endTime?: string;
        logs?: {
            timestamp?: string;
            fields?: Record<string, unknown>;
        }[];
    }, {
        traceId?: string;
        duration?: number;
        tags?: Record<string, string>;
        spanId?: string;
        parentSpanId?: string;
        operationName?: string;
        startTime?: string;
        endTime?: string;
        logs?: {
            timestamp?: string;
            fields?: Record<string, unknown>;
        }[];
    }>;
    AlertSchema: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        severity: z.ZodEnum<["low", "medium", "high", "critical"]>;
        status: z.ZodEnum<["firing", "resolved", "silenced"]>;
        description: z.ZodString;
        timestamp: z.ZodString;
        labels: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        annotations: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        status?: "firing" | "resolved" | "silenced";
        timestamp?: string;
        id?: string;
        name?: string;
        description?: string;
        severity?: "medium" | "low" | "high" | "critical";
        labels?: Record<string, string>;
        annotations?: Record<string, string>;
    }, {
        status?: "firing" | "resolved" | "silenced";
        timestamp?: string;
        id?: string;
        name?: string;
        description?: string;
        severity?: "medium" | "low" | "high" | "critical";
        labels?: Record<string, string>;
        annotations?: Record<string, string>;
    }>;
};
export default _default;
//# sourceMappingURL=index.d.ts.map