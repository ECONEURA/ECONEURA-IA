import { Router } from 'express';
import { z } from 'zod';

import { nextAIPlatformService, NextAIRequestSchema } from '../services/next-ai-platform.service.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = Router();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const processRequestSchema = NextAIRequestSchema;

const getSessionHistorySchema = z.object({
  sessionId: z.string().uuid(),
});

const getInsightsSchema = z.object({
  organizationId: z.string().uuid(),
  limit: z.number().int().positive().max(100).optional(),
  type: z.string().optional(),
  impact: z.enum(['low', 'medium', 'high', 'critical']).optional(),
});

// ============================================================================
// NEXT AI PLATFORM ENDPOINTS
// ============================================================================

/**
 * @swagger
 * /v1/next-ai-platform/process:
 *   post:
 *     summary: Process Next AI request
 *     description: Process various types of AI requests including chat, analysis, prediction, generation, optimization, and insights
 *     tags: [Next AI Platform]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - userId
 *               - organizationId
 *               - requestType
 *               - input
 *             properties:
 *               sessionId:
 *                 type: string
 *                 format: uuid
 *                 description: Session ID for the request
 *               userId:
 *                 type: string
 *                 format: uuid
 *                 description: User ID making the request
 *               organizationId:
 *                 type: string
 *                 format: uuid
 *                 description: Organization ID
 *               requestType:
 *                 type: string
 *                 enum: [chat, analysis, prediction, generation, optimization, insights]
 *                 description: Type of AI request
 *               input:
 *                 type: object
 *                 properties:
 *                   text:
 *                     type: string
 *                   data:
 *                     type: object
 *                   context:
 *                     type: object
 *                   preferences:
 *                     type: object
 *               options:
 *                 type: object
 *                 properties:
 *                   model:
 *                     type: string
 *                   temperature:
 *                     type: number
 *                     minimum: 0
 *                     maximum: 2
 *                   maxTokens:
 *                     type: integer
 *                   stream:
 *                     type: boolean
 *                   includeMetadata:
 *                     type: boolean
 *     responses:
 *       200:
 *         description: Request processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     requestType:
 *                       type: string
 *                     output:
 *                       type: object
 *                     metadata:
 *                       type: object
 *                       properties:
 *                         model:
 *                           type: string
 *                         tokens:
 *                           type: object
 *                         processingTime:
 *                           type: number
 *                         confidence:
 *                           type: number
 *                         suggestions:
 *                           type: array
 *                           items:
 *                             type: string
 *                     insights:
 *                       type: array
 *                       items:
 *                         type: string
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: string
 *                 error:
 *                   type: string
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/process', authMiddleware, validate(processRequestSchema), async (req, res) => {
  try {
    const request = req.body;
    
    const result = await nextAIPlatformService.processRequest(request);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error processing Next AI request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process request',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /v1/next-ai-platform/models:
 *   get:
 *     summary: Get available AI models
 *     description: Get list of available AI models with their capabilities and costs
 *     tags: [Next AI Platform]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Models retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       type:
 *                         type: string
 *                       capabilities:
 *                         type: array
 *                         items:
 *                           type: string
 *                       costPerToken:
 *                         type: number
 *                       version:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/models', authMiddleware, async (req, res) => {
  try {
    const models = await nextAIPlatformService.getAvailableModels();
    
    res.status(200).json({
      success: true,
      data: models,
    });
  } catch (error) {
    console.error('Error getting available models:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get available models',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /v1/next-ai-platform/session/{sessionId}/history:
 *   get:
 *     summary: Get session history
 *     description: Get history of requests for a specific session
 *     tags: [Next AI Platform]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Session ID
 *     responses:
 *       200:
 *         description: Session history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       requestType:
 *                         type: string
 *                       input:
 *                         type: object
 *                       output:
 *                         type: object
 *                       model:
 *                         type: string
 *                       tokens:
 *                         type: integer
 *                       processingTime:
 *                         type: integer
 *                       confidence:
 *                         type: number
 *                       success:
 *                         type: boolean
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       400:
 *         description: Invalid session ID
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/session/:sessionId/history', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid session ID format',
      });
    }

    const history = await nextAIPlatformService.getSessionHistory(sessionId);
    
    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('Error getting session history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get session history',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /v1/next-ai-platform/insights:
 *   get:
 *     summary: Get AI insights
 *     description: Get generated insights for an organization
 *     tags: [Next AI Platform]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Organization ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Maximum number of insights to return
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by insight type
 *       - in: query
 *         name: impact
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *         description: Filter by impact level
 *     responses:
 *       200:
 *         description: Insights retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       type:
 *                         type: string
 *                       title:
 *                         type: string
 *                       content:
 *                         type: string
 *                       data:
 *                         type: object
 *                       confidence:
 *                         type: number
 *                       impact:
 *                         type: string
 *                       actionable:
 *                         type: boolean
 *                       tags:
 *                         type: array
 *                         items:
 *                           type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/insights', authMiddleware, async (req, res) => {
  try {
    const { organizationId, limit = 20, type, impact } = req.query;
    
    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: 'organizationId is required',
      });
    }

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(organizationId as string)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid organizationId format',
      });
    }

    const insights = await nextAIPlatformService.getInsights(
      organizationId as string,
      parseInt(limit as string)
    );

    // Apply filters
    let filteredInsights = insights;
    
    if (type) {
      filteredInsights = filteredInsights.filter(insight => insight.type === type);
    }
    
    if (impact) {
      filteredInsights = filteredInsights.filter(insight => insight.impact === impact);
    }
    
    res.status(200).json({
      success: true,
      data: filteredInsights,
    });
  } catch (error) {
    console.error('Error getting insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get insights',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /v1/next-ai-platform/chat:
 *   post:
 *     summary: Process chat request
 *     description: Simplified endpoint for chat requests
 *     tags: [Next AI Platform]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - userId
 *               - organizationId
 *               - message
 *             properties:
 *               sessionId:
 *                 type: string
 *                 format: uuid
 *               userId:
 *                 type: string
 *                 format: uuid
 *               organizationId:
 *                 type: string
 *                 format: uuid
 *               message:
 *                 type: string
 *               context:
 *                 type: object
 *               options:
 *                 type: object
 *     responses:
 *       200:
 *         description: Chat processed successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { sessionId, userId, organizationId, message, context, options } = req.body;
    
    if (!sessionId || !userId || !organizationId || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: sessionId, userId, organizationId, message',
      });
    }

    const request = {
      sessionId,
      userId,
      organizationId,
      requestType: 'chat' as const,
      input: {
        text: message,
        context,
      },
      options,
    };

    const result = await nextAIPlatformService.processRequest(request);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error processing chat request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process chat request',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /v1/next-ai-platform/analyze:
 *   post:
 *     summary: Process analysis request
 *     description: Simplified endpoint for data analysis requests
 *     tags: [Next AI Platform]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - userId
 *               - organizationId
 *               - data
 *             properties:
 *               sessionId:
 *                 type: string
 *                 format: uuid
 *               userId:
 *                 type: string
 *                 format: uuid
 *               organizationId:
 *                 type: string
 *                 format: uuid
 *               data:
 *                 type: object
 *               context:
 *                 type: object
 *               options:
 *                 type: object
 *     responses:
 *       200:
 *         description: Analysis processed successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/analyze', authMiddleware, async (req, res) => {
  try {
    const { sessionId, userId, organizationId, data, context, options } = req.body;
    
    if (!sessionId || !userId || !organizationId || !data) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: sessionId, userId, organizationId, data',
      });
    }

    const request = {
      sessionId,
      userId,
      organizationId,
      requestType: 'analysis' as const,
      input: {
        data,
        context,
      },
      options,
    };

    const result = await nextAIPlatformService.processRequest(request);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error processing analysis request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process analysis request',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /v1/next-ai-platform/predict:
 *   post:
 *     summary: Process prediction request
 *     description: Simplified endpoint for prediction requests
 *     tags: [Next AI Platform]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - userId
 *               - organizationId
 *               - data
 *             properties:
 *               sessionId:
 *                 type: string
 *                 format: uuid
 *               userId:
 *                 type: string
 *                 format: uuid
 *               organizationId:
 *                 type: string
 *                 format: uuid
 *               data:
 *                 type: object
 *               context:
 *                 type: object
 *               options:
 *                 type: object
 *     responses:
 *       200:
 *         description: Prediction processed successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/predict', authMiddleware, async (req, res) => {
  try {
    const { sessionId, userId, organizationId, data, context, options } = req.body;
    
    if (!sessionId || !userId || !organizationId || !data) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: sessionId, userId, organizationId, data',
      });
    }

    const request = {
      sessionId,
      userId,
      organizationId,
      requestType: 'prediction' as const,
      input: {
        data,
        context,
      },
      options,
    };

    const result = await nextAIPlatformService.processRequest(request);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error processing prediction request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process prediction request',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /v1/next-ai-platform/generate:
 *   post:
 *     summary: Process generation request
 *     description: Simplified endpoint for content generation requests
 *     tags: [Next AI Platform]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - userId
 *               - organizationId
 *               - prompt
 *             properties:
 *               sessionId:
 *                 type: string
 *                 format: uuid
 *               userId:
 *                 type: string
 *                 format: uuid
 *               organizationId:
 *                 type: string
 *                 format: uuid
 *               prompt:
 *                 type: string
 *               context:
 *                 type: object
 *               options:
 *                 type: object
 *     responses:
 *       200:
 *         description: Generation processed successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const { sessionId, userId, organizationId, prompt, context, options } = req.body;
    
    if (!sessionId || !userId || !organizationId || !prompt) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: sessionId, userId, organizationId, prompt',
      });
    }

    const request = {
      sessionId,
      userId,
      organizationId,
      requestType: 'generation' as const,
      input: {
        text: prompt,
        context,
      },
      options,
    };

    const result = await nextAIPlatformService.processRequest(request);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error processing generation request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process generation request',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /v1/next-ai-platform/health:
 *   get:
 *     summary: Get Next AI Platform service health
 *     description: Get health status of the Next AI Platform service
 *     tags: [Next AI Platform]
 *     responses:
 *       200:
 *         description: Health status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [healthy, degraded, unhealthy]
 *                     services:
 *                       type: object
 *                     lastCheck:
 *                       type: string
 *                       format: date-time
 *       500:
 *         description: Internal server error
 */
router.get('/health', async (req, res) => {
  try {
    const healthStatus = await nextAIPlatformService.getHealthStatus();
    
    res.status(200).json({
      success: true,
      data: healthStatus,
    });
  } catch (error) {
    console.error('Error getting health status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get health status',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export { router as nextAIPlatformRoutes };
