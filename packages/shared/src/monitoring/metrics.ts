import { Gauge, Counter, Histogram, Registry } from 'prom-client';
import { envSchema } from '../core/config/env.js';

const env = envSchema.parse(process.env);

/**
 * Custom registry for Prometheus metrics
 */
export const registry = new Registry();

/**
 * HTTP request metrics
 */
export const httpMetrics = {
  requestDuration: new Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
    registers: [registry],
  }),

  requestsTotal: new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    registers: [registry],
  }),

  requestSizeBytes: new Histogram({
    name: 'http_request_size_bytes',
    help: 'HTTP request size in bytes',
    labelNames: ['method', 'route'],
    buckets: [100, 1000, 10000, 100000, 1000000],
    registers: [registry],
  }),

  responseSizeBytes: new Histogram({
    name: 'http_response_size_bytes',
    help: 'HTTP response size in bytes',
    labelNames: ['method', 'route'],
    buckets: [100, 1000, 10000, 100000, 1000000],
    registers: [registry],
  }),
};

/**
 * Database metrics
 */
export const dbMetrics = {
  queryDuration: new Histogram({
    name: 'db_query_duration_seconds',
    help: 'Database query duration in seconds',
    labelNames: ['operation', 'table'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
    registers: [registry],
  }),

  connectionPool: new Gauge({
    name: 'db_connection_pool',
    help: 'Database connection pool metrics',
    labelNames: ['state'],
    registers: [registry],
  }),

  errors: new Counter({
    name: 'db_errors_total',
    help: 'Total number of database errors',
    labelNames: ['operation', 'error_type'],
    registers: [registry],
  }),
};

/**
 * Cache metrics
 */
export const cacheMetrics = {
  hitRatio: new Gauge({
    name: 'cache_hit_ratio',
    help: 'Cache hit ratio',
    registers: [registry],
  }),

  size: new Gauge({
    name: 'cache_size_bytes',
    help: 'Cache size in bytes',
    registers: [registry],
  }),

  operations: new Counter({
    name: 'cache_operations_total',
    help: 'Total number of cache operations',
    labelNames: ['operation'],
    registers: [registry],
  }),
};

/**
 * AI metrics
 */
export const aiMetrics = {
  requestDuration: new Histogram({
    name: 'ai_request_duration_seconds',
    help: 'AI request duration in seconds',
    labelNames: ['model', 'operation'],
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
    registers: [registry],
  }),

  tokensUsed: new Counter({
    name: 'ai_tokens_total',
    help: 'Total number of AI tokens used',
    labelNames: ['model', 'type'],
    registers: [registry],
  }),

  cost: new Counter({
    name: 'ai_cost_eur',
    help: 'Total AI cost in EUR',
    labelNames: ['model'],
    registers: [registry],
  }),

  errors: new Counter({
    name: 'ai_errors_total',
    help: 'Total number of AI errors',
    labelNames: ['model', 'error_type'],
    registers: [registry],
  }),
};

/**
 * System metrics
 */
export const systemMetrics = {
  memory: new Gauge({
    name: 'process_memory_bytes',
    help: 'Process memory usage in bytes',
    labelNames: ['type'],
    registers: [registry],
  }),

  cpuUsage: new Gauge({
    name: 'process_cpu_usage',
    help: 'Process CPU usage percentage',
    registers: [registry],
  }),

  eventLoop: new Histogram({
    name: 'event_loop_lag_seconds',
    help: 'Event loop lag in seconds',
    buckets: [0.001, 0.005, 0.015, 0.05, 0.1, 0.5],
    registers: [registry],
  }),
};

// Collect default metrics
if (env.ENABLE_METRICS) {
  registry.setDefaultLabels({
    app: 'econeura',
    environment: env.NODE_ENV,
  });
}
