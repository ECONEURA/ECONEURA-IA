import { Router } from 'express';
import { z } from 'zod';

import { logger } from '../lib/logger.js';
import { aiBudgetUXService } from '../lib/ai-budget-ux.service.js';
const router = Router();
const BudgetConfigSchema = z.object({
    organizationId: z.string(),
    monthlyLimit: z.number().min(0),
    dailyLimit: z.number().min(0).optional(),
    warningThreshold: z.number().min(0).max(1).optional(),
    criticalThreshold: z.number().min(0).max(1).optional(),
    readOnlyThreshold: z.number().min(0).max(1).optional(),
    currency: z.enum(['EUR', 'USD', 'GBP']).optional(),
    timezone: z.string().optional(),
    alertChannels: z.array(z.enum(['email', 'slack', 'webhook', 'in_app'])).optional(),
    autoReadOnly: z.boolean().optional(),
    gracePeriod: z.number().min(0).optional(),
});
const UsageUpdateSchema = z.object({
    currentUsage: z.number().min(0).optional(),
    dailyUsage: z.number().min(0).optional(),
    monthlyUsage: z.number().min(0).optional(),
    usageByModel: z.record(z.string(), z.number()).optional(),
    usageByUser: z.record(z.string(), z.number()).optional(),
    usageByFeature: z.record(z.string(), z.number()).optional(),
});
const GracePeriodSchema = z.object({
    hours: z.number().min(1).max(168).default(24),
});
const AcknowledgeAlertSchema = z.object({
    acknowledgedBy: z.string().min(1),
});
router.get('/progress/:organizationId', async (req, res) => {
    try {
        const { organizationId } = req.params;
        const progress = aiBudgetUXService.getBudgetProgress(organizationId);
        if (!progress) {
            res.status(404).json({
                success: false,
                error: 'Budget configuration not found',
                code: 'BUDGET_CONFIG_NOT_FOUND'
            });
            return;
        }
        res.json({
            success: true,
            data: progress
        });
    }
    catch (error) {
        logger.error('Failed to get budget progress', {
            error: error instanceof Error ? error.message : 'Unknown error',
            organizationId: req.params.organizationId,
            requestId: req.headers['x-request-id'] || ''
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get budget progress',
            code: 'BUDGET_PROGRESS_ERROR'
        });
    }
});
router.get('/insights/:organizationId', async (req, res) => {
    try {
        const { organizationId } = req.params;
        const insights = aiBudgetUXService.getBudgetInsights(organizationId);
        if (!insights) {
            res.status(404).json({
                success: false,
                error: 'Budget configuration not found',
                code: 'BUDGET_CONFIG_NOT_FOUND'
            });
            return;
        }
        res.json({
            success: true,
            data: insights
        });
    }
    catch (error) {
        logger.error('Failed to get budget insights', {
            error: error instanceof Error ? error.message : 'Unknown error',
            organizationId: req.params.organizationId,
            requestId: req.headers['x-request-id'] || ''
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get budget insights',
            code: 'BUDGET_INSIGHTS_ERROR'
        });
    }
});
router.get('/config/:organizationId', async (req, res) => {
    try {
        const { organizationId } = req.params;
        const config = aiBudgetUXService.getBudgetConfig(organizationId);
        if (!config) {
            res.status(404).json({
                success: false,
                error: 'Budget configuration not found',
                code: 'BUDGET_CONFIG_NOT_FOUND'
            });
            return;
        }
        res.json({
            success: true,
            data: config
        });
    }
    catch (error) {
        logger.error('Failed to get budget config', {
            error: error instanceof Error ? error.message : 'Unknown error',
            organizationId: req.params.organizationId,
            requestId: req.headers['x-request-id'] || ''
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get budget config',
            code: 'BUDGET_CONFIG_ERROR'
        });
    }
});
router.post('/config', async (req, res) => {
    try {
        const configData = BudgetConfigSchema.parse(req.body);
        const config = await aiBudgetUXService.setBudgetConfig(configData);
        logger.info('Budget configuration set', {
            organizationId: config.organizationId,
            monthlyLimit: config.monthlyLimit,
            requestId: req.headers['x-request-id'] || ''
        });
        res.json({
            success: true,
            data: config
        });
    }
    catch (error) {
        logger.error('Failed to set budget config', {
            error: error instanceof Error ? error.message : 'Unknown error',
            body: req.body,
            requestId: req.headers['x-request-id'] || ''
        });
        res.status(400).json({
            success: false,
            error: 'Failed to set budget config',
            code: 'BUDGET_CONFIG_SET_ERROR'
        });
    }
});
router.post('/usage/:organizationId', async (req, res) => {
    try {
        const { organizationId } = req.params;
        const usageData = UsageUpdateSchema.parse(req.body);
        const usage = await aiBudgetUXService.updateUsage(organizationId, usageData);
        res.json({
            success: true,
            data: usage
        });
    }
    catch (error) {
        logger.error('Failed to update budget usage', {
            error: error instanceof Error ? error.message : 'Unknown error',
            organizationId: req.params.organizationId,
            body: req.body,
            requestId: req.headers['x-request-id'] || ''
        });
        res.status(400).json({
            success: false,
            error: 'Failed to update budget usage',
            code: 'BUDGET_USAGE_UPDATE_ERROR'
        });
    }
});
router.post('/check-request/:organizationId', async (req, res) => {
    try {
        const { organizationId } = req.params;
        const { estimatedCost } = req.body;
        if (typeof estimatedCost !== 'number' || estimatedCost < 0) {
            res.status(400).json({
                success: false,
                error: 'Invalid estimated cost',
                code: 'INVALID_ESTIMATED_COST'
            });
            return;
        }
        const result = aiBudgetUXService.canMakeRequest(organizationId, estimatedCost);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger.error('Failed to check request', {
            error: error instanceof Error ? error.message : 'Unknown error',
            organizationId: req.params.organizationId,
            estimatedCost: req.body.estimatedCost,
            requestId: req.headers['x-request-id'] || ''
        });
        res.status(500).json({
            success: false,
            error: 'Failed to check request',
            code: 'REQUEST_CHECK_ERROR'
        });
    }
});
router.get('/alerts/:organizationId', async (req, res) => {
    try {
        const { organizationId } = req.params;
        const alerts = aiBudgetUXService.getActiveAlerts(organizationId);
        res.json({
            success: true,
            data: {
                alerts,
                count: alerts.length
            }
        });
    }
    catch (error) {
        logger.error('Failed to get active alerts', {
            error: error instanceof Error ? error.message : 'Unknown error',
            organizationId: req.params.organizationId,
            requestId: req.headers['x-request-id'] || ''
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get active alerts',
            code: 'ALERTS_FETCH_ERROR'
        });
    }
});
router.patch('/alerts/:organizationId/:alertId/acknowledge', async (req, res) => {
    try {
        const { organizationId, alertId } = req.params;
        const { acknowledgedBy } = AcknowledgeAlertSchema.parse(req.body);
        const success = await aiBudgetUXService.acknowledgeAlert(organizationId, alertId, acknowledgedBy);
        if (!success) {
            res.status(404).json({
                success: false,
                error: 'Alert not found',
                code: 'ALERT_NOT_FOUND'
            });
            return;
        }
        res.json({
            success: true,
            message: 'Alert acknowledged successfully'
        });
    }
    catch (error) {
        logger.error('Failed to acknowledge alert', {
            error: error instanceof Error ? error.message : 'Unknown error',
            organizationId: req.params.organizationId,
            alertId: req.params.alertId,
            requestId: req.headers['x-request-id'] || ''
        });
        res.status(400).json({
            success: false,
            error: 'Failed to acknowledge alert',
            code: 'ALERT_ACKNOWLEDGE_ERROR'
        });
    }
});
router.post('/read-only/:organizationId/activate', async (req, res) => {
    try {
        const { organizationId } = req.params;
        const { reason } = req.body;
        if (!reason || typeof reason !== 'string') {
            res.status(400).json({
                success: false,
                error: 'Reason is required',
                code: 'REASON_REQUIRED'
            });
            return;
        }
        await aiBudgetUXService.activateReadOnlyMode(organizationId, reason);
        res.json({
            success: true,
            message: 'Read-only mode activated successfully'
        });
    }
    catch (error) {
        logger.error('Failed to activate read-only mode', {
            error: error instanceof Error ? error.message : 'Unknown error',
            organizationId: req.params.organizationId,
            requestId: req.headers['x-request-id'] || ''
        });
        res.status(500).json({
            success: false,
            error: 'Failed to activate read-only mode',
            code: 'READ_ONLY_ACTIVATE_ERROR'
        });
    }
});
router.post('/read-only/:organizationId/deactivate', async (req, res) => {
    try {
        const { organizationId } = req.params;
        const { reason } = req.body;
        if (!reason || typeof reason !== 'string') {
            res.status(400).json({
                success: false,
                error: 'Reason is required',
                code: 'REASON_REQUIRED'
            });
            return;
        }
        await aiBudgetUXService.deactivateReadOnlyMode(organizationId, reason);
        res.json({
            success: true,
            message: 'Read-only mode deactivated successfully'
        });
    }
    catch (error) {
        logger.error('Failed to deactivate read-only mode', {
            error: error instanceof Error ? error.message : 'Unknown error',
            organizationId: req.params.organizationId,
            requestId: req.headers['x-request-id'] || ''
        });
        res.status(500).json({
            success: false,
            error: 'Failed to deactivate read-only mode',
            code: 'READ_ONLY_DEACTIVATE_ERROR'
        });
    }
});
router.post('/grace-period/:organizationId/activate', async (req, res) => {
    try {
        const { organizationId } = req.params;
        const { hours } = GracePeriodSchema.parse(req.body);
        await aiBudgetUXService.activateGracePeriod(organizationId, hours);
        res.json({
            success: true,
            message: `Grace period activated for ${hours} hours`
        });
    }
    catch (error) {
        logger.error('Failed to activate grace period', {
            error: error instanceof Error ? error.message : 'Unknown error',
            organizationId: req.params.organizationId,
            requestId: req.headers['x-request-id'] || ''
        });
        res.status(400).json({
            success: false,
            error: 'Failed to activate grace period',
            code: 'GRACE_PERIOD_ACTIVATE_ERROR'
        });
    }
});
router.get('/dashboard/:organizationId', async (req, res) => {
    try {
        const { organizationId } = req.params;
        const progress = aiBudgetUXService.getBudgetProgress(organizationId);
        const insights = aiBudgetUXService.getBudgetInsights(organizationId);
        const config = aiBudgetUXService.getBudgetConfig(organizationId);
        const alerts = aiBudgetUXService.getActiveAlerts(organizationId);
        if (!progress || !insights || !config) {
            res.status(404).json({
                success: false,
                error: 'Budget configuration not found',
                code: 'BUDGET_CONFIG_NOT_FOUND'
            });
            return;
        }
        res.json({
            success: true,
            data: {
                progress,
                insights,
                config,
                alerts: {
                    active: alerts,
                    count: alerts.length
                }
            }
        });
    }
    catch (error) {
        logger.error('Failed to get budget dashboard', {
            error: error instanceof Error ? error.message : 'Unknown error',
            organizationId: req.params.organizationId,
            requestId: req.headers['x-request-id'] || ''
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get budget dashboard',
            code: 'BUDGET_DASHBOARD_ERROR'
        });
    }
});
export default router;
//# sourceMappingURL=ai-budget-ux.js.map