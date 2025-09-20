import { generateCorrelationId, generateRequestId, generateTraceId, generateSpanId, extractCorrelationId, extractRequestId, extractTraceId, extractSpanId, extractParentSpanId, createChildSpan, createLogContext, setCorrelationIdOnResponse, addCorrelationToRequest, withCorrelationContext, } from '@econeura/shared/correlation';
export function correlationMiddleware(req, res, next) {
    try {
        const correlationId = extractCorrelationId(req.headers) || generateCorrelationId();
        const requestId = extractRequestId(req.headers) || generateRequestId();
        const traceId = extractTraceId(req.headers) || generateTraceId();
        const spanId = extractSpanId(req.headers) || generateSpanId();
        const parentSpanId = extractParentSpanId(req.headers);
        const correlationContext = {
            correlationId,
            requestId,
            traceId,
            spanId,
            parentSpanId,
        };
        req.correlationId = correlationId;
        req.requestId = requestId;
        req.traceId = traceId;
        req.spanId = spanId;
        req.parentSpanId = parentSpanId;
        req.correlationContext = correlationContext;
        res.correlationId = correlationId;
        res.requestId = requestId;
        res.traceId = traceId;
        res.spanId = spanId;
        setCorrelationIdOnResponse(res, correlationId);
        res.setHeader('X-Request-ID', requestId);
        res.setHeader('X-Trace-ID', traceId);
        res.setHeader('X-Span-ID', spanId);
        if (parentSpanId) {
            res.setHeader('X-Parent-Span-ID', parentSpanId);
        }
        addCorrelationToRequest(req, correlationId);
        req.headers['x-request-id'] = requestId;
        req.headers['x-trace-id'] = traceId;
        req.headers['x-span-id'] = spanId;
        if (parentSpanId) {
            req.headers['x-parent-span-id'] = parentSpanId;
        }
        withCorrelationContext(correlationContext, () => {
            next();
        });
    }
    catch (error) {
        console.error('Correlation middleware error:', error);
        next();
    }
}
export function correlationLoggingMiddleware(req, res, next) {
    const startTime = Date.now();
    const requestLog = createLogContext(req.correlationContext, {
        event: 'request_start',
        method: req.method,
        path: req.path,
        userAgent: req.headers['user-agent'],
        ip: req.ip,
        timestamp: new Date().toISOString(),
    });
    const originalEnd = res.end;
    res.end = function (chunk, encoding) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        const responseLog = createLogContext(req.correlationContext, {
            event: 'request_end',
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration,
            timestamp: new Date().toISOString(),
        });
        originalEnd.call(this, chunk, encoding);
    };
    next();
}
export function correlationPropagationMiddleware(req, res, next) {
    const originalFetch = global.fetch;
    if (originalFetch) {
        global.fetch = function (input, init) {
            const headers = new Headers(init?.headers);
            headers.set('X-Correlation-ID', req.correlationId);
            headers.set('X-Request-ID', req.requestId);
            headers.set('X-Trace-ID', req.traceId);
            headers.set('X-Span-ID', req.spanId);
            if (req.parentSpanId) {
                headers.set('X-Parent-Span-ID', req.parentSpanId);
            }
            return originalFetch(input, {
                ...init,
                headers,
            });
        };
    }
    next();
}
export function correlationErrorMiddleware(error, req, res, next) {
    const errorLog = createLogContext(req.correlationContext, {
        event: 'error',
        error: {
            message: error.message,
            stack: error.stack,
            code: error.code,
        },
        method: req.method,
        path: req.path,
        timestamp: new Date().toISOString(),
    });
    console.error('Request error:', errorLog);
    setCorrelationIdOnResponse(res, req.correlationId);
    res.setHeader('X-Request-ID', req.requestId);
    res.setHeader('X-Trace-ID', req.traceId);
    res.setHeader('X-Span-ID', req.spanId);
    if (req.parentSpanId) {
        res.setHeader('X-Parent-Span-ID', req.parentSpanId);
    }
    next(error);
}
export function getCorrelationContext(req) {
    return req.correlationContext;
}
export function createChildSpanFromRequest(req, operationName) {
    return createChildSpan(req.correlationContext, operationName);
}
export function logWithCorrelation(req, level, message, data) {
    const logData = createLogContext(req.correlationContext, {
        level,
        message,
        ...data,
        timestamp: new Date().toISOString(),
    });
    switch (level) {
        case 'info':
            console.info(message, logData);
            break;
        case 'warn':
            console.warn(message, logData);
            break;
        case 'error':
            console.error(message, logData);
            break;
    }
}
export function addCorrelationToResponse(res, data) {
    if (typeof data === 'object' && data !== null) {
        return {
            ...data,
            correlationId: res.correlationId,
            requestId: res.requestId,
            traceId: res.traceId,
            spanId: res.spanId,
        };
    }
    return data;
}
export function createMockCorrelationRequest() {
    const correlationId = generateCorrelationId();
    const requestId = generateRequestId();
    const traceId = generateTraceId();
    const spanId = generateSpanId();
    return {
        correlationId,
        requestId,
        traceId,
        spanId,
        correlationContext: {
            correlationId,
            requestId,
            traceId,
            spanId,
        },
        headers: {
            'x-correlation-id': correlationId,
            'x-request-id': requestId,
            'x-trace-id': traceId,
            'x-span-id': spanId,
        },
    };
}
export function createMockCorrelationResponse() {
    const correlationId = generateCorrelationId();
    const requestId = generateRequestId();
    const traceId = generateTraceId();
    const spanId = generateSpanId();
    return {
        correlationId,
        requestId,
        traceId,
        spanId,
        setHeader: jest.fn(),
    };
}
export default {
    correlationMiddleware,
    correlationLoggingMiddleware,
    correlationPropagationMiddleware,
    correlationErrorMiddleware,
    getCorrelationContext,
    createChildSpanFromRequest,
    logWithCorrelation,
    addCorrelationToResponse,
    createMockCorrelationRequest,
    createMockCorrelationResponse,
};
//# sourceMappingURL=correlation.js.map