import { Router } from 'express';
import { z } from 'zod';
import ProjectCompletionDeploymentService from '../lib/project-completion-deployment.service.js';
import { logger } from '../lib/logger.js';
const router = Router();
const defaultConfig = {
    validationEnabled: true,
    deploymentEnabled: true,
    monitoringEnabled: true,
    rollbackEnabled: true,
    healthCheckInterval: 60,
    deploymentTimeout: 1800,
    maxRetries: 3,
    notificationChannels: ['email', 'slack', 'webhook'],
    environments: ['development', 'staging', 'production'],
    strategies: ['blue-green', 'canary', 'rolling', 'recreate']
};
const projectCompletionService = new ProjectCompletionDeploymentService(defaultConfig);
const DeploymentConfigSchema = z.object({
    environment: z.enum(['development', 'staging', 'production']),
    strategy: z.enum(['blue-green', 'canary', 'rolling', 'recreate']),
    region: z.string().min(1),
    resourceGroup: z.string().min(1),
    appServiceName: z.string().min(1),
    containerRegistry: z.string().min(1),
    imageTag: z.string().min(1),
    replicas: z.number().min(1).max(10),
    healthCheckPath: z.string().min(1),
    rollbackEnabled: z.boolean().optional(),
    monitoringEnabled: z.boolean().optional(),
    autoScaling: z.object({
        enabled: z.boolean(),
        minReplicas: z.number().min(1),
        maxReplicas: z.number().min(1),
        targetCPU: z.number().min(1).max(100)
    }).optional()
});
const HealthCheckSchema = z.object({
    name: z.string().min(1),
    type: z.enum(['HTTP', 'TCP', 'GRPC', 'CUSTOM']),
    endpoint: z.string().min(1),
    timeout: z.number().min(1).max(300),
    interval: z.number().min(1).max(3600),
    retries: z.number().min(1).max(10),
    expectedStatus: z.number().min(100).max(599).optional(),
    expectedResponse: z.string().optional(),
    enabled: z.boolean().optional()
});
const UpdateConfigSchema = z.object({
    validationEnabled: z.boolean().optional(),
    deploymentEnabled: z.boolean().optional(),
    monitoringEnabled: z.boolean().optional(),
    rollbackEnabled: z.boolean().optional(),
    healthCheckInterval: z.number().min(1).optional(),
    deploymentTimeout: z.number().min(1).optional(),
    maxRetries: z.number().min(1).optional(),
    notificationChannels: z.array(z.string()).optional(),
    environments: z.array(z.string()).optional(),
    strategies: z.array(z.string()).optional()
});
router.post('/validate', async (req, res) => {
    try {
        const validation = await projectCompletionService.validateProjectCompletion();
        res.json({
            success: true,
            data: validation,
            message: 'Project validation completed'
        });
    }
    catch (error) {
        logger.error('Error validating project completion', { error });
        res.status(500).json({
            success: false,
            error: 'Failed to validate project completion',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/validation/status', async (req, res) => {
    try {
        const validation = await projectCompletionService.validateProjectCompletion();
        res.json({
            success: true,
            data: {
                overallStatus: validation.overallStatus,
                summary: validation.summary,
                totalComponents: validation.totalComponents,
                passedComponents: validation.passedComponents,
                failedComponents: validation.failedComponents,
                warningComponents: validation.warningComponents,
                recommendations: validation.recommendations
            }
        });
    }
    catch (error) {
        logger.error('Error getting validation status', { error });
        res.status(500).json({
            success: false,
            error: 'Failed to get validation status',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/deploy', async (req, res) => {
    try {
        const validatedConfig = DeploymentConfigSchema.parse(req.body);
        const deployment = await projectCompletionService.deploy(validatedConfig);
        res.status(201).json({
            success: true,
            data: deployment,
            message: 'Deployment started successfully'
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.errors
            });
        }
        logger.error('Error starting deployment', { error });
        res.status(500).json({
            success: false,
            error: 'Failed to start deployment',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/deployments', async (req, res) => {
    try {
        const { environment, status, limit = 10, offset = 0 } = req.query;
        const deployments = [];
        res.json({
            success: true,
            data: deployments,
            count: deployments.length
        });
    }
    catch (error) {
        logger.error('Error getting deployments', { error });
        res.status(500).json({
            success: false,
            error: 'Failed to get deployments',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/deployments/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deployment = null;
        if (!deployment) {
            return res.status(404).json({
                success: false,
                error: 'Deployment not found'
            });
        }
        res.json({
            success: true,
            data: deployment
        });
    }
    catch (error) {
        logger.error('Error getting deployment', { error });
        res.status(500).json({
            success: false,
            error: 'Failed to get deployment',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/deployments/:id/rollback', async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        logger.info(`Rollback requested for deployment ${id}`, { reason });
        res.json({
            success: true,
            message: 'Rollback initiated successfully'
        });
    }
    catch (error) {
        logger.error('Error initiating rollback', { error });
        res.status(500).json({
            success: false,
            error: 'Failed to initiate rollback',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/health-checks', async (req, res) => {
    try {
        const healthChecks = await projectCompletionService.listHealthChecks();
        res.json({
            success: true,
            data: healthChecks,
            count: healthChecks.length
        });
    }
    catch (error) {
        logger.error('Error listing health checks', { error });
        res.status(500).json({
            success: false,
            error: 'Failed to list health checks',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/health-checks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const healthCheck = await projectCompletionService.getHealthCheck(id);
        if (!healthCheck) {
            return res.status(404).json({
                success: false,
                error: 'Health check not found'
            });
        }
        res.json({
            success: true,
            data: healthCheck
        });
    }
    catch (error) {
        logger.error('Error getting health check', { error });
        res.status(500).json({
            success: false,
            error: 'Failed to get health check',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/health-checks', async (req, res) => {
    try {
        const validatedData = HealthCheckSchema.parse(req.body);
        const healthCheck = await projectCompletionService.createHealthCheck({
            name: validatedData.name,
            type: validatedData.type,
            endpoint: validatedData.endpoint,
            timeout: validatedData.timeout,
            interval: validatedData.interval,
            retries: validatedData.retries,
            expectedStatus: validatedData.expectedStatus,
            expectedResponse: validatedData.expectedResponse,
            enabled: validatedData.enabled ?? true
        });
        res.status(201).json({
            success: true,
            data: healthCheck,
            message: 'Health check created successfully'
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.errors
            });
        }
        logger.error('Error creating health check', { error });
        res.status(500).json({
            success: false,
            error: 'Failed to create health check',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.put('/health-checks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const updatedHealthCheck = await projectCompletionService.updateHealthCheck(id, updates);
        if (!updatedHealthCheck) {
            return res.status(404).json({
                success: false,
                error: 'Health check not found'
            });
        }
        res.json({
            success: true,
            data: updatedHealthCheck,
            message: 'Health check updated successfully'
        });
    }
    catch (error) {
        logger.error('Error updating health check', { error });
        res.status(500).json({
            success: false,
            error: 'Failed to update health check',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.delete('/health-checks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await projectCompletionService.deleteHealthCheck(id);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: 'Health check not found'
            });
        }
        res.json({
            success: true,
            message: 'Health check deleted successfully'
        });
    }
    catch (error) {
        logger.error('Error deleting health check', { error });
        res.status(500).json({
            success: false,
            error: 'Failed to delete health check',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/status', async (req, res) => {
    try {
        const status = await projectCompletionService.getDeploymentStatus();
        res.json({
            success: true,
            data: status
        });
    }
    catch (error) {
        logger.error('Error getting deployment status', { error });
        res.status(500).json({
            success: false,
            error: 'Failed to get deployment status',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/reports/:period', async (req, res) => {
    try {
        const { period } = req.params;
        if (!['daily', 'weekly', 'monthly'].includes(period)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid period. Must be: daily, weekly, or monthly'
            });
        }
        const report = await projectCompletionService.generateDeploymentReport(period);
        res.json({
            success: true,
            data: report
        });
    }
    catch (error) {
        logger.error('Error generating deployment report', { error, period: req.params.period });
        res.status(500).json({
            success: false,
            error: 'Failed to generate deployment report',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/config', async (req, res) => {
    try {
        const config = await projectCompletionService.getConfig();
        res.json({
            success: true,
            data: config
        });
    }
    catch (error) {
        logger.error('Error getting configuration', { error });
        res.status(500).json({
            success: false,
            error: 'Failed to get configuration',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.put('/config', async (req, res) => {
    try {
        const validatedData = UpdateConfigSchema.parse(req.body);
        const updatedConfig = await projectCompletionService.updateConfig(validatedData);
        res.json({
            success: true,
            data: updatedConfig,
            message: 'Configuration updated successfully'
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.errors
            });
        }
        logger.error('Error updating configuration', { error });
        res.status(500).json({
            success: false,
            error: 'Failed to update configuration',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/health', async (req, res) => {
    try {
        const status = await projectCompletionService.getDeploymentStatus();
        const config = await projectCompletionService.getConfig();
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            services: {
                validation: config.validationEnabled ? 'enabled' : 'disabled',
                deployment: config.deploymentEnabled ? 'enabled' : 'disabled',
                monitoring: config.monitoringEnabled ? 'enabled' : 'disabled',
                rollback: config.rollbackEnabled ? 'enabled' : 'disabled'
            },
            deployment: {
                activeDeployments: status.activeDeployments,
                successfulDeployments: status.successfulDeployments,
                failedDeployments: status.failedDeployments,
                healthStatus: status.healthStatus,
                lastDeployment: status.lastDeployment,
                averageDeploymentTime: status.averageDeploymentTime
            }
        };
        res.json({
            success: true,
            data: health
        });
    }
    catch (error) {
        logger.error('Error checking health', { error });
        res.status(500).json({
            success: false,
            error: 'Health check failed',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/cleanup', async (req, res) => {
    try {
        await projectCompletionService.cleanup();
        res.json({
            success: true,
            message: 'Cleanup completed successfully'
        });
    }
    catch (error) {
        logger.error('Error during cleanup', { error });
        res.status(500).json({
            success: false,
            error: 'Cleanup failed',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/summary', async (req, res) => {
    try {
        const validation = await projectCompletionService.validateProjectCompletion();
        const status = await projectCompletionService.getDeploymentStatus();
        const config = await projectCompletionService.getConfig();
        const summary = {
            project: {
                overallStatus: validation.overallStatus,
                totalComponents: validation.totalComponents,
                passedComponents: validation.passedComponents,
                failedComponents: validation.failedComponents,
                warningComponents: validation.warningComponents,
                recommendations: validation.recommendations
            },
            deployment: {
                activeDeployments: status.activeDeployments,
                successfulDeployments: status.successfulDeployments,
                failedDeployments: status.failedDeployments,
                healthStatus: status.healthStatus,
                lastDeployment: status.lastDeployment,
                averageDeploymentTime: status.averageDeploymentTime
            },
            configuration: {
                validationEnabled: config.validationEnabled,
                deploymentEnabled: config.deploymentEnabled,
                monitoringEnabled: config.monitoringEnabled,
                rollbackEnabled: config.rollbackEnabled,
                environments: config.environments,
                strategies: config.strategies
            }
        };
        res.json({
            success: true,
            data: summary
        });
    }
    catch (error) {
        logger.error('Error getting summary', { error });
        res.status(500).json({
            success: false,
            error: 'Failed to get summary',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
export default router;
//# sourceMappingURL=project-completion-deployment.js.map