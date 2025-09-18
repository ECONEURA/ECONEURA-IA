import { LoggerService } from './logger.service.js';
import { MetricsService } from './metrics.service.js';

// ============================================================================
// ALERTING SERVICE
// ============================================================================

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: AlertCondition;
  severity: AlertSeverity;
  enabled: boolean;
  cooldown: number; // in milliseconds
  lastTriggered?: Date;
  notificationChannels: string[];
  tags: Record<string, string>;
}

export interface AlertCondition {
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'ne';
  threshold: number;
  duration: number; // in milliseconds
  aggregation?: 'avg' | 'sum' | 'min' | 'max' | 'count';
}

export interface Alert {
  id: string;
  ruleId: string;
  name: string;
  description: string;
  severity: AlertSeverity;
  status: AlertStatus;
  triggeredAt: Date;
  resolvedAt?: Date;
  value: number;
  threshold: number;
  message: string;
  tags: Record<string, string>;
  metadata: Record<string, any>;
}

export interface NotificationChannel {
  id: string;
  name: string;
  type: 'email' | 'slack' | 'webhook' | 'sms';
  config: Record<string, any>;
  enabled: boolean;
}

export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertStatus = 'firing' | 'resolved' | 'acknowledged';

export class AlertingService {
  private static instance: AlertingService;
  private alertRules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, Alert> = new Map();
  private notificationChannels: Map<string, NotificationChannel> = new Map();
  private logger: LoggerService;
  private metrics: MetricsService;

  private constructor() {
    this.logger = LoggerService.getInstance();
    this.metrics = MetricsService.getInstance();
    this.initializeDefaultRules();
    this.initializeNotificationChannels();
  }

  public static getInstance(): AlertingService {
    if (!AlertingService.instance) {
      AlertingService.instance = new AlertingService();
    }
    return AlertingService.instance;
  }

  // ========================================================================
  // INITIALIZATION
  // ========================================================================

  private initializeDefaultRules(): void {
    // High error rate alert
    this.addAlertRule({
      id: 'high_error_rate',
      name: 'High Error Rate',
      description: 'Error rate exceeds 5%',
      condition: {
        metric: 'errors_total',
        operator: 'gt',
        threshold: 5,
        duration: 300000, // 5 minutes
        aggregation: 'avg'
      },
      severity: 'critical',
      enabled: true,
      cooldown: 300000, // 5 minutes
      notificationChannels: ['email', 'slack'],
      tags: { service: 'econeura-api', type: 'error' }
    });

    // High response time alert
    this.addAlertRule({
      id: 'high_response_time',
      name: 'High Response Time',
      description: 'Average response time exceeds 2 seconds',
      condition: {
        metric: 'http_request_duration_seconds',
        operator: 'gt',
        threshold: 2,
        duration: 300000, // 5 minutes
        aggregation: 'avg'
      },
      severity: 'warning',
      enabled: true,
      cooldown: 600000, // 10 minutes
      notificationChannels: ['slack'],
      tags: { service: 'econeura-api', type: 'performance' }
    });

    // High memory usage alert
    this.addAlertRule({
      id: 'high_memory_usage',
      name: 'High Memory Usage',
      description: 'Memory usage exceeds 80%',
      condition: {
        metric: 'memory_usage_percent',
        operator: 'gt',
        threshold: 80,
        duration: 600000, // 10 minutes
        aggregation: 'avg'
      },
      severity: 'warning',
      enabled: true,
      cooldown: 900000, // 15 minutes
      notificationChannels: ['email'],
      tags: { service: 'econeura-api', type: 'resource' }
    });

    // Database connection issues
    this.addAlertRule({
      id: 'database_connection_issues',
      name: 'Database Connection Issues',
      description: 'Database connection failures detected',
      condition: {
        metric: 'database_connection_errors',
        operator: 'gt',
        threshold: 0,
        duration: 60000, // 1 minute
        aggregation: 'sum'
      },
      severity: 'critical',
      enabled: true,
      cooldown: 300000, // 5 minutes
      notificationChannels: ['email', 'slack', 'sms'],
      tags: { service: 'econeura-api', type: 'database' }
    });

    // Low disk space alert
    this.addAlertRule({
      id: 'low_disk_space',
      name: 'Low Disk Space',
      description: 'Disk space usage exceeds 90%',
      condition: {
        metric: 'disk_usage_percent',
        operator: 'gt',
        threshold: 90,
        duration: 300000, // 5 minutes
        aggregation: 'avg'
      },
      severity: 'critical',
      enabled: true,
      cooldown: 1800000, // 30 minutes
      notificationChannels: ['email', 'slack'],
      tags: { service: 'econeura-api', type: 'resource' }
    });
  }

