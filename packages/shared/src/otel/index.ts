import { NodeSDK } from '@opentelemetry/sdk-node'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { Resource } from '@opentelemetry/resources'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http'
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { trace, metrics, context, SpanStatusCode } from '@opentelemetry/api'
import { env } from '../env.js'

// Enhanced resource with more attributes
const resource = new Resource({
  [SemanticResourceAttributes.SERVICE_NAME]: 'econeura',
  [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
  [SemanticResourceAttributes.SERVICE_NAMESPACE]: 'econeura.ia',
  [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: env().NODE_ENV,
  [SemanticResourceAttributes.CLOUD_PROVIDER]: 'azure',
  [SemanticResourceAttributes.CLOUD_REGION]: 'westeurope',
  'econeura.organization': 'econeura',
  'econeura.data_residency': 'eu',
  'econeura.ai_primary': 'mistral_local',
  'econeura.ai_fallback': 'azure_openai',
})

// Configure trace exporter
const traceExporter = new OTLPTraceExporter({
  url: env().OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
  headers: {
    'Authorization': `Bearer ${env().OTEL_EXPORTER_OTLP_TOKEN || ''}`,
  },
})

// Configure metric exporter
const metricExporter = new OTLPMetricExporter({
  url: env().OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/metrics',
  headers: {
    'Authorization': `Bearer ${env().OTEL_EXPORTER_OTLP_TOKEN || ''}`,
  },
})

// Configure metric reader
const metricReader = new PeriodicExportingMetricReader({
  exporter: metricExporter,
  exportIntervalMillis: env().OTEL_METRIC_EXPORT_INTERVAL || 1000,
  exportTimeoutMillis: env().OTEL_METRIC_EXPORT_TIMEOUT || 30000,
})

// Create SDK
const sdk = new NodeSDK({
  resource,
  traceExporter,
  metricReader,
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-http': {
        ignoreIncomingPaths: ['/health', '/metrics'],
        ignoreOutgoingUrls: ['http://localhost:4318'],
      },
      '@opentelemetry/instrumentation-express': {
        ignoreLayers: ['/health', '/metrics'],
      },
    }),
  ],
})

// Initialize the SDK and register with the OpenTelemetry API
sdk.start()

// Graceful shutdown
process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('OpenTelemetry SDK terminated'))
    .catch((error) => console.log('Error terminating OpenTelemetry SDK', error))
    .finally(() => process.exit(0))
})

// Export tracer and meter for use in application
export const tracer = trace.getTracer('econeura')
export const meter = metrics.getMeter('econeura')

// Custom metrics
export const customMetrics = {
  // AI Router metrics
  aiRequestsTotal: meter.createCounter('ai_requests_total', {
    description: 'Total AI requests by provider and status',
    unit: '1',
  }),
  
  aiCostEUR: meter.createHistogram('ai_cost_eur', {
    description: 'AI costs in EUR',
    unit: 'EUR',
  }),
  
  aiLatencyMs: meter.createHistogram('ai_latency_ms', {
    description: 'AI request latency in milliseconds',
    unit: 'ms',
  }),
  
  aiTokensTotal: meter.createCounter('ai_tokens_total', {
    description: 'Total AI tokens used',
    unit: '1',
  }),
  
  // HTTP metrics
  httpRequestsTotal: meter.createCounter('http_requests_total', {
    description: 'Total HTTP requests by route and status',
    unit: '1',
  }),
  
  httpLatencyMs: meter.createHistogram('http_latency_ms', {
    description: 'HTTP request latency in milliseconds',
    unit: 'ms',
  }),
  
  // Webhook metrics
  webhookReceived: meter.createCounter('webhook_received_total', {
    description: 'Total webhooks received by source',
    unit: '1',
  }),
  
  webhookHmacFailures: meter.createCounter('webhook_hmac_failures_total', {
    description: 'Total webhook HMAC verification failures',
    unit: '1',
  }),
  
  // Flow metrics
  flowExecutionsTotal: meter.createCounter('flow_executions_total', {
    description: 'Total flow executions by type',
    unit: '1',
  }),
  
  flowLatencyMs: meter.createHistogram('flow_latency_ms', {
    description: 'Flow execution latency in milliseconds',
    unit: 'ms',
  }),
  
  // Database metrics
  dbConnectionsActive: meter.createUpDownCounter('db_connections_active', {
    description: 'Active database connections',
    unit: '1',
  }),
  
  dbQueryLatencyMs: meter.createHistogram('db_query_latency_ms', {
    description: 'Database query latency in milliseconds',
    unit: 'ms',
  }),
  
  // Idempotency metrics
  idempotencyReplaysTotal: meter.createCounter('idempotency_replays_total', {
    description: 'Total idempotency key replays',
    unit: '1',
  }),
  
  idempotencyConflictsTotal: meter.createCounter('idempotency_conflicts_total', {
    description: 'Total idempotency conflicts',
    unit: '1',
  }),
  
  // Rate limiting metrics
  rateLimitExceeded: meter.createCounter('rate_limit_exceeded_total', {
    description: 'Total rate limit violations',
    unit: '1',
  }),
  
  // Organization metrics
  orgMonthlyCost: meter.createHistogram('org_monthly_cost_eur', {
    description: 'Organization monthly costs in EUR',
    unit: 'EUR',
  }),
  
  orgCostBudget: meter.createUpDownCounter('org_cost_budget_eur', {
    description: 'Organization cost budget in EUR',
    unit: 'EUR',
  }),
}

