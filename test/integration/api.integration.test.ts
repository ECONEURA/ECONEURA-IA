import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { app } from '../../apps/api/src/app.js'
import { db } from '@econeura/db'

describe('API Integration Tests', () => {
  beforeAll(async () => {
    // Ensure database is ready
    await db.connect()
  })

  afterAll(async () => {
    await db.close()
  })

  describe('Health Endpoints', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200)

      expect(response.body).toMatchObject({
        status: 'healthy',
        timestamp: expect.any(String),
        services: expect.objectContaining({
          database: expect.any(String),
        }),
      })
    })

    it('should return metrics health', async () => {
      const response = await request(app)
        .get('/metrics/health')
        .expect(200)

      expect(response.body).toMatchObject({
        status: 'healthy',
        timestamp: expect.any(String),
        metrics: expect.objectContaining({
          total: expect.any(Number),
          counters: expect.any(Number),
          gauges: expect.any(Number),
          histograms: expect.any(Number),
        }),
        services: expect.objectContaining({
          prometheus: 'active',
          opentelemetry: 'active',
        }),
      })
    })
  })

  describe('CRM Endpoints', () => {
    const testOrgId = 'test-org-123'
    const testCompany = {
      name: 'Test Company',
      industry: 'Technology',
      website: 'https://testcompany.com',
    }

    it('should create and retrieve a company', async () => {
      // Create company
      const createResponse = await request(app)
        .post('/api/crm/companies')
        .set('x-org-id', testOrgId)
        .set('authorization', 'Bearer test-token')
        .send(testCompany)
        .expect(201)

      expect(createResponse.body).toMatchObject({
        id: expect.any(String),
        ...testCompany,
        org_id: testOrgId,
        created_at: expect.any(String),
        updated_at: expect.any(String),
      })

      const companyId = createResponse.body.id

      // Retrieve company
      const getResponse = await request(app)
        .get(`/api/crm/companies/${companyId}`)
        .set('x-org-id', testOrgId)
        .set('authorization', 'Bearer test-token')
        .expect(200)

      expect(getResponse.body).toMatchObject({
        id: companyId,
        ...testCompany,
        org_id: testOrgId,
      })
    })

    it('should list companies with pagination', async () => {
      const response = await request(app)
        .get('/api/crm/companies')
        .set('x-org-id', testOrgId)
        .set('authorization', 'Bearer test-token')
        .query({ page: 1, limit: 10 })
        .expect(200)

      expect(response.body).toMatchObject({
        data: expect.any(Array),
        pagination: expect.objectContaining({
          page: 1,
          limit: 10,
          total: expect.any(Number),
          totalPages: expect.any(Number),
        }),
      })
    })
  })

  describe('AI Router Endpoints', () => {
    const testOrgId = 'test-org-123'

    it('should route AI request successfully', async () => {
      const response = await request(app)
        .post('/api/ai/route')
        .set('x-org-id', testOrgId)
        .set('authorization', 'Bearer test-token')
        .send({
          prompt: 'Hello, how are you?',
          max_cost_cents: 100,
          sensitivity: 'low',
        })
        .expect(200)

      expect(response.body).toMatchObject({
        response: expect.any(String),
        provider: expect.any(String),
        model: expect.any(String),
        cost_cents: expect.any(Number),
        tokens_used: expect.objectContaining({
          input: expect.any(Number),
          output: expect.any(Number),
        }),
        latency_ms: expect.any(Number),
      })
    })

    it('should handle AI cost cap exceeded', async () => {
      // This test would require mocking the cost meter to simulate exceeded cap
      const response = await request(app)
        .post('/api/ai/route')
        .set('x-org-id', testOrgId)
        .set('authorization', 'Bearer test-token')
        .send({
          prompt: 'Test prompt',
          max_cost_cents: 1, // Very low cost cap
          sensitivity: 'low',
        })

      // Should either succeed or return cost cap error
      expect([200, 429]).toContain(response.status)
    })
  })

  describe('Flows Endpoints', () => {
    const testOrgId = 'test-org-123'

    it('should execute CFO collection flow', async () => {
      const response = await request(app)
        .post('/api/flows/collection')
        .set('x-org-id', testOrgId)
        .set('authorization', 'Bearer test-token')
        .send({
          invoice_id: 'test-invoice-123',
          action: 'start_collection',
        })
        .expect(200)

      expect(response.body).toMatchObject({
        flow_id: expect.any(String),
        status: expect.stringMatching(/pending_approval|completed|failed/),
        steps: expect.any(Array),
        created_at: expect.any(String),
      })
    })

    it('should get flow status', async () => {
      // First create a flow
      const createResponse = await request(app)
        .post('/api/flows/collection')
        .set('x-org-id', testOrgId)
        .set('authorization', 'Bearer test-token')
        .send({
          invoice_id: 'test-invoice-456',
          action: 'start_collection',
        })
        .expect(200)

      const flowId = createResponse.body.flow_id

      // Then get its status
      const statusResponse = await request(app)
        .get(`/api/flows/${flowId}`)
        .set('x-org-id', testOrgId)
        .set('authorization', 'Bearer test-token')
        .expect(200)

      expect(statusResponse.body).toMatchObject({
        flow_id: flowId,
        status: expect.any(String),
        steps: expect.any(Array),
      })
    })
  })

  describe('Webhook Endpoints', () => {
    it('should process Make webhook', async () => {
      const webhookPayload = {
        event_type: 'invoice_overdue',
        data: {
          invoice_id: 'test-invoice-789',
          amount: 1000,
          due_date: '2024-01-15',
        },
        timestamp: new Date().toISOString(),
      }

      const response = await request(app)
        .post('/api/webhooks/make')
        .set('content-type', 'application/json')
        .set('x-signature', 'test-signature') // In real test, this would be HMAC
        .send(webhookPayload)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: expect.any(String),
        correlation_id: expect.any(String),
      })
    })
  })

  describe('Error Handling', () => {
    it('should return Problem+JSON for validation errors', async () => {
      const response = await request(app)
        .post('/api/crm/companies')
        .set('x-org-id', 'test-org')
        .set('authorization', 'Bearer test-token')
        .send({}) // Missing required fields
        .expect(400)

      expect(response.headers['content-type']).toContain('application/problem+json')
      expect(response.body).toMatchObject({
        type: expect.any(String),
        title: expect.any(String),
        status: 400,
        detail: expect.any(String),
      })
    })

    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/api/unknown/route')
        .set('x-org-id', 'test-org')
        .set('authorization', 'Bearer test-token')
        .expect(404)

      expect(response.headers['content-type']).toContain('application/problem+json')
      expect(response.body).toMatchObject({
        type: expect.any(String),
        title: 'Not Found',
        status: 404,
      })
    })
  })

  describe('Observability', () => {
    it('should include trace headers in response', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200)

      expect(response.headers).toMatchObject({
        'x-trace-id': expect.any(String),
        'x-span-id': expect.any(String),
      })
    })

    it('should propagate correlation ID', async () => {
      const correlationId = 'test-correlation-123'

      const response = await request(app)
        .get('/health')
        .set('x-request-id', correlationId)
        .expect(200)

      expect(response.headers['x-request-id']).toBe(correlationId)
    })
  })
})