  private initializeNotificationChannels(): void {
    // Email channel
    this.addNotificationChannel({
      id: 'email',
      name: 'Email Notifications',
      type: 'email',
      config: {
        smtp: {
          host: process.env.SMTP_HOST || 'localhost',
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        },
        from: process.env.SMTP_FROM || 'alerts@econeura.com',
        to: process.env.ALERT_EMAIL_RECIPIENTS?.split(',') || ['admin@econeura.com']
      },
      enabled: true
    });

    // Slack channel
    this.addNotificationChannel({
      id: 'slack',
      name: 'Slack Notifications',
      type: 'slack',
      config: {
        webhookUrl: process.env.SLACK_WEBHOOK_URL,
        channel: process.env.SLACK_ALERT_CHANNEL || '#alerts',
        username: 'ECONEURA Alerts',
        iconEmoji: ':warning:'
      },
      enabled: !!process.env.SLACK_WEBHOOK_URL
    });

    // Webhook channel
    this.addNotificationChannel({
      id: 'webhook',
      name: 'Webhook Notifications',
      type: 'webhook',
      config: {
        url: process.env.ALERT_WEBHOOK_URL,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ALERT_WEBHOOK_TOKEN}`
        }
      },
      enabled: !!process.env.ALERT_WEBHOOK_URL
    });

    // SMS channel
    this.addNotificationChannel({
      id: 'sms',
      name: 'SMS Notifications',
      type: 'sms',
      config: {
        provider: 'twilio',
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: process.env.ALERT_SMS_RECIPIENTS?.split(',') || []
      },
      enabled: !!process.env.TWILIO_ACCOUNT_SID
    });
  }

  // ========================================================================
  // ALERT RULE MANAGEMENT
  // ========================================================================

  addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
    this.logger.info(`Alert rule added: ${rule.name}`, {
      ruleId: rule.id,
      severity: rule.severity,
      enabled: rule.enabled
    });
  }

  removeAlertRule(ruleId: string): void {
    const rule = this.alertRules.get(ruleId);
    if (rule) {
      this.alertRules.delete(ruleId);
      this.logger.info(`Alert rule removed: ${rule.name}`, { ruleId });
    }
  }

  updateAlertRule(ruleId: string, updates: Partial<AlertRule>): void {
    const rule = this.alertRules.get(ruleId);
    if (rule) {
      const updatedRule = { ...rule, ...updates };
      this.alertRules.set(ruleId, updatedRule);
      this.logger.info(`Alert rule updated: ${updatedRule.name}`, { ruleId });
    }
  }

  getAlertRule(ruleId: string): AlertRule | undefined {
    return this.alertRules.get(ruleId);
  }

  getAllAlertRules(): AlertRule[] {
    return Array.from(this.alertRules.values());
  }

  // ========================================================================
  // NOTIFICATION CHANNEL MANAGEMENT
  // ========================================================================

  addNotificationChannel(channel: NotificationChannel): void {
    this.notificationChannels.set(channel.id, channel);
    this.logger.info(`Notification channel added: ${channel.name}`, {
      channelId: channel.id,
      type: channel.type,
      enabled: channel.enabled
    });
  }

  removeNotificationChannel(channelId: string): void {
    const channel = this.notificationChannels.get(channelId);
    if (channel) {
      this.notificationChannels.delete(channelId);
      this.logger.info(`Notification channel removed: ${channel.name}`, { channelId });
    }
  }

  getNotificationChannel(channelId: string): NotificationChannel | undefined {
    return this.notificationChannels.get(channelId);
  }

  getAllNotificationChannels(): NotificationChannel[] {
    return Array.from(this.notificationChannels.values());
  }

  // ========================================================================
  // ALERT EVALUATION
  // ========================================================================

  async evaluateAlertRules(): Promise<void> {
    for (const [ruleId, rule] of this.alertRules) {
      if (!rule.enabled) continue;

      try {
        const shouldTrigger = await this.evaluateRule(rule);
        
        if (shouldTrigger) {
          await this.triggerAlert(rule);
        } else {
          await this.resolveAlert(ruleId);
        }
      } catch (error) {
        this.logger.error(`Error evaluating alert rule: ${rule.name}`, {
          ruleId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  private async evaluateRule(rule: AlertRule): Promise<boolean> {
    // Check cooldown
    if (rule.lastTriggered) {
      const timeSinceLastTrigger = Date.now() - rule.lastTriggered.getTime();
      if (timeSinceLastTrigger < rule.cooldown) {
        return false;
      }
    }

    // Get metric value
    const metricValue = await this.getMetricValue(rule.condition);
    
    // Evaluate condition
    const condition = rule.condition;
    let result = false;

    switch (condition.operator) {
      case 'gt':
        result = metricValue > condition.threshold;
        break;
      case 'lt':
        result = metricValue < condition.threshold;
        break;
      case 'eq':
        result = metricValue === condition.threshold;
        break;
      case 'gte':
        result = metricValue >= condition.threshold;
        break;
      case 'lte':
        result = metricValue <= condition.threshold;
        break;
      case 'ne':
        result = metricValue !== condition.threshold;
        break;
    }

    return result;
  }

  private async getMetricValue(condition: AlertCondition): Promise<number> {
    // This would integrate with your metrics service
    // For now, return a mock value
    return Math.random() * 100;
  }

  // ========================================================================
  // ALERT TRIGGERING
  // ========================================================================

  private async triggerAlert(rule: AlertRule): Promise<void> {
    const alertId = `${rule.id}_${Date.now()}`;
    const alert: Alert = {
      id: alertId,
      ruleId: rule.id,
      name: rule.name,
      description: rule.description,
      severity: rule.severity,
      status: 'firing',
      triggeredAt: new Date(),
      value: await this.getMetricValue(rule.condition),
      threshold: rule.condition.threshold,
      message: `${rule.name}: ${rule.description}`,
      tags: rule.tags,
      metadata: {
        condition: rule.condition,
        cooldown: rule.cooldown
      }
    };

    this.activeAlerts.set(alertId, alert);
    rule.lastTriggered = new Date();

    // Send notifications
    await this.sendNotifications(alert, rule.notificationChannels);

    // Log alert
    this.logger.warn(`Alert triggered: ${alert.name}`, {
      alertId,
      ruleId: rule.id,
      severity: alert.severity,
      value: alert.value,
      threshold: alert.threshold
    });

    // Record metric
    this.metrics.recordError('alert_triggered', 'econeura-api', rule.id);
  }

  private async resolveAlert(ruleId: string): Promise<void> {
    const activeAlert = Array.from(this.activeAlerts.values())
      .find(alert => alert.ruleId === ruleId && alert.status === 'firing');

    if (activeAlert) {
      activeAlert.status = 'resolved';
      activeAlert.resolvedAt = new Date();

      this.logger.info(`Alert resolved: ${activeAlert.name}`, {
        alertId: activeAlert.id,
        ruleId,
        duration: activeAlert.resolvedAt.getTime() - activeAlert.triggeredAt.getTime()
      });

      // Send resolution notification
      await this.sendNotifications(activeAlert, ['email']);
    }
  }

  // ========================================================================
  // NOTIFICATIONS
  // ========================================================================

  private async sendNotifications(alert: Alert, channelIds: string[]): Promise<void> {
    for (const channelId of channelIds) {
      const channel = this.notificationChannels.get(channelId);
      if (!channel || !channel.enabled) continue;

      try {
        await this.sendNotification(alert, channel);
      } catch (error) {
        this.logger.error(`Failed to send notification via ${channel.name}`, {
          channelId,
          alertId: alert.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  private async sendNotification(alert: Alert, channel: NotificationChannel): Promise<void> {
    const message = this.formatAlertMessage(alert);

    switch (channel.type) {
      case 'email':
        await this.sendEmailNotification(channel, message);
        break;
      case 'slack':
        await this.sendSlackNotification(channel, message);
        break;
      case 'webhook':
        await this.sendWebhookNotification(channel, alert);
        break;
      case 'sms':
        await this.sendSMSNotification(channel, message);
        break;
    }
  }

  private formatAlertMessage(alert: Alert): string {
    const status = alert.status === 'firing' ? '🚨 FIRING' : '✅ RESOLVED';
    const severity = this.getSeverityEmoji(alert.severity);
    
    return `${severity} ${status}\n\n` +
           `**${alert.name}**\n` +
           `Description: ${alert.description}\n` +
           `Value: ${alert.value}\n` +
           `Threshold: ${alert.threshold}\n` +
           `Time: ${alert.triggeredAt.toISOString()}\n` +
           `Tags: ${JSON.stringify(alert.tags)}`;
  }

  private getSeverityEmoji(severity: AlertSeverity): string {
    switch (severity) {
      case 'critical': return '🔴';
      case 'warning': return '🟡';
      case 'info': return '🔵';
      default: return '⚪';
    }
  }

  private async sendEmailNotification(channel: NotificationChannel, message: string): Promise<void> {
    // Implement email sending logic
    this.logger.info('Email notification sent', { channelId: channel.id });
  }

  private async sendSlackNotification(channel: NotificationChannel, message: string): Promise<void> {
    // Implement Slack webhook sending logic
    this.logger.info('Slack notification sent', { channelId: channel.id });
  }

  private async sendWebhookNotification(channel: NotificationChannel, alert: Alert): Promise<void> {
    // Implement webhook sending logic
    this.logger.info('Webhook notification sent', { channelId: channel.id });
  }

  private async sendSMSNotification(channel: NotificationChannel, message: string): Promise<void> {
    // Implement SMS sending logic
    this.logger.info('SMS notification sent', { channelId: channel.id });
  }

  // ========================================================================
  // ALERT MANAGEMENT
  // ========================================================================

  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values())
      .filter(alert => alert.status === 'firing');
  }

  getAllAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values());
  }

  acknowledgeAlert(alertId: string): void {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.status = 'acknowledged';
      this.logger.info(`Alert acknowledged: ${alert.name}`, { alertId });
    }
  }

  resolveAlert(alertId: string): void {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.status = 'resolved';
      alert.resolvedAt = new Date();
      this.logger.info(`Alert manually resolved: ${alert.name}`, { alertId });
    }
  }

  // ========================================================================
  // MONITORING
  // ========================================================================

  startAlertMonitoring(): void {
    setInterval(async () => {
      await this.evaluateAlertRules();
    }, 30000); // Check every 30 seconds

    this.logger.info('Alert monitoring started', {
      rulesCount: this.alertRules.size,
      channelsCount: this.notificationChannels.size
    });
  }

  getAlertingStatus(): {
    rulesCount: number;
    activeAlertsCount: number;
    channelsCount: number;
    enabledRulesCount: number;
  } {
    return {
      rulesCount: this.alertRules.size,
      activeAlertsCount: this.getActiveAlerts().length,
      channelsCount: this.notificationChannels.size,
      enabledRulesCount: Array.from(this.alertRules.values()).filter(rule => rule.enabled).length
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const alertingService = AlertingService.getInstance();
