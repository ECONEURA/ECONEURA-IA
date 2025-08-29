import { Request, Response } from 'express'
import { z } from 'zod'
import { createEnhancedAIRouter } from '@econeura/shared'
import { Problems } from '../middleware/problem-json.js'

// Request validation schema
const AIRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  model: z.string().optional(),
  maxTokens: z.number().positive().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxCostEUR: z.number().positive().optional(),
  providerHint: z.enum(['mistral', 'azure-openai']).optional(),
  language: z.string().optional(),
  sensitivity: z.enum(['low', 'medium', 'high']).optional(),
})

export class AIController {
  private router = createEnhancedAIRouter()

  async routeRequest(req: Request, res: Response) {
    try {
      // Validate request body
      const validatedBody = AIRequestSchema.parse(req.body)
      
      // Get organization from auth context
      const orgId = req.orgId
      if (!orgId) {
        throw Problems.UNAUTHORIZED('Organization context required')
      }

      // Prepare AI request
      const aiRequest = {
        orgId,
        ...validatedBody,
      }

      // Route request through AI router
      const response = await this.router.routeRequest(aiRequest)

      res.json({
        success: true,
        data: response,
      })

    } catch (error) {
      if (error instanceof z.ZodError) {
        throw Problems.BAD_REQUEST('Invalid request data', {
          details: error.errors,
        })
      }

      if (error instanceof Error) {
        if (error.message.includes('cost cap exceeded')) {
          throw Problems.TOO_MANY_REQUESTS('AI cost cap exceeded', {
            detail: error.message,
          })
        }
        
        if (error.message.includes('No AI providers available')) {
          throw Problems.SERVICE_UNAVAILABLE('No AI providers available', {
            detail: error.message,
          })
        }
      }

      throw error
    }
  }

  async getProviderHealth(req: Request, res: Response) {
    try {
      const health = await this.router.getProviderHealth()
      
      res.json({
        success: true,
        data: health,
      })
    } catch (error) {
      throw error
    }
  }

  async getCostUsage(req: Request, res: Response) {
    try {
      const orgId = req.orgId
      if (!orgId) {
        throw Problems.UNAUTHORIZED('Organization context required')
      }

      const usage = await this.router.getCostUsage(orgId)
      
      res.json({
        success: true,
        data: usage,
      })
    } catch (error) {
      throw error
    }
  }
}

export const aiController = new AIController()

