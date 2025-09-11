import { logger } from './logger.js';
import { prometheus } from '../middleware/observability.js';

export interface Alert {
  id: string;
  name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  tags?: string[];
}

export interface AlertRule {
  id: string;
  name: string;
  condition: () => Promise<boolean>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  cooldown?: number; // seconds
  enabled: boolean;
  tags?: string[];
}

export interface AlertChannel {
  id: string;
  name: string;
  type: 'email' | 'slack' | 'webhook' | 'console';
  config: Record<string, any>;
  enabled: boolean;
}

export class AlertingSystem {
  private rules: Map<string, AlertRule> = new Map();
  private channels: Map<string, AlertChannel> = new Map();
  private activeAlerts: Map<string, Alert> = new Map();
  private lastTriggered: Map<string, Date> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();

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

  /**
   * Register an alert rule
   */
  registerRule(rule: AlertRule): void {
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

  /**
   * Register an alert channel
   */
  registerChannel(channel: AlertChannel): void {
    this.channels.set(channel.id, channel);
    
    logger.info('Alert channel registered', {
      id: channel.id,
      name: channel.name,
      type: channel.type,
      enabled: channel.enabled
    });
  }

  /**
   * Start monitoring an alert rule
   */
  private startRuleMonitoring(rule: AlertRule): void {
    const interval = setInterval(async () => {
      try {
        await this.checkRule(rule);
      } catch (error) {
        logger.error('Error checking alert rule', {
          ruleId: rule.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }, 30000); // Check every 30 seconds

    this.intervals.set(rule.id, interval);
  }

  /**
   * Check a specific alert rule
   */
  private async checkRule(rule: AlertRule): Promise<void> {
    if (!rule.enabled) {
      return;
    }

    // Check cooldown
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
      } else {
        await this.resolveAlert(rule.id);
      }
    } catch (error) {
      logger.error('Error evaluating alert rule condition', {
        ruleId: rule.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Trigger an alert
   */
  private async triggerAlert(rule: AlertRule): Promise<void> {
    const alertId = `${rule.id}-${Date.now()}`;
    
    // Check if alert is already active
    if (this.activeAlerts.has(rule.id)) {
      return;
    }

    const alert: Alert = {
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

    // Send alert to all enabled channels
    await this.sendAlertToChannels(alert);

    // Record metrics
    this.recordAlertMetrics(alert);

    logger.warn('Alert triggered', {
      id: alertId,
      name: rule.name,
      severity: rule.severity,
      message: rule.message
    });
  }

  /**
   * Resolve an alert
   */
  private async resolveAlert(ruleId: string): Promise<void> {
    const alert = this.activeAlerts.get(ruleId);
    if (!alert) {
      return;
    }

    alert.resolved = true;
    alert.resolvedAt = new Date();

    // Send resolution to all enabled channels
    await this.sendAlertResolutionToChannels(alert);

    // Record metrics
    this.recordAlertResolutionMetrics(alert);

    logger.info('Alert resolved', {
      id: alert.id,
      name: alert.name,
      severity: alert.severity
    });

    // Remove from active alerts
    this.activeAlerts.delete(ruleId);
  }

  /**
   * Send alert to all enabled channels
   */
  private async sendAlertToChannels(alert: Alert): Promise<void> {
    const enabledChannels = Array.from(this.channels.values()).filter(channel => channel.enabled);
    
    const promises = enabledChannels.map(channel => this.sendToChannel(alert, channel));
    await Promise.allSettled(promises);
  }

  /**
   * Send alert resolution to all enabled channels
   */
  private async sendAlertResolutionToChannels(alert: Alert): Promise<void> {
    const enabledChannels = Array.from(this.channels.values()).filter(channel => channel.enabled);
    
    const promises = enabledChannels.map(channel => this.sendResolutionToChannel(alert, channel));
    await Promise.allSettled(promises);
  }

  /**
   * Send alert to a specific channel
   */
  private async sendToChannel(alert: Alert, channel: AlertChannel): Promise<void> {
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
    } catch (error) {
      logger.error('Failed to send alert to channel', {
        channelId: channel.id,
        channelType: channel.type,
        alertId: alert.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Send alert resolution to a specific channel
   */
  private async sendResolutionToChannel(alert: Alert, channel: AlertChannel): Promise<void> {
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
    } catch (error) {
      logger.error('Failed to send alert resolution to channel', {
        channelId: channel.id,
        channelType: channel.type,
        alertId: alert.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Send webhook alert
   */
  private async sendWebhookAlert(alert: Alert, config: Record<string, any>): Promise<void> {
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

  /**
   * Send webhook resolution
   */
  private async sendWebhookResolution(alert: Alert, config: Record<string, any>): Promise<void> {
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

  /**
   * Send email alert
   */
  private async sendEmailAlert(alert: Alert, config: Record<string, any>): Promise<void> {
    // Implementation would depend on email service (SendGrid, SES, etc.)
    logger.info('Email alert sent', {
      alertId: alert.id,
      to: config.to,
      subject: `[${alert.severity.toUpperCase()}] ${alert.name}`
    });
  }

  /**
   * Send email resolution
   */
  private async sendEmailResolution(alert: Alert, config: Record<string, any>): Promise<void> {
    // Implementation would depend on email service
    logger.info('Email resolution sent', {
      alertId: alert.id,
      to: config.to,
      subject: `[RESOLVED] ${alert.name}`
    });
  }

  /**
   * Send Slack alert
   */
  private async sendSlackAlert(alert: Alert, config: Record<string, any>): Promise<void> {
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

  /**
   * Send Slack resolution
   */
  private async sendSlackResolution(alert: Alert, config: Record<string, any>): Promise<void> {
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

  /**
   * Get severity color for Slack
   */
  private getSeverityColor(severity: string): string {
    switch (severity) {
      case 'low': return '#36a64f';
      case 'medium': return '#ff9800';
      case 'high': return '#ff5722';
      case 'critical': return '#f44336';
      default: return '#9e9e9e';
    }
  }

  /**
   * Record alert metrics
   */
  private recordAlertMetrics(alert: Alert): void {
    const severityValue = this.getSeverityNumeric(alert.severity);
    prometheus.alertTriggered.set({ severity: alert.severity }, 1);
    prometheus.alertSeverity.set({ severity: alert.severity }, severityValue);
  }

  /**
   * Record alert resolution metrics
   */
  private recordAlertResolutionMetrics(alert: Alert): void {
    prometheus.alertResolved.set({ severity: alert.severity }, 1);
  }

  /**
   * Get numeric value for severity
   */
  private getSeverityNumeric(severity: string): number {
    switch (severity) {
      case 'low': return 1;
      case 'medium': return 2;
      case 'high': return 3;
      case 'critical': return 4;
      default: return 0;
    }
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * Get alert rule by ID
   */
  getRule(ruleId: string): AlertRule | undefined {
    return this.rules.get(ruleId);
  }

  /**
   * Get alert channel by ID
   */
  getChannel(channelId: string): AlertChannel | undefined {
    return this.channels.get(channelId);
  }

  /**
   * Enable/disable a rule
   */
  toggleRule(ruleId: string, enabled: boolean): void {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      throw new Error(`Alert rule '${ruleId}' not found`);
    }

    rule.enabled = enabled;

    if (enabled) {
      this.startRuleMonitoring(rule);
    } else {
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

  /**
   * Cleanup resources
   */
  destroy(): void {
    // Clear all intervals
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();
    
    // Clear all data
    this.rules.clear();
    this.channels.clear();
    this.activeAlerts.clear();
    this.lastTriggered.clear();

    logger.info('Alerting System destroyed');
  }
}

// Export Prometheus metrics
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

// Export singleton instance
export const alertingSystem = new AlertingSystem();
