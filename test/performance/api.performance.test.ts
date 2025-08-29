import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from '../../apps/api/src/app.js'
import { performanceUtils } from '../setup.performance.js'

describe('API Performance Tests', () => {
  describe('Health Endpoints Performance', () => {
    it('should respond to health check within 100ms', async () => {
      await performanceUtils.measurePerformance(
        'health-check',
        async () => {
          const response = await request(app)
            .get('/health')
            .expect(200)
          
          expect(response.body.status).toBe('healthy')
          return response
        },
        100 // 100ms threshold
      )
    })

    it('should respond to metrics health within 200ms', async () => {
      await performanceUtils.measurePerformance(
        'metrics-health',
        async () => {
          const response = await request(app)
            .get('/metrics/health')
            .expect(200)
          
          expect(response.body.status).toBe('healthy')
          return response
        },
        200 // 200ms threshold
      )
    })

    it('should handle concurrent health checks', async () => {
      const result = await performanceUtils.runLoadTest(
        'concurrent-health-checks',
        async () => {
          const response = await request(app)
            .get('/health')
            .expect(200)
          
          expect(response.body.status).toBe('healthy')
          return response
        },
        10, // 10 concurrent requests
        50  // 50 total iterations
      )

      expect(result.successRate).toBeGreaterThan(95) // 95% success rate
      expect(result.avgDuration).toBeLessThan(100) // Average < 100ms
    })
  })

  describe('CRM Endpoints Performance', () => {
    const testOrgId = 'perf-test-org'
    const testCompany = {
      name: 'Performance Test Company',
      industry: 'Technology',
      website: 'https://perftest.com',
    }

    it('should create company within 500ms', async () => {
      await performanceUtils.measurePerformance(
        'create-company',
        async () => {
          const response = await request(app)
            .post('/api/crm/companies')
            .set('x-org-id', testOrgId)
            .set('authorization', 'Bearer test-token')
            .send(testCompany)
            .expect(201)
          
          expect(response.body.name).toBe(testCompany.name)
          return response
        },
        500 // 500ms threshold
      )
    })

    it('should list companies within 300ms', async () => {
      await performanceUtils.measurePerformance(
        'list-companies',
        async () => {
          const response = await request(app)
            .get('/api/crm/companies')
            .set('x-org-id', testOrgId)
            .set('authorization', 'Bearer test-token')
            .query({ page: 1, limit: 10 })
            .expect(200)
          
          expect(response.body.data).toBeInstanceOf(Array)
          expect(response.body.pagination).toBeDefined()
          return response
        },
        300 // 300ms threshold
      )
    })

    it('should handle concurrent company operations', async () => {
      const result = await performanceUtils.runLoadTest(
        'concurrent-company-operations',
        async () => {
          // Create a company
          const createResponse = await request(app)
            .post('/api/crm/companies')
            .set('x-org-id', testOrgId)
            .set('authorization', 'Bearer test-token')
            .send({
              name: `Test Company ${Date.now()}`,
              industry: 'Technology',
              website: 'https://test.com',
            })
            .expect(201)

          // List companies
          await request(app)
            .get('/api/crm/companies')
            .set('x-org-id', testOrgId)
            .set('authorization', 'Bearer test-token')
            .query({ page: 1, limit: 10 })
            .expect(200)

          return createResponse
        },
        5,  // 5 concurrent requests
        20  // 20 total iterations
      )

      expect(result.successRate).toBeGreaterThan(90) // 90% success rate
      expect(result.avgDuration).toBeLessThan(1000) // Average < 1s
    })
  })

  describe('AI Router Performance', () => {
    const testOrgId = 'perf-test-org'

    it('should route AI request within 2 seconds', async () => {
      await performanceUtils.measurePerformance(
        'ai-route-request',
        async () => {
          const response = await request(app)
            .post('/api/ai/route')
            .set('x-org-id', testOrgId)
            .set('authorization', 'Bearer test-token')
            .send({
              prompt: 'Hello, this is a performance test.',
              max_cost_cents: 100,
              sensitivity: 'low',
            })
            .expect(200)
          
          expect(response.body.response).toBeDefined()
          expect(response.body.provider).toBeDefined()
          return response
        },
        2000 // 2 second threshold for AI requests
      )
    })

    it('should handle AI cost cap checks efficiently', async () => {
      await performanceUtils.measurePerformance(
        'ai-cost-cap-check',
        async () => {
          const response = await request(app)
            .post('/api/ai/route')
            .set('x-org-id', testOrgId)
            .set('authorization', 'Bearer test-token')
            .send({
              prompt: 'Short test',
              max_cost_cents: 1, // Very low cost cap
              sensitivity: 'low',
            })
          
          // Should either succeed or return cost cap error quickly
          expect([200, 429]).toContain(response.status)
          return response
        },
        500 // 500ms threshold for cost cap checks
      )
    })
  })

  describe('Flows Performance', () => {
    const testOrgId = 'perf-test-org'

    it('should start flow execution within 1 second', async () => {
      await performanceUtils.measurePerformance(
        'start-flow-execution',
        async () => {
          const response = await request(app)
            .post('/api/flows/collection')
            .set('x-org-id', testOrgId)
            .set('authorization', 'Bearer test-token')
            .send({
              invoice_id: `test-invoice-${Date.now()}`,
              action: 'start_collection',
            })
            .expect(200)
          
          expect(response.body.flow_id).toBeDefined()
          expect(response.body.status).toBeDefined()
          return response
        },
        1000 // 1 second threshold
      )
    })

    it('should get flow status within 200ms', async () => {
      // First create a flow
      const createResponse = await request(app)
        .post('/api/flows/collection')
        .set('x-org-id', testOrgId)
        .set('authorization', 'Bearer test-token')
        .send({
          invoice_id: `test-invoice-${Date.now()}`,
          action: 'start_collection',
        })
        .expect(200)

      const flowId = createResponse.body.flow_id

      await performanceUtils.measurePerformance(
        'get-flow-status',
        async () => {
          const response = await request(app)
            .get(`/api/flows/${flowId}`)
            .set('x-org-id', testOrgId)
            .set('authorization', 'Bearer test-token')
            .expect(200)
          
          expect(response.body.flow_id).toBe(flowId)
          return response
        },
        200 // 200ms threshold
      )
    })
  })

  describe('Webhook Performance', () => {
    it('should process webhook within 500ms', async () => {
      await performanceUtils.measurePerformance(
        'process-webhook',
        async () => {
          const webhookPayload = {
            event_type: 'invoice_overdue',
            data: {
              invoice_id: `test-invoice-${Date.now()}`,
              amount: 1000,
              due_date: '2024-01-15',
            },
            timestamp: new Date().toISOString(),
          }

          const response = await request(app)
            .post('/api/webhooks/make')
            .set('content-type', 'application/json')
            .set('x-signature', 'test-signature')
            .send(webhookPayload)
            .expect(200)
          
          expect(response.body.success).toBe(true)
          return response
        },
        500 // 500ms threshold
      )
    })

    it('should handle concurrent webhooks', async () => {
      const result = await performanceUtils.runLoadTest(
        'concurrent-webhooks',
        async () => {
          const webhookPayload = {
            event_type: 'invoice_overdue',
            data: {
              invoice_id: `test-invoice-${Date.now()}`,
              amount: 1000,
              due_date: '2024-01-15',
            },
            timestamp: new Date().toISOString(),
          }

          const response = await request(app)
            .post('/api/webhooks/make')
            .set('content-type', 'application/json')
            .set('x-signature', 'test-signature')
            .send(webhookPayload)
            .expect(200)
          
          expect(response.body.success).toBe(true)
          return response
        },
        5,  // 5 concurrent requests
        30  // 30 total iterations
      )

      expect(result.successRate).toBeGreaterThan(95) // 95% success rate
      expect(result.avgDuration).toBeLessThan(500) // Average < 500ms
    })
  })

  describe('Error Handling Performance', () => {
    it('should handle validation errors quickly', async () => {
      await performanceUtils.measurePerformance(
        'validation-error-handling',
        async () => {
          const response = await request(app)
            .post('/api/crm/companies')
            .set('x-org-id', 'test-org')
            .set('authorization', 'Bearer test-token')
            .send({}) // Missing required fields
            .expect(400)
          
          expect(response.headers['content-type']).toContain('application/problem+json')
          return response
        },
        200 // 200ms threshold for error responses
      )
    })

    it('should handle 404 errors quickly', async () => {
      await performanceUtils.measurePerformance(
        'not-found-error-handling',
        async () => {
          const response = await request(app)
            .get('/api/unknown/route')
            .set('x-org-id', 'test-org')
            .set('authorization', 'Bearer test-token')
            .expect(404)
          
          expect(response.headers['content-type']).toContain('application/problem+json')
          return response
        },
        100 // 100ms threshold for 404 responses
      )
    })
  })

  describe('Observability Performance', () => {
    it('should add trace headers without significant overhead', async () => {
      await performanceUtils.measurePerformance(
        'trace-headers-overhead',
        async () => {
          const response = await request(app)
            .get('/health')
            .expect(200)
          
          expect(response.headers['x-trace-id']).toBeDefined()
          expect(response.headers['x-span-id']).toBeDefined()
          return response
        },
        150 // 150ms threshold (50ms overhead allowed)
      )
    })

    it('should propagate correlation ID efficiently', async () => {
      const correlationId = 'perf-test-correlation-123'
      
      await performanceUtils.measurePerformance(
        'correlation-id-propagation',
        async () => {
          const response = await request(app)
            .get('/health')
            .set('x-request-id', correlationId)
            .expect(200)
          
          expect(response.headers['x-request-id']).toBe(correlationId)
          return response
        },
        120 // 120ms threshold (20ms overhead allowed)
      )
    })
  })

  describe('Memory Usage', () => {
    it('should not leak memory during repeated requests', async () => {
      const initialMemory = process.memoryUsage()
      
      // Make 100 requests
      for (let i = 0; i < 100; i++) {
        await request(app)
          .get('/health')
          .expect(200)
      }
      
      const finalMemory = process.memoryUsage()
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed
      
      // Memory increase should be less than 10MB
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024)
    })
  })
})
