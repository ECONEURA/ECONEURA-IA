import { register, collectDefaultMetrics, Counter, Histogram, Gauge, Summary } from 'prom-client';

// Clear default metrics to avoid conflicts
register.clear();

// Custom metrics for ECONEURA Workers
export const prometheusMetrics = {
  // HTTP Request Metrics
  httpRequestsTotal: new Counter({
    name: 'econeura_http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code']
  }),

  httpRequestDuration: new Histogram({
    name: 'econeura_http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
  }),

  // Email Processing Metrics
  emailsProcessedTotal: new Counter({
    name: 'econeura_emails_processed_total',
    help: 'Total number of emails processed',
    labelNames: ['action', 'category', 'status', 'organization_id']
  }),

  emailProcessingDuration: new Histogram({
    name: 'econeura_email_processing_duration_seconds',
    help: 'Time spent processing emails',
    labelNames: ['action', 'category'],
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60]
  }),

  // Job Queue Metrics
  jobsProcessedTotal: new Counter({
    name: 'econeura_jobs_processed_total',
    help: 'Total number of jobs processed',
    labelNames: ['type', 'status', 'organization_id']
  }),

  jobDuration: new Histogram({
    name: 'econeura_job_duration_seconds',
    help: 'Time spent processing jobs',
    labelNames: ['type', 'status'],
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60, 120]
  }),

  jobQueueSize: new Gauge({
    name: 'econeura_job_queue_size',
    help: 'Current size of job queues',
    labelNames: ['type', 'status']
  }),

  // Microsoft Graph Metrics
  graphApiCallsTotal: new Counter({
    name: 'econeura_graph_api_calls_total',
    help: 'Total number of Microsoft Graph API calls',
    labelNames: ['endpoint', 'method', 'status_code']
  }),

  graphApiDuration: new Histogram({
    name: 'econeura_graph_api_duration_seconds',
    help: 'Duration of Microsoft Graph API calls',
    labelNames: ['endpoint', 'method'],
    buckets: [0.1, 0.3, 0.5, 1, 2, 5, 10]
  }),

  // Redis Metrics
  redisOperationsTotal: new Counter({
    name: 'econeura_redis_operations_total',
    help: 'Total number of Redis operations',
    labelNames: ['operation', 'status']
  }),

  redisOperationDuration: new Histogram({
    name: 'econeura_redis_operation_duration_seconds',
    help: 'Duration of Redis operations',
    labelNames: ['operation'],
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1]
  }),

  // System Metrics
  activeConnections: new Gauge({
    name: 'econeura_active_connections',
    help: 'Number of active connections',
    labelNames: ['type']
  }),

  memoryUsage: new Gauge({
    name: 'econeura_memory_usage_bytes',
    help: 'Memory usage in bytes',
    labelNames: ['type']
  }),

  // Business Metrics
  emailsCategorized: new Counter({
    name: 'econeura_emails_categorized_total',
    help: 'Total number of emails categorized',
    labelNames: ['category', 'organization_id']
  }),

  emailsForwarded: new Counter({
    name: 'econeura_emails_forwarded_total',
    help: 'Total number of emails forwarded',
    labelNames: ['department', 'organization_id']
  }),

  emailsArchived: new Counter({
    name: 'econeura_emails_archived_total',
    help: 'Total number of emails archived',
    labelNames: ['reason', 'organization_id']
  }),

  // Error Metrics
  errorsTotal: new Counter({
    name: 'econeura_errors_total',
    help: 'Total number of errors',
    labelNames: ['type', 'component', 'severity']
  }),

  // Performance Metrics
  processingLatency: new Summary({
    name: 'econeura_processing_latency_seconds',
    help: 'Processing latency summary',
    labelNames: ['component'],
    percentiles: [0.5, 0.9, 0.95, 0.99]
  }),

  // Custom counter for general use
  counter: (config: { name: string; help: string; labelNames?: string[] }) => {
    return new Counter(config);
  },

  // Custom histogram for general use
  histogram: (config: { name: string; help: string; labelNames?: string[]; buckets?: number[] }) => {
    return new Histogram(config);
  },

  // Custom gauge for general use
  gauge: (config: { name: string; help: string; labelNames?: string[] }) => {
    return new Gauge(config);
  },

  // Custom summary for general use
  summary: (config: { name: string; help: string; labelNames?: string[]; percentiles?: number[] }) => {
    return new Summary(config);
  }
};

// Collect default metrics
collectDefaultMetrics({
  register,
  prefix: 'econeura_',
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
  eventLoopMonitoringPrecision: 10
});

// Helper functions for recording metrics
export function recordHttpRequest(method: string, route: string, statusCode: string, duration: number): void {
  prometheusMetrics.httpRequestsTotal.inc({
    method,
    route,
    status_code: statusCode
  });

  prometheusMetrics.httpRequestDuration.observe(
    { method, route, status_code: statusCode },
    duration / 1000
  );
}

export function recordEmailProcessing(
  action: string,
  category: string,
  status: string,
  organizationId: string,
  duration: number
): void {
  prometheusMetrics.emailsProcessedTotal.inc({
    action,
    category,
    status,
    organization_id: organizationId
  });

  prometheusMetrics.emailProcessingDuration.observe(
    { action, category },
    duration / 1000
  );
}

export function recordJobProcessing(
  type: string,
  status: string,
  organizationId: string,
  duration: number
): void {
  prometheusMetrics.jobsProcessedTotal.inc({
    type,
    status,
    organization_id: organizationId
  });

  prometheusMetrics.jobDuration.observe(
    { type, status },
    duration / 1000
  );
}

export function recordGraphApiCall(
  endpoint: string,
  method: string,
  statusCode: string,
  duration: number
): void {
  prometheusMetrics.graphApiCallsTotal.inc({
    endpoint,
    method,
    status_code: statusCode
  });

  prometheusMetrics.graphApiDuration.observe(
    { endpoint, method },
    duration / 1000
  );
}

export function recordRedisOperation(
  operation: string,
  status: string,
  duration: number
): void {
  prometheusMetrics.redisOperationsTotal.inc({
    operation,
    status
  });

  prometheusMetrics.redisOperationDuration.observe(
    { operation },
    duration / 1000
  );
}

export function recordError(
  type: string,
  component: string,
  severity: 'low' | 'medium' | 'high' | 'critical'
): void {
  prometheusMetrics.errorsTotal.inc({
    type,
    component,
    severity
  });
}

export function updateQueueSize(type: string, status: string, size: number): void {
  prometheusMetrics.jobQueueSize.set({ type, status }, size);
}

export function updateActiveConnections(type: string, count: number): void {
  prometheusMetrics.activeConnections.set({ type }, count);
}

export function updateMemoryUsage(type: string, bytes: number): void {
  prometheusMetrics.memoryUsage.set({ type }, bytes);
}

export function recordProcessingLatency(component: string, duration: number): void {
  prometheusMetrics.processingLatency.observe({ component }, duration / 1000);
}

// Metrics endpoint handler
export function getMetricsHandler(): void {
  return async (req: any, res: any) => {
    try {
      res.set('Content-Type', register.contentType);
      const metrics = await register.metrics();
      res.end(metrics);
    } catch (error) {
      res.status(500).end('Error generating metrics');
    }
  };
}

// Health check with metrics
export function getHealthCheckHandler(): void {
  return async (req: any, res: any) => {
    try {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version,
        metrics: {
          totalMetrics: register.getMetricsAsArray().length,
          lastScrape: new Date().toISOString()
        }
      };

      res.json(health);
  } catch (error) {
      res.status(500).json({
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}

// Export the register for external use
export { register };
