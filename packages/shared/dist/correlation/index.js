import { randomUUID } from 'crypto';
export function generateCorrelationId() {
    return `corr_${Date.now()}_${randomUUID().substring(0, 8)}`;
}
export function generateRequestId() {
    return `req_${Date.now()}_${randomUUID().substring(0, 8)}`;
}
export function generateTraceId() {
    return `trace_${Date.now()}_${randomUUID().substring(0, 8)}`;
}
export function generateSpanId() {
    return `span_${Date.now()}_${randomUUID().substring(0, 8)}`;
}
export function isValidCorrelationId(correlationId) {
    if (!correlationId || typeof correlationId !== 'string') {
        return false;
    }
    const correlationIdPattern = /^corr_\d+_[a-f0-9]{8}$/;
    return correlationIdPattern.test(correlationId);
}
export function isValidRequestId(requestId) {
    if (!requestId || typeof requestId !== 'string') {
        return false;
    }
    const requestIdPattern = /^req_\d+_[a-f0-9]{8}$/;
    return requestIdPattern.test(requestId);
}
export function isValidTraceId(traceId) {
    if (!traceId || typeof traceId !== 'string') {
        return false;
    }
    const traceIdPattern = /^trace_\d+_[a-f0-9]{8}$/;
    return traceIdPattern.test(traceId);
}
export function isValidSpanId(spanId) {
    if (!spanId || typeof spanId !== 'string') {
        return false;
    }
    const spanIdPattern = /^span_\d+_[a-f0-9]{8}$/;
    return spanIdPattern.test(spanId);
}
export function extractCorrelationId(headers) {
    const correlationId = headers['x-correlation-id'];
    if (Array.isArray(correlationId)) {
        return isValidCorrelationId(correlationId[0]) ? correlationId[0] : null;
    }
    if (typeof correlationId === 'string') {
        return isValidCorrelationId(correlationId) ? correlationId : null;
    }
    return null;
}
export function extractRequestId(headers) {
    const requestId = headers['x-request-id'];
    if (Array.isArray(requestId)) {
        return isValidRequestId(requestId[0]) ? requestId[0] : null;
    }
    if (typeof requestId === 'string') {
        return isValidRequestId(requestId) ? requestId : null;
    }
    return null;
}
export function extractTraceId(headers) {
    const traceId = headers['x-trace-id'];
    if (Array.isArray(traceId)) {
        return isValidTraceId(traceId[0]) ? traceId[0] : null;
    }
    if (typeof traceId === 'string') {
        return isValidTraceId(traceId) ? traceId : null;
    }
    return null;
}
export function extractSpanId(headers) {
    const spanId = headers['x-span-id'];
    if (Array.isArray(spanId)) {
        return isValidSpanId(spanId[0]) ? spanId[0] : null;
    }
    if (typeof spanId === 'string') {
        return isValidSpanId(spanId) ? spanId : null;
    }
    return null;
}
export function extractParentSpanId(headers) {
    const parentSpanId = headers['x-parent-span-id'];
    if (Array.isArray(parentSpanId)) {
        return isValidSpanId(parentSpanId[0]) ? parentSpanId[0] : null;
    }
    if (typeof parentSpanId === 'string') {
        return isValidSpanId(parentSpanId) ? parentSpanId : null;
    }
    return null;
}
export function createCorrelationContext(headers) {
    const correlationId = extractCorrelationId(headers) || generateCorrelationId();
    const requestId = extractRequestId(headers) || generateRequestId();
    const traceId = extractTraceId(headers) || generateTraceId();
    const spanId = extractSpanId(headers) || generateSpanId();
    const parentSpanId = extractParentSpanId(headers);
    return {
        correlationId,
        requestId,
        traceId,
        spanId,
        parentSpanId,
    };
}
export function createCorrelationHeaders(context) {
    const headers = {
        'x-correlation-id': context.correlationId,
    };
    if (context.requestId) {
        headers['x-request-id'] = context.requestId;
    }
    if (context.userId) {
        headers['x-user-id'] = context.userId;
    }
    if (context.sessionId) {
        headers['x-session-id'] = context.sessionId;
    }
    if (context.traceId) {
        headers['x-trace-id'] = context.traceId;
    }
    if (context.spanId) {
        headers['x-span-id'] = context.spanId;
    }
    if (context.parentSpanId) {
        headers['x-parent-span-id'] = context.parentSpanId;
    }
    return headers;
}
export function propagateCorrelationId(sourceHeaders, targetHeaders = {}) {
    const context = createCorrelationContext(sourceHeaders);
    const correlationHeaders = createCorrelationHeaders(context);
    return {
        ...targetHeaders,
        ...correlationHeaders,
    };
}
export function createChildSpan(parentContext, operationName) {
    const childSpanId = generateSpanId();
    return {
        ...parentContext,
        spanId: childSpanId,
        parentSpanId: parentContext.spanId,
    };
}
export function addCorrelationToLog(logData, context) {
    return {
        ...logData,
        correlationId: context.correlationId,
        requestId: context.requestId,
        traceId: context.traceId,
        spanId: context.spanId,
        parentSpanId: context.parentSpanId,
    };
}
export function createLogContext(context, additionalData = {}) {
    return addCorrelationToLog(additionalData, context);
}
export function getCorrelationIdFromRequest(req) {
    const correlationId = extractCorrelationId(req.headers);
    return correlationId || generateCorrelationId();
}
export function setCorrelationIdOnResponse(res, correlationId) {
    res.setHeader('X-Correlation-ID', correlationId);
}
export function addCorrelationToRequest(req, correlationId) {
    req.correlationId = correlationId;
    req.headers['x-correlation-id'] = correlationId;
}
class CorrelationStore {
    store = new Map();
    set(correlationId, context) {
        this.store.set(correlationId, context);
    }
    get(correlationId) {
        return this.store.get(correlationId);
    }
    delete(correlationId) {
        return this.store.delete(correlationId);
    }
    clear() {
        this.store.clear();
    }
}
export const correlationStore = new CorrelationStore();
export function withCorrelationContext(context, fn) {
    const originalContext = correlationStore.get(context.correlationId);
    try {
        correlationStore.set(context.correlationId, context);
        return fn();
    }
    finally {
        if (originalContext) {
            correlationStore.set(context.correlationId, originalContext);
        }
        else {
            correlationStore.delete(context.correlationId);
        }
    }
}
export function getCurrentCorrelationContext(correlationId) {
    return correlationStore.get(correlationId);
}
export default {
    generateCorrelationId,
    generateRequestId,
    generateTraceId,
    generateSpanId,
    isValidCorrelationId,
    isValidRequestId,
    isValidTraceId,
    isValidSpanId,
    extractCorrelationId,
    extractRequestId,
    extractTraceId,
    extractSpanId,
    extractParentSpanId,
    createCorrelationContext,
    createCorrelationHeaders,
    propagateCorrelationId,
    createChildSpan,
    addCorrelationToLog,
    createLogContext,
    getCorrelationIdFromRequest,
    setCorrelationIdOnResponse,
    addCorrelationToRequest,
    correlationStore,
    withCorrelationContext,
    getCurrentCorrelationContext,
};
//# sourceMappingURL=index.js.map