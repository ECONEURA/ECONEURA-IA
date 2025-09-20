import { Router } from 'express';
import { z } from 'zod';
import { logger } from '../lib/logger.js';
import { advancedDeploymentAutomationService } from '../lib/advanced-deployment-automation.service.js';
const router = Router();
const createStrategySchema = z.object({
    name: z.string().min(1),
    type: z.enum(['blue-green', 'canary', 'rolling', 'recreate', 'ramped']),
    description: z.string().min(1),
    config: z.object({
        maxUnavailable: z.number().optional(),
        maxSurge: z.number().optional(),
        canaryPercentage: z.number().min(0).max(100).optional(),
        rampUpSteps: z.number().optional(),
        stepDuration: z.number().optional(),
        healthCheckPath: z.string().optional(),
        healthCheckTimeout: z.number().optional(),
        rollbackThreshold: z.number().optional()
    }),
    isActive: z.boolean()
});
const createEnvironmentSchema = z.object({
    name: z.string().min(1),
    type: z.enum(['development', 'staging', 'production', 'preview']),
    description: z.string().min(1),
    config: z.object({
        resourceGroup: z.string().min(1),
        subscriptionId: z.string().min(1),
        location: z.string().min(1),
        domainName: z.string().optional(),
        sslEnabled: z.boolean(),
        autoScaling: z.boolean(),
        minInstances: z.number().min(1),
        maxInstances: z.number().min(1),
        cpuThreshold: z.number().min(0).max(100),
        memoryThreshold: z.number().min(0).max(100)
    }),
    secrets: z.object({
        keyVaultName: z.string().min(1),
        connectionStrings: z.record(z.string()),
        environmentVariables: z.record(z.string())
    }),
    isActive: z.boolean()
});
const createPipelineSchema = z.object({
    name: z.string().min(1),
    description: z.string().min(1),
    source: z.object({
        repository: z.string().min(1),
        branch: z.string().min(1),
        trigger: z.enum(['push', 'pull_request', 'schedule', 'manual']),
        paths: z.array(z.string()).optional()
    }),
    stages: z.array(z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        environment: z.string().min(1),
        strategy: z.string().min(1),
        dependencies: z.array(z.string()),
        conditions: z.object({
            branch: z.string().optional(),
            environment: z.string().optional(),
            approval: z.boolean().optional(),
            tests: z.array(z.string()).optional()
        }),
        steps: z.array(z.object({
            id: z.string().min(1),
            name: z.string().min(1),
            type: z.enum(['build', 'test', 'deploy', 'approval', 'notification']),
            config: z.record(z.any()),
            timeout: z.number().optional(),
            retryCount: z.number().optional()
        }))
    })),
    isActive: z.boolean()
});
const executeDeploymentSchema = z.object({
    pipelineId: z.string().min(1),
    environmentId: z.string().min(1),
    trigger: z.object({
        type: z.enum(['manual', 'automatic', 'scheduled']),
        triggeredBy: z.string().min(1),
        commitHash: z.string().optional(),
        pullRequestNumber: z.number().optional()
    })
});
const respondToApprovalSchema = z.object({
    status: z.enum(['approved', 'rejected']),
    comments: z.string().optional(),
    approver: z.string().optional()
});
router.post('/strategies', async (req, res) => {
    try {
        const validatedData = createStrategySchema.parse(req.body);
        const strategy = await advancedDeploymentAutomationService.createStrategy(validatedData);
        res.status(201).json({
            success: true,
            data: strategy
        });
    }
    catch (error) {
        logger.error('Error creating strategy:', error);
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Invalid strategy data'
        });
    }
});
router.get('/strategies', async (req, res) => {
    try {
        const strategies = await advancedDeploymentAutomationService.getStrategies();
        res.json({
            success: true,
            data: strategies,
            count: strategies.length
        });
    }
    catch (error) {
        logger.error('Error getting strategies:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve strategies'
        });
    }
});
router.put('/strategies/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const strategy = await advancedDeploymentAutomationService.updateStrategy(id, updates);
        if (!strategy) {
            return res.status(404).json({
                success: false,
                error: 'Strategy not found'
            });
        }
        res.json({
            success: true,
            data: strategy
        });
    }
    catch (error) {
        logger.error('Error updating strategy:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update strategy'
        });
    }
});
router.delete('/strategies/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await advancedDeploymentAutomationService.deleteStrategy(id);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: 'Strategy not found'
            });
        }
        res.json({
            success: true,
            message: 'Strategy deleted successfully'
        });
    }
    catch (error) {
        logger.error('Error deleting strategy:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete strategy'
        });
    }
});
router.post('/environments', async (req, res) => {
    try {
        const validatedData = createEnvironmentSchema.parse(req.body);
        const environment = await advancedDeploymentAutomationService.createEnvironment(validatedData);
        res.status(201).json({
            success: true,
            data: environment
        });
    }
    catch (error) {
        logger.error('Error creating environment:', error);
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Invalid environment data'
        });
    }
});
router.get('/environments', async (req, res) => {
    try {
        const environments = await advancedDeploymentAutomationService.getEnvironments();
        res.json({
            success: true,
            data: environments,
            count: environments.length
        });
    }
    catch (error) {
        logger.error('Error getting environments:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve environments'
        });
    }
});
router.put('/environments/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const environment = await advancedDeploymentAutomationService.updateEnvironment(id, updates);
        if (!environment) {
            return res.status(404).json({
                success: false,
                error: 'Environment not found'
            });
        }
        res.json({
            success: true,
            data: environment
        });
    }
    catch (error) {
        logger.error('Error updating environment:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update environment'
        });
    }
});
router.post('/pipelines', async (req, res) => {
    try {
        const validatedData = createPipelineSchema.parse(req.body);
        const pipeline = await advancedDeploymentAutomationService.createPipeline(validatedData);
        res.status(201).json({
            success: true,
            data: pipeline
        });
    }
    catch (error) {
        logger.error('Error creating pipeline:', error);
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Invalid pipeline data'
        });
    }
});
router.get('/pipelines', async (req, res) => {
    try {
        const pipelines = await advancedDeploymentAutomationService.getPipelines();
        res.json({
            success: true,
            data: pipelines,
            count: pipelines.length
        });
    }
    catch (error) {
        logger.error('Error getting pipelines:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve pipelines'
        });
    }
});
router.put('/pipelines/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const pipeline = await advancedDeploymentAutomationService.updatePipeline(id, updates);
        if (!pipeline) {
            return res.status(404).json({
                success: false,
                error: 'Pipeline not found'
            });
        }
        res.json({
            success: true,
            data: pipeline
        });
    }
    catch (error) {
        logger.error('Error updating pipeline:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update pipeline'
        });
    }
});
router.get('/jobs', async (req, res) => {
    try {
        const filters = {
            status: req.query.status,
            environmentId: req.query.environmentId,
            pipelineId: req.query.pipelineId,
            limit: req.query.limit ? parseInt(req.query.limit) : undefined
        };
        const jobs = await advancedDeploymentAutomationService.getJobs(filters);
        res.json({
            success: true,
            data: jobs,
            count: jobs.length
        });
    }
    catch (error) {
        logger.error('Error getting jobs:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve jobs'
        });
    }
});
router.get('/jobs/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const jobs = await advancedDeploymentAutomationService.getJobs({ limit: 1000 });
        const job = jobs.find(j => j.id === id);
        if (!job) {
            return res.status(404).json({
                success: false,
                error: 'Job not found'
            });
        }
        res.json({
            success: true,
            data: job
        });
    }
    catch (error) {
        logger.error('Error getting job:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve job'
        });
    }
});
router.put('/jobs/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, progress } = req.body;
        const job = await advancedDeploymentAutomationService.updateJobStatus(id, status, progress);
        if (!job) {
            return res.status(404).json({
                success: false,
                error: 'Job not found'
            });
        }
        res.json({
            success: true,
            data: job
        });
    }
    catch (error) {
        logger.error('Error updating job status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update job status'
        });
    }
});
router.post('/jobs/:id/logs', async (req, res) => {
    try {
        const { id } = req.params;
        const { step, level, message } = req.body;
        const success = await advancedDeploymentAutomationService.addJobLog(id, { step, level, message });
        if (!success) {
            return res.status(404).json({
                success: false,
                error: 'Job not found'
            });
        }
        res.json({
            success: true,
            message: 'Log added successfully'
        });
    }
    catch (error) {
        logger.error('Error adding job log:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add job log'
        });
    }
});
router.post('/deployments/execute', async (req, res) => {
    try {
        const validatedData = executeDeploymentSchema.parse(req.body);
        const job = await advancedDeploymentAutomationService.executeDeployment(validatedData.pipelineId, validatedData.environmentId, validatedData.trigger);
        res.status(201).json({
            success: true,
            data: job
        });
    }
    catch (error) {
        logger.error('Error executing deployment:', error);
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to execute deployment'
        });
    }
});
router.get('/approvals', async (req, res) => {
    try {
        const jobId = req.query.jobId;
        const approvals = await advancedDeploymentAutomationService.getApprovals(jobId);
        res.json({
            success: true,
            data: approvals,
            count: approvals.length
        });
    }
    catch (error) {
        logger.error('Error getting approvals:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve approvals'
        });
    }
});
router.put('/approvals/:id/respond', async (req, res) => {
    try {
        const { id } = req.params;
        const validatedData = respondToApprovalSchema.parse(req.body);
        const approval = await advancedDeploymentAutomationService.respondToApproval(id, validatedData.status, validatedData.comments, validatedData.approver);
        if (!approval) {
            return res.status(404).json({
                success: false,
                error: 'Approval not found'
            });
        }
        res.json({
            success: true,
            data: approval
        });
    }
    catch (error) {
        logger.error('Error responding to approval:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to respond to approval'
        });
    }
});
router.get('/notifications', async (req, res) => {
    try {
        const jobId = req.query.jobId;
        const notifications = await advancedDeploymentAutomationService.getNotifications(jobId);
        res.json({
            success: true,
            data: notifications,
            count: notifications.length
        });
    }
    catch (error) {
        logger.error('Error getting notifications:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve notifications'
        });
    }
});
router.put('/notifications/:id/sent', async (req, res) => {
    try {
        const { id } = req.params;
        const success = await advancedDeploymentAutomationService.markNotificationSent(id);
        if (!success) {
            return res.status(404).json({
                success: false,
                error: 'Notification not found'
            });
        }
        res.json({
            success: true,
            message: 'Notification marked as sent'
        });
    }
    catch (error) {
        logger.error('Error marking notification as sent:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to mark notification as sent'
        });
    }
});
router.get('/health-checks', async (req, res) => {
    try {
        const jobId = req.query.jobId;
        const healthChecks = await advancedDeploymentAutomationService.getHealthChecks(jobId);
        res.json({
            success: true,
            data: healthChecks,
            count: healthChecks.length
        });
    }
    catch (error) {
        logger.error('Error getting health checks:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve health checks'
        });
    }
});
router.put('/health-checks/:id/result', async (req, res) => {
    try {
        const { id } = req.params;
        const result = req.body;
        const success = await advancedDeploymentAutomationService.updateHealthCheckResult(id, result);
        if (!success) {
            return res.status(404).json({
                success: false,
                error: 'Health check not found'
            });
        }
        res.json({
            success: true,
            message: 'Health check result updated'
        });
    }
    catch (error) {
        logger.error('Error updating health check result:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update health check result'
        });
    }
});
router.get('/rollbacks', async (req, res) => {
    try {
        const jobId = req.query.jobId;
        const rollbacks = await advancedDeploymentAutomationService.getRollbacks(jobId);
        res.json({
            success: true,
            data: rollbacks,
            count: rollbacks.length
        });
    }
    catch (error) {
        logger.error('Error getting rollbacks:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve rollbacks'
        });
    }
});
router.put('/rollbacks/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, progress } = req.body;
        const rollback = await advancedDeploymentAutomationService.updateRollbackStatus(id, status, progress);
        if (!rollback) {
            return res.status(404).json({
                success: false,
                error: 'Rollback not found'
            });
        }
        res.json({
            success: true,
            data: rollback
        });
    }
    catch (error) {
        logger.error('Error updating rollback status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update rollback status'
        });
    }
});
router.get('/statistics', async (req, res) => {
    try {
        const statistics = await advancedDeploymentAutomationService.getStatistics();
        res.json({
            success: true,
            data: statistics
        });
    }
    catch (error) {
        logger.error('Error getting statistics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve statistics'
        });
    }
});
router.get('/health', async (req, res) => {
    try {
        const statistics = await advancedDeploymentAutomationService.getStatistics();
        res.json({
            success: true,
            status: 'healthy',
            timestamp: new Date().toISOString(),
            data: {
                totalStrategies: statistics.totalStrategies,
                totalEnvironments: statistics.totalEnvironments,
                totalPipelines: statistics.totalPipelines,
                activeJobs: statistics.activeJobs
            }
        });
    }
    catch (error) {
        logger.error('Error checking health:', error);
        res.status(500).json({
            success: false,
            status: 'unhealthy',
            error: 'Health check failed'
        });
    }
});
export default router;
//# sourceMappingURL=advanced-deployment-automation.js.map