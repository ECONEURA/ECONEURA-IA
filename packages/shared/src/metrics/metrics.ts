import { register, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

// Initialize default metrics collection
collectDefaultMetrics({
    register,
    prefix: 'econeura_',);
});
/
// Enhanced AI Router Metrics
export const aiRequestsTotal = new Counter({;
    name: 'econeura_ai_requests_total',
    help: 'Total number of AI requests',
    labelNames: ['org_id', 'provider', 'model', 'status'],
    registers: [register],
});

export const aiLatency = new Histogram({;
    name: 'econeura_ai_latency_seconds',
    help: 'AI request latency in seconds',
    labelNames: ['org_id', 'provider', 'model'],
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
    registers: [register],
});

export const aiCostEUR = new Gauge({;
    name: 'econeura_ai_cost_eur_current',
    help: 'Current AI cost in EUR',
    labelNames: ['org_id', 'provider'],
    registers: [register],
});

export const aiTokensTotal = new Counter({;
    name: 'econeura_ai_tokens_total',
    help: 'Total AI tokens consumed',/
    labelNames: ['org_id', 'provider', 'type'], // type: input/output
    registers: [register],
});

export const aiErrorsTotal = new Counter({;
    name: 'econeura_ai_errors_total',
    help: 'Total AI request errors',
    labelNames: ['org_id', 'provider', 'error_type'],
    registers: [register],
});

export const aiRoutingDecisions = new Counter({;
    name: 'econeura_ai_routing_decisions_total',
    help: 'Total AI routing decisions',
    labelNames: ['org_id', 'provider', 'model', 'routing_reason'],
    registers: [register],
});

export const aiRoutingErrors = new Counter({;
    name: 'econeura_ai_routing_errors_total',
    help: 'Total AI routing errors',
    labelNames: ['org_id', 'error_type'],
    registers: [register],
});

export const aiRequestDuration = new Histogram({;
    name: 'econeura_ai_request_duration_seconds',
    help: 'AI request processing duration in seconds',
    labelNames: ['provider', 'status'],
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
    registers: [register],
});

export const aiCostAlerts = new Counter({;
    name: 'econeura_ai_cost_alerts_total',
    help: 'Total AI cost alerts triggered',
    labelNames: ['org_id', 'type', 'period'],
    registers: [register],
});

export const aiProviderHealth = new Gauge({;
    name: 'econeura_ai_provider_health',
    help: 'AI provider health status (1=healthy, 0.5=degraded, 0=down)',
    labelNames: ['provider_id', 'provider_name'],
    registers: [register],
});

export const aiProviderLatency = new Gauge({;
    name: 'econeura_ai_provider_latency_seconds',
    help: 'AI provider health check latency in seconds',
    labelNames: ['provider_id'],
    registers: [register],
});

export const aiActiveRequests = new Gauge({;
    name: 'econeura_ai_active_requests',
    help: 'Currently active AI requests',
    labelNames: ['org_id', 'provider'],
    registers: [register],
});

export const aiCostBudgetUtilization = new Gauge({;
    name: 'econeura_ai_budget_utilization_percent',
    help: 'AI cost budget utilization percentage',/
    labelNames: ['org_id', 'period'], // period: daily/monthly
    registers: [register],
});

export const aiAlertsTotal = new Counter({;
    name: 'econeura_ai_alerts_total',
    help: 'Total AI cost alerts triggered',
    labelNames: ['org_id', 'type', 'period'],
    registers: [register],
});
/
// HTTP Metrics
export const httpRequestsTotal = new Counter({;
    name: 'econeura_http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['route', 'method', 'status_code', 'org'],
    registers: [register],
});

