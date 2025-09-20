import { trace, context, SpanKind, SpanStatusCode } from '@opentelemetry/api';
export class TracingService {
    static instance;
    tracer;
    constructor() {
        this.tracer = trace.getTracer('econeura-api', '1.0.0');
    }
    static getInstance() {
        if (!TracingService.instance) {
            TracingService.instance = new TracingService();
        }
        return TracingService.instance;
    }
    createSpan(name, options = {}) {
        const span = this.tracer.startSpan(name, {
            kind: options.kind || SpanKind.INTERNAL,
            attributes: {
                'service.name': 'econeura-api',
                'service.version': '1.0.0',
                ...options.attributes
            },
            startTime: options.startTime
        });
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
                'service.name': 'econeura-api',
                'service.version': '1.0.0',
                ...options.attributes
            }
        });
        if (req.user?.id) {
            span.setAttributes({
                'user.id': req.user.id,
                'user.organization_id': req.user.organizationId || ''
            });
        }
        return span;
    }
    createDatabaseSpan(operation, table, options = {}) {
        const span = this.tracer.startSpan(`db.${operation}`, {
            kind: SpanKind.CLIENT,
            attributes: {
                'db.system': 'postgresql',
                'db.operation': operation,
                'db.sql.table': table,
                'service.name': 'econeura-api',
                'service.version': '1.0.0',
                ...options.attributes
            }
        });
        return span;
    }
    createExternalApiSpan(service, endpoint, options = {}) {
        const span = this.tracer.startSpan(`external.${service}`, {
            kind: SpanKind.CLIENT,
            attributes: {
                'http.method': 'POST',
                'http.url': endpoint,
                'external.service': service,
                'service.name': 'econeura-api',
                'service.version': '1.0.0',
                ...options.attributes
            }
        });
        return span;
    }
    createBusinessSpan(operation, organizationId, options = {}) {
        const span = this.tracer.startSpan(`business.${operation}`, {
            kind: SpanKind.INTERNAL,
            attributes: {
                'business.operation': operation,
                'organization.id': organizationId,
                'service.name': 'econeura-api',
                'service.version': '1.0.0',
                ...options.attributes
            }
        });
        return span;
    }
    async executeWithSpan(name, operation, options = {}) {
        const span = this.createSpan(name, options);
        try {
            const result = await context.with(trace.setSpan(context.active(), span), operation);
            span.setStatus({ code: SpanStatusCode.OK });
            return result;
        }
        catch (error) {
            span.setStatus({
                code: SpanStatusCode.ERROR,
                message: error instanceof Error ? error.message : 'Unknown error'
            });
            span.recordException(error);
            throw error;
        }
        finally {
            span.end();
        }
    }
    async executeWithHttpSpan(req, res, operation, options = {}) {
        const span = this.createHttpSpan(req, res, options);
        try {
            const result = await context.with(trace.setSpan(context.active(), span), operation);
            span.setAttributes({
                'http.status_code': res.statusCode,
                'http.response_size': JSON.stringify(res.locals.responseBody || {}).length
            });
            span.setStatus({ code: SpanStatusCode.OK });
            return result;
        }
        catch (error) {
            span.setStatus({
                code: SpanStatusCode.ERROR,
                message: error instanceof Error ? error.message : 'Unknown error'
            });
            span.recordException(error);
            throw error;
        }
        finally {
            span.end();
        }
    }
    setSpanAttributes(span, attributes) {
        span.setAttributes(attributes);
    }
    addSpanEvent(span, name, attributes) {
        span.addEvent(name, attributes);
    }
    setSpanStatus(span, status) {
        span.setStatus(status);
    }
    recordSpanException(span, error) {
        span.recordException(error);
        span.setStatus({
            code: SpanStatusCode.ERROR,
            message: error.message
        });
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
            service: 'econeura-api'
        };
    }
    httpTracingMiddleware() {
        return (req, res, next) => {
            const span = this.createHttpSpan(req, res);
            req.span = span;
            res.setHeader('X-Trace-Id', span.spanContext().traceId);
            res.setHeader('X-Span-Id', span.spanContext().spanId);
            res.on('finish', () => {
                span.setAttributes({
                    'http.status_code': res.statusCode,
                    'http.response_size': JSON.stringify(res.locals.responseBody || {}).length
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
                span.end();
            });
            next();
        };
    }
    createChildSpan(parentSpan, name, options = {}) {
        const span = this.tracer.startSpan(name, {
            kind: options.kind || SpanKind.INTERNAL,
            attributes: {
                'service.name': 'econeura-api',
                'service.version': '1.0.0',
                ...options.attributes
            }
        });
        return span;
    }
    async tracePerformance(operation, fn, options = {}) {
        const startTime = Date.now();
        const span = this.createSpan(operation, options);
        try {
            const result = await fn();
            const duration = Date.now() - startTime;
            span.setAttributes({
                'performance.duration_ms': duration,
                'performance.operation': operation
            });
            span.setStatus({ code: SpanStatusCode.OK });
            return result;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            span.setAttributes({
                'performance.duration_ms': duration,
                'performance.operation': operation,
                'performance.error': true
            });
            span.setStatus({
                code: SpanStatusCode.ERROR,
                message: error instanceof Error ? error.message : 'Unknown error'
            });
            span.recordException(error);
            throw error;
        }
        finally {
            span.end();
        }
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
export const tracing = TracingService.getInstance();
//# sourceMappingURL=tracing.service.js.map