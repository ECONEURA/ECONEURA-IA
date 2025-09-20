import { register, Counter, Histogram } from 'prom-client';
export class MetricsService {
    metrics = new Map();
    MAX_VALUES_PER_METRIC = 1000;
    healthCheckCounter;
    healthCheckDuration;
    constructor() {
        this.healthCheckCounter = new Counter({
            name: 'health_check_total',
            help: 'Total number of health checks',
            labelNames: ['type'],
            registers: [register]
        });
        this.healthCheckDuration = new Histogram({
            name: 'health_check_duration_seconds',
            help: 'Health check duration in seconds',
            labelNames: ['type'],
            buckets: [0.1, 0.5, 1, 2, 5],
            registers: [register]
        });
    }
    constructor() {
        this.initializeDefaultMetrics();
    }
    initializeDefaultMetrics() {
        this.registerMetric('http_requests_total', 'counter', 'Total number of HTTP requests');
        this.registerMetric('http_request_duration_ms', 'histogram', 'HTTP request duration in milliseconds');
        this.registerMetric('http_requests_in_flight', 'gauge', 'Number of HTTP requests currently in flight');
        this.registerMetric('ai_requests_total', 'counter', 'Total number of AI requests');
        this.registerMetric('ai_request_duration_ms', 'histogram', 'AI request duration in milliseconds');
        this.registerMetric('ai_tokens_total', 'counter', 'Total number of tokens processed');
        this.registerMetric('ai_cost_total', 'counter', 'Total cost of AI requests in EUR');
        this.registerMetric('errors_total', 'counter', 'Total number of errors');
        this.registerMetric('error_rate', 'gauge', 'Error rate percentage');
        this.registerMetric('memory_usage_bytes', 'gauge', 'Memory usage in bytes');
        this.registerMetric('cpu_usage_percent', 'gauge', 'CPU usage percentage');
        this.registerMetric('uptime_seconds', 'gauge', 'Application uptime in seconds');
        this.registerMetric('health_check_total', 'counter', 'Total number of health checks');
        this.registerMetric('health_check_duration_ms', 'histogram', 'Health check duration in milliseconds');
    }
    registerMetric(name, type, description) {
        if (!this.metrics.has(name)) {
            this.metrics.set(name, {
                name,
                type,
                description,
                values: [],
                maxValues: this.MAX_VALUES_PER_METRIC
            });
        }
    }
    increment(name, value = 1, labels) {
        this.addValue(name, value, labels);
    }
    gauge(name, value, labels) {
        this.addValue(name, value, labels);
    }
    histogram(name, value, labels) {
        this.addValue(name, value, labels);
    }
    addValue(name, value, labels) {
        const metric = this.metrics.get(name);
        if (!metric) {
            console.warn(`Metric ${name} not registered`);
            return;
        }
        const metricValue = {
            value,
            timestamp: Date.now(),
            labels
        };
        metric.values.push(metricValue);
        if (metric.values.length > metric.maxValues) {
            metric.values = metric.values.slice(-metric.maxValues);
        }
    }
    recordHttpRequest(method, path, statusCode, duration) {
        const labels = { method, path, status: statusCode.toString() };
        this.increment('http_requests_total', 1, labels);
        this.histogram('http_request_duration_ms', duration, labels);
        if (statusCode >= 400) {
            this.increment('errors_total', 1, { type: 'http_error', status: statusCode.toString() });
        }
    }
    recordAIRequest(model, provider, tokens, cost, duration) {
        const labels = { model, provider };
        this.increment('ai_requests_total', 1, labels);
        this.histogram('ai_request_duration_ms', duration, labels);
        this.increment('ai_tokens_total', tokens, labels);
        this.increment('ai_cost_total', cost, labels);
    }
    recordHealthCheck(service, status, duration) {
        const labels = { service, status };
        this.increment('health_check_total', 1, labels);
        this.histogram('health_check_duration_ms', duration, labels);
    }
    recordSystemMetrics() {
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        this.gauge('memory_usage_bytes', memUsage.heapUsed, { type: 'heap_used' });
        this.gauge('memory_usage_bytes', memUsage.heapTotal, { type: 'heap_total' });
        this.gauge('memory_usage_bytes', memUsage.rss, { type: 'rss' });
        this.gauge('uptime_seconds', process.uptime());
    }
    recordRateLimit(data) {
        const { organizationId, allowed, strategy, remaining } = data;
        this.increment('rate_limit_total', 1, { organization_id: organizationId, strategy });
        if (allowed) {
            this.increment('rate_limit_allowed', 1, { organization_id: organizationId, strategy });
        }
        else {
            this.increment('rate_limit_blocked', 1, { organization_id: organizationId, strategy });
        }
        this.gauge('rate_limit_remaining', remaining, { organization_id: organizationId, strategy });
        const org = this.getOrganizationStats(organizationId);
        if (org) {
            const utilization = (org.stats.totalRequests / org.config.maxRequests) * 100;
            this.gauge('rate_limit_utilization', utilization, { organization_id: organizationId, strategy });
        }
        console.log('Rate limit metric recorded', {
            organizationId,
            allowed,
            strategy,
            remaining,
            requestId: data.requestId
        });
    }
    getOrganizationStats(organizationId) {
        return {
            config: { maxRequests: 100 },
            stats: { totalRequests: 50 }
        };
    }
    getMetric(name) {
        return this.metrics.get(name);
    }
    getAllMetrics() {
        return new Map(this.metrics);
    }
    getMetricsSummary() {
        const summary = {};
        for (const [name, metric] of this.metrics) {
            if (metric.values.length === 0)
                continue;
            const values = metric.values.map(v => v.value);
            const latestValue = values[values.length - 1];
            summary[name] = {
                type: metric.type,
                description: metric.description,
                latest: latestValue,
                count: values.length,
                total: values.reduce((sum, val) => sum + val, 0),
                average: values.reduce((sum, val) => sum + val, 0) / values.length,
                min: Math.min(...values),
                max: Math.max(...values)
            };
            if (metric.type === 'histogram') {
                const sortedValues = [...values].sort((a, b) => a - b);
                summary[name].p50 = sortedValues[Math.floor(sortedValues.length * 0.5)];
                summary[name].p95 = sortedValues[Math.floor(sortedValues.length * 0.95)];
                summary[name].p99 = sortedValues[Math.floor(sortedValues.length * 0.99)];
            }
        }
        return summary;
    }
    exportPrometheus() {
        let output = '';
        for (const [name, metric] of this.metrics) {
            if (metric.values.length === 0)
                continue;
            const groupedByLabels = new Map();
            for (const value of metric.values) {
                const labelStr = value.labels
                    ? Object.entries(value.labels).map(([k, v]) => `${k}="${v}"`).join(',')
                    : '';
                const key = labelStr ? `{${labelStr}}` : '';
                if (metric.type === 'counter' || metric.type === 'gauge') {
                    groupedByLabels.set(key, value.value);
                }
                else if (metric.type === 'histogram') {
                    groupedByLabels.set(key, value.value);
                }
            }
            for (const [labels, value] of groupedByLabels) {
                output += `# HELP ${name} ${metric.description}\n`;
                output += `# TYPE ${name} ${metric.type}\n`;
                output += `${name}${labels} ${value}\n`;
            }
        }
        return output;
    }
    cleanup(maxAgeMs = 24 * 60 * 60 * 1000) {
        const cutoff = Date.now() - maxAgeMs;
        for (const [name, metric] of this.metrics) {
            metric.values = metric.values.filter(v => v.timestamp >= cutoff);
        }
    }
    reset() {
        for (const [name, metric] of this.metrics) {
            metric.values = [];
        }
    }
    getMetricsStats() {
        return {
            totalMetrics: this.metrics.size,
            lastUpdated: new Date().toISOString()
        };
    }
    getPrometheusMetrics() {
        return this.exportPrometheus();
    }
}
export const metrics = new MetricsCollector();
//# sourceMappingURL=metrics.old.js.map