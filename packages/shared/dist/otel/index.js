export const tracer = {
    startSpan: (name) => ({
        setAttribute: (_k, _v) => { },
        setAttributes: (_attrs) => { },
        recordException: (_err) => { },
        setStatus: (_s) => { },
        end: () => { },
    }),
    getTracer: (name) => ({
        startSpan: (name) => ({
            setAttribute: (_k, _v) => { },
            setAttributes: (_attrs) => { },
            recordException: (_err) => { },
            setStatus: (_s) => { },
            end: () => { },
        }),
    }),
};
export const meter = {
    createCounter: (name, options) => ({
        add: (_value = 1, _labels) => { },
    }),
    createHistogram: (name, options) => ({
        record: (_value, _labels) => { },
    }),
    createUpDownCounter: (name, options) => ({
        add: (_value, _labels) => { },
    }),
    getMeter: (name) => ({
        createCounter: (name, options) => ({
            add: (_value = 1, _labels) => { },
        }),
        createHistogram: (name, options) => ({
            record: (_value, _labels) => { },
        }),
        createUpDownCounter: (name, options) => ({
            add: (_value, _labels) => { },
        }),
    }),
};
export const customMetrics = {
    aiRequestsTotal: { add: () => { } },
    aiCostEUR: { record: () => { } },
    aiLatencyMs: { record: () => { } },
    aiTokensTotal: { add: () => { } },
    httpRequestsTotal: { add: () => { } },
    httpLatencyMs: { record: () => { } },
    webhookReceived: { add: () => { } },
    webhookHmacFailures: { add: () => { } },
    flowExecutionsTotal: { add: () => { } },
    flowLatencyMs: { record: () => { } },
    dbConnectionsActive: { add: () => { } },
    dbQueryLatencyMs: { record: () => { } },
    idempotencyReplaysTotal: { add: () => { } },
    idempotencyConflictsTotal: { add: () => { } },
    rateLimitExceeded: { add: () => { } },
    orgMonthlyCost: { record: () => { } },
    orgCostBudget: { add: () => { } },
};
export function createSpan(name, attributes) {
    return {
        setAttribute: (_k, _v) => { },
        setAttributes: (_attrs) => { },
        recordException: (_err) => { },
        setStatus: (_s) => { },
        end: () => { },
    };
}
export function createTracer(name) {
    return {
        startSpan: (spanName) => createSpan(spanName)
    };
}
export function recordException(span, error, attributes) { }
export function addEvent(span, name, attributes) { }
export function setAttributes(span, attributes) { }
export function getCurrentSpan() { return null; }
export function getTraceId() { return 'mock-trace-id'; }
export function getSpanId() { return 'mock-span-id'; }
export function recordAIRequest(provider, model, status, costEUR, latencyMs, tokensInput, tokensOutput, orgId) { }
export function recordHTTPRequest(method, route, statusCode, latencyMs, orgId) { }
export function recordWebhook(source, eventType, processingMs, hmacValid = true) { }
export function recordFlowExecution(flowType, status, latencyMs, orgId) { }
export function recordDatabaseQuery(operation, table, latencyMs, orgId) { }
export function recordIdempotencyReplay(key, orgId) { }
export function recordIdempotencyConflict(key, orgId) { }
export function recordRateLimitExceeded(route, orgId) { }
export function recordOrgCost(orgId, costEUR, budgetEUR) { }
export const sdk = {
    start: () => { },
    shutdown: () => Promise.resolve(),
};
//# sourceMappingURL=index.js.map