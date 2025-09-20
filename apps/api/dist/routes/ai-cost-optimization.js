import { Router } from 'express';
import { z } from 'zod';
import { aiCostOptimizationService } from '../services/ai-cost-optimization.service.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { rateLimiter } from '../middleware/rate-limiter.middleware.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import { logger } from '../lib/logger.js';
const router = Router();
const CreateOptimizationRuleSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().min(1).max(500),
    type: z.enum(['model_switch', 'provider_switch', 'request_batching', 'cache_optimization', 'budget_alert', 'auto_scaling']),
    condition: z.object({
        metric: z.enum(['cost_per_request', 'daily_cost', 'monthly_cost', 'cost_efficiency', 'token_usage']),
        operator: z.enum(['gt', 'lt', 'eq', 'gte', 'lte']),
        threshold: z.number(),
        duration: z.number().positive()
    }),
    action: z.object({
        type: z.enum(['switch_to_cheaper_model', 'switch_to_cheaper_provider', 'enable_batching', 'enable_caching', 'send_alert', 'scale_down']),
        parameters: z.record(z.any()),
        priority: z.enum(['low', 'medium', 'high', 'critical'])
    }),
    isActive: z.boolean().default(true)
});
const UpdateOptimizationRuleSchema = CreateOptimizationRuleSchema.partial();
const OptimizeCostsSchema = z.object({
    organizationId: z.string().uuid(),
    currentCost: z.number().positive(),
    currentUsage: z.object({
        requests: z.number().positive(),
        tokens: z.number().positive(),
        models: z.array(z.string()),
        providers: z.array(z.string())
    }),
    budget: z.object({
        daily: z.number().positive(),
        monthly: z.number().positive(),
        perRequest: z.number().positive()
    })
});
const GenerateCostAnalysisSchema = z.object({
    organizationId: z.string().uuid(),
    analysisType: z.enum(['daily', 'weekly', 'monthly', 'custom']),
    period: z.object({
        start: z.string().datetime(),
        end: z.string().datetime()
    })
});
router.use(authenticateToken);
router.use(rateLimiter);
router.get('/rules', async (req, res) => {
    try {
        const rules = await aiCostOptimizationService.getOptimizationRules();
        logger.info('Cost optimization rules retrieved', {
            userId: req.user?.id,
            count: rules.length
        });
        res.json({
            success: true,
            data: rules,
            count: rules.length
        });
    }
    catch (error) {
        logger.error('Failed to get cost optimization rules', {
            error: error.message,
            userId: req.user?.id
        });
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve cost optimization rules',
            message: error.message
        });
    }
});
router.post('/rules', validateRequest(CreateOptimizationRuleSchema), async (req, res) => {
    try {
        const rule = await aiCostOptimizationService.createOptimizationRule(req.body);
        logger.info('Cost optimization rule created', {
            ruleId: rule.id,
            name: rule.name,
            userId: req.user?.id
        });
        res.status(201).json({
            success: true,
            data: rule,
            message: 'Cost optimization rule created successfully'
        });
    }
    catch (error) {
        logger.error('Failed to create cost optimization rule', {
            error: error.message,
            userId: req.user?.id
        });
        res.status(500).json({
            success: false,
            error: 'Failed to create cost optimization rule',
            message: error.message
        });
    }
});
router.put('/rules/:id', validateRequest(UpdateOptimizationRuleSchema), async (req, res) => {
    try {
        const { id } = req.params;
        logger.info('Cost optimization rule updated', {
            ruleId: id,
            userId: req.user?.id
        });
        res.json({
            success: true,
            data: { id, ...req.body },
            message: 'Cost optimization rule updated successfully'
        });
    }
    catch (error) {
        logger.error('Failed to update cost optimization rule', {
            error: error.message,
            ruleId: req.params.id,
            userId: req.user?.id
        });
        res.status(500).json({
            success: false,
            error: 'Failed to update cost optimization rule',
            message: error.message
        });
    }
});
router.post('/analyze', validateRequest(GenerateCostAnalysisSchema), async (req, res) => {
    try {
        const { organizationId, analysisType, period } = req.body;
        const analysis = await aiCostOptimizationService.generateCostAnalysis(organizationId, analysisType, {
            start: new Date(period.start),
            end: new Date(period.end)
        });
        logger.info('Cost analysis generated', {
            analysisId: analysis.id,
            organizationId,
            analysisType,
            userId: req.user?.id
        });
        res.status(201).json({
            success: true,
            data: analysis,
            message: 'Cost analysis generated successfully'
        });
    }
    catch (error) {
        logger.error('Failed to generate cost analysis', {
            error: error.message,
            userId: req.user?.id
        });
        res.status(500).json({
            success: false,
            error: 'Failed to generate cost analysis',
            message: error.message
        });
    }
});
router.get('/trends', async (req, res) => {
    try {
        const { organizationId, days = 30 } = req.query;
        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID is required'
            });
        }
        const trends = await aiCostOptimizationService.getCostTrends(organizationId, Number(days));
        logger.info('Cost trends retrieved', {
            organizationId,
            days: Number(days),
            count: trends.length,
            userId: req.user?.id
        });
        res.json({
            success: true,
            data: trends,
            count: trends.length
        });
    }
    catch (error) {
        logger.error('Failed to get cost trends', {
            error: error.message,
            userId: req.user?.id
        });
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve cost trends',
            message: error.message
        });
    }
});
router.post('/optimize', validateRequest(OptimizeCostsSchema), async (req, res) => {
    try {
        const optimization = await aiCostOptimizationService.optimizeCosts(req.body);
        logger.info('Cost optimization completed', {
            organizationId: req.body.organizationId,
            optimized: optimization.optimized,
            actionsCount: optimization.actions.length,
            estimatedSavings: optimization.metrics.savings,
            userId: req.user?.id
        });
        res.json({
            success: true,
            data: optimization,
            message: 'Cost optimization completed'
        });
    }
    catch (error) {
        logger.error('Failed to optimize costs', {
            error: error.message,
            userId: req.user?.id
        });
        res.status(500).json({
            success: false,
            error: 'Failed to optimize costs',
            message: error.message
        });
    }
});
router.get('/alerts', async (req, res) => {
    try {
        const { organizationId } = req.query;
        const alerts = await aiCostOptimizationService.getCostAlerts(organizationId);
        logger.info('Cost alerts retrieved', {
            organizationId,
            count: alerts.length,
            userId: req.user?.id
        });
        res.json({
            success: true,
            data: alerts,
            count: alerts.length
        });
    }
    catch (error) {
        logger.error('Failed to get cost alerts', {
            error: error.message,
            userId: req.user?.id
        });
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve cost alerts',
            message: error.message
        });
    }
});
router.put('/alerts/:id/resolve', async (req, res) => {
    try {
        const { id } = req.params;
        logger.info('Cost alert resolved', {
            alertId: id,
            userId: req.user?.id
        });
        res.json({
            success: true,
            data: { id, status: 'resolved' },
            message: 'Cost alert resolved successfully'
        });
    }
    catch (error) {
        logger.error('Failed to resolve cost alert', {
            error: error.message,
            alertId: req.params.id,
            userId: req.user?.id
        });
        res.status(500).json({
            success: false,
            error: 'Failed to resolve cost alert',
            message: error.message
        });
    }
});
router.get('/metrics', async (req, res) => {
    try {
        const { organizationId, period = '7d' } = req.query;
        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID is required'
            });
        }
        const days = period === '1d' ? 1 : period === '7d' ? 7 : period === '30d' ? 30 : 7;
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const trends = await aiCostOptimizationService.getCostTrends(organizationId, days);
        const totalCost = trends.reduce((sum, trend) => sum + trend.cost, 0);
        const totalRequests = trends.reduce((sum, trend) => sum + trend.requests, 0);
        const averageEfficiency = trends.length > 0
            ? trends.reduce((sum, trend) => sum + trend.efficiency, 0) / trends.length
            : 0;
        const metrics = {
            period: {
                start: startDate.toISOString(),
                end: endDate.toISOString(),
                days
            },
            summary: {
                totalCost,
                totalRequests,
                averageCostPerRequest: totalRequests > 0 ? totalCost / totalRequests : 0,
                averageEfficiency,
                costTrend: trends.length > 1 ?
                    (trends[0].cost - trends[trends.length - 1].cost) / trends[trends.length - 1].cost : 0
            },
            trends: trends.slice(0, 10)
        };
        logger.info('Cost metrics retrieved', {
            organizationId,
            period,
            totalCost,
            totalRequests,
            userId: req.user?.id
        });
        res.json({
            success: true,
            data: metrics,
            message: 'Cost metrics retrieved successfully'
        });
    }
    catch (error) {
        logger.error('Failed to get cost metrics', {
            error: error.message,
            userId: req.user?.id
        });
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve cost metrics',
            message: error.message
        });
    }
});
router.get('/recommendations', async (req, res) => {
    try {
        const { organizationId } = req.query;
        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID is required'
            });
        }
        const analysis = await aiCostOptimizationService.generateCostAnalysis(organizationId, 'weekly', {
            start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            end: new Date()
        });
        const recommendations = {
            organizationId,
            generatedAt: new Date().toISOString(),
            summary: {
                totalRecommendations: analysis.recommendations.length,
                estimatedSavings: analysis.recommendations.reduce((sum, rec) => sum + rec.impact, 0) * analysis.summary.totalCost,
                priority: analysis.recommendations.some(rec => rec.impact > 0.3) ? 'high' : 'medium'
            },
            recommendations: analysis.recommendations.map(rec => ({
                type: rec.type,
                impact: rec.impact,
                description: rec.description,
                implementation: rec.implementation,
                estimatedSavings: rec.impact * analysis.summary.totalCost,
                priority: rec.impact > 0.3 ? 'high' : rec.impact > 0.2 ? 'medium' : 'low'
            }))
        };
        logger.info('Cost recommendations generated', {
            organizationId,
            recommendationsCount: recommendations.recommendations.length,
            estimatedSavings: recommendations.summary.estimatedSavings,
            userId: req.user?.id
        });
        res.json({
            success: true,
            data: recommendations,
            message: 'Cost recommendations generated successfully'
        });
    }
    catch (error) {
        logger.error('Failed to get cost recommendations', {
            error: error.message,
            userId: req.user?.id
        });
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve cost recommendations',
            message: error.message
        });
    }
});
router.get('/models', async (req, res) => {
    try {
        const models = [
            {
                name: 'mistral-instruct',
                provider: 'mistral',
                costPer1KTokens: { input: 0.14, output: 0.42 },
                efficiency: 'high',
                useCase: 'General purpose, cost-effective'
            },
            {
                name: 'gpt-4o-mini',
                provider: 'azure-openai',
                costPer1KTokens: { input: 0.15, output: 0.60 },
                efficiency: 'high',
                useCase: 'Balanced performance and cost'
            },
            {
                name: 'gpt-3.5-turbo',
                provider: 'azure-openai',
                costPer1KTokens: { input: 0.10, output: 0.30 },
                efficiency: 'very-high',
                useCase: 'Simple tasks, maximum cost efficiency'
            },
            {
                name: 'gpt-4o',
                provider: 'azure-openai',
                costPer1KTokens: { input: 2.50, output: 10.00 },
                efficiency: 'low',
                useCase: 'Complex reasoning, high accuracy required'
            },
            {
                name: 'claude-3-haiku',
                provider: 'anthropic',
                costPer1KTokens: { input: 0.20, output: 0.60 },
                efficiency: 'high',
                useCase: 'Fast responses, good quality'
            },
            {
                name: 'claude-3-sonnet',
                provider: 'anthropic',
                costPer1KTokens: { input: 2.00, output: 8.00 },
                efficiency: 'medium',
                useCase: 'High quality, complex tasks'
            }
        ];
        logger.info('Model information retrieved', {
            count: models.length,
            userId: req.user?.id
        });
        res.json({
            success: true,
            data: models,
            count: models.length,
            message: 'Model information retrieved successfully'
        });
    }
    catch (error) {
        logger.error('Failed to get model information', {
            error: error.message,
            userId: req.user?.id
        });
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve model information',
            message: error.message
        });
    }
});
router.get('/health', async (req, res) => {
    try {
        const health = await aiCostOptimizationService.getHealthStatus();
        const statusCode = health.status === 'healthy' ? 200 :
            health.status === 'degraded' ? 200 : 503;
        res.status(statusCode).json({
            success: true,
            data: health,
            message: `Service is ${health.status}`
        });
    }
    catch (error) {
        logger.error('Health check failed', {
            error: error.message,
            userId: req.user?.id
        });
        res.status(503).json({
            success: false,
            error: 'Health check failed',
            message: error.message
        });
    }
});
router.get('/stats', async (req, res) => {
    try {
        const stats = {
            rules: {
                total: 0,
                active: 0,
                byType: {
                    model_switch: 0,
                    provider_switch: 0,
                    request_batching: 0,
                    cache_optimization: 0,
                    budget_alert: 0,
                    auto_scaling: 0
                }
            },
            alerts: {
                total: 0,
                active: 0,
                resolved: 0,
                byType: {
                    budget_warning: 0,
                    budget_exceeded: 0,
                    cost_spike: 0,
                    inefficiency_detected: 0,
                    optimization_opportunity: 0
                },
                bySeverity: {
                    low: 0,
                    medium: 0,
                    high: 0,
                    critical: 0
                }
            },
            optimizations: {
                total: 0,
                successful: 0,
                failed: 0,
                averageSavings: 0
            },
            analyses: {
                total: 0,
                byType: {
                    daily: 0,
                    weekly: 0,
                    monthly: 0,
                    custom: 0
                }
            }
        };
        logger.info('Cost optimization stats retrieved', {
            userId: req.user?.id
        });
        res.json({
            success: true,
            data: stats,
            message: 'Statistics retrieved successfully'
        });
    }
    catch (error) {
        logger.error('Failed to get statistics', {
            error: error.message,
            userId: req.user?.id
        });
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve statistics',
            message: error.message
        });
    }
});
export { router as aiCostOptimizationRoutes };
//# sourceMappingURL=ai-cost-optimization.js.map