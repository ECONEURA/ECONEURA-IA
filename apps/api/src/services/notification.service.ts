import { logger } from '../lib/logger';
import { db } from '../lib/db';
import { notifications, notification_templates } from '../../../db/src/schema';
import { eq, and, sql, desc, asc, count } from 'drizzle-orm';

export interface NotificationTemplate {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'push' | 'in_app';
  subject: string;
  body: string;
  variables: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  enabled: boolean;
}

export interface Notification {
  id: string;
  org_id: string;
  user_id?: string;
  template_id: string;
  type: 'email' | 'sms' | 'push' | 'in_app';
  subject: string;
  body: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'sent' | 'failed' | 'read';
  metadata: Record<string, any>;
  scheduled_at?: Date;
  sent_at?: Date;
  read_at?: Date;
  created_at: Date;
}

export interface NotificationRule {
  id: string;
  name: string;
  description: string;
  conditions: {
    metric: string;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'contains';
    value: any;
    timeframe?: string;
  }[];
  actions: {
    template_id: string;
    channels: ('email' | 'sms' | 'push' | 'in_app')[];
    recipients: string[];
    delay?: number; // in minutes
  }[];
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface NotificationPreferences {
  user_id: string;
  org_id: string;
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;
  quiet_hours: {
    enabled: boolean;
    start_time: string; // HH:MM
    end_time: string; // HH:MM
    timezone: string;
  };
  categories: {
    inventory_alerts: boolean;
    financial_alerts: boolean;
    supplier_alerts: boolean;
    system_alerts: boolean;
    security_alerts: boolean;
  };
}

export class NotificationService {
  private notificationRules: Map<string, NotificationRule> = new Map();
  private templates: Map<string, NotificationTemplate> = new Map();

  constructor() {
    this.initializeTemplates();
    this.initializeRules();
  }

  // Send notification
  async sendNotification(
    orgId: string,
    templateId: string,
    recipients: string[],
    variables: Record<string, any>,
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium',
    channels: ('email' | 'sms' | 'push' | 'in_app')[] = ['in_app']
  ): Promise<string[]> {
    try {
      const template = this.templates.get(templateId);
      if (!template) {
        throw new Error(`Template ${templateId} not found`);
      }

      const notificationIds: string[] = [];

      for (const recipient of recipients) {
        const processedSubject = this.processTemplate(template.subject, variables);
        const processedBody = this.processTemplate(template.body, variables);

        const [notification] = await db
          .insert(notifications)
          .values({
            org_id: orgId,
            user_id: recipient,
            template_id: templateId,
            type: template.type,
            subject: processedSubject,
            body: processedBody,
            priority,
            status: 'pending',
            metadata: {
              variables,
              channels,
              template_name: template.name
            }
          })
          .returning({ id: notifications.id });

        notificationIds.push(notification.id);

        // Send through different channels
        for (const channel of channels) {
          await this.sendThroughChannel(notification.id, channel, processedSubject, processedBody, recipient);
        }
      }

      logger.info(`Sent ${notificationIds.length} notifications using template ${templateId}`);
      return notificationIds;
    } catch (error) {
      logger.error('Error sending notification:', error);
      throw error;
    }
  }

  // Check and trigger notification rules
  async checkNotificationRules(orgId: string, metrics: any): Promise<void> {
    try {
      for (const [ruleId, rule] of this.notificationRules) {
        if (!rule.enabled) continue;

        if (this.evaluateRuleConditions(rule, metrics)) {
          await this.triggerRuleActions(rule, orgId, metrics);
        }
      }
    } catch (error) {
      logger.error('Error checking notification rules:', error);
    }
  }

