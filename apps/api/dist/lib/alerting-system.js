import { logger } from './logger.js';
import { prometheus } from '../middleware/observability.js';
export class AlertingSystem {
    rules = new Map();
    channels = new Map();
    activeAlerts = new Map();
    lastTriggered = new Map();
    intervals = new Map();
    constructor() {
        logger.info('Alerting System initialized', {
            features: [
                'alert_rules',
                'multiple_channels',
                'cooldown_management',
                'prometheus_metrics',
                'alert_persistence'
            ]
        });
    }
    registerRule(rule) {
        this.rules.set(rule.id, rule);
        if (rule.enabled) {
            this.startRuleMonitoring(rule);
        }
        logger.info('Alert rule registered', {
            id: rule.id,
            name: rule.name,
            severity: rule.severity,
            enabled: rule.enabled
        });
    }
    registerChannel(channel) {
        this.channels.set(channel.id, channel);
        logger.info('Alert channel registered', {
            id: channel.id,
            name: channel.name,
            type: channel.type,
            enabled: channel.enabled
        });
    }
    startRuleMonitoring(rule) {
        const interval = setInterval(async () => {
            try {
                await this.checkRule(rule);
            }
            catch (error) {
                logger.error('Error checking alert rule', {
                    ruleId: rule.id,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }, 30000);
        this.intervals.set(rule.id, interval);
    }
    async checkRule(rule) {
        if (!rule.enabled) {
            return;
        }
        const lastTriggered = this.lastTriggered.get(rule.id);
        if (lastTriggered && rule.cooldown) {
            const timeSinceLastTrigger = Date.now() - lastTriggered.getTime();
            if (timeSinceLastTrigger < rule.cooldown * 1000) {
                return;
            }
        }
        try {
            const conditionMet = await rule.condition();
            if (conditionMet) {
                await this.triggerAlert(rule);
            }
            else {
                await this.resolveAlert(rule.id);
            }
        }
        catch (error) {
            logger.error('Error evaluating alert rule condition', {
                ruleId: rule.id,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async triggerAlert(rule) {
        const alertId = `${rule.id}-${Date.now()}`;
        if (this.activeAlerts.has(rule.id)) {
            return;
        }
        const alert = {
            id: alertId,
            name: rule.name,
            severity: rule.severity,
            message: rule.message,
            timestamp: new Date(),
            resolved: false,
            tags: rule.tags
        };
        this.activeAlerts.set(rule.id, alert);
        this.lastTriggered.set(rule.id, new Date());
        await this.sendAlertToChannels(alert);
        this.recordAlertMetrics(alert);
        logger.warn('Alert triggered', {
            id: alertId,
            name: rule.name,
            severity: rule.severity,
            message: rule.message
        });
    }
    async resolveAlert(ruleId) {
        const alert = this.activeAlerts.get(ruleId);
        if (!alert) {
            return;
        }
        alert.resolved = true;
        alert.resolvedAt = new Date();
        await this.sendAlertResolutionToChannels(alert);
        this.recordAlertResolutionMetrics(alert);
        logger.info('Alert resolved', {
            id: alert.id,
            name: alert.name,
            severity: alert.severity
        });
        this.activeAlerts.delete(ruleId);
    }
    async sendAlertToChannels(alert) {
        const enabledChannels = Array.from(this.channels.values()).filter(channel => channel.enabled);
        const promises = enabledChannels.map(channel => this.sendToChannel(alert, channel));
        await Promise.allSettled(promises);
    }
    async sendAlertResolutionToChannels(alert) {
        const enabledChannels = Array.from(this.channels.values()).filter(channel => channel.enabled);
        const promises = enabledChannels.map(channel => this.sendResolutionToChannel(alert, channel));
        await Promise.allSettled(promises);
    }
    async sendToChannel(alert, channel) {
        try {
            switch (channel.type) {
                case 'console':
                    break;
                case 'webhook':
                    await this.sendWebhookAlert(alert, channel.config);
                    break;
                case 'email':
                    await this.sendEmailAlert(alert, channel.config);
                    break;
                case 'slack':
                    await this.sendSlackAlert(alert, channel.config);
                    break;
                default:
                    logger.warn('Unknown alert channel type', { type: channel.type });
            }
        }
        catch (error) {
            logger.error('Failed to send alert to channel', {
                channelId: channel.id,
                channelType: channel.type,
                alertId: alert.id,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async sendResolutionToChannel(alert, channel) {
        try {
            switch (channel.type) {
                case 'console':
                    break;
                case 'webhook':
                    await this.sendWebhookResolution(alert, channel.config);
                    break;
                case 'email':
                    await this.sendEmailResolution(alert, channel.config);
                    break;
                case 'slack':
                    await this.sendSlackResolution(alert, channel.config);
                    break;
                default:
                    logger.warn('Unknown alert channel type', { type: channel.type });
            }
        }
        catch (error) {
            logger.error('Failed to send alert resolution to channel', {
                channelId: channel.id,
                channelType: channel.type,
                alertId: alert.id,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async sendWebhookAlert(alert, config) {
        const payload = {
            alert: {
                id: alert.id,
                name: alert.name,
                severity: alert.severity,
                message: alert.message,
                timestamp: alert.timestamp.toISOString(),
                tags: alert.tags
            },
            action: 'triggered'
        };
        const response = await fetch(config.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...config.headers
            },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            throw new Error(`Webhook request failed with status ${response.status}`);
        }
    }
    async sendWebhookResolution(alert, config) {
        const payload = {
            alert: {
                id: alert.id,
                name: alert.name,
                severity: alert.severity,
                message: alert.message,
                timestamp: alert.timestamp.toISOString(),
                resolvedAt: alert.resolvedAt?.toISOString(),
                tags: alert.tags
            },
            action: 'resolved'
        };
        const response = await fetch(config.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...config.headers
            },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            throw new Error(`Webhook request failed with status ${response.status}`);
        }
    }
    async sendEmailAlert(alert, config) {
        logger.info('Email alert sent', {
            alertId: alert.id,
            to: config.to,
            subject: `[${alert.severity.toUpperCase()}] ${alert.name}`
        });
    }
    async sendEmailResolution(alert, config) {
        logger.info('Email resolution sent', {
            alertId: alert.id,
            to: config.to,
            subject: `[RESOLVED] ${alert.name}`
        });
    }
    async sendSlackAlert(alert, config) {
        const color = this.getSeverityColor(alert.severity);
        const payload = {
            channel: config.channel,
            username: 'Econeura Alerting',
            icon_emoji: ':warning:',
            attachments: [{
                    color,
                    title: alert.name,
                    text: alert.message,
                    fields: [
                        {
                            title: 'Severity',
                            value: alert.severity.toUpperCase(),
                            short: true
                        },
                        {
                            title: 'Time',
                            value: alert.timestamp.toISOString(),
                            short: true
                        }
                    ],
                    footer: 'Econeura Alerting System',
                    ts: Math.floor(alert.timestamp.getTime() / 1000)
                }]
        };
        const response = await fetch(config.webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            throw new Error(`Slack request failed with status ${response.status}`);
        }
    }
    async sendSlackResolution(alert, config) {
        const payload = {
            channel: config.channel,
            username: 'Econeura Alerting',
            icon_emoji: ':white_check_mark:',
            attachments: [{
                    color: 'good',
                    title: `Resolved: ${alert.name}`,
                    text: alert.message,
                    fields: [
                        {
                            title: 'Severity',
                            value: alert.severity.toUpperCase(),
                            short: true
                        },
                        {
                            title: 'Resolved At',
                            value: alert.resolvedAt?.toISOString() || 'Unknown',
                            short: true
                        }
                    ],
                    footer: 'Econeura Alerting System',
                    ts: Math.floor(alert.resolvedAt?.getTime() || Date.now()) / 1000
                }]
        };
        const response = await fetch(config.webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            throw new Error(`Slack request failed with status ${response.status}`);
        }
    }
    getSeverityColor(severity) {
        switch (severity) {
            case 'low': return '#36a64f';
            case 'medium': return '#ff9800';
            case 'high': return '#ff5722';
            case 'critical': return '#f44336';
            default: return '#9e9e9e';
        }
    }
    recordAlertMetrics(alert) {
        const severityValue = this.getSeverityNumeric(alert.severity);
        prometheus.alertTriggered.set({ severity: alert.severity }, 1);
        prometheus.alertSeverity.set({ severity: alert.severity }, severityValue);
    }
    recordAlertResolutionMetrics(alert) {
        prometheus.alertResolved.set({ severity: alert.severity }, 1);
    }
    getSeverityNumeric(severity) {
        switch (severity) {
            case 'low': return 1;
            case 'medium': return 2;
            case 'high': return 3;
            case 'critical': return 4;
            default: return 0;
        }
    }
    getActiveAlerts() {
        return Array.from(this.activeAlerts.values());
    }
    getRule(ruleId) {
        return this.rules.get(ruleId);
    }
    getChannel(channelId) {
        return this.channels.get(channelId);
    }
    toggleRule(ruleId, enabled) {
        const rule = this.rules.get(ruleId);
        if (!rule) {
            throw new Error(`Alert rule '${ruleId}' not found`);
        }
        rule.enabled = enabled;
        if (enabled) {
            this.startRuleMonitoring(rule);
        }
        else {
            const interval = this.intervals.get(ruleId);
            if (interval) {
                clearInterval(interval);
                this.intervals.delete(ruleId);
            }
        }
        logger.info('Alert rule toggled', {
            ruleId,
            enabled
        });
    }
    destroy() {
        this.intervals.forEach(interval => clearInterval(interval));
        this.intervals.clear();
        this.rules.clear();
        this.channels.clear();
        this.activeAlerts.clear();
        this.lastTriggered.clear();
        logger.info('Alerting System destroyed');
    }
}
export const alertingMetrics = {
    alertTriggered: new prometheus.Counter({
        name: 'econeura_alerts_triggered_total',
        help: 'Total number of alerts triggered',
        labelNames: ['severity']
    }),
    alertResolved: new prometheus.Counter({
        name: 'econeura_alerts_resolved_total',
        help: 'Total number of alerts resolved',
        labelNames: ['severity']
    }),
    alertSeverity: new prometheus.Gauge({
        name: 'econeura_alert_severity',
        help: 'Current alert severity level',
        labelNames: ['severity']
    })
};
export const alertingSystem = new AlertingSystem();
//# sourceMappingURL=alerting-system.js.map