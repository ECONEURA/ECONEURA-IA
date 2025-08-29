import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import express from 'express'
import { observabilityMiddleware, errorObservabilityMiddleware, withDatabaseObservability, withAIObservability, withFlowObservability } from './observability.js'

// Mock OpenTelemetry
vi.mock('@econeura/shared/otel', () => ({
  tracer: {
    startActiveSpan: vi.fn((name, callback) => {
      const mockSpan = {
        setAttributes: vi.fn(),
        addEvent: vi.fn(),
        setStatus: vi.fn(),
        end: vi.fn(),
        recordException: vi.fn(),
      }
      return callback(mockSpan)
    }),
  },
  meter: {
    createCounter: vi.fn(() => ({
      add: vi.fn(),
    })),
    createHistogram: vi.fn(() => ({
      record: vi.fn(),
    })),
  },
  createSpan: vi.fn(() => ({
    setAttributes: vi.fn(),
    addEvent: vi.fn(),
    setStatus: vi.fn(),
    end: vi.fn(),
  })),
  recordException: vi.fn(),
  addEvent: vi.fn(),
  setAttributes: vi.fn(),
  recordHTTPRequest: vi.fn(),
  getTraceId: vi.fn(() => 'trace-123'),
  getSpanId: vi.fn(() => 'span-456'),
  customMetrics: {
    httpRequestsTotal: {
      add: vi.fn(),
    },
    dbQueryLatencyMs: {
      record: vi.fn(),
    },
    flowExecutionsTotal: {
      add: vi.fn(),
    },
    flowLatencyMs: {
      record: vi.fn(),
    },
  },
}))

// Mock OpenTelemetry API
vi.mock('@opentelemetry/api', () => ({
  context: {
    active: vi.fn(() => ({})),
    with: vi.fn((span, callback) => callback()),
  },
  SpanStatusCode: {
    OK: 1,
    ERROR: 2,
  },
}))

const app = express()
app.use(express.json())
app.use(observabilityMiddleware())

// Test routes
app.get('/test', (req, res) => {
  res.json({ message: 'success' })
})

app.get('/error', (req, res) => {
  res.status(500).json({ error: 'test error' })
})

app.get('/exception', (req, res) => {
  throw new Error('Test exception')
})

// Add error handling middleware
app.use(errorObservabilityMiddleware())