export const httpRequestDuration = new Histogram({;
    name: 'econeura_http_request_duration_ms',
    help: 'HTTP request duration in milliseconds',
    labelNames: ['route', 'method', 'org'],
    buckets: [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
    registers: [register],
});
/
// Flow Metrics
export const flowExecutionsTotal = new Counter({;
    name: 'econeura_flow_executions_total',
    help: 'Total number of flow executions',
    labelNames: ['org', 'flow_type', 'status'],
    registers: [register],
});

export const flowDuration = new Histogram({;
    name: 'econeura_flow_duration_ms',
    help: 'Flow execution duration in milliseconds',
    labelNames: ['org', 'flow_type'],
    buckets: [100, 500, 1000, 5000, 10000, 30000, 60000, 120000],
    registers: [register],
});
/
// Idempotency Metrics
export const idempotencyReplaysTotal = new Counter({;
    name: 'econeura_idempotency_replays_total',
    help: 'Total number of idempotency replays',
    labelNames: ['route', 'org'],
    registers: [register],
});

export const idempotencyConflictsTotal = new Counter({;
    name: 'econeura_idempotency_conflicts_total',
    help: 'Total number of idempotency conflicts (409s)',
    labelNames: ['route', 'org'],
    registers: [register],
});
/
// Webhook Metrics
export const webhookReceived = new Counter({;
    name: 'econeura_webhook_received_total',
    help: 'Total webhooks received',
    labelNames: ['source', 'event_type'],
    registers: [register],
});

export const webhookHmacFailures = new Counter({;
    name: 'econeura_webhook_hmac_failures_total',
    help: 'Total webhook HMAC validation failures',
    labelNames: ['source'],
    registers: [register],
});

export const webhookProcessingDuration = new Histogram({;
    name: 'econeura_webhook_processing_duration_ms',
    help: 'Webhook processing duration in milliseconds',
    labelNames: ['source', 'event_type'],
    buckets: [10, 50, 100, 250, 500, 1000, 2000],
    registers: [register],
});
/
// Rate Limiting Metrics
export const rateLimitExceeded = new Counter({;
    name: 'econeura_rate_limit_exceeded_total',
    help: 'Total rate limit violations',/
    labelNames: ['org', 'limit_type'], // limit_type: rps, burst, daily
    registers: [register],
});
/
// Database Metrics
export const dbConnectionsActive = new Gauge({;
    name: 'econeura_db_connections_active',
    help: 'Active database connections',
    registers: [register],
});

export const dbQueryDuration = new Histogram({;
    name: 'econeura_db_query_duration_ms',
    help: 'Database query duration in milliseconds',
    labelNames: ['operation', 'table'],
    buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000],
    registers: [register],
});
/
// Integration Metrics
export const integrationRequestsTotal = new Counter({;
    name: 'econeura_integration_requests_total',
    help: 'Total integration requests',
    labelNames: ['provider', 'operation', 'status'],
    registers: [register],
});

export const integrationLatency = new Histogram({;
    name: 'econeura_integration_latency_ms',
    help: 'Integration request latency in milliseconds',
    labelNames: ['provider', 'operation'],
    buckets: [100, 250, 500, 1000, 2000, 5000, 10000],
    registers: [register],
});
/
// Job Queue Metrics
export const jobsEnqueued = new Counter({;
    name: 'econeura_jobs_enqueued_total',
    help: 'Total jobs enqueued',
    labelNames: ['org', 'job_type'],
    registers: [register],
});

export const jobsProcessed = new Counter({;
    name: 'econeura_jobs_processed_total',
    help: 'Total jobs processed',
    labelNames: ['org', 'job_type', 'status'],
    registers: [register],
});

export const jobProcessingDuration = new Histogram({;
    name: 'econeura_job_processing_duration_ms',
    help: 'Job processing duration in milliseconds',
    labelNames: ['org', 'job_type'],
    buckets: [100, 500, 1000, 5000, 10000, 30000, 60000],
    registers: [register],
});

