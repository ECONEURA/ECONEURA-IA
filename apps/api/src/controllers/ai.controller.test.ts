import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import express from 'express'
import { apiRouter } from '../routes/index.js'
import { Problems } from '../middleware/problem-json.js'

const app = express()
app.use(express.json())
app.use('/api', apiRouter)

// Mock auth middleware
vi.mock('../middleware/auth.js', () => ({
  requireAuth: (req: any, res: any, next: any) => {
    req.user = { id: 'user1', orgId: 'org1' }
    next()
  },
  requireOrg: (req: any, res: any, next: any) => {
    req.orgId = 'org1'
    next()
  },
}))

// Mock AI router
vi.mock('@econeura/shared', () => ({
  createEnhancedAIRouter: () => ({
    routeRequest: vi.fn(),
    getProviderHealth: vi.fn(),
    getCostUsage: vi.fn(),
  }),
}))

describe('AI Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/v1/ai/route', () => {
    it('should route AI request successfully', async () => {
      const mockResponse = {
        content: 'AI response',
        model: 'mistral-instruct',
        provider: 'mistral',
        tokens: { input: 100, output: 50 },
        costEUR: 0.05,
        latencyMs: 500,
        fallbackUsed: false,
        requestId: 'req-123',
      }

      const { createEnhancedAIRouter } = await import('@econeura/shared')
      const mockRouter = createEnhancedAIRouter()
      mockRouter.routeRequest.mockResolvedValue(mockResponse)

      const response = await request(app)
        .post('/api/v1/ai/route')
        .send({
          prompt: 'Hello, how are you?',
          maxTokens: 100,
          temperature: 0.7,
        })
        .expect(200)

      expect(response.body).toEqual({
        success: true,
        data: mockResponse,
      })
      expect(mockRouter.routeRequest).toHaveBeenCalledWith({
        orgId: 'org1',
        prompt: 'Hello, how are you?',
        maxTokens: 100,
        temperature: 0.7,
      })
    })

    it('should return 400 for invalid request', async () => {
      const response = await request(app)
        .post('/api/v1/ai/route')
        .send({
          prompt: '', // Invalid: empty prompt
          maxTokens: -1, // Invalid: negative tokens
        })
        .expect(400)

      expect(response.body).toMatchObject({
        type: 'https://tools.ietf.org/html/rfc7231#section-6.5.1',
        title: 'Bad Request',
        status: 400,
      })
    })

    it('should return 429 when cost cap exceeded', async () => {
      const { createEnhancedAIRouter } = await import('@econeura/shared')
      const mockRouter = createEnhancedAIRouter()
      mockRouter.routeRequest.mockRejectedValue(
        new Error('AI cost cap exceeded: 55€/50€')
      )

      const response = await request(app)
        .post('/api/v1/ai/route')
        .send({
          prompt: 'Test prompt',
        })
        .expect(429)

      expect(response.body).toMatchObject({
        type: 'https://tools.ietf.org/html/rfc6585#section-4',
        title: 'Too Many Requests',
        status: 429,
        detail: 'AI cost cap exceeded: 55€/50€',
      })
    })

    it('should return 503 when no providers available', async () => {
      const { createEnhancedAIRouter } = await import('@econeura/shared')
      const mockRouter = createEnhancedAIRouter()
      mockRouter.routeRequest.mockRejectedValue(
        new Error('No AI providers available')
      )

      const response = await request(app)
        .post('/api/v1/ai/route')
        .send({
          prompt: 'Test prompt',
        })
        .expect(503)

      expect(response.body).toMatchObject({
        type: 'https://tools.ietf.org/html/rfc7231#section-6.6.4',
        title: 'Service Unavailable',
        status: 503,
        detail: 'No AI providers available',
      })
    })
  })

  describe('GET /api/v1/ai/providers/health', () => {
    it('should return provider health status', async () => {
      const mockHealth = {
        mistral: {
          health: 'healthy',
          lastCheck: new Date().toISOString(),
          models: ['mistral-instruct'],
        },
        'azure-openai': {
          health: 'healthy',
          lastCheck: new Date().toISOString(),
          models: ['gpt-4o-mini', 'gpt-4o'],
        },
      }

      const { createEnhancedAIRouter } = await import('@econeura/shared')
      const mockRouter = createEnhancedAIRouter()
      mockRouter.getProviderHealth.mockResolvedValue(mockHealth)

      const response = await request(app)
        .get('/api/v1/ai/providers/health')
        .expect(200)

      expect(response.body).toEqual({
        success: true,
        data: mockHealth,
      })
    })
  })

  describe('GET /api/v1/ai/cost/usage', () => {
    it('should return cost usage for organization', async () => {
      const mockUsage = {
        currentMonthly: 25.50,
        limit: 50.0,
        usagePercent: 51.0,
      }

      const { createEnhancedAIRouter } = await import('@econeura/shared')
      const mockRouter = createEnhancedAIRouter()
      mockRouter.getCostUsage.mockResolvedValue(mockUsage)

      const response = await request(app)
        .get('/api/v1/ai/cost/usage')
        .expect(200)

      expect(response.body).toEqual({
        success: true,
        data: mockUsage,
      })
      expect(mockRouter.getCostUsage).toHaveBeenCalledWith('org1')
    })
  })
})