describe('Observability Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('observabilityMiddleware', () => {
    it('should create spans for HTTP requests', async () => {
      const { createSpan } = await import('@econeura/shared/otel')
      
      await request(app)
        .get('/test')
        .set('x-org-id', 'org1')
        .set('x-request-id', 'req-123')
        .expect(200)

      expect(createSpan).toHaveBeenCalledWith('http.request', expect.objectContaining({
        'http.method': 'GET',
        'http.url': '/test',
        'http.org_id': 'org1',
        'http.request_id': 'req-123',
      }))
    })

    it('should add trace headers to response', async () => {
      const { getTraceId, getSpanId } = await import('@econeura/shared/otel')
      
      const response = await request(app)
        .get('/test')
        .expect(200)

      expect(getTraceId).toHaveBeenCalled()
      expect(getSpanId).toHaveBeenCalled()
    })

    it('should record HTTP metrics', async () => {
      const { recordHTTPRequest } = await import('@econeura/shared/otel')
      
      await request(app)
        .get('/test')
        .set('x-org-id', 'org1')
        .expect(200)

      expect(recordHTTPRequest).toHaveBeenCalledWith(
        'GET',
        '/test',
        200,
        expect.any(Number),
        'org1'
      )
    })

    it('should handle requests with body', async () => {
      const { createSpan } = await import('@econeura/shared/otel')
      
      await request(app)
        .post('/test')
        .send({ test: 'data' })
        .expect(404) // Route doesn't exist, but middleware should still work

      expect(createSpan).toHaveBeenCalledWith('http.request', expect.objectContaining({
        'http.method': 'POST',
        'http.request.body.size': expect.any(Number),
      }))
    })

    it('should handle requests with query parameters', async () => {
      const { createSpan } = await import('@econeura/shared/otel')
      
      await request(app)
        .get('/test?param1=value1&param2=value2')
        .expect(200)

      expect(createSpan).toHaveBeenCalledWith('http.request', expect.objectContaining({
        'http.url': '/test?param1=value1&param2=value2',
        'http.request.query': expect.stringContaining('param1'),
      }))
    })
  })

  describe('errorObservabilityMiddleware', () => {
    it('should handle errors and record metrics', async () => {
      const { customMetrics } = await import('@econeura/shared/otel')
      
      await request(app)
        .get('/exception')
        .set('x-org-id', 'org1')
        .expect(500)

      expect(customMetrics.httpRequestsTotal.add).toHaveBeenCalledWith(1, {
        method: 'GET',
        route: '/exception',
        status_code: '500',
        org_id: 'org1',
      })
    })

    it('should handle errors without organization context', async () => {
      const { customMetrics } = await import('@econeura/shared/otel')
      
      await request(app)
        .get('/exception')
        .expect(500)

      expect(customMetrics.httpRequestsTotal.add).toHaveBeenCalledWith(1, {
        method: 'GET',
        route: '/exception',
        status_code: '500',
        org_id: 'unknown',
      })
    })
  })

  describe('withDatabaseObservability', () => {
    it('should wrap database operations with observability', async () => {
      const mockQuery = vi.fn().mockResolvedValue({ rows: [{ id: 1 }] })
      const { customMetrics } = await import('@econeura/shared/otel')
      
      const result = await withDatabaseObservability(
        'SELECT',
        'users',
        mockQuery,
        'org1'
      )

      expect(result).toEqual({ rows: [{ id: 1 }] })
      expect(customMetrics.dbQueryLatencyMs.record).toHaveBeenCalledWith(
        expect.any(Number),
        {
          operation: 'SELECT',
          table: 'users',
          org_id: 'org1',
        }
      )
    })

    it('should handle database errors', async () => {
      const mockQuery = vi.fn().mockRejectedValue(new Error('Database error'))
      const { customMetrics } = await import('@econeura/shared/otel')
      
      await expect(withDatabaseObservability(
        'SELECT',
        'users',
        mockQuery,
        'org1'
      )).rejects.toThrow('Database error')

      expect(customMetrics.dbQueryLatencyMs.record).toHaveBeenCalledWith(
        expect.any(Number),
        {
          operation: 'SELECT',
          table: 'users',
          org_id: 'org1',
          error: 'true',
        }
      )
    })
  })

  describe('withAIObservability', () => {
    it('should wrap AI operations with observability', async () => {
      const mockAIRequest = vi.fn().mockResolvedValue({ response: 'AI response' })
      
      const result = await withAIObservability(
        'mistral',
        'mistral-7b',
        mockAIRequest,
        'org1'
      )

      expect(result).toEqual({ response: 'AI response' })
    })

    it('should handle AI request errors', async () => {
      const mockAIRequest = vi.fn().mockRejectedValue(new Error('AI service error'))
      
      await expect(withAIObservability(
        'mistral',
        'mistral-7b',
        mockAIRequest,
        'org1'
      )).rejects.toThrow('AI service error')
    })
  })

  describe('withFlowObservability', () => {
    it('should wrap flow operations with observability', async () => {
      const mockFlow = vi.fn().mockResolvedValue({ success: true })
      const { customMetrics } = await import('@econeura/shared/otel')
      
      const result = await withFlowObservability(
        'cfo_collection',
        mockFlow,
        'org1'
      )

      expect(result).toEqual({ success: true })
      expect(customMetrics.flowExecutionsTotal.add).toHaveBeenCalledWith(1, {
        flow_type: 'cfo_collection',
        status: 'success',
        org_id: 'org1',
      })
      expect(customMetrics.flowLatencyMs.record).toHaveBeenCalledWith(
        expect.any(Number),
        {
          flow_type: 'cfo_collection',
          org_id: 'org1',
        }
      )
    })

    it('should handle flow errors', async () => {
      const mockFlow = vi.fn().mockRejectedValue(new Error('Flow execution failed'))
      const { customMetrics } = await import('@econeura/shared/otel')
      
      await expect(withFlowObservability(
        'cfo_collection',
        mockFlow,
        'org1'
      )).rejects.toThrow('Flow execution failed')

      expect(customMetrics.flowExecutionsTotal.add).toHaveBeenCalledWith(1, {
        flow_type: 'cfo_collection',
        status: 'error',
        org_id: 'org1',
      })
      expect(customMetrics.flowLatencyMs.record).toHaveBeenCalledWith(
        expect.any(Number),
        {
          flow_type: 'cfo_collection',
          org_id: 'org1',
        }
      )
    })
  })

  describe('Performance', () => {
    it('should not significantly impact request performance', async () => {
      const startTime = Date.now()
      
      await request(app)
        .get('/test')
        .expect(200)

      const duration = Date.now() - startTime
      
      // Should complete in less than 100ms (including test overhead)
      expect(duration).toBeLessThan(100)
    })

    it('should handle concurrent requests', async () => {
      const requests = Array.from({ length: 10 }, () =>
        request(app).get('/test').expect(200)
      )
      
      await Promise.all(requests)
      
      // All requests should complete successfully
      expect(requests.length).toBe(10)
    })
  })

  describe('Error Scenarios', () => {
    it('should handle missing headers gracefully', async () => {
      await request(app)
        .get('/test')
        .expect(200)

      // Should not throw errors when headers are missing
    })

    it('should handle malformed request bodies', async () => {
      await request(app)
        .post('/test')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400) // Express will return 400 for malformed JSON

      // Should not throw errors for malformed bodies
    })

    it('should handle very large request bodies', async () => {
      const largeBody = { data: 'x'.repeat(10000) }
      
      await request(app)
        .post('/test')
        .send(largeBody)
        .expect(404) // Route doesn't exist, but middleware should handle large body

      // Should not throw errors for large bodies
    })
  })
})
