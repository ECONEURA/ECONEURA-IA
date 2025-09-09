import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { EmailProcessor, EmailMessage } from '../processors/email-processor.js';

// Mock dependencies
vi.mock('../services/graph-service.js', () => ({
  GraphService: vi.fn().mockImplementation(() => ({
    getEmail: vi.fn()
  }))
}));

vi.mock('../queues/job-queue.js', () => ({
  JobQueue: vi.fn().mockImplementation(() => ({}))
}));

vi.mock('../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}));

vi.mock('../utils/metrics.js', () => ({
  prometheusMetrics: {
    counter: vi.fn().mockReturnValue({
      inc: vi.fn()
    }),
    histogram: vi.fn().mockReturnValue({
      observe: vi.fn()
    })
  }
}));

describe('EmailProcessor', () => {
  let emailProcessor: EmailProcessor;
  let mockEmail: EmailMessage;

  beforeEach(() => {
    emailProcessor = new EmailProcessor();

    mockEmail = {
      id: 'email_123',
      subject: 'Invoice Payment Required',
      from: {
        emailAddress: {
          address: 'billing@company.com',
          name: 'Billing Department'
        }
      },
      toRecipients: [{
        emailAddress: {
          address: 'user@example.com',
          name: 'User'
        }
      }],
      body: {
        content: 'Please pay your invoice of €1,500.00 by the due date.',
        contentType: 'text'
      },
      receivedDateTime: '2024-01-15T10:00:00Z',
      isRead: false,
      importance: 'high',
      hasAttachments: true,
      internetMessageId: 'msg_123',
      conversationId: 'conv_123'
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('processEmail', () => {
    it('should process email successfully and categorize as finance', async () => {
      // Mock GraphService.getEmail
      const { GraphService } = await import('../services/graph-service.js');
      const mockGraphService = new GraphService();
      (mockGraphService.getEmail as any).mockResolvedValue(mockEmail);

      const result = await emailProcessor.processEmail('email_123', 'org_456');

      expect(result).toMatchObject({
        messageId: 'email_123',
        processed: true,
        action: 'categorize',
        confidence: 0.9,
        metadata: {
          category: 'finance',
          sentiment: 'neutral',
          urgency: 'high',
          language: 'es'
        }
      });
      expect(result.processingTime).toBeGreaterThan(0);
    });

    it('should categorize meeting emails as calendar', async () => {
      const meetingEmail = {
        ...mockEmail,
        subject: 'Meeting scheduled for tomorrow',
        body: {
          content: 'We have a meeting scheduled for tomorrow at 2 PM.',
          contentType: 'text'
        }
      };

      const { GraphService } = await import('../services/graph-service.js');
      const mockGraphService = new GraphService();
      (mockGraphService.getEmail as any).mockResolvedValue(meetingEmail);

      const result = await emailProcessor.processEmail('email_123', 'org_456');

      expect(result.metadata.category).toBe('calendar');
      expect(result.action).toBe('categorize');
      expect(result.confidence).toBe(0.8);
    });

    it('should categorize support emails and forward them', async () => {
      const supportEmail = {
        ...mockEmail,
        subject: 'Support request - urgent issue',
        body: {
          content: 'I need help with my account. Please assist me.',
          contentType: 'text'
        }
      };

      const { GraphService } = await import('../services/graph-service.js');
      const mockGraphService = new GraphService();
      (mockGraphService.getEmail as any).mockResolvedValue(supportEmail);

      const result = await emailProcessor.processEmail('email_123', 'org_456');

      expect(result.metadata.category).toBe('support');
      expect(result.action).toBe('forward');
      expect(result.confidence).toBe(0.85);
    });

    it('should detect positive sentiment', async () => {
      const positiveEmail = {
        ...mockEmail,
        subject: 'Thank you for your service',
        body: {
          content: 'Thank you so much! Great work, excellent service!',
          contentType: 'text'
        }
      };

      const { GraphService } = await import('../services/graph-service.js');
      const mockGraphService = new GraphService();
      (mockGraphService.getEmail as any).mockResolvedValue(positiveEmail);

      const result = await emailProcessor.processEmail('email_123', 'org_456');

      expect(result.metadata.sentiment).toBe('positive');
    });

    it('should detect negative sentiment', async () => {
      const negativeEmail = {
        ...mockEmail,
        subject: 'Problem with service',
        body: {
          content: 'I am disappointed with the service. There is a problem.',
          contentType: 'text'
        }
      };

      const { GraphService } = await import('../services/graph-service.js');
      const mockGraphService = new GraphService();
      (mockGraphService.getEmail as any).mockResolvedValue(negativeEmail);

      const result = await emailProcessor.processEmail('email_123', 'org_456');

      expect(result.metadata.sentiment).toBe('negative');
    });

    it('should extract entities from email content', async () => {
      const emailWithEntities = {
        ...mockEmail,
        body: {
          content: 'Contact us at support@company.com or call +34612345678. Amount: €2,500.00',
          contentType: 'text'
        }
      };

      const { GraphService } = await import('../services/graph-service.js');
      const mockGraphService = new GraphService();
      (mockGraphService.getEmail as any).mockResolvedValue(emailWithEntities);

      const result = await emailProcessor.processEmail('email_123', 'org_456');

      expect(result.metadata.entities).toContain('support@company.com');
      expect(result.metadata.entities).toContain('+34612345678');
      expect(result.metadata.entities).toContain('€2,500.00');
    });

    it('should handle email not found error', async () => {
      const { GraphService } = await import('../services/graph-service.js');
      const mockGraphService = new GraphService();
      (mockGraphService.getEmail as any).mockResolvedValue(null);

      await expect(
        emailProcessor.processEmail('nonexistent_email', 'org_456');
      ).rejects.toThrow('Email nonexistent_email not found');
    });

    it('should handle processing errors gracefully', async () => {
      const { GraphService } = await import('../services/graph-service.js');
      const mockGraphService = new GraphService();
      (mockGraphService.getEmail as any).mockRejectedValue(new Error('Graph API error'));

      await expect(
        emailProcessor.processEmail('email_123', 'org_456');
      ).rejects.toThrow('Graph API error');
    });
  });

  describe('processBulkEmails', () => {
    it('should process multiple emails successfully', async () => {
      const messageIds = ['email_1', 'email_2', 'email_3'];

      const { GraphService } = await import('../services/graph-service.js');
      const mockGraphService = new GraphService();
      (mockGraphService.getEmail as any).mockResolvedValue(mockEmail);

      const results = await emailProcessor.processBulkEmails(messageIds, 'org_456');

      expect(results).toHaveLength(3);
      expect(results.every(r => r.processed)).toBe(true);
      expect(results.every(r => r.messageId)).toBe(true);
    });

    it('should handle partial failures in bulk processing', async () => {
      const messageIds = ['email_1', 'email_2', 'email_3'];

      const { GraphService } = await import('../services/graph-service.js');
      const mockGraphService = new GraphService();
      (mockGraphService.getEmail as any)
        .mockResolvedValueOnce(mockEmail)
        .mockRejectedValueOnce(new Error('Processing error'))
        .mockResolvedValueOnce(mockEmail);

      const results = await emailProcessor.processBulkEmails(messageIds, 'org_456');

      expect(results).toHaveLength(3);
      expect(results[0].processed).toBe(true);
      expect(results[1].processed).toBe(false);
      expect(results[2].processed).toBe(true);
    });

    it('should respect concurrency limit', async () => {
      const messageIds = Array.from({ length: 10 }, (_, i) => `email_${i}`);

      const { GraphService } = await import('../services/graph-service.js');
      const mockGraphService = new GraphService();
      (mockGraphService.getEmail as any).mockResolvedValue(mockEmail);

      const startTime = Date.now();
      const results = await emailProcessor.processBulkEmails(messageIds, 'org_456');
      const endTime = Date.now();

      expect(results).toHaveLength(10);
      // Should take some time due to concurrency limit of 5
      expect(endTime - startTime).toBeGreaterThan(100);
    });
  });

  describe('email categorization logic', () => {
    it('should categorize spam emails correctly', async () => {
      const spamEmail = {
        ...mockEmail,
        subject: 'Unsubscribe from our newsletter',
        body: {
          content: 'Click here to unsubscribe from our marketing emails.',
          contentType: 'text'
        }
      };

      const { GraphService } = await import('../services/graph-service.js');
      const mockGraphService = new GraphService();
      (mockGraphService.getEmail as any).mockResolvedValue(spamEmail);

      const result = await emailProcessor.processEmail('email_123', 'org_456');

      expect(result.metadata.category).toBe('spam');
      expect(result.action).toBe('archive');
      expect(result.confidence).toBe(0.95);
    });

    it('should handle urgent emails', async () => {
      const urgentEmail = {
        ...mockEmail,
        subject: 'URGENT: Action required',
        importance: 'high' as const
      };

      const { GraphService } = await import('../services/graph-service.js');
      const mockGraphService = new GraphService();
      (mockGraphService.getEmail as any).mockResolvedValue(urgentEmail);

      const result = await emailProcessor.processEmail('email_123', 'org_456');

      expect(result.metadata.category).toBe('urgent');
      expect(result.metadata.urgency).toBe('high');
      expect(result.action).toBe('categorize');
    });

    it('should default to general category for unknown emails', async () => {
      const generalEmail = {
        ...mockEmail,
        subject: 'Random email',
        body: {
          content: 'This is just a random email with no specific category.',
          contentType: 'text'
        }
      };

      const { GraphService } = await import('../services/graph-service.js');
      const mockGraphService = new GraphService();
      (mockGraphService.getEmail as any).mockResolvedValue(generalEmail);

      const result = await emailProcessor.processEmail('email_123', 'org_456');

      expect(result.metadata.category).toBe('general');
      expect(result.action).toBe('none');
      expect(result.confidence).toBe(0.5);
    });
  });
});
