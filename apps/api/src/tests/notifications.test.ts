// ============================================================================
// NOTIFICATION SYSTEM TESTS
// ============================================================================

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { notificationSystem } from '../lib/notifications.js';
import { EmailProviderFactory } from '../../../packages/shared/src/notifications/providers/email.provider.js';
import { SMSProviderFactory } from '../../../packages/shared/src/notifications/providers/sms.provider.js';
import { PushProviderFactory } from '../../../packages/shared/src/notifications/providers/push.provider.js';
import { TemplateEngineFactory } from '../../../packages/shared/src/notifications/templates/template-engine.js';

// ============================================================================
// MOCK DATA
// ============================================================================

const mockTemplate = {
  name: 'Test Template',
  description: 'Test template description',
  type: 'info' as const,
  subject: 'Test Subject: {{user_name}}',
  body: 'Hello {{user_name}}, this is a test message for {{app_name}}.',
  variables: ['user_name', 'app_name'],
  channels: ['email', 'in_app'] as const,
  isActive: true
};

const mockNotification = {
  userId: 'user-123',
  orgId: 'org-456',
  type: 'info' as const,
  priority: 'medium' as const,
  title: 'Test Notification',
  message: 'This is a test notification',
  data: { test: true },
  channels: ['email', 'in_app'] as const
};

const mockEmailConfig = {
  provider: 'sendgrid' as const,
  apiKey: 'test-api-key',
  fromEmail: 'test@example.com',
  fromName: 'Test Sender',
  testMode: true
};

const mockSMSConfig = {
  provider: 'twilio' as const,
  accountSid: 'test-account-sid',
  authToken: 'test-auth-token',
  fromNumber: '+1234567890',
  testMode: true
};

const mockPushConfig = {
  provider: 'firebase' as const,
  serverKey: 'test-server-key',
  projectId: 'test-project-id',
  testMode: true
};

// ============================================================================
// NOTIFICATION SYSTEM TESTS
// ============================================================================

