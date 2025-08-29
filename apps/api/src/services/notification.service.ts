import { logger } from '../lib/logger';

interface NotificationPayload {
  type: 'interaction_created' | 'interaction_updated' | 'interaction_urgent' | 'interaction_overdue';
  title: string;
  message: string;
  data?: any;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  recipients?: string[];
  channels?: ('push' | 'email' | 'slack' | 'webhook')[];
}

interface WebhookPayload {
  event: string;
  timestamp: string;
  data: any;
  organization_id: string;
  user_id?: string;
}

export class NotificationService {
  private webhookEndpoints: Map<string, string[]> = new Map();

  // Register webhook endpoints for organizations
  registerWebhookEndpoint(orgId: string, endpoint: string) {
    if (!this.webhookEndpoints.has(orgId)) {
      this.webhookEndpoints.set(orgId, []);
    }
    this.webhookEndpoints.get(orgId)!.push(endpoint);
  }

  // Send notification through multiple channels
  async sendNotification(payload: NotificationPayload, orgId: string, userId?: string) {
    try {
      const promises = [];

      // Push notifications (if configured)
      if (payload.channels?.includes('push')) {
        promises.push(this.sendPushNotification(payload, orgId, userId));
      }

      // Email notifications
      if (payload.channels?.includes('email')) {
        promises.push(this.sendEmailNotification(payload, orgId, userId));
      }

      // Slack notifications
      if (payload.channels?.includes('slack')) {
        promises.push(this.sendSlackNotification(payload, orgId));
      }

      // Webhook notifications
      if (payload.channels?.includes('webhook')) {
        promises.push(this.sendWebhookNotification(payload, orgId, userId));
      }

      await Promise.allSettled(promises);
      logger.info('Notifications sent successfully', { 
        type: payload.type, 
        orgId, 
        userId,
        channels: payload.channels 
      });
    } catch (error) {
      logger.error('Error sending notifications', error, { 
        type: payload.type, 
        orgId, 
        userId 
      });
    }
  }

  // Send push notification
  private async sendPushNotification(payload: NotificationPayload, orgId: string, userId?: string) {
    // Mock implementation - in production would use Firebase, OneSignal, etc.
    logger.info('Push notification sent', {
      title: payload.title,
      message: payload.message,
      orgId,
      userId,
      priority: payload.priority
    });
  }

  // Send email notification
  private async sendEmailNotification(payload: NotificationPayload, orgId: string, userId?: string) {
    // Mock implementation - in production would use SendGrid, AWS SES, etc.
    logger.info('Email notification sent', {
      to: payload.recipients,
      subject: payload.title,
      body: payload.message,
      orgId,
      userId
    });
  }

  // Send Slack notification
  private async sendSlackNotification(payload: NotificationPayload, orgId: string) {
    // Mock implementation - in production would use Slack Webhook
    const slackMessage = {
      text: payload.title,
      attachments: [{
        text: payload.message,
        color: this.getPriorityColor(payload.priority || 'normal'),
        fields: payload.data ? Object.entries(payload.data).map(([key, value]) => ({
          title: key,
          value: String(value),
          short: true
        })) : []
      }]
    };

    logger.info('Slack notification sent', {
      message: slackMessage,
      orgId
    });
  }

  // Send webhook notification
  private async sendWebhookNotification(payload: NotificationPayload, orgId: string, userId?: string) {
    const webhookEndpoints = this.webhookEndpoints.get(orgId) || [];
    
    const webhookPayload: WebhookPayload = {
      event: payload.type,
      timestamp: new Date().toISOString(),
      data: {
        ...payload.data,
        title: payload.title,
        message: payload.message,
        priority: payload.priority
      },
      organization_id: orgId,
      user_id: userId
    };

    const promises = webhookEndpoints.map(endpoint => 
      this.sendWebhookToEndpoint(endpoint, webhookPayload)
    );

    await Promise.allSettled(promises);
  }

  // Send webhook to specific endpoint
  private async sendWebhookToEndpoint(endpoint: string, payload: WebhookPayload) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'EcoNeura-API/1.0',
          'X-Webhook-Signature': this.generateWebhookSignature(payload)
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Webhook failed with status ${response.status}`);
      }

      logger.info('Webhook sent successfully', { endpoint, event: payload.event });
    } catch (error) {
      logger.error('Webhook delivery failed', error, { endpoint, event: payload.event });
    }
  }

  // Generate webhook signature for security
  private generateWebhookSignature(payload: WebhookPayload): string {
    const secret = process.env.WEBHOOK_SECRET || 'default-secret';
    const crypto = require('crypto');
    const signature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
    return `sha256=${signature}`;
  }

  // Get priority color for Slack
  private getPriorityColor(priority: string): string {
    switch (priority) {
      case 'urgent': return '#ff0000';
      case 'high': return '#ff9900';
      case 'normal': return '#36a64f';
      case 'low': return '#cccccc';
      default: return '#36a64f';
    }
  }

  // Send interaction-specific notifications
  async notifyInteractionCreated(interaction: any, orgId: string, userId: string) {
    const payload: NotificationPayload = {
      type: 'interaction_created',
      title: 'Nueva Interacción Creada',
      message: `Se ha creado una nueva interacción: ${interaction.subject || interaction.type}`,
      data: {
        interaction_id: interaction.id,
        interaction_type: interaction.type,
        priority: interaction.priority
      },
      priority: interaction.priority === 'urgent' ? 'high' : 'normal',
      channels: ['push', 'email', 'webhook']
    };

    await this.sendNotification(payload, orgId, userId);
  }

  async notifyInteractionUrgent(interaction: any, orgId: string, userId: string) {
    const payload: NotificationPayload = {
      type: 'interaction_urgent',
      title: '🚨 Interacción Urgente',
      message: `Interacción urgente requiere atención inmediata: ${interaction.subject}`,
      data: {
        interaction_id: interaction.id,
        interaction_type: interaction.type,
        due_date: interaction.due_date
      },
      priority: 'urgent',
      channels: ['push', 'email', 'slack', 'webhook']
    };

    await this.sendNotification(payload, orgId, userId);
  }

  async notifyInteractionOverdue(interaction: any, orgId: string, userId: string) {
    const payload: NotificationPayload = {
      type: 'interaction_overdue',
      title: '⚠️ Interacción Vencida',
      message: `Interacción vencida: ${interaction.subject}`,
      data: {
        interaction_id: interaction.id,
        interaction_type: interaction.type,
        due_date: interaction.due_date
      },
      priority: 'high',
      channels: ['push', 'email', 'slack', 'webhook']
    };

    await this.sendNotification(payload, orgId, userId);
  }
}

export const notificationService = new NotificationService();
