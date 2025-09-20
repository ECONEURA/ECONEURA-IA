import { Router } from 'express';
import { advancedAIFeaturesService, AdvancedAIRequestSchema } from '../services/advanced-ai-features.service.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { z } from 'zod';

const router = Router();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const processAdvancedFeatureSchema = AdvancedAIRequestSchema;

const getAdvancedInsightsSchema = z.object({
  organizationId: z.string().uuid(),
  limit: z.number().int().positive().max(100).optional(),
  type: z.string().optional(),
  impact: z.enum(['low', 'medium', 'high', 'critical']).optional(),
});

// ============================================================================
// ADVANCED AI FEATURES ENDPOINTS
// ============================================================================

/**
 * @swagger
 * /v1/advanced-ai-features/process:
 *   post:
 *     summary: Process Advanced AI feature request
 *     description: Process advanced AI features including multimodal, reasoning, code generation, document analysis, voice processing, image analysis, NLP advanced, and automation
 *     tags: [Advanced AI Features]
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
 *               - featureType
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
 *               featureType:
 *                 type: string
 *                 enum: [multimodal, reasoning, code-generation, document-analysis, voice-processing, image-analysis, nlp-advanced, automation]
 *                 description: Type of advanced AI feature
 *               input:
 *                 type: object
 *                 properties:
 *                   text:
 *                     type: string
 *                   images:
 *                     type: array
 *                     items:
 *                       type: string
 *                   audio:
 *                     type: string
 *                   documents:
 *                     type: array
 *                     items:
 *                       type: string
 *                   code:
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
 *                   advancedOptions:
 *                     type: object
 *     responses:
 *       200:
 *         description: Advanced AI feature processed successfully
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
 *                     featureType:
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
 *                         advancedMetrics:
 *                           type: object
 *                     insights:
 *                       type: array
 *                       items:
 *                         type: string
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: string
 *                     nextSteps:
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
router.post('/process', authMiddleware, validate(processAdvancedFeatureSchema), async (req, res) => {
  try {
    const request = req.body;
    
    const result = await advancedAIFeaturesService.processAdvancedFeature(request);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error processing Advanced AI feature:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process advanced AI feature',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /v1/advanced-ai-features/models:
 *   get:
 *     summary: Get available advanced AI models
 *     description: Get list of available advanced AI models with their capabilities and advanced features
 *     tags: [Advanced AI Features]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Advanced AI models retrieved successfully
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
 *                       advancedFeatures:
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
    const models = await advancedAIFeaturesService.getAvailableAdvancedModels();
    
    res.status(200).json({
      success: true,
      data: models,
    });
  } catch (error) {
    console.error('Error getting available advanced AI models:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get available advanced AI models',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /v1/advanced-ai-features/insights:
 *   get:
 *     summary: Get advanced AI insights
 *     description: Get generated advanced AI insights for an organization
 *     tags: [Advanced AI Features]
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
 *         description: Advanced AI insights retrieved successfully
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

    const insights = await advancedAIFeaturesService.getAdvancedInsights(
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
    console.error('Error getting advanced AI insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get advanced AI insights',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /v1/advanced-ai-features/multimodal:
 *   post:
 *     summary: Process multimodal request
 *     description: Simplified endpoint for multimodal AI processing
 *     tags: [Advanced AI Features]
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
 *               - text
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
 *               text:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               context:
 *                 type: object
 *               options:
 *                 type: object
 *     responses:
 *       200:
 *         description: Multimodal request processed successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/multimodal', authMiddleware, async (req, res) => {
  try {
    const { sessionId, userId, organizationId, text, images, context, options } = req.body;
    
    if (!sessionId || !userId || !organizationId || !text) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: sessionId, userId, organizationId, text',
      });
    }

    const request = {
      sessionId,
      userId,
      organizationId,
      featureType: 'multimodal' as const,
      input: {
        text,
        images,
        context,
      },
      options,
    };

    const result = await advancedAIFeaturesService.processAdvancedFeature(request);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error processing multimodal request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process multimodal request',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /v1/advanced-ai-features/reasoning:
 *   post:
 *     summary: Process reasoning request
 *     description: Simplified endpoint for advanced reasoning AI processing
 *     tags: [Advanced AI Features]
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
 *               - problem
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
 *               problem:
 *                 type: string
 *               context:
 *                 type: object
 *               options:
 *                 type: object
 *     responses:
 *       200:
 *         description: Reasoning request processed successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/reasoning', authMiddleware, async (req, res) => {
  try {
    const { sessionId, userId, organizationId, problem, context, options } = req.body;
    
    if (!sessionId || !userId || !organizationId || !problem) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: sessionId, userId, organizationId, problem',
      });
    }

    const request = {
      sessionId,
      userId,
      organizationId,
      featureType: 'reasoning' as const,
      input: {
        text: problem,
        context,
      },
      options,
    };

    const result = await advancedAIFeaturesService.processAdvancedFeature(request);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error processing reasoning request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process reasoning request',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /v1/advanced-ai-features/code-generation:
 *   post:
 *     summary: Process code generation request
 *     description: Simplified endpoint for AI code generation
 *     tags: [Advanced AI Features]
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
 *               language:
 *                 type: string
 *               context:
 *                 type: object
 *               options:
 *                 type: object
 *     responses:
 *       200:
 *         description: Code generation request processed successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/code-generation', authMiddleware, async (req, res) => {
  try {
    const { sessionId, userId, organizationId, prompt, language, context, options } = req.body;
    
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
      featureType: 'code-generation' as const,
      input: {
        text: prompt,
        data: { language },
        context,
      },
      options,
    };

    const result = await advancedAIFeaturesService.processAdvancedFeature(request);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error processing code generation request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process code generation request',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /v1/advanced-ai-features/document-analysis:
 *   post:
 *     summary: Process document analysis request
 *     description: Simplified endpoint for AI document analysis
 *     tags: [Advanced AI Features]
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
 *               - documents
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
 *               documents:
 *                 type: array
 *                 items:
 *                   type: string
 *               context:
 *                 type: object
 *               options:
 *                 type: object
 *     responses:
 *       200:
 *         description: Document analysis request processed successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/document-analysis', authMiddleware, async (req, res) => {
  try {
    const { sessionId, userId, organizationId, documents, context, options } = req.body;
    
    if (!sessionId || !userId || !organizationId || !documents) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: sessionId, userId, organizationId, documents',
      });
    }

    const request = {
      sessionId,
      userId,
      organizationId,
      featureType: 'document-analysis' as const,
      input: {
        documents,
        context,
      },
      options,
    };

    const result = await advancedAIFeaturesService.processAdvancedFeature(request);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error processing document analysis request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process document analysis request',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /v1/advanced-ai-features/voice-processing:
 *   post:
 *     summary: Process voice processing request
 *     description: Simplified endpoint for AI voice processing
 *     tags: [Advanced AI Features]
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
 *               - audio
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
 *               audio:
 *                 type: string
 *               context:
 *                 type: object
 *               options:
 *                 type: object
 *     responses:
 *       200:
 *         description: Voice processing request processed successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/voice-processing', authMiddleware, async (req, res) => {
  try {
    const { sessionId, userId, organizationId, audio, context, options } = req.body;
    
    if (!sessionId || !userId || !organizationId || !audio) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: sessionId, userId, organizationId, audio',
      });
    }

    const request = {
      sessionId,
      userId,
      organizationId,
      featureType: 'voice-processing' as const,
      input: {
        audio,
        context,
      },
      options,
    };

    const result = await advancedAIFeaturesService.processAdvancedFeature(request);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error processing voice processing request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process voice processing request',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /v1/advanced-ai-features/image-analysis:
 *   post:
 *     summary: Process image analysis request
 *     description: Simplified endpoint for AI image analysis
 *     tags: [Advanced AI Features]
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
 *               - images
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
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               context:
 *                 type: object
 *               options:
 *                 type: object
 *     responses:
 *       200:
 *         description: Image analysis request processed successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/image-analysis', authMiddleware, async (req, res) => {
  try {
    const { sessionId, userId, organizationId, images, context, options } = req.body;
    
    if (!sessionId || !userId || !organizationId || !images) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: sessionId, userId, organizationId, images',
      });
    }

    const request = {
      sessionId,
      userId,
      organizationId,
      featureType: 'image-analysis' as const,
      input: {
        images,
        context,
      },
      options,
    };

    const result = await advancedAIFeaturesService.processAdvancedFeature(request);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error processing image analysis request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process image analysis request',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /v1/advanced-ai-features/nlp-advanced:
 *   post:
 *     summary: Process advanced NLP request
 *     description: Simplified endpoint for advanced NLP processing
 *     tags: [Advanced AI Features]
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
 *               - text
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
 *               text:
 *                 type: string
 *               context:
 *                 type: object
 *               options:
 *                 type: object
 *     responses:
 *       200:
 *         description: Advanced NLP request processed successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/nlp-advanced', authMiddleware, async (req, res) => {
  try {
    const { sessionId, userId, organizationId, text, context, options } = req.body;
    
    if (!sessionId || !userId || !organizationId || !text) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: sessionId, userId, organizationId, text',
      });
    }

    const request = {
      sessionId,
      userId,
      organizationId,
      featureType: 'nlp-advanced' as const,
      input: {
        text,
        context,
      },
      options,
    };

    const result = await advancedAIFeaturesService.processAdvancedFeature(request);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error processing advanced NLP request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process advanced NLP request',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /v1/advanced-ai-features/automation:
 *   post:
 *     summary: Process automation request
 *     description: Simplified endpoint for AI automation processing
 *     tags: [Advanced AI Features]
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
 *         description: Automation request processed successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/automation', authMiddleware, async (req, res) => {
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
      featureType: 'automation' as const,
      input: {
        data,
        context,
      },
      options,
    };

    const result = await advancedAIFeaturesService.processAdvancedFeature(request);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error processing automation request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process automation request',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /v1/advanced-ai-features/health:
 *   get:
 *     summary: Get Advanced AI Features service health
 *     description: Get health status of the Advanced AI Features service
 *     tags: [Advanced AI Features]
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
    const healthStatus = await advancedAIFeaturesService.getHealthStatus();
    
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

export { router as advancedAIFeaturesRoutes };