describe('Notification System', () => {
  beforeEach(() => {
    // Clear any existing data
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Template Management', () => {
    it('should create a template successfully', async () => {
      const template = await notificationSystem.createTemplate(mockTemplate);
      
      expect(template).toBeDefined();
      expect(template.id).toBeDefined();
      expect(template.name).toBe(mockTemplate.name);
      expect(template.type).toBe(mockTemplate.type);
      expect(template.body).toBe(mockTemplate.body);
      expect(template.variables).toEqual(mockTemplate.variables);
      expect(template.channels).toEqual(mockTemplate.channels);
      expect(template.isActive).toBe(true);
      expect(template.createdAt).toBeInstanceOf(Date);
      expect(template.updatedAt).toBeInstanceOf(Date);
    });

    it('should get a template by ID', async () => {
      const createdTemplate = await notificationSystem.createTemplate(mockTemplate);
      const retrievedTemplate = await notificationSystem.getTemplate(createdTemplate.id);
      
      expect(retrievedTemplate).toBeDefined();
      expect(retrievedTemplate?.id).toBe(createdTemplate.id);
      expect(retrievedTemplate?.name).toBe(mockTemplate.name);
    });

    it('should return null for non-existent template', async () => {
      const template = await notificationSystem.getTemplate('non-existent-id');
      expect(template).toBeNull();
    });

    it('should list templates for organization', async () => {
      await notificationSystem.createTemplate(mockTemplate);
      const templates = await notificationSystem.listTemplates('org-456');
      
      expect(templates).toBeDefined();
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
    });

    it('should update a template', async () => {
      const createdTemplate = await notificationSystem.createTemplate(mockTemplate);
      const updates = { name: 'Updated Template Name', isActive: false };
      
      const updatedTemplate = await notificationSystem.updateTemplate(createdTemplate.id, updates);
      
      expect(updatedTemplate.name).toBe(updates.name);
      expect(updatedTemplate.isActive).toBe(updates.isActive);
      expect(updatedTemplate.updatedAt.getTime()).toBeGreaterThan(createdTemplate.updatedAt.getTime());
    });

    it('should delete a template', async () => {
      const createdTemplate = await notificationSystem.createTemplate(mockTemplate);
      
      await notificationSystem.deleteTemplate(createdTemplate.id);
      
      const deletedTemplate = await notificationSystem.getTemplate(createdTemplate.id);
      expect(deletedTemplate).toBeNull();
    });

    it('should throw error when updating non-existent template', async () => {
      await expect(
        notificationSystem.updateTemplate('non-existent-id', { name: 'Updated' })
      ).rejects.toThrow('Template not found');
    });

    it('should throw error when deleting non-existent template', async () => {
      await expect(
        notificationSystem.deleteTemplate('non-existent-id')
      ).rejects.toThrow('Template not found');
    });
  });

  describe('Notification Management', () => {
    it('should create a notification successfully', async () => {
      const notification = await notificationSystem.createNotification(mockNotification);
      
      expect(notification).toBeDefined();
      expect(notification.id).toBeDefined();
      expect(notification.userId).toBe(mockNotification.userId);
      expect(notification.orgId).toBe(mockNotification.orgId);
      expect(notification.type).toBe(mockNotification.type);
      expect(notification.priority).toBe(mockNotification.priority);
      expect(notification.title).toBe(mockNotification.title);
      expect(notification.message).toBe(mockNotification.message);
      expect(notification.channels).toEqual(mockNotification.channels);
      expect(notification.status).toBe('pending');
      expect(notification.createdAt).toBeInstanceOf(Date);
      expect(notification.updatedAt).toBeInstanceOf(Date);
    });

    it('should get a notification by ID', async () => {
      const createdNotification = await notificationSystem.createNotification(mockNotification);
      const retrievedNotification = await notificationSystem.getNotification(createdNotification.id);
      
      expect(retrievedNotification).toBeDefined();
      expect(retrievedNotification?.id).toBe(createdNotification.id);
      expect(retrievedNotification?.title).toBe(mockNotification.title);
    });

    it('should return null for non-existent notification', async () => {
      const notification = await notificationSystem.getNotification('non-existent-id');
      expect(notification).toBeNull();
    });

    it('should list notifications with filters', async () => {
      await notificationSystem.createNotification(mockNotification);
      const notifications = await notificationSystem.listNotifications(
        mockNotification.userId,
        mockNotification.orgId,
        { limit: 10, offset: 0 }
      );
      
      expect(notifications).toBeDefined();
      expect(Array.isArray(notifications)).toBe(true);
      expect(notifications.length).toBeGreaterThan(0);
    });

    it('should filter notifications by status', async () => {
      await notificationSystem.createNotification(mockNotification);
      const notifications = await notificationSystem.listNotifications(
        mockNotification.userId,
        mockNotification.orgId,
        { status: 'pending' }
      );
      
      expect(notifications).toBeDefined();
      expect(notifications.every(n => n.status === 'pending')).toBe(true);
    });

    it('should filter notifications by type', async () => {
      await notificationSystem.createNotification(mockNotification);
      const notifications = await notificationSystem.listNotifications(
        mockNotification.userId,
        mockNotification.orgId,
        { type: 'info' }
      );
      
      expect(notifications).toBeDefined();
      expect(notifications.every(n => n.type === 'info')).toBe(true);
    });

    it('should filter notifications by priority', async () => {
      await notificationSystem.createNotification(mockNotification);
      const notifications = await notificationSystem.listNotifications(
        mockNotification.userId,
        mockNotification.orgId,
        { priority: 'medium' }
      );
      
      expect(notifications).toBeDefined();
      expect(notifications.every(n => n.priority === 'medium')).toBe(true);
    });

    it('should update a notification', async () => {
      const createdNotification = await notificationSystem.createNotification(mockNotification);
      const updates = { title: 'Updated Title', status: 'sent' as const };
      
      const updatedNotification = await notificationSystem.updateNotification(createdNotification.id, updates);
      
      expect(updatedNotification.title).toBe(updates.title);
      expect(updatedNotification.status).toBe(updates.status);
      expect(updatedNotification.updatedAt.getTime()).toBeGreaterThan(createdNotification.updatedAt.getTime());
    });

    it('should delete a notification', async () => {
      const createdNotification = await notificationSystem.createNotification(mockNotification);
      
      await notificationSystem.deleteNotification(createdNotification.id);
      
      const deletedNotification = await notificationSystem.getNotification(createdNotification.id);
      expect(deletedNotification).toBeNull();
    });

    it('should mark notification as read', async () => {
      const createdNotification = await notificationSystem.createNotification(mockNotification);
      
      const readNotification = await notificationSystem.markAsRead(createdNotification.id);
      
      expect(readNotification.status).toBe('read');
      expect(readNotification.readAt).toBeDefined();
      expect(readNotification.readAt).toBeInstanceOf(Date);
    });

    it('should mark all notifications as read', async () => {
      await notificationSystem.createNotification(mockNotification);
      await notificationSystem.createNotification({ ...mockNotification, title: 'Another Notification' });
      
      await notificationSystem.markAllAsRead(mockNotification.userId, mockNotification.orgId);
      
      const notifications = await notificationSystem.listNotifications(
        mockNotification.userId,
        mockNotification.orgId
      );
      
      expect(notifications.every(n => n.status === 'read')).toBe(true);
    });

    it('should throw error when updating non-existent notification', async () => {
      await expect(
        notificationSystem.updateNotification('non-existent-id', { title: 'Updated' })
      ).rejects.toThrow('Notification not found');
    });

    it('should throw error when deleting non-existent notification', async () => {
      await expect(
        notificationSystem.deleteNotification('non-existent-id')
      ).rejects.toThrow('Notification not found');
    });

    it('should throw error when marking non-existent notification as read', async () => {
      await expect(
        notificationSystem.markAsRead('non-existent-id')
      ).rejects.toThrow('Notification not found');
    });
  });

  describe('Preferences Management', () => {
    it('should get default preferences for new user', async () => {
      const preferences = await notificationSystem.getPreferences('new-user', 'new-org');
      
      expect(preferences).toBeDefined();
      expect(preferences.userId).toBe('new-user');
      expect(preferences.orgId).toBe('new-org');
      expect(preferences.email).toBe(true);
      expect(preferences.sms).toBe(false);
      expect(preferences.push).toBe(true);
      expect(preferences.in_app).toBe(true);
      expect(preferences.webhook).toBe(false);
      expect(preferences.quietHours).toBeDefined();
      expect(preferences.quietHours?.enabled).toBe(false);
      expect(preferences.createdAt).toBeInstanceOf(Date);
      expect(preferences.updatedAt).toBeInstanceOf(Date);
    });

    it('should update preferences', async () => {
      const updates = { email: false, sms: true, push: false };
      
      const updatedPreferences = await notificationSystem.updatePreferences(
        'new-user',
        'new-org',
        updates
      );
      
      expect(updatedPreferences.email).toBe(updates.email);
      expect(updatedPreferences.sms).toBe(updates.sms);
      expect(updatedPreferences.push).toBe(updates.push);
      expect(updatedPreferences.updatedAt.getTime()).toBeGreaterThan(updatedPreferences.createdAt.getTime());
    });

    it('should update quiet hours', async () => {
      const quietHours = {
        enabled: true,
        startTime: '22:00',
        endTime: '08:00',
        timezone: 'Europe/Madrid'
      };
      
      const updatedPreferences = await notificationSystem.updatePreferences(
        'new-user',
        'new-org',
        { quietHours }
      );
      
      expect(updatedPreferences.quietHours).toEqual(quietHours);
    });
  });

  describe('Sending Notifications', () => {
    it('should send notification successfully', async () => {
      const notification = await notificationSystem.sendNotification(mockNotification);
      
      expect(notification).toBeDefined();
      expect(notification.status).toBe('sent');
      expect(notification.sentAt).toBeDefined();
      expect(notification.sentAt).toBeInstanceOf(Date);
    });

    it('should send bulk notifications', async () => {
      const notifications = [
        mockNotification,
        { ...mockNotification, title: 'Second Notification' },
        { ...mockNotification, title: 'Third Notification' }
      ];
      
      const results = await notificationSystem.sendBulkNotifications(notifications);
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(3);
      expect(results.every(r => r.status === 'sent')).toBe(true);
    });

    it('should schedule notification', async () => {
      const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
      
      const notification = await notificationSystem.scheduleNotification(mockNotification, scheduledAt);
      
      expect(notification).toBeDefined();
      expect(notification.scheduledAt).toBeDefined();
      expect(notification.scheduledAt).toEqual(scheduledAt);
      expect(notification.status).toBe('pending');
    });

    it('should respect user preferences when sending', async () => {
      // Set user preferences to disable email
      await notificationSystem.updatePreferences(
        mockNotification.userId,
        mockNotification.orgId,
        { email: false, sms: false, push: false, in_app: true }
      );
      
      const notification = await notificationSystem.sendNotification(mockNotification);
      
      expect(notification).toBeDefined();
      expect(notification.status).toBe('sent');
    });
  });

  describe('Statistics', () => {
    it('should get notification statistics', async () => {
      await notificationSystem.createNotification(mockNotification);
      await notificationSystem.createNotification({ ...mockNotification, type: 'warning' });
      await notificationSystem.createNotification({ ...mockNotification, priority: 'high' });
      
      const stats = await notificationSystem.getStatistics(mockNotification.orgId);
      
      expect(stats).toBeDefined();
      expect(stats.total).toBeGreaterThan(0);
      expect(stats.byStatus).toBeDefined();
      expect(stats.byType).toBeDefined();
      expect(stats.byPriority).toBeDefined();
      expect(stats.byChannel).toBeDefined();
      expect(stats.recentActivity).toBeDefined();
    });

    it('should get unread count', async () => {
      await notificationSystem.createNotification(mockNotification);
      await notificationSystem.createNotification({ ...mockNotification, title: 'Another Notification' });
      
      const count = await notificationSystem.getUnreadCount(mockNotification.userId, mockNotification.orgId);
      
      expect(count).toBeGreaterThan(0);
    });

    it('should return zero unread count after marking all as read', async () => {
      await notificationSystem.createNotification(mockNotification);
      await notificationSystem.markAllAsRead(mockNotification.userId, mockNotification.orgId);
      
      const count = await notificationSystem.getUnreadCount(mockNotification.userId, mockNotification.orgId);
      
      expect(count).toBe(0);
    });
  });

  describe('Template Validation', () => {
    it('should validate template successfully', async () => {
      const template = await notificationSystem.createTemplate(mockTemplate);
      const isValid = await notificationSystem.validateTemplate(template);
      
      expect(isValid).toBe(true);
    });

    it('should validate template with missing variables', async () => {
      const invalidTemplate = {
        ...mockTemplate,
        body: 'Hello {{user_name}}, this is a test message for {{app_name}} and {{missing_variable}}.',
        variables: ['user_name', 'app_name'] // missing_variable is not declared
      };
      
      const template = await notificationSystem.createTemplate(invalidTemplate);
      const isValid = await notificationSystem.validateTemplate(template);
      
      expect(isValid).toBe(false);
    });
  });
});

