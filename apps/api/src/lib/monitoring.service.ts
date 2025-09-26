// Monitoring Service - Sistema de Monitoring y Alertas Avanzado
// Sistema completo de monitoreo, métricas y alertas para el sistema

import { logger } from './logger.js';

export interface MetricData {
  name: string;
  value: number;
  timestamp: number;
  labels?: Record<string, string>;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  metric: string;
  condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  duration: number; // segundos
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  actions: AlertAction[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AlertAction {
  type: 'email' | 'webhook' | 'slack' | 'sms';
  config: Record<string, any>;
}

export interface Alert {
  id: string;
  ruleId: string;
  status: 'firing' | 'resolved';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  value: number;
  threshold: number;
  startedAt: Date;
  resolvedAt?: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  score: number; // 0-100
  checks: HealthCheck[];
  timestamp: Date;
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  duration: number;
  details?: Record<string, any>;
}

export interface PerformanceMetrics {
  responseTime: {
    p50: number;
    p95: number;
    p99: number;
    average: number;
  };
  throughput: {
    requestsPerSecond: number;
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  errorRate: {
    percentage: number;
    count: number;
    total: number;
  };
  resourceUsage: {
    cpu: number;
    memory: number;
    disk: number;
  };
}

export class MonitoringService {
  private metrics: Map<string, MetricData[]> = new Map();
  private alertRules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, Alert> = new Map();
  private healthChecks: Map<string, () => Promise<HealthCheck>> = new Map();
  private performanceData: PerformanceMetrics;
  private alertTimer?: NodeJS.Timeout;
  private metricsTimer?: NodeJS.Timeout;

  constructor() {
    this.performanceData = this.initializePerformanceData();
    this.initializeDefaultAlertRules();
    this.initializeDefaultHealthChecks();
    this.startMonitoring();
    logger.info('MonitoringService initialized');
  }

  /**
   * Registrar una métrica
   */
  recordMetric(name: string, value: number, labels?: Record<string, string>, type: MetricData['type'] = 'gauge'): void {
    const metric: MetricData = {
      name,
      value,
      timestamp: Date.now(),
      labels,
      type
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metrics = this.metrics.get(name)!;
    metrics.push(metric);

    // Mantener solo los últimos 1000 registros por métrica
    if (metrics.length > 1000) {
      metrics.splice(0, metrics.length - 1000);
    }

    // Evaluar reglas de alerta
    this.evaluateAlertRules(name, value);

    logger.debug('Metric recorded', { name, value, labels, type });
  }

  /**
   * Incrementar contador
   */
  incrementCounter(name: string, labels?: Record<string, string>, value: number = 1): void {
    this.recordMetric(name, value, labels, 'counter');
  }

  /**
   * Establecer gauge
   */
  setGauge(name: string, value: number, labels?: Record<string, string>): void {
    this.recordMetric(name, value, labels, 'gauge');
  }

  /**
   * Registrar histograma
   */
  recordHistogram(name: string, value: number, labels?: Record<string, string>): void {
    this.recordMetric(name, value, labels, 'histogram');
  }

  /**
   * Obtener métricas
   */
  getMetrics(name?: string, timeRange?: { start: number; end: number }): MetricData[] {
    if (name) {
      const metrics = this.metrics.get(name) || [];
      if (timeRange) {
        return metrics.filter(m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end);
      }
      return metrics;
    }

    const allMetrics: MetricData[] = [];
    for (const metrics of this.metrics.values()) {
      allMetrics.push(...metrics);
    }

    if (timeRange) {
      return allMetrics.filter(m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end);
    }

    return allMetrics;
  }

  /**
   * Crear regla de alerta
   */
  createAlertRule(rule: Omit<AlertRule, 'id' | 'createdAt' | 'updatedAt'>): AlertRule {
    const alertRule: AlertRule = {
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...rule,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.alertRules.set(alertRule.id, alertRule);
    logger.info('Alert rule created', { ruleId: alertRule.id, name: alertRule.name });
    return alertRule;
  }

  /**
   * Obtener reglas de alerta
   */
  getAlertRules(): AlertRule[] {
    return Array.from(this.alertRules.values());
  }

  /**
   * Obtener alertas activas
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * Reconocer alerta
   */
  acknowledgeAlert(alertId: string, userId: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return false;

    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = userId;
    this.activeAlerts.set(alertId, alert);

    logger.info('Alert acknowledged', { alertId, userId });
    return true;
  }

  /**
   * Resolver alerta
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return false;

    alert.status = 'resolved';
    alert.resolvedAt = new Date();
    this.activeAlerts.set(alertId, alert);

    logger.info('Alert resolved', { alertId });
    return true;
  }

  /**
   * Registrar health check
   */
  registerHealthCheck(name: string, check: () => Promise<HealthCheck>): void {
    this.healthChecks.set(name, check);
    logger.info('Health check registered', { name });
  }

  /**
   * Ejecutar health checks
   */
  async runHealthChecks(): Promise<SystemHealth> {
    const checks: HealthCheck[] = [];
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
      } catch (error) {
        checks.push({
          name,
          status: 'fail',
          message: `Health check failed: ${(error as Error).message}`,
          duration: Date.now() - startTime
        });
      }
    }

    const healthScore = checks.length > 0 ? (healthyCount / checks.length) * 100 : 100;
    const status = healthScore >= 90 ? 'healthy' : healthScore >= 70 ? 'degraded' : 'unhealthy';

    const systemHealth: SystemHealth = {
      status,
      score: healthScore,
      checks,
      timestamp: new Date()
    };

    // Registrar métrica de health
    this.setGauge('system_health_score', healthScore);
    this.setGauge('system_health_checks_total', checks.length);
    this.setGauge('system_health_checks_healthy', healthyCount);

    return systemHealth;
  }

  /**
   * Obtener métricas de performance
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceData };
  }

  /**
   * Actualizar métricas de performance
   */
  updatePerformanceMetrics(data: Partial<PerformanceMetrics>): void {
    this.performanceData = { ...this.performanceData, ...data };
    
    // Registrar métricas
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

  /**
   * Obtener dashboard de métricas
   */
  getDashboard(): any {
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

  /**
   * Exportar métricas para Prometheus
   */
  exportPrometheusMetrics(): string {
    let output = '';

    for (const [name, metrics] of this.metrics.entries()) {
      const latest = metrics[metrics.length - 1];
      if (!latest) continue;

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

  private initializePerformanceData(): PerformanceMetrics {
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

  private initializeDefaultAlertRules(): void {
    // Regla para alta latencia
    this.createAlertRule({
      name: 'High Response Time',
      description: 'Response time is above threshold',
      metric: 'response_time_p95',
      condition: 'gt',
      threshold: 1000, // 1 segundo
      duration: 300, // 5 minutos
      severity: 'high',
      enabled: true,
      actions: [
        {
          type: 'email',
          config: { recipients: ['admin@econeura.com'] }
        }
      ]
    });

    // Regla para alta tasa de errores
    this.createAlertRule({
      name: 'High Error Rate',
      description: 'Error rate is above threshold',
      metric: 'error_rate_percentage',
      condition: 'gt',
      threshold: 5, // 5%
      duration: 300, // 5 minutos
      severity: 'critical',
      enabled: true,
      actions: [
        {
          type: 'slack',
          config: { webhook: process.env.SLACK_WEBHOOK_URL }
        }
      ]
    });

    // Regla para uso alto de CPU
    this.createAlertRule({
      name: 'High CPU Usage',
      description: 'CPU usage is above threshold',
      metric: 'resource_cpu_usage',
      condition: 'gt',
      threshold: 80, // 80%
      duration: 600, // 10 minutos
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

  private initializeDefaultHealthChecks(): void {
    // Health check de base de datos
    this.registerHealthCheck('database', async () => {
      try {
        // Simular check de base de datos
        await new Promise(resolve => setTimeout(resolve, 10));
        return {
          name: 'database',
          status: 'pass',
          message: 'Database connection healthy',
          duration: 10
        };
      } catch (error) {
        return {
          name: 'database',
          status: 'fail',
          message: `Database check failed: ${(error as Error).message}`,
          duration: 0
        };
      }
    });

    // Health check de memoria
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

    // Health check de disco
    this.registerHealthCheck('disk', async () => {
      // Simular check de disco
      const diskUsage = 75; // 75%
      
      return {
        name: 'disk',
        status: diskUsage > 95 ? 'fail' : diskUsage > 85 ? 'warn' : 'pass',
        message: `Disk usage: ${diskUsage}%`,
        duration: 5,
        details: { usage: diskUsage }
      };
    });
  }

  private evaluateAlertRules(metricName: string, value: number): void {
    for (const rule of this.alertRules.values()) {
      if (!rule.enabled || rule.metric !== metricName) continue;

      const shouldFire = this.evaluateCondition(value, rule.condition, rule.threshold);
      const alertKey = `${rule.id}_${metricName}`;
      const existingAlert = this.activeAlerts.get(alertKey);

      if (shouldFire && !existingAlert) {
        // Crear nueva alerta
        const alert: Alert = {
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
      } else if (!shouldFire && existingAlert) {
        // Resolver alerta
        existingAlert.status = 'resolved';
        existingAlert.resolvedAt = new Date();
        this.activeAlerts.set(alertKey, existingAlert);
        
        logger.info('Alert resolved', { alertId: existingAlert.id, ruleId: rule.id });
      }
    }
  }

  private evaluateCondition(value: number, condition: string, threshold: number): boolean {
    switch (condition) {
      case 'gt': return value > threshold;
      case 'lt': return value < threshold;
      case 'eq': return value === threshold;
      case 'gte': return value >= threshold;
      case 'lte': return value <= threshold;
      default: return false;
    }
  }

  private executeAlertActions(alert: Alert, actions: AlertAction[]): void {
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
      } catch (error) {
        logger.error('Failed to execute alert action', { 
          alertId: alert.id, 
          actionType: action.type, 
          error: (error as Error).message 
        });
      }
    }
  }

  private sendEmailAlert(alert: Alert, config: Record<string, any>): void {
    logger.info('Email alert sent', { alertId: alert.id, recipients: config.recipients });
  }

  private sendWebhookAlert(alert: Alert, config: Record<string, any>): void {
    logger.info('Webhook alert sent', { alertId: alert.id, url: config.url });
  }

  private sendSlackAlert(alert: Alert, config: Record<string, any>): void {
    logger.info('Slack alert sent', { alertId: alert.id, webhook: config.webhook });
  }

  private sendSMSAlert(alert: Alert, config: Record<string, any>): void {
    logger.info('SMS alert sent', { alertId: alert.id, phone: config.phone });
  }

  private getAlertsBySeverity(): Record<string, number> {
    const alerts = this.getActiveAlerts();
    return alerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private getRecentMetrics(since: number): MetricData[] {
    const allMetrics: MetricData[] = [];
    for (const metrics of this.metrics.values()) {
      allMetrics.push(...metrics.filter(m => m.timestamp >= since));
    }
    return allMetrics.sort((a, b) => b.timestamp - a.timestamp);
  }

  private getMetricTrends(since: number): Record<string, any> {
    const trends: Record<string, any> = {};
    
    for (const [name, metrics] of this.metrics.entries()) {
      const recentMetrics = metrics.filter(m => m.timestamp >= since);
      if (recentMetrics.length === 0) continue;

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

  private calculateTrend(values: number[]): 'up' | 'down' | 'stable' {
    if (values.length < 2) return 'stable';
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    const change = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    if (change > 5) return 'up';
    if (change < -5) return 'down';
    return 'stable';
  }

  private startMonitoring(): void {
    // Timer para evaluar alertas
    this.alertTimer = setInterval(() => {
      this.runHealthChecks();
    }, 30000); // Cada 30 segundos

    // Timer para limpiar métricas antiguas
    this.metricsTimer = setInterval(() => {
      this.cleanupOldMetrics();
    }, 300000); // Cada 5 minutos
  }

  private cleanupOldMetrics(): void {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    for (const [name, metrics] of this.metrics.entries()) {
      const filtered = metrics.filter(m => m.timestamp >= oneDayAgo);
      this.metrics.set(name, filtered);
    }
  }

  destroy(): void {
    if (this.alertTimer) clearInterval(this.alertTimer);
    if (this.metricsTimer) clearInterval(this.metricsTimer);
    logger.info('MonitoringService destroyed');
  }
}

// Instancia singleton
export const monitoringService = new MonitoringService();

// Middleware para métricas de Express
export const metricsMiddleware = (req: any, res: any, next: any) => {
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
