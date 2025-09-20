import { z } from "zod";
import { logger } from './logger.js';
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
export class NotificationSystemImpl {
    templates = new Map();
    notifications = new Map();
    preferences = new Map();
    constructor() {
        this.initializeDefaultTemplates();
        logger.info('Notification system initialized', {
            system: 'notifications',
            templatesCount: this.templates.size,
            notificationsCount: 0
        });
    }
    async createTemplate(template) {
        try {
            const id = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const now = new Date();
            const newTemplate = {
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
        }
        catch (error) {
            logger.error('Failed to create notification template', {
                system: 'notifications',
                error: error.message
            });
            throw error;
        }
    }
    async getTemplate(id) {
        try {
            const template = this.templates.get(id);
            if (template) {
                logger.info('Notification template retrieved', {
                    system: 'notifications',
                    templateId: id
                });
            }
            return template || null;
        }
        catch (error) {
            logger.error('Failed to get notification template', {
                system: 'notifications',
                error: error.message,
                templateId: id
            });
            throw error;
        }
    }
    async listTemplates(orgId) {
        try {
            const templates = Array.from(this.templates.values())
                .filter(t => t.isActive);
            logger.info('Notification templates listed', {
                system: 'notifications',
                orgId,
                count: templates.length
            });
            return templates;
        }
        catch (error) {
            logger.error('Failed to list notification templates', {
                system: 'notifications',
                error: error.message
            });
            throw error;
        }
    }
    async updateTemplate(id, updates) {
        try {
            const template = this.templates.get(id);
            if (!template) {
                throw new Error('Template not found');
            }
            const updatedTemplate = {
                ...template,
                ...updates,
                id,
                updatedAt: new Date()
            };
            this.templates.set(id, updatedTemplate);
            logger.info('Notification template updated', {
                system: 'notifications',
                templateId: id
            });
            return updatedTemplate;
        }
        catch (error) {
            logger.error('Failed to update notification template', {
                system: 'notifications',
                error: error.message,
                templateId: id
            });
            throw error;
        }
    }
    async deleteTemplate(id) {
        try {
            const deleted = this.templates.delete(id);
            if (deleted) {
                logger.info('Notification template deleted', {
                    system: 'notifications',
                    templateId: id
                });
            }
            else {
                throw new Error('Template not found');
            }
        }
        catch (error) {
            logger.error('Failed to delete notification template', {
                system: 'notifications',
                error: error.message,
                templateId: id
            });
            throw error;
        }
    }
    async createNotification(notification) {
        try {
            const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const now = new Date();
            const newNotification = {
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
        }
        catch (error) {
            logger.error('Failed to create notification', {
                system: 'notifications',
                error: error.message
            });
            throw error;
        }
    }
    async getNotification(id) {
        try {
            const notification = this.notifications.get(id);
            if (notification) {
                logger.info('Notification retrieved', {
                    system: 'notifications',
                    notificationId: id
                });
            }
            return notification || null;
        }
        catch (error) {
            logger.error('Failed to get notification', {
                system: 'notifications',
                error: error.message,
                notificationId: id
            });
            throw error;
        }
    }
    async listNotifications(userId, orgId, filters) {
        try {
            let notifications = Array.from(this.notifications.values())
                .filter(n => n.userId === userId && n.orgId === orgId);
            if (filters?.status) {
                notifications = notifications.filter(n => n.status === filters.status);
            }
            if (filters?.type) {
                notifications = notifications.filter(n => n.type === filters.type);
            }
            if (filters?.priority) {
                notifications = notifications.filter(n => n.priority === filters.priority);
            }
            notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
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
        }
        catch (error) {
            logger.error('Failed to list notifications', {
                system: 'notifications',
                error: error.message
            });
            throw error;
        }
    }
    async updateNotification(id, updates) {
        try {
            const notification = this.notifications.get(id);
            if (!notification) {
                throw new Error('Notification not found');
            }
            const updatedNotification = {
                ...notification,
                ...updates,
                id,
                updatedAt: new Date()
            };
            this.notifications.set(id, updatedNotification);
            logger.info('Notification updated', {
                system: 'notifications',
                notificationId: id
            });
            return updatedNotification;
        }
        catch (error) {
            logger.error('Failed to update notification', {
                system: 'notifications',
                error: error.message,
                notificationId: id
            });
            throw error;
        }
    }
    async deleteNotification(id) {
        try {
            const deleted = this.notifications.delete(id);
            if (deleted) {
                logger.info('Notification deleted', {
                    system: 'notifications',
                    notificationId: id
                });
            }
            else {
                throw new Error('Notification not found');
            }
        }
        catch (error) {
            logger.error('Failed to delete notification', {
                system: 'notifications',
                error: error.message,
                notificationId: id
            });
            throw error;
        }
    }
    async markAsRead(id) {
        try {
            const notification = this.notifications.get(id);
            if (!notification) {
                throw new Error('Notification not found');
            }
            const updatedNotification = {
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
        }
        catch (error) {
            logger.error('Failed to mark notification as read', {
                system: 'notifications',
                error: error.message,
                notificationId: id
            });
            throw error;
        }
    }
    async markAllAsRead(userId, orgId) {
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
        }
        catch (error) {
            logger.error('Failed to mark all notifications as read', {
                system: 'notifications',
                error: error.message
            });
            throw error;
        }
    }
    async getPreferences(userId, orgId) {
        try {
            const key = `${userId}_${orgId}`;
            let preferences = this.preferences.get(key);
            if (!preferences) {
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
        }
        catch (error) {
            logger.error('Failed to get notification preferences', {
                system: 'notifications',
                error: error.message
            });
            throw error;
        }
    }
    async updatePreferences(userId, orgId, updates) {
        try {
            const key = `${userId}_${orgId}`;
            const currentPreferences = await this.getPreferences(userId, orgId);
            const updatedPreferences = {
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
        }
        catch (error) {
            logger.error('Failed to update notification preferences', {
                system: 'notifications',
                error: error.message
            });
            throw error;
        }
    }
    async sendNotification(notification) {
        try {
            const newNotification = await this.createNotification(notification);
            const preferences = await this.getPreferences(notification.userId, notification.orgId);
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
                return await this.updateNotification(newNotification.id, {
                    status: 'sent',
                    sentAt: new Date()
                });
            }
            const sentAt = new Date();
            let status = 'sent';
            for (const channel of allowedChannels) {
                try {
                    await this.sendToChannel(newNotification, channel);
                    logger.info('Notification sent to channel', {
                        system: 'notifications',
                        notificationId: newNotification.id,
                        channel,
                        userId: notification.userId
                    });
                }
                catch (error) {
                    logger.error('Failed to send notification to channel', {
                        system: 'notifications',
                        notificationId: newNotification.id,
                        channel,
                        error: error.message
                    });
                    status = 'failed';
                }
            }
            return await this.updateNotification(newNotification.id, {
                status,
                sentAt
            });
        }
        catch (error) {
            logger.error('Failed to send notification', {
                system: 'notifications',
                error: error.message
            });
            throw error;
        }
    }
    async sendBulkNotifications(notifications) {
        try {
            const results = [];
            for (const notification of notifications) {
                try {
                    const result = await this.sendNotification(notification);
                    results.push(result);
                }
                catch (error) {
                    logger.error('Failed to send bulk notification', {
                        system: 'notifications',
                        error: error.message
                    });
                }
            }
            logger.info('Bulk notifications sent', {
                system: 'notifications',
                total: notifications.length,
                successful: results.length
            });
            return results;
        }
        catch (error) {
            logger.error('Failed to send bulk notifications', {
                system: 'notifications',
                error: error.message
            });
            throw error;
        }
    }
    async scheduleNotification(notification, scheduledAt) {
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
        }
        catch (error) {
            logger.error('Failed to schedule notification', {
                system: 'notifications',
                error: error.message
            });
            throw error;
        }
    }
    async getStatistics(orgId) {
        try {
            const notifications = Array.from(this.notifications.values())
                .filter(n => n.orgId === orgId);
            const stats = {
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
            for (const notification of notifications) {
                stats.byStatus[notification.status] = (stats.byStatus[notification.status] || 0) + 1;
                stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;
                stats.byPriority[notification.priority] = (stats.byPriority[notification.priority] || 0) + 1;
                for (const channel of notification.channels) {
                    stats.byChannel[channel] = (stats.byChannel[channel] || 0) + 1;
                }
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
        }
        catch (error) {
            logger.error('Failed to get notification statistics', {
                system: 'notifications',
                error: error.message
            });
            throw error;
        }
    }
    async getUnreadCount(userId, orgId) {
        try {
            const notifications = Array.from(this.notifications.values())
                .filter(n => n.userId === userId && n.orgId === orgId && n.status !== 'read');
            return notifications.length;
        }
        catch (error) {
            logger.error('Failed to get unread count', {
                system: 'notifications',
                error: error.message
            });
            throw error;
        }
    }
    async validateTemplate(template) {
        try {
            if (!template.name || !template.subject || !template.body) {
                return false;
            }
            if (template.channels.length === 0) {
                return false;
            }
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
        }
        catch (error) {
            logger.error('Failed to validate template', {
                system: 'notifications',
                error: error.message
            });
            return false;
        }
    }
    initializeDefaultTemplates() {
        const defaultTemplates = [
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
    async sendToChannel(notification, channel) {
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
    async simulateEmailSend(notification) {
        await new Promise(resolve => setTimeout(resolve, 100));
        logger.info('Email sent (simulated)', {
            system: 'notifications',
            notificationId: notification.id,
            to: notification.userId
        });
    }
    async simulateSMSSend(notification) {
        await new Promise(resolve => setTimeout(resolve, 50));
        logger.info('SMS sent (simulated)', {
            system: 'notifications',
            notificationId: notification.id,
            to: notification.userId
        });
    }
    async simulatePushSend(notification) {
        await new Promise(resolve => setTimeout(resolve, 30));
        logger.info('Push notification sent (simulated)', {
            system: 'notifications',
            notificationId: notification.id,
            to: notification.userId
        });
    }
    async simulateInAppSend(notification) {
        await new Promise(resolve => setTimeout(resolve, 10));
        logger.info('In-app notification sent (simulated)', {
            system: 'notifications',
            notificationId: notification.id,
            to: notification.userId
        });
    }
    async simulateWebhookSend(notification) {
        await new Promise(resolve => setTimeout(resolve, 200));
        logger.info('Webhook sent (simulated)', {
            system: 'notifications',
            notificationId: notification.id,
            to: notification.userId
        });
    }
}
export const notificationSystem = new NotificationSystemImpl();
//# sourceMappingURL=notifications.js.map