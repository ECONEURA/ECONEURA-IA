import { trace, context, SpanKind, SpanStatusCode, metrics } from '@opentelemetry/api';

import { structuredLogger } from '../lib/structured-logger.js';
class ObservabilityOTelService {
    static instance;
    tracer;
    meter;
    config;
    spanMetrics;
    serviceMetrics;
    activeSpans = new Map();
    spanDurations = [];
    constructor() {
        this.tracer = trace.getTracer('econeura-api', '1.0.0');
        this.meter = metrics.getMeter('econeura-api', '1.0.0');
        this.config = this.getDefaultConfig();
        this.spanMetrics = this.getDefaultSpanMetrics();
        this.serviceMetrics = this.getDefaultServiceMetrics();
        this.init();
    }
    static getInstance() {
        if (!ObservabilityOTelService.instance) {
            ObservabilityOTelService.instance = new ObservabilityOTelService();
        }
        return ObservabilityOTelService.instance;
    }
    getDefaultConfig() {
        return {
            service: {
                name: 'econeura-api',
                version: '1.0.0',
                environment: process.env.NODE_ENV || 'development',
                instance: process.env.HOSTNAME || 'localhost'
            },
            tracing: {
                enabled: true,
                samplingRate: 1.0,
                maxSpansPerTrace: 100,
                batchSize: 512,
                exportTimeout: 30000
            },
            metrics: {
                enabled: true,
                collectionInterval: 30000,
                customMetrics: true
            },
            logging: {
                enabled: true,
                level: 'info',
                structured: true
            }
        };
    }
    getDefaultSpanMetrics() {
        return {
            totalSpans: 0,
            activeSpans: 0,
            completedSpans: 0,
            errorSpans: 0,
            averageDuration: 0,
            p95Duration: 0,
            p99Duration: 0
        };
    }
    getDefaultServiceMetrics() {
        return {
            requests: {
                total: 0,
                successful: 0,
                failed: 0,
                rate: 0
            },
            latency: {
                average: 0,
                p50: 0,
                p95: 0,
                p99: 0
            },
            errors: {
                total: 0,
                rate: 0,
                byType: {}
            },
            resources: {
                memory: {
                    used: 0,
                    total: 0,
                    percentage: 0
                },
                cpu: {
                    usage: 0,
                    load: 0
                }
            }
        };
    }
    init() {
        try {
            this.initializeMetrics();
            this.startCleanupScheduler();
            this.startSystemMetricsCollection();
            structuredLogger.info('Observability OpenTelemetry service initialized', {
                service: this.config.service.name,
                version: this.config.service.version,
                environment: this.config.service.environment,
                tracingEnabled: this.config.tracing.enabled,
                metricsEnabled: this.config.metrics.enabled
            });
        }
        catch (error) {
            structuredLogger.error('Failed to initialize observability service', {
                error: error.message
            });
            throw error;
        }
    }
    initializeMetrics() {
        this.meter.createCounter('http_requests_total', {
            description: 'Total number of HTTP requests',
            unit: '1'
        });
        this.meter.createHistogram('http_request_duration_ms', {
            description: 'HTTP request duration in milliseconds',
            unit: 'ms'
        });
        this.meter.createCounter('http_errors_total', {
            description: 'Total number of HTTP errors',
            unit: '1'
        });
        this.meter.createCounter('spans_total', {
            description: 'Total number of spans created',
            unit: '1'
        });
        this.meter.createHistogram('span_duration_ms', {
            description: 'Span duration in milliseconds',
            unit: 'ms'
        });
        this.meter.createGauge('memory_usage_bytes', {
            description: 'Memory usage in bytes',
            unit: 'bytes'
        });
        this.meter.createGauge('cpu_usage_percent', {
            description: 'CPU usage percentage',
            unit: 'percent'
        });
    }
    createSpan(name, options = {}) {
        const span = this.tracer.startSpan(name, {
            kind: options.kind || SpanKind.INTERNAL,
            attributes: {
                'service.name': this.config.service.name,
                'service.version': this.config.service.version,
                'service.environment': this.config.service.environment,
                'service.instance': this.config.service.instance,
                ...options.attributes
            }
        });
        this.activeSpans.set(span.spanContext().spanId, span);
        this.spanMetrics.totalSpans++;
        this.spanMetrics.activeSpans++;
        return span;
    }
    createHttpSpan(req, res, options = {}) {
        const span = this.tracer.startSpan(`${req.method} ${req.path}`, {
            kind: SpanKind.SERVER,
            attributes: {
                'http.method': req.method,
                'http.url': req.url,
                'http.route': req.route?.path || req.path,
                'http.user_agent': req.headers['user-agent'] || '',
                'http.request_id': req.headers['x-request-id'] || '',
                'http.tenant_id': req.headers['x-tenant-id'] || '',
                'http.organization_id': req.headers['x-organization-id'] || '',
                'service.name': this.config.service.name,
                'service.version': this.config.service.version,
                'service.environment': this.config.service.environment,
                ...options.attributes
            }
        });
        if (req.user?.id) {
            span.setAttributes({
                'user.id': req.user.id,
                'user.organization_id': req.user.organizationId || '',
                'user.tenant_id': req.user.tenantId || ''
            });
        }
        this.activeSpans.set(span.spanContext().spanId, span);
        this.spanMetrics.totalSpans++;
        this.spanMetrics.activeSpans++;
        return span;
    }
    createDatabaseSpan(operation, table, options = {}) {
        const span = this.tracer.startSpan(`db.${operation}`, {
            kind: SpanKind.CLIENT,
            attributes: {
                'db.system': 'postgresql',
                'db.operation': operation,
                'db.sql.table': table,
                'service.name': this.config.service.name,
                'service.version': this.config.service.version,
                ...options.attributes
            }
        });
        this.activeSpans.set(span.spanContext().spanId, span);
        this.spanMetrics.totalSpans++;
        this.spanMetrics.activeSpans++;
        return span;
    }
    createExternalApiSpan(service, endpoint, options = {}) {
        const span = this.tracer.startSpan(`external.${service}`, {
            kind: SpanKind.CLIENT,
            attributes: {
                'http.method': 'POST',
                'http.url': endpoint,
                'external.service': service,
                'service.name': this.config.service.name,
                'service.version': this.config.service.version,
                ...options.attributes
            }
        });
        this.activeSpans.set(span.spanContext().spanId, span);
        this.spanMetrics.totalSpans++;
        this.spanMetrics.activeSpans++;
        return span;
    }
    createBusinessSpan(operation, organizationId, options = {}) {
        const span = this.tracer.startSpan(`business.${operation}`, {
            kind: SpanKind.INTERNAL,
            attributes: {
                'business.operation': operation,
                'organization.id': organizationId,
                'service.name': this.config.service.name,
                'service.version': this.config.service.version,
                ...options.attributes
            }
        });
        this.activeSpans.set(span.spanContext().spanId, span);
        this.spanMetrics.totalSpans++;
        this.spanMetrics.activeSpans++;
        return span;
    }
    async executeWithSpan(name, operation, options = {}) {
        const span = this.createSpan(name, options);
        const startTime = Date.now();
        try {
            const result = await context.with(trace.setSpan(context.active(), span), operation);
            const duration = Date.now() - startTime;
            span.setAttributes({
                'performance.duration_ms': duration,
                'performance.operation': name
            });
            span.setStatus({ code: SpanStatusCode.OK });
            this.recordSpanCompletion(span, duration, false);
            return result;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            span.setAttributes({
                'performance.duration_ms': duration,
                'performance.operation': name,
                'performance.error': true
            });
            span.setStatus({
                code: SpanStatusCode.ERROR,
                message: error instanceof Error ? error.message : 'Unknown error'
            });
            span.recordException(error);
            this.recordSpanCompletion(span, duration, true);
            throw error;
        }
        finally {
            span.end();
        }
    }
    async executeWithHttpSpan(req, res, operation, options = {}) {
        const span = this.createHttpSpan(req, res, options);
        const startTime = Date.now();
        try {
            const result = await context.with(trace.setSpan(context.active(), span), operation);
            const duration = Date.now() - startTime;
            span.setAttributes({
                'http.status_code': res.statusCode,
                'http.response_size': JSON.stringify(res.locals.responseBody || {}).length,
                'performance.duration_ms': duration
            });
            if (res.statusCode >= 400) {
                span.setStatus({
                    code: SpanStatusCode.ERROR,
                    message: `HTTP ${res.statusCode}`
                });
                this.recordHttpRequest(req, res, duration, true);
            }
            else {
                span.setStatus({ code: SpanStatusCode.OK });
                this.recordHttpRequest(req, res, duration, false);
            }
            this.recordSpanCompletion(span, duration, res.statusCode >= 400);
            return result;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            span.setStatus({
                code: SpanStatusCode.ERROR,
                message: error instanceof Error ? error.message : 'Unknown error'
            });
            span.recordException(error);
            this.recordHttpRequest(req, res, duration, true);
            this.recordSpanCompletion(span, duration, true);
            throw error;
        }
        finally {
            span.end();
        }
    }
    getCurrentSpan() {
        return trace.getActiveSpan();
    }
    getCurrentTraceId() {
        const span = this.getCurrentSpan();
        return span?.spanContext().traceId;
    }
    getCurrentSpanId() {
        const span = this.getCurrentSpan();
        return span?.spanContext().spanId;
    }
    getTraceContext() {
        const span = this.getCurrentSpan();
        if (!span)
            return undefined;
        const spanContext = span.spanContext();
        return {
            traceId: spanContext.traceId,
            spanId: spanContext.spanId,
            operation: span.name,
            service: this.config.service.name
        };
    }
    recordSpanCompletion(span, duration, isError) {
        this.spanMetrics.activeSpans--;
        this.spanMetrics.completedSpans++;
        if (isError) {
            this.spanMetrics.errorSpans++;
        }
        this.spanDurations.push(duration);
        if (this.spanDurations.length > 1000) {
            this.spanDurations.shift();
        }
        this.updateDurationMetrics();
        this.activeSpans.delete(span.spanContext().spanId);
    }
    recordHttpRequest(req, res, duration, isError) {
        this.serviceMetrics.requests.total++;
        if (isError) {
            this.serviceMetrics.requests.failed++;
            this.serviceMetrics.errors.total++;
            const errorType = `http_${res.statusCode}`;
            this.serviceMetrics.errors.byType[errorType] = (this.serviceMetrics.errors.byType[errorType] || 0) + 1;
        }
        else {
            this.serviceMetrics.requests.successful++;
        }
        this.updateLatencyMetrics(duration);
    }
    updateDurationMetrics() {
        if (this.spanDurations.length === 0)
            return;
        const sorted = [...this.spanDurations].sort((a, b) => a - b);
        const len = sorted.length;
        this.spanMetrics.averageDuration = sorted.reduce((sum, d) => sum + d, 0) / len;
        this.spanMetrics.p95Duration = sorted[Math.floor(len * 0.95)];
        this.spanMetrics.p99Duration = sorted[Math.floor(len * 0.99)];
    }
    updateLatencyMetrics(duration) {
        this.updateDurationMetrics();
        this.serviceMetrics.latency.average = this.spanMetrics.averageDuration;
        this.serviceMetrics.latency.p50 = this.spanMetrics.averageDuration;
        this.serviceMetrics.latency.p95 = this.spanMetrics.p95Duration;
        this.serviceMetrics.latency.p99 = this.spanMetrics.p99Duration;
    }
    startSystemMetricsCollection() {
        if (!this.config.metrics.enabled)
            return;
        setInterval(() => {
            this.collectSystemMetrics();
        }, this.config.metrics.collectionInterval);
    }
    collectSystemMetrics() {
        try {
            const memUsage = process.memoryUsage();
            const cpuUsage = process.cpuUsage();
            this.serviceMetrics.resources.memory.used = memUsage.heapUsed;
            this.serviceMetrics.resources.memory.total = memUsage.heapTotal;
            this.serviceMetrics.resources.memory.percentage = (memUsage.heapUsed / memUsage.heapTotal) * 100;
            this.serviceMetrics.resources.cpu.usage = 0;
            this.serviceMetrics.resources.cpu.load = 0;
            structuredLogger.debug('System metrics collected', {
                memory: this.serviceMetrics.resources.memory,
                cpu: this.serviceMetrics.resources.cpu
            });
        }
        catch (error) {
            structuredLogger.error('Failed to collect system metrics', {
                error: error.message
            });
        }
    }
    startCleanupScheduler() {
        setInterval(() => {
            this.cleanup();
        }, 5 * 60 * 1000);
    }
    cleanup() {
        try {
            const cutoff = Date.now() - 5 * 60 * 1000;
            const orphanedSpans = [];
            for (const [spanId, span] of this.activeSpans) {
                if (this.spanMetrics.totalSpans > 10000) {
                    orphanedSpans.push(spanId);
                }
            }
            for (const spanId of orphanedSpans) {
                this.activeSpans.delete(spanId);
                this.spanMetrics.activeSpans--;
            }
            if (this.spanDurations.length > 1000) {
                this.spanDurations = this.spanDurations.slice(-1000);
            }
            structuredLogger.debug('Observability cleanup completed', {
                orphanedSpansRemoved: orphanedSpans.length,
                activeSpans: this.spanMetrics.activeSpans,
                totalDurations: this.spanDurations.length
            });
        }
        catch (error) {
            structuredLogger.error('Observability cleanup failed', {
                error: error.message
            });
        }
    }
    getConfig() {
        return { ...this.config };
    }
    getSpanMetrics() {
        return { ...this.spanMetrics };
    }
    getServiceMetrics() {
        return { ...this.serviceMetrics };
    }
    getActiveSpans() {
        return Array.from(this.activeSpans.values());
    }
    getActiveSpanCount() {
        return this.activeSpans.size;
    }
    httpTracingMiddleware() {
        return (req, res, next) => {
            const span = this.createHttpSpan(req, res);
            req.span = span;
            res.setHeader('X-Trace-Id', span.spanContext().traceId);
            res.setHeader('X-Span-Id', span.spanContext().spanId);
            res.on('finish', () => {
                const duration = Date.now() - req.startTime || 0;
                span.setAttributes({
                    'http.status_code': res.statusCode,
                    'http.response_size': JSON.stringify(res.locals.responseBody || {}).length,
                    'performance.duration_ms': duration
                });
                if (res.statusCode >= 400) {
                    span.setStatus({
                        code: SpanStatusCode.ERROR,
                        message: `HTTP ${res.statusCode}`
                    });
                }
                else {
                    span.setStatus({ code: SpanStatusCode.OK });
                }
                this.recordSpanCompletion(span, duration, res.statusCode >= 400);
                span.end();
            });
            next();
        };
    }
    createChildSpan(parentSpan, name, options = {}) {
        const span = this.tracer.startSpan(name, {
            kind: SpanKind.INTERNAL,
            attributes: {
                'service.name': this.config.service.name,
                'service.version': this.config.service.version,
                ...options.attributes
            }
        });
        this.activeSpans.set(span.spanContext().spanId, span);
        this.spanMetrics.totalSpans++;
        this.spanMetrics.activeSpans++;
        return span;
    }
    traceError(error, context = {}) {
        const span = this.getCurrentSpan();
        if (span) {
            span.recordException(error);
            span.setAttributes({
                'error.name': error.name,
                'error.message': error.message,
                'error.stack': error.stack || '',
                ...context
            });
            span.setStatus({
                code: SpanStatusCode.ERROR,
                message: error.message
            });
        }
        this.serviceMetrics.errors.total++;
        const errorType = error.constructor.name;
        this.serviceMetrics.errors.byType[errorType] = (this.serviceMetrics.errors.byType[errorType] || 0) + 1;
    }
    traceBusinessOperation(operation, organizationId, context = {}) {
        const span = this.createBusinessSpan(operation, organizationId);
        span.setAttributes({
            'business.operation': operation,
            'organization.id': organizationId,
            ...context
        });
        return span;
    }
}
export const observabilityOTelService = ObservabilityOTelService.getInstance();
//# sourceMappingURL=observability-otel.service.js.map