// ============================================================================
// EMAIL PROVIDER TESTS
// ============================================================================

describe('Email Providers', () => {
  describe('SendGrid Provider', () => {
    it('should create SendGrid provider', () => {
      const provider = EmailProviderFactory.create(mockEmailConfig);
      expect(provider).toBeDefined();
    });

    it('should send email in test mode', async () => {
      const provider = EmailProviderFactory.create(mockEmailConfig);
      const message = {
        to: ['test@example.com'],
        subject: 'Test Email',
        html: '<p>Test message</p>',
        text: 'Test message'
      };
      
      const result = await provider.send(message);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.provider).toBe('sendgrid');
      expect(result.messageId).toBeDefined();
      expect(result.metadata?.testMode).toBe(true);
    });

    it('should send bulk emails', async () => {
      const provider = EmailProviderFactory.create(mockEmailConfig);
      const messages = [
        { to: ['test1@example.com'], subject: 'Test 1', text: 'Message 1' },
        { to: ['test2@example.com'], subject: 'Test 2', text: 'Message 2' }
      ];
      
      const results = await provider.sendBulk(messages);
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(2);
      expect(results.every(r => r.success)).toBe(true);
    });

    it('should validate config', async () => {
      const provider = EmailProviderFactory.create(mockEmailConfig);
      const isValid = await provider.validateConfig();
      
      expect(isValid).toBe(true);
    });

    it('should get quota', async () => {
      const provider = EmailProviderFactory.create(mockEmailConfig);
      const quota = await provider.getQuota();
      
      expect(quota).toBeDefined();
      expect(quota.used).toBeGreaterThanOrEqual(0);
      expect(quota.limit).toBeGreaterThan(0);
      expect(quota.resetAt).toBeInstanceOf(Date);
    });
  });

  describe('AWS SES Provider', () => {
    it('should create AWS SES provider', () => {
      const config = { ...mockEmailConfig, provider: 'aws_ses' as const };
      const provider = EmailProviderFactory.create(config);
      expect(provider).toBeDefined();
    });

    it('should send email via AWS SES', async () => {
      const config = { ...mockEmailConfig, provider: 'aws_ses' as const };
      const provider = EmailProviderFactory.create(config);
      const message = {
        to: ['test@example.com'],
        subject: 'Test Email',
        html: '<p>Test message</p>'
      };
      
      const result = await provider.send(message);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.provider).toBe('aws_ses');
    });
  });

  describe('SMTP Provider', () => {
    it('should create SMTP provider', () => {
      const config = { 
        ...mockEmailConfig, 
        provider: 'smtp' as const,
        host: 'smtp.example.com',
        port: 587,
        username: 'user',
        password: 'pass'
      };
      const provider = EmailProviderFactory.create(config);
      expect(provider).toBeDefined();
    });

    it('should send email via SMTP', async () => {
      const config = { 
        ...mockEmailConfig, 
        provider: 'smtp' as const,
        host: 'smtp.example.com',
        port: 587,
        username: 'user',
        password: 'pass'
      };
      const provider = EmailProviderFactory.create(config);
      const message = {
        to: ['test@example.com'],
        subject: 'Test Email',
        text: 'Test message'
      };
      
      const result = await provider.send(message);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.provider).toBe('smtp');
    });
  });
});

