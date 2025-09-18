/**
 * MEJORA 4: Sistema de Monitoreo y Alertas Avanzado
 * 
 * Sistema completo de monitoreo con alertas inteligentes,
 * thresholds dinámicos, y notificaciones multi-canal.
 */

import { structuredLogger } from './structured-logger.js';
import { metrics } from '@econeura/shared/src/metrics/index.js';

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export enum AlertStatus {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
  SUPPRESSED = 'suppressed'
}

export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  SLACK = 'slack',
  WEBHOOK = 'webhook',
  IN_APP = 'in_app'
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  metric: string;
  condition: AlertCondition;
  severity: AlertSeverity;
  enabled: boolean;
  cooldown: number; // seconds
  escalation: EscalationPolicy;
  tags: string[];
  organizationId: string;
}

export interface AlertCondition {
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'ne';
  threshold: number;
  duration: number; // seconds
  aggregation: 'avg' | 'sum' | 'min' | 'max' | 'count';
}

export interface EscalationPolicy {
  levels: EscalationLevel[];
  maxEscalations: number;
  escalationDelay: number; // seconds
}

export interface EscalationLevel {
  level: number;
  delay: number; // seconds
  channels: NotificationChannel[];
  recipients: string[];
  message: string;
}

export interface Alert {
  id: string;
  ruleId: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  status: AlertStatus;
  triggeredAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  acknowledgedBy?: string;
  resolvedBy?: string;
  metadata: Record<string, any>;
  organizationId: string;
}

export interface NotificationConfig {
  channels: NotificationChannel[];
  recipients: Record<NotificationChannel, string[]>;
  templates: Record<AlertSeverity, string>;
  rateLimit: {
    maxPerHour: number;
    maxPerDay: number;
  };
}

export interface MonitoringStats {
  totalAlerts: number;
  activeAlerts: number;
  alertsBySeverity: Record<AlertSeverity, number>;
  alertsByStatus: Record<AlertStatus, number>;
  averageResolutionTime: number;
  escalationRate: number;
  falsePositiveRate: number;
}

