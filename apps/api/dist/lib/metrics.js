import { register, Counter, Histogram, collectDefaultMetrics } from 'prom-client';
export class MetricsService {
    healthCheckCounter;
    healthCheckDuration;
    metricsInitialized = false;
    constructor() {
        this.initializeMetrics();
    }
    initializeMetrics() {
        if (this.metricsInitialized)
            return;
        collectDefaultMetrics({ register });
        this.healthCheckCounter = new Counter({
            name: 'health_check_total',
            help: 'Total number of health checks',
            labelNames: ['type', 'status'],
            registers: [register]
        });
        this.healthCheckDuration = new Histogram({
            name: 'health_check_duration_seconds',
            help: 'Health check duration in seconds',
            labelNames: ['type', 'status'],
            buckets: [0.1, 0.5, 1, 2, 5],
            registers: [register]
        });
        this.metricsInitialized = true;
    }
    incrementHealthCheck(type, status = 'success') {
        this.healthCheckCounter.labels(type, status).inc();
    }
    recordHealthCheckDuration(type, durationMs, status = 'success') {
        this.healthCheckDuration.labels(type, status).observe(durationMs / 1000);
    }
    async getMetrics() {
        return register.metrics();
    }
    async getPrometheusMetrics() {
        return this.getMetrics();
    }
    getMetricsSummary() {
        return { metricCount: 0 };
    }
    getAllMetrics() {
        return {};
    }
    async exportPrometheus() {
        return this.getMetrics();
    }
    getMetricsStats() {
        return {};
    }
    recordHttpRequest(route, method, statusCode, durationMs, org) {
        this.recordHealthCheckDuration('http', durationMs);
    }
    increment(name, valueOrLabels, maybeLabels) {
        try {
            const value = typeof valueOrLabels === 'number' ? valueOrLabels : 1;
            const labels = typeof valueOrLabels === 'object' ? valueOrLabels : maybeLabels || { success: 'true' };
            let statusLabel = 'success';
            if (labels && typeof labels === 'object') {
                const maybeStatus = labels['status'];
                if (typeof maybeStatus === 'string')
                    statusLabel = maybeStatus;
            }
            this.healthCheckCounter.labels(name, statusLabel).inc(value);
        }
        catch (e) {
        }
    }
    recordRateLimit(route, org) {
    }
    recordSystemMetrics() {
    }
    cleanup() {
        register.clear();
        this.metricsInitialized = false;
        this.initializeMetrics();
    }
    async getMetricsContentType() {
        return register.contentType;
    }
    clearMetrics() {
        register.clear();
        this.initializeMetrics();
    }
}
export const metrics = new MetricsService();
//# sourceMappingURL=metrics.js.map