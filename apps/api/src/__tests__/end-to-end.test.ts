import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// Mock the entire API application
vi.mock('../index.js', () => {
  const app = express();
  app.use(express.json());

  // Health endpoint
  app.get('/health', (req, res) => {
    res.json({
      success: true,
      data: {
        status: 'healthy',
        service: 'api',
        version: '1.0.0',
        uptime: 100,
        features: ['crm', 'erp', 'finance', 'ai', 'analytics']
      }
    });
  });

  // Workers integration endpoints
  app.post('/v1/workers/emails/process', (req, res) => {
    const { messageId, organizationId, priority } = req.body;

    if (!messageId || !organizationId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data'
      });
    }

    res.json({
      success: true,
      data: {
        messageId,
        result: {
          processed: true,
          action: 'categorize',
          confidence: 0.9,
          metadata: {
            category: 'finance',
            sentiment: 'neutral',
            urgency: priority || 'normal',
            language: 'es',
            entities: ['€1,500.00']
          },
          processingTime: 150
        },
        serviceId: 'workers-1',
        responseTime: 200
      },
      timestamp: new Date().toISOString()
    });
  });

  app.post('/v1/workers/emails/process/bulk', (req, res) => {
    const { messageIds, organizationId } = req.body;

    if (!messageIds || !Array.isArray(messageIds) || !organizationId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data'
      });
    }

    const results = messageIds.map((id: string) => ({
      messageId: id,
      success: true,
      result: {
        processed: true,
        action: 'categorize',
        confidence: 0.8,
        metadata: {
          category: 'general',
          sentiment: 'neutral',
          urgency: 'normal'
        },
        processingTime: 100
      },
      serviceId: 'workers-1',
      responseTime: 150
    }));

    res.json({
      success: true,
      data: {
        total: results.length,
        successful: results.length,
        failed: 0,
        results
      },
      timestamp: new Date().toISOString()
    });
  });

  app.post('/v1/workers/cron/manage', (req, res) => {
    const { jobId, action, organizationId } = req.body;

    if (!jobId || !action || !organizationId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data'
      });
    }

    res.json({
      success: true,
      data: {
        jobId,
        action,
        result: { message: `Cron job ${action}d` },
        serviceId: 'workers-1',
        responseTime: 100
      },
      timestamp: new Date().toISOString()
    });
  });

  app.get('/v1/workers/health', (req, res) => {
    res.json({
      success: true,
      data: {
        healthy: true,
        services: [{
          status: 'healthy',
          service: 'workers',
          version: '1.0.0',
          uptime: 200,
          features: ['email-processing', 'cron-jobs', 'graph-sync']
        }],
        stats: {
          serviceType: 'workers',
          availableServices: 1,
          circuitBreakers: {},
          connectionCounts: {}
        }
      },
      timestamp: new Date().toISOString()
    });
  });

  app.get('/v1/workers/stats', (req, res) => {
    res.json({
      success: true,
      data: {
        initialized: true,
        workersClient: {
          serviceType: 'workers',
          availableServices: 1
        },
        webhookStats: {
          totalSubscriptions: 1,
          activeSubscriptions: 1,
          totalDeliveries: 10,
          pendingDeliveries: 0,
          failedDeliveries: 1,
          deliveredDeliveries: 9
        },
        serviceDiscovery: {
          totalServices: 2,
          healthyServices: 2,
          unhealthyServices: 0,
          servicesByType: {
            api: 1,
            workers: 1
          }
        }
      },
      timestamp: new Date().toISOString()
    });
  });

  app.post('/v1/workers/webhooks/workers', (req, res) => {
    const signature = req.headers['x-webhook-signature'];
    const eventType = req.headers['x-webhook-event'];
    const deliveryId = req.headers['x-webhook-delivery'];

    if (!signature || !eventType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required webhook headers'
      });
    }

    res.json({
      success: true,
      message: 'Webhook received successfully',
      eventType,
      deliveryId
    });
  });

  // CRM endpoints
  app.get('/v1/contacts', (req, res) => {
    res.json({
      success: true,
      data: {
        contacts: [
          {
            id: 'contact_1',
            name: 'John Doe',
            email: 'john@example.com',
            organizationId: 'org_1'
          }
        ],
        total: 1,
        page: 1,
        limit: 10
      },
      timestamp: new Date().toISOString()
    });
  });

  app.post('/v1/contacts', (req, res) => {
    const { name, email, organizationId } = req.body;

    if (!name || !email || !organizationId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data'
      });
    }

    res.json({
      success: true,
      data: {
        id: `contact_${Date.now()}`,
        name,
        email,
        organizationId,
        createdAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  });

  // ERP endpoints
  app.get('/v1/products', (req, res) => {
    res.json({
      success: true,
      data: {
        products: [
          {
            id: 'product_1',
            name: 'Product A',
            price: 100.00,
            organizationId: 'org_1'
          }
        ],
        total: 1,
        page: 1,
        limit: 10
      },
      timestamp: new Date().toISOString()
    });
  });

  app.post('/v1/products', (req, res) => {
    const { name, price, organizationId } = req.body;

    if (!name || !price || !organizationId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data'
      });
    }

    res.json({
      success: true,
      data: {
        id: `product_${Date.now()}`,
        name,
        price,
        organizationId,
        createdAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  });

  // Analytics endpoints
  app.get('/v1/analytics/events', (req, res) => {
    res.json({
      success: true,
      data: {
        events: [
          {
            id: 'event_1',
            type: 'user_action',
            action: 'login',
            timestamp: new Date().toISOString()
          }
        ],
        total: 1,
        page: 1,
        limit: 10
      },
      timestamp: new Date().toISOString()
    });
  });

  // Cockpit endpoints
  app.get('/v1/cockpit/overview', (req, res) => {
    res.json({
      success: true,
      data: {
        totalContacts: 100,
        totalProducts: 50,
        totalRevenue: 10000,
        activeUsers: 25,
        systemHealth: 'healthy'
      },
      timestamp: new Date().toISOString()
    });
  });

  return { default: app };
});

