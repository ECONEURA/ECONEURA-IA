import { Router } from 'express';
import { nextAIPlatformService, NextAIRequestSchema } from '../services/next-ai-platform.service.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { z } from 'zod';
const router = Router();
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
router.post('/process', authMiddleware, validate(processRequestSchema), async (req, res) => {
    try {
        const request = req.body;
        const result = await nextAIPlatformService.processRequest(request);
        res.status(200).json(result);
    }
    catch (error) {
        console.error('Error processing Next AI request:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process request',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
router.get('/models', authMiddleware, async (req, res) => {
    try {
        const models = await nextAIPlatformService.getAvailableModels();
        res.status(200).json({
            success: true,
            data: models,
        });
    }
    catch (error) {
        console.error('Error getting available models:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get available models',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
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
    }
    catch (error) {
        console.error('Error getting session history:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get session history',
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
        const insights = await nextAIPlatformService.getInsights(organizationId, parseInt(limit));
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
        console.error('Error getting insights:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get insights',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
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
            requestType: 'chat',
            input: {
                text: message,
                context,
            },
            options,
        };
        const result = await nextAIPlatformService.processRequest(request);
        res.status(200).json(result);
    }
    catch (error) {
        console.error('Error processing chat request:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process chat request',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
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
            requestType: 'analysis',
            input: {
                data,
                context,
            },
            options,
        };
        const result = await nextAIPlatformService.processRequest(request);
        res.status(200).json(result);
    }
    catch (error) {
        console.error('Error processing analysis request:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process analysis request',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
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
            requestType: 'prediction',
            input: {
                data,
                context,
            },
            options,
        };
        const result = await nextAIPlatformService.processRequest(request);
        res.status(200).json(result);
    }
    catch (error) {
        console.error('Error processing prediction request:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process prediction request',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
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
            requestType: 'generation',
            input: {
                text: prompt,
                context,
            },
            options,
        };
        const result = await nextAIPlatformService.processRequest(request);
        res.status(200).json(result);
    }
    catch (error) {
        console.error('Error processing generation request:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process generation request',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
router.get('/health', async (req, res) => {
    try {
        const healthStatus = await nextAIPlatformService.getHealthStatus();
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
export { router as nextAIPlatformRoutes };
//# sourceMappingURL=next-ai-platform.js.map