import { structuredLogger } from './structured-logger.js';
import { metrics } from '@econeura/shared/src/metrics/index.js';
export var AlertSeverity;
(function (AlertSeverity) {
    AlertSeverity["INFO"] = "info";
    AlertSeverity["WARNING"] = "warning";
    AlertSeverity["ERROR"] = "error";
    AlertSeverity["CRITICAL"] = "critical";
})(AlertSeverity || (AlertSeverity = {}));
export var AlertStatus;
(function (AlertStatus) {
    AlertStatus["ACTIVE"] = "active";
    AlertStatus["ACKNOWLEDGED"] = "acknowledged";
    AlertStatus["RESOLVED"] = "resolved";
    AlertStatus["SUPPRESSED"] = "suppressed";
})(AlertStatus || (AlertStatus = {}));
export var NotificationChannel;
(function (NotificationChannel) {
    NotificationChannel["EMAIL"] = "email";
    NotificationChannel["SMS"] = "sms";
    NotificationChannel["SLACK"] = "slack";
    NotificationChannel["WEBHOOK"] = "webhook";
    NotificationChannel["IN_APP"] = "in_app";
})(NotificationChannel || (NotificationChannel = {}));
export class MonitoringAlertsService {
    static instance;
    alertRules = new Map();
    activeAlerts = new Map();
    alertHistory = [];
    notificationConfig;
    metricsBuffer = new Map();
    isMonitoring = false;
    monitoringInterval = null;
    constructor() {
        this.initializeDefaultRules();
        this.initializeNotificationConfig();
        this.startMonitoring();
    }
    static getInstance() {
        if (!MonitoringAlertsService.instance) {
            MonitoringAlertsService.instance = new MonitoringAlertsService();
        }
        return MonitoringAlertsService.instance;
    }
    initializeDefaultRules() {
        this.alertRules.set('high_api_latency', {
            id: 'high_api_latency',
            name: 'Alta Latencia de API',
            description: 'Latencia promedio de API superior a 1 segundo',
            metric: 'api_response_time',
            condition: {
                operator: 'gt',
                threshold: 1000,
                duration: 300,
                aggregation: 'avg'
            },
            severity: AlertSeverity.WARNING,
            enabled: true,
            cooldown: 600,
            escalation: {
                levels: [
                    {
                        level: 1,
                        delay: 0,
                        channels: [NotificationChannel.IN_APP],
                        recipients: ['dev-team'],
                        message: 'Alta latencia detectada en API'
                    },
                    {
                        level: 2,
                        delay: 1800,
                        channels: [NotificationChannel.SLACK, NotificationChannel.EMAIL],
                        recipients: ['dev-team', 'ops-team'],
                        message: 'Alta latencia persistente - requiere atención'
                    }
                ],
                maxEscalations: 2,
                escalationDelay: 1800
            },
            tags: ['api', 'performance'],
            organizationId: 'default'
        });
        this.alertRules.set('high_error_rate', {
            id: 'high_error_rate',
            name: 'Alta Tasa de Errores',
            description: 'Tasa de errores superior al 5%',
            metric: 'error_rate',
            condition: {
                operator: 'gt',
                threshold: 0.05,
                duration: 300,
                aggregation: 'avg'
            },
            severity: AlertSeverity.ERROR,
            enabled: true,
            cooldown: 300,
            escalation: {
                levels: [
                    {
                        level: 1,
                        delay: 0,
                        channels: [NotificationChannel.SLACK],
                        recipients: ['dev-team'],
                        message: 'Alta tasa de errores detectada'
                    },
                    {
                        level: 2,
                        delay: 900,
                        channels: [NotificationChannel.EMAIL, NotificationChannel.SMS],
                        recipients: ['dev-team', 'ops-team', 'on-call'],
                        message: 'CRÍTICO: Alta tasa de errores persistente'
                    }
                ],
                maxEscalations: 2,
                escalationDelay: 900
            },
            tags: ['errors', 'critical'],
            organizationId: 'default'
        });
        this.alertRules.set('high_memory_usage', {
            id: 'high_memory_usage',
            name: 'Alto Uso de Memoria',
            description: 'Uso de memoria superior al 85%',
            metric: 'memory_usage_percent',
            condition: {
                operator: 'gt',
                threshold: 85,
                duration: 600,
                aggregation: 'avg'
            },
            severity: AlertSeverity.WARNING,
            enabled: true,
            cooldown: 1800,
            escalation: {
                levels: [
                    {
                        level: 1,
                        delay: 0,
                        channels: [NotificationChannel.IN_APP],
                        recipients: ['ops-team'],
                        message: 'Alto uso de memoria detectado'
                    }
                ],
                maxEscalations: 1,
                escalationDelay: 3600
            },
            tags: ['memory', 'performance'],
            organizationId: 'default'
        });
        this.alertRules.set('service_down', {
            id: 'service_down',
            name: 'Servicio No Disponible',
            description: 'Servicio no responde a health checks',
            metric: 'service_availability',
            condition: {
                operator: 'eq',
                threshold: 0,
                duration: 60,
                aggregation: 'avg'
            },
            severity: AlertSeverity.CRITICAL,
            enabled: true,
            cooldown: 0,
            escalation: {
                levels: [
                    {
                        level: 1,
                        delay: 0,
                        channels: [NotificationChannel.SMS, NotificationChannel.SLACK],
                        recipients: ['on-call', 'ops-team'],
                        message: 'CRÍTICO: Servicio no disponible'
                    },
                    {
                        level: 2,
                        delay: 300,
                        channels: [NotificationChannel.EMAIL, NotificationChannel.WEBHOOK],
                        recipients: ['management', 'all-teams'],
                        message: 'EMERGENCIA: Servicio caído - acción inmediata requerida'
                    }
                ],
                maxEscalations: 2,
                escalationDelay: 300
            },
            tags: ['availability', 'critical'],
            organizationId: 'default'
        });
    }
    initializeNotificationConfig() {
        this.notificationConfig = {
            channels: [NotificationChannel.EMAIL, NotificationChannel.SLACK, NotificationChannel.IN_APP],
            recipients: {
                [NotificationChannel.EMAIL]: ['dev@econeura.com', 'ops@econeura.com'],
                [NotificationChannel.SLACK]: ['#alerts', '#dev-team'],
                [NotificationChannel.SMS]: ['+34600000000'],
                [NotificationChannel.WEBHOOK]: ['https://hooks.slack.com/services/...'],
                [NotificationChannel.IN_APP]: ['dashboard']
            },
            templates: {
                [AlertSeverity.INFO]: 'ℹ️ {title}: {message}',
                [AlertSeverity.WARNING]: '⚠️ {title}: {message}',
                [AlertSeverity.ERROR]: '❌ {title}: {message}',
                [AlertSeverity.CRITICAL]: '🚨 {title}: {message}'
            },
            rateLimit: {
                maxPerHour: 10,
                maxPerDay: 50
            }
        };
    }
    startMonitoring() {
        if (this.isMonitoring)
            return;
        this.isMonitoring = true;
        this.monitoringInterval = setInterval(() => {
            this.checkAlertRules();
        }, 30000);
        structuredLogger.info('Monitoring and alerts service started', {
            rules: this.alertRules.size,
            interval: '30 seconds'
        });
    }
    recordMetric(metricName, value, timestamp = Date.now()) {
        if (!this.metricsBuffer.has(metricName)) {
            this.metricsBuffer.set(metricName, []);
        }
        const buffer = this.metricsBuffer.get(metricName);
        buffer.push({ value, timestamp });
        const tenMinutesAgo = timestamp - 600000;
        const filteredBuffer = buffer.filter(item => item.timestamp > tenMinutesAgo);
        this.metricsBuffer.set(metricName, filteredBuffer);
        metrics.monitoringMetrics.inc({ metric: metricName });
    }
    async checkAlertRules() {
        for (const [ruleId, rule] of this.alertRules.entries()) {
            if (!rule.enabled)
                continue;
            try {
                const shouldTrigger = await this.evaluateRule(rule);
                if (shouldTrigger) {
                    await this.triggerAlert(rule);
                }
                else {
                    await this.resolveAlert(ruleId);
                }
            }
            catch (error) {
                structuredLogger.error('Error checking alert rule', {
                    ruleId,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }
    }
    async evaluateRule(rule) {
        const metricData = this.metricsBuffer.get(rule.metric);
        if (!metricData || metricData.length === 0) {
            return false;
        }
        const now = Date.now();
        const timeWindow = rule.condition.duration * 1000;
        const relevantData = metricData.filter(item => (now - item.timestamp) <= timeWindow);
        if (relevantData.length === 0) {
            return false;
        }
        const aggregatedValue = this.aggregateValues(relevantData, rule.condition.aggregation);
        return this.evaluateCondition(aggregatedValue, rule.condition);
    }
    aggregateValues(data, aggregation) {
        const values = data.map(item => item.value);
        switch (aggregation) {
            case 'avg':
                return values.reduce((sum, val) => sum + val, 0) / values.length;
            case 'sum':
                return values.reduce((sum, val) => sum + val, 0);
            case 'min':
                return Math.min(...values);
            case 'max':
                return Math.max(...values);
            case 'count':
                return values.length;
            default:
                return values[values.length - 1];
        }
    }
    evaluateCondition(value, condition) {
        switch (condition.operator) {
            case 'gt':
                return value > condition.threshold;
            case 'lt':
                return value < condition.threshold;
            case 'eq':
                return value === condition.threshold;
            case 'gte':
                return value >= condition.threshold;
            case 'lte':
                return value <= condition.threshold;
            case 'ne':
                return value !== condition.threshold;
            default:
                return false;
        }
    }
    async triggerAlert(rule) {
        const existingAlert = this.activeAlerts.get(rule.id);
        if (existingAlert && existingAlert.status === AlertStatus.ACTIVE) {
            const timeSinceLastTrigger = Date.now() - existingAlert.triggeredAt.getTime();
            if (timeSinceLastTrigger < rule.cooldown * 1000) {
                return;
            }
        }
        const alert = {
            id: `alert_${rule.id}_${Date.now()}`,
            ruleId: rule.id,
            title: rule.name,
            message: rule.description,
            severity: rule.severity,
            status: AlertStatus.ACTIVE,
            triggeredAt: new Date(),
            metadata: {
                rule: rule,
                metric: rule.metric,
                threshold: rule.condition.threshold
            },
            organizationId: rule.organizationId
        };
        this.activeAlerts.set(rule.id, alert);
        this.alertHistory.push(alert);
        await this.sendNotifications(alert, rule);
        metrics.alertTriggered.inc({
            rule: rule.id,
            severity: rule.severity,
            organization_id: rule.organizationId
        });
        structuredLogger.warn('Alert triggered', {
            alertId: alert.id,
            ruleId: rule.id,
            severity: rule.severity,
            title: rule.name
        });
    }
    async resolveAlert(ruleId) {
        const alert = this.activeAlerts.get(ruleId);
        if (!alert || alert.status !== AlertStatus.ACTIVE) {
            return;
        }
        alert.status = AlertStatus.RESOLVED;
        alert.resolvedAt = new Date();
        alert.resolvedBy = 'system';
        this.activeAlerts.delete(ruleId);
        await this.sendResolutionNotification(alert);
        metrics.alertResolved.inc({
            rule: ruleId,
            severity: alert.severity,
            organization_id: alert.organizationId
        });
        structuredLogger.info('Alert resolved', {
            alertId: alert.id,
            ruleId: ruleId,
            duration: Date.now() - alert.triggeredAt.getTime()
        });
    }
    async sendNotifications(alert, rule) {
        const escalationLevel = rule.escalation.levels[0];
        const template = this.notificationConfig.templates[alert.severity];
        const message = template
            .replace('{title}', alert.title)
            .replace('{message}', alert.message);
        for (const channel of escalationLevel.channels) {
            try {
                await this.sendNotification(channel, message, escalationLevel.recipients, alert);
            }
            catch (error) {
                structuredLogger.error('Failed to send notification', {
                    channel,
                    alertId: alert.id,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }
    }
    async sendNotification(channel, message, recipients, alert) {
        switch (channel) {
            case NotificationChannel.EMAIL:
                await this.sendEmail(recipients, message, alert);
                break;
            case NotificationChannel.SLACK:
                await this.sendSlack(recipients, message, alert);
                break;
            case NotificationChannel.SMS:
                await this.sendSMS(recipients, message, alert);
                break;
            case NotificationChannel.WEBHOOK:
                await this.sendWebhook(recipients, message, alert);
                break;
            case NotificationChannel.IN_APP:
                await this.sendInApp(recipients, message, alert);
                break;
        }
        metrics.notificationsSent.inc({
            channel,
            severity: alert.severity,
            organization_id: alert.organizationId
        });
    }
    async sendEmail(recipients, message, alert) {
        structuredLogger.info('Email notification sent', {
            recipients,
            alertId: alert.id,
            subject: alert.title
        });
    }
    async sendSlack(recipients, message, alert) {
        structuredLogger.info('Slack notification sent', {
            recipients,
            alertId: alert.id,
            message
        });
    }
    async sendSMS(recipients, message, alert) {
        structuredLogger.info('SMS notification sent', {
            recipients,
            alertId: alert.id
        });
    }
    async sendWebhook(recipients, message, alert) {
        structuredLogger.info('Webhook notification sent', {
            recipients,
            alertId: alert.id
        });
    }
    async sendInApp(recipients, message, alert) {
        structuredLogger.info('In-app notification sent', {
            recipients,
            alertId: alert.id
        });
    }
    async sendResolutionNotification(alert) {
        const message = `✅ Resuelto: ${alert.title}`;
        await this.sendNotification(NotificationChannel.IN_APP, message, ['dashboard'], alert);
    }
    getMonitoringStats() {
        const totalAlerts = this.alertHistory.length;
        const activeAlerts = this.activeAlerts.size;
        const alertsBySeverity = {
            [AlertSeverity.INFO]: 0,
            [AlertSeverity.WARNING]: 0,
            [AlertSeverity.ERROR]: 0,
            [AlertSeverity.CRITICAL]: 0
        };
        const alertsByStatus = {
            [AlertStatus.ACTIVE]: 0,
            [AlertStatus.ACKNOWLEDGED]: 0,
            [AlertStatus.RESOLVED]: 0,
            [AlertStatus.SUPPRESSED]: 0
        };
        for (const alert of this.alertHistory) {
            alertsBySeverity[alert.severity]++;
            alertsByStatus[alert.status]++;
        }
        return {
            totalAlerts,
            activeAlerts,
            alertsBySeverity,
            alertsByStatus,
            averageResolutionTime: 0,
            escalationRate: 0,
            falsePositiveRate: 0
        };
    }
    stop() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        this.isMonitoring = false;
        structuredLogger.info('Monitoring and alerts service stopped');
    }
}
export const monitoringAlertsService = MonitoringAlertsService.getInstance();
//# sourceMappingURL=monitoring-alerts.service.js.map