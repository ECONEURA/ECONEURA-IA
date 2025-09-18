import { z } from 'zod';
export const LogLevelSchema = z.enum(['debug', 'info', 'warn', 'error', 'fatal']);
export const LogEntrySchema = z.object({
    level: LogLevelSchema,
    message: z.string(),
    timestamp: z.string().datetime(),
    service: z.string(),
    correlationId: z.string().optional(),
    requestId: z.string().optional(),
    userId: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
});
export const MetricSchema = z.object({
    name: z.string(),
    value: z.number(),
    timestamp: z.string().datetime(),
    labels: z.record(z.string()).optional(),
    type: z.enum(['counter', 'gauge', 'histogram', 'summary']),
});
export const TraceSchema = z.object({
    traceId: z.string(),
    spanId: z.string(),
    parentSpanId: z.string().optional(),
    operationName: z.string(),
    startTime: z.string().datetime(),
    endTime: z.string().datetime().optional(),
    duration: z.number().optional(),
    tags: z.record(z.string()).optional(),
    logs: z.array(z.object({
        timestamp: z.string().datetime(),
        fields: z.record(z.unknown()),
    })).optional(),
});
export const AlertSchema = z.object({
    id: z.string(),
    name: z.string(),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    status: z.enum(['firing', 'resolved', 'silenced']),
    description: z.string(),
    timestamp: z.string().datetime(),
    labels: z.record(z.string()).optional(),
    annotations: z.record(z.string()).optional(),
});
export class StructuredLogger {
    service;
    correlationId;
    requestId;
    userId;
    constructor(service) {
        this.service = service;
    }
    setContext(correlationId, requestId, userId) {
        this.correlationId = correlationId;
        this.requestId = requestId;
        this.userId = userId;
    }
    log(level, message, metadata) {
        const logEntry = {
            level,
            message,
            timestamp: new Date().toISOString(),
            service: this.service,
            correlationId: this.correlationId,
            requestId: this.requestId,
            userId: this.userId,
            metadata,
        };
    }
    debug(message, metadata) {
        this.log('debug', message, metadata);
    }
    info(message, metadata) {
        this.log('info', message, metadata);
    }
    warn(message, metadata) {
        this.log('warn', message, metadata);
    }
    error(message, metadata) {
        this.log('error', message, metadata);
    }
    fatal(message, metadata) {
        this.log('fatal', message, metadata);
    }
}
export class MetricsCollector {
    metrics = new Map();
    recordCounter(name, value = 1, labels) {
        this.recordMetric(name, value, 'counter', labels);
    }
    recordGauge(name, value, labels) {
        this.recordMetric(name, value, 'gauge', labels);
    }
    recordHistogram(name, value, labels) {
        this.recordMetric(name, value, 'histogram', labels);
    }
    recordSummary(name, value, labels) {
        this.recordMetric(name, value, 'summary', labels);
    }
    recordMetric(name, value, type, labels) {
        const metric = {
            name,
            value,
            timestamp: new Date().toISOString(),
            labels,
            type,
        };
        if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
        }
        this.metrics.get(name).push(metric);
    }
    getMetrics(name) {
        if (name) {
            return this.metrics.get(name) || [];
        }
        const allMetrics = [];
        for (const metrics of this.metrics.values()) {
            allMetrics.push(...metrics);
        }
        return allMetrics;
    }
    clearMetrics(name) {
        if (name) {
            this.metrics.delete(name);
        }
        else {
            this.metrics.clear();
        }
    }
}
export class Tracer {
    activeSpans = new Map();
    startSpan(operationName, parentSpanId) {
        const spanId = this.generateId();
        const traceId = parentSpanId ? this.getTraceId(parentSpanId) : this.generateId();
        const span = {
            traceId,
            spanId,
            parentSpanId,
            operationName,
            startTime: new Date().toISOString(),
            tags: {},
        };
        this.activeSpans.set(spanId, span);
        return spanId;
    }
    finishSpan(spanId, tags) {
        const span = this.activeSpans.get(spanId);
        if (!span) {
            return null;
        }
        span.endTime = new Date().toISOString();
        span.duration = new Date(span.endTime).getTime() - new Date(span.startTime).getTime();
        if (tags) {
            span.tags = { ...span.tags, ...tags };
        }
        this.activeSpans.delete(spanId);
        return span;
    }
    addTag(spanId, key, value) {
        const span = this.activeSpans.get(spanId);
        if (span) {
            span.tags = { ...span.tags, [key]: value };
        }
    }
    addLog(spanId, fields) {
        const span = this.activeSpans.get(spanId);
        if (span) {
            if (!span.logs) {
                span.logs = [];
            }
            span.logs.push({
                timestamp: new Date().toISOString(),
                fields,
            });
        }
    }
    generateId() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
    getTraceId(spanId) {
        const span = this.activeSpans.get(spanId);
        return span?.traceId || this.generateId();
    }
}
export class AlertManager {
    alerts = new Map();
    createAlert(id, name, severity, description, labels, annotations) {
        const alert = {
            id,
            name,
            severity,
            status: 'firing',
            description,
            timestamp: new Date().toISOString(),
            labels,
            annotations,
        };
        this.alerts.set(id, alert);
        return alert;
    }
    resolveAlert(id) {
        const alert = this.alerts.get(id);
        if (alert) {
            alert.status = 'resolved';
            alert.timestamp = new Date().toISOString();
        }
        return alert || null;
    }
    silenceAlert(id) {
        const alert = this.alerts.get(id);
        if (alert) {
            alert.status = 'silenced';
            alert.timestamp = new Date().toISOString();
        }
        return alert || null;
    }
    getAlerts(status) {
        const allAlerts = Array.from(this.alerts.values());
        if (status) {
            return allAlerts.filter(alert => alert.status === status);
        }
        return allAlerts;
    }
    getAlert(id) {
        return this.alerts.get(id) || null;
    }
}
export function generateCorrelationId() {
    return `corr_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}
export function generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}
export function generateTraceParent() {
    const traceId = Math.random().toString(16).substring(2, 34).padStart(32, '0');
    const spanId = Math.random().toString(16).substring(2, 18).padStart(16, '0');
    return `00-${traceId}-${spanId}-01`;
}
export default {
    StructuredLogger,
    MetricsCollector,
    Tracer,
    AlertManager,
    generateCorrelationId,
    generateRequestId,
    generateTraceParent,
    LogLevelSchema,
    LogEntrySchema,
    MetricSchema,
    TraceSchema,
    AlertSchema,
};
//# sourceMappingURL=index.js.map