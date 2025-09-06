import { register, Counter, Histogram, Gauge, Summary, collectDefaultMetrics } from 'prom-client';
import { Request, Response } from 'express';

// ============================================================================
// METRICS SERVICE
// ============================================================================

export interface MetricLabels {
  method?: string;
  route?: string;
  status_code?: string;
  service?: string;
  operation?: string;
  organization_id?: string;
  user_id?: string;
  error_type?: string;
  [key: string]: string | undefined;
}

export class MetricsService {
  private static instance: MetricsService;
  private metrics: Map<string, any> = new Map();

  private constructor() {
    this.initializeMetrics();
    this.startDefaultMetrics();
  }

  public static getInstance(): MetricsService {
    if (!MetricsService.instance) {
      MetricsService.instance = new MetricsService();
    }
    return MetricsService.instance;
  }

  // ========================================================================
  // METRICS INITIALIZATION
  // ========================================================================

  private initializeMetrics(): void {
    // HTTP Request Metrics
    this.metrics.set('http_requests_total', new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code', 'service']
    }));

    this.metrics.set('http_request_duration_seconds', new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code', 'service'],
      buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
    }));

    this.metrics.set('http_request_size_bytes', new Histogram({
      name: 'http_request_size_bytes',
      help: 'Size of HTTP requests in bytes',
      labelNames: ['method', 'route', 'service'],
      buckets: [100, 1000, 10000, 100000, 1000000]
    }));

    this.metrics.set('http_response_size_bytes', new Histogram({
      name: 'http_response_size_bytes',
      help: 'Size of HTTP responses in bytes',
      labelNames: ['method', 'route', 'status_code', 'service'],
      buckets: [100, 1000, 10000, 100000, 1000000]
    }));

    // Business Metrics
    this.metrics.set('business_operations_total', new Counter({
      name: 'business_operations_total',
      help: 'Total number of business operations',
      labelNames: ['operation', 'organization_id', 'status']
    }));

    this.metrics.set('business_operation_duration_seconds', new Histogram({
      name: 'business_operation_duration_seconds',
      help: 'Duration of business operations in seconds',
      labelNames: ['operation', 'organization_id'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60]
    }));

    // User Metrics
    this.metrics.set('users_total', new Gauge({
      name: 'users_total',
      help: 'Total number of users',
      labelNames: ['organization_id', 'status', 'role']
    }));

    this.metrics.set('user_logins_total', new Counter({
      name: 'user_logins_total',
      help: 'Total number of user logins',
      labelNames: ['organization_id', 'status']
    }));

    // Organization Metrics
    this.metrics.set('organizations_total', new Gauge({
      name: 'organizations_total',
      help: 'Total number of organizations',
      labelNames: ['subscription_tier', 'status']
    }));

    // Error Metrics
    this.metrics.set('errors_total', new Counter({
      name: 'errors_total',
      help: 'Total number of errors',
      labelNames: ['error_type', 'service', 'operation']
    }));

    // Performance Metrics
    this.metrics.set('memory_usage_bytes', new Gauge({
      name: 'memory_usage_bytes',
      help: 'Memory usage in bytes',
      labelNames: ['type']
    }));

    this.metrics.set('cpu_usage_percent', new Gauge({
      name: 'cpu_usage_percent',
      help: 'CPU usage percentage',
      labelNames: ['type']
    }));

    // Database Metrics
    this.metrics.set('database_connections_total', new Gauge({
      name: 'database_connections_total',
      help: 'Total number of database connections',
      labelNames: ['state']
    }));

    this.metrics.set('database_query_duration_seconds', new Histogram({
      name: 'database_query_duration_seconds',
      help: 'Duration of database queries in seconds',
      labelNames: ['operation', 'table'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5]
    }));

    // Cache Metrics
    this.metrics.set('cache_operations_total', new Counter({
      name: 'cache_operations_total',
      help: 'Total number of cache operations',
      labelNames: ['operation', 'status']
    }));

    this.metrics.set('cache_hit_ratio', new Gauge({
      name: 'cache_hit_ratio',
      help: 'Cache hit ratio',
      labelNames: ['cache_type']
    }));

    // External API Metrics
    this.metrics.set('external_api_requests_total', new Counter({
      name: 'external_api_requests_total',
      help: 'Total number of external API requests',
      labelNames: ['service', 'endpoint', 'status_code']
    }));

    this.metrics.set('external_api_duration_seconds', new Histogram({
      name: 'external_api_duration_seconds',
      help: 'Duration of external API requests in seconds',
      labelNames: ['service', 'endpoint'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30]
    }));
  }

  private startDefaultMetrics(): void {
    collectDefaultMetrics({
      prefix: 'econeura_',
      timeout: 5000,
      gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5]
    });
  }

  // ========================================================================
  // HTTP METRICS
  // ========================================================================

  recordHttpRequest(req: Request, res: Response, duration: number): void {
    const labels: MetricLabels = {
      method: req.method,
      route: req.route?.path || req.path,
      status_code: res.statusCode.toString(),
      service: 'econeura-api'
    };

    this.metrics.get('http_requests_total')?.inc(labels);
    this.metrics.get('http_request_duration_seconds')?.observe(labels, duration / 1000);

    // Record request size
    const requestSize = JSON.stringify(req.body).length;
    this.metrics.get('http_request_size_bytes')?.observe(labels, requestSize);

    // Record response size
    const responseSize = JSON.stringify(res.locals.responseBody || {}).length;
    this.metrics.get('http_response_size_bytes')?.observe(labels, responseSize);
  }

  // ========================================================================
  // BUSINESS METRICS
  // ========================================================================

  recordBusinessOperation(operation: string, organizationId: string, duration: number, status: string = 'success'): void {
    const labels: MetricLabels = {
      operation,
      organization_id: organizationId,
      status
    };

    this.metrics.get('business_operations_total')?.inc(labels);
    this.metrics.get('business_operation_duration_seconds')?.observe(labels, duration / 1000);
  }

  // ========================================================================
  // USER METRICS
  // ========================================================================

  recordUserLogin(organizationId: string, status: string = 'success'): void {
    const labels: MetricLabels = {
      organization_id: organizationId,
      status
    };

    this.metrics.get('user_logins_total')?.inc(labels);
  }

  updateUserCount(organizationId: string, status: string, role: string, count: number): void {
    const labels: MetricLabels = {
      organization_id: organizationId,
      status,
      role
    };

    this.metrics.get('users_total')?.set(labels, count);
  }

  // ========================================================================
  // ORGANIZATION METRICS
  // ========================================================================

  updateOrganizationCount(subscriptionTier: string, status: string, count: number): void {
    const labels: MetricLabels = {
      subscription_tier: subscriptionTier,
      status
    };

    this.metrics.get('organizations_total')?.set(labels, count);
  }

  // ========================================================================
  // ERROR METRICS
  // ========================================================================

  recordError(errorType: string, service: string, operation: string): void {
    const labels: MetricLabels = {
      error_type: errorType,
      service,
      operation
    };

    this.metrics.get('errors_total')?.inc(labels);
  }

  // ========================================================================
  // PERFORMANCE METRICS
  // ========================================================================

  updateMemoryUsage(type: string, usage: number): void {
    const labels: MetricLabels = { type };
    this.metrics.get('memory_usage_bytes')?.set(labels, usage);
  }

  updateCpuUsage(type: string, usage: number): void {
    const labels: MetricLabels = { type };
    this.metrics.get('cpu_usage_percent')?.set(labels, usage);
  }

  // ========================================================================
  // DATABASE METRICS
  // ========================================================================

  recordDatabaseQuery(operation: string, table: string, duration: number): void {
    const labels: MetricLabels = {
      operation,
      table
    };

    this.metrics.get('database_query_duration_seconds')?.observe(labels, duration / 1000);
  }

  updateDatabaseConnections(state: string, count: number): void {
    const labels: MetricLabels = { state };
    this.metrics.get('database_connections_total')?.set(labels, count);
  }

  // ========================================================================
  // CACHE METRICS
  // ========================================================================

  recordCacheOperation(operation: string, status: string): void {
    const labels: MetricLabels = {
      operation,
      status
    };

    this.metrics.get('cache_operations_total')?.inc(labels);
  }

  updateCacheHitRatio(cacheType: string, ratio: number): void {
    const labels: MetricLabels = { cache_type: cacheType };
    this.metrics.get('cache_hit_ratio')?.set(labels, ratio);
  }

  // ========================================================================
  // EXTERNAL API METRICS
  // ========================================================================

  recordExternalApiRequest(service: string, endpoint: string, statusCode: number, duration: number): void {
    const labels: MetricLabels = {
      service,
      endpoint,
      status_code: statusCode.toString()
    };

    this.metrics.get('external_api_requests_total')?.inc(labels);
    this.metrics.get('external_api_duration_seconds')?.observe(labels, duration / 1000);
  }

  // ========================================================================
  // CUSTOM METRICS
  // ========================================================================

  createCounter(name: string, help: string, labelNames: string[] = []): Counter {
    const counter = new Counter({ name, help, labelNames });
    this.metrics.set(name, counter);
    register.registerMetric(counter);
    return counter;
  }

  createHistogram(name: string, help: string, labelNames: string[] = [], buckets: number[] = []): Histogram {
    const histogram = new Histogram({ name, help, labelNames, buckets });
    this.metrics.set(name, histogram);
    register.registerMetric(histogram);
    return histogram;
  }

  createGauge(name: string, help: string, labelNames: string[] = []): Gauge {
    const gauge = new Gauge({ name, help, labelNames });
    this.metrics.set(name, gauge);
    register.registerMetric(gauge);
    return gauge;
  }

  createSummary(name: string, help: string, labelNames: string[] = []): Summary {
    const summary = new Summary({ name, help, labelNames });
    this.metrics.set(name, summary);
    register.registerMetric(summary);
    return summary;
  }

  // ========================================================================
  // METRICS EXPORT
  // ========================================================================

  async getMetrics(): Promise<string> {
    return register.metrics();
  }

  async getMetricsAsJSON(): Promise<any> {
    return register.getMetricsAsJSON();
  }

  // ========================================================================
  // METRICS RESET
  // ========================================================================

  resetMetrics(): void {
    register.clear();
    this.initializeMetrics();
    this.startDefaultMetrics();
  }

  // ========================================================================
  // HEALTH CHECK
  // ========================================================================

  getMetricsHealth(): { status: string; metrics: number } {
    const metrics = register.getMetricsAsJSON();
    return {
      status: 'healthy',
      metrics: metrics.length
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const metrics = MetricsService.getInstance();
