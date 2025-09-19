import { Router } from 'express';
import { workflowsService, WorkflowSchema, WorkflowInstanceSchema } from '../lib/workflows.service.js';
const router = Router();
const validateWorkflow = (req, res, next) => {
    try {
        req.body = WorkflowSchema.omit({ id: true, createdAt: true, updatedAt: true }).parse(req.body);
        next();
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: 'Invalid workflow data',
            details: error
        });
    }
};
const validateWorkflowInstance = (req, res, next) => {
    try {
        req.body = WorkflowInstanceSchema.omit({ id: true, startedAt: true, completedAt: true }).parse(req.body);
        next();
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: 'Invalid workflow instance data',
            details: error
        });
    }
};
router.get('/', async (req, res) => {
    try {
        const { type, status } = req.query;
        const filters = {};
        if (type)
            filters.type = type;
        if (status)
            filters.status = status;
        const workflows = await workflowsService.getWorkflows(filters);
        res.json({
            success: true,
            data: workflows,
            total: workflows.length,
            filters
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get workflows',
            details: error
        });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const workflow = await workflowsService.getWorkflow(id);
        if (!workflow) {
            return res.status(404).json({
                success: false,
                error: 'Workflow not found'
            });
        }
        res.json({
            success: true,
            data: workflow
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get workflow',
            details: error
        });
    }
});
router.post('/', validateWorkflow, async (req, res) => {
    try {
        const validation = await workflowsService.validateWorkflow(req.body);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                error: 'Workflow validation failed',
                details: validation.errors,
                warnings: validation.warnings
            });
        }
        const workflow = await workflowsService.createWorkflow(req.body);
        res.status(201).json({
            success: true,
            data: workflow,
            message: 'Workflow created successfully'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to create workflow',
            details: error
        });
    }
});
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        if (updates.definition || updates.actions) {
            const existing = await workflowsService.getWorkflow(id);
            if (!existing) {
                return res.status(404).json({
                    success: false,
                    error: 'Workflow not found'
                });
            }
            const validation = await workflowsService.validateWorkflow({ ...existing, ...updates });
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    error: 'Workflow validation failed',
                    details: validation.errors,
                    warnings: validation.warnings
                });
            }
        }
        const workflow = await workflowsService.updateWorkflow(id, updates);
        if (!workflow) {
            return res.status(404).json({
                success: false,
                error: 'Workflow not found'
            });
        }
        res.json({
            success: true,
            data: workflow,
            message: 'Workflow updated successfully'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to update workflow',
            details: error
        });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await workflowsService.deleteWorkflow(id);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: 'Workflow not found'
            });
        }
        res.json({
            success: true,
            message: 'Workflow deleted successfully'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to delete workflow',
            details: error
        });
    }
});
router.post('/:id/start', async (req, res) => {
    try {
        const { id } = req.params;
        const { context, metadata } = req.body;
        if (!context) {
            return res.status(400).json({
                success: false,
                error: 'Context is required to start workflow'
            });
        }
        const instance = await workflowsService.startWorkflow(id, context, metadata || {});
        res.json({
            success: true,
            data: instance,
            message: 'Workflow started successfully'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to start workflow',
            details: error
        });
    }
});
router.get('/instances', async (req, res) => {
    try {
        const { status, workflowId } = req.query;
        const filters = {};
        if (status)
            filters.status = status;
        if (workflowId)
            filters.workflowId = workflowId;
        const instances = await workflowsService.getInstances(filters);
        res.json({
            success: true,
            data: instances,
            total: instances.length,
            filters
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get workflow instances',
            details: error
        });
    }
});
router.get('/instances/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const instance = await workflowsService.getInstance(id);
        if (!instance) {
            return res.status(404).json({
                success: false,
                error: 'Workflow instance not found'
            });
        }
        res.json({
            success: true,
            data: instance
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get workflow instance',
            details: error
        });
    }
});
router.post('/instances/:id/pause', async (req, res) => {
    try {
        const { id } = req.params;
        const instance = await workflowsService.pauseInstance(id);
        if (!instance) {
            return res.status(404).json({
                success: false,
                error: 'Workflow instance not found'
            });
        }
        res.json({
            success: true,
            data: instance,
            message: 'Workflow instance paused successfully'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to pause workflow instance',
            details: error
        });
    }
});
router.post('/instances/:id/resume', async (req, res) => {
    try {
        const { id } = req.params;
        const instance = await workflowsService.resumeInstance(id);
        if (!instance) {
            return res.status(404).json({
                success: false,
                error: 'Workflow instance not found'
            });
        }
        res.json({
            success: true,
            data: instance,
            message: 'Workflow instance resumed successfully'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to resume workflow instance',
            details: error
        });
    }
});
router.post('/instances/:id/cancel', async (req, res) => {
    try {
        const { id } = req.params;
        const instance = await workflowsService.cancelInstance(id);
        if (!instance) {
            return res.status(404).json({
                success: false,
                error: 'Workflow instance not found'
            });
        }
        res.json({
            success: true,
            data: instance,
            message: 'Workflow instance cancelled successfully'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to cancel workflow instance',
            details: error
        });
    }
});
router.post('/instances/:id/actions', async (req, res) => {
    try {
        const { id } = req.params;
        const { actionId } = req.body;
        if (!actionId) {
            return res.status(400).json({
                success: false,
                error: 'Action ID is required'
            });
        }
        const result = await workflowsService.executeAction(id, actionId);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                error: result.error,
                data: { actionId }
            });
        }
        res.json({
            success: true,
            data: {
                actionId,
                result: result.result
            },
            message: 'Action executed successfully'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to execute action',
            details: error
        });
    }
});
router.get('/stats', async (req, res) => {
    try {
        const stats = await workflowsService.getStats();
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get workflow statistics',
            details: error
        });
    }
});
router.post('/validate', validateWorkflow, async (req, res) => {
    try {
        const validation = await workflowsService.validateWorkflow(req.body);
        res.json({
            success: true,
            data: validation
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to validate workflow',
            details: error
        });
    }
});
router.get('/health', async (req, res) => {
    try {
        const stats = await workflowsService.getStats();
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            stats: {
                totalWorkflows: stats.totalWorkflows,
                totalInstances: stats.totalInstances,
                activeInstances: stats.instancesByStatus.running || 0
            }
        };
        res.json({
            success: true,
            data: health
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Workflow service unhealthy',
            details: error
        });
    }
});
export default router;
//# sourceMappingURL=workflows.js.map