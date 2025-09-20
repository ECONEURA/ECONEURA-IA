import { register, Counter, Histogram, Gauge, Summary, collectDefaultMetrics } from 'prom-client';
export class MetricsService {
    static instance;
    metrics = new Map();
    constructor() {
        this.initializeMetrics();
        this.startDefaultMetrics();
    }
    static getInstance() {
        if (!MetricsService.instance) {
            MetricsService.instance = new MetricsService();
        }
        return MetricsService.instance;
    }
    initializeMetrics() {
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
        this.metrics.set('organizations_total', new Gauge({
            name: 'organizations_total',
            help: 'Total number of organizations',
            labelNames: ['subscription_tier', 'status']
        }));
        this.metrics.set('errors_total', new Counter({
            name: 'errors_total',
            help: 'Total number of errors',
            labelNames: ['error_type', 'service', 'operation']
        }));
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
    startDefaultMetrics() {
        collectDefaultMetrics({
            prefix: 'econeura_',
            timeout: 5000,
            gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5]
        });
    }
    recordHttpRequest(req, res, duration) {
        const labels = {
            method: req.method,
            route: req.route?.path || req.path,
            status_code: res.statusCode.toString(),
            service: 'econeura-api'
        };
        this.metrics.get('http_requests_total')?.inc(labels);
        this.metrics.get('http_request_duration_seconds')?.observe(labels, duration / 1000);
        const requestSize = JSON.stringify(req.body).length;
        this.metrics.get('http_request_size_bytes')?.observe(labels, requestSize);
        const responseSize = JSON.stringify(res.locals.responseBody || {}).length;
        this.metrics.get('http_response_size_bytes')?.observe(labels, responseSize);
    }
    recordBusinessOperation(operation, organizationId, duration, status = 'success') {
        const labels = {
            operation,
            organization_id: organizationId,
            status
        };
        this.metrics.get('business_operations_total')?.inc(labels);
        this.metrics.get('business_operation_duration_seconds')?.observe(labels, duration / 1000);
    }
    recordUserLogin(organizationId, status = 'success') {
        const labels = {
            organization_id: organizationId,
            status
        };
        this.metrics.get('user_logins_total')?.inc(labels);
    }
    updateUserCount(organizationId, status, role, count) {
        const labels = {
            organization_id: organizationId,
            status,
            role
        };
        this.metrics.get('users_total')?.set(labels, count);
    }
    updateOrganizationCount(subscriptionTier, status, count) {
        const labels = {
            subscription_tier: subscriptionTier,
            status
        };
        this.metrics.get('organizations_total')?.set(labels, count);
    }
    recordError(errorType, service, operation) {
        const labels = {
            error_type: errorType,
            service,
            operation
        };
        this.metrics.get('errors_total')?.inc(labels);
    }
    updateMemoryUsage(type, usage) {
        const labels = { type };
        this.metrics.get('memory_usage_bytes')?.set(labels, usage);
    }
    updateCpuUsage(type, usage) {
        const labels = { type };
        this.metrics.get('cpu_usage_percent')?.set(labels, usage);
    }
    recordDatabaseQuery(operation, table, duration) {
        const labels = {
            operation,
            table
        };
        this.metrics.get('database_query_duration_seconds')?.observe(labels, duration / 1000);
    }
    updateDatabaseConnections(state, count) {
        const labels = { state };
        this.metrics.get('database_connections_total')?.set(labels, count);
    }
    recordCacheOperation(operation, status) {
        const labels = {
            operation,
            status
        };
        this.metrics.get('cache_operations_total')?.inc(labels);
    }
    updateCacheHitRatio(cacheType, ratio) {
        const labels = { cache_type: cacheType };
        this.metrics.get('cache_hit_ratio')?.set(labels, ratio);
    }
    recordExternalApiRequest(service, endpoint, statusCode, duration) {
        const labels = {
            service,
            endpoint,
            status_code: statusCode.toString()
        };
        this.metrics.get('external_api_requests_total')?.inc(labels);
        this.metrics.get('external_api_duration_seconds')?.observe(labels, duration / 1000);
    }
    createCounter(name, help, labelNames = []) {
        const counter = new Counter({ name, help, labelNames });
        this.metrics.set(name, counter);
        register.registerMetric(counter);
        return counter;
    }
    createHistogram(name, help, labelNames = [], buckets = []) {
        const histogram = new Histogram({ name, help, labelNames, buckets });
        this.metrics.set(name, histogram);
        register.registerMetric(histogram);
        return histogram;
    }
    createGauge(name, help, labelNames = []) {
        const gauge = new Gauge({ name, help, labelNames });
        this.metrics.set(name, gauge);
        register.registerMetric(gauge);
        return gauge;
    }
    createSummary(name, help, labelNames = []) {
        const summary = new Summary({ name, help, labelNames });
        this.metrics.set(name, summary);
        register.registerMetric(summary);
        return summary;
    }
    async getMetrics() {
        return register.metrics();
    }
    async getMetricsAsJSON() {
        return register.getMetricsAsJSON();
    }
    resetMetrics() {
        register.clear();
        this.initializeMetrics();
        this.startDefaultMetrics();
    }
    getMetricsHealth() {
        const metrics = register.getMetricsAsJSON();
        return {
            status: 'healthy',
            metrics: metrics.length
        };
    }
}
export const metrics = MetricsService.getInstance();
//# sourceMappingURL=metrics.service.js.map