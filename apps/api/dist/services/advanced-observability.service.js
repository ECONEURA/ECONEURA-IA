import { structuredLogger } from '../lib/structured-logger.js';
export class AdvancedObservabilityService {
    logs = new Map();
    traces = new Map();
    alerts = new Map();
    alertRules = new Map();
    dashboards = new Map();
    metrics;
    constructor() {
        this.initializeDemoData();
        this.startMonitoring();
        structuredLogger.info('Advanced Observability Service initialized');
    }
    async getMetrics() {
        try {
            this.updateMetrics();
            structuredLogger.info('Observability metrics retrieved', {
                logs: this.metrics.logs,
                traces: this.metrics.traces,
                alerts: this.metrics.alerts
            });
            return this.metrics;
        }
        catch (error) {
            structuredLogger.error('Failed to get observability metrics', error);
            throw error;
        }
    }
    async getPerformanceAnalysis(service, timeRange) {
        try {
            const analysis = {
                service,
                timeRange,
                metrics: {
                    avgResponseTime: Math.random() * 500 + 100,
                    p95ResponseTime: Math.random() * 1000 + 200,
                    p99ResponseTime: Math.random() * 2000 + 500,
                    throughput: Math.random() * 1000 + 100,
                    errorRate: Math.random() * 5,
                    availability: 99.9 + Math.random() * 0.1
                },
                trends: {
                    responseTime: Math.random() > 0.5 ? 'improving' : 'degrading',
                    throughput: Math.random() > 0.5 ? 'increasing' : 'decreasing',
                    errorRate: Math.random() > 0.5 ? 'improving' : 'degrading'
                },
                recommendations: [
                    'Consider implementing caching for frequently accessed data',
                    'Monitor database connection pool usage',
                    'Review error patterns in the last 24 hours'
                ]
            };
            structuredLogger.info('Performance analysis generated', {
                service,
                timeRange,
                avgResponseTime: analysis.metrics.avgResponseTime
            });
            return analysis;
        }
        catch (error) {
            structuredLogger.error('Failed to generate performance analysis', error);
            throw error;
        }
    }
    async getLogs(filters = {}) {
        try {
            let logs = Array.from(this.logs.values());
            if (filters.level) {
                logs = logs.filter(log => log.level === filters.level);
            }
            if (filters.service) {
                logs = logs.filter(log => log.service === filters.service);
            }
            if (filters.startTime) {
                logs = logs.filter(log => log.timestamp >= filters.startTime);
            }
            if (filters.endTime) {
                logs = logs.filter(log => log.timestamp <= filters.endTime);
            }
            if (filters.limit) {
                logs = logs.slice(0, filters.limit);
            }
            logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
            structuredLogger.info('Logs retrieved', {
                filters,
                count: logs.length
            });
            return logs;
        }
        catch (error) {
            structuredLogger.error('Failed to get logs', error);
            throw error;
        }
    }
    async createLog(logData) {
        try {
            const log = {
                id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                timestamp: new Date(),
                ...logData
            };
            this.logs.set(log.id, log);
            structuredLogger.info('Log entry created', {
                logId: log.id,
                level: log.level,
                service: log.service
            });
            return log;
        }
        catch (error) {
            structuredLogger.error('Failed to create log entry', error);
            throw error;
        }
    }
    async getTraces(filters = {}) {
        try {
            let traces = Array.from(this.traces.values());
            if (filters.service) {
                traces = traces.filter(trace => trace.service === filters.service);
            }
            if (filters.operationName) {
                traces = traces.filter(trace => trace.operationName === filters.operationName);
            }
            if (filters.startTime) {
                traces = traces.filter(trace => trace.startTime >= filters.startTime);
            }
            if (filters.endTime) {
                traces = traces.filter(trace => trace.startTime <= filters.endTime);
            }
            if (filters.limit) {
                traces = traces.slice(0, filters.limit);
            }
            traces.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
            structuredLogger.info('Traces retrieved', {
                filters,
                count: traces.length
            });
            return traces;
        }
        catch (error) {
            structuredLogger.error('Failed to get traces', error);
            throw error;
        }
    }
    async createTrace(traceData) {
        try {
            const trace = {
                id: `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                startTime: new Date(),
                ...traceData
            };
            this.traces.set(trace.id, trace);
            structuredLogger.info('Trace span created', {
                traceId: trace.id,
                operationName: trace.operationName,
                service: trace.service
            });
            return trace;
        }
        catch (error) {
            structuredLogger.error('Failed to create trace span', error);
            throw error;
        }
    }
    async getAlertRules() {
        try {
            const rules = Array.from(this.alertRules.values());
            structuredLogger.info('Alert rules retrieved', {
                count: rules.length
            });
            return rules;
        }
        catch (error) {
            structuredLogger.error('Failed to get alert rules', error);
            throw error;
        }
    }
    async createAlertRule(ruleData) {
        try {
            const rule = {
                id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                ...ruleData
            };
            this.alertRules.set(rule.id, rule);
            structuredLogger.info('Alert rule created', {
                ruleId: rule.id,
                name: rule.name,
                severity: rule.severity
            });
            return rule;
        }
        catch (error) {
            structuredLogger.error('Failed to create alert rule', error);
            throw error;
        }
    }
    async getAlerts(filters = {}) {
        try {
            let alerts = Array.from(this.alerts.values());
            if (filters.status) {
                alerts = alerts.filter(alert => alert.status === filters.status);
            }
            if (filters.severity) {
                alerts = alerts.filter(alert => alert.severity === filters.severity);
            }
            if (filters.limit) {
                alerts = alerts.slice(0, filters.limit);
            }
            alerts.sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime());
            structuredLogger.info('Alerts retrieved', {
                filters,
                count: alerts.length
            });
            return alerts;
        }
        catch (error) {
            structuredLogger.error('Failed to get alerts', error);
            throw error;
        }
    }
    async getDashboards() {
        try {
            const dashboards = Array.from(this.dashboards.values());
            structuredLogger.info('Dashboards retrieved', {
                count: dashboards.length
            });
            return dashboards;
        }
        catch (error) {
            structuredLogger.error('Failed to get dashboards', error);
            throw error;
        }
    }
    async createDashboard(dashboardData) {
        try {
            const now = new Date();
            const dashboard = {
                id: `dashboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                createdAt: now,
                updatedAt: now,
                ...dashboardData
            };
            this.dashboards.set(dashboard.id, dashboard);
            structuredLogger.info('Dashboard created', {
                dashboardId: dashboard.id,
                name: dashboard.name,
                widgets: dashboard.widgets.length
            });
            return dashboard;
        }
        catch (error) {
            structuredLogger.error('Failed to create dashboard', error);
            throw error;
        }
    }
    initializeDemoData() {
        this.metrics = {
            logs: 15000,
            traces: 5000,
            metrics: 250,
            alerts: 3,
            errors: 45,
            warnings: 120,
            performance: {
                avgResponseTime: 150,
                p95ResponseTime: 300,
                p99ResponseTime: 500,
                throughput: 1000,
                errorRate: 0.5
            },
            system: {
                cpuUsage: 45,
                memoryUsage: 60,
                diskUsage: 30,
                networkLatency: 25
            }
        };
        const demoAlertRule = {
            id: 'demo-alert-rule',
            name: 'High Error Rate',
            description: 'Alert when error rate exceeds 5%',
            enabled: true,
            conditions: [
                {
                    metric: 'error_rate',
                    operator: 'gt',
                    threshold: 5,
                    timeWindow: 300
                }
            ],
            actions: [
                {
                    type: 'email',
                    target: 'admin@example.com',
                    template: 'error-rate-alert'
                }
            ],
            severity: 'high',
            cooldownMinutes: 15
        };
        this.alertRules.set(demoAlertRule.id, demoAlertRule);
        const demoDashboard = {
            id: 'demo-dashboard',
            name: 'System Overview',
            description: 'Main system monitoring dashboard',
            widgets: [
                {
                    id: 'widget-1',
                    type: 'metric',
                    title: 'Response Time',
                    position: { x: 0, y: 0, w: 6, h: 4 },
                    config: { metric: 'response_time', chartType: 'line' }
                },
                {
                    id: 'widget-2',
                    type: 'metric',
                    title: 'Error Rate',
                    position: { x: 6, y: 0, w: 6, h: 4 },
                    config: { metric: 'error_rate', chartType: 'gauge' }
                }
            ],
            refreshInterval: 30,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.dashboards.set(demoDashboard.id, demoDashboard);
    }
    startMonitoring() {
        setInterval(() => {
            this.updateMetrics();
        }, 30000);
        setInterval(() => {
            this.evaluateAlerts();
        }, 60000);
    }
    updateMetrics() {
        this.metrics.logs += Math.floor(Math.random() * 100);
        this.metrics.traces += Math.floor(Math.random() * 50);
        this.metrics.errors += Math.floor(Math.random() * 5);
        this.metrics.warnings += Math.floor(Math.random() * 10);
        this.metrics.performance.avgResponseTime += (Math.random() - 0.5) * 10;
        this.metrics.performance.throughput += (Math.random() - 0.5) * 50;
        this.metrics.performance.errorRate += (Math.random() - 0.5) * 0.1;
        this.metrics.system.cpuUsage += (Math.random() - 0.5) * 5;
        this.metrics.system.memoryUsage += (Math.random() - 0.5) * 3;
        this.metrics.system.networkLatency += (Math.random() - 0.5) * 2;
    }
    evaluateAlerts() {
        const rules = Array.from(this.alertRules.values());
        for (const rule of rules) {
            if (!rule.enabled)
                continue;
            if (Math.random() < 0.1) {
                this.triggerAlert(rule);
            }
        }
    }
    triggerAlert(rule) {
        const alert = {
            id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ruleId: rule.id,
            severity: rule.severity,
            message: `Alert triggered: ${rule.name}`,
            status: 'firing',
            triggeredAt: new Date(),
            metadata: {
                ruleName: rule.name,
                conditions: rule.conditions
            }
        };
        this.alerts.set(alert.id, alert);
        this.metrics.alerts++;
        structuredLogger.warn('Alert triggered', {
            alertId: alert.id,
            ruleId: rule.id,
            severity: alert.severity,
            message: alert.message
        });
    }
}
export const advancedObservability = new AdvancedObservabilityService();
//# sourceMappingURL=advanced-observability.service.js.map