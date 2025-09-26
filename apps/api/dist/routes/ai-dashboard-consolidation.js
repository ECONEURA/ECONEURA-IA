import { Router } from 'express';
import { z } from 'zod';

import { logger } from '../lib/logger.js';
import { authenticateToken } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rate-limiter.js';
import { aiDashboardConsolidationService } from '../services/ai-dashboard-consolidation.service.js';
const router = Router();
router.use(authenticateToken);
router.use(rateLimiter);
const DashboardMetricsSchema = z.object({
    department: z.enum(['ceo', 'ia', 'cso', 'cto', 'ciso', 'coo', 'chro', 'cgo', 'cfo', 'cdo']),
    timeframe: z.enum(['1h', '24h', '7d', '30d']).default('24h'),
    includePredictions: z.boolean().default(true),
    includeOptimizations: z.boolean().default(true),
    includeSecurity: z.boolean().default(true),
});
const RealTimeMetricsSchema = z.object({
    department: z.enum(['ceo', 'ia', 'cso', 'cto', 'ciso', 'coo', 'chro', 'cgo', 'cfo', 'cdo']),
    agentId: z.string().optional(),
});
const AgentStatusSchema = z.object({
    agentId: z.string(),
    department: z.enum(['ceo', 'ia', 'cso', 'cto', 'ciso', 'coo', 'chro', 'cgo', 'cfo', 'cdo']),
    status: z.enum(['active', 'paused', 'error', 'maintenance']),
    lastActivity: z.string().datetime(),
    metrics: z.object({
        tokens: z.number(),
        cost: z.number(),
        latency: z.number(),
        calls: z.number(),
    }),
});
router.get('/metrics', async (req, res) => {
    try {
        const validatedInput = DashboardMetricsSchema.parse({
            department: req.query.department,
            timeframe: req.query.timeframe || '24h',
            includePredictions: req.query.includePredictions === 'true',
            includeOptimizations: req.query.includeOptimizations === 'true',
            includeSecurity: req.query.includeSecurity === 'true',
        });
        logger.info('Getting dashboard metrics', {
            department: validatedInput.department,
            timeframe: validatedInput.timeframe,
            userId: req.user?.id,
        });
        const metrics = await aiDashboardConsolidationService.getDashboardMetrics(validatedInput);
        res.json({
            success: true,
            data: metrics,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        logger.error('Error getting dashboard metrics', { error, query: req.query });
        res.status(400).json({
            success: false,
            error: 'Invalid request parameters',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
router.get('/realtime', async (req, res) => {
    try {
        const validatedInput = RealTimeMetricsSchema.parse({
            department: req.query.department,
            agentId: req.query.agentId,
        });
        logger.info('Getting real-time metrics', {
            department: validatedInput.department,
            agentId: validatedInput.agentId,
            userId: req.user?.id,
        });
        const metrics = await aiDashboardConsolidationService.getRealTimeMetrics(validatedInput);
        res.json({
            success: true,
            data: metrics,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        logger.error('Error getting real-time metrics', { error, query: req.query });
        res.status(400).json({
            success: false,
            error: 'Invalid request parameters',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
router.post('/agent-status', async (req, res) => {
    try {
        const validatedInput = AgentStatusSchema.parse({
            ...req.body,
            lastActivity: new Date(req.body.lastActivity),
        });
        logger.info('Updating agent status', {
            agentId: validatedInput.agentId,
            department: validatedInput.department,
            status: validatedInput.status,
            userId: req.user?.id,
        });
        await aiDashboardConsolidationService.updateAgentStatus(validatedInput);
        res.json({
            success: true,
            message: 'Agent status updated successfully',
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        logger.error('Error updating agent status', { error, body: req.body });
        res.status(400).json({
            success: false,
            error: 'Invalid request body',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
router.get('/agents/:department', async (req, res) => {
    try {
        const department = req.params.department;
        if (!['ceo', 'ia', 'cso', 'cto', 'ciso', 'coo', 'chro', 'cgo', 'cfo', 'cdo'].includes(department)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid department',
            });
        }
        logger.info('Getting agents for department', {
            department,
            userId: req.user?.id,
        });
        const metrics = await aiDashboardConsolidationService.getRealTimeMetrics({
            department,
        });
        res.json({
            success: true,
            data: {
                department,
                agents: metrics.agents,
                totalAgents: metrics.agents.length,
                activeAgents: metrics.agents.filter(a => a.status === 'active').length,
            },
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        logger.error('Error getting agents', { error, department: req.params.department });
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
router.get('/kpis/:department', async (req, res) => {
    try {
        const department = req.params.department;
        if (!['ceo', 'ia', 'cso', 'cto', 'ciso', 'coo', 'chro', 'cgo', 'cfo', 'cdo'].includes(department)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid department',
            });
        }
        const timeframe = req.query.timeframe || '24h';
        logger.info('Getting KPIs for department', {
            department,
            timeframe,
            userId: req.user?.id,
        });
        const metrics = await aiDashboardConsolidationService.getDashboardMetrics({
            department,
            timeframe: timeframe,
            includePredictions: false,
            includeOptimizations: false,
            includeSecurity: false,
        });
        res.json({
            success: true,
            data: {
                department,
                timeframe,
                kpis: metrics.kpis,
                timestamp: metrics.timestamp,
            },
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        logger.error('Error getting KPIs', { error, department: req.params.department });
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
router.get('/timeline/:department', async (req, res) => {
    try {
        const department = req.params.department;
        if (!['ceo', 'ia', 'cso', 'cto', 'ciso', 'coo', 'chro', 'cgo', 'cfo', 'cdo'].includes(department)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid department',
            });
        }
        const timeframe = req.query.timeframe || '24h';
        logger.info('Getting timeline for department', {
            department,
            timeframe,
            userId: req.user?.id,
        });
        const metrics = await aiDashboardConsolidationService.getDashboardMetrics({
            department,
            timeframe: timeframe,
            includePredictions: false,
            includeOptimizations: false,
            includeSecurity: false,
        });
        res.json({
            success: true,
            data: {
                department,
                timeframe,
                timeline: metrics.timeline,
                totalEvents: metrics.timeline.length,
            },
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        logger.error('Error getting timeline', { error, department: req.params.department });
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
router.get('/health', async (req, res) => {
    try {
        const health = {
            status: 'healthy',
            service: 'ai-dashboard-consolidation',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            uptime: process.uptime(),
            memory: process.memoryUsage(),
        };
        logger.info('Health check requested', { userId: req.user?.id });
        res.json({
            success: true,
            data: health,
        });
    }
    catch (error) {
        logger.error('Error in health check', { error });
        res.status(500).json({
            success: false,
            error: 'Health check failed',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
export { router as aiDashboardConsolidationRoutes };
//# sourceMappingURL=ai-dashboard-consolidation.js.map