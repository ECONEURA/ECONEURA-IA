import { logger } from './logger.js';
import { z } from 'zod';

// Mock de Prometheus para testing
const mockPrometheus = {
  register: {
    getSingleMetric: (name: string) => ({
      get: () => ({ values: [{ value: Math.random() * 100 }] })
    }),
    getMetricsAsJSON: () => [
      { name: 'http_requests_total', help: 'Total HTTP requests', type: 'counter', values: [] },
      { name: 'http_request_duration_seconds', help: 'HTTP request duration', type: 'histogram', values: [] }
    ]
  },
  Counter: (config: any) => ({ inc: (labels?: any, value?: number) => {} }),
  Gauge: (config: any) => ({ set: (labels?: any, value?: number) => {} }),
  Histogram: (config: any) => ({ observe: (labels?: any, value?: number) => {} }),
  Summary: (config: any) => ({ observe: (labels?: any, value?: number) => {} })
};

// Mock de Prometheus
const prometheus = mockPrometheus;

// Schemas de validación
const MetricSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['COUNTER', 'GAUGE', 'HISTOGRAM', 'SUMMARY']),
  description: z.string(),
  labels: z.array(z.string()),
  value: z.number(),
  timestamp: z.date(),
  metadata: z.record(z.any()).optional()
});

const AlertRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  metric: z.string(),
  condition: z.object({
    operator: z.enum(['gt', 'lt', 'gte', 'lte', 'eq', 'ne']),
    threshold: z.number(),
    window: z.number(), // segundos
    aggregation: z.enum(['avg', 'sum', 'min', 'max', 'count'])
  }),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  enabled: z.boolean(),
  cooldown: z.number(), // segundos
  labels: z.record(z.string()).optional(),
  actions: z.array(z.object({
    type: z.enum(['EMAIL', 'SLACK', 'WEBHOOK', 'SMS']),
    config: z.record(z.any())
  }))
});

const AlertSchema = z.object({
  id: z.string(),
  ruleId: z.string(),
  name: z.string(),
  description: z.string(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  status: z.enum(['ACTIVE', 'RESOLVED', 'ACKNOWLEDGED', 'SUPPRESSED']),
  metric: z.string(),
  value: z.number(),
  threshold: z.number(),
  timestamp: z.date(),
  resolvedAt: z.date().optional(),
  acknowledgedAt: z.date().optional(),
  acknowledgedBy: z.string().optional(),
  labels: z.record(z.string()).optional(),
  context: z.record(z.any()).optional()
});

const SLASchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  metric: z.string(),
  target: z.number(), // valor objetivo (ej: 99.9 para 99.9%)
  window: z.number(), // ventana de tiempo en segundos
  enabled: z.boolean(),
  alertThreshold: z.number().optional(), // umbral para alertas
  labels: z.record(z.string()).optional()
});

const MetricTrendSchema = z.object({
  id: z.string(),
  metric: z.string(),
  period: z.enum(['1h', '6h', '24h', '7d', '30d']),
  trend: z.enum(['INCREASING', 'DECREASING', 'STABLE', 'VOLATILE']),
  changePercent: z.number(),
  confidence: z.number(), // 0-1
  prediction: z.object({
    nextValue: z.number(),
    nextTimestamp: z.date(),
    confidence: z.number()
  }).optional()
});

// Tipos TypeScript
export type Metric = z.infer<typeof MetricSchema>;
export type AlertRule = z.infer<typeof AlertRuleSchema>;
export type Alert = z.infer<typeof AlertSchema>;
export type SLA = z.infer<typeof SLASchema>;
export type MetricTrend = z.infer<typeof MetricTrendSchema>;

export interface MetricsAlertsConfig {
  prometheusEnabled: boolean;
  alertingEnabled: boolean;
  defaultCooldown: number; // segundos
  maxAlertsPerRule: number;
  retentionDays: number;
  notificationChannels: string[];
  slaMonitoring: boolean;
  trendAnalysis: boolean;
}

export interface MetricCollection {
  id: string;
  name: string;
  metrics: Metric[];
  startTime: Date;
  endTime: Date;
  duration: number;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
}

export class AdvancedMetricsAlertsService {
  private config: MetricsAlertsConfig;
  private metrics: Map<string, Metric> = new Map();
  private alertRules: Map<string, AlertRule> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private slas: Map<string, SLA> = new Map();
  private trends: Map<string, MetricTrend> = new Map();
  private collections: Map<string, MetricCollection> = new Map();