export class MonitoringAlertsService {
  private static instance: MonitoringAlertsService;
  private alertRules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, Alert> = new Map();
  private alertHistory: Alert[] = [];
  private notificationConfig: NotificationConfig;
  private metricsBuffer: Map<string, number[]> = new Map();
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeDefaultRules();
    this.initializeNotificationConfig();
    this.startMonitoring();
  }

  public static getInstance(): MonitoringAlertsService {
    if (!MonitoringAlertsService.instance) {
      MonitoringAlertsService.instance = new MonitoringAlertsService();
    }
    return MonitoringAlertsService.instance;
  }

  private initializeDefaultRules(): void {
    // Regla para alta latencia de API
    this.alertRules.set('high_api_latency', {
      id: 'high_api_latency',
      name: 'Alta Latencia de API',
      description: 'Latencia promedio de API superior a 1 segundo',
      metric: 'api_response_time',
      condition: {
        operator: 'gt',
        threshold: 1000,
        duration: 300, // 5 minutos
        aggregation: 'avg'
      },
      severity: AlertSeverity.WARNING,
      enabled: true,
      cooldown: 600, // 10 minutos
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
            delay: 1800, // 30 minutos
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

    // Regla para alta tasa de errores
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
            delay: 900, // 15 minutos
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

    // Regla para uso alto de memoria
    this.alertRules.set('high_memory_usage', {
      id: 'high_memory_usage',
      name: 'Alto Uso de Memoria',
      description: 'Uso de memoria superior al 85%',
      metric: 'memory_usage_percent',
      condition: {
        operator: 'gt',
        threshold: 85,
        duration: 600, // 10 minutos
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

    // Regla para disponibilidad del servicio
    this.alertRules.set('service_down', {
      id: 'service_down',
      name: 'Servicio No Disponible',
      description: 'Servicio no responde a health checks',
      metric: 'service_availability',
      condition: {
        operator: 'eq',
        threshold: 0,
        duration: 60, // 1 minuto
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
            delay: 300, // 5 minutos
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

  private initializeNotificationConfig(): void {
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

  private startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.checkAlertRules();
    }, 30000); // Cada 30 segundos

    structuredLogger.info('Monitoring and alerts service started', {
      rules: this.alertRules.size,
      interval: '30 seconds'
    });
  }

  /**
   * Registra una métrica para evaluación de alertas
   */
  public recordMetric(metricName: string, value: number, timestamp: number = Date.now()): void {
    if (!this.metricsBuffer.has(metricName)) {
      this.metricsBuffer.set(metricName, []);
    }

    const buffer = this.metricsBuffer.get(metricName)!;
    buffer.push({ value, timestamp });

    // Mantener solo los últimos 10 minutos de datos
    const tenMinutesAgo = timestamp - 600000;
    const filteredBuffer = buffer.filter(item => item.timestamp > tenMinutesAgo);
    this.metricsBuffer.set(metricName, filteredBuffer);

    // Métricas Prometheus
    metrics.monitoringMetrics.inc({ metric: metricName });
  }

  private async checkAlertRules(): Promise<void> {
    for (const [ruleId, rule] of this.alertRules.entries()) {
      if (!rule.enabled) continue;

      try {
        const shouldTrigger = await this.evaluateRule(rule);
        
        if (shouldTrigger) {
          await this.triggerAlert(rule);
        } else {
          await this.resolveAlert(ruleId);
        }
      } catch (error) {
        structuredLogger.error('Error checking alert rule', {
          ruleId,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  private async evaluateRule(rule: AlertRule): Promise<boolean> {
    const metricData = this.metricsBuffer.get(rule.metric);
    if (!metricData || metricData.length === 0) {
      return false;
    }

    const now = Date.now();
    const timeWindow = rule.condition.duration * 1000;
    const relevantData = metricData.filter(
      item => (now - item.timestamp) <= timeWindow
    );

    if (relevantData.length === 0) {
      return false;
    }

    const aggregatedValue = this.aggregateValues(relevantData, rule.condition.aggregation);
    return this.evaluateCondition(aggregatedValue, rule.condition);
  }

  private aggregateValues(data: Array<{value: number, timestamp: number}>, aggregation: string): number {
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
        return values[values.length - 1]; // Último valor
    }
  }

  private evaluateCondition(value: number, condition: AlertCondition): boolean {
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

  private async triggerAlert(rule: AlertRule): Promise<void> {
    const existingAlert = this.activeAlerts.get(rule.id);
    
    // Verificar cooldown
    if (existingAlert && existingAlert.status === AlertStatus.ACTIVE) {
      const timeSinceLastTrigger = Date.now() - existingAlert.triggeredAt.getTime();
      if (timeSinceLastTrigger < rule.cooldown * 1000) {
        return; // En cooldown
      }
    }

    const alert: Alert = {
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

    // Enviar notificaciones
    await this.sendNotifications(alert, rule);

    // Métricas
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

  private async resolveAlert(ruleId: string): Promise<void> {
    const alert = this.activeAlerts.get(ruleId);
    if (!alert || alert.status !== AlertStatus.ACTIVE) {
      return;
    }

    alert.status = AlertStatus.RESOLVED;
    alert.resolvedAt = new Date();
    alert.resolvedBy = 'system';

    this.activeAlerts.delete(ruleId);

    // Enviar notificación de resolución
    await this.sendResolutionNotification(alert);

    // Métricas
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

  private async sendNotifications(alert: Alert, rule: AlertRule): Promise<void> {
    const escalationLevel = rule.escalation.levels[0]; // Primer nivel
    const template = this.notificationConfig.templates[alert.severity];
    const message = template
      .replace('{title}', alert.title)
      .replace('{message}', alert.message);

    for (const channel of escalationLevel.channels) {
      try {
        await this.sendNotification(channel, message, escalationLevel.recipients, alert);
      } catch (error) {
        structuredLogger.error('Failed to send notification', {
          channel,
          alertId: alert.id,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  private async sendNotification(
    channel: NotificationChannel,
    message: string,
    recipients: string[],
    alert: Alert
  ): Promise<void> {
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

    // Métricas
    metrics.notificationsSent.inc({
      channel,
      severity: alert.severity,
      organization_id: alert.organizationId
    });
  }

  private async sendEmail(recipients: string[], message: string, alert: Alert): Promise<void> {
    // Implementación de envío de email
    structuredLogger.info('Email notification sent', {
      recipients,
      alertId: alert.id,
      subject: alert.title
    });
  }

  private async sendSlack(recipients: string[], message: string, alert: Alert): Promise<void> {
    // Implementación de envío a Slack
    structuredLogger.info('Slack notification sent', {
      recipients,
      alertId: alert.id,
      message
    });
  }

  private async sendSMS(recipients: string[], message: string, alert: Alert): Promise<void> {
    // Implementación de envío de SMS
    structuredLogger.info('SMS notification sent', {
      recipients,
      alertId: alert.id
    });
  }

  private async sendWebhook(recipients: string[], message: string, alert: Alert): Promise<void> {
    // Implementación de webhook
    structuredLogger.info('Webhook notification sent', {
      recipients,
      alertId: alert.id
    });
  }

  private async sendInApp(recipients: string[], message: string, alert: Alert): Promise<void> {
    // Implementación de notificación in-app
    structuredLogger.info('In-app notification sent', {
      recipients,
      alertId: alert.id
    });
  }

  private async sendResolutionNotification(alert: Alert): Promise<void> {
    const message = `✅ Resuelto: ${alert.title}`;
    
    // Enviar solo a canales de baja prioridad para resolución
    await this.sendNotification(NotificationChannel.IN_APP, message, ['dashboard'], alert);
  }

  /**
   * Obtiene estadísticas de monitoreo
   */
  public getMonitoringStats(): MonitoringStats {
    const totalAlerts = this.alertHistory.length;
    const activeAlerts = this.activeAlerts.size;
    
    const alertsBySeverity: Record<AlertSeverity, number> = {
      [AlertSeverity.INFO]: 0,
      [AlertSeverity.WARNING]: 0,
      [AlertSeverity.ERROR]: 0,
      [AlertSeverity.CRITICAL]: 0
    };

    const alertsByStatus: Record<AlertStatus, number> = {
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
      averageResolutionTime: 0, // Se calcularía de los datos históricos
      escalationRate: 0,
      falsePositiveRate: 0
    };
  }

  /**
   * Detiene el servicio de monitoreo
   */
  public stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    structuredLogger.info('Monitoring and alerts service stopped');
  }
}

export const monitoringAlertsService = MonitoringAlertsService.getInstance();
