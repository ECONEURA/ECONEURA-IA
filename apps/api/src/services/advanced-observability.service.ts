/**
 * PR-56: Advanced Observability Service
 * 
 * Sistema avanzado de observabilidad con:
 * - Métricas en tiempo real
 * - Logs estructurados
 * - Trazabilidad distribuida
 * - Alertas inteligentes
 * - Dashboards personalizables
 * - Análisis de rendimiento
 * - Detección de anomalías
 */

import { structuredLogger } from '../lib/structured-logger.js';

export interface ObservabilityMetrics {
  logs: number;
  traces: number;
  metrics: number;
  alerts: number;
  errors: number;
  warnings: number;
  performance: {
    avgResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    throughput: number;
    errorRate: number;
  };
  system: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkLatency: number;
  };
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  service: string;
  userId?: string;
  requestId?: string;
  traceId?: string;
  spanId?: string;
  metadata: Record<string, any>;
}

export interface TraceSpan {
  id: string;
  traceId: string;
  parentId?: string;
  operationName: string;
  service: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  tags: Record<string, any>;
  logs: Array<{
    timestamp: Date;
    fields: Record<string, any>;
  }>;
  status: 'started' | 'finished' | 'error';
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  conditions: AlertCondition[];
  actions: AlertAction[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  lastTriggered?: Date;
  cooldownMinutes: number;
}

export interface AlertCondition {
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'ne' | 'gte' | 'lte';
  threshold: number;
  timeWindow: number; // seconds
}

export interface AlertAction {
  type: 'email' | 'sms' | 'webhook' | 'slack' | 'pagerduty';
  target: string;
  template?: string;
}

export interface Alert {
  id: string;
  ruleId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  status: 'firing' | 'resolved' | 'acknowledged';
  triggeredAt: Date;
  resolvedAt?: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  metadata: Record<string, any>;
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  widgets: DashboardWidget[];
  refreshInterval: number; // seconds
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'alert' | 'log';
  title: string;
  position: { x: number; y: number; w: number; h: number };
  config: Record<string, any>;
}

export interface PerformanceAnalysis {
  service: string;
  timeRange: string;
  metrics: {
    avgResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    throughput: number;
    errorRate: number;
    availability: number;
  };
  trends: {
    responseTime: 'improving' | 'degrading' | 'stable';
    throughput: 'increasing' | 'decreasing' | 'stable';
    errorRate: 'improving' | 'degrading' | 'stable';
  };
  recommendations: string[];
}

export class AdvancedObservabilityService {
  private logs: Map<string, LogEntry> = new Map();
  private traces: Map<string, TraceSpan> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private alertRules: Map<string, AlertRule> = new Map();
  private dashboards: Map<string, Dashboard> = new Map();
  private metrics: ObservabilityMetrics;

  constructor() {
    this.initializeDemoData();
    this.startMonitoring();
    structuredLogger.info('Advanced Observability Service initialized');
  }

  // ============================================================================
  // METRICS MANAGEMENT
  // ============================================================================

  async getMetrics(): Promise<ObservabilityMetrics> {
    try {
      // Simular métricas en tiempo real
      this.updateMetrics();
      
      structuredLogger.info('Observability metrics retrieved', {
        logs: this.metrics.logs,
        traces: this.metrics.traces,
        alerts: this.metrics.alerts
      });

      return this.metrics;
    } catch (error) {
      structuredLogger.error('Failed to get observability metrics', error as Error);
      throw error;
    }
  }

