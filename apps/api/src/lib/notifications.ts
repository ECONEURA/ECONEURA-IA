// ============================================================================
// SISTEMA DE NOTIFICACIONES - API
// ============================================================================

import { z } from "zod";
import { logger } from './logger.js';

// ============================================================================
// SCHEMAS
// ============================================================================

const NotificationTypeSchema = z.enum([
  'info',
  'success',
  'warning',
  'error',
  'alert',
  'reminder',
  'update',
  'announcement'
]);

const NotificationPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);

const NotificationChannelSchema = z.enum(['email', 'sms', 'push', 'in_app', 'webhook']);

const NotificationTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  type: NotificationTypeSchema,
  subject: z.string(),
  body: z.string(),
  variables: z.array(z.string()).optional(),
  channels: z.array(NotificationChannelSchema),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date()
});

const NotificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  orgId: z.string(),
  type: NotificationTypeSchema,
  priority: NotificationPrioritySchema,
  title: z.string(),
  message: z.string(),
  data: z.record(z.any()).optional(),
  channels: z.array(NotificationChannelSchema),
  templateId: z.string().optional(),
  status: z.enum(['pending', 'sent', 'failed', 'delivered', 'read']),
  scheduledAt: z.date().optional(),
  sentAt: z.date().optional(),
  readAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

const NotificationPreferencesSchema = z.object({
  userId: z.string(),
  orgId: z.string(),
  email: z.boolean().default(true),
  sms: z.boolean().default(false),
  push: z.boolean().default(true),
  in_app: z.boolean().default(true),
  webhook: z.boolean().default(false),
  quietHours: z.object({
    enabled: z.boolean().default(false),
    startTime: z.string().default('22:00'),
    endTime: z.string().default('08:00'),
    timezone: z.string().default('UTC')
  }).optional(),
  preferences: z.record(z.boolean()).default({}),
  createdAt: z.date(),
  updatedAt: z.date()
});

// ============================================================================
// INTERFACES
// ============================================================================

export interface NotificationTemplate {
  id: string;
  name: string;
  description?: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'alert' | 'reminder' | 'update' | 'announcement';
  subject: string;
  body: string;
  variables?: string[];
  channels: ('email' | 'sms' | 'push' | 'in_app' | 'webhook')[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  orgId: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'alert' | 'reminder' | 'update' | 'announcement';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  data?: Record<string, any>;
  channels: ('email' | 'sms' | 'push' | 'in_app' | 'webhook')[];
  templateId?: string;
  status: 'pending' | 'sent' | 'failed' | 'delivered' | 'read';
  scheduledAt?: Date;
  sentAt?: Date;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationPreferences {
  userId: string;
  orgId: string;
  email: boolean;
  sms: boolean;
  push: boolean;
  in_app: boolean;
  webhook: boolean;
  quietHours?: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    timezone: string;
  };
  preferences: Record<string, boolean>;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationStats {
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
  byChannel: Record<string, number>;
  recentActivity: {
    sent: number;
    failed: number;
    read: number;
  };
}

export interface INotificationSystem {
  // Templates
  createTemplate(template: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<NotificationTemplate>;
  getTemplate(id: string): Promise<NotificationTemplate | null>;
  listTemplates(orgId: string): Promise<NotificationTemplate[]>;
  updateTemplate(id: string, updates: Partial<NotificationTemplate>): Promise<NotificationTemplate>;
  deleteTemplate(id: string): Promise<void>;
  
  // Notifications
  createNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>): Promise<Notification>;
  getNotification(id: string): Promise<Notification | null>;
  listNotifications(userId: string, orgId: string, filters?: {
    status?: string;
    type?: string;
    priority?: string;
    limit?: number;
    offset?: number;
  }): Promise<Notification[]>;
  updateNotification(id: string, updates: Partial<Notification>): Promise<Notification>;
  deleteNotification(id: string): Promise<void>;
  markAsRead(id: string): Promise<Notification>;
  markAllAsRead(userId: string, orgId: string): Promise<void>;
  
  // Preferences
  getPreferences(userId: string, orgId: string): Promise<NotificationPreferences>;
  updatePreferences(userId: string, orgId: string, updates: Partial<NotificationPreferences>): Promise<NotificationPreferences>;
  
  // Sending
  sendNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>): Promise<Notification>;
  sendBulkNotifications(notifications: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<Notification[]>;
  scheduleNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>, scheduledAt: Date): Promise<Notification>;
  
  // Statistics
  getStatistics(orgId: string): Promise<NotificationStats>;
  
  // Utilities
  getUnreadCount(userId: string, orgId: string): Promise<number>;
  validateTemplate(template: NotificationTemplate): Promise<boolean>;
}

// ============================================================================
// IMPLEMENTACIÓN
// ============================================================================

export class NotificationSystemImpl implements INotificationSystem {
  private templates: Map<string, NotificationTemplate> = new Map();
  private notifications: Map<string, Notification> = new Map();
  private preferences: Map<string, NotificationPreferences> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
    logger.info('Notification system initialized', { 
      system: 'notifications',
      templatesCount: this.templates.size,
      notificationsCount: 0
    });
  }

