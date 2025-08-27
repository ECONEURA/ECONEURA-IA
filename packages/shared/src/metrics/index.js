import { register, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';
// Initialize default metrics collection
collectDefaultMetrics({
    register,
    prefix: 'econeura_',
});
// AI Metrics
export const aiRequestsTotal = new Counter({
    name: 'econeura_ai_requests_total',
    help: 'Total number of AI requests',
    labelNames: ['org', 'provider', 'flow', 'outcome'],
    registers: [register],
});
export const aiLatencyHistogram = new Histogram({
    name: 'econeura_ai_latency_ms',
    help: 'AI request latency in milliseconds',
    labelNames: ['org', 'provider', 'flow'],
    buckets: [50, 100, 200, 500, 1000, 2000, 5000, 10000],
    registers: [register],
});
export const aiCostTotal = new Counter({
    name: 'econeura_ai_cost_eur_total',
    help: 'Total AI cost in EUR',
    labelNames: ['org', 'flow', 'provider'],
    registers: [register],
});
export const aiTokensTotal = new Counter({
    name: 'econeura_ai_tokens_total',
    help: 'Total AI tokens consumed',
    labelNames: ['org', 'provider', 'direction'], // direction: input/output
    registers: [register],
});
export const aiFallbackTotal = new Counter({
    name: 'econeura_ai_fallback_total',
    help: 'Total AI fallback requests',
    labelNames: ['org', 'provider', 'reason'],
    registers: [register],
});
// HTTP Metrics
export const httpRequestsTotal = new Counter({
    name: 'econeura_http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['route', 'method', 'status_code', 'org'],
    registers: [register],
});
export const httpRequestDuration = new Histogram({
    name: 'econeura_http_request_duration_ms',
    help: 'HTTP request duration in milliseconds',
    labelNames: ['route', 'method', 'org'],
    buckets: [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
    registers: [register],
});
// Flow Metrics
export const flowExecutionsTotal = new Counter({
    name: 'econeura_flow_executions_total',
    help: 'Total number of flow executions',
    labelNames: ['org', 'flow_type', 'status'],
    registers: [register],
});
export const flowDuration = new Histogram({
    name: 'econeura_flow_duration_ms',
    help: 'Flow execution duration in milliseconds',
    labelNames: ['org', 'flow_type'],
    buckets: [100, 500, 1000, 5000, 10000, 30000, 60000, 120000],
    registers: [register],
});
// Idempotency Metrics
export const idempotencyReplaysTotal = new Counter({
    name: 'econeura_idempotency_replays_total',
    help: 'Total number of idempotency replays',
    labelNames: ['route', 'org'],
    registers: [register],
});
export const idempotencyConflictsTotal = new Counter({
    name: 'econeura_idempotency_conflicts_total',
    help: 'Total number of idempotency conflicts (409s)',
    labelNames: ['route', 'org'],
    registers: [register],
});
// Webhook Metrics
export const webhookReceived = new Counter({
    name: 'econeura_webhook_received_total',
    help: 'Total webhooks received',
    labelNames: ['source', 'event_type'],
    registers: [register],
});
export const webhookHmacFailures = new Counter({
    name: 'econeura_webhook_hmac_failures_total',
    help: 'Total webhook HMAC validation failures',
    labelNames: ['source'],
    registers: [register],
});
export const webhookProcessingDuration = new Histogram({
    name: 'econeura_webhook_processing_duration_ms',
    help: 'Webhook processing duration in milliseconds',
    labelNames: ['source', 'event_type'],
    buckets: [10, 50, 100, 250, 500, 1000, 2000],
    registers: [register],
});
// Rate Limiting Metrics
export const rateLimitExceeded = new Counter({
    name: 'econeura_rate_limit_exceeded_total',
    help: 'Total rate limit violations',
    labelNames: ['org', 'limit_type'], // limit_type: rps, burst, daily
    registers: [register],
});
// Database Metrics
export const dbConnectionsActive = new Gauge({
    name: 'econeura_db_connections_active',
    help: 'Active database connections',
    registers: [register],
});
export const dbQueryDuration = new Histogram({
    name: 'econeura_db_query_duration_ms',
    help: 'Database query duration in milliseconds',
    labelNames: ['operation', 'table'],
    buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000],
    registers: [register],
});
// Integration Metrics
export const integrationRequestsTotal = new Counter({
    name: 'econeura_integration_requests_total',
    help: 'Total integration requests',
    labelNames: ['provider', 'operation', 'status'],
    registers: [register],
});
export const integrationLatency = new Histogram({
    name: 'econeura_integration_latency_ms',
    help: 'Integration request latency in milliseconds',
    labelNames: ['provider', 'operation'],
    buckets: [100, 250, 500, 1000, 2000, 5000, 10000],
    registers: [register],
});
// Job Queue Metrics
export const jobsEnqueued = new Counter({
    name: 'econeura_jobs_enqueued_total',
    help: 'Total jobs enqueued',
    labelNames: ['org', 'job_type'],
    registers: [register],
});
export const jobsProcessed = new Counter({
    name: 'econeura_jobs_processed_total',
    help: 'Total jobs processed',
    labelNames: ['org', 'job_type', 'status'],
    registers: [register],
});
export const jobProcessingDuration = new Histogram({
    name: 'econeura_job_processing_duration_ms',
    help: 'Job processing duration in milliseconds',
    labelNames: ['org', 'job_type'],
    buckets: [100, 500, 1000, 5000, 10000, 30000, 60000],
    registers: [register],
});
export const activeJobs = new Gauge({
    name: 'econeura_active_jobs',
    help: 'Currently active jobs',
    labelNames: ['org', 'job_type'],
    registers: [register],
});
// Cost Tracking Metrics
export const orgMonthlyCost = new Gauge({
    name: 'econeura_org_monthly_cost_eur',
    help: 'Organization monthly cost in EUR',
    labelNames: ['org'],
    registers: [register],
});
export const orgCostBudget = new Gauge({
    name: 'econeura_org_cost_budget_eur',
    help: 'Organization cost budget in EUR',
    labelNames: ['org'],
    registers: [register],
});
// Security Metrics
export const authFailures = new Counter({
    name: 'econeura_auth_failures_total',
    help: 'Total authentication failures',
    labelNames: ['org', 'reason'],
    registers: [register],
});
export const tenantViolations = new Counter({
    name: 'econeura_tenant_violations_total',
    help: 'Total tenant isolation violations',
    labelNames: ['org', 'resource'],
    registers: [register],
});
// Helper functions for recording metrics
export function recordAIRequest(org, provider, flow, latencyMs, tokensIn, tokensOut, costCents, success, fallback = false) {
    const outcome = success ? 'success' : 'error';
    aiRequestsTotal.labels(org, provider, flow, outcome).inc();
    aiLatencyHistogram.labels(org, provider, flow).observe(latencyMs);
    aiCostTotal.labels(org, flow, provider).inc(costCents / 100); // Convert to EUR
    aiTokensTotal.labels(org, provider, 'input').inc(tokensIn);
    aiTokensTotal.labels(org, provider, 'output').inc(tokensOut);
    if (fallback) {
        aiFallbackTotal.labels(org, provider, 'service_unavailable').inc();
    }
}
export function recordHTTPRequest(route, method, statusCode, durationMs, org) {
    const orgLabel = org || 'unknown';
    httpRequestsTotal.labels(route, method, statusCode.toString(), orgLabel).inc();
    httpRequestDuration.labels(route, method, orgLabel).observe(durationMs);
}
export function recordFlowExecution(org, flowType, status, durationMs) {
    flowExecutionsTotal.labels(org, flowType, status).inc();
    if (durationMs !== undefined) {
        flowDuration.labels(org, flowType).observe(durationMs);
    }
}
export function recordWebhook(source, eventType, processingMs, hmacValid = true) {
    webhookReceived.labels(source, eventType).inc();
    webhookProcessingDuration.labels(source, eventType).observe(processingMs);
    if (!hmacValid) {
        webhookHmacFailures.labels(source).inc();
    }
}
// Export the register for /metrics endpoint
export { register as metricsRegister };