// ============================================================================
// SMS PROVIDER TESTS
// ============================================================================

describe('SMS Providers', () => {
  describe('Twilio Provider', () => {
    it('should create Twilio provider', () => {
      const provider = SMSProviderFactory.create(mockSMSConfig);
      expect(provider).toBeDefined();
    });

    it('should send SMS in test mode', async () => {
      const provider = SMSProviderFactory.create(mockSMSConfig);
      const message = {
        to: '+1234567890',
        message: 'Test SMS message'
      };
      
      const result = await provider.send(message);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.provider).toBe('twilio');
      expect(result.messageId).toBeDefined();
      expect(result.metadata?.testMode).toBe(true);
    });

    it('should get message status', async () => {
      const provider = SMSProviderFactory.create(mockSMSConfig);
      const status = await provider.getMessageStatus('test-message-id');
      
      expect(status).toBeDefined();
      expect(status.status).toBeDefined();
    });
  });

  describe('AWS SNS Provider', () => {
    it('should create AWS SNS provider', () => {
      const config = { ...mockSMSConfig, provider: 'aws_sns' as const };
      const provider = SMSProviderFactory.create(config);
      expect(provider).toBeDefined();
    });

    it('should send SMS via AWS SNS', async () => {
      const config = { ...mockSMSConfig, provider: 'aws_sns' as const };
      const provider = SMSProviderFactory.create(config);
      const message = {
        to: '+1234567890',
        message: 'Test SMS message'
      };
      
      const result = await provider.send(message);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.provider).toBe('aws_sns');
    });
  });

  describe('Vonage Provider', () => {
    it('should create Vonage provider', () => {
      const config = { ...mockSMSConfig, provider: 'vonage' as const };
      const provider = SMSProviderFactory.create(config);
      expect(provider).toBeDefined();
    });

    it('should send SMS via Vonage', async () => {
      const config = { ...mockSMSConfig, provider: 'vonage' as const };
      const provider = SMSProviderFactory.create(config);
      const message = {
        to: '+1234567890',
        message: 'Test SMS message'
      };
      
      const result = await provider.send(message);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.provider).toBe('vonage');
    });
  });
});