// Utility functions for common observability operations
export function createSpan(name: string, attributes?: Record<string, any>) {
  return tracer.startSpan(name, {
    attributes: {
      'service.name': 'econeura',
      'service.version': '1.0.0',
      ...attributes,
    },
  })
}

export function recordException(span: any, error: Error, attributes?: Record<string, any>) {
  span.recordException(error)
  span.setStatus({
    code: SpanStatusCode.ERROR,
    message: error.message,
  })
  if (attributes) {
    span.setAttributes(attributes)
  }
}

export function addEvent(span: any, name: string, attributes?: Record<string, any>) {
  span.addEvent(name, attributes)
}

export function setAttributes(span: any, attributes: Record<string, any>) {
  span.setAttributes(attributes)
}

// Context utilities
export function getCurrentSpan() {
  return trace.getSpan(context.active())
}

export function getTraceId() {
  const span = getCurrentSpan()
  return span?.spanContext().traceId
}

export function getSpanId() {
  const span = getCurrentSpan()
  return span?.spanContext().spanId
}

// Metric recording utilities
export function recordAIRequest(
  provider: string,
  model: string,
  status: 'success' | 'error',
  costEUR: number,
  latencyMs: number,
  tokensInput: number,
  tokensOutput: number,
  orgId?: string
) {
  const attributes: Record<string, any> = {
    provider,
    model,
    status,
  }
  
  if (orgId) {
    attributes.org_id = orgId
  }
  
  customMetrics.aiRequestsTotal.add(1, attributes)
  customMetrics.aiCostEUR.record(costEUR, attributes)
  customMetrics.aiLatencyMs.record(latencyMs, attributes)
  customMetrics.aiTokensTotal.add(tokensInput, { ...attributes, type: 'input' })
  customMetrics.aiTokensTotal.add(tokensOutput, { ...attributes, type: 'output' })
}

export function recordHTTPRequest(
  method: string,
  route: string,
  statusCode: number,
  latencyMs: number,
  orgId?: string
) {
  const attributes: Record<string, any> = {
    method,
    route,
    status_code: statusCode.toString(),
  }
  
  if (orgId) {
    attributes.org_id = orgId
  }
  
  customMetrics.httpRequestsTotal.add(1, attributes)
  customMetrics.httpLatencyMs.record(latencyMs, attributes)
}

export function recordWebhook(
  source: string,
  eventType: string,
  processingMs: number,
  hmacValid: boolean = true
) {
  customMetrics.webhookReceived.add(1, { source, event_type: eventType })
  customMetrics.webhookHmacFailures.add(hmacValid ? 0 : 1, { source })
}

export function recordFlowExecution(
  flowType: string,
  status: 'success' | 'error',
  latencyMs: number,
  orgId?: string
) {
  const attributes: Record<string, any> = {
    flow_type: flowType,
    status,
  }
  
  if (orgId) {
    attributes.org_id = orgId
  }
  
  customMetrics.flowExecutionsTotal.add(1, attributes)
  customMetrics.flowLatencyMs.record(latencyMs, attributes)
}

export function recordDatabaseQuery(
  operation: string,
  table: string,
  latencyMs: number,
  orgId?: string
) {
  const attributes: Record<string, any> = {
    operation,
    table,
  }
  
  if (orgId) {
    attributes.org_id = orgId
  }
  
  customMetrics.dbQueryLatencyMs.record(latencyMs, attributes)
}

export function recordIdempotencyReplay(key: string, orgId?: string) {
  const attributes: Record<string, any> = { key }
  
  if (orgId) {
    attributes.org_id = orgId
  }
  
  customMetrics.idempotencyReplaysTotal.add(1, attributes)
}

export function recordIdempotencyConflict(key: string, orgId?: string) {
  const attributes: Record<string, any> = { key }
  
  if (orgId) {
    attributes.org_id = orgId
  }
  
  customMetrics.idempotencyConflictsTotal.add(1, attributes)
}

export function recordRateLimitExceeded(route: string, orgId?: string) {
  const attributes: Record<string, any> = { route }
  
  if (orgId) {
    attributes.org_id = orgId
  }
  
  customMetrics.rateLimitExceeded.add(1, attributes)
}

export function recordOrgCost(orgId: string, costEUR: number, budgetEUR: number) {
  customMetrics.orgMonthlyCost.record(costEUR, { org_id: orgId })
  customMetrics.orgCostBudget.add(budgetEUR, { org_id: orgId })
}

// Export everything
export { sdk }
