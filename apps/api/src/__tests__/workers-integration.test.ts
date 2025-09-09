import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

// Mock the workers integration service
vi.mock('../lib/workers-integration.service.js', () => ({
  workersIntegrationService: {
    processEmail: vi.fn(),
    processBulkEmails: vi.fn(),
    manageCronJob: vi.fn(),
    getWorkersHealth: vi.fn(),
    getStats: vi.fn()
  }
}));

// Mock the webhook manager
vi.mock('@econeura/shared/services/webhook-manager.js', () => ({
  webhookManager: {
    emitEvent: vi.fn()
  }
}));

// Mock the service discovery
vi.mock('@econeura/shared/services/service-discovery.js', () => ({
  serviceDiscovery: {
    registerService: vi.fn(),
    registerEndpoints: vi.fn(),
    updateHeartbeat: vi.fn(),
    getStats: vi.fn()
  }
}));

// Mock the service client
vi.mock('@econeura/shared/clients/service-client.js', () => ({
  createServiceClient: vi.fn().mockReturnValue({
    request: vi.fn(),
    getStats: vi.fn()
  })
}));

describe('Workers Integration API', () => {
  let app: express.Application;

  beforeAll(async () => {
    // Import the workers integration router
    const workersIntegrationRouter = await import('../routes/workers-integration.js');
    app = express();
    app.use(express.json());
    app.use('/v1/workers', workersIntegrationRouter.default);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /v1/workers/emails/process', () => {
    it('should process email successfully', async () => {
      const { workersIntegrationService } = await import('../lib/workers-integration.service.js');

      const mockResponse = {
        success: true,
        messageId: 'email_123',
        result: {
          processed: true,
          action: 'categorize',
          confidence: 0.9,
          metadata: {
            category: 'finance',
            sentiment: 'neutral',
            urgency: 'high',
            language: 'es',
            entities: ['€1,500.00']
          },
          processingTime: 150
        },
        serviceId: 'workers-1',
        responseTime: 200
      };

      (workersIntegrationService.processEmail as any).mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/v1/workers/emails/process')
        .send({
          messageId: 'email_123',
          organizationId: 'org_456',
          priority: 'high'
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          messageId: 'email_123',
          result: mockResponse.result,
          serviceId: 'workers-1',
          responseTime: 200
        }
      });

      expect(workersIntegrationService.processEmail).toHaveBeenCalledWith({
        messageId: 'email_123',
        organizationId: 'org_456',
        priority: 'high'
      });
    });

    it('should handle email processing failure', async () => {
      const { workersIntegrationService } = await import('../lib/workers-integration.service.js');

      const mockResponse = {
        success: false,
        messageId: 'email_123',
        error: 'Processing failed',
        serviceId: 'workers-1',
        responseTime: 100
      };

      (workersIntegrationService.processEmail as any).mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/v1/workers/emails/process')
        .send({
          messageId: 'email_123',
          organizationId: 'org_456'
        })
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Processing failed',
        messageId: 'email_123'
      });
    });

    it('should validate request data', async () => {
      const response = await request(app)
        .post('/v1/workers/emails/process')
        .send({
          // Missing required fields
          priority: 'high'
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Invalid request data'
      });
      expect(response.body.details).toBeDefined();
    });
  });

  describe('POST /v1/workers/emails/process/bulk', () => {
    it('should process bulk emails successfully', async () => {
      const { workersIntegrationService } = await import('../lib/workers-integration.service.js');

      const mockResponse = [
        {
          success: true,
          messageId: 'email_1',
          result: { processed: true, action: 'categorize' },
          serviceId: 'workers-1',
          responseTime: 150
        },
        {
          success: true,
          messageId: 'email_2',
          result: { processed: true, action: 'forward' },
          serviceId: 'workers-1',
          responseTime: 200
        }
      ];

      (workersIntegrationService.processBulkEmails as any).mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/v1/workers/emails/process/bulk')
        .send({
          messageIds: ['email_1', 'email_2'],
          organizationId: 'org_456',
          priority: 'normal'
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          total: 2,
          successful: 2,
          failed: 0,
          results: expect.arrayContaining([
            expect.objectContaining({
              messageId: 'email_1',
              success: true
            }),
            expect.objectContaining({
              messageId: 'email_2',
              success: true
            })
          ])
        }
      });
    });

    it('should handle partial failures in bulk processing', async () => {
      const { workersIntegrationService } = await import('../lib/workers-integration.service.js');

      const mockResponse = [
        {
          success: true,
          messageId: 'email_1',
          result: { processed: true },
          serviceId: 'workers-1',
          responseTime: 150
        },
        {
          success: false,
          messageId: 'email_2',
          error: 'Processing failed',
          serviceId: 'workers-1',
          responseTime: 100
        }
      ];

      (workersIntegrationService.processBulkEmails as any).mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/v1/workers/emails/process/bulk')
        .send({
          messageIds: ['email_1', 'email_2'],
          organizationId: 'org_456'
        })
        .expect(200);

      expect(response.body.data).toMatchObject({
        total: 2,
        successful: 1,
        failed: 1
      });
    });

    it('should validate bulk request data', async () => {
      const response = await request(app)
        .post('/v1/workers/emails/process/bulk')
        .send({
          messageIds: [], // Empty array
          organizationId: 'org_456'
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Invalid request data'
      });
    });
  });

  describe('POST /v1/workers/cron/manage', () => {
    it('should enable cron job successfully', async () => {
      const { workersIntegrationService } = await import('../lib/workers-integration.service.js');

      const mockResponse = {
        success: true,
        jobId: 'email_processing',
        result: { message: 'Cron job enabled' },
        serviceId: 'workers-1',
        responseTime: 100
      };

      (workersIntegrationService.manageCronJob as any).mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/v1/workers/cron/manage')
        .send({
          jobId: 'email_processing',
          action: 'enable',
          organizationId: 'org_456'
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          jobId: 'email_processing',
          action: 'enable',
          result: { message: 'Cron job enabled' }
        }
      });
    });

    it('should disable cron job successfully', async () => {
      const { workersIntegrationService } = await import('../lib/workers-integration.service.js');

      const mockResponse = {
        success: true,
        jobId: 'email_processing',
        result: { message: 'Cron job disabled' },
        serviceId: 'workers-1',
        responseTime: 100
      };

      (workersIntegrationService.manageCronJob as any).mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/v1/workers/cron/manage')
        .send({
          jobId: 'email_processing',
          action: 'disable',
          organizationId: 'org_456'
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          jobId: 'email_processing',
          action: 'disable',
          result: { message: 'Cron job disabled' }
        }
      });
    });

    it('should get cron job status', async () => {
      const { workersIntegrationService } = await import('../lib/workers-integration.service.js');

      const mockResponse = {
        success: true,
        jobId: 'email_processing',
        result: {
          id: 'email_processing',
          name: 'Email Processing',
          enabled: true,
          runCount: 10
        },
        serviceId: 'workers-1',
        responseTime: 100
      };

      (workersIntegrationService.manageCronJob as any).mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/v1/workers/cron/manage')
        .send({
          jobId: 'email_processing',
          action: 'status',
          organizationId: 'org_456'
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          jobId: 'email_processing',
          action: 'status',
          result: expect.objectContaining({
            id: 'email_processing',
            enabled: true
          })
        }
      });
    });

    it('should validate cron job request data', async () => {
      const response = await request(app)
        .post('/v1/workers/cron/manage')
        .send({
          jobId: 'email_processing',
          action: 'invalid_action', // Invalid action
          organizationId: 'org_456'
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Invalid request data'
      });
    });
  });

  describe('GET /v1/workers/health', () => {
    it('should return workers health status', async () => {
      const { workersIntegrationService } = await import('../lib/workers-integration.service.js');

      const mockResponse = {
        healthy: true,
        services: [{
          status: 'healthy',
          service: 'workers',
          version: '1.0.0'
        }],
        stats: {
          serviceType: 'workers',
          availableServices: 1
        }
      };

      (workersIntegrationService.getWorkersHealth as any).mockResolvedValue(mockResponse);

      const response = await request(app)
        .get('/v1/workers/health')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          healthy: true,
          services: expect.arrayContaining([
            expect.objectContaining({
              status: 'healthy',
              service: 'workers'
            })
          ]),
          stats: expect.objectContaining({
            serviceType: 'workers'
          })
        }
      });
    });

    it('should handle workers health check failure', async () => {
      const { workersIntegrationService } = await import('../lib/workers-integration.service.js');

      const mockResponse = {
        healthy: false,
        services: [],
        stats: {}
      };

      (workersIntegrationService.getWorkersHealth as any).mockResolvedValue(mockResponse);

      const response = await request(app)
        .get('/v1/workers/health')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          healthy: false,
          services: [],
          stats: {}
        }
      });
    });
  });

  describe('GET /v1/workers/stats', () => {
    it('should return integration statistics', async () => {
      const { workersIntegrationService } = await import('../lib/workers-integration.service.js');

      const mockResponse = {
        initialized: true,
        workersClient: {
          serviceType: 'workers',
          availableServices: 1
        },
        webhookStats: {
          totalSubscriptions: 1,
          activeSubscriptions: 1
        },
        serviceDiscovery: {
          totalServices: 2,
          healthyServices: 2
        }
      };

      (workersIntegrationService.getStats as any).mockReturnValue(mockResponse);

      const response = await request(app)
        .get('/v1/workers/stats')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          initialized: true,
          workersClient: expect.objectContaining({
            serviceType: 'workers'
          }),
          webhookStats: expect.objectContaining({
            totalSubscriptions: 1
          }),
          serviceDiscovery: expect.objectContaining({
            totalServices: 2
          })
        }
      });
    });
  });

  describe('POST /v1/workers/webhooks/workers', () => {
    it('should handle webhook from workers', async () => {
      const webhookData = {
        type: 'email.processed',
        data: {
          messageId: 'email_123',
          result: { processed: true }
        }
      };

      const response = await request(app)
        .post('/v1/workers/webhooks/workers')
        .set('X-Webhook-Signature', 'sha256=test-signature')
        .set('X-Webhook-Event', 'email.processed')
        .set('X-Webhook-Delivery', 'del_123')
        .send(webhookData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Webhook received successfully',
        eventType: 'email.processed',
        deliveryId: 'del_123'
      });
    });

    it('should reject webhook without required headers', async () => {
      const response = await request(app)
        .post('/v1/workers/webhooks/workers')
        .send({ type: 'test' })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Missing required webhook headers'
      });
    });

    it('should handle webhook processing error', async () => {
      // Mock a service that throws an error
      const { workersIntegrationService } = await import('../lib/workers-integration.service.js');
      (workersIntegrationService.getStats as any).mockImplementation(() => {
        throw new Error('Service error');
      });

      const response = await request(app)
        .post('/v1/workers/webhooks/workers')
        .set('X-Webhook-Signature', 'sha256=test-signature')
        .set('X-Webhook-Event', 'email.processed')
        .set('X-Webhook-Delivery', 'del_123')
        .send({ type: 'test' })
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Service error'
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle service initialization errors', async () => {
      const { workersIntegrationService } = await import('../lib/workers-integration.service.js');

      (workersIntegrationService.processEmail as any).mockRejectedValue(
        new Error('Service not initialized')
      );

      const response = await request(app)
        .post('/v1/workers/emails/process')
        .send({
          messageId: 'email_123',
          organizationId: 'org_456'
        })
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Service not initialized'
      });
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/v1/workers/emails/process')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);
    });
  });

  describe('Response Format Consistency', () => {
    it('should return consistent response format for all endpoints', async () => {
      const { workersIntegrationService } = await import('../lib/workers-integration.service.js');

      // Mock successful responses
      (workersIntegrationService.processEmail as any).mockResolvedValue({
        success: true,
        messageId: 'email_123',
        result: { processed: true },
        serviceId: 'workers-1',
        responseTime: 100
      });

      (workersIntegrationService.getWorkersHealth as any).mockResolvedValue({
        healthy: true,
        services: [],
        stats: {}
      });

      (workersIntegrationService.getStats as any).mockReturnValue({
        initialized: true,
        workersClient: {},
        webhookStats: {},
        serviceDiscovery: {}
      });

      const endpoints = [
        { method: 'post', path: '/v1/workers/emails/process', data: { messageId: 'test', organizationId: 'org' } },
        { method: 'get', path: '/v1/workers/health' },
        { method: 'get', path: '/v1/workers/stats' }
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)[endpoint.method](endpoint.path)
          .send(endpoint.data || {});

        expect(response.body).toHaveProperty('success');
        expect(response.body).toHaveProperty('timestamp');
        expect(typeof response.body.success).toBe('boolean');
      }
    });
  });
});
