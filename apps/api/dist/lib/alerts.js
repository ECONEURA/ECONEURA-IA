class IntelligentAlertSystem {
    rules = new Map();
    alerts = new Map();
    notifications = new Map();
    alertHistory = new Map();
    MAX_ALERTS = 1000;
    MAX_NOTIFICATIONS = 1000;
    constructor() {
        this.initializeDefaultRules();
    }
    initializeDefaultRules() {
        this.addRule({
            id: 'error-rate-high',
            name: 'High Error Rate',
            description: 'Error rate exceeds 5%',
            metric: 'error_rate',
            condition: 'threshold',
            threshold: 5,
            operator: 'gt',
            window: 300,
            severity: 'high',
            enabled: true,
            cooldown: 300
        });
        this.addRule({
            id: 'api-latency-high',
            name: 'High API Latency',
            description: 'API response time exceeds 2 seconds',
            metric: 'http_request_duration_ms',
            condition: 'threshold',
            threshold: 2000,
            operator: 'gt',
            window: 300,
            severity: 'medium',
            enabled: true,
            cooldown: 300
        });
        this.addRule({
            id: 'ai-cost-high',
            name: 'High AI Cost',
            description: 'AI cost exceeds €10 in the last hour',
            metric: 'ai_cost_total',
            condition: 'threshold',
            threshold: 10,
            operator: 'gt',
            window: 3600,
            severity: 'medium',
            enabled: true,
            cooldown: 1800
        });
        this.addRule({
            id: 'memory-usage-high',
            name: 'High Memory Usage',
            description: 'Memory usage exceeds 80%',
            metric: 'memory_usage_bytes',
            condition: 'threshold',
            threshold: 0.8,
            operator: 'gt',
            window: 60,
            severity: 'high',
            enabled: true,
            cooldown: 300
        });
        this.addRule({
            id: 'health-check-failing',
            name: 'Health Check Failing',
            description: 'Health checks are failing',
            metric: 'health_check_total',
            condition: 'threshold',
            threshold: 0,
            operator: 'eq',
            window: 60,
            severity: 'critical',
            enabled: true,
            cooldown: 60
        });
    }
    addRule(rule) {
        this.validateRule(rule);
        this.rules.set(rule.id, rule);
    }
    validateRule(rule) {
        if (!rule.id || !rule.name || !rule.description) {
            throw new Error('Rule must have id, name, and description');
        }
        if (!rule.metric) {
            throw new Error('Rule must specify a metric');
        }
        if (!['threshold', 'anomaly', 'trend'].includes(rule.condition)) {
            throw new Error('Rule condition must be threshold, anomaly, or trend');
        }
        if (!['gt', 'lt', 'gte', 'lte', 'eq', 'ne'].includes(rule.operator)) {
            throw new Error('Rule operator must be gt, lt, gte, lte, eq, or ne');
        }
        if (!['low', 'medium', 'high', 'critical'].includes(rule.severity)) {
            throw new Error('Rule severity must be low, medium, high, or critical');
        }
        if (rule.window <= 0) {
            throw new Error('Rule window must be greater than 0');
        }
        if (rule.cooldown < 0) {
            throw new Error('Rule cooldown must be non-negative');
        }
        if (rule.condition === 'threshold' && rule.threshold === undefined) {
            throw new Error('Threshold condition requires a threshold value');
        }
    }
    removeRule(ruleId) {
        return this.rules.delete(ruleId);
    }
    getRule(ruleId) {
        return this.rules.get(ruleId);
    }
    getAllRules() {
        return Array.from(this.rules.values());
    }
    evaluateMetrics(metrics) {
        const newAlerts = [];
        for (const rule of this.rules.values()) {
            if (!rule.enabled)
                continue;
            const metricValue = this.getMetricValue(metrics, rule.metric);
            if (metricValue === null)
                continue;
            const shouldAlert = this.evaluateCondition(rule, metricValue);
            if (shouldAlert && this.shouldCreateAlert(rule.id)) {
                const alert = this.createAlert(rule, metricValue);
                newAlerts.push(alert);
                this.alerts.set(alert.id, alert);
                this.createNotification(alert);
            }
        }
        this.cleanupOldAlerts();
        return newAlerts;
    }
    getMetricValue(metrics, metricName) {
        const metric = metrics[metricName];
        if (!metric)
            return null;
        if (metric.latest !== undefined) {
            return metric.latest;
        }
        if (metric.value !== undefined) {
            return metric.value;
        }
        if (metric.average !== undefined) {
            return metric.average;
        }
        return null;
    }
    evaluateCondition(rule, value) {
        switch (rule.condition) {
            case 'threshold':
                return this.evaluateThreshold(rule, value);
            case 'anomaly':
                return this.evaluateAnomaly(rule, value);
            case 'trend':
                return this.evaluateTrend(rule, value);
            default:
                return false;
        }
    }
    evaluateThreshold(rule, value) {
        const threshold = rule.threshold || 0;
        switch (rule.operator) {
            case 'gt': return value > threshold;
            case 'lt': return value < threshold;
            case 'gte': return value >= threshold;
            case 'lte': return value <= threshold;
            case 'eq': return value === threshold;
            case 'ne': return value !== threshold;
            default: return false;
        }
    }
    evaluateAnomaly(rule, value) {
        const threshold = rule.threshold || 0;
        const deviation = Math.abs(value - threshold) / threshold;
        return deviation > 0.5;
    }
    evaluateTrend(rule, value) {
        const threshold = rule.threshold || 0;
        return value > threshold * 1.2;
    }
    shouldCreateAlert(ruleId) {
        const now = Date.now();
        const alert = this.alertHistory.get(ruleId);
        const rule = this.rules.get(ruleId);
        if (!rule)
            return false;
        if (!alert) {
            this.alertHistory.set(ruleId, { count: 1, lastAlert: now });
            return true;
        }
        if (now - alert.lastAlert < rule.cooldown * 1000) {
            return false;
        }
        this.alertHistory.set(ruleId, { count: alert.count + 1, lastAlert: now });
        return true;
    }
    createAlert(rule, value) {
        const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        return {
            id: alertId,
            ruleId: rule.id,
            name: rule.name,
            description: rule.description,
            severity: rule.severity,
            status: 'active',
            metric: rule.metric,
            value,
            threshold: rule.threshold || 0,
            timestamp: new Date().toISOString(),
            labels: rule.labels,
            context: {
                rule: rule.id,
                condition: rule.condition,
                operator: rule.operator,
                window: rule.window
            }
        };
    }
    createNotification(alert) {
        const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const notification = {
            id: notificationId,
            alertId: alert.id,
            type: 'webhook',
            status: 'pending',
            timestamp: new Date().toISOString(),
            retryCount: 0,
            maxRetries: 3,
            payload: {
                alert: alert,
                rule: this.rules.get(alert.ruleId),
                timestamp: new Date().toISOString()
            }
        };
        this.notifications.set(notificationId, notification);
        this.processNotification(notification);
    }
    async processNotification(notification) {
        try {
            await this.sendNotification(notification);
            notification.status = 'sent';
        }
        catch (error) {
            notification.status = 'failed';
            notification.retryCount++;
            if (notification.retryCount < notification.maxRetries) {
                setTimeout(() => {
                    this.processNotification(notification);
                }, 5000 * notification.retryCount);
            }
        }
    }
    async sendNotification(notification) {
        const alert = this.alerts.get(notification.alertId);
        if (!alert)
            return;
        const message = `🚨 ALERT: ${alert.name}\n` +
            `Severity: ${alert.severity.toUpperCase()}\n` +
            `Metric: ${alert.metric} = ${alert.value}\n` +
            `Threshold: ${alert.threshold}\n` +
            `Time: ${alert.timestamp}\n` +
            `Description: ${alert.description}`;
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    getAlert(alertId) {
        return this.alerts.get(alertId);
    }
    getActiveAlerts() {
        return Array.from(this.alerts.values()).filter(alert => alert.status === 'active');
    }
    getAlertsBySeverity(severity) {
        return Array.from(this.alerts.values()).filter(alert => alert.severity === severity);
    }
    acknowledgeAlert(alertId, acknowledgedBy) {
        const alert = this.alerts.get(alertId);
        if (!alert)
            return false;
        alert.status = 'acknowledged';
        alert.acknowledgedAt = new Date().toISOString();
        alert.acknowledgedBy = acknowledgedBy;
        return true;
    }
    resolveAlert(alertId) {
        const alert = this.alerts.get(alertId);
        if (!alert)
            return false;
        alert.status = 'resolved';
        alert.resolvedAt = new Date().toISOString();
        return true;
    }
    getAlertStats() {
        const alerts = Array.from(this.alerts.values());
        const activeAlerts = alerts.filter(a => a.status === 'active');
        const resolvedAlerts = alerts.filter(a => a.status === 'resolved');
        const acknowledgedAlerts = alerts.filter(a => a.status === 'acknowledged');
        return {
            total: alerts.length,
            active: activeAlerts.length,
            resolved: resolvedAlerts.length,
            acknowledged: acknowledgedAlerts.length,
            bySeverity: {
                low: alerts.filter(a => a.severity === 'low').length,
                medium: alerts.filter(a => a.severity === 'medium').length,
                high: alerts.filter(a => a.severity === 'high').length,
                critical: alerts.filter(a => a.severity === 'critical').length
            },
            byStatus: {
                active: activeAlerts.length,
                resolved: resolvedAlerts.length,
                acknowledged: acknowledgedAlerts.length
            }
        };
    }
    getNotificationStats() {
        const notifications = Array.from(this.notifications.values());
        return {
            total: notifications.length,
            pending: notifications.filter(n => n.status === 'pending').length,
            sent: notifications.filter(n => n.status === 'sent').length,
            failed: notifications.filter(n => n.status === 'failed').length,
            byType: {
                email: notifications.filter(n => n.type === 'email').length,
                slack: notifications.filter(n => n.type === 'slack').length,
                webhook: notifications.filter(n => n.type === 'webhook').length,
                sms: notifications.filter(n => n.type === 'sms').length
            }
        };
    }
    cleanupOldAlerts() {
        const cutoff = Date.now() - (24 * 60 * 60 * 1000);
        for (const [alertId, alert] of this.alerts) {
            const alertTime = new Date(alert.timestamp).getTime();
            if (alertTime < cutoff && alert.status !== 'active') {
                this.alerts.delete(alertId);
            }
        }
        for (const [notificationId, notification] of this.notifications) {
            const notificationTime = new Date(notification.timestamp).getTime();
            if (notificationTime < cutoff) {
                this.notifications.delete(notificationId);
            }
        }
    }
    evaluateMetricsRealtime(metrics) {
        return this.evaluateMetrics(metrics);
    }
    updateRule(ruleId, updates) {
        const rule = this.rules.get(ruleId);
        if (!rule)
            return false;
        this.rules.set(ruleId, { ...rule, ...updates });
        return true;
    }
}
export const alertSystem = new IntelligentAlertSystem();
//# sourceMappingURL=alerts.js.map