  // ============================================================================
  // TEMPLATES
  // ============================================================================

  async createTemplate(template: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<NotificationTemplate> {
    try {
      const id = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();
      
      const newTemplate: NotificationTemplate = {
        ...template,
        id,
        createdAt: now,
        updatedAt: now
      };

      this.templates.set(id, newTemplate);

      logger.info('Notification template created', { 
        system: 'notifications',
        templateId: id,
        name: template.name,
        type: template.type
      });

      return newTemplate;
    } catch (error) {
      logger.error('Failed to create notification template', { 
        system: 'notifications',
        error: (error as Error).message 
      });
      throw error;
    }
  }

  async getTemplate(id: string): Promise<NotificationTemplate | null> {
    try {
      const template = this.templates.get(id);
      
      if (template) {
        logger.info('Notification template retrieved', { 
          system: 'notifications',
          templateId: id 
        });
      }

      return template || null;
    } catch (error) {
      logger.error('Failed to get notification template', { 
        system: 'notifications',
        error: (error as Error).message,
        templateId: id 
      });
      throw error;
    }
  }

  async listTemplates(orgId: string): Promise<NotificationTemplate[]> {
    try {
      const templates = Array.from(this.templates.values())
        .filter(t => t.isActive);

      logger.info('Notification templates listed', { 
        system: 'notifications',
        orgId,
        count: templates.length
      });

      return templates;
    } catch (error) {
      logger.error('Failed to list notification templates', { 
        system: 'notifications',
        error: (error as Error).message 
      });
      throw error;
    }
  }

  async updateTemplate(id: string, updates: Partial<NotificationTemplate>): Promise<NotificationTemplate> {
    try {
      const template = this.templates.get(id);
      if (!template) {
        throw new Error('Template not found');
      }

      const updatedTemplate: NotificationTemplate = {
        ...template,
        ...updates,
        id, // No permitir cambiar el ID
        updatedAt: new Date()
      };

      this.templates.set(id, updatedTemplate);

      logger.info('Notification template updated', { 
        system: 'notifications',
        templateId: id 
      });

      return updatedTemplate;
    } catch (error) {
      logger.error('Failed to update notification template', { 
        system: 'notifications',
        error: (error as Error).message,
        templateId: id 
      });
      throw error;
    }
  }

  async deleteTemplate(id: string): Promise<void> {
    try {
      const deleted = this.templates.delete(id);
      
      if (deleted) {
        logger.info('Notification template deleted', { 
          system: 'notifications',
          templateId: id 
        });
      } else {
        throw new Error('Template not found');
      }
    } catch (error) {
      logger.error('Failed to delete notification template', { 
        system: 'notifications',
        error: (error as Error).message,
        templateId: id 
      });
      throw error;
    }
  }

  // ============================================================================
  // NOTIFICACIONES
  // ============================================================================

  async createNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>): Promise<Notification> {
    try {
      const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();
      
      const newNotification: Notification = {
        ...notification,
        id,
        status: 'pending',
        createdAt: now,
        updatedAt: now
      };

      this.notifications.set(id, newNotification);

      logger.info('Notification created', { 
        system: 'notifications',
        notificationId: id,
        userId: notification.userId,
        type: notification.type,
        priority: notification.priority
      });

      return newNotification;
    } catch (error) {
      logger.error('Failed to create notification', { 
        system: 'notifications',
        error: (error as Error).message 
      });
      throw error;
    }
  }

