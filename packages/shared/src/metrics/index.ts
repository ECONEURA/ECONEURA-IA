import { register, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

// Initialize default metrics collection only once using global flag
declare global {
  var __econeura_metrics_initialized: boolean | undefined;
}

if (!global.__econeura_metrics_initialized) {
  try {
    collectDefaultMetrics({
      register,
      prefix: 'econeura_',
    });
    global.__econeura_metrics_initialized = true;
  } catch (error) {
    // Metrics already initialized, ignore error
    console.warn('Default metrics already initialized:', error.message);
    global.__econeura_metrics_initialized = true;
  }
}

// Enhanced AI Router Metrics
export const aiRequestsTotal = new Counter({
  name: 'econeura_ai_requests_total',
  help: 'Total number of AI requests',
  labelNames: ['org_id', 'provider', 'model', 'status'],
  registers: [register],
});

export const aiLatency = new Histogram({
  name: 'econeura_ai_latency_seconds',
  help: 'AI request latency in seconds',
  labelNames: ['org_id', 'provider', 'model'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
  registers: [register],
});

export const aiCostEUR = new Gauge({
  name: 'econeura_ai_cost_eur_current',
  help: 'Current AI cost in EUR',
  labelNames: ['org_id', 'provider'],
  registers: [register],
});

export const aiTokensTotal = new Counter({
  name: 'econeura_ai_tokens_total',
  help: 'Total AI tokens consumed',
  labelNames: ['org_id', 'provider', 'type'], // type: input/output
  registers: [register],
});

export const aiErrorsTotal = new Counter({
  name: 'econeura_ai_errors_total',
  help: 'Total AI request errors',
  labelNames: ['org_id', 'provider', 'error_type'],
  registers: [register],
});

export const aiRoutingDecisions = new Counter({
  name: 'econeura_ai_routing_decisions_total',
  help: 'Total AI routing decisions',
  labelNames: ['org_id', 'provider', 'model', 'routing_reason'],
  registers: [register],
});

export const aiRoutingErrors = new Counter({
  name: 'econeura_ai_routing_errors_total',
  help: 'Total AI routing errors',
  labelNames: ['org_id', 'error_type'],
  registers: [register],
});

export const aiRequestDuration = new Histogram({
  name: 'econeura_ai_request_duration_seconds',
  help: 'AI request processing duration in seconds',
  labelNames: ['provider', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
  registers: [register],
});

export const aiCostAlerts = new Counter({
  name: 'econeura_ai_cost_alerts_total',
  help: 'Total AI cost alerts triggered',
  labelNames: ['org_id', 'type', 'period'],
  registers: [register],
});

export const aiProviderHealth = new Gauge({
  name: 'econeura_ai_provider_health',
  help: 'AI provider health status (1=healthy, 0.5=degraded, 0=down)',
  labelNames: ['provider_id', 'provider_name'],
  registers: [register],
});

export const aiProviderLatency = new Gauge({
  name: 'econeura_ai_provider_latency_seconds',
  help: 'AI provider health check latency in seconds',
  labelNames: ['provider_id'],
  registers: [register],
});

export const aiActiveRequests = new Gauge({
  name: 'econeura_ai_active_requests',
  help: 'Currently active AI requests',
  labelNames: ['org_id', 'provider'],
  registers: [register],
});

export const aiCostBudgetUtilization = new Gauge({
  name: 'econeura_ai_budget_utilization_percent',
  help: 'AI cost budget utilization percentage',
  labelNames: ['org_id', 'period'], // period: daily/monthly
  registers: [register],
});

export const aiAlertsTotal = new Counter({
  name: 'econeura_ai_alerts_total',
  help: 'Total AI cost alerts triggered',
  labelNames: ['org_id', 'type', 'period'],
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

// Warmup System Metrics (PR-47)
export const warmupDuration = new Histogram({
  name: 'econeura_warmup_duration_ms',
  help: 'System warmup duration in milliseconds',
  labelNames: ['status'], // status: completed, failed, timeout
  buckets: [100, 500, 1000, 2000, 5000, 10000, 20000, 30000],
  registers: [register],
});

export const warmupSuccessRate = new Gauge({
  name: 'econeura_warmup_success_rate_percent',
  help: 'Warmup success rate percentage',
  registers: [register],
});

export const warmupErrors = new Counter({
  name: 'econeura_warmup_errors_total',
  help: 'Total warmup errors',
  labelNames: ['service', 'error_type'],
  registers: [register],
});

export const warmupServiceDuration = new Histogram({
  name: 'econeura_warmup_service_duration_ms',
  help: 'Individual service warmup duration in milliseconds',
  labelNames: ['service', 'status'],
  buckets: [10, 50, 100, 250, 500, 1000, 2000, 5000],
  registers: [register],
});

// Performance Optimization Metrics (PR-48)
export const memoryUsage = new Gauge({
  name: 'econeura_memory_usage_mb',
  help: 'Memory usage in MB',
  labelNames: ['type'], // type: rss, heapTotal, heapUsed, external, arrayBuffers
  registers: [register],
});

export const cpuUsage = new Gauge({
  name: 'econeura_cpu_usage_seconds',
  help: 'CPU usage in seconds',
  labelNames: ['type'], // type: user, system
  registers: [register],
});

export const eventLoopLag = new Gauge({
  name: 'econeura_event_loop_lag_ms',
  help: 'Event loop lag in milliseconds',
  registers: [register],
});

export const performanceOptimizations = new Counter({
  name: 'econeura_performance_optimizations_total',
  help: 'Total performance optimizations performed',
  labelNames: ['type', 'impact', 'success'], // type: memory, cpu, latency, cache, query, connection
  registers: [register],
});

export const optimizationDuration = new Histogram({
  name: 'econeura_optimization_duration_ms',
  help: 'Performance optimization duration in milliseconds',
  labelNames: ['type', 'success'],
  buckets: [10, 50, 100, 250, 500, 1000, 2000, 5000],
  registers: [register],
});

// Connection Pool Metrics (PR-50)
export const connectionPoolSize = new Gauge({
  name: 'econeura_connection_pool_size',
  help: 'Number of connections in pool',
  labelNames: ['pool_name', 'status'],
  registers: [register],
});

export const connectionPoolAcquisitions = new Counter({
  name: 'econeura_connection_pool_acquisitions_total',
  help: 'Total number of connection acquisitions',
  labelNames: ['pool_name', 'status'],
  registers: [register],
});

export const connectionPoolAcquisitionDuration = new Histogram({
  name: 'econeura_connection_pool_acquisition_duration_seconds',
  help: 'Duration of connection acquisitions in seconds',
  labelNames: ['pool_name'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

export const connectionPoolHealthChecks = new Counter({
  name: 'econeura_connection_pool_health_checks_total',
  help: 'Total number of health checks performed',
  labelNames: ['pool_name', 'status'],
  registers: [register],
});

export const connectionPoolCircuitBreaker = new Gauge({
  name: 'econeura_connection_pool_circuit_breaker_state',
  help: 'Circuit breaker state (0=closed, 1=open, 2=half-open)',
  labelNames: ['pool_name'],
  registers: [register],
});

// Contacts Dedupe Metrics (PR-52)
export const contactsDedupeProcessed = new Counter({
  name: 'econeura_contacts_dedupe_processed_total',
  help: 'Total number of contacts processed for deduplication',
  labelNames: ['organization_id', 'status'],
  registers: [register],
});

export const contactsDedupeDuplicatesFound = new Counter({
  name: 'econeura_contacts_dedupe_duplicates_found_total',
  help: 'Total number of duplicate contacts found',
  labelNames: ['organization_id', 'match_type'],
  registers: [register],
});

export const contactsDedupeMergesExecuted = new Counter({
  name: 'econeura_contacts_dedupe_merges_executed_total',
  help: 'Total number of contact merges executed',
  labelNames: ['organization_id', 'status'],
  registers: [register],
});

export const contactsDedupeConfidenceScore = new Histogram({
  name: 'econeura_contacts_dedupe_confidence_score',
  help: 'Confidence score distribution for duplicate matches',
  labelNames: ['organization_id', 'match_type'],
  buckets: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
  registers: [register],
});

export const contactsDedupeProcessingDuration = new Histogram({
  name: 'econeura_contacts_dedupe_processing_duration_seconds',
  help: 'Duration of deduplication processing in seconds',
  labelNames: ['organization_id'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60, 120, 300],
  registers: [register],
});

// Deals NBA Metrics (PR-53)
export const dealsNBARecommendationsGenerated = new Counter({
  name: 'econeura_deals_nba_recommendations_generated_total',
  help: 'Total number of NBA recommendations generated',
  labelNames: ['organization_id', 'action_type', 'priority'],
  registers: [register],
});

export const dealsNBARecommendationsExecuted = new Counter({
  name: 'econeura_deals_nba_recommendations_executed_total',
  help: 'Total number of NBA recommendations executed',
  labelNames: ['organization_id', 'action_type', 'status'],
  registers: [register],
});

export const dealsNBAConfidenceScore = new Histogram({
  name: 'econeura_deals_nba_confidence_score',
  help: 'Confidence score distribution for NBA recommendations',
  labelNames: ['organization_id', 'action_type'],
  buckets: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
  registers: [register],
});

export const dealsNBAProcessingDuration = new Histogram({
  name: 'econeura_deals_nba_processing_duration_seconds',
  help: 'Duration of NBA processing in seconds',
  labelNames: ['organization_id'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60, 120, 300],
  registers: [register],
});

export const dealsNBAFactorsAnalyzed = new Counter({
  name: 'econeura_deals_nba_factors_analyzed_total',
  help: 'Total number of factors analyzed for NBA recommendations',
  labelNames: ['organization_id', 'factor_type', 'impact'],
  registers: [register],
});

// Helper functions for recording metrics
export function recordAIRequest(
  org: string,
  provider: string,
  flow: string,
  latencyMs: number,
  tokensIn: number,
  tokensOut: number,
  costCents: number,
  success: boolean,
  fallback: boolean = false
): void {
  const outcome = success ? 'success' : 'error';
  
  aiRequestsTotal.labels(org, provider, 'default', outcome).inc();
  aiLatency.labels(org, provider, 'default').observe(latencyMs / 1000);
  aiCostEUR.labels(org, provider).set(costCents / 100); // Convert to EUR
  aiTokensTotal.labels(org, provider, 'input').inc(tokensIn);
  aiTokensTotal.labels(org, provider, 'output').inc(tokensOut);
  
  if (fallback) {
    aiErrorsTotal.labels(org, provider, 'service_unavailable').inc();
  }
}

export function recordHTTPRequest(
  route: string,
  method: string,
  statusCode: number,
  durationMs: number,
  org?: string
): void {
  const orgLabel = org || 'unknown';
  httpRequestsTotal.labels(route, method, statusCode.toString(), orgLabel).inc();
  httpRequestDuration.labels(route, method, orgLabel).observe(durationMs);
}

export function recordFlowExecution(
  org: string,
  flowType: string,
  status: 'started' | 'completed' | 'failed',
  durationMs?: number
): void {
  flowExecutionsTotal.labels(org, flowType, status).inc();
  if (durationMs !== undefined) {
    flowDuration.labels(org, flowType).observe(durationMs);
  }
}

export function recordWebhook(
  source: string,
  eventType: string,
  processingMs: number,
  hmacValid: boolean = true
): void {
  webhookReceived.labels(source, eventType).inc();
  webhookProcessingDuration.labels(source, eventType).observe(processingMs);
  
  if (!hmacValid) {
    webhookHmacFailures.labels(source).inc();
  }
}

// Prometheus metrics object for easy access
export const prometheus = {
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
  aiAlertsTotal,
  
  // HTTP metrics
  httpRequestsTotal,
  httpRequestDuration,
  
  // Flow metrics
  flowExecutionsTotal,
  flowDuration,
  
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
  
  // Warmup metrics
  warmupDuration,
  warmupSuccessRate,
  warmupErrors,
  warmupServiceDuration,
  
  // Performance optimization metrics
  memoryUsage,
  cpuUsage,
  eventLoopLag,
  performanceOptimizations,
  optimizationDuration,
  
  // Connection Pool metrics
connectionPoolSize,
connectionPoolAcquisitions,
connectionPoolAcquisitionDuration,
connectionPoolHealthChecks,
connectionPoolCircuitBreaker,

// Contacts Dedupe metrics (PR-52)
contactsDedupeProcessed,
contactsDedupeDuplicatesFound,
contactsDedupeMergesExecuted,
contactsDedupeConfidenceScore,
contactsDedupeProcessingDuration,

// Deals NBA metrics (PR-53)
dealsNBARecommendationsGenerated,
dealsNBARecommendationsExecuted,
dealsNBAConfidenceScore,
dealsNBAProcessingDuration,
dealsNBAFactorsAnalyzed,
};

// Export the register for /metrics endpoint
export { register as metricsRegister };