// ============================================================================
// PUSH PROVIDER TESTS
// ============================================================================

describe('Push Providers', () => {
  describe('Firebase Provider', () => {
    it('should create Firebase provider', () => {
      const provider = PushProviderFactory.create(mockPushConfig);
      expect(provider).toBeDefined();
    });

    it('should send push notification in test mode', async () => {
      const provider = PushProviderFactory.create(mockPushConfig);
      const message = {
        to: 'test-device-token',
        title: 'Test Push',
        body: 'Test push message'
      };
      
      const result = await provider.send(message);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.provider).toBe('firebase');
      expect(result.messageId).toBeDefined();
      expect(result.metadata?.testMode).toBe(true);
    });

    it('should send to multiple devices', async () => {
      const provider = PushProviderFactory.create(mockPushConfig);
      const message = {
        to: ['token1', 'token2', 'token3'],
        title: 'Test Push',
        body: 'Test push message'
      };
      
      const result = await provider.send(message);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.metadata?.successCount).toBeGreaterThan(0);
    });
  });

  describe('Web Push Provider', () => {
    it('should create Web Push provider', () => {
      const config = { 
        ...mockPushConfig, 
        provider: 'web_push' as const,
        vapidPublicKey: 'test-public-key',
        vapidPrivateKey: 'test-private-key',
        vapidSubject: 'test@example.com'
      };
      const provider = PushProviderFactory.create(config);
      expect(provider).toBeDefined();
    });

    it('should send web push notification', async () => {
      const config = { 
        ...mockPushConfig, 
        provider: 'web_push' as const,
        vapidPublicKey: 'test-public-key',
        vapidPrivateKey: 'test-private-key',
        vapidSubject: 'test@example.com'
      };
      const provider = PushProviderFactory.create(config);
      const message = {
        to: 'test-subscription',
        title: 'Test Web Push',
        body: 'Test web push message'
      };
      
      const result = await provider.send(message);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.provider).toBe('web_push');
    });
  });

  describe('APNS Provider', () => {
    it('should create APNS provider', () => {
      const config = { 
        ...mockPushConfig, 
        provider: 'apns' as const,
        privateKey: 'test-private-key',
        keyId: 'test-key-id',
        teamId: 'test-team-id',
        bundleId: 'com.test.app'
      };
      const provider = PushProviderFactory.create(config);
      expect(provider).toBeDefined();
    });

    it('should send APNS notification', async () => {
      const config = { 
        ...mockPushConfig, 
        provider: 'apns' as const,
        privateKey: 'test-private-key',
        keyId: 'test-key-id',
        teamId: 'test-team-id',
        bundleId: 'com.test.app'
      };
      const provider = PushProviderFactory.create(config);
      const message = {
        to: 'test-device-token',
        title: 'Test APNS',
        body: 'Test APNS message'
      };
      
      const result = await provider.send(message);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.provider).toBe('apns');
    });
  });
});