  async getNotification(id: string): Promise<Notification | null> {
    try {
      const notification = this.notifications.get(id);
      
      if (notification) {
        logger.info('Notification retrieved', { 
          system: 'notifications',
          notificationId: id 
        });
      }

      return notification || null;
    } catch (error) {
      logger.error('Failed to get notification', { 
        system: 'notifications',
        error: (error as Error).message,
        notificationId: id 
      });
      throw error;
    }
  }

  async listNotifications(userId: string, orgId: string, filters?: {
    status?: string;
    type?: string;
    priority?: string;
    limit?: number;
    offset?: number;
  }): Promise<Notification[]> {
    try {
      let notifications = Array.from(this.notifications.values())
        .filter(n => n.userId === userId && n.orgId === orgId);

      // Aplicar filtros
      if (filters?.status) {
        notifications = notifications.filter(n => n.status === filters.status);
      }
      if (filters?.type) {
        notifications = notifications.filter(n => n.type === filters.type);
      }
      if (filters?.priority) {
        notifications = notifications.filter(n => n.priority === filters.priority);
      }

      // Ordenar por fecha de creación (más recientes primero)
      notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      // Aplicar paginación
      if (filters?.offset) {
        notifications = notifications.slice(filters.offset);
      }
      if (filters?.limit) {
        notifications = notifications.slice(0, filters.limit);
      }

      logger.info('Notifications listed', { 
        system: 'notifications',
        userId,
        orgId,
        count: notifications.length,
        filters
      });

      return notifications;
    } catch (error) {
      logger.error('Failed to list notifications', { 
        system: 'notifications',
        error: (error as Error).message 
      });
      throw error;
    }
  }

  async updateNotification(id: string, updates: Partial<Notification>): Promise<Notification> {
    try {
      const notification = this.notifications.get(id);
      if (!notification) {
        throw new Error('Notification not found');
      }

      const updatedNotification: Notification = {
        ...notification,
        ...updates,
        id, // No permitir cambiar el ID
        updatedAt: new Date()
      };

      this.notifications.set(id, updatedNotification);

      logger.info('Notification updated', { 
        system: 'notifications',
        notificationId: id 
      });

      return updatedNotification;
    } catch (error) {
      logger.error('Failed to update notification', { 
        system: 'notifications',
        error: (error as Error).message,
        notificationId: id 
      });
      throw error;
    }
  }

  async deleteNotification(id: string): Promise<void> {
    try {
      const deleted = this.notifications.delete(id);
      
      if (deleted) {
        logger.info('Notification deleted', { 
          system: 'notifications',
          notificationId: id 
        });
      } else {
        throw new Error('Notification not found');
      }
    } catch (error) {
      logger.error('Failed to delete notification', { 
        system: 'notifications',
        error: (error as Error).message,
        notificationId: id 
      });
      throw error;
    }
  }

  async markAsRead(id: string): Promise<Notification> {
    try {
      const notification = this.notifications.get(id);
      if (!notification) {
        throw new Error('Notification not found');
      }

      const updatedNotification: Notification = {
        ...notification,
        status: 'read',
        readAt: new Date(),
        updatedAt: new Date()
      };

      this.notifications.set(id, updatedNotification);

      logger.info('Notification marked as read', { 
        system: 'notifications',
        notificationId: id 
      });

      return updatedNotification;
    } catch (error) {
      logger.error('Failed to mark notification as read', { 
        system: 'notifications',
        error: (error as Error).message,
        notificationId: id 
      });
      throw error;
    }
  }

