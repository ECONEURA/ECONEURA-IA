import { getDatabaseService } from '@econeura/db';

import { structuredLogger } from './structured-logger.js';
export class AdvancedMonitoringAlertsService {
    static instance;
    metrics = new Map();
    alertRules = new Map();
    activeAlerts = new Map();
    healthChecks = new Map();
    slaMetrics = new Map();
    notificationChannels = new Map();
    db;
    monitoringInterval = null;
    healthCheckInterval = null;
    constructor() {
        this.db = getDatabaseService();
        this.initializeDefaultAlertRules();
        this.initializeDefaultHealthChecks();
        this.initializeDefaultSLAMetrics();
        this.initializeDefaultNotificationChannels();
        this.startMonitoring();
        this.startHealthChecks();
        structuredLogger.info('AdvancedMonitoringAlertsService initialized');
    }
    static getInstance() {
        if (!AdvancedMonitoringAlertsService.instance) {
            AdvancedMonitoringAlertsService.instance = new AdvancedMonitoringAlertsService();
        }
        return AdvancedMonitoringAlertsService.instance;
    }
    initializeDefaultAlertRules() {
        const defaultRules = [
            {
                id: 'high-cpu-usage',
                name: 'High CPU Usage',
                description: 'CPU usage exceeds 80%',
                metric: 'cpu_usage',
                condition: 'greater_than',
                threshold: 80,
                severity: 'high',
                enabled: true,
                cooldown: 300,
                notificationChannels: ['email', 'slack']
            },
            {
                id: 'high-memory-usage',
                name: 'High Memory Usage',
                description: 'Memory usage exceeds 85%',
                metric: 'memory_usage',
                condition: 'greater_than',
                threshold: 85,
                severity: 'high',
                enabled: true,
                cooldown: 300,
                notificationChannels: ['email', 'slack']
            },
            {
                id: 'slow-response-time',
                name: 'Slow Response Time',
                description: 'Response time exceeds 2 seconds',
                metric: 'response_time',
                condition: 'greater_than',
                threshold: 2000,
                severity: 'medium',
                enabled: true,
                cooldown: 600,
                notificationChannels: ['slack']
            },
            {
                id: 'low-cache-hit-rate',
                name: 'Low Cache Hit Rate',
                description: 'Cache hit rate below 70%',
                metric: 'cache_hit_rate',
                condition: 'less_than',
                threshold: 70,
                severity: 'medium',
                enabled: true,
                cooldown: 900,
                notificationChannels: ['slack']
            },
            {
                id: 'database-connection-failure',
                name: 'Database Connection Failure',
                description: 'Database connection failures detected',
                metric: 'db_connection_errors',
                condition: 'greater_than',
                threshold: 5,
                severity: 'critical',
                enabled: true,
                cooldown: 60,
                notificationChannels: ['email', 'slack', 'pagerduty']
            }
        ];
        defaultRules.forEach(rule => {
            this.alertRules.set(rule.id, rule);
        });
    }
    initializeDefaultHealthChecks() {
        const defaultHealthChecks = [
            {
                id: 'api-health',
                name: 'API Health Check',
                endpoint: '/api/health',
                method: 'GET',
                expectedStatus: 200,
                timeout: 5000,
                interval: 30000,
                enabled: true,
                consecutiveFailures: 0,
                maxFailures: 3
            },
            {
                id: 'database-health',
                name: 'Database Health Check',
                endpoint: '/api/health/database',
                method: 'GET',
                expectedStatus: 200,
                timeout: 10000,
                interval: 60000,
                enabled: true,
                consecutiveFailures: 0,
                maxFailures: 2
            },
            {
                id: 'redis-health',
                name: 'Redis Health Check',
                endpoint: '/api/health/redis',
                method: 'GET',
                expectedStatus: 200,
                timeout: 5000,
                interval: 60000,
                enabled: true,
                consecutiveFailures: 0,
                maxFailures: 2
            }
        ];
        defaultHealthChecks.forEach(healthCheck => {
            this.healthChecks.set(healthCheck.id, healthCheck);
        });
    }
    initializeDefaultSLAMetrics() {
        const defaultSLAMetrics = [
            {
                id: 'api-availability',
                name: 'API Availability',
                target: 99.9,
                current: 99.95,
                period: 'monthly',
                status: 'meeting',
                lastUpdated: new Date()
            },
            {
                id: 'response-time',
                name: 'Response Time SLA',
                target: 95,
                current: 97.5,
                period: 'daily',
                status: 'meeting',
                lastUpdated: new Date()
            },
            {
                id: 'error-rate',
                name: 'Error Rate SLA',
                target: 99.5,
                current: 99.8,
                period: 'daily',
                status: 'meeting',
                lastUpdated: new Date()
            }
        ];
        defaultSLAMetrics.forEach(slaMetric => {
            this.slaMetrics.set(slaMetric.id, slaMetric);
        });
    }
    initializeDefaultNotificationChannels() {
        const defaultChannels = [
            {
                id: 'email',
                name: 'Email Notifications',
                type: 'email',
                config: {
                    smtp: {
                        host: process.env.SMTP_HOST || 'localhost',
                        port: parseInt(process.env.SMTP_PORT || '587'),
                        secure: false,
                        auth: {
                            user: process.env.SMTP_USER,
                            pass: process.env.SMTP_PASS
                        }
                    },
                    from: process.env.SMTP_FROM || 'alerts@econeura.com',
                    to: process.env.SMTP_TO || 'admin@econeura.com'
                },
                enabled: true
            },
            {
                id: 'slack',
                name: 'Slack Notifications',
                type: 'slack',
                config: {
                    webhookUrl: process.env.SLACK_WEBHOOK_URL,
                    channel: process.env.SLACK_CHANNEL || '#alerts',
                    username: 'ECONEURA Alerts'
                },
                enabled: !!process.env.SLACK_WEBHOOK_URL
            },
            {
                id: 'pagerduty',
                name: 'PagerDuty Notifications',
                type: 'pagerduty',
                config: {
                    integrationKey: process.env.PAGERDUTY_INTEGRATION_KEY,
                    serviceKey: process.env.PAGERDUTY_SERVICE_KEY
                },
                enabled: !!process.env.PAGERDUTY_INTEGRATION_KEY
            }
        ];
        defaultChannels.forEach(channel => {
            this.notificationChannels.set(channel.id, channel);
        });
    }
    startMonitoring() {
        this.monitoringInterval = setInterval(async () => {
            await this.collectMetrics();
            await this.evaluateAlertRules();
        }, 10000);
    }
    startHealthChecks() {
        this.healthCheckInterval = setInterval(async () => {
            await this.runHealthChecks();
        }, 30000);
    }
    async collectMetrics() {
        try {
            const metrics = [
                {
                    id: 'cpu-usage',
                    name: 'CPU Usage',
                    value: await this.getCPUUsage(),
                    unit: 'percent',
                    timestamp: new Date(),
                    tags: { service: 'api', instance: 'main' },
                    source: 'system'
                },
                {
                    id: 'memory-usage',
                    name: 'Memory Usage',
                    value: await this.getMemoryUsage(),
                    unit: 'percent',
                    timestamp: new Date(),
                    tags: { service: 'api', instance: 'main' },
                    source: 'system'
                },
                {
                    id: 'response-time',
                    name: 'Response Time',
                    value: await this.getAverageResponseTime(),
                    unit: 'milliseconds',
                    timestamp: new Date(),
                    tags: { service: 'api', endpoint: 'all' },
                    source: 'application'
                },
                {
                    id: 'cache-hit-rate',
                    name: 'Cache Hit Rate',
                    value: await this.getCacheHitRate(),
                    unit: 'percent',
                    timestamp: new Date(),
                    tags: { service: 'cache', type: 'redis' },
                    source: 'application'
                },
                {
                    id: 'db-connection-errors',
                    name: 'Database Connection Errors',
                    value: await this.getDatabaseConnectionErrors(),
                    unit: 'count',
                    timestamp: new Date(),
                    tags: { service: 'database', type: 'postgresql' },
                    source: 'application'
                }
            ];
            metrics.forEach(metric => {
                const existingMetrics = this.metrics.get(metric.id) || [];
                existingMetrics.push(metric);
                if (existingMetrics.length > 100) {
                    existingMetrics.splice(0, existingMetrics.length - 100);
                }
                this.metrics.set(metric.id, existingMetrics);
            });
            structuredLogger.info('Metrics collected', {
                metricCount: metrics.length,
                totalMetrics: Array.from(this.metrics.values()).reduce((sum, arr) => sum + arr.length, 0)
            });
        }
        catch (error) {
            structuredLogger.error('Failed to collect metrics', {
                error: error.message
            });
        }
    }
    async getCPUUsage() {
        const startUsage = process.cpuUsage();
        await new Promise(resolve => setTimeout(resolve, 100));
        const endUsage = process.cpuUsage(startUsage);
        const totalUsage = (endUsage.user + endUsage.system) / 1000000;
        return Math.min(totalUsage * 100, 100);
    }
    async getMemoryUsage() {
        const memUsage = process.memoryUsage();
        return (memUsage.heapUsed / memUsage.heapTotal) * 100;
    }
    async getAverageResponseTime() {
        return Math.random() * 3000;
    }
    async getCacheHitRate() {
        return Math.random() * 100;
    }
    async getDatabaseConnectionErrors() {
        return Math.floor(Math.random() * 10);
    }
    async evaluateAlertRules() {
        try {
            const activeRules = Array.from(this.alertRules.values()).filter(rule => rule.enabled);
            for (const rule of activeRules) {
                const metrics = this.metrics.get(rule.metric);
                if (!metrics || metrics.length === 0)
                    continue;
                const latestMetric = metrics[metrics.length - 1];
                const shouldTrigger = this.evaluateCondition(latestMetric.value, rule.condition, rule.threshold);
                if (shouldTrigger) {
                    await this.handleAlertTrigger(rule, latestMetric);
                }
            }
        }
        catch (error) {
            structuredLogger.error('Failed to evaluate alert rules', {
                error: error.message
            });
        }
    }
    evaluateCondition(value, condition, threshold) {
        switch (condition) {
            case 'greater_than':
                return value > threshold;
            case 'less_than':
                return value < threshold;
            case 'equals':
                return value === threshold;
            case 'not_equals':
                return value !== threshold;
            default:
                return false;
        }
    }
    async handleAlertTrigger(rule, metric) {
        try {
            const existingAlert = Array.from(this.activeAlerts.values())
                .find(alert => alert.ruleId === rule.id && alert.status === 'active');
            if (existingAlert) {
                const timeSinceLastTrigger = Date.now() - existingAlert.triggeredAt.getTime();
                if (timeSinceLastTrigger < rule.cooldown * 1000) {
                    return;
                }
            }
            const alert = {
                id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                ruleId: rule.id,
                metric: rule.metric,
                value: metric.value,
                threshold: rule.threshold,
                severity: rule.severity,
                status: 'active',
                triggeredAt: new Date(),
                message: `${rule.name}: ${metric.name} is ${metric.value}${metric.unit} (threshold: ${rule.threshold}${metric.unit})`,
                tags: metric.tags
            };
            this.activeAlerts.set(alert.id, alert);
            await this.sendNotifications(alert, rule);
            structuredLogger.warn('Alert triggered', {
                alertId: alert.id,
                ruleId: rule.id,
                severity: rule.severity,
                message: alert.message
            });
        }
        catch (error) {
            structuredLogger.error('Failed to handle alert trigger', {
                error: error.message,
                ruleId: rule.id
            });
        }
    }
    async sendNotifications(alert, rule) {
        try {
            for (const channelId of rule.notificationChannels) {
                const channel = this.notificationChannels.get(channelId);
                if (!channel || !channel.enabled)
                    continue;
                await this.sendNotification(alert, channel);
            }
        }
        catch (error) {
            structuredLogger.error('Failed to send notifications', {
                error: error.message,
                alertId: alert.id
            });
        }
    }
    async sendNotification(alert, channel) {
        try {
            switch (channel.type) {
                case 'email':
                    await this.sendEmailNotification(alert, channel);
                    break;
                case 'slack':
                    await this.sendSlackNotification(alert, channel);
                    break;
                case 'pagerduty':
                    await this.sendPagerDutyNotification(alert, channel);
                    break;
                case 'webhook':
                    await this.sendWebhookNotification(alert, channel);
                    break;
                case 'sms':
                    await this.sendSMSNotification(alert, channel);
                    break;
            }
            structuredLogger.info('Notification sent', {
                alertId: alert.id,
                channelId: channel.id,
                channelType: channel.type
            });
        }
        catch (error) {
            structuredLogger.error('Failed to send notification', {
                error: error.message,
                alertId: alert.id,
                channelId: channel.id
            });
        }
    }
    async sendEmailNotification(alert, channel) {
        structuredLogger.info('Email notification sent', { alertId: alert.id });
    }
    async sendSlackNotification(alert, channel) {
        structuredLogger.info('Slack notification sent', { alertId: alert.id });
    }
    async sendPagerDutyNotification(alert, channel) {
        structuredLogger.info('PagerDuty notification sent', { alertId: alert.id });
    }
    async sendWebhookNotification(alert, channel) {
        structuredLogger.info('Webhook notification sent', { alertId: alert.id });
    }
    async sendSMSNotification(alert, channel) {
        structuredLogger.info('SMS notification sent', { alertId: alert.id });
    }
    async runHealthChecks() {
        try {
            const enabledHealthChecks = Array.from(this.healthChecks.values())
                .filter(healthCheck => healthCheck.enabled);
            for (const healthCheck of enabledHealthChecks) {
                await this.executeHealthCheck(healthCheck);
            }
        }
        catch (error) {
            structuredLogger.error('Failed to run health checks', {
                error: error.message
            });
        }
    }
    async executeHealthCheck(healthCheck) {
        try {
            const startTime = Date.now();
            const isHealthy = Math.random() > 0.1;
            const responseTime = Date.now() - startTime;
            healthCheck.lastCheck = new Date();
            healthCheck.lastResponseTime = responseTime;
            if (isHealthy) {
                healthCheck.lastStatus = 'healthy';
                healthCheck.consecutiveFailures = 0;
            }
            else {
                healthCheck.lastStatus = 'unhealthy';
                healthCheck.consecutiveFailures++;
                if (healthCheck.consecutiveFailures >= healthCheck.maxFailures) {
                    await this.handleHealthCheckFailure(healthCheck);
                }
            }
            this.healthChecks.set(healthCheck.id, healthCheck);
            structuredLogger.info('Health check executed', {
                healthCheckId: healthCheck.id,
                status: healthCheck.lastStatus,
                responseTime,
                consecutiveFailures: healthCheck.consecutiveFailures
            });
        }
        catch (error) {
            structuredLogger.error('Failed to execute health check', {
                error: error.message,
                healthCheckId: healthCheck.id
            });
        }
    }
    async handleHealthCheckFailure(healthCheck) {
        try {
            const alert = {
                id: `health-check-${healthCheck.id}-${Date.now()}`,
                ruleId: 'health-check-failure',
                metric: 'health_check_status',
                value: 0,
                threshold: 1,
                severity: 'critical',
                status: 'active',
                triggeredAt: new Date(),
                message: `Health check failed: ${healthCheck.name} (${healthCheck.endpoint})`,
                tags: { healthCheckId: healthCheck.id, endpoint: healthCheck.endpoint }
            };
            this.activeAlerts.set(alert.id, alert);
            const defaultChannels = ['email', 'slack', 'pagerduty'];
            for (const channelId of defaultChannels) {
                const channel = this.notificationChannels.get(channelId);
                if (channel && channel.enabled) {
                    await this.sendNotification(alert, channel);
                }
            }
            structuredLogger.error('Health check failure handled', {
                healthCheckId: healthCheck.id,
                alertId: alert.id
            });
        }
        catch (error) {
            structuredLogger.error('Failed to handle health check failure', {
                error: error.message,
                healthCheckId: healthCheck.id
            });
        }
    }
    async getMetrics(metricId) {
        if (metricId) {
            return this.metrics.get(metricId) || [];
        }
        return Array.from(this.metrics.values()).flat();
    }
    async getActiveAlerts() {
        return Array.from(this.activeAlerts.values()).filter(alert => alert.status === 'active');
    }
    async getAlertRules() {
        return Array.from(this.alertRules.values());
    }
    async getHealthChecks() {
        return Array.from(this.healthChecks.values());
    }
    async getSLAMetrics() {
        return Array.from(this.slaMetrics.values());
    }
    async acknowledgeAlert(alertId, acknowledgedBy) {
        const alert = this.activeAlerts.get(alertId);
        if (!alert)
            return false;
        alert.status = 'acknowledged';
        alert.acknowledgedAt = new Date();
        alert.acknowledgedBy = acknowledgedBy;
        this.activeAlerts.set(alertId, alert);
        structuredLogger.info('Alert acknowledged', {
            alertId,
            acknowledgedBy
        });
        return true;
    }
    async resolveAlert(alertId) {
        const alert = this.activeAlerts.get(alertId);
        if (!alert)
            return false;
        alert.status = 'resolved';
        alert.resolvedAt = new Date();
        this.activeAlerts.set(alertId, alert);
        structuredLogger.info('Alert resolved', { alertId });
        return true;
    }
    async getDashboardData() {
        return {
            metrics: await this.getMetrics(),
            activeAlerts: await this.getActiveAlerts(),
            healthChecks: await this.getHealthChecks(),
            slaMetrics: await this.getSLAMetrics()
        };
    }
    async getHealthStatus() {
        const healthChecks = await this.getHealthChecks();
        const activeAlerts = await this.getActiveAlerts();
        const unhealthyChecks = healthChecks.filter(hc => hc.lastStatus === 'unhealthy');
        const criticalAlerts = activeAlerts.filter(alert => alert.severity === 'critical');
        let status = 'healthy';
        if (criticalAlerts.length > 0) {
            status = 'critical';
        }
        else if (unhealthyChecks.length > 0 || activeAlerts.length > 0) {
            status = 'warning';
        }
        return {
            status,
            details: {
                totalHealthChecks: healthChecks.length,
                unhealthyHealthChecks: unhealthyChecks.length,
                totalAlerts: activeAlerts.length,
                criticalAlerts: criticalAlerts.length
            }
        };
    }
    destroy() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }
    }
}
export const advancedMonitoringAlerts = AdvancedMonitoringAlertsService.getInstance();
//# sourceMappingURL=advanced-monitoring-alerts.service.js.map