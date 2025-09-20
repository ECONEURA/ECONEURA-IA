import { SpanStatusCode } from '@opentelemetry/api';
import { observabilityOTelService } from '../services/observability-otel.service.js';
import { structuredLogger } from '../lib/structured-logger.js';
export function tracePropagationMiddleware() {
    return (req, res, next) => {
        try {
            const traceHeaders = extractTraceHeaders(req);
            const traceContext = createTraceContext(traceHeaders, req);
            req.traceContext = traceContext;
            req.startTime = Date.now();
            const span = observabilityOTelService.createHttpSpan(req, res, {
                attributes: {
                    'trace.propagation': 'incoming',
                    'trace.request_id': traceContext.requestId,
                    'trace.correlation_id': traceContext.correlationId,
                    'trace.parent_span_id': traceContext.parentSpanId || '',
                    'trace.incoming': true
                }
            });
            req.span = span;
            addTraceHeadersToResponse(res, traceContext, span);
            setupSpanFinalization(req, res, span);
            structuredLogger.info('Trace propagation middleware applied', {
                traceId: traceContext.traceId,
                spanId: traceContext.spanId,
                parentSpanId: traceContext.parentSpanId,
                requestId: traceContext.requestId,
                correlationId: traceContext.correlationId,
                method: req.method,
                path: req.path
            });
            next();
        }
        catch (error) {
            structuredLogger.error('Trace propagation middleware failed', {
                error: error.message,
                method: req.method,
                path: req.path
            });
            next();
        }
    };
}
export function outgoingTracePropagationMiddleware() {
    return (req, res, next) => {
        try {
            structuredLogger.debug('Outgoing trace propagation middleware applied', {
                method: req.method,
                path: req.path
            });
            next();
        }
        catch (error) {
            structuredLogger.error('Outgoing trace propagation middleware failed', {
                error: error.message
            });
            next();
        }
    };
}
function extractTraceHeaders(req) {
    return {
        'traceparent': req.headers['traceparent'],
        'tracestate': req.headers['tracestate'],
        'x-trace-id': req.headers['x-trace-id'],
        'x-span-id': req.headers['x-span-id'],
        'x-request-id': req.headers['x-request-id'],
        'x-correlation-id': req.headers['x-correlation-id']
    };
}
function createTraceContext(headers, req) {
    const traceId = headers['x-trace-id'] || generateTraceId();
    const spanId = generateSpanId();
    const requestId = headers['x-request-id'] || generateRequestId();
    const correlationId = headers['x-correlation-id'] || generateCorrelationId();
    const parentSpanId = headers['x-span-id'];
    return {
        traceId,
        spanId,
        parentSpanId,
        requestId,
        correlationId
    };
}
function addTraceHeadersToResponse(res, traceContext, span) {
    if (!traceContext)
        return;
    res.setHeader('X-Trace-Id', traceContext.traceId);
    res.setHeader('X-Span-Id', traceContext.spanId);
    res.setHeader('X-Request-ID', traceContext.requestId);
    res.setHeader('X-Correlation-ID', traceContext.correlationId);
    const traceparent = `00-${traceContext.traceId}-${traceContext.spanId}-01`;
    res.setHeader('Traceparent', traceparent);
    res.setHeader('X-Trace-Propagation', 'enabled');
    res.setHeader('X-Trace-Service', 'econeura-api');
    res.setHeader('X-Trace-Version', '1.0.0');
}
function setupSpanFinalization(req, res, span) {
    res.on('finish', () => {
        try {
            const duration = Date.now() - (req.startTime || Date.now());
            span.setAttributes({
                'http.status_code': res.statusCode,
                'http.response_size': JSON.stringify(res.locals.responseBody || {}).length,
                'performance.duration_ms': duration,
                'trace.propagation': 'outgoing',
                'trace.completed': true
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
            structuredLogger.info('Span finalized', {
                traceId: req.traceContext?.traceId,
                spanId: req.traceContext?.spanId,
                duration,
                statusCode: res.statusCode,
                method: req.method,
                path: req.path
            });
        }
        catch (error) {
            structuredLogger.error('Failed to finalize span', {
                error: error.message,
                traceId: req.traceContext?.traceId,
                spanId: req.traceContext?.spanId
            });
        }
    });
}
function generateTraceId() {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
function generateSpanId() {
    return `span_${Math.random().toString(36).substr(2, 9)}`;
}
function generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
function generateCorrelationId() {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
export function getCurrentTraceContext() {
    const span = observabilityOTelService.getCurrentSpan();
    if (!span)
        return undefined;
    const spanContext = span.spanContext();
    return {
        traceId: spanContext.traceId,
        spanId: spanContext.spanId,
        requestId: generateRequestId(),
        correlationId: generateCorrelationId()
    };
}
export function createChildSpanWithPropagation(parentSpan, name, attributes = {}) {
    const childSpan = observabilityOTelService.createChildSpan(parentSpan, name, { attributes });
    childSpan.setAttributes({
        'trace.propagation': 'child',
        'trace.parent_span_id': parentSpan.spanContext().spanId,
        'trace.parent_trace_id': parentSpan.spanContext().traceId
    });
    return childSpan;
}
export function propagateTraceToOutgoingRequest(headers = {}) {
    const traceContext = getCurrentTraceContext();
    if (!traceContext)
        return headers;
    return {
        ...headers,
        'X-Trace-Id': traceContext.traceId,
        'X-Span-Id': traceContext.spanId,
        'X-Request-ID': traceContext.requestId,
        'X-Correlation-ID': traceContext.correlationId,
        'Traceparent': `00-${traceContext.traceId}-${traceContext.spanId}-01`
    };
}
export function traceLoggingMiddleware() {
    return (req, res, next) => {
        const startTime = Date.now();
        structuredLogger.info('Request started with trace propagation', {
            traceId: req.traceContext?.traceId,
            spanId: req.traceContext?.spanId,
            parentSpanId: req.traceContext?.parentSpanId,
            requestId: req.traceContext?.requestId,
            correlationId: req.traceContext?.correlationId,
            method: req.method,
            path: req.path,
            userAgent: req.get('User-Agent'),
            ip: req.ip
        });
        res.on('finish', () => {
            const duration = Date.now() - startTime;
            structuredLogger.info('Request completed with trace propagation', {
                traceId: req.traceContext?.traceId,
                spanId: req.traceContext?.spanId,
                requestId: req.traceContext?.requestId,
                correlationId: req.traceContext?.correlationId,
                method: req.method,
                path: req.path,
                statusCode: res.statusCode,
                duration,
                responseSize: JSON.stringify(res.locals.responseBody || {}).length
            });
        });
        next();
    };
}
export function traceValidationMiddleware() {
    return (req, res, next) => {
        try {
            const traceHeaders = extractTraceHeaders(req);
            if (traceHeaders.traceparent) {
                const isValid = validateTraceparent(traceHeaders.traceparent);
                if (!isValid) {
                    structuredLogger.warn('Invalid traceparent header', {
                        traceparent: traceHeaders.traceparent,
                        method: req.method,
                        path: req.path
                    });
                }
            }
            if (traceHeaders['x-trace-id']) {
                const isValid = validateTraceId(traceHeaders['x-trace-id']);
                if (!isValid) {
                    structuredLogger.warn('Invalid trace ID header', {
                        traceId: traceHeaders['x-trace-id'],
                        method: req.method,
                        path: req.path
                    });
                }
            }
            next();
        }
        catch (error) {
            structuredLogger.error('Trace validation middleware failed', {
                error: error.message
            });
            next();
        }
    };
}
function validateTraceparent(traceparent) {
    const parts = traceparent.split('-');
    return parts.length === 4 && parts[0] === '00';
}
function validateTraceId(traceId) {
    return /^[a-zA-Z0-9_-]+$/.test(traceId) && traceId.length > 0 && traceId.length <= 64;
}
//# sourceMappingURL=trace-propagation.middleware.js.map