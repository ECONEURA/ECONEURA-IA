/**
 * EMAIL MARKETING SERVICE TESTS
 *
 * PR-56: Tests unitarios para el servicio de email marketing
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EmailMarketingService } from '../../../services/email-marketing.service.js';

// Mock del servicio de base de datos
const mockDb = {
  query: vi.fn(),
};

// Mock del structured logger
vi.mock('../../../lib/structured-logger.js', () => ({
  structuredLogger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock del servicio de base de datos
vi.mock('../../../lib/database.service.js', () => ({
  getDatabaseService: () => mockDb,
}));

describe('EmailMarketingService', () => {
  let service: EmailMarketingService;
  const mockOrganizationId = 'test-org';
  const mockUserId = 'test-user';

  beforeEach(() => {
    vi.clearAllMocks();
    service = new EmailMarketingService();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('createCampaign', () => {
    it('should create email campaign successfully', async () => {
      const campaignData = {
        name: 'Test Campaign',
        type: 'newsletter' as const,
        status: 'draft' as const,
        subject: 'Test Subject',
        previewText: 'Test preview text',
        htmlContent: '<h1>Test Content</h1>',
        textContent: 'Test Content',
        templateId: 'template-123',
        segments: ['segment-1', 'segment-2'],
        recipients: ['test@example.com', 'test2@example.com'],
        scheduledAt: undefined,
        sentAt: undefined,
        completedAt: undefined,
        fromName: 'Test Sender',
        fromEmail: 'sender@example.com',
        replyTo: 'reply@example.com',
        trackingEnabled: true,
        analytics: undefined,
        abTest: undefined,
        automation: undefined,
      };

      mockDb.query.mockResolvedValue({ rows: [] });

      const result = await service.createCampaign(
        mockOrganizationId,
        campaignData,
        mockUserId
      );

      expect(result).toBeDefined();
      expect(result.name).toBe(campaignData.name);
      expect(result.type).toBe(campaignData.type);
      expect(result.organizationId).toBe(mockOrganizationId);
      expect(result.createdBy).toBe(mockUserId);
      expect(mockDb.query).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      const campaignData = {
        name: 'Test Campaign',
        type: 'newsletter' as const,
        status: 'draft' as const,
        subject: 'Test Subject',
        previewText: 'Test preview text',
        htmlContent: '<h1>Test Content</h1>',
        textContent: 'Test Content',
        templateId: 'template-123',
        segments: ['segment-1'],
        recipients: ['test@example.com'],
        scheduledAt: undefined,
        sentAt: undefined,
        completedAt: undefined,
        fromName: 'Test Sender',
        fromEmail: 'sender@example.com',
        replyTo: 'reply@example.com',
        trackingEnabled: true,
        analytics: undefined,
        abTest: undefined,
        automation: undefined,
      };

      mockDb.query.mockRejectedValue(new Error('Database error'));

      await expect(
        service.createCampaign(mockOrganizationId, campaignData, mockUserId);
      ).rejects.toThrow('Database error');
    });
  });

  describe('getCampaign', () => {
    it('should return campaign if found', async () => {
      const campaignId = 'test-campaign-id';
      const mockCampaign = {
        id: campaignId,
        organizationId: mockOrganizationId,
        name: 'Test Campaign',
        type: 'newsletter',
        status: 'draft',
        subject: 'Test Subject',
        previewText: 'Test preview text',
        htmlContent: '<h1>Test Content</h1>',
        textContent: 'Test Content',
        templateId: 'template-123',
        segments: ['segment-1'],
        recipients: ['test@example.com'],
        scheduledAt: undefined,
        sentAt: undefined,
        completedAt: undefined,
        fromName: 'Test Sender',
        fromEmail: 'sender@example.com',
        replyTo: 'reply@example.com',
        trackingEnabled: true,
        analytics: undefined,
        abTest: undefined,
        automation: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: mockUserId,
        updatedBy: mockUserId,
      };

      // Simular que la campaña existe en memoria
      (service as any).campaigns.set(campaignId, mockCampaign);

      const result = await service.getCampaign(campaignId, mockOrganizationId);

      expect(result).toBeDefined();
      expect(result?.id).toBe(campaignId);
      expect(result?.name).toBe('Test Campaign');
    });

    it('should return null if campaign not found', async () => {
      const campaignId = 'non-existent-campaign';

      const result = await service.getCampaign(campaignId, mockOrganizationId);

      expect(result).toBeNull();
    });

    it('should return null if campaign belongs to different organization', async () => {
      const campaignId = 'test-campaign-id';
      const differentOrgId = 'different-org';
      const mockCampaign = {
        id: campaignId,
        organizationId: mockOrganizationId,
        name: 'Test Campaign',
        type: 'newsletter',
        status: 'draft',
        subject: 'Test Subject',
        previewText: 'Test preview text',
        htmlContent: '<h1>Test Content</h1>',
        textContent: 'Test Content',
        templateId: 'template-123',
        segments: ['segment-1'],
        recipients: ['test@example.com'],
        scheduledAt: undefined,
        sentAt: undefined,
        completedAt: undefined,
        fromName: 'Test Sender',
        fromEmail: 'sender@example.com',
        replyTo: 'reply@example.com',
        trackingEnabled: true,
        analytics: undefined,
        abTest: undefined,
        automation: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: mockUserId,
        updatedBy: mockUserId,
      };

      (service as any).campaigns.set(campaignId, mockCampaign);

      const result = await service.getCampaign(campaignId, differentOrgId);

      expect(result).toBeNull();
    });
  });

  describe('updateCampaign', () => {
    it('should update campaign successfully', async () => {
      const campaignId = 'test-campaign-id';
      const mockCampaign = {
        id: campaignId,
        organizationId: mockOrganizationId,
        name: 'Test Campaign',
        type: 'newsletter',
        status: 'draft',
        subject: 'Test Subject',
        previewText: 'Test preview text',
        htmlContent: '<h1>Test Content</h1>',
        textContent: 'Test Content',
        templateId: 'template-123',
        segments: ['segment-1'],
        recipients: ['test@example.com'],
        scheduledAt: undefined,
        sentAt: undefined,
        completedAt: undefined,
        fromName: 'Test Sender',
        fromEmail: 'sender@example.com',
        replyTo: 'reply@example.com',
        trackingEnabled: true,
        analytics: undefined,
        abTest: undefined,
        automation: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: mockUserId,
        updatedBy: mockUserId,
      };

      (service as any).campaigns.set(campaignId, mockCampaign);
      mockDb.query.mockResolvedValue({ rows: [] });

      const updates = {
        name: 'Updated Campaign',
        status: 'sent' as const,
      };

      const result = await service.updateCampaign(
        campaignId,
        mockOrganizationId,
        updates,
        mockUserId
      );

      expect(result).toBeDefined();
      expect(result?.name).toBe('Updated Campaign');
      expect(result?.status).toBe('sent');
      expect(result?.updatedBy).toBe(mockUserId);
      expect(mockDb.query).toHaveBeenCalled();
    });

    it('should return null if campaign not found', async () => {
      const campaignId = 'non-existent-campaign';
      const updates = { name: 'Updated Campaign' };

      const result = await service.updateCampaign(
        campaignId,
        mockOrganizationId,
        updates,
        mockUserId
      );

      expect(result).toBeNull();
    });
  });

  describe('deleteCampaign', () => {
    it('should delete campaign successfully', async () => {
      const campaignId = 'test-campaign-id';
      const mockCampaign = {
        id: campaignId,
        organizationId: mockOrganizationId,
        name: 'Test Campaign',
        type: 'newsletter',
        status: 'draft',
        subject: 'Test Subject',
        previewText: 'Test preview text',
        htmlContent: '<h1>Test Content</h1>',
        textContent: 'Test Content',
        templateId: 'template-123',
        segments: ['segment-1'],
        recipients: ['test@example.com'],
        scheduledAt: undefined,
        sentAt: undefined,
        completedAt: undefined,
        fromName: 'Test Sender',
        fromEmail: 'sender@example.com',
        replyTo: 'reply@example.com',
        trackingEnabled: true,
        analytics: undefined,
        abTest: undefined,
        automation: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: mockUserId,
        updatedBy: mockUserId,
      };

      (service as any).campaigns.set(campaignId, mockCampaign);
      mockDb.query.mockResolvedValue({ rows: [] });

      const result = await service.deleteCampaign(campaignId, mockOrganizationId);

      expect(result).toBe(true);
      expect(mockDb.query).toHaveBeenCalled();
    });

    it('should return false if campaign not found', async () => {
      const campaignId = 'non-existent-campaign';

      const result = await service.deleteCampaign(campaignId, mockOrganizationId);

      expect(result).toBe(false);
    });
  });

  describe('createSubscriber', () => {
    it('should create subscriber successfully', async () => {
      const subscriberData = {
        organizationId: mockOrganizationId,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        status: 'active' as const,
        tags: ['tag1', 'tag2'],
        customFields: { field1: 'value1' },
        segments: ['segment-1'],
        subscribedAt: new Date(),
        unsubscribedAt: undefined,
        lastActivityAt: undefined,
        source: 'website',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        location: {
          country: 'US',
          region: 'CA',
          city: 'San Francisco',
          timezone: 'America/Los_Angeles'
        },
        preferences: {
          frequency: 'weekly' as const,
          categories: ['news', 'promotions'],
          format: 'html' as const
        }
      };

      mockDb.query.mockResolvedValue({ rows: [] });

      const result = await service.createSubscriber(
        mockOrganizationId,
        subscriberData
      );

      expect(result).toBeDefined();
      expect(result.email).toBe(subscriberData.email);
      expect(result.firstName).toBe(subscriberData.firstName);
      expect(result.organizationId).toBe(mockOrganizationId);
      expect(mockDb.query).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      const subscriberData = {
        organizationId: mockOrganizationId,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        status: 'active' as const,
        tags: ['tag1'],
        customFields: {},
        segments: ['segment-1'],
        subscribedAt: new Date(),
        unsubscribedAt: undefined,
        lastActivityAt: undefined,
        source: 'website',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        location: undefined,
        preferences: {
          frequency: 'weekly' as const,
          categories: ['news'],
          format: 'html' as const
        }
      };

      mockDb.query.mockRejectedValue(new Error('Database error'));

      await expect(
        service.createSubscriber(mockOrganizationId, subscriberData);
      ).rejects.toThrow('Database error');
    });
  });

  describe('getSubscriber', () => {
    it('should return subscriber if found', async () => {
      const subscriberId = 'test-subscriber-id';
      const mockSubscriber = {
        id: subscriberId,
        organizationId: mockOrganizationId,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        status: 'active',
        tags: ['tag1'],
        customFields: {},
        segments: ['segment-1'],
        subscribedAt: new Date(),
        unsubscribedAt: undefined,
        lastActivityAt: undefined,
        source: 'website',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        location: undefined,
        preferences: {
          frequency: 'weekly',
          categories: ['news'],
          format: 'html'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (service as any).subscribers.set(subscriberId, mockSubscriber);

      const result = await service.getSubscriber(subscriberId, mockOrganizationId);

      expect(result).toBeDefined();
      expect(result?.id).toBe(subscriberId);
      expect(result?.email).toBe('test@example.com');
    });

    it('should return null if subscriber not found', async () => {
      const subscriberId = 'non-existent-subscriber';

      const result = await service.getSubscriber(subscriberId, mockOrganizationId);

      expect(result).toBeNull();
    });
  });

  describe('getSubscriberByEmail', () => {
    it('should return subscriber by email if found', async () => {
      const email = 'test@example.com';
      const mockSubscriber = {
        id: 'test-subscriber-id',
        organizationId: mockOrganizationId,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        status: 'active',
        tags: ['tag1'],
        customFields: {},
        segments: ['segment-1'],
        subscribedAt: new Date(),
        unsubscribedAt: undefined,
        lastActivityAt: undefined,
        source: 'website',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        location: undefined,
        preferences: {
          frequency: 'weekly',
          categories: ['news'],
          format: 'html'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (service as any).subscribers.set('test-subscriber-id', mockSubscriber);

      const result = await service.getSubscriberByEmail(email, mockOrganizationId);

      expect(result).toBeDefined();
      expect(result?.email).toBe(email);
    });

    it('should return null if subscriber not found by email', async () => {
      const email = 'nonexistent@example.com';

      const result = await service.getSubscriberByEmail(email, mockOrganizationId);

      expect(result).toBeNull();
    });
  });

  describe('searchCampaigns', () => {
    it('should search campaigns with filters', async () => {
      const mockCampaigns = [
        {
          id: 'campaign1',
          organizationId: mockOrganizationId,
          name: 'Campaign 1',
          type: 'newsletter',
          status: 'draft',
          subject: 'Subject 1',
          previewText: 'Preview 1',
          htmlContent: '<h1>Content 1</h1>',
          textContent: 'Content 1',
          templateId: 'template-1',
          segments: ['segment-1'],
          recipients: ['test1@example.com'],
          scheduledAt: undefined,
          sentAt: undefined,
          completedAt: undefined,
          fromName: 'Sender 1',
          fromEmail: 'sender1@example.com',
          replyTo: 'reply1@example.com',
          trackingEnabled: true,
          analytics: undefined,
          abTest: undefined,
          automation: undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: mockUserId,
          updatedBy: mockUserId,
        },
        {
          id: 'campaign2',
          organizationId: mockOrganizationId,
          name: 'Campaign 2',
          type: 'promotional',
          status: 'sent',
          subject: 'Subject 2',
          previewText: 'Preview 2',
          htmlContent: '<h1>Content 2</h1>',
          textContent: 'Content 2',
          templateId: 'template-2',
          segments: ['segment-2'],
          recipients: ['test2@example.com'],
          scheduledAt: undefined,
          sentAt: new Date(),
          completedAt: undefined,
          fromName: 'Sender 2',
          fromEmail: 'sender2@example.com',
          replyTo: 'reply2@example.com',
          trackingEnabled: true,
          analytics: {
            sent: 100,
            delivered: 95,
            opened: 50,
            clicked: 10,
            unsubscribed: 2,
            bounced: 5,
            complained: 1,
            openRate: 0.5,
            clickRate: 0.1,
            unsubscribeRate: 0.02,
            bounceRate: 0.05,
            complaintRate: 0.01
          },
          abTest: undefined,
          automation: undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: mockUserId,
          updatedBy: mockUserId,
        },
      ];

      (service as any).campaigns.set('campaign1', mockCampaigns[0]);
      (service as any).campaigns.set('campaign2', mockCampaigns[1]);

      const searchParams = {
        filters: {
          type: ['newsletter'],
          status: ['draft'],
        },
        pagination: {
          page: 1,
          limit: 10,
        },
      };

      const result = await service.searchCampaigns(mockOrganizationId, searchParams);

      expect(result).toBeDefined();
      expect(result.campaigns).toHaveLength(1);
      expect(result.campaigns[0].type).toBe('newsletter');
      expect(result.campaigns[0].status).toBe('draft');
      expect(result.total).toBe(1);
    });

    it('should search campaigns by text query', async () => {
      const mockCampaigns = [
        {
          id: 'campaign1',
          organizationId: mockOrganizationId,
          name: 'Test Campaign',
          type: 'newsletter',
          status: 'draft',
          subject: 'Test Subject',
          previewText: 'Test preview text',
          htmlContent: '<h1>Test Content</h1>',
          textContent: 'Test Content',
          templateId: 'template-1',
          segments: ['segment-1'],
          recipients: ['test@example.com'],
          scheduledAt: undefined,
          sentAt: undefined,
          completedAt: undefined,
          fromName: 'Test Sender',
          fromEmail: 'sender@example.com',
          replyTo: 'reply@example.com',
          trackingEnabled: true,
          analytics: undefined,
          abTest: undefined,
          automation: undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: mockUserId,
          updatedBy: mockUserId,
        },
      ];

      (service as any).campaigns.set('campaign1', mockCampaigns[0]);

      const searchParams = {
        query: 'test',
        pagination: {
          page: 1,
          limit: 10,
        },
      };

      const result = await service.searchCampaigns(mockOrganizationId, searchParams);

      expect(result).toBeDefined();
      expect(result.campaigns).toHaveLength(1);
      expect(result.campaigns[0].name).toBe('Test Campaign');
    });
  });

  describe('getEmailMarketingStatistics', () => {
    it('should return email marketing statistics', async () => {
      const mockCampaigns = [
        {
          id: 'campaign1',
          organizationId: mockOrganizationId,
          name: 'Campaign 1',
          type: 'newsletter',
          status: 'draft',
          subject: 'Subject 1',
          previewText: 'Preview 1',
          htmlContent: '<h1>Content 1</h1>',
          textContent: 'Content 1',
          templateId: 'template-1',
          segments: ['segment-1'],
          recipients: ['test1@example.com'],
          scheduledAt: undefined,
          sentAt: undefined,
          completedAt: undefined,
          fromName: 'Sender 1',
          fromEmail: 'sender1@example.com',
          replyTo: 'reply1@example.com',
          trackingEnabled: true,
          analytics: {
            sent: 100,
            delivered: 95,
            opened: 50,
            clicked: 10,
            unsubscribed: 2,
            bounced: 5,
            complained: 1,
            openRate: 0.5,
            clickRate: 0.1,
            unsubscribeRate: 0.02,
            bounceRate: 0.05,
            complaintRate: 0.01
          },
          abTest: undefined,
          automation: undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: mockUserId,
          updatedBy: mockUserId,
        },
        {
          id: 'campaign2',
          organizationId: mockOrganizationId,
          name: 'Campaign 2',
          type: 'promotional',
          status: 'sent',
          subject: 'Subject 2',
          previewText: 'Preview 2',
          htmlContent: '<h1>Content 2</h1>',
          textContent: 'Content 2',
          templateId: 'template-2',
          segments: ['segment-2'],
          recipients: ['test2@example.com'],
          scheduledAt: undefined,
          sentAt: new Date(),
          completedAt: undefined,
          fromName: 'Sender 2',
          fromEmail: 'sender2@example.com',
          replyTo: 'reply2@example.com',
          trackingEnabled: true,
          analytics: {
            sent: 200,
            delivered: 190,
            opened: 100,
            clicked: 20,
            unsubscribed: 4,
            bounced: 10,
            complained: 2,
            openRate: 0.6,
            clickRate: 0.15,
            unsubscribeRate: 0.02,
            bounceRate: 0.05,
            complaintRate: 0.01
          },
          abTest: undefined,
          automation: undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: mockUserId,
          updatedBy: mockUserId,
        },
      ];

      const mockSubscribers = [
        {
          id: 'subscriber1',
          organizationId: mockOrganizationId,
          email: 'test1@example.com',
          firstName: 'John',
          lastName: 'Doe',
          status: 'active',
          tags: ['tag1'],
          customFields: {},
          segments: ['segment-1'],
          subscribedAt: new Date(),
          unsubscribedAt: undefined,
          lastActivityAt: undefined,
          source: 'website',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          location: undefined,
          preferences: {
            frequency: 'weekly',
            categories: ['news'],
            format: 'html'
          },
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'subscriber2',
          organizationId: mockOrganizationId,
          email: 'test2@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          status: 'unsubscribed',
          tags: ['tag2'],
          customFields: {},
          segments: ['segment-2'],
          subscribedAt: new Date(),
          unsubscribedAt: new Date(),
          lastActivityAt: undefined,
          source: 'website',
          ipAddress: '192.168.1.2',
          userAgent: 'Mozilla/5.0',
          location: undefined,
          preferences: {
            frequency: 'monthly',
            categories: ['promotions'],
            format: 'text'
          },
          createdAt: new Date(),
          updatedAt: new Date()
        },
      ];

      (service as any).campaigns.set('campaign1', mockCampaigns[0]);
      (service as any).campaigns.set('campaign2', mockCampaigns[1]);
      (service as any).subscribers.set('subscriber1', mockSubscribers[0]);
      (service as any).subscribers.set('subscriber2', mockSubscribers[1]);

      const result = await service.getEmailMarketingStatistics(mockOrganizationId);

      expect(result).toBeDefined();
      expect(result.totalCampaigns).toBe(2);
      expect(result.campaignsByType.newsletter).toBe(1);
      expect(result.campaignsByType.promotional).toBe(1);
      expect(result.campaignsByStatus.draft).toBe(1);
      expect(result.campaignsByStatus.sent).toBe(1);
      expect(result.totalSubscribers).toBe(2);
      expect(result.subscribersByStatus.active).toBe(1);
      expect(result.subscribersByStatus.unsubscribed).toBe(1);
      expect(result.averageOpenRate).toBe(0.55); // (0.5 + 0.6) / 2
      expect(result.averageClickRate).toBe(0.125); // (0.1 + 0.15) / 2
      expect(result.topCampaigns).toHaveLength(2);
    });
  });
});
