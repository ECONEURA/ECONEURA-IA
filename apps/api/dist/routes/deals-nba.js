import { Router } from 'express';
import { z } from 'zod';
import { dealsNBAService } from '../lib/deals-nba.service.js';
import { structuredLogger } from '../lib/structured-logger.js';
const router = Router();
const processNBARecommendationsSchema = z.object({
    organizationId: z.string().uuid(),
    dealIds: z.array(z.string().uuid()).optional(),
    confidenceThreshold: z.number().min(0).max(1).optional(),
    maxRecommendations: z.number().min(1).max(10).optional()
});
const executeRecommendationSchema = z.object({
    recommendationId: z.string(),
    executedBy: z.string(),
    notes: z.string().optional()
});
const updateConfigSchema = z.object({
    enabled: z.boolean().optional(),
    confidenceThreshold: z.number().min(0).max(1).optional(),
    maxRecommendations: z.number().min(1).max(10).optional(),
    expirationHours: z.number().min(1).max(168).optional(),
    factors: z.record(z.string(), z.number()).optional(),
    actions: z.record(z.string(), z.object({
        enabled: z.boolean(),
        weight: z.number().min(0).max(1)
    })).optional()
});
router.get('/stats', async (req, res) => {
    try {
        const stats = dealsNBAService.getStats();
        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get NBA stats', {
            error: error instanceof Error ? error.message : String(error),
            requestId: req.headers['x-request-id'] || ''
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get NBA stats',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});
router.post('/process', async (req, res) => {
    try {
        const validatedData = processNBARecommendationsSchema.parse(req.body);
        if (validatedData.confidenceThreshold !== undefined ||
            validatedData.maxRecommendations !== undefined) {
            dealsNBAService.updateConfig({
                confidenceThreshold: validatedData.confidenceThreshold,
                maxRecommendations: validatedData.maxRecommendations
            });
        }
        const stats = await dealsNBAService.processNBARecommendations();
        structuredLogger.info('NBA recommendations processing completed', {
            organizationId: validatedData.organizationId,
            recommendationsGenerated: stats.recommendationsGenerated,
            processingTime: stats.lastRun,
            requestId: req.headers['x-request-id'] || ''
        });
        res.json({
            success: true,
            data: stats,
            message: 'NBA recommendations processing completed successfully',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Failed to process NBA recommendations', {
            error: error instanceof Error ? error.message : String(error),
            requestId: req.headers['x-request-id'] || ''
        });
        res.status(500).json({
            success: false,
            error: 'Failed to process NBA recommendations',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});
router.get('/recommendations/:dealId', async (req, res) => {
    try {
        const { dealId } = req.params;
        if (!dealId) {
            return res.status(400).json({
                success: false,
                error: 'dealId is required'
            });
        }
        const recommendations = dealsNBAService.getRecommendations(dealId);
        res.json({
            success: true,
            data: {
                dealId,
                recommendations,
                count: recommendations.length
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get NBA recommendations', {
            dealId: req.params.dealId,
            error: error instanceof Error ? error.message : String(error),
            requestId: req.headers['x-request-id'] || ''
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get NBA recommendations',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});
router.post('/recommendations/:recommendationId/execute', async (req, res) => {
    try {
        const { recommendationId } = req.params;
        const validatedData = executeRecommendationSchema.parse({
            recommendationId,
            ...req.body
        });
        await dealsNBAService.executeRecommendation(validatedData.recommendationId, validatedData.executedBy);
        structuredLogger.info('NBA recommendation executed', {
            recommendationId: validatedData.recommendationId,
            executedBy: validatedData.executedBy,
            requestId: req.headers['x-request-id'] || ''
        });
        res.json({
            success: true,
            message: 'NBA recommendation executed successfully',
            data: {
                recommendationId: validatedData.recommendationId,
                executedBy: validatedData.executedBy,
                executedAt: new Date().toISOString(),
                notes: validatedData.notes
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Failed to execute NBA recommendation', {
            recommendationId: req.params.recommendationId,
            error: error instanceof Error ? error.message : String(error),
            requestId: req.headers['x-request-id'] || ''
        });
        res.status(500).json({
            success: false,
            error: 'Failed to execute NBA recommendation',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});
router.get('/recommendations', async (req, res) => {
    try {
        const { organizationId, limit = 100, offset = 0 } = req.query;
        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'organizationId is required'
            });
        }
        const recommendations = [];
        res.json({
            success: true,
            data: {
                recommendations,
                pagination: {
                    limit: Number(limit),
                    offset: Number(offset),
                    total: recommendations.length
                }
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get NBA recommendations', {
            error: error instanceof Error ? error.message : String(error),
            requestId: req.headers['x-request-id'] || ''
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get NBA recommendations',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});
router.get('/explanation/:recommendationId', async (req, res) => {
    try {
        const { recommendationId } = req.params;
        const explanation = null;
        if (!explanation) {
            return res.status(404).json({
                success: false,
                error: 'Recommendation explanation not found'
            });
        }
        res.json({
            success: true,
            data: explanation,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get NBA recommendation explanation', {
            recommendationId: req.params.recommendationId,
            error: error instanceof Error ? error.message : String(error),
            requestId: req.headers['x-request-id'] || ''
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get NBA recommendation explanation',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});
router.put('/config', async (req, res) => {
    try {
        const validatedData = updateConfigSchema.parse(req.body);
        dealsNBAService.updateConfig(validatedData);
        structuredLogger.info('NBA configuration updated', {
            config: validatedData,
            requestId: req.headers['x-request-id'] || ''
        });
        res.json({
            success: true,
            message: 'NBA configuration updated successfully',
            data: validatedData,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Failed to update NBA config', {
            error: error instanceof Error ? error.message : String(error),
            requestId: req.headers['x-request-id'] || ''
        });
        res.status(500).json({
            success: false,
            error: 'Failed to update NBA configuration',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});
router.get('/config', async (req, res) => {
    try {
        const config = {
            enabled: true,
            modelVersion: 'v1.0',
            confidenceThreshold: 0.7,
            maxRecommendations: 5,
            expirationHours: 24,
            factors: {
                dealValue: 0.15,
                stage: 0.20,
                timeInStage: 0.10,
                ownerExperience: 0.12,
                companySize: 0.08,
                industry: 0.10,
                seasonality: 0.05,
                competitorActivity: 0.08,
                lastActivity: 0.07,
                marketConditions: 0.05
            },
            actions: {
                call: { enabled: true, weight: 0.25 },
                email: { enabled: true, weight: 0.20 },
                meeting: { enabled: true, weight: 0.20 },
                proposal: { enabled: true, weight: 0.15 },
                follow_up: { enabled: true, weight: 0.10 },
                negotiation: { enabled: true, weight: 0.05 },
                close: { enabled: true, weight: 0.05 }
            }
        };
        res.json({
            success: true,
            data: config,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get NBA config', {
            error: error instanceof Error ? error.message : String(error),
            requestId: req.headers['x-request-id'] || ''
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get NBA configuration',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});
router.post('/analyze', async (req, res) => {
    try {
        const { deal } = req.body;
        if (!deal) {
            return res.status(400).json({
                success: false,
                error: 'Deal data is required'
            });
        }
        const analysis = {
            dealId: deal.id,
            recommendations: [],
            factors: [],
            confidence: 0.0,
            reasoning: 'Analysis not implemented in demo'
        };
        res.json({
            success: true,
            data: analysis,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Failed to analyze deal', {
            error: error instanceof Error ? error.message : String(error),
            requestId: req.headers['x-request-id'] || ''
        });
        res.status(500).json({
            success: false,
            error: 'Failed to analyze deal',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});
export default router;
//# sourceMappingURL=deals-nba.js.map