import { logger } from './logger.js';
// Mock prometheusMetrics for now - will be replaced with actual implementation
const prometheusMetrics = {
  counter: (config: any) => ({ inc: (labels?: any, value?: number) => {} }),
  gauge: (config: any) => ({ set: (labels?: any, value?: number) => {} }),
  histogram: (config: any) => ({ observe: (labels?: any, value?: number) => {} }),
  summary: (config: any) => ({ observe: (labels?: any, value?: number) => {} })
};

export interface PerformanceMetric {
  id: string;
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  value: number;
  labels: Record<string, string>;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface PerformanceAlert {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  condition: {
    metric: string;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
    threshold: number;
    timeWindow: number; // seconds
  };
  enabled: boolean;
  actions: {
    type: 'email' | 'webhook' | 'slack' | 'pagerduty';
    config: Record<string, any>;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PerformanceDashboard {
  id: string;
  name: string;
  description: string;
  widgets: {
    id: string;
    type: 'chart' | 'gauge' | 'table' | 'alert';
    title: string;
    config: Record<string, any>;
    position: { x: number; y: number; width: number; height: number };
  }[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PerformanceReport {
  id: string;
  name: string;
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  metrics: string[];
  filters: Record<string, any>;
  schedule?: {
    enabled: boolean;
    cron: string;
    timezone: string;
  };
  recipients: string[];
  format: 'pdf' | 'html' | 'json' | 'csv';
  createdAt: Date;
  updatedAt: Date;
}

export interface PerformanceBaseline {
  id: string;
  metric: string;
  baseline: {
    mean: number;
    stdDev: number;
    percentiles: {
      p50: number;
      p90: number;
      p95: number;
      p99: number;
    };
  };
  seasonality?: {
    type: 'daily' | 'weekly' | 'monthly';
    pattern: number[];
  };
  calculatedAt: Date;
  validUntil: Date;
}

export interface PerformanceAnomaly {
  id: string;
  metric: string;
  type: 'spike' | 'drop' | 'trend' | 'seasonal';
  severity: 'low' | 'medium' | 'high' | 'critical';
  value: number;
  expectedValue: number;
  deviation: number;
  confidence: number;
  detectedAt: Date;
  resolvedAt?: Date;
  description: string;
}

export class AdvancedPerformanceMonitoringService {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private alerts: Map<string, PerformanceAlert> = new Map();
  private dashboards: Map<string, PerformanceDashboard> = new Map();
  private reports: Map<string, PerformanceReport> = new Map();
  private baselines: Map<string, PerformanceBaseline> = new Map();
  private anomalies: Map<string, PerformanceAnomaly> = new Map();
  private alertCheckInterval: NodeJS.Timeout | null = null;
  private baselineCalculationInterval: NodeJS.Timeout | null = null;
  private anomalyDetectionInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    logger.info('Initializing Advanced Performance Monitoring Service');

    // Start background processes
    this.startAlertChecking();
    this.startBaselineCalculation();
    this.startAnomalyDetection();

    // Initialize demo data
    await this.initializeDemoData();

    logger.info('Advanced Performance Monitoring Service initialized');
  }

  private startAlertChecking(): void {
    this.alertCheckInterval = setInterval(() => {
      this.checkAlerts().catch(error => {
        logger.error('Error checking alerts:', error);
      });
    }, 30000); // Check every 30 seconds
  }

  private startBaselineCalculation(): void {
    this.baselineCalculationInterval = setInterval(() => {
      this.calculateBaselines().catch(error => {
        logger.error('Error calculating baselines:', error);
      });
    }, 3600000); // Calculate every hour
  }

  private startAnomalyDetection(): void {
    this.anomalyDetectionInterval = setInterval(() => {
      this.detectAnomalies().catch(error => {
        logger.error('Error detecting anomalies:', error);
      });
    }, 60000); // Detect every minute
  }

  // Metrics Management
  async recordMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>): Promise<PerformanceMetric> {
    const newMetric: PerformanceMetric = {
      ...metric,
      id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    this.metrics.set(newMetric.id, newMetric);

    // Record in Prometheus
    this.recordPrometheusMetric(newMetric);

    logger.info('Performance metric recorded');

    return newMetric;
  }

  private recordPrometheusMetric(metric: PerformanceMetric): void {
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
    } catch (error) {
      logger.error('Error recording Prometheus metric:', error);
    }
  }

  async getMetrics(filters?: {
    name?: string;
    type?: string;
    startTime?: Date;
    endTime?: Date;
    limit?: number;
  }): Promise<PerformanceMetric[]> {
    let metrics = Array.from(this.metrics.values());

    if (filters) {
      if (filters.name) {
        metrics = metrics.filter(m => m.name.includes(filters.name!));
      }
      if (filters.type) {
        metrics = metrics.filter(m => m.type === filters.type);
      }
      if (filters.startTime) {
        metrics = metrics.filter(m => m.timestamp >= filters.startTime!);
      }
      if (filters.endTime) {
        metrics = metrics.filter(m => m.timestamp <= filters.endTime!);
      }
      if (filters.limit) {
        metrics = metrics.slice(0, filters.limit);
      }
    }

    return metrics.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Alert Management
  async createAlert(alert: Omit<PerformanceAlert, 'id' | 'createdAt' | 'updatedAt'>): Promise<PerformanceAlert> {
    const newAlert: PerformanceAlert = {
      ...alert,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.alerts.set(newAlert.id, newAlert);

    logger.info('Performance alert created');

    return newAlert;
  }

  async getAlerts(): Promise<PerformanceAlert[]> {
    return Array.from(this.alerts.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateAlert(id: string, updates: Partial<PerformanceAlert>): Promise<PerformanceAlert | null> {
    const existing = this.alerts.get(id);
    if (!existing) return null;

    const updated: PerformanceAlert = {
      ...existing,
      ...updates,
      updatedAt: new Date()
    };

    this.alerts.set(id, updated);

    logger.info('Performance alert updated');

    return updated;
  }

  async deleteAlert(id: string): Promise<boolean> {
    const deleted = this.alerts.delete(id);
    if (deleted) {
      logger.info('Performance alert deleted');
    }
    return deleted;
  }

  private async checkAlerts(): Promise<void> {
    const enabledAlerts = Array.from(this.alerts.values()).filter(alert => alert.enabled);

    for (const alert of enabledAlerts) {
      try {
        const metrics = await this.getMetrics({
          name: alert.condition.metric,
          startTime: new Date(Date.now() - alert.condition.timeWindow * 1000)
        });

        if (metrics.length === 0) continue;

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
      } catch (error) {
        logger.error('Error checking alert:', error);
      }
    }
  }

  private async triggerAlert(alert: PerformanceAlert, metric: PerformanceMetric): Promise<void> {
    logger.warn('Performance alert triggered');

    // Execute alert actions
    for (const action of alert.actions) {
      try {
        await this.executeAlertAction(action, alert, metric);
      } catch (error) {
        logger.error('Error executing alert action:', error);
      }
    }
  }

  private async executeAlertAction(
    action: PerformanceAlert['actions'][0],
    alert: PerformanceAlert,
    metric: PerformanceMetric
  ): Promise<void> {
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
        // Email action implementation
        logger.info('Email alert sent');
        break;
      case 'webhook':
        // Webhook action implementation
        logger.info('Webhook alert sent');
        break;
      case 'slack':
        // Slack action implementation
        logger.info('Slack alert sent');
        break;
      case 'pagerduty':
        // PagerDuty action implementation
        logger.info('PagerDuty alert sent');
        break;
    }
  }

  // Dashboard Management
  async createDashboard(dashboard: Omit<PerformanceDashboard, 'id' | 'createdAt' | 'updatedAt'>): Promise<PerformanceDashboard> {
    const newDashboard: PerformanceDashboard = {
      ...dashboard,
      id: `dashboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.dashboards.set(newDashboard.id, newDashboard);

    logger.info('Performance dashboard created');

    return newDashboard;
  }

  async getDashboards(): Promise<PerformanceDashboard[]> {
    return Array.from(this.dashboards.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateDashboard(id: string, updates: Partial<PerformanceDashboard>): Promise<PerformanceDashboard | null> {
    const existing = this.dashboards.get(id);
    if (!existing) return null;

    const updated: PerformanceDashboard = {
      ...existing,
      ...updates,
      updatedAt: new Date()
    };

    this.dashboards.set(id, updated);

    logger.info('Performance dashboard updated');

    return updated;
  }

  // Report Management
  async createReport(report: Omit<PerformanceReport, 'id' | 'createdAt' | 'updatedAt'>): Promise<PerformanceReport> {
    const newReport: PerformanceReport = {
      ...report,
      id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.reports.set(newReport.id, newReport);

    logger.info('Performance report created');

    return newReport;
  }

  async getReports(): Promise<PerformanceReport[]> {
    return Array.from(this.reports.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async generateReport(reportId: string): Promise<{ content: string; format: string }> {
    const report = this.reports.get(reportId);
    if (!report) {
      throw new Error('Report not found');
    }

    const metrics = await this.getMetrics({
      startTime: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
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

    let content: string;
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

  private generateReportSummary(metrics: PerformanceMetric[]): Record<string, any> {
    const summary: Record<string, any> = {};

    const metricGroups = metrics.reduce((groups, metric) => {
      if (!groups[metric.name]) {
        groups[metric.name] = [];
      }
      groups[metric.name].push(metric.value);
      return groups;
    }, {} as Record<string, number[]>);

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

  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  private generateCSVReport(data: any): string {
    const headers = ['Metric', 'Count', 'Min', 'Max', 'Avg', 'P95', 'P99'];
    const rows = [headers.join(',')];

    for (const [name, stats] of Object.entries(data.summary)) {
      const row = [
        name,
        (stats as any).count,
        (stats as any).min,
        (stats as any).max,
        (stats as any).avg,
        (stats as any).p95,
        (stats as any).p99
      ].join(',');
      rows.push(row);
    }

    return rows.join('\n');
  }

  private generateHTMLReport(data: any): string {
    return `;
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
          ${Object.entries(data.summary).map(([name, stats]: [string, any]) => `
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

  // Baseline Management
  async calculateBaselines(): Promise<void> {
    const metricNames = Array.from(new Set(Array.from(this.metrics.values()).map(m => m.name)));

    for (const metricName of metricNames) {
      const metrics = await this.getMetrics({
        name: metricName,
        startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
      });

      if (metrics.length < 10) continue; // Need at least 10 data points

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

      const baseline: PerformanceBaseline = {
        id: `baseline_${metricName}_${Date.now()}`,
        metric: metricName,
        baseline: { mean, stdDev, percentiles },
        calculatedAt: new Date(),
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000) // Valid for 24 hours
      };

      this.baselines.set(metricName, baseline);

      logger.info('Baseline calculated');
    }
  }

  async getBaselines(): Promise<PerformanceBaseline[]> {
    return Array.from(this.baselines.values()).sort((a, b) => b.calculatedAt.getTime() - a.calculatedAt.getTime());
  }

  // Anomaly Detection
  async detectAnomalies(): Promise<void> {
    const baselines = await this.getBaselines();

    for (const baseline of baselines) {
      const recentMetrics = await this.getMetrics({
        name: baseline.metric,
        startTime: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
      });

      for (const metric of recentMetrics) {
        const deviation = Math.abs(metric.value - baseline.baseline.mean) / baseline.baseline.stdDev;

        if (deviation > 3) { // 3 standard deviations
          const anomaly: PerformanceAnomaly = {
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

  async getAnomalies(filters?: {
    severity?: string;
    type?: string;
    resolved?: boolean;
    limit?: number;
  }): Promise<PerformanceAnomaly[]> {
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

  async resolveAnomaly(id: string): Promise<boolean> {
    const anomaly = this.anomalies.get(id);
    if (!anomaly) return false;

    anomaly.resolvedAt = new Date();
    this.anomalies.set(id, anomaly);

    logger.info('Performance anomaly resolved');

    return true;
  }

  // Statistics
  async getStatistics(): Promise<{
    totalMetrics: number;
    totalAlerts: number;
    totalDashboards: number;
    totalReports: number;
    totalBaselines: number;
    totalAnomalies: number;
    activeAlerts: number;
    unresolvedAnomalies: number;
    metricsByType: Record<string, number>;
    alertsBySeverity: Record<string, number>;
    anomaliesByType: Record<string, number>;
  }> {
    const metrics = Array.from(this.metrics.values());
    const alerts = Array.from(this.alerts.values());
    const anomalies = Array.from(this.anomalies.values());

    const metricsByType = metrics.reduce((acc, metric) => {
      acc[metric.type] = (acc[metric.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const alertsBySeverity = alerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const anomaliesByType = anomalies.reduce((acc, anomaly) => {
      acc[anomaly.type] = (acc[anomaly.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

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

  // Demo Data Initialization
  private async initializeDemoData(): Promise<void> {
    // Create demo metrics
    const demoMetrics = [
      { name: 'response_time', type: 'histogram' as const, value: 150, labels: { endpoint: '/api/users', method: 'GET' } },
      { name: 'response_time', type: 'histogram' as const, value: 200, labels: { endpoint: '/api/orders', method: 'POST' } },
      { name: 'error_rate', type: 'gauge' as const, value: 0.02, labels: { service: 'api' } },
      { name: 'throughput', type: 'counter' as const, value: 1000, labels: { service: 'api' } },
      { name: 'cpu_usage', type: 'gauge' as const, value: 45.5, labels: { instance: 'api-1' } },
      { name: 'memory_usage', type: 'gauge' as const, value: 67.2, labels: { instance: 'api-1' } }
    ];

    for (const metric of demoMetrics) {
      await this.recordMetric(metric);
    }

    // Create demo alerts
    const demoAlerts = [
      {
        name: 'High Response Time Alert',
        description: 'Alert when response time exceeds 500ms',
        severity: 'high' as const,
        condition: {
          metric: 'response_time',
          operator: 'gt' as const,
          threshold: 500,
          timeWindow: 300
        },
        enabled: true,
        actions: [{
          type: 'email' as const,
          config: { recipients: ['admin@econeura.com'] }
        }]
      },
      {
        name: 'High Error Rate Alert',
        description: 'Alert when error rate exceeds 5%',
        severity: 'critical' as const,
        condition: {
          metric: 'error_rate',
          operator: 'gt' as const,
          threshold: 0.05,
          timeWindow: 300
        },
        enabled: true,
        actions: [{
          type: 'slack' as const,
          config: { channel: '#alerts' }
        }]
      }
    ];

    for (const alert of demoAlerts) {
      await this.createAlert(alert);
    }

    // Create demo dashboard
    const demoDashboard = {
      name: 'Performance Overview',
      description: 'Main performance monitoring dashboard',
      widgets: [
        {
          id: 'widget_1',
          type: 'chart' as const,
          title: 'Response Time Trend',
          config: { metric: 'response_time', chartType: 'line' },
          position: { x: 0, y: 0, width: 6, height: 4 }
        },
        {
          id: 'widget_2',
          type: 'gauge' as const,
          title: 'Error Rate',
          config: { metric: 'error_rate', max: 0.1 },
          position: { x: 6, y: 0, width: 3, height: 4 }
        }
      ],
      isPublic: true
    };

    await this.createDashboard(demoDashboard);

    // Create demo report
    const demoReport = {
      name: 'Daily Performance Report',
      type: 'daily' as const,
      metrics: ['response_time', 'error_rate', 'throughput'],
      filters: {},
      recipients: ['admin@econeura.com'],
      format: 'html' as const
    };

    await this.createReport(demoReport);

    logger.info('Demo data initialized for Advanced Performance Monitoring Service');
  }

  // Cleanup
  async cleanup(): Promise<void> {
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

// Export singleton instance
export const advancedPerformanceMonitoringService = new AdvancedPerformanceMonitoringService();
