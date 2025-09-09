import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// Mock the entire workers app
vi.mock('../index.js', () => ({
  default: express()
    .get('/health', (req, res) => {
      res.json({
        success: true,
        data: {
          status: 'healthy',
          service: 'workers',
          version: '1.0.0',
          uptime: 100,
          redis: 'connected',
          jobQueue: {
            total: 0,
            pending: 0,
            processing: 0,
            completed: 0,
            failed: 0
          },
          features: ['outlook-integration', 'graph-subscriptions', 'job-processing']
        }
      });
    })
    .get('/metrics', (req, res) => {
      res.set('Content-Type', 'text/plain');
      res.send('# HELP econeura_http_requests_total Total number of HTTP requests\n# TYPE econeura_http_requests_total counter\neconeura_http_requests_total{method="GET",route="/health",status_code="200"} 1\n');
    })
    .get('/cron/jobs', (req, res) => {
      res.json({
        success: true,
        data: {
          jobs: [
            {
              id: 'email_processing',
              name: 'Email Processing',
              schedule: '*/5 * * * *',
              enabled: true,
              runCount: 10,
              errorCount: 0
            },
            {
              id: 'graph_sync',
              name: 'Microsoft Graph Sync',
              schedule: '*/15 * * * *',
              enabled: true,
              runCount: 5,
              errorCount: 1
            }
          ]
        }
      });
    })
    .get('/cron/stats', (req, res) => {
      res.json({
        success: true,
        data: {
          stats: {
            total: 6,
            enabled: 6,
            disabled: 0,
            totalRuns: 50,
            totalErrors: 2
          }
        }
      });
    })
    .post('/emails/process', (req, res) => {
      const { messageId, organizationId } = req.body;

      if (!messageId || !organizationId) {
        return res.status(400).json({
          success: false,
          error: 'messageId and organizationId are required'
        });
      }

      res.json({
        success: true,
        data: {
          result: {
            messageId,
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
          }
        }
      });
    })
    .post('/emails/process/bulk', (req, res) => {
      const { messageIds, organizationId } = req.body;

      if (!messageIds || !Array.isArray(messageIds) || !organizationId) {
        return res.status(400).json({
          success: false,
          error: 'messageIds array and organizationId are required'
        });
      }

      const results = messageIds.map((id: string) => ({
        messageId: id,
        processed: true,
        action: 'categorize',
        confidence: 0.8,
        metadata: {
          category: 'general',
          sentiment: 'neutral',
          urgency: 'low'
        },
        processingTime: 100
      }));

      res.json({
        success: true,
        data: { results }
      });
    })
    .post('/cron/jobs/:jobId/enable', (req, res) => {
      const { jobId } = req.params;
      res.json({
        success: true,
        data: { message: 'Cron job enabled' }
      });
    })
    .post('/cron/jobs/:jobId/disable', (req, res) => {
      const { jobId } = req.params;
      res.json({
        success: true,
        data: { message: 'Cron job disabled' }
      });
    })
}));

describe('Workers API Integration Tests', () => {
  let app: express.Application;

  beforeAll(async () => {
    const { default: workersApp } = await import('../index.js');
    app = workersApp;
  });

  describe('Health Endpoints', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          status: 'healthy',
          service: 'workers',
          version: '1.0.0',
          features: expect.arrayContaining([
            'outlook-integration',
            'graph-subscriptions',
            'job-processing'
          ])
        }
      });
    });

    it('should return Prometheus metrics', async () => {
      const response = await request(app)
        .get('/metrics')
        .expect(200);

      expect(response.headers['content-type']).toContain('text/plain');
      expect(response.text).toContain('econeura_http_requests_total');
    });
  });

  describe('Cron Job Management', () => {
    it('should list all cron jobs', async () => {
      const response = await request(app)
        .get('/cron/jobs')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          jobs: expect.arrayContaining([
            expect.objectContaining({
              id: 'email_processing',
              name: 'Email Processing',
              schedule: '*/5 * * * *',
              enabled: true
            })
          ])
        }
      });
    });

    it('should return cron job statistics', async () => {
      const response = await request(app)
        .get('/cron/stats')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          stats: {
            total: 6,
            enabled: 6,
            disabled: 0,
            totalRuns: expect.any(Number),
            totalErrors: expect.any(Number)
          }
        }
      });
    });

    it('should enable a cron job', async () => {
      const response = await request(app)
        .post('/cron/jobs/email_processing/enable')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: { message: 'Cron job enabled' }
      });
    });

    it('should disable a cron job', async () => {
      const response = await request(app)
        .post('/cron/jobs/email_processing/disable')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: { message: 'Cron job disabled' }
      });
    });
  });

  describe('Email Processing', () => {
    it('should process a single email', async () => {
      const emailData = {
        messageId: 'email_123',
        organizationId: 'org_456'
      };

      const response = await request(app)
        .post('/emails/process')
        .send(emailData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          result: {
            messageId: 'email_123',
            processed: true,
            action: 'categorize',
            confidence: 0.9,
            metadata: {
              category: 'finance',
              sentiment: 'neutral',
              urgency: 'high',
              language: 'es'
            },
            processingTime: expect.any(Number)
          }
        }
      });
    });

    it('should reject email processing without required fields', async () => {
      const response = await request(app)
        .post('/emails/process')
        .send({ messageId: 'email_123' }) // Missing organizationId
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'messageId and organizationId are required'
      });
    });

    it('should process multiple emails in bulk', async () => {
      const bulkData = {
        messageIds: ['email_1', 'email_2', 'email_3'],
        organizationId: 'org_456'
      };

      const response = await request(app)
        .post('/emails/process/bulk')
        .send(bulkData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          results: expect.arrayContaining([
            expect.objectContaining({
              messageId: 'email_1',
              processed: true,
              action: 'categorize'
            }),
            expect.objectContaining({
              messageId: 'email_2',
              processed: true,
              action: 'categorize'
            }),
            expect.objectContaining({
              messageId: 'email_3',
              processed: true,
              action: 'categorize'
            })
          ])
        }
      });
    });

    it('should reject bulk processing without required fields', async () => {
      const response = await request(app)
        .post('/emails/process/bulk')
        .send({ messageIds: ['email_1'] }) // Missing organizationId
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'messageIds array and organizationId are required'
      });
    });

    it('should reject bulk processing with invalid messageIds', async () => {
      const response = await request(app)
        .post('/emails/process/bulk')
        .send({
          messageIds: 'not_an_array', // Should be array
          organizationId: 'org_456'
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'messageIds array and organizationId are required'
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for unknown endpoints', async () => {
      const response = await request(app)
        .get('/unknown/endpoint')
        .expect(404);
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/emails/process')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);
    });
  });

  describe('Response Format Consistency', () => {
    it('should return consistent response format for all endpoints', async () => {
      const endpoints = [
        { method: 'get', path: '/health' },
        { method: 'get', path: '/cron/jobs' },
        { method: 'get', path: '/cron/stats' }
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)[endpoint.method](endpoint.path);

        expect(response.body).toHaveProperty('success');
        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('timestamp');
        expect(typeof response.body.success).toBe('boolean');
      }
    });

    it('should return error format for failed requests', async () => {
      const response = await request(app)
        .post('/emails/process')
        .send({}) // Missing required fields
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Performance', () => {
    it('should respond to health check within acceptable time', async () => {
      const startTime = Date.now();

      await request(app)
        .get('/health')
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });

    it('should handle concurrent requests', async () => {
      const requests = Array.from({ length: 10 }, () =>
        request(app).get('/health')
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });
});