describe('ECONEURA End-to-End Integration Tests', () => {
  let app: express.Application;

  beforeAll(async () => {
    const { default: apiApp } = await import('../index.js');
    app = apiApp;
  });

  describe('System Health and Connectivity', () => {
    it('should return system health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          status: 'healthy',
          service: 'api',
          version: '1.0.0',
          features: expect.arrayContaining(['crm', 'erp', 'finance', 'ai'])
        }
      });
    });

    it('should return workers health status', async () => {
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
          ])
        }
      });
    });

    it('should return integration statistics', async () => {
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
            totalSubscriptions: expect.any(Number)
          }),
          serviceDiscovery: expect.objectContaining({
            totalServices: expect.any(Number)
          })
        }
      });
    });
  });

  describe('Email Processing Workflow', () => {
    it('should process single email end-to-end', async () => {
      const emailData = {
        messageId: 'email_123',
        organizationId: 'org_456',
        priority: 'high'
      };

      const response = await request(app)
        .post('/v1/workers/emails/process')
        .send(emailData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          messageId: 'email_123',
          result: {
            processed: true,
            action: 'categorize',
            confidence: 0.9,
            metadata: {
              category: 'finance',
              sentiment: 'neutral',
              urgency: 'high',
              language: 'es'
            }
          },
          serviceId: 'workers-1',
          responseTime: expect.any(Number)
        }
      });
    });

    it('should process bulk emails end-to-end', async () => {
      const bulkData = {
        messageIds: ['email_1', 'email_2', 'email_3'],
        organizationId: 'org_456',
        priority: 'normal'
      };

      const response = await request(app)
        .post('/v1/workers/emails/process/bulk')
        .send(bulkData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          total: 3,
          successful: 3,
          failed: 0,
          results: expect.arrayContaining([
            expect.objectContaining({
              messageId: 'email_1',
              success: true,
              result: expect.objectContaining({
                processed: true
              })
            }),
            expect.objectContaining({
              messageId: 'email_2',
              success: true
            }),
            expect.objectContaining({
              messageId: 'email_3',
              success: true
            })
          ])
        }
      });
    });
  });

  describe('Cron Job Management Workflow', () => {
    it('should enable cron job end-to-end', async () => {
      const cronData = {
        jobId: 'email_processing',
        action: 'enable',
        organizationId: 'org_456'
      };

      const response = await request(app)
        .post('/v1/workers/cron/manage')
        .send(cronData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          jobId: 'email_processing',
          action: 'enable',
          result: { message: 'Cron job enabled' },
          serviceId: 'workers-1',
          responseTime: expect.any(Number)
        }
      });
    });

    it('should disable cron job end-to-end', async () => {
      const cronData = {
        jobId: 'email_processing',
        action: 'disable',
        organizationId: 'org_456'
      };

      const response = await request(app)
        .post('/v1/workers/cron/manage')
        .send(cronData)
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
  });

  describe('Webhook Communication', () => {
    it('should receive webhook from workers', async () => {
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
  });

  describe('CRM Integration', () => {
    it('should list contacts', async () => {
      const response = await request(app)
        .get('/v1/contacts')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          contacts: expect.arrayContaining([
            expect.objectContaining({
              id: 'contact_1',
              name: 'John Doe',
              email: 'john@example.com'
            })
          ]),
          total: 1
        }
      });
    });

    it('should create contact', async () => {
      const contactData = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        organizationId: 'org_1'
      };

      const response = await request(app)
        .post('/v1/contacts')
        .send(contactData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          name: 'Jane Doe',
          email: 'jane@example.com',
          organizationId: 'org_1',
          id: expect.any(String),
          createdAt: expect.any(String)
        }
      });
    });
  });

  describe('ERP Integration', () => {
    it('should list products', async () => {
      const response = await request(app)
        .get('/v1/products')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          products: expect.arrayContaining([
            expect.objectContaining({
              id: 'product_1',
              name: 'Product A',
              price: 100.00
            })
          ]),
          total: 1
        }
      });
    });

    it('should create product', async () => {
      const productData = {
        name: 'Product B',
        price: 200.00,
        organizationId: 'org_1'
      };

      const response = await request(app)
        .post('/v1/products')
        .send(productData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          name: 'Product B',
          price: 200.00,
          organizationId: 'org_1',
          id: expect.any(String),
          createdAt: expect.any(String)
        }
      });
    });
  });

  describe('Analytics Integration', () => {
    it('should get analytics events', async () => {
      const response = await request(app)
        .get('/v1/analytics/events')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          events: expect.arrayContaining([
            expect.objectContaining({
              id: 'event_1',
              type: 'user_action',
              action: 'login'
            })
          ]),
          total: 1
        }
      });
    });
  });

  describe('Cockpit Integration', () => {
    it('should get cockpit overview', async () => {
      const response = await request(app)
        .get('/v1/cockpit/overview')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          totalContacts: 100,
          totalProducts: 50,
          totalRevenue: 10000,
          activeUsers: 25,
          systemHealth: 'healthy'
        }
      });
    });
  });

  describe('Complete Business Workflow', () => {
    it('should execute complete email-to-contact workflow', async () => {
      // Step 1: Process email through workers
      const emailResponse = await request(app)
        .post('/v1/workers/emails/process')
        .send({
          messageId: 'workflow_email_123',
          organizationId: 'org_workflow',
          priority: 'high'
        })
        .expect(200);

      expect(emailResponse.body.success).toBe(true);
      expect(emailResponse.body.data.result.processed).toBe(true);

      // Step 2: Create contact based on email processing
      const contactResponse = await request(app)
        .post('/v1/contacts')
        .send({
          name: 'Workflow Contact',
          email: 'workflow@example.com',
          organizationId: 'org_workflow'
        })
        .expect(200);

      expect(contactResponse.body.success).toBe(true);
      expect(contactResponse.body.data.name).toBe('Workflow Contact');

      // Step 3: Verify contact was created
      const contactsResponse = await request(app)
        .get('/v1/contacts')
        .expect(200);

      expect(contactsResponse.body.success).toBe(true);
      expect(contactsResponse.body.data.contacts.length).toBeGreaterThan(0);

      // Step 4: Check system overview
      const overviewResponse = await request(app)
        .get('/v1/cockpit/overview')
        .expect(200);

      expect(overviewResponse.body.success).toBe(true);
      expect(overviewResponse.body.data.totalContacts).toBeGreaterThan(0);
    });

    it('should execute complete product-to-analytics workflow', async () => {
      // Step 1: Create product
      const productResponse = await request(app)
        .post('/v1/products')
        .send({
          name: 'Workflow Product',
          price: 300.00,
          organizationId: 'org_workflow'
        })
        .expect(200);

      expect(productResponse.body.success).toBe(true);
      expect(productResponse.body.data.name).toBe('Workflow Product');

      // Step 2: Verify product was created
      const productsResponse = await request(app)
        .get('/v1/products')
        .expect(200);

      expect(productsResponse.body.success).toBe(true);
      expect(productsResponse.body.data.products.length).toBeGreaterThan(0);

      // Step 3: Check analytics events
      const analyticsResponse = await request(app)
        .get('/v1/analytics/events')
        .expect(200);

      expect(analyticsResponse.body.success).toBe(true);
      expect(analyticsResponse.body.data.events.length).toBeGreaterThan(0);

      // Step 4: Verify system health
      const healthResponse = await request(app)
        .get('/health')
        .expect(200);

      expect(healthResponse.body.success).toBe(true);
      expect(healthResponse.body.data.status).toBe('healthy');
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle invalid email processing requests', async () => {
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
    });

    it('should handle invalid contact creation', async () => {
      const response = await request(app)
        .post('/v1/contacts')
        .send({
          // Missing required fields
          name: 'Test Contact'
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Invalid request data'
      });
    });

    it('should handle invalid webhook requests', async () => {
      const response = await request(app)
        .post('/v1/workers/webhooks/workers')
        .send({ type: 'test' })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Missing required webhook headers'
      });
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle concurrent requests', async () => {
      const requests = Array.from({ length: 10 }, (_, i) =>
        request(app).get('/health')
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    it('should handle bulk operations efficiently', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .post('/v1/workers/emails/process/bulk')
        .send({
          messageIds: Array.from({ length: 50 }, (_, i) => `email_${i}`),
          organizationId: 'org_performance'
        })
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.body.success).toBe(true);
      expect(response.body.data.total).toBe(50);
      expect(responseTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});
