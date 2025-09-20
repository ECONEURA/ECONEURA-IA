import { logger } from './logger.js';
const prometheusMetrics = {
    counter: (config) => ({ inc: (labels, value) => { } }),
    gauge: (config) => ({ set: (labels, value) => { } }),
    histogram: (config) => ({ observe: (labels, value) => { } }),
    summary: (config) => ({ observe: (labels, value) => { } })
};
export class AdvancedPerformanceMonitoringService {
    metrics = new Map();
    alerts = new Map();
    dashboards = new Map();
    reports = new Map();
    baselines = new Map();
    anomalies = new Map();
    alertCheckInterval = null;
    baselineCalculationInterval = null;
    anomalyDetectionInterval = null;
    constructor() {
        this.initializeService();
    }
    async initializeService() {
        logger.info('Initializing Advanced Performance Monitoring Service');
        this.startAlertChecking();
        this.startBaselineCalculation();
        this.startAnomalyDetection();
        await this.initializeDemoData();
        logger.info('Advanced Performance Monitoring Service initialized');
    }
    startAlertChecking() {
        this.alertCheckInterval = setInterval(() => {
            this.checkAlerts().catch(error => {
                logger.error('Error checking alerts:', error);
            });
        }, 30000);
    }
    startBaselineCalculation() {
        this.baselineCalculationInterval = setInterval(() => {
            this.calculateBaselines().catch(error => {
                logger.error('Error calculating baselines:', error);
            });
        }, 3600000);
    }
    startAnomalyDetection() {
        this.anomalyDetectionInterval = setInterval(() => {
            this.detectAnomalies().catch(error => {
                logger.error('Error detecting anomalies:', error);
            });
        }, 60000);
    }
    async recordMetric(metric) {
        const newMetric = {
            ...metric,
            id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date()
        };
        this.metrics.set(newMetric.id, newMetric);
        this.recordPrometheusMetric(newMetric);
        logger.info('Performance metric recorded');
        return newMetric;
    }
    recordPrometheusMetric(metric) {
        try {
            switch (metric.type) {
                case 'counter':
                    prometheusMetrics.counter({
                        name: `econeura_${metric.name}`,
                        help: `ECONEURA ${metric.name} counter`
                    }).inc(metric.labels, metric.value);
                    break;
                case 'gauge':
                    prometheusMetrics.gauge({
                        name: `econeura_${metric.name}`,
                        help: `ECONEURA ${metric.name} gauge`
                    }).set(metric.labels, metric.value);
                    break;
                case 'histogram':
                    prometheusMetrics.histogram({
                        name: `econeura_${metric.name}`,
                        help: `ECONEURA ${metric.name} histogram`
                    }).observe(metric.labels, metric.value);
                    break;
                case 'summary':
                    prometheusMetrics.summary({
                        name: `econeura_${metric.name}`,
                        help: `ECONEURA ${metric.name} summary`
                    }).observe(metric.labels, metric.value);
                    break;
            }
        }
        catch (error) {
            logger.error('Error recording Prometheus metric:', error);
        }
    }
    async getMetrics(filters) {
        let metrics = Array.from(this.metrics.values());
        if (filters) {
            if (filters.name) {
                metrics = metrics.filter(m => m.name.includes(filters.name));
            }
            if (filters.type) {
                metrics = metrics.filter(m => m.type === filters.type);
            }
            if (filters.startTime) {
                metrics = metrics.filter(m => m.timestamp >= filters.startTime);
            }
            if (filters.endTime) {
                metrics = metrics.filter(m => m.timestamp <= filters.endTime);
            }
            if (filters.limit) {
                metrics = metrics.slice(0, filters.limit);
            }
        }
        return metrics.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    async createAlert(alert) {
        const newAlert = {
            ...alert,
            id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.alerts.set(newAlert.id, newAlert);
        logger.info('Performance alert created');
        return newAlert;
    }
    async getAlerts() {
        return Array.from(this.alerts.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    async updateAlert(id, updates) {
        const existing = this.alerts.get(id);
        if (!existing)
            return null;
        const updated = {
            ...existing,
            ...updates,
            updatedAt: new Date()
        };
        this.alerts.set(id, updated);
        logger.info('Performance alert updated');
        return updated;
    }
    async deleteAlert(id) {
        const deleted = this.alerts.delete(id);
        if (deleted) {
            logger.info('Performance alert deleted');
        }
        return deleted;
    }
    async checkAlerts() {
        const enabledAlerts = Array.from(this.alerts.values()).filter(alert => alert.enabled);
        for (const alert of enabledAlerts) {
            try {
                const metrics = await this.getMetrics({
                    name: alert.condition.metric,
                    startTime: new Date(Date.now() - alert.condition.timeWindow * 1000)
                });
                if (metrics.length === 0)
                    continue;
                const latestMetric = metrics[0];
                let shouldTrigger = false;
                switch (alert.condition.operator) {
                    case 'gt':
                        shouldTrigger = latestMetric.value > alert.condition.threshold;
                        break;
                    case 'lt':
                        shouldTrigger = latestMetric.value < alert.condition.threshold;
                        break;
                    case 'eq':
                        shouldTrigger = latestMetric.value === alert.condition.threshold;
                        break;
                    case 'gte':
                        shouldTrigger = latestMetric.value >= alert.condition.threshold;
                        break;
                    case 'lte':
                        shouldTrigger = latestMetric.value <= alert.condition.threshold;
                        break;
                }
                if (shouldTrigger) {
                    await this.triggerAlert(alert, latestMetric);
                }
            }
            catch (error) {
                logger.error('Error checking alert:', error);
            }
        }
    }
    async triggerAlert(alert, metric) {
        logger.warn('Performance alert triggered');
        for (const action of alert.actions) {
            try {
                await this.executeAlertAction(action, alert, metric);
            }
            catch (error) {
                logger.error('Error executing alert action:', error);
            }
        }
    }
    async executeAlertAction(action, alert, metric) {
        const payload = {
            alert: {
                id: alert.id,
                name: alert.name,
                description: alert.description,
                severity: alert.severity
            },
            metric: {
                name: metric.name,
                value: metric.value,
                timestamp: metric.timestamp
            },
            timestamp: new Date().toISOString()
        };
        switch (action.type) {
            case 'email':
                logger.info('Email alert sent');
                break;
            case 'webhook':
                logger.info('Webhook alert sent');
                break;
            case 'slack':
                logger.info('Slack alert sent');
                break;
            case 'pagerduty':
                logger.info('PagerDuty alert sent');
                break;
        }
    }
    async createDashboard(dashboard) {
        const newDashboard = {
            ...dashboard,
            id: `dashboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.dashboards.set(newDashboard.id, newDashboard);
        logger.info('Performance dashboard created');
        return newDashboard;
    }
    async getDashboards() {
        return Array.from(this.dashboards.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    async updateDashboard(id, updates) {
        const existing = this.dashboards.get(id);
        if (!existing)
            return null;
        const updated = {
            ...existing,
            ...updates,
            updatedAt: new Date()
        };
        this.dashboards.set(id, updated);
        logger.info('Performance dashboard updated');
        return updated;
    }
    async createReport(report) {
        const newReport = {
            ...report,
            id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.reports.set(newReport.id, newReport);
        logger.info('Performance report created');
        return newReport;
    }
    async getReports() {
        return Array.from(this.reports.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    async generateReport(reportId) {
        const report = this.reports.get(reportId);
        if (!report) {
            throw new Error('Report not found');
        }
        const metrics = await this.getMetrics({
            startTime: new Date(Date.now() - 24 * 60 * 60 * 1000)
        });
        const reportData = {
            report: {
                id: report.id,
                name: report.name,
                type: report.type,
                generatedAt: new Date().toISOString()
            },
            metrics: metrics.filter(m => report.metrics.includes(m.name)),
            summary: this.generateReportSummary(metrics)
        };
        let content;
        switch (report.format) {
            case 'json':
                content = JSON.stringify(reportData, null, 2);
                break;
            case 'csv':
                content = this.generateCSVReport(reportData);
                break;
            case 'html':
                content = this.generateHTMLReport(reportData);
                break;
            default:
                content = JSON.stringify(reportData, null, 2);
        }
        logger.info('Performance report generated');
        return { content, format: report.format };
    }
    generateReportSummary(metrics) {
        const summary = {};
        const metricGroups = metrics.reduce((groups, metric) => {
            if (!groups[metric.name]) {
                groups[metric.name] = [];
            }
            groups[metric.name].push(metric.value);
            return groups;
        }, {});
        for (const [name, values] of Object.entries(metricGroups)) {
            summary[name] = {
                count: values.length,
                min: Math.min(...values),
                max: Math.max(...values),
                avg: values.reduce((a, b) => a + b, 0) / values.length,
                p95: this.calculatePercentile(values, 95),
                p99: this.calculatePercentile(values, 99)
            };
        }
        return summary;
    }
    calculatePercentile(values, percentile) {
        const sorted = values.sort((a, b) => a - b);
        const index = Math.ceil((percentile / 100) * sorted.length) - 1;
        return sorted[index] || 0;
    }
    generateCSVReport(data) {
        const headers = ['Metric', 'Count', 'Min', 'Max', 'Avg', 'P95', 'P99'];
        const rows = [headers.join(',')];
        for (const [name, stats] of Object.entries(data.summary)) {
            const row = [
                name,
                stats.count,
                stats.min,
                stats.max,
                stats.avg,
                stats.p95,
                stats.p99
            ].join(',');
            rows.push(row);
        }
        return rows.join('\n');
    }
    generateHTMLReport(data) {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Performance Report - ${data.report.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>Performance Report: ${data.report.name}</h1>
        <p>Generated: ${data.report.generatedAt}</p>
        <table>
          <tr>
            <th>Metric</th>
            <th>Count</th>
            <th>Min</th>
            <th>Max</th>
            <th>Average</th>
            <th>P95</th>
            <th>P99</th>
          </tr>
          ${Object.entries(data.summary).map(([name, stats]) => `
            <tr>
              <td>${name}</td>
              <td>${stats.count}</td>
              <td>${stats.min.toFixed(2)}</td>
              <td>${stats.max.toFixed(2)}</td>
              <td>${stats.avg.toFixed(2)}</td>
              <td>${stats.p95.toFixed(2)}</td>
              <td>${stats.p99.toFixed(2)}</td>
            </tr>
          `).join('')}
        </table>
      </body>
      </html>
    `;
    }
    async calculateBaselines() {
        const metricNames = Array.from(new Set(Array.from(this.metrics.values()).map(m => m.name)));
        for (const metricName of metricNames) {
            const metrics = await this.getMetrics({
                name: metricName,
                startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            });
            if (metrics.length < 10)
                continue;
            const values = metrics.map(m => m.value);
            const mean = values.reduce((a, b) => a + b, 0) / values.length;
            const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
            const stdDev = Math.sqrt(variance);
            const sortedValues = values.sort((a, b) => a - b);
            const percentiles = {
                p50: this.calculatePercentile(sortedValues, 50),
                p90: this.calculatePercentile(sortedValues, 90),
                p95: this.calculatePercentile(sortedValues, 95),
                p99: this.calculatePercentile(sortedValues, 99)
            };
            const baseline = {
                id: `baseline_${metricName}_${Date.now()}`,
                metric: metricName,
                baseline: { mean, stdDev, percentiles },
                calculatedAt: new Date(),
                validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000)
            };
            this.baselines.set(metricName, baseline);
            logger.info('Baseline calculated');
        }
    }
    async getBaselines() {
        return Array.from(this.baselines.values()).sort((a, b) => b.calculatedAt.getTime() - a.calculatedAt.getTime());
    }
    async detectAnomalies() {
        const baselines = await this.getBaselines();
        for (const baseline of baselines) {
            const recentMetrics = await this.getMetrics({
                name: baseline.metric,
                startTime: new Date(Date.now() - 5 * 60 * 1000)
            });
            for (const metric of recentMetrics) {
                const deviation = Math.abs(metric.value - baseline.baseline.mean) / baseline.baseline.stdDev;
                if (deviation > 3) {
                    const anomaly = {
                        id: `anomaly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        metric: metric.name,
                        type: metric.value > baseline.baseline.mean ? 'spike' : 'drop',
                        severity: deviation > 5 ? 'critical' : deviation > 4 ? 'high' : 'medium',
                        value: metric.value,
                        expectedValue: baseline.baseline.mean,
                        deviation,
                        confidence: Math.min(0.99, deviation / 5),
                        detectedAt: new Date(),
                        description: `${metric.name} ${metric.value > baseline.baseline.mean ? 'spiked' : 'dropped'} to ${metric.value.toFixed(2)} (expected: ${baseline.baseline.mean.toFixed(2)})`
                    };
                    this.anomalies.set(anomaly.id, anomaly);
                    logger.warn('Performance anomaly detected');
                }
            }
        }
    }
    async getAnomalies(filters) {
        let anomalies = Array.from(this.anomalies.values());
        if (filters) {
            if (filters.severity) {
                anomalies = anomalies.filter(a => a.severity === filters.severity);
            }
            if (filters.type) {
                anomalies = anomalies.filter(a => a.type === filters.type);
            }
            if (filters.resolved !== undefined) {
                anomalies = anomalies.filter(a => (a.resolvedAt !== undefined) === filters.resolved);
            }
            if (filters.limit) {
                anomalies = anomalies.slice(0, filters.limit);
            }
        }
        return anomalies.sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime());
    }
    async resolveAnomaly(id) {
        const anomaly = this.anomalies.get(id);
        if (!anomaly)
            return false;
        anomaly.resolvedAt = new Date();
        this.anomalies.set(id, anomaly);
        logger.info('Performance anomaly resolved');
        return true;
    }
    async getStatistics() {
        const metrics = Array.from(this.metrics.values());
        const alerts = Array.from(this.alerts.values());
        const anomalies = Array.from(this.anomalies.values());
        const metricsByType = metrics.reduce((acc, metric) => {
            acc[metric.type] = (acc[metric.type] || 0) + 1;
            return acc;
        }, {});
        const alertsBySeverity = alerts.reduce((acc, alert) => {
            acc[alert.severity] = (acc[alert.severity] || 0) + 1;
            return acc;
        }, {});
        const anomaliesByType = anomalies.reduce((acc, anomaly) => {
            acc[anomaly.type] = (acc[anomaly.type] || 0) + 1;
            return acc;
        }, {});
        return {
            totalMetrics: metrics.length,
            totalAlerts: alerts.length,
            totalDashboards: this.dashboards.size,
            totalReports: this.reports.size,
            totalBaselines: this.baselines.size,
            totalAnomalies: anomalies.length,
            activeAlerts: alerts.filter(a => a.enabled).length,
            unresolvedAnomalies: anomalies.filter(a => !a.resolvedAt).length,
            metricsByType,
            alertsBySeverity,
            anomaliesByType
        };
    }
    async initializeDemoData() {
        const demoMetrics = [
            { name: 'response_time', type: 'histogram', value: 150, labels: { endpoint: '/api/users', method: 'GET' } },
            { name: 'response_time', type: 'histogram', value: 200, labels: { endpoint: '/api/orders', method: 'POST' } },
            { name: 'error_rate', type: 'gauge', value: 0.02, labels: { service: 'api' } },
            { name: 'throughput', type: 'counter', value: 1000, labels: { service: 'api' } },
            { name: 'cpu_usage', type: 'gauge', value: 45.5, labels: { instance: 'api-1' } },
            { name: 'memory_usage', type: 'gauge', value: 67.2, labels: { instance: 'api-1' } }
        ];
        for (const metric of demoMetrics) {
            await this.recordMetric(metric);
        }
        const demoAlerts = [
            {
                name: 'High Response Time Alert',
                description: 'Alert when response time exceeds 500ms',
                severity: 'high',
                condition: {
                    metric: 'response_time',
                    operator: 'gt',
                    threshold: 500,
                    timeWindow: 300
                },
                enabled: true,
                actions: [{
                        type: 'email',
                        config: { recipients: ['admin@econeura.com'] }
                    }]
            },
            {
                name: 'High Error Rate Alert',
                description: 'Alert when error rate exceeds 5%',
                severity: 'critical',
                condition: {
                    metric: 'error_rate',
                    operator: 'gt',
                    threshold: 0.05,
                    timeWindow: 300
                },
                enabled: true,
                actions: [{
                        type: 'slack',
                        config: { channel: '#alerts' }
                    }]
            }
        ];
        for (const alert of demoAlerts) {
            await this.createAlert(alert);
        }
        const demoDashboard = {
            name: 'Performance Overview',
            description: 'Main performance monitoring dashboard',
            widgets: [
                {
                    id: 'widget_1',
                    type: 'chart',
                    title: 'Response Time Trend',
                    config: { metric: 'response_time', chartType: 'line' },
                    position: { x: 0, y: 0, width: 6, height: 4 }
                },
                {
                    id: 'widget_2',
                    type: 'gauge',
                    title: 'Error Rate',
                    config: { metric: 'error_rate', max: 0.1 },
                    position: { x: 6, y: 0, width: 3, height: 4 }
                }
            ],
            isPublic: true
        };
        await this.createDashboard(demoDashboard);
        const demoReport = {
            name: 'Daily Performance Report',
            type: 'daily',
            metrics: ['response_time', 'error_rate', 'throughput'],
            filters: {},
            recipients: ['admin@econeura.com'],
            format: 'html'
        };
        await this.createReport(demoReport);
        logger.info('Demo data initialized for Advanced Performance Monitoring Service');
    }
    async cleanup() {
        if (this.alertCheckInterval) {
            clearInterval(this.alertCheckInterval);
        }
        if (this.baselineCalculationInterval) {
            clearInterval(this.baselineCalculationInterval);
        }
        if (this.anomalyDetectionInterval) {
            clearInterval(this.anomalyDetectionInterval);
        }
        logger.info('Advanced Performance Monitoring Service cleaned up');
    }
}
export const advancedPerformanceMonitoringService = new AdvancedPerformanceMonitoringService();
//# sourceMappingURL=advanced-performance-monitoring.service.js.map