  // Get user notifications
  async getUserNotifications(
    userId: string,
    orgId: string,
    filters: {
      status?: string;
      priority?: string;
      type?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ notifications: Notification[]; total: number }> {
    try {
      const conditions = [
        eq(notifications.org_id, orgId),
        eq(notifications.user_id, userId)
      ];

      if (filters.status) {
        conditions.push(eq(notifications.status, filters.status));
      }
      if (filters.priority) {
        conditions.push(eq(notifications.priority, filters.priority));
      }
      if (filters.type) {
        conditions.push(eq(notifications.type, filters.type));
      }

      const [notificationsList, totalCount] = await Promise.all([
        db
          .select()
          .from(notifications)
          .where(and(...conditions))
          .orderBy(desc(notifications.created_at))
          .limit(filters.limit || 50)
          .offset(filters.offset || 0),
        db
          .select({ count: count() })
          .from(notifications)
          .where(and(...conditions))
      ]);

      return {
        notifications: notificationsList.map(n => ({
          ...n,
          created_at: n.created_at,
          scheduled_at: n.scheduled_at,
          sent_at: n.sent_at,
          read_at: n.read_at,
          metadata: n.metadata as Record<string, any>
        })),
        total: totalCount[0].count
      };
    } catch (error) {
      logger.error('Error getting user notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      await db
        .update(notifications)
        .set({
          status: 'read',
          read_at: new Date()
        })
        .where(and(
          eq(notifications.id, notificationId),
          eq(notifications.user_id, userId)
        ));

      logger.info(`Marked notification ${notificationId} as read for user ${userId}`);
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Get notification statistics
  async getNotificationStats(orgId: string, period: string = '30d'): Promise<{
    total_sent: number;
    total_read: number;
    total_failed: number;
    by_priority: Record<string, number>;
    by_type: Record<string, number>;
    by_status: Record<string, number>;
  }> {
    try {
      const startDate = this.calculateStartDate(period);

      const stats = await db
        .select({
          total_sent: count(sql`CASE WHEN ${notifications.status} = 'sent' THEN 1 END`),
          total_read: count(sql`CASE WHEN ${notifications.status} = 'read' THEN 1 END`),
          total_failed: count(sql`CASE WHEN ${notifications.status} = 'failed' THEN 1 END`),
          low_priority: count(sql`CASE WHEN ${notifications.priority} = 'low' THEN 1 END`),
          medium_priority: count(sql`CASE WHEN ${notifications.priority} = 'medium' THEN 1 END`),
          high_priority: count(sql`CASE WHEN ${notifications.priority} = 'high' THEN 1 END`),
          urgent_priority: count(sql`CASE WHEN ${notifications.priority} = 'urgent' THEN 1 END`),
          email_type: count(sql`CASE WHEN ${notifications.type} = 'email' THEN 1 END`),
          sms_type: count(sql`CASE WHEN ${notifications.type} = 'sms' THEN 1 END`),
          push_type: count(sql`CASE WHEN ${notifications.type} = 'push' THEN 1 END`),
          in_app_type: count(sql`CASE WHEN ${notifications.type} = 'in_app' THEN 1 END`)
        })
        .from(notifications)
        .where(and(
          eq(notifications.org_id, orgId),
          sql`${notifications.created_at} >= ${startDate}`
        ));

      const data = stats[0];

      return {
        total_sent: data.total_sent,
        total_read: data.total_read,
        total_failed: data.total_failed,
        by_priority: {
          low: data.low_priority,
          medium: data.medium_priority,
          high: data.high_priority,
          urgent: data.urgent_priority
        },
        by_type: {
          email: data.email_type,
          sms: data.sms_type,
          push: data.push_type,
          in_app: data.in_app_type
        },
        by_status: {
          pending: 0, // Would need separate query
          sent: data.total_sent,
          failed: data.total_failed,
          read: data.total_read
        }
      };
    } catch (error) {
      logger.error('Error getting notification stats:', error);
      throw error;
    }
  }

  // Create intelligent alert based on metrics
  async createIntelligentAlert(
    orgId: string,
    alertType: 'inventory' | 'financial' | 'supplier' | 'operational' | 'security',
    severity: 'low' | 'medium' | 'high' | 'critical',
    details: Record<string, any>
  ): Promise<string[]> {
    try {
      const templateId = this.getTemplateForAlert(alertType, severity);
      const recipients = await this.getAlertRecipients(orgId, alertType, severity);
      const variables = this.buildAlertVariables(alertType, details);

      return await this.sendNotification(
        orgId,
        templateId,
        recipients,
        variables,
        severity === 'critical' ? 'urgent' : severity === 'high' ? 'high' : 'medium',
        ['in_app', 'email']
      );
    } catch (error) {
      logger.error('Error creating intelligent alert:', error);
      throw error;
    }
  }

  // Private helper methods
  private initializeTemplates(): void {
    const templates: NotificationTemplate[] = [
      {
        id: 'inventory_low_stock',
        name: 'Low Stock Alert',
        type: 'in_app',
        subject: 'Alerta: Stock Bajo - {product_name}',
        body: 'El producto {product_name} tiene stock bajo ({current_stock} unidades). Punto de reorden: {reorder_point}.',
        variables: ['product_name', 'current_stock', 'reorder_point'],
        priority: 'high',
        enabled: true
      },
      {
        id: 'inventory_stockout',
        name: 'Stockout Alert',
        type: 'in_app',
        subject: 'CRÍTICO: Sin Stock - {product_name}',
        body: 'El producto {product_name} está sin stock. Esto puede afectar las ventas.',
        variables: ['product_name'],
        priority: 'urgent',
        enabled: true
      },
      {
        id: 'financial_low_margin',
        name: 'Low Profit Margin Alert',
        type: 'in_app',
        subject: 'Alerta: Margen Bajo - {product_name}',
        body: 'El producto {product_name} tiene un margen de beneficio bajo ({margin}%).',
        variables: ['product_name', 'margin'],
        priority: 'medium',
        enabled: true
      },
      {
        id: 'supplier_delivery_delay',
        name: 'Supplier Delivery Delay',
        type: 'in_app',
        subject: 'Retraso en Entrega - {supplier_name}',
        body: 'El proveedor {supplier_name} tiene un retraso en la entrega del pedido {order_id}.',
        variables: ['supplier_name', 'order_id'],
        priority: 'high',
        enabled: true
      },
      {
        id: 'system_health_warning',
        name: 'System Health Warning',
        type: 'in_app',
        subject: 'Advertencia del Sistema',
        body: 'Se detectó un problema en el sistema: {issue_description}.',
        variables: ['issue_description'],
        priority: 'medium',
        enabled: true
      }
    ];

    templates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  private initializeRules(): void {
    const rules: NotificationRule[] = [
      {
        id: 'rule_stockout',
        name: 'Stockout Detection',
        description: 'Alert when products are out of stock',
        conditions: [
          {
            metric: 'stockout_rate',
            operator: 'gt',
            value: 0,
            timeframe: '1h'
          }
        ],
        actions: [
          {
            template_id: 'inventory_stockout',
            channels: ['in_app', 'email'],
            recipients: ['inventory_manager', 'purchasing_manager']
          }
        ],
        enabled: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'rule_low_margin',
        name: 'Low Profit Margin',
        description: 'Alert when profit margins are below threshold',
        conditions: [
          {
            metric: 'profit_margin',
            operator: 'lt',
            value: 15,
            timeframe: '24h'
          }
        ],
        actions: [
          {
            template_id: 'financial_low_margin',
            channels: ['in_app'],
            recipients: ['finance_manager']
          }
        ],
        enabled: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    rules.forEach(rule => {
      this.notificationRules.set(rule.id, rule);
    });
  }

  private processTemplate(template: string, variables: Record<string, any>): string {
    let processed = template;
    for (const [key, value] of Object.entries(variables)) {
      processed = processed.replace(new RegExp(`{${key}}`, 'g'), String(value));
    }
    return processed;
  }

  private async sendThroughChannel(
    notificationId: string,
    channel: 'email' | 'sms' | 'push' | 'in_app',
    subject: string,
    body: string,
    recipient: string
  ): Promise<void> {
    try {
      switch (channel) {
        case 'email':
          await this.sendEmail(recipient, subject, body);
          break;
        case 'sms':
          await this.sendSMS(recipient, body);
          break;
        case 'push':
          await this.sendPushNotification(recipient, subject, body);
          break;
        case 'in_app':
          // In-app notifications are already stored in the database
          break;
      }

      // Update notification status
      await db
        .update(notifications)
        .set({
          status: 'sent',
          sent_at: new Date()
        })
        .where(eq(notifications.id, notificationId));

    } catch (error) {
      logger.error(`Error sending notification through ${channel}:`, error);
      
      // Update notification status to failed
      await db
        .update(notifications)
        .set({
          status: 'failed'
        })
        .where(eq(notifications.id, notificationId));
    }
  }

  private async sendEmail(recipient: string, subject: string, body: string): Promise<void> {
    // Mock email sending - in real app, this would use a service like SendGrid, Mailgun, etc.
    logger.info(`Sending email to ${recipient}: ${subject}`);
  }

  private async sendSMS(recipient: string, body: string): Promise<void> {
    // Mock SMS sending - in real app, this would use a service like Twilio, AWS SNS, etc.
    logger.info(`Sending SMS to ${recipient}: ${body}`);
  }

  private async sendPushNotification(recipient: string, subject: string, body: string): Promise<void> {
    // Mock push notification - in real app, this would use Firebase, OneSignal, etc.
    logger.info(`Sending push notification to ${recipient}: ${subject}`);
  }

  private evaluateRuleConditions(rule: NotificationRule, metrics: any): boolean {
    for (const condition of rule.conditions) {
      const metricValue = this.getMetricValue(metrics, condition.metric);
      if (!this.evaluateCondition(metricValue, condition.operator, condition.value)) {
        return false;
      }
    }
    return true;
  }

  private getMetricValue(metrics: any, metricPath: string): any {
    const path = metricPath.split('.');
    let value = metrics;
    for (const key of path) {
      value = value?.[key];
    }
    return value;
  }

  private evaluateCondition(value: any, operator: string, expectedValue: any): boolean {
    switch (operator) {
      case 'gt': return value > expectedValue;
      case 'lt': return value < expectedValue;
      case 'eq': return value === expectedValue;
      case 'gte': return value >= expectedValue;
      case 'lte': return value <= expectedValue;
      case 'contains': return String(value).includes(String(expectedValue));
      default: return false;
    }
  }

  private async triggerRuleActions(rule: NotificationRule, orgId: string, metrics: any): Promise<void> {
    for (const action of rule.actions) {
      const template = this.templates.get(action.template_id);
      if (!template) continue;

      const variables = this.buildRuleVariables(rule, metrics);
      const recipients = await this.resolveRecipients(action.recipients, orgId);

      await this.sendNotification(
        orgId,
        action.template_id,
        recipients,
        variables,
        template.priority,
        action.channels
      );
    }
  }

  private async resolveRecipients(recipientTypes: string[], orgId: string): Promise<string[]> {
    // Mock recipient resolution - in real app, this would query user roles and permissions
    const mockRecipients = {
      'inventory_manager': ['user1', 'user2'],
      'purchasing_manager': ['user3'],
      'finance_manager': ['user4'],
      'system_admin': ['user5']
    };

    const recipients: string[] = [];
    for (const type of recipientTypes) {
      if (mockRecipients[type as keyof typeof mockRecipients]) {
        recipients.push(...mockRecipients[type as keyof typeof mockRecipients]);
      }
    }

    return recipients;
  }

  private getTemplateForAlert(alertType: string, severity: string): string {
    const templateMap: Record<string, Record<string, string>> = {
      inventory: {
        low: 'inventory_low_stock',
        medium: 'inventory_low_stock',
        high: 'inventory_stockout',
        critical: 'inventory_stockout'
      },
      financial: {
        low: 'financial_low_margin',
        medium: 'financial_low_margin',
        high: 'financial_low_margin',
        critical: 'financial_low_margin'
      },
      supplier: {
        low: 'supplier_delivery_delay',
        medium: 'supplier_delivery_delay',
        high: 'supplier_delivery_delay',
        critical: 'supplier_delivery_delay'
      },
      operational: {
        low: 'system_health_warning',
        medium: 'system_health_warning',
        high: 'system_health_warning',
        critical: 'system_health_warning'
      },
      security: {
        low: 'system_health_warning',
        medium: 'system_health_warning',
        high: 'system_health_warning',
        critical: 'system_health_warning'
      }
    };

    return templateMap[alertType]?.[severity] || 'system_health_warning';
  }

  private async getAlertRecipients(orgId: string, alertType: string, severity: string): Promise<string[]> {
    // Mock recipient selection based on alert type and severity
    const recipients: string[] = ['user1']; // Default recipient

    if (severity === 'critical') {
      recipients.push('user5'); // System admin
    }

    if (alertType === 'inventory') {
      recipients.push('user2'); // Inventory manager
    }

    if (alertType === 'financial') {
      recipients.push('user4'); // Finance manager
    }

    return recipients;
  }

  private buildAlertVariables(alertType: string, details: Record<string, any>): Record<string, any> {
    return {
      ...details,
      alert_type: alertType,
      timestamp: new Date().toISOString()
    };
  }

  private buildRuleVariables(rule: NotificationRule, metrics: any): Record<string, any> {
    return {
      rule_name: rule.name,
      rule_description: rule.description,
      metrics,
      timestamp: new Date().toISOString()
    };
  }

  private calculateStartDate(period: string): Date {
    const now = new Date();
    switch (period) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }
}

export const notificationService = new NotificationService();