  constructor(config: MetricsAlertsConfig) {
    this.config = config;
    this.initializeDefaultRules();
    this.initializeDefaultSLAs();
    this.startMetricCollection();
  }

  // ===== GESTIÓN DE MÉTRICAS =====

  async collectMetrics(): Promise<Metric[]> {
    try {
      logger.info('Starting metric collection');

      // Simular recolección de métricas desde Prometheus
      const prometheusMetrics = prometheus.register.getMetricsAsJSON();
      const collectedMetrics: Metric[] = [];

      for (const metric of prometheusMetrics) {
        const metricData: Metric = {
          id: `metric-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: metric.name,
          type: metric.type.toUpperCase() as any,
          description: metric.help,
          labels: [],
          value: Math.random() * 1000, // Simular valor
          timestamp: new Date(),
          metadata: { source: 'prometheus' }
        };

        this.metrics.set(metricData.id, metricData);
        collectedMetrics.push(metricData);
      }

      // Recolectar métricas personalizadas
      const customMetrics = await this.collectCustomMetrics();
      collectedMetrics.push(...customMetrics);

      logger.info(`Collected ${collectedMetrics.length} metrics`);
      return collectedMetrics;

    } catch (error) {
      logger.error('Error collecting metrics', { error });
      throw error;
    }
  }

  private async collectCustomMetrics(): Promise<Metric[]> {
    const customMetrics: Metric[] = [
      {
        id: `custom-${Date.now()}-1`,
        name: 'application_uptime_seconds',
        type: 'GAUGE',
        description: 'Application uptime in seconds',
        labels: ['instance'],
        value: Date.now() / 1000,
        timestamp: new Date(),
        metadata: { source: 'custom' }
      },
      {
        id: `custom-${Date.now()}-2`,
        name: 'database_connections_active',
        type: 'GAUGE',
        description: 'Active database connections',
        labels: ['database'],
        value: Math.floor(Math.random() * 50) + 10,
        timestamp: new Date(),
        metadata: { source: 'custom' }
      },
      {
        id: `custom-${Date.now()}-3`,
        name: 'memory_usage_percent',
        type: 'GAUGE',
        description: 'Memory usage percentage',
        labels: ['instance'],
        value: Math.random() * 100,
        timestamp: new Date(),
        metadata: { source: 'custom' }
      }
    ];

    customMetrics.forEach(metric => {
      this.metrics.set(metric.id, metric);
    });

    return customMetrics;
  }

  async getMetrics(filter?: { name?: string; type?: string; timeRange?: { start: Date; end: Date } }): Promise<Metric[]> {
    let metrics = Array.from(this.metrics.values());

    if (filter) {
      if (filter.name) {
        metrics = metrics.filter(m => m.name.includes(filter.name));
      }
      if (filter.type) {
        metrics = metrics.filter(m => m.type === filter.type);
      }
      if (filter.timeRange) {
        metrics = metrics.filter(m =>
          m.timestamp >= filter.timeRange!.start &&
          m.timestamp <= filter.timeRange!.end
        );
      }
    }

    return metrics;
  }

  async getMetricByName(name: string): Promise<Metric[]> {
    return Array.from(this.metrics.values()).filter(m => m.name === name);
  }

  async getMetricTrends(metricName: string, period: string): Promise<MetricTrend[]> {
    const metrics = await this.getMetricByName(metricName);

    if (metrics.length === 0) {
      return [];
    }

    // Simular análisis de tendencias
    const trend: MetricTrend = {
      id: `trend-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      metric: metricName,
      period: period as any,
      trend: this.calculateTrend(metrics),
      changePercent: this.calculateChangePercent(metrics),
      confidence: Math.random() * 0.5 + 0.5, // 0.5-1.0
      prediction: {
        nextValue: this.predictNextValue(metrics),
        nextTimestamp: new Date(Date.now() + this.getPeriodMs(period)),
        confidence: Math.random() * 0.3 + 0.7 // 0.7-1.0
      }
    };

    this.trends.set(trend.id, trend);
    return [trend];
  }

  private calculateTrend(metrics: Metric[]): 'INCREASING' | 'DECREASING' | 'STABLE' | 'VOLATILE' {
    if (metrics.length < 2) return 'STABLE';

    const values = metrics.map(m => m.value);
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const change = (secondAvg - firstAvg) / firstAvg;
    const volatility = this.calculateVolatility(values);

    if (volatility > 0.2) return 'VOLATILE';
    if (change > 0.1) return 'INCREASING';
    if (change < -0.1) return 'DECREASING';
    return 'STABLE';
  }

  private calculateChangePercent(metrics: Metric[]): number {
    if (metrics.length < 2) return 0;

    const first = metrics[0].value;
    const last = metrics[metrics.length - 1].value;

    return ((last - first) / first) * 100;
  }

  private calculateVolatility(values: number[]): number {
    if (values.length < 2) return 0;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;

    return Math.sqrt(variance) / mean;
  }

  private predictNextValue(metrics: Metric[]): number {
    if (metrics.length < 2) return metrics[0]?.value || 0;

    // Simple predicción lineal
    const recent = metrics.slice(-5);
    const trend = this.calculateTrend(recent);

    const lastValue = recent[recent.length - 1].value;

    switch (trend) {
      case 'INCREASING':
        return lastValue * 1.05;
      case 'DECREASING':
        return lastValue * 0.95;
      default:
        return lastValue;
    }
  }

  private getPeriodMs(period: string): number {
    switch (period) {
      case '1h': return 60 * 60 * 1000;
      case '6h': return 6 * 60 * 60 * 1000;
      case '24h': return 24 * 60 * 60 * 1000;
      case '7d': return 7 * 24 * 60 * 60 * 1000;
      case '30d': return 30 * 24 * 60 * 60 * 1000;
      default: return 60 * 60 * 1000;
    }
  }

  // ===== GESTIÓN DE REGLAS DE ALERTAS =====

  async createAlertRule(rule: Omit<AlertRule, 'id'>): Promise<AlertRule> {
    const newRule: AlertRule = {
      ...rule,
      id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    this.alertRules.set(newRule.id, newRule);
    logger.info(`Alert rule created: ${newRule.id}`);

    return newRule;
  }

  async getAlertRule(ruleId: string): Promise<AlertRule | null> {
    return this.alertRules.get(ruleId) || null;
  }

  async listAlertRules(): Promise<AlertRule[]> {
    return Array.from(this.alertRules.values());
  }

  async updateAlertRule(ruleId: string, updates: Partial<AlertRule>): Promise<AlertRule | null> {
    const rule = this.alertRules.get(ruleId);
    if (!rule) return null;

    const updatedRule = { ...rule, ...updates };
    this.alertRules.set(ruleId, updatedRule);
    logger.info(`Alert rule updated: ${ruleId}`);

    return updatedRule;
  }

  async deleteAlertRule(ruleId: string): Promise<boolean> {
    const deleted = this.alertRules.delete(ruleId);
    if (deleted) {
      logger.info(`Alert rule deleted: ${ruleId}`);
    }
    return deleted;
  }

  // ===== EVALUACIÓN DE ALERTAS =====

  async evaluateAlertRules(): Promise<Alert[]> {
    const newAlerts: Alert[] = [];

    for (const rule of Array.from(this.alertRules.values())) {
      if (!rule.enabled) continue;

      try {
        const alert = await this.evaluateRule(rule);
        if (alert) {
          this.alerts.set(alert.id, alert);
          newAlerts.push(alert);

          // Enviar notificaciones
          await this.sendAlertNotifications(alert, rule);
        }
      } catch (error) {
        logger.error(`Error evaluating rule ${rule.id}`, { error });
      }
    }

    return newAlerts;
  }

  private async evaluateRule(rule: AlertRule): Promise<Alert | null> {
    // Obtener métricas para la regla
    const metrics = await this.getMetricByName(rule.metric);
    if (metrics.length === 0) return null;

    // Filtrar por ventana de tiempo
    const windowStart = new Date(Date.now() - rule.condition.window * 1000);
    const recentMetrics = metrics.filter(m => m.timestamp >= windowStart);

    if (recentMetrics.length === 0) return null;

    // Aplicar agregación
    const aggregatedValue = this.aggregateMetrics(recentMetrics, rule.condition.aggregation);

    // Evaluar condición
    const conditionMet = this.evaluateCondition(aggregatedValue, rule.condition.operator, rule.condition.threshold);

    if (!conditionMet) return null;

    // Verificar cooldown
    const existingAlerts = Array.from(this.alerts.values())
      .filter(a => a.ruleId === rule.id && a.status === 'ACTIVE');

    if (existingAlerts.length > 0) {
      const lastAlert = existingAlerts[existingAlerts.length - 1];
      const timeSinceLastAlert = Date.now() - lastAlert.timestamp.getTime();

      if (timeSinceLastAlert < rule.cooldown * 1000) {
        return null; // En cooldown
      }
    }

    // Crear alerta
    const alert: Alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ruleId: rule.id,
      name: rule.name,
      description: rule.description,
      severity: rule.severity,
      status: 'ACTIVE',
      metric: rule.metric,
      value: aggregatedValue,
      threshold: rule.condition.threshold,
      timestamp: new Date(),
      labels: rule.labels,
      context: {
        aggregation: rule.condition.aggregation,
        window: rule.condition.window,
        metricsCount: recentMetrics.length
      }
    };

    return alert;
  }

  private aggregateMetrics(metrics: Metric[], aggregation: string): number {
    const values = metrics.map(m => m.value);

    switch (aggregation) {
      case 'avg':
        return values.reduce((a, b) => a + b, 0) / values.length;
      case 'sum':
        return values.reduce((a, b) => a + b, 0);
      case 'min':
        return Math.min(...values);
      case 'max':
        return Math.max(...values);
      case 'count':
        return values.length;
      default:
        return values[values.length - 1] || 0;
    }
  }

  private evaluateCondition(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case 'gt': return value > threshold;
      case 'lt': return value < threshold;
      case 'gte': return value >= threshold;
      case 'lte': return value <= threshold;
      case 'eq': return value === threshold;
      case 'ne': return value !== threshold;
      default: return false;
    }
  }

  // ===== GESTIÓN DE ALERTAS =====

  async getAlerts(filter?: { status?: string; severity?: string; ruleId?: string }): Promise<Alert[]> {
    let alerts = Array.from(this.alerts.values());

    if (filter) {
      if (filter.status) {
        alerts = alerts.filter(a => a.status === filter.status);
      }
      if (filter.severity) {
        alerts = alerts.filter(a => a.severity === filter.severity);
      }
      if (filter.ruleId) {
        alerts = alerts.filter(a => a.ruleId === filter.ruleId);
      }
    }

    return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<Alert | null> {
    const alert = this.alerts.get(alertId);
    if (!alert) return null;

    alert.status = 'ACKNOWLEDGED';
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = acknowledgedBy;

    this.alerts.set(alertId, alert);
    logger.info(`Alert acknowledged: ${alertId} by ${acknowledgedBy}`);

    return alert;
  }

  async resolveAlert(alertId: string): Promise<Alert | null> {
    const alert = this.alerts.get(alertId);
    if (!alert) return null;

    alert.status = 'RESOLVED';
    alert.resolvedAt = new Date();

    this.alerts.set(alertId, alert);
    logger.info(`Alert resolved: ${alertId}`);

    return alert;
  }

  // ===== NOTIFICACIONES =====

  private async sendAlertNotifications(alert: Alert, rule: AlertRule): Promise<void> {
    for (const action of rule.actions) {
      try {
        await this.sendNotification(alert, action);
      } catch (error) {
        logger.error(`Error sending notification for alert ${alert.id}`, { error });
      }
    }
  }

  private async sendNotification(alert: Alert, action: any): Promise<void> {
    // Simular envío de notificaciones
    logger.info(`Sending ${action.type} notification for alert ${alert.id}`);

    // En una implementación real, aquí se enviarían las notificaciones reales
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // ===== GESTIÓN DE SLA =====

  async createSLA(sla: Omit<SLA, 'id'>): Promise<SLA> {
    const newSLA: SLA = {
      ...sla,
      id: `sla-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    this.slas.set(newSLA.id, newSLA);
    logger.info(`SLA created: ${newSLA.id}`);

    return newSLA;
  }

  async getSLA(slaId: string): Promise<SLA | null> {
    return this.slas.get(slaId) || null;
  }

  async listSLAs(): Promise<SLA[]> {
    return Array.from(this.slas.values());
  }

  async calculateSLACompliance(slaId: string, timeRange?: { start: Date; end: Date }): Promise<{
    sla: SLA;
    compliance: number; // porcentaje
    violations: number;
    totalMeasurements: number;
    status: 'COMPLIANT' | 'VIOLATED' | 'WARNING';
  }> {
    const sla = this.slas.get(slaId);
    if (!sla) {
      throw new Error(`SLA not found: ${slaId}`);
    }

    const end = timeRange?.end || new Date();
    const start = timeRange?.start || new Date(end.getTime() - sla.window * 1000);

    const metrics = await this.getMetrics({
      name: sla.metric,
      timeRange: { start, end }
    });

    const totalMeasurements = metrics.length;
    const violations = metrics.filter(m => m.value < sla.target).length;
    const compliance = totalMeasurements > 0 ? ((totalMeasurements - violations) / totalMeasurements) * 100 : 100;

    let status: 'COMPLIANT' | 'VIOLATED' | 'WARNING' = 'COMPLIANT';
    if (compliance < sla.target) {
      status = 'VIOLATED';
    } else if (sla.alertThreshold && compliance < sla.alertThreshold) {
      status = 'WARNING';
    }

    return {
      sla,
      compliance,
      violations,
      totalMeasurements,
      status
    };
  }

  // ===== ESTADÍSTICAS Y REPORTES =====

  async getMetricsStatistics(): Promise<{
    totalMetrics: number;
    metricsByType: Record<string, number>;
    totalAlerts: number;
    activeAlerts: number;
    totalRules: number;
    enabledRules: number;
    totalSLAs: number;
    averageCompliance: number;
    lastCollection: Date | null;
  }> {
    const metrics = Array.from(this.metrics.values());
    const alerts = Array.from(this.alerts.values());
    const rules = Array.from(this.alertRules.values());
    const slas = Array.from(this.slas.values());

    const metricsByType = metrics.reduce((acc, metric) => {
      acc[metric.type] = (acc[metric.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const activeAlerts = alerts.filter(a => a.status === 'ACTIVE').length;
    const enabledRules = rules.filter(r => r.enabled).length;

    // Calcular compliance promedio de SLAs
    let averageCompliance = 100;
    if (slas.length > 0) {
      const compliancePromises = slas.map(sla => this.calculateSLACompliance(sla.id));
      const complianceResults = await Promise.allSettled(compliancePromises);
      const validResults = complianceResults
        .filter(r => r.status === 'fulfilled')
        .map(r => (r as PromiseFulfilledResult<any>).value.compliance);

      if (validResults.length > 0) {
        averageCompliance = validResults.reduce((a, b) => a + b, 0) / validResults.length;
      }
    }

    const lastCollection = metrics.length > 0
      ? new Date(Math.max(...metrics.map(m => m.timestamp.getTime())))
      : null;

    return {
      totalMetrics: metrics.length,
      metricsByType,
      totalAlerts: alerts.length,
      activeAlerts,
      totalRules: rules.length,
      enabledRules,
      totalSLAs: slas.length,
      averageCompliance,
      lastCollection
    };
  }

  async generateMetricsReport(period: 'hourly' | 'daily' | 'weekly' | 'monthly'): Promise<{
    period: string;
    generatedAt: Date;
    summary: any;
    topMetrics: Metric[];
    alertSummary: any;
    slaSummary: any;
    recommendations: string[];
  }> {
    const now = new Date();
    const periodMs = this.getPeriodMs(period === 'hourly' ? '1h' : period === 'daily' ? '24h' : period === 'weekly' ? '7d' : '30d');
    const startTime = new Date(now.getTime() - periodMs);

    const metrics = await this.getMetrics({ timeRange: { start: startTime, end: now } });
    const alerts = await this.getAlerts();
    const periodAlerts = alerts.filter(a => a.timestamp >= startTime);

    const summary = {
      totalMetrics: metrics.length,
      uniqueMetrics: new Set(metrics.map(m => m.name)).size,
      totalAlerts: periodAlerts.length,
      criticalAlerts: periodAlerts.filter(a => a.severity === 'CRITICAL').length,
      averageValue: metrics.length > 0 ? metrics.reduce((a, b) => a + b.value, 0) / metrics.length : 0
    };

    const topMetrics = metrics
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    const alertSummary = {
      total: periodAlerts.length,
      bySeverity: {
        CRITICAL: periodAlerts.filter(a => a.severity === 'CRITICAL').length,
        HIGH: periodAlerts.filter(a => a.severity === 'HIGH').length,
        MEDIUM: periodAlerts.filter(a => a.severity === 'MEDIUM').length,
        LOW: periodAlerts.filter(a => a.severity === 'LOW').length
      },
      byStatus: {
        ACTIVE: periodAlerts.filter(a => a.status === 'ACTIVE').length,
        RESOLVED: periodAlerts.filter(a => a.status === 'RESOLVED').length,
        ACKNOWLEDGED: periodAlerts.filter(a => a.status === 'ACKNOWLEDGED').length
      }
    };

    const slaSummary = {
      totalSLAs: (await this.listSLAs()).length,
      averageCompliance: (await this.getMetricsStatistics()).averageCompliance
    };

    const recommendations = this.generateRecommendations(summary, alertSummary, slaSummary);

    return {
      period,
      generatedAt: now,
      summary,
      topMetrics,
      alertSummary,
      slaSummary,
      recommendations
    };
  }

  private generateRecommendations(summary: any, alertSummary: any, slaSummary: any): string[] {
    const recommendations: string[] = [];

    if (alertSummary.total > 0) {
      recommendations.push(`Total of ${alertSummary.total} alerts generated in this period. Review alert rules and thresholds.`);
    }

    if (alertSummary.bySeverity.CRITICAL > 0) {
      recommendations.push(`${alertSummary.bySeverity.CRITICAL} critical alerts require immediate attention.`);
    }

    if (slaSummary.averageCompliance < 95) {
      recommendations.push(`SLA compliance is below 95%. Review system performance and capacity.`);
    }

    if (summary.uniqueMetrics < 10) {
      recommendations.push('Consider adding more metrics for better observability.');
    }

    if (recommendations.length === 0) {
      recommendations.push('System is performing well. Continue monitoring.');
    }

    return recommendations;
  }

  // ===== INICIALIZACIÓN =====

  private startMetricCollection(): void {
    // Iniciar recolección automática de métricas
    setInterval(async () => {
      try {
        await this.collectMetrics();
        await this.evaluateAlertRules();
      } catch (error) {
        logger.error('Error in metric collection cycle', { error });
      }
    }, 60000); // Cada minuto

    logger.info('Metric collection started');
  }

  private initializeDefaultRules(): void {
    const defaultRules: AlertRule[] = [
      {
        id: 'rule-1',
        name: 'High Error Rate',
        description: 'Alert when error rate exceeds 5%',
        metric: 'http_requests_total',
        condition: {
          operator: 'gt',
          threshold: 5,
          window: 300, // 5 minutos
          aggregation: 'avg'
        },
        severity: 'HIGH',
        enabled: true,
        cooldown: 300, // 5 minutos
        actions: [
          {
            type: 'EMAIL',
            config: { recipients: ['admin@econeura.com'] }
          },
          {
            type: 'SLACK',
            config: { webhook: 'https://hooks.slack.com/services/...' }
          }
        ]
      },
      {
        id: 'rule-2',
        name: 'High Memory Usage',
        description: 'Alert when memory usage exceeds 80%',
        metric: 'memory_usage_percent',
        condition: {
          operator: 'gt',
          threshold: 80,
          window: 60, // 1 minuto
          aggregation: 'avg'
        },
        severity: 'MEDIUM',
        enabled: true,
        cooldown: 600, // 10 minutos
        actions: [
          {
            type: 'EMAIL',
            config: { recipients: ['ops@econeura.com'] }
          }
        ]
      },
      {
        id: 'rule-3',
        name: 'Database Connection Issues',
        description: 'Alert when database connections are low',
        metric: 'database_connections_active',
        condition: {
          operator: 'lt',
          threshold: 5,
          window: 120, // 2 minutos
          aggregation: 'min'
        },
        severity: 'CRITICAL',
        enabled: true,
        cooldown: 300, // 5 minutos
        actions: [
          {
            type: 'EMAIL',
            config: { recipients: ['dba@econeura.com', 'admin@econeura.com'] }
          },
          {
            type: 'SMS',
            config: { recipients: ['+1234567890'] }
          }
        ]
      }
    ];

    defaultRules.forEach(rule => {
      this.alertRules.set(rule.id, rule);
    });
  }

  private initializeDefaultSLAs(): void {
    const defaultSLAs: SLA[] = [
      {
        id: 'sla-1',
        name: 'API Availability',
        description: 'API availability SLA',
        metric: 'http_requests_total',
        target: 99.9, // 99.9%
        window: 86400, // 24 horas
        enabled: true,
        alertThreshold: 99.5
      },
      {
        id: 'sla-2',
        name: 'Response Time',
        description: 'API response time SLA',
        metric: 'http_request_duration_seconds',
        target: 95, // 95% of requests under threshold
        window: 3600, // 1 hora
        enabled: true,
        alertThreshold: 90
      }
    ];

    defaultSLAs.forEach(sla => {
      this.slas.set(sla.id, sla);
    });
  }
}

export default AdvancedMetricsAlertsService;
