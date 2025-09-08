import { z } from 'zod';

// ============================================================================
// OBSERVABILITY SCHEMAS
// ============================================================================

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

// ============================================================================
// TYPES
// ============================================================================

export type LogLevel = z.infer<typeof LogLevelSchema>;
export type LogEntry = z.infer<typeof LogEntrySchema>;
export type Metric = z.infer<typeof MetricSchema>;
export type Trace = z.infer<typeof TraceSchema>;
export type Alert = z.infer<typeof AlertSchema>;

// ============================================================================
// LOGGER
// ============================================================================

export class StructuredLogger {
  private service: string;
  private correlationId?: string;
  private requestId?: string;
  private userId?: string;

  constructor(service: string) {
    this.service = service;
  }

  setContext(correlationId?: string, requestId?: string, userId?: string): void {
    this.correlationId = correlationId;
    this.requestId = requestId;
    this.userId = userId;
  }

  private log(level: LogLevel, message: string, metadata?: Record<string, unknown>): void {
    const logEntry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      service: this.service,
      correlationId: this.correlationId,
      requestId: this.requestId,
      userId: this.userId,
      metadata,
    };

    // In production, this would send to a logging service
    console.log(JSON.stringify(logEntry));
  }

  debug(message: string, metadata?: Record<string, unknown>): void {
    this.log('debug', message, metadata);
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    this.log('info', message, metadata);
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    this.log('warn', message, metadata);
  }

  error(message: string, metadata?: Record<string, unknown>): void {
    this.log('error', message, metadata);
  }

  fatal(message: string, metadata?: Record<string, unknown>): void {
    this.log('fatal', message, metadata);
  }
}

// ============================================================================
// METRICS
// ============================================================================

export class MetricsCollector {
  private metrics: Map<string, Metric[]> = new Map();

  recordCounter(name: string, value: number = 1, labels?: Record<string, string>): void {
    this.recordMetric(name, value, 'counter', labels);
  }

  recordGauge(name: string, value: number, labels?: Record<string, string>): void {
    this.recordMetric(name, value, 'gauge', labels);
  }

  recordHistogram(name: string, value: number, labels?: Record<string, string>): void {
    this.recordMetric(name, value, 'histogram', labels);
  }

  recordSummary(name: string, value: number, labels?: Record<string, string>): void {
    this.recordMetric(name, value, 'summary', labels);
  }

  private recordMetric(name: string, value: number, type: Metric['type'], labels?: Record<string, string>): void {
    const metric: Metric = {
      name,
      value,
      timestamp: new Date().toISOString(),
      labels,
      type,
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(metric);
  }

  getMetrics(name?: string): Metric[] {
    if (name) {
      return this.metrics.get(name) || [];
    }
    
    const allMetrics: Metric[] = [];
    for (const metrics of this.metrics.values()) {
      allMetrics.push(...metrics);
    }
    return allMetrics;
  }

  clearMetrics(name?: string): void {
    if (name) {
      this.metrics.delete(name);
    } else {
      this.metrics.clear();
    }
  }
}

// ============================================================================
// TRACING
// ============================================================================

export class Tracer {
  private activeSpans: Map<string, Trace> = new Map();

  startSpan(operationName: string, parentSpanId?: string): string {
    const spanId = this.generateId();
    const traceId = parentSpanId ? this.getTraceId(parentSpanId) : this.generateId();

    const span: Trace = {
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

  finishSpan(spanId: string, tags?: Record<string, string>): Trace | null {
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

  addTag(spanId: string, key: string, value: string): void {
    const span = this.activeSpans.get(spanId);
    if (span) {
      span.tags = { ...span.tags, [key]: value };
    }
  }

  addLog(spanId: string, fields: Record<string, unknown>): void {
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

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private getTraceId(spanId: string): string {
    const span = this.activeSpans.get(spanId);
    return span?.traceId || this.generateId();
  }
}

// ============================================================================
// ALERTS
// ============================================================================

export class AlertManager {
  private alerts: Map<string, Alert> = new Map();

  createAlert(
    id: string,
    name: string,
    severity: Alert['severity'],
    description: string,
    labels?: Record<string, string>,
    annotations?: Record<string, string>
  ): Alert {
    const alert: Alert = {
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

  resolveAlert(id: string): Alert | null {
    const alert = this.alerts.get(id);
    if (alert) {
      alert.status = 'resolved';
      alert.timestamp = new Date().toISOString();
    }
    return alert || null;
  }

  silenceAlert(id: string): Alert | null {
    const alert = this.alerts.get(id);
    if (alert) {
      alert.status = 'silenced';
      alert.timestamp = new Date().toISOString();
    }
    return alert || null;
  }

  getAlerts(status?: Alert['status']): Alert[] {
    const allAlerts = Array.from(this.alerts.values());
    if (status) {
      return allAlerts.filter(alert => alert.status === status);
    }
    return allAlerts;
  }

  getAlert(id: string): Alert | null {
    return this.alerts.get(id) || null;
  }
}

// ============================================================================
// CORRELATION ID UTILITIES
// ============================================================================

export function generateCorrelationId(): string {
  return `corr_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

export function generateTraceParent(): string {
  const traceId = Math.random().toString(16).substring(2, 34).padStart(32, '0');
  const spanId = Math.random().toString(16).substring(2, 18).padStart(16, '0');
  return `00-${traceId}-${spanId}-01`;
}

// ============================================================================
// EXPORTS
// ============================================================================

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