  async markAllAsRead(userId: string, orgId: string): Promise<void> {
    try {
      const notifications = Array.from(this.notifications.values())
        .filter(n => n.userId === userId && n.orgId === orgId && n.status !== 'read');

      const now = new Date();
      for (const notification of notifications) {
        notification.status = 'read';
        notification.readAt = now;
        notification.updatedAt = now;
      }

      logger.info('All notifications marked as read', { 
        system: 'notifications',
        userId,
        orgId,
        count: notifications.length
      });
    } catch (error) {
      logger.error('Failed to mark all notifications as read', { 
        system: 'notifications',
        error: (error as Error).message 
      });
      throw error;
    }
  }

  // ============================================================================
  // PREFERENCIAS
  // ============================================================================

  async getPreferences(userId: string, orgId: string): Promise<NotificationPreferences> {
    try {
      const key = `${userId}_${orgId}`;
      let preferences = this.preferences.get(key);

      if (!preferences) {
        // Crear preferencias por defecto
        preferences = {
          userId,
          orgId,
          email: true,
          sms: false,
          push: true,
          in_app: true,
          webhook: false,
          quietHours: {
            enabled: false,
            startTime: '22:00',
            endTime: '08:00',
            timezone: 'UTC'
          },
          preferences: {},
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.preferences.set(key, preferences);
      }

      logger.info('Notification preferences retrieved', { 
        system: 'notifications',
        userId,
        orgId
      });

      return preferences;
    } catch (error) {
      logger.error('Failed to get notification preferences', { 
        system: 'notifications',
        error: (error as Error).message 
      });
      throw error;
    }
  }

  async updatePreferences(userId: string, orgId: string, updates: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    try {
      const key = `${userId}_${orgId}`;
      const currentPreferences = await this.getPreferences(userId, orgId);

      const updatedPreferences: NotificationPreferences = {
        ...currentPreferences,
        ...updates,
        updatedAt: new Date()
      };

      this.preferences.set(key, updatedPreferences);

      logger.info('Notification preferences updated', { 
        system: 'notifications',
        userId,
        orgId
      });

      return updatedPreferences;
    } catch (error) {
      logger.error('Failed to update notification preferences', { 
        system: 'notifications',
        error: (error as Error).message 
      });
      throw error;
    }
  }

  // ============================================================================
  // ENVÍO
  // ============================================================================

  async sendNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>): Promise<Notification> {
    try {
      // Crear la notificación
      const newNotification = await this.createNotification(notification);

      // Obtener preferencias del usuario
      const preferences = await this.getPreferences(notification.userId, notification.orgId);

      // Filtrar canales según preferencias
      const allowedChannels = notification.channels.filter(channel => {
        switch (channel) {
          case 'email': return preferences.email;
          case 'sms': return preferences.sms;
          case 'push': return preferences.push;
          case 'in_app': return preferences.in_app;
          case 'webhook': return preferences.webhook;
          default: return false;
        }
      });

      if (allowedChannels.length === 0) {
        // Marcar como enviada si no hay canales disponibles
        return await this.updateNotification(newNotification.id, {
          status: 'sent',
          sentAt: new Date()
        });
      }

      // Simular envío por canales
      const sentAt = new Date();
      let status: 'sent' | 'failed' = 'sent';

      for (const channel of allowedChannels) {
        try {
          await this.sendToChannel(newNotification, channel);
          logger.info('Notification sent to channel', { 
            system: 'notifications',
            notificationId: newNotification.id,
            channel,
            userId: notification.userId
          });
        } catch (error) {
          logger.error('Failed to send notification to channel', { 
            system: 'notifications',
            notificationId: newNotification.id,
            channel,
            error: (error as Error).message
          });
          status = 'failed';
        }
      }

      // Actualizar estado
      return await this.updateNotification(newNotification.id, {
        status,
        sentAt
      });
    } catch (error) {
      logger.error('Failed to send notification', { 
        system: 'notifications',
        error: (error as Error).message 
      });
      throw error;
    }
  }