// ============================================================================
// TEMPLATE ENGINE TESTS
// ============================================================================

describe('Template Engine', () => {
  describe('Handlebars Engine', () => {
    it('should create Handlebars engine', () => {
      const engine = TemplateEngineFactory.create({
        engine: 'handlebars',
        defaultLanguage: 'es',
        supportedLanguages: ['es', 'en'],
        cacheEnabled: true,
        cacheSize: 100,
        strictMode: true,
        escapeHtml: true
      });
      expect(engine).toBeDefined();
    });

    it('should render template with variables', async () => {
      const engine = TemplateEngineFactory.create({
        engine: 'handlebars',
        defaultLanguage: 'es',
        supportedLanguages: ['es', 'en'],
        cacheEnabled: true,
        cacheSize: 100,
        strictMode: true,
        escapeHtml: true
      });

      const result = await engine.render({
        templateId: 'welcome-email',
        variables: {
          user_name: 'John Doe',
          app_name: 'ECONEURA'
        }
      });

      expect(result).toBeDefined();
      expect(result.body).toContain('John Doe');
      expect(result.body).toContain('ECONEURA');
      expect(result.language).toBe('es');
      expect(result.templateId).toBe('welcome-email');
    });

    it('should handle conditionals', async () => {
      const engine = TemplateEngineFactory.create({
        engine: 'handlebars',
        defaultLanguage: 'es',
        supportedLanguages: ['es', 'en'],
        cacheEnabled: true,
        cacheSize: 100,
        strictMode: true,
        escapeHtml: true
      });

      const result = await engine.render({
        templateId: 'welcome-email',
        variables: {
          user_name: 'John Doe',
          app_name: 'ECONEURA',
          is_premium: true
        }
      });

      expect(result).toBeDefined();
      expect(result.body).toContain('John Doe');
    });

    it('should validate template', async () => {
      const engine = TemplateEngineFactory.create({
        engine: 'handlebars',
        defaultLanguage: 'es',
        supportedLanguages: ['es', 'en'],
        cacheEnabled: true,
        cacheSize: 100,
        strictMode: true,
        escapeHtml: true
      });

      const template = {
        id: 'test-template',
        name: 'Test Template',
        type: 'email' as const,
        language: 'es',
        body: 'Hello {{user_name}}',
        variables: ['user_name'],
        isActive: true,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const validation = await engine.validateTemplate(template);
      
      expect(validation).toBeDefined();
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should list templates', async () => {
      const engine = TemplateEngineFactory.create({
        engine: 'handlebars',
        defaultLanguage: 'es',
        supportedLanguages: ['es', 'en'],
        cacheEnabled: true,
        cacheSize: 100,
        strictMode: true,
        escapeHtml: true
      });

      const templates = await engine.listTemplates();
      
      expect(templates).toBeDefined();
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
    });

    it('should clear cache', async () => {
      const engine = TemplateEngineFactory.create({
        engine: 'handlebars',
        defaultLanguage: 'es',
        supportedLanguages: ['es', 'en'],
        cacheEnabled: true,
        cacheSize: 100,
        strictMode: true,
        escapeHtml: true
      });

      await engine.clearCache();
      // Should not throw an error
    });
  });

  describe('Mustache Engine', () => {
    it('should create Mustache engine', () => {
      const engine = TemplateEngineFactory.create({
        engine: 'mustache',
        defaultLanguage: 'es',
        supportedLanguages: ['es', 'en'],
        cacheEnabled: true,
        cacheSize: 100,
        strictMode: true,
        escapeHtml: true
      });
      expect(engine).toBeDefined();
    });

    it('should render template with Mustache syntax', async () => {
      const engine = TemplateEngineFactory.create({
        engine: 'mustache',
        defaultLanguage: 'es',
        supportedLanguages: ['es', 'en'],
        cacheEnabled: true,
        cacheSize: 100,
        strictMode: true,
        escapeHtml: true
      });

      const result = await engine.render({
        templateId: 'welcome-email',
        variables: {
          user_name: 'John Doe',
          app_name: 'ECONEURA'
        }
      });

      expect(result).toBeDefined();
      expect(result.body).toContain('John Doe');
      expect(result.body).toContain('ECONEURA');
      expect(result.engine).toBe('mustache');
    });
  });
});