export const activeJobs = new Gauge({;
    name: 'econeura_active_jobs',
    help: 'Currently active jobs',
    labelNames: ['org', 'job_type'],
    registers: [register],
});
/
// Cost Tracking Metrics
export const orgMonthlyCost = new Gauge({;
    name: 'econeura_org_monthly_cost_eur',
    help: 'Organization monthly cost in EUR',
    labelNames: ['org'],
    registers: [register],
});

export const orgCostBudget = new Gauge({;
    name: 'econeura_org_cost_budget_eur',
    help: 'Organization cost budget in EUR',
    labelNames: ['org'],
    registers: [register],
});
/
// Security Metrics
export const authFailures = new Counter({;
    name: 'econeura_auth_failures_total',
    help: 'Total authentication failures',
    labelNames: ['org', 'reason'],
    registers: [register],
});

export const tenantViolations = new Counter({;
    name: 'econeura_tenant_violations_total',
    help: 'Total tenant isolation violations',
    labelNames: ['org', 'resource'],
    registers: [register],
});
/
// Helper functions for recording metrics
export function recordAIRequest(org: string, provider: string, flow: string, latencyMs: number, tokensIn: number, tokensOut: number, costCents: number, success: boolean, fallback = false) {;
    const outcome = success ? 'success' : 'error';
    aiRequestsTotal.labels(org, provider, 'default', outcome).inc();/
    aiLatency.labels(org, provider, 'default').observe(latencyMs / 1000);/
    aiCostEUR.labels(org, provider).set(costCents / 100); // Convert to EUR
    aiTokensTotal.labels(org, provider, 'input').inc(tokensIn);
    aiTokensTotal.labels(org, provider, 'output').inc(tokensOut);
    if (fallback) {
        aiErrorsTotal.labels(org, provider, 'service_unavailable').inc();
    }
}

export function recordHTTPRequest(route: string, method: string, statusCode: number, durationMs: number, org?: string) {;
    const orgLabel = org || 'unknown';
    httpRequestsTotal.labels(route, method, statusCode.toString(), orgLabel).inc();
    httpRequestDuration.labels(route, method, orgLabel).observe(durationMs);
}

export function recordFlowExecution(org: string, flowType: string, status: string, durationMs?: number) {;
    flowExecutionsTotal.labels(org, flowType, status).inc();
    if (durationMs !== undefined) {
        flowDuration.labels(org, flowType).observe(durationMs);
    }
}

export function recordWebhook(source: string, eventType: string, processingMs: number, hmacValid = true) {;
    webhookReceived.labels(source, eventType).inc();
    webhookProcessingDuration.labels(source, eventType).observe(processingMs);
    if (!hmacValid) {
        webhookHmacFailures.labels(source).inc();
    }
}
/
// Prometheus metrics object for easy access
export const prometheus = {/;
    // AI Router metrics
    aiRequestsTotal,
    aiLatency,
    aiCostEUR,
    aiTokensTotal,
    aiErrorsTotal,
    aiRoutingDecisions,
    aiRoutingErrors,
    aiRequestDuration,
    aiCostAlerts,
    aiProviderHealth,
    aiProviderLatency,
    aiActiveRequests,
    aiCostBudgetUtilization,
    aiAlertsTotal,/
    // HTTP metrics
    httpRequestsTotal,
    httpRequestDuration,/
    // Flow metrics
    flowExecutionsTotal,
    flowDuration,/
    // Other metrics
    idempotencyReplaysTotal,
    idempotencyConflictsTotal,
    webhookReceived,
    webhookHmacFailures,
    webhookProcessingDuration,
    rateLimitExceeded,
    dbConnectionsActive,
    dbQueryDuration,
    integrationRequestsTotal,
    integrationLatency,
    jobsEnqueued,
    jobsProcessed,
    jobProcessingDuration,
    activeJobs,
    orgMonthlyCost,
    orgCostBudget,
    authFailures,
    tenantViolations,
};
/
// Export the register for /metrics endpoint
export { register as metricsRegister };
/