// ============================================================================
// NOTIFICATION ROUTES - CRUD, SENDING, TEMPLATES, PREFERENCES
// ============================================================================

import express from 'express';
import { z } from 'zod';

import { notificationSystem } from '../../lib/notifications.js';
import { EmailProviderFactory } from '../../../packages/shared/src/notifications/providers/email.provider.js';
import { SMSProviderFactory } from '../../../packages/shared/src/notifications/providers/sms.provider.js';
import { PushProviderFactory } from '../../../packages/shared/src/notifications/providers/push.provider.js';
import { TemplateEngineFactory } from '../../../packages/shared/src/notifications/templates/template-engine.js';
import { authMiddleware } from '../middleware/auth.js';
import { logger } from '../lib/logger.js';

const router = express.Router();

// ============================================================================
// SCHEMAS
// ============================================================================

const CreateTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  type: z.enum(['info', 'success', 'warning', 'error', 'alert', 'reminder', 'update', 'announcement']),
  subject: z.string().optional(),
  body: z.string().min(1),
  variables: z.array(z.string()).optional(),
  channels: z.array(z.enum(['email', 'sms', 'push', 'in_app', 'webhook'])),
  isActive: z.boolean().default(true)
});

const CreateNotificationSchema = z.object({
  userId: z.string().uuid(),
  orgId: z.string().uuid(),
  type: z.enum(['info', 'success', 'warning', 'error', 'alert', 'reminder', 'update', 'announcement']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  data: z.record(z.any()).optional(),
  channels: z.array(z.enum(['email', 'sms', 'push', 'in_app', 'webhook'])),
  templateId: z.string().optional(),
  scheduledAt: z.string().datetime().optional()
});

const SendNotificationSchema = z.object({
  userId: z.string().uuid(),
  orgId: z.string().uuid(),
  type: z.enum(['info', 'success', 'warning', 'error', 'alert', 'reminder', 'update', 'announcement']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  data: z.record(z.any()).optional(),
  channels: z.array(z.enum(['email', 'sms', 'push', 'in_app', 'webhook'])),
  templateId: z.string().optional(),
  templateVariables: z.record(z.any()).optional(),
  scheduledAt: z.string().datetime().optional()
});

const UpdatePreferencesSchema = z.object({
  email: z.boolean().optional(),
  sms: z.boolean().optional(),
  push: z.boolean().optional(),
  in_app: z.boolean().optional(),
  webhook: z.boolean().optional(),
  quietHours: z.object({
    enabled: z.boolean(),
    startTime: z.string(),
    endTime: z.string(),
    timezone: z.string()
  }).optional(),
  preferences: z.record(z.boolean()).optional()
});

const NotificationFiltersSchema = z.object({
  status: z.enum(['pending', 'sent', 'failed', 'delivered', 'read']).optional(),
  type: z.enum(['info', 'success', 'warning', 'error', 'alert', 'reminder', 'update', 'announcement']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0)
});

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Apply authentication to all routes
router.use(authMiddleware);

// ============================================================================
// TEMPLATE ROUTES
// ============================================================================

// Create template
router.post('/templates', async (req, res) => {
  try {
    const templateData = CreateTemplateSchema.parse(req.body);
    
    const template = await notificationSystem.createTemplate(templateData);
    
    logger.info('Template created', {
      templateId: template.id,
      name: template.name,
      type: template.type,
      userId: req.user?.id
    });

    res.status(201).json({
      success: true,
      data: template,
      message: 'Template created successfully'
    });
  } catch (error) {
    logger.error('Failed to create template', {
      error: (error as Error).message,
      userId: req.user?.id
    });

    res.status(400).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// Get template
router.get('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const template = await notificationSystem.getTemplate(id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    logger.error('Failed to get template', {
      templateId: req.params.id,
      error: (error as Error).message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// List templates
router.get('/templates', async (req, res) => {
  try {
    const orgId = req.user?.orgId || req.query.orgId as string;
    
    if (!orgId) {
      return res.status(400).json({
        success: false,
        error: 'Organization ID is required'
      });
    }

    const templates = await notificationSystem.listTemplates(orgId);
    
    res.json({
      success: true,
      data: templates,
      count: templates.length
    });
  } catch (error) {
    logger.error('Failed to list templates', {
      error: (error as Error).message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update template
router.put('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = CreateTemplateSchema.partial().parse(req.body);
    
    const template = await notificationSystem.updateTemplate(id, updates);
    
    logger.info('Template updated', {
      templateId: id,
      userId: req.user?.id
    });

    res.json({
      success: true,
      data: template,
      message: 'Template updated successfully'
    });
  } catch (error) {
    logger.error('Failed to update template', {
      templateId: req.params.id,
      error: (error as Error).message,
      userId: req.user?.id
    });

    res.status(400).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// Delete template
router.delete('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await notificationSystem.deleteTemplate(id);
    
    logger.info('Template deleted', {
      templateId: id,
      userId: req.user?.id
    });

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    logger.error('Failed to delete template', {
      templateId: req.params.id,
      error: (error as Error).message,
      userId: req.user?.id
    });

    res.status(400).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// ============================================================================
// NOTIFICATION ROUTES
// ============================================================================

// Create notification
router.post('/notifications', async (req, res) => {
  try {
    const notificationData = CreateNotificationSchema.parse(req.body);
    
    const notification = await notificationSystem.createNotification(notificationData);
    
    logger.info('Notification created', {
      notificationId: notification.id,
      userId: notification.userId,
      type: notification.type,
      priority: notification.priority
    });

    res.status(201).json({
      success: true,
      data: notification,
      message: 'Notification created successfully'
    });
  } catch (error) {
    logger.error('Failed to create notification', {
      error: (error as Error).message,
      userId: req.user?.id
    });

    res.status(400).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// Get notification
router.get('/notifications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await notificationSystem.getNotification(id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    logger.error('Failed to get notification', {
      notificationId: req.params.id,
      error: (error as Error).message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// List notifications
router.get('/notifications', async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId as string;
    const orgId = req.user?.orgId || req.query.orgId as string;
    
    if (!userId || !orgId) {
      return res.status(400).json({
        success: false,
        error: 'User ID and Organization ID are required'
      });
    }

    const filters = NotificationFiltersSchema.parse(req.query);
    
    const notifications = await notificationSystem.listNotifications(userId, orgId, filters);
    
    res.json({
      success: true,
      data: notifications,
      count: notifications.length,
      filters
    });
  } catch (error) {
    logger.error('Failed to list notifications', {
      error: (error as Error).message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update notification
router.put('/notifications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = CreateNotificationSchema.partial().parse(req.body);
    
    const notification = await notificationSystem.updateNotification(id, updates);
    
    logger.info('Notification updated', {
      notificationId: id,
      userId: req.user?.id
    });

    res.json({
      success: true,
      data: notification,
      message: 'Notification updated successfully'
    });
  } catch (error) {
    logger.error('Failed to update notification', {
      notificationId: req.params.id,
      error: (error as Error).message,
      userId: req.user?.id
    });

    res.status(400).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// Delete notification
router.delete('/notifications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await notificationSystem.deleteNotification(id);
    
    logger.info('Notification deleted', {
      notificationId: id,
      userId: req.user?.id
    });

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    logger.error('Failed to delete notification', {
      notificationId: req.params.id,
      error: (error as Error).message,
      userId: req.user?.id
    });

    res.status(400).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// Mark as read
router.patch('/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await notificationSystem.markAsRead(id);
    
    logger.info('Notification marked as read', {
      notificationId: id,
      userId: req.user?.id
    });

    res.json({
      success: true,
      data: notification,
      message: 'Notification marked as read'
    });
  } catch (error) {
    logger.error('Failed to mark notification as read', {
      notificationId: req.params.id,
      error: (error as Error).message,
      userId: req.user?.id
    });

    res.status(400).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// Mark all as read
router.patch('/notifications/read-all', async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId;
    const orgId = req.user?.orgId || req.body.orgId;
    
    if (!userId || !orgId) {
      return res.status(400).json({
        success: false,
        error: 'User ID and Organization ID are required'
      });
    }

    await notificationSystem.markAllAsRead(userId, orgId);
    
    logger.info('All notifications marked as read', {
      userId,
      orgId
    });

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    logger.error('Failed to mark all notifications as read', {
      error: (error as Error).message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ============================================================================
// SENDING ROUTES
// ============================================================================

// Send notification
router.post('/send', async (req, res) => {
  try {
    const sendData = SendNotificationSchema.parse(req.body);
    
    // If template is provided, render it
    if (sendData.templateId && sendData.templateVariables) {
      const templateEngine = TemplateEngineFactory.create({
        engine: 'handlebars',
        defaultLanguage: 'es',
        supportedLanguages: ['es', 'en'],
        cacheEnabled: true,
        cacheSize: 100,
        strictMode: true,
        escapeHtml: true
      });

      const rendered = await templateEngine.render({
        templateId: sendData.templateId,
        variables: sendData.templateVariables
      });

      sendData.title = rendered.subject || sendData.title;
      sendData.message = rendered.body;
    }

    const notification = await notificationSystem.sendNotification(sendData);
    
    logger.info('Notification sent', {
      notificationId: notification.id,
      userId: notification.userId,
      type: notification.type,
      priority: notification.priority,
      channels: notification.channels
    });

    res.status(201).json({
      success: true,
      data: notification,
      message: 'Notification sent successfully'
    });
  } catch (error) {
    logger.error('Failed to send notification', {
      error: (error as Error).message,
      userId: req.user?.id
    });

    res.status(400).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// Send bulk notifications
router.post('/send/bulk', async (req, res) => {
  try {
    const notifications = z.array(SendNotificationSchema).parse(req.body);
    
    const results = await notificationSystem.sendBulkNotifications(notifications);
    
    logger.info('Bulk notifications sent', {
      total: notifications.length,
      successful: results.filter(r => r.status === 'sent').length,
      failed: results.filter(r => r.status === 'failed').length
    });

    res.status(201).json({
      success: true,
      data: results,
      message: 'Bulk notifications sent',
      summary: {
        total: notifications.length,
        successful: results.filter(r => r.status === 'sent').length,
        failed: results.filter(r => r.status === 'failed').length
      }
    });
  } catch (error) {
    logger.error('Failed to send bulk notifications', {
      error: (error as Error).message,
      userId: req.user?.id
    });

    res.status(400).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// Schedule notification
router.post('/schedule', async (req, res) => {
  try {
    const { notification, scheduledAt } = req.body;
    
    if (!scheduledAt) {
      return res.status(400).json({
        success: false,
        error: 'Scheduled time is required'
      });
    }

    const notificationData = CreateNotificationSchema.parse(notification);
    const scheduledDate = new Date(scheduledAt);
    
    if (scheduledDate <= new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Scheduled time must be in the future'
      });
    }

    const scheduledNotification = await notificationSystem.scheduleNotification(notificationData, scheduledDate);
    
    logger.info('Notification scheduled', {
      notificationId: scheduledNotification.id,
      scheduledAt: scheduledDate.toISOString(),
      userId: req.user?.id
    });

    res.status(201).json({
      success: true,
      data: scheduledNotification,
      message: 'Notification scheduled successfully'
    });
  } catch (error) {
    logger.error('Failed to schedule notification', {
      error: (error as Error).message,
      userId: req.user?.id
    });

    res.status(400).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// ============================================================================
// PREFERENCES ROUTES
// ============================================================================

// Get preferences
router.get('/preferences', async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId as string;
    const orgId = req.user?.orgId || req.query.orgId as string;
    
    if (!userId || !orgId) {
      return res.status(400).json({
        success: false,
        error: 'User ID and Organization ID are required'
      });
    }

    const preferences = await notificationSystem.getPreferences(userId, orgId);
    
    res.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    logger.error('Failed to get preferences', {
      error: (error as Error).message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update preferences
router.put('/preferences', async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId;
    const orgId = req.user?.orgId || req.body.orgId;
    
    if (!userId || !orgId) {
      return res.status(400).json({
        success: false,
        error: 'User ID and Organization ID are required'
      });
    }

    const updates = UpdatePreferencesSchema.parse(req.body);
    
    const preferences = await notificationSystem.updatePreferences(userId, orgId, updates);
    
    logger.info('Preferences updated', {
      userId,
      orgId
    });

    res.json({
      success: true,
      data: preferences,
      message: 'Preferences updated successfully'
    });
  } catch (error) {
    logger.error('Failed to update preferences', {
      error: (error as Error).message,
      userId: req.user?.id
    });

    res.status(400).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// ============================================================================
// STATISTICS ROUTES
// ============================================================================

// Get statistics
router.get('/statistics', async (req, res) => {
  try {
    const orgId = req.user?.orgId || req.query.orgId as string;
    
    if (!orgId) {
      return res.status(400).json({
        success: false,
        error: 'Organization ID is required'
      });
    }

    const stats = await notificationSystem.getStatistics(orgId);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Failed to get statistics', {
      error: (error as Error).message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get unread count
router.get('/unread-count', async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId as string;
    const orgId = req.user?.orgId || req.query.orgId as string;
    
    if (!userId || !orgId) {
      return res.status(400).json({
        success: false,
        error: 'User ID and Organization ID are required'
      });
    }

    const count = await notificationSystem.getUnreadCount(userId, orgId);
    
    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    logger.error('Failed to get unread count', {
      error: (error as Error).message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ============================================================================
// PROVIDER ROUTES
// ============================================================================

// Test email provider
router.post('/providers/email/test', async (req, res) => {
  try {
    const { config, message } = req.body;
    
    const provider = EmailProviderFactory.create(config);
    const result = await provider.send(message);
    
    res.json({
      success: true,
      data: result,
      message: 'Email test completed'
    });
  } catch (error) {
    logger.error('Email provider test failed', {
      error: (error as Error).message,
      userId: req.user?.id
    });

    res.status(400).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// Test SMS provider
router.post('/providers/sms/test', async (req, res) => {
  try {
    const { config, message } = req.body;
    
    const provider = SMSProviderFactory.create(config);
    const result = await provider.send(message);
    
    res.json({
      success: true,
      data: result,
      message: 'SMS test completed'
    });
  } catch (error) {
    logger.error('SMS provider test failed', {
      error: (error as Error).message,
      userId: req.user?.id
    });

    res.status(400).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// Test push provider
router.post('/providers/push/test', async (req, res) => {
  try {
    const { config, message } = req.body;
    
    const provider = PushProviderFactory.create(config);
    const result = await provider.send(message);
    
    res.json({
      success: true,
      data: result,
      message: 'Push test completed'
    });
  } catch (error) {
    logger.error('Push provider test failed', {
      error: (error as Error).message,
      userId: req.user?.id
    });

    res.status(400).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// ============================================================================
// TEMPLATE ENGINE ROUTES
// ============================================================================

// Render template
router.post('/templates/render', async (req, res) => {
  try {
    const { templateId, language, variables, context, options } = req.body;
    
    const templateEngine = TemplateEngineFactory.create({
      engine: 'handlebars',
      defaultLanguage: 'es',
      supportedLanguages: ['es', 'en'],
      cacheEnabled: true,
      cacheSize: 100,
      strictMode: true,
      escapeHtml: true
    });

    const result = await templateEngine.render({
      templateId,
      language,
      variables,
      context,
      options
    });
    
    res.json({
      success: true,
      data: result,
      message: 'Template rendered successfully'
    });
  } catch (error) {
    logger.error('Template render failed', {
      error: (error as Error).message,
      userId: req.user?.id
    });

    res.status(400).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// Validate template
router.post('/templates/validate', async (req, res) => {
  try {
    const template = req.body;
    
    const templateEngine = TemplateEngineFactory.create({
      engine: 'handlebars',
      defaultLanguage: 'es',
      supportedLanguages: ['es', 'en'],
      cacheEnabled: true,
      cacheSize: 100,
      strictMode: true,
      escapeHtml: true
    });

    const result = await templateEngine.validateTemplate(template);
    
    res.json({
      success: true,
      data: result,
      message: 'Template validation completed'
    });
  } catch (error) {
    logger.error('Template validation failed', {
      error: (error as Error).message,
      userId: req.user?.id
    });

    res.status(400).json({
      success: false,
      error: (error as Error).message
    });
  }
});

export default router;