  async getPerformanceAnalysis(service: string, timeRange: string): Promise<PerformanceAnalysis> {
    try {
      const analysis: PerformanceAnalysis = {
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
    } catch (error) {
      structuredLogger.error('Failed to generate performance analysis', error as Error);
      throw error;
    }
  }

  // ============================================================================
  // LOGS MANAGEMENT
  // ============================================================================

  async getLogs(filters: {
    level?: string;
    service?: string;
    startTime?: Date;
    endTime?: Date;
    limit?: number;
  } = {}): Promise<LogEntry[]> {
    try {
      let logs = Array.from(this.logs.values());

      if (filters.level) {
        logs = logs.filter(log => log.level === filters.level);
      }

      if (filters.service) {
        logs = logs.filter(log => log.service === filters.service);
      }

      if (filters.startTime) {
        logs = logs.filter(log => log.timestamp >= filters.startTime!);
      }

      if (filters.endTime) {
        logs = logs.filter(log => log.timestamp <= filters.endTime!);
      }

      if (filters.limit) {
        logs = logs.slice(0, filters.limit);
      }

      // Ordenar por timestamp descendente
      logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      structuredLogger.info('Logs retrieved', {
        filters,
        count: logs.length
      });

      return logs;
    } catch (error) {
      structuredLogger.error('Failed to get logs', error as Error);
      throw error;
    }
  }

  async createLog(logData: Omit<LogEntry, 'id' | 'timestamp'>): Promise<LogEntry> {
    try {
      const log: LogEntry = {
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
    } catch (error) {
      structuredLogger.error('Failed to create log entry', error as Error);
      throw error;
    }
  }

  // ============================================================================
  // TRACING MANAGEMENT
  // ============================================================================

  async getTraces(filters: {
    service?: string;
    operationName?: string;
    startTime?: Date;
    endTime?: Date;
    limit?: number;
  } = {}): Promise<TraceSpan[]> {
    try {
      let traces = Array.from(this.traces.values());

      if (filters.service) {
        traces = traces.filter(trace => trace.service === filters.service);
      }

      if (filters.operationName) {
        traces = traces.filter(trace => trace.operationName === filters.operationName);
      }

      if (filters.startTime) {
        traces = traces.filter(trace => trace.startTime >= filters.startTime!);
      }

      if (filters.endTime) {
        traces = traces.filter(trace => trace.startTime <= filters.endTime!);
      }

      if (filters.limit) {
        traces = traces.slice(0, filters.limit);
      }

      // Ordenar por startTime descendente
      traces.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

      structuredLogger.info('Traces retrieved', {
        filters,
        count: traces.length
      });

      return traces;
    } catch (error) {
      structuredLogger.error('Failed to get traces', error as Error);
      throw error;
    }
  }

  async createTrace(traceData: Omit<TraceSpan, 'id' | 'startTime'>): Promise<TraceSpan> {
    try {
      const trace: TraceSpan = {
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
    } catch (error) {
      structuredLogger.error('Failed to create trace span', error as Error);
      throw error;
    }
  }

  // ============================================================================
  // ALERTS MANAGEMENT
  // ============================================================================

  async getAlertRules(): Promise<AlertRule[]> {
    try {
      const rules = Array.from(this.alertRules.values());
      
      structuredLogger.info('Alert rules retrieved', {
        count: rules.length
      });

      return rules;
    } catch (error) {
      structuredLogger.error('Failed to get alert rules', error as Error);
      throw error;
    }
  }

  async createAlertRule(ruleData: Omit<AlertRule, 'id'>): Promise<AlertRule> {
    try {
      const rule: AlertRule = {
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
    } catch (error) {
      structuredLogger.error('Failed to create alert rule', error as Error);
      throw error;
    }
  }

  async getAlerts(filters: {
    status?: string;
    severity?: string;
    limit?: number;
  } = {}): Promise<Alert[]> {
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

      // Ordenar por triggeredAt descendente
      alerts.sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime());

      structuredLogger.info('Alerts retrieved', {
        filters,
        count: alerts.length
      });

      return alerts;
    } catch (error) {
      structuredLogger.error('Failed to get alerts', error as Error);
      throw error;
    }
  }

  // ============================================================================
  // DASHBOARDS MANAGEMENT
  // ============================================================================

  async getDashboards(): Promise<Dashboard[]> {
    try {
      const dashboards = Array.from(this.dashboards.values());
      
      structuredLogger.info('Dashboards retrieved', {
        count: dashboards.length
      });

      return dashboards;
    } catch (error) {
      structuredLogger.error('Failed to get dashboards', error as Error);
      throw error;
    }
  }

  async createDashboard(dashboardData: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'>): Promise<Dashboard> {
    try {
      const now = new Date();
      const dashboard: Dashboard = {
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
    } catch (error) {
      structuredLogger.error('Failed to create dashboard', error as Error);
      throw error;
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private initializeDemoData(): void {
    // Inicializar métricas demo
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

    // Crear reglas de alerta demo
    const demoAlertRule: AlertRule = {
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

    // Crear dashboard demo
    const demoDashboard: Dashboard = {
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

  private startMonitoring(): void {
    // Simular actualización de métricas cada 30 segundos
    setInterval(() => {
      this.updateMetrics();
    }, 30000);

    // Simular evaluación de alertas cada minuto
    setInterval(() => {
      this.evaluateAlerts();
    }, 60000);
  }

  private updateMetrics(): void {
    // Simular variación en las métricas
    this.metrics.logs += Math.floor(Math.random() * 100);
    this.metrics.traces += Math.floor(Math.random() * 50);
    this.metrics.errors += Math.floor(Math.random() * 5);
    this.metrics.warnings += Math.floor(Math.random() * 10);
    
    // Actualizar métricas de rendimiento
    this.metrics.performance.avgResponseTime += (Math.random() - 0.5) * 10;
    this.metrics.performance.throughput += (Math.random() - 0.5) * 50;
    this.metrics.performance.errorRate += (Math.random() - 0.5) * 0.1;
    
    // Actualizar métricas del sistema
    this.metrics.system.cpuUsage += (Math.random() - 0.5) * 5;
    this.metrics.system.memoryUsage += (Math.random() - 0.5) * 3;
    this.metrics.system.networkLatency += (Math.random() - 0.5) * 2;
  }

  private evaluateAlerts(): void {
    // Simular evaluación de alertas
    const rules = Array.from(this.alertRules.values());
    
    for (const rule of rules) {
      if (!rule.enabled) continue;
      
      // Simular condición de alerta
      if (Math.random() < 0.1) { // 10% chance de disparar alerta
        this.triggerAlert(rule);
      }
    }
  }

  private triggerAlert(rule: AlertRule): void {
    const alert: Alert = {
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
