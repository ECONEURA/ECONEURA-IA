import { Router } from 'express';
import { z } from 'zod';
import { blueGreenDeploymentService } from '../lib/blue-green-deployment.service.js';
import { structuredLogger } from '../lib/structured-logger.js';
const blueGreenDeploymentRouter = Router();
const CreateGateSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    type: z.enum(['health_check', 'performance_test', 'security_scan', 'smoke_test', 'integration_test', 'load_test', 'custom']),
    priority: z.coerce.number().int().min(1).max(10),
    timeout: z.coerce.number().int().positive(),
    maxRetries: z.coerce.number().int().min(0).max(5).default(3),
    configuration: z.object({
        endpoint: z.string().optional(),
        expectedResponse: z.any().optional(),
        threshold: z.coerce.number().optional(),
        script: z.string().optional(),
        parameters: z.record(z.any()).optional()
    })
});
const CreatePipelineSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    sourceEnvironment: z.enum(['blue', 'green']),
    targetEnvironment: z.enum(['blue', 'green']),
    version: z.string().min(1),
    buildId: z.string().min(1),
    triggeredBy: z.object({
        userId: z.string().min(1),
        trigger: z.enum(['manual', 'webhook', 'schedule', 'api']),
        commitHash: z.string().optional(),
        branch: z.string().optional()
    }),
    configuration: z.object({
        autoRollback: z.boolean().default(true),
        rollbackThreshold: z.coerce.number().int().min(1).max(100).default(5),
        canaryPercentage: z.coerce.number().int().min(0).max(100).default(10),
        maxDeploymentTime: z.coerce.number().int().positive().default(60),
        notificationChannels: z.array(z.string()).default([])
    })
});
const TriggerRollbackSchema = z.object({
    pipelineId: z.string().min(1),
    reason: z.enum(['manual', 'automatic', 'gate_failure', 'performance_degradation', 'error_rate_threshold']),
    triggeredBy: z.string().min(1)
});
const GetGatesSchema = z.object({
    type: z.string().optional(),
    status: z.string().optional(),
    priority: z.coerce.number().int().min(1).max(10).optional(),
    limit: z.coerce.number().int().positive().max(100).default(50).optional(),
});
const GetPipelinesSchema = z.object({
    status: z.string().optional(),
    environment: z.enum(['blue', 'green']).optional(),
    limit: z.coerce.number().int().positive().max(100).default(50).optional(),
});
blueGreenDeploymentRouter.get('/environments', async (req, res) => {
    try {
        const environments = await blueGreenDeploymentService.getEnvironments();
        res.json({
            success: true,
            data: {
                environments,
                total: environments.length
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error getting environments', { error });
        res.status(500).json({
            success: false,
            error: 'Failed to get environments'
        });
    }
});
blueGreenDeploymentRouter.get('/environments/:environmentId', async (req, res) => {
    try {
        const { environmentId } = z.object({ environmentId: z.string().min(1) }).parse(req.params);
        const environment = await blueGreenDeploymentService.getEnvironment(environmentId);
        if (!environment) {
            return res.status(404).json({
                success: false,
                error: 'Environment not found'
            });
        }
        res.json({
            success: true,
            data: environment,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error getting environment', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
blueGreenDeploymentRouter.put('/environments/:environmentId/metrics', async (req, res) => {
    try {
        const { environmentId } = z.object({ environmentId: z.string().min(1) }).parse(req.params);
        const metrics = z.object({
            responseTime: z.coerce.number().positive().optional(),
            errorRate: z.coerce.number().min(0).max(1).optional(),
            throughput: z.coerce.number().positive().optional(),
            cpuUsage: z.coerce.number().min(0).max(100).optional(),
            memoryUsage: z.coerce.number().min(0).max(100).optional(),
            diskUsage: z.coerce.number().min(0).max(100).optional()
        }).parse(req.body);
        const environment = await blueGreenDeploymentService.updateEnvironmentMetrics(environmentId, metrics);
        if (!environment) {
            return res.status(404).json({
                success: false,
                error: 'Environment not found'
            });
        }
        res.json({
            success: true,
            data: environment,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error updating environment metrics', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
blueGreenDeploymentRouter.get('/gates', async (req, res) => {
    try {
        const filters = GetGatesSchema.parse(req.query);
        const gates = await blueGreenDeploymentService.getGates(filters);
        res.json({
            success: true,
            data: {
                gates,
                total: gates.length,
                filters
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error getting gates', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
blueGreenDeploymentRouter.post('/gates', async (req, res) => {
    try {
        const gateData = CreateGateSchema.parse(req.body);
        const gate = await blueGreenDeploymentService.createGate(gateData);
        res.status(201).json({
            success: true,
            data: gate,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error creating gate', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
blueGreenDeploymentRouter.post('/gates/:gateId/execute', async (req, res) => {
    try {
        const { gateId } = z.object({ gateId: z.string().min(1) }).parse(req.params);
        const gate = await blueGreenDeploymentService.executeGate(gateId);
        res.json({
            success: true,
            data: gate,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error executing gate', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
blueGreenDeploymentRouter.get('/pipelines', async (req, res) => {
    try {
        const filters = GetPipelinesSchema.parse(req.query);
        const pipelines = await blueGreenDeploymentService.getPipelines(filters);
        res.json({
            success: true,
            data: {
                pipelines,
                total: pipelines.length,
                filters
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error getting pipelines', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
blueGreenDeploymentRouter.post('/pipelines', async (req, res) => {
    try {
        const pipelineData = CreatePipelineSchema.parse(req.body);
        const pipeline = await blueGreenDeploymentService.createPipeline(pipelineData);
        res.status(201).json({
            success: true,
            data: pipeline,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error creating pipeline', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
blueGreenDeploymentRouter.post('/pipelines/:pipelineId/execute', async (req, res) => {
    try {
        const { pipelineId } = z.object({ pipelineId: z.string().min(1) }).parse(req.params);
        const pipeline = await blueGreenDeploymentService.executePipeline(pipelineId);
        res.json({
            success: true,
            data: pipeline,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error executing pipeline', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
blueGreenDeploymentRouter.post('/rollback', async (req, res) => {
    try {
        const { pipelineId, reason, triggeredBy } = TriggerRollbackSchema.parse(req.body);
        const rollback = await blueGreenDeploymentService.triggerRollback(pipelineId, reason, triggeredBy);
        res.status(201).json({
            success: true,
            data: rollback,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error triggering rollback', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
blueGreenDeploymentRouter.get('/stats', async (req, res) => {
    try {
        const stats = await blueGreenDeploymentService.getDeploymentStats();
        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error getting deployment stats', { error });
        res.status(500).json({
            success: false,
            error: 'Failed to get deployment statistics'
        });
    }
});
blueGreenDeploymentRouter.get('/health', async (req, res) => {
    try {
        const stats = await blueGreenDeploymentService.getDeploymentStats();
        res.json({
            success: true,
            data: {
                status: 'ok',
                totalPipelines: stats.totalPipelines,
                totalGates: stats.totalGates,
                totalRollbacks: stats.totalRollbacks,
                activeEnvironments: stats.activeEnvironments,
                pipelineStats: {
                    completed: stats.pipelineStats.completed,
                    failed: stats.pipelineStats.failed,
                    running: stats.pipelineStats.running
                },
                gateStats: {
                    passed: stats.gateStats.passed,
                    failed: stats.gateStats.failed,
                    running: stats.gateStats.running
                },
                last24Hours: {
                    deployments: stats.last24Hours.deployments,
                    rollbacks: stats.last24Hours.rollbacks
                },
                lastUpdated: new Date().toISOString()
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error checking deployment health', { error });
        res.status(500).json({
            success: false,
            error: 'Health check failed'
        });
    }
});
export { blueGreenDeploymentRouter };
//# sourceMappingURL=blue-green-deployment.js.map