  async sendBulkNotifications(notifications: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<Notification[]> {
    try {
      const results: Notification[] = [];
      
      for (const notification of notifications) {
        try {
          const result = await this.sendNotification(notification);
          results.push(result);
        } catch (error) {
          logger.error('Failed to send bulk notification', { 
            system: 'notifications',
            error: (error as Error).message 
          });
          // Continuar con las siguientes notificaciones
        }
      }

      logger.info('Bulk notifications sent', { 
        system: 'notifications',
        total: notifications.length,
        successful: results.length
      });

      return results;
    } catch (error) {
      logger.error('Failed to send bulk notifications', { 
        system: 'notifications',
        error: (error as Error).message 
      });
      throw error;
    }
  }

  async scheduleNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>, scheduledAt: Date): Promise<Notification> {
    try {
      const scheduledNotification = await this.createNotification({
        ...notification,
        scheduledAt,
        status: 'pending'
      });

      logger.info('Notification scheduled', { 
        system: 'notifications',
        notificationId: scheduledNotification.id,
        scheduledAt: scheduledAt.toISOString()
      });

      return scheduledNotification;
    } catch (error) {
      logger.error('Failed to schedule notification', { 
        system: 'notifications',
        error: (error as Error).message 
      });
      throw error;
    }
  }

  // ============================================================================
  // ESTADÍSTICAS
  // ============================================================================

  async getStatistics(orgId: string): Promise<NotificationStats> {
    try {
      const notifications = Array.from(this.notifications.values())
        .filter(n => n.orgId === orgId);

      const stats: NotificationStats = {
        total: notifications.length,
        byStatus: {},
        byType: {},
        byPriority: {},
        byChannel: {},
        recentActivity: {
          sent: 0,
          failed: 0,
          read: 0
        }
      };

      // Calcular estadísticas
      for (const notification of notifications) {
        // Por estado
        stats.byStatus[notification.status] = (stats.byStatus[notification.status] || 0) + 1;
        
        // Por tipo
        stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;
        
        // Por prioridad
        stats.byPriority[notification.priority] = (stats.byPriority[notification.priority] || 0) + 1;
        
        // Por canal
        for (const channel of notification.channels) {
          stats.byChannel[channel] = (stats.byChannel[channel] || 0) + 1;
        }

        // Actividad reciente (últimas 24 horas)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        if (notification.updatedAt > oneDayAgo) {
          switch (notification.status) {
            case 'sent':
              stats.recentActivity.sent++;
              break;
            case 'failed':
              stats.recentActivity.failed++;
              break;
            case 'read':
              stats.recentActivity.read++;
              break;
          }
        }
      }

      logger.info('Notification statistics retrieved', { 
        system: 'notifications',
        orgId,
        total: stats.total
      });

      return stats;
    } catch (error) {
      logger.error('Failed to get notification statistics', { 
        system: 'notifications',
        error: (error as Error).message 
      });
      throw error;
    }
  }

  // ============================================================================
  // UTILIDADES
  // ============================================================================

  async getUnreadCount(userId: string, orgId: string): Promise<number> {
    try {
      const notifications = Array.from(this.notifications.values())
        .filter(n => n.userId === userId && n.orgId === orgId && n.status !== 'read');

      return notifications.length;
    } catch (error) {
      logger.error('Failed to get unread count', { 
        system: 'notifications',
        error: (error as Error).message 
      });
      throw error;
    }
  }

  async validateTemplate(template: NotificationTemplate): Promise<boolean> {
    try {
      // Validaciones básicas
      if (!template.name || !template.subject || !template.body) {
        return false;
      }

      if (template.channels.length === 0) {
        return false;
      }

      // Validar variables en el template
      const variableRegex = /\{\{(\w+)\}\}/g;
      const variables = template.body.match(variableRegex) || [];
      const declaredVariables = template.variables || [];

      for (const variable of variables) {
        const varName = variable.replace(/\{\{|\}\}/g, '');
        if (!declaredVariables.includes(varName)) {
          return false;
        }
      }

      return true;
    } catch (error) {
      logger.error('Failed to validate template', { 
        system: 'notifications',
        error: (error as Error).message 
      });
      return false;
    }
  }

  // ============================================================================
  // MÉTODOS PRIVADOS
  // ============================================================================

  private initializeDefaultTemplates(): void {
    const defaultTemplates: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'Welcome Email',
        description: 'Template for welcoming new users',
        type: 'success',
        subject: 'Welcome to {{app_name}}!',
        body: 'Hi {{user_name}}, welcome to {{app_name}}! We\'re excited to have you on board.',
        variables: ['app_name', 'user_name'],
        channels: ['email', 'in_app'],
        isActive: true
      },
      {
        name: 'Password Reset',
        description: 'Template for password reset notifications',
        type: 'info',
        subject: 'Password Reset Request',
        body: 'Hi {{user_name}}, you requested a password reset. Click here to reset your password: {{reset_link}}',
        variables: ['user_name', 'reset_link'],
        channels: ['email'],
        isActive: true
      },
      {
        name: 'System Alert',
        description: 'Template for system alerts',
        type: 'alert',
        subject: 'System Alert: {{alert_type}}',
        body: 'System alert: {{alert_message}}. Please check your dashboard for more details.',
        variables: ['alert_type', 'alert_message'],
        channels: ['email', 'push', 'in_app'],
        isActive: true
      },
      {
        name: 'Reminder',
        description: 'Template for reminders',
        type: 'reminder',
        subject: 'Reminder: {{reminder_title}}',
        body: 'Hi {{user_name}}, this is a reminder about: {{reminder_message}}',
        variables: ['user_name', 'reminder_title', 'reminder_message'],
        channels: ['email', 'push', 'in_app'],
        isActive: true
      }
    ];

    for (const template of defaultTemplates) {
      this.createTemplate(template);
    }
  }

  private async sendToChannel(notification: Notification, channel: string): Promise<void> {
    // Simulación de envío por canal
    switch (channel) {
      case 'email':
        await this.simulateEmailSend(notification);
        break;
      case 'sms':
        await this.simulateSMSSend(notification);
        break;
      case 'push':
        await this.simulatePushSend(notification);
        break;
      case 'in_app':
        await this.simulateInAppSend(notification);
        break;
      case 'webhook':
        await this.simulateWebhookSend(notification);
        break;
      default:
        throw new Error(`Unsupported channel: ${channel}`);
    }
  }

  private async simulateEmailSend(notification: Notification): Promise<void> {
    // Simulación de envío de email
    await new Promise(resolve => setTimeout(resolve, 100));
    logger.info('Email sent (simulated)', { 
      system: 'notifications',
      notificationId: notification.id,
      to: notification.userId
    });
  }

  private async simulateSMSSend(notification: Notification): Promise<void> {
    // Simulación de envío de SMS
    await new Promise(resolve => setTimeout(resolve, 50));
    logger.info('SMS sent (simulated)', { 
      system: 'notifications',
      notificationId: notification.id,
      to: notification.userId
    });
  }

  private async simulatePushSend(notification: Notification): Promise<void> {
    // Simulación de envío de push notification
    await new Promise(resolve => setTimeout(resolve, 30));
    logger.info('Push notification sent (simulated)', { 
      system: 'notifications',
      notificationId: notification.id,
      to: notification.userId
    });
  }

  private async simulateInAppSend(notification: Notification): Promise<void> {
    // Simulación de envío de notificación in-app
    await new Promise(resolve => setTimeout(resolve, 10));
    logger.info('In-app notification sent (simulated)', { 
      system: 'notifications',
      notificationId: notification.id,
      to: notification.userId
    });
  }

  private async simulateWebhookSend(notification: Notification): Promise<void> {
    // Simulación de envío de webhook
    await new Promise(resolve => setTimeout(resolve, 200));
    logger.info('Webhook sent (simulated)', { 
      system: 'notifications',
      notificationId: notification.id,
      to: notification.userId
    });
  }
}

// ============================================================================
// EXPORTACIÓN
// ============================================================================

export const notificationSystem = new NotificationSystemImpl();
