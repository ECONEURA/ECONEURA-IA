import { logger } from './logger.js';
export class MonitoringService {
    metrics = new Map();
    alertRules = new Map();
    activeAlerts = new Map();
    healthChecks = new Map();
    performanceData;
    alertTimer;
    metricsTimer;
    constructor() {
        this.performanceData = this.initializePerformanceData();
        this.initializeDefaultAlertRules();
        this.initializeDefaultHealthChecks();
        this.startMonitoring();
        logger.info('MonitoringService initialized');
    }
    recordMetric(name, value, labels, type = 'gauge') {
        const metric = {
            name,
            value,
            timestamp: Date.now(),
            labels,
            type
        };
        if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
        }
        const metrics = this.metrics.get(name);
        metrics.push(metric);
        if (metrics.length > 1000) {
            metrics.splice(0, metrics.length - 1000);
        }
        this.evaluateAlertRules(name, value);
        logger.debug('Metric recorded', { name, value, labels, type });
    }
    incrementCounter(name, labels, value = 1) {
        this.recordMetric(name, value, labels, 'counter');
    }
    setGauge(name, value, labels) {
        this.recordMetric(name, value, labels, 'gauge');
    }
    recordHistogram(name, value, labels) {
        this.recordMetric(name, value, labels, 'histogram');
    }
    getMetrics(name, timeRange) {
        if (name) {
            const metrics = this.metrics.get(name) || [];
            if (timeRange) {
                return metrics.filter(m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end);
            }
            return metrics;
        }
        const allMetrics = [];
        for (const metrics of this.metrics.values()) {
            allMetrics.push(...metrics);
        }
        if (timeRange) {
            return allMetrics.filter(m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end);
        }
        return allMetrics;
    }
    createAlertRule(rule) {
        const alertRule = {
            id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...rule,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.alertRules.set(alertRule.id, alertRule);
        logger.info('Alert rule created', { ruleId: alertRule.id, name: alertRule.name });
        return alertRule;
    }
    getAlertRules() {
        return Array.from(this.alertRules.values());
    }
    getActiveAlerts() {
        return Array.from(this.activeAlerts.values());
    }
    acknowledgeAlert(alertId, userId) {
        const alert = this.activeAlerts.get(alertId);
        if (!alert)
            return false;
        alert.acknowledgedAt = new Date();
        alert.acknowledgedBy = userId;
        this.activeAlerts.set(alertId, alert);
        logger.info('Alert acknowledged', { alertId, userId });
        return true;
    }
    resolveAlert(alertId) {
        const alert = this.activeAlerts.get(alertId);
        if (!alert)
            return false;
        alert.status = 'resolved';
        alert.resolvedAt = new Date();
        this.activeAlerts.set(alertId, alert);
        logger.info('Alert resolved', { alertId });
        return true;
    }
    registerHealthCheck(name, check) {
        this.healthChecks.set(name, check);
        logger.info('Health check registered', { name });
    }
    async runHealthChecks() {
        const checks = [];
        let healthyCount = 0;
        let totalDuration = 0;
        for (const [name, check] of this.healthChecks.entries()) {
            const startTime = Date.now();
            try {
                const result = await check();
                result.duration = Date.now() - startTime;
                checks.push(result);
                if (result.status === 'pass') {
                    healthyCount++;
                }
                totalDuration += result.duration;
            }
            catch (error) {
                checks.push({
                    name,
                    status: 'fail',
                    message: `Health check failed: ${error.message}`,
                    duration: Date.now() - startTime
                });
            }
        }
        const healthScore = checks.length > 0 ? (healthyCount / checks.length) * 100 : 100;
        const status = healthScore >= 90 ? 'healthy' : healthScore >= 70 ? 'degraded' : 'unhealthy';
        const systemHealth = {
            status,
            score: healthScore,
            checks,
            timestamp: new Date()
        };
        this.setGauge('system_health_score', healthScore);
        this.setGauge('system_health_checks_total', checks.length);
        this.setGauge('system_health_checks_healthy', healthyCount);
        return systemHealth;
    }
    getPerformanceMetrics() {
        return { ...this.performanceData };
    }
    updatePerformanceMetrics(data) {
        this.performanceData = { ...this.performanceData, ...data };
        this.setGauge('response_time_p50', this.performanceData.responseTime.p50);
        this.setGauge('response_time_p95', this.performanceData.responseTime.p95);
        this.setGauge('response_time_p99', this.performanceData.responseTime.p99);
        this.setGauge('response_time_average', this.performanceData.responseTime.average);
        this.setGauge('throughput_rps', this.performanceData.throughput.requestsPerSecond);
        this.setGauge('error_rate_percentage', this.performanceData.errorRate.percentage);
        this.setGauge('resource_cpu_usage', this.performanceData.resourceUsage.cpu);
        this.setGauge('resource_memory_usage', this.performanceData.resourceUsage.memory);
        this.setGauge('resource_disk_usage', this.performanceData.resourceUsage.disk);
    }
    getDashboard() {
        const now = Date.now();
        const oneHourAgo = now - (60 * 60 * 1000);
        const oneDayAgo = now - (24 * 60 * 60 * 1000);
        return {
            systemHealth: this.runHealthChecks(),
            performance: this.getPerformanceMetrics(),
            alerts: {
                active: this.getActiveAlerts().length,
                total: this.getActiveAlerts(),
                bySeverity: this.getAlertsBySeverity()
            },
            metrics: {
                total: this.metrics.size,
                recent: this.getRecentMetrics(oneHourAgo),
                trends: this.getMetricTrends(oneDayAgo)
            },
            timestamp: new Date()
        };
    }
    exportPrometheusMetrics() {
        let output = '';
        for (const [name, metrics] of this.metrics.entries()) {
            const latest = metrics[metrics.length - 1];
            if (!latest)
                continue;
            const labels = latest.labels ?
                Object.entries(latest.labels)
                    .map(([k, v]) => `${k}="${v}"`)
                    .join(',') : '';
            const metricName = name.replace(/[^a-zA-Z0-9_]/g, '_');
            output += `# HELP ${metricName} ${name}\n`;
            output += `# TYPE ${metricName} ${latest.type}\n`;
            output += `${metricName}${labels ? '{' + labels + '}' : ''} ${latest.value}\n`;
        }
        return output;
    }
    initializePerformanceData() {
        return {
            responseTime: {
                p50: 0,
                p95: 0,
                p99: 0,
                average: 0
            },
            throughput: {
                requestsPerSecond: 0,
                requestsPerMinute: 0,
                requestsPerHour: 0
            },
            errorRate: {
                percentage: 0,
                count: 0,
                total: 0
            },
            resourceUsage: {
                cpu: 0,
                memory: 0,
                disk: 0
            }
        };
    }
    initializeDefaultAlertRules() {
        this.createAlertRule({
            name: 'High Response Time',
            description: 'Response time is above threshold',
            metric: 'response_time_p95',
            condition: 'gt',
            threshold: 1000,
            duration: 300,
            severity: 'high',
            enabled: true,
            actions: [
                {
                    type: 'email',
                    config: { recipients: ['admin@econeura.com'] }
                }
            ]
        });
        this.createAlertRule({
            name: 'High Error Rate',
            description: 'Error rate is above threshold',
            metric: 'error_rate_percentage',
            condition: 'gt',
            threshold: 5,
            duration: 300,
            severity: 'critical',
            enabled: true,
            actions: [
                {
                    type: 'slack',
                    config: { webhook: process.env.SLACK_WEBHOOK_URL }
                }
            ]
        });
        this.createAlertRule({
            name: 'High CPU Usage',
            description: 'CPU usage is above threshold',
            metric: 'resource_cpu_usage',
            condition: 'gt',
            threshold: 80,
            duration: 600,
            severity: 'medium',
            enabled: true,
            actions: [
                {
                    type: 'webhook',
                    config: { url: process.env.ALERT_WEBHOOK_URL }
                }
            ]
        });
    }
    initializeDefaultHealthChecks() {
        this.registerHealthCheck('database', async () => {
            try {
                await new Promise(resolve => setTimeout(resolve, 10));
                return {
                    name: 'database',
                    status: 'pass',
                    message: 'Database connection healthy',
                    duration: 10
                };
            }
            catch (error) {
                return {
                    name: 'database',
                    status: 'fail',
                    message: `Database check failed: ${error.message}`,
                    duration: 0
                };
            }
        });
        this.registerHealthCheck('memory', async () => {
            const memUsage = process.memoryUsage();
            const usagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
            return {
                name: 'memory',
                status: usagePercent > 90 ? 'fail' : usagePercent > 80 ? 'warn' : 'pass',
                message: `Memory usage: ${usagePercent.toFixed(2)}%`,
                duration: 1,
                details: {
                    heapUsed: memUsage.heapUsed,
                    heapTotal: memUsage.heapTotal,
                    usagePercent
                }
            };
        });
        this.registerHealthCheck('disk', async () => {
            const diskUsage = 75;
            return {
                name: 'disk',
                status: diskUsage > 95 ? 'fail' : diskUsage > 85 ? 'warn' : 'pass',
                message: `Disk usage: ${diskUsage}%`,
                duration: 5,
                details: { usage: diskUsage }
            };
        });
    }
    evaluateAlertRules(metricName, value) {
        for (const rule of this.alertRules.values()) {
            if (!rule.enabled || rule.metric !== metricName)
                continue;
            const shouldFire = this.evaluateCondition(value, rule.condition, rule.threshold);
            const alertKey = `${rule.id}_${metricName}`;
            const existingAlert = this.activeAlerts.get(alertKey);
            if (shouldFire && !existingAlert) {
                const alert = {
                    id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    ruleId: rule.id,
                    status: 'firing',
                    severity: rule.severity,
                    message: `${rule.name}: ${metricName} is ${value} (threshold: ${rule.threshold})`,
                    value,
                    threshold: rule.threshold,
                    startedAt: new Date()
                };
                this.activeAlerts.set(alertKey, alert);
                this.executeAlertActions(alert, rule.actions);
                logger.warn('Alert fired', { alertId: alert.id, ruleId: rule.id, value, threshold: rule.threshold });
            }
            else if (!shouldFire && existingAlert) {
                existingAlert.status = 'resolved';
                existingAlert.resolvedAt = new Date();
                this.activeAlerts.set(alertKey, existingAlert);
                logger.info('Alert resolved', { alertId: existingAlert.id, ruleId: rule.id });
            }
        }
    }
    evaluateCondition(value, condition, threshold) {
        switch (condition) {
            case 'gt': return value > threshold;
            case 'lt': return value < threshold;
            case 'eq': return value === threshold;
            case 'gte': return value >= threshold;
            case 'lte': return value <= threshold;
            default: return false;
        }
    }
    executeAlertActions(alert, actions) {
        for (const action of actions) {
            try {
                switch (action.type) {
                    case 'email':
                        this.sendEmailAlert(alert, action.config);
                        break;
                    case 'webhook':
                        this.sendWebhookAlert(alert, action.config);
                        break;
                    case 'slack':
                        this.sendSlackAlert(alert, action.config);
                        break;
                    case 'sms':
                        this.sendSMSAlert(alert, action.config);
                        break;
                }
            }
            catch (error) {
                logger.error('Failed to execute alert action', {
                    alertId: alert.id,
                    actionType: action.type,
                    error: error.message
                });
            }
        }
    }
    sendEmailAlert(alert, config) {
        logger.info('Email alert sent', { alertId: alert.id, recipients: config.recipients });
    }
    sendWebhookAlert(alert, config) {
        logger.info('Webhook alert sent', { alertId: alert.id, url: config.url });
    }
    sendSlackAlert(alert, config) {
        logger.info('Slack alert sent', { alertId: alert.id, webhook: config.webhook });
    }
    sendSMSAlert(alert, config) {
        logger.info('SMS alert sent', { alertId: alert.id, phone: config.phone });
    }
    getAlertsBySeverity() {
        const alerts = this.getActiveAlerts();
        return alerts.reduce((acc, alert) => {
            acc[alert.severity] = (acc[alert.severity] || 0) + 1;
            return acc;
        }, {});
    }
    getRecentMetrics(since) {
        const allMetrics = [];
        for (const metrics of this.metrics.values()) {
            allMetrics.push(...metrics.filter(m => m.timestamp >= since));
        }
        return allMetrics.sort((a, b) => b.timestamp - a.timestamp);
    }
    getMetricTrends(since) {
        const trends = {};
        for (const [name, metrics] of this.metrics.entries()) {
            const recentMetrics = metrics.filter(m => m.timestamp >= since);
            if (recentMetrics.length === 0)
                continue;
            const values = recentMetrics.map(m => m.value);
            trends[name] = {
                count: values.length,
                min: Math.min(...values),
                max: Math.max(...values),
                average: values.reduce((sum, val) => sum + val, 0) / values.length,
                trend: this.calculateTrend(values)
            };
        }
        return trends;
    }
    calculateTrend(values) {
        if (values.length < 2)
            return 'stable';
        const firstHalf = values.slice(0, Math.floor(values.length / 2));
        const secondHalf = values.slice(Math.floor(values.length / 2));
        const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
        const change = ((secondAvg - firstAvg) / firstAvg) * 100;
        if (change > 5)
            return 'up';
        if (change < -5)
            return 'down';
        return 'stable';
    }
    startMonitoring() {
        this.alertTimer = setInterval(() => {
            this.runHealthChecks();
        }, 30000);
        this.metricsTimer = setInterval(() => {
            this.cleanupOldMetrics();
        }, 300000);
    }
    cleanupOldMetrics() {
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
        for (const [name, metrics] of this.metrics.entries()) {
            const filtered = metrics.filter(m => m.timestamp >= oneDayAgo);
            this.metrics.set(name, filtered);
        }
    }
    destroy() {
        if (this.alertTimer)
            clearInterval(this.alertTimer);
        if (this.metricsTimer)
            clearInterval(this.metricsTimer);
        logger.info('MonitoringService destroyed');
    }
}
export const monitoringService = new MonitoringService();
export const metricsMiddleware = (req, res, next) => {
    const startTime = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        monitoringService.recordHistogram('http_request_duration', duration, {
            method: req.method,
            route: req.route?.path || req.path,
            status: res.statusCode.toString()
        });
        monitoringService.incrementCounter('http_requests_total', {
            method: req.method,
            route: req.route?.path || req.path,
            status: res.statusCode.toString()
        });
        if (res.statusCode >= 400) {
            monitoringService.incrementCounter('http_errors_total', {
                method: req.method,
                route: req.route?.path || req.path,
                status: res.statusCode.toString()
            });
        }
    });
    next();
};
//# sourceMappingURL=monitoring.service.js.map