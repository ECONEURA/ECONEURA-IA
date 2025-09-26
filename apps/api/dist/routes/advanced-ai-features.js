import { Router } from 'express';
import { z } from 'zod';

import { advancedAIFeaturesService, AdvancedAIRequestSchema } from '../services/advanced-ai-features.service.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
const router = Router();
const processAdvancedFeatureSchema = AdvancedAIRequestSchema;
const getAdvancedInsightsSchema = z.object({
    organizationId: z.string().uuid(),
    limit: z.number().int().positive().max(100).optional(),
    type: z.string().optional(),
    impact: z.enum(['low', 'medium', 'high', 'critical']).optional(),
});
router.post('/process', authMiddleware, validate(processAdvancedFeatureSchema), async (req, res) => {
    try {
        const request = req.body;
        const result = await advancedAIFeaturesService.processAdvancedFeature(request);
        res.status(200).json(result);
    }
    catch (error) {
        console.error('Error processing Advanced AI feature:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process advanced AI feature',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
router.get('/models', authMiddleware, async (req, res) => {
    try {
        const models = await advancedAIFeaturesService.getAvailableAdvancedModels();
        res.status(200).json({
            success: true,
            data: models,
        });
    }
    catch (error) {
        console.error('Error getting available advanced AI models:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get available advanced AI models',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
router.get('/insights', authMiddleware, async (req, res) => {
    try {
        const { organizationId, limit = 20, type, impact } = req.query;
        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'organizationId is required',
            });
        }
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(organizationId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid organizationId format',
            });
        }
        const insights = await advancedAIFeaturesService.getAdvancedInsights(organizationId, parseInt(limit));
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
    }
    catch (error) {
        console.error('Error getting advanced AI insights:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get advanced AI insights',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
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
            featureType: 'multimodal',
            input: {
                text,
                images,
                context,
            },
            options,
        };
        const result = await advancedAIFeaturesService.processAdvancedFeature(request);
        res.status(200).json(result);
    }
    catch (error) {
        console.error('Error processing multimodal request:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process multimodal request',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
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
            featureType: 'reasoning',
            input: {
                text: problem,
                context,
            },
            options,
        };
        const result = await advancedAIFeaturesService.processAdvancedFeature(request);
        res.status(200).json(result);
    }
    catch (error) {
        console.error('Error processing reasoning request:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process reasoning request',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
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
            featureType: 'code-generation',
            input: {
                text: prompt,
                data: { language },
                context,
            },
            options,
        };
        const result = await advancedAIFeaturesService.processAdvancedFeature(request);
        res.status(200).json(result);
    }
    catch (error) {
        console.error('Error processing code generation request:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process code generation request',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
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
            featureType: 'document-analysis',
            input: {
                documents,
                context,
            },
            options,
        };
        const result = await advancedAIFeaturesService.processAdvancedFeature(request);
        res.status(200).json(result);
    }
    catch (error) {
        console.error('Error processing document analysis request:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process document analysis request',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
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
            featureType: 'voice-processing',
            input: {
                audio,
                context,
            },
            options,
        };
        const result = await advancedAIFeaturesService.processAdvancedFeature(request);
        res.status(200).json(result);
    }
    catch (error) {
        console.error('Error processing voice processing request:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process voice processing request',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
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
            featureType: 'image-analysis',
            input: {
                images,
                context,
            },
            options,
        };
        const result = await advancedAIFeaturesService.processAdvancedFeature(request);
        res.status(200).json(result);
    }
    catch (error) {
        console.error('Error processing image analysis request:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process image analysis request',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
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
            featureType: 'nlp-advanced',
            input: {
                text,
                context,
            },
            options,
        };
        const result = await advancedAIFeaturesService.processAdvancedFeature(request);
        res.status(200).json(result);
    }
    catch (error) {
        console.error('Error processing advanced NLP request:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process advanced NLP request',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
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
            featureType: 'automation',
            input: {
                data,
                context,
            },
            options,
        };
        const result = await advancedAIFeaturesService.processAdvancedFeature(request);
        res.status(200).json(result);
    }
    catch (error) {
        console.error('Error processing automation request:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process automation request',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
router.get('/health', async (req, res) => {
    try {
        const healthStatus = await advancedAIFeaturesService.getHealthStatus();
        res.status(200).json({
            success: true,
            data: healthStatus,
        });
    }
    catch (error) {
        console.error('Error getting health status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get health status',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
export { router as advancedAIFeaturesRoutes };
//# sourceMappingURL=advanced-ai-features.js.map