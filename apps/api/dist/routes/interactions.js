import { Router } from 'express';
import { z } from 'zod';

import { interactionsService, InteractionFiltersSchema, CreateInteractionSchema, UpdateInteractionSchema } from '../lib/interactions.service.js';
import { logger } from '../lib/logger.js';
const router = Router();
router.get('/', async (req, res) => {
    try {
        const orgId = req.headers['x-org-id'] || 'demo-org-1';
        const userId = req.headers['x-user-id'] || 'demo-user';
        const filters = InteractionFiltersSchema.parse({
            ...req.query,
            limit: req.query.limit ? parseInt(req.query.limit) : 50,
            offset: req.query.offset ? parseInt(req.query.offset) : 0,
        });
        const result = await interactionsService.getInteractions(orgId, filters);
        res.set({
            'X-Est-Cost-EUR': '0.0010',
            'X-Budget-Pct': '0.1',
            'X-Latency-ms': '25',
            'X-Route': 'local',
            'X-Correlation-Id': `req_${Date.now()}`
        });
        res.json({
            success: true,
            data: result.interactions,
            count: result.interactions.length,
            total: result.total,
            filters: filters
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
        logger.error('Failed to get interactions', {
            error: error.message,
            query: req.query
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get interactions',
            message: error.message
        });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const orgId = req.headers['x-org-id'] || 'demo-org-1';
        const { id } = req.params;
        const interaction = await interactionsService.getInteractionById(orgId, id);
        if (!interaction) {
            return res.status(404).json({
                success: false,
                error: 'Interaction not found'
            });
        }
        res.set({
            'X-Est-Cost-EUR': '0.0005',
            'X-Budget-Pct': '0.05',
            'X-Latency-ms': '15',
            'X-Route': 'local',
            'X-Correlation-Id': `req_${Date.now()}`
        });
        res.json({
            success: true,
            data: interaction
        });
    }
    catch (error) {
        logger.error('Failed to get interaction by ID', {
            error: error.message,
            interactionId: req.params.id
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get interaction',
            message: error.message
        });
    }
});
router.post('/', async (req, res) => {
    try {
        const orgId = req.headers['x-org-id'] || 'demo-org-1';
        const userId = req.headers['x-user-id'] || 'demo-user';
        const data = CreateInteractionSchema.parse(req.body);
        const interaction = await interactionsService.createInteraction(orgId, userId, data);
        res.set({
            'X-Est-Cost-EUR': '0.0020',
            'X-Budget-Pct': '0.2',
            'X-Latency-ms': '45',
            'X-Route': 'local',
            'X-Correlation-Id': `req_${Date.now()}`
        });
        res.status(201).json({
            success: true,
            data: interaction
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
        logger.error('Failed to create interaction', {
            error: error.message,
            body: req.body
        });
        res.status(500).json({
            success: false,
            error: 'Failed to create interaction',
            message: error.message
        });
    }
});
router.put('/:id', async (req, res) => {
    try {
        const orgId = req.headers['x-org-id'] || 'demo-org-1';
        const userId = req.headers['x-user-id'] || 'demo-user';
        const { id } = req.params;
        const data = UpdateInteractionSchema.parse(req.body);
        const interaction = await interactionsService.updateInteraction(orgId, id, userId, data);
        if (!interaction) {
            return res.status(404).json({
                success: false,
                error: 'Interaction not found'
            });
        }
        res.set({
            'X-Est-Cost-EUR': '0.0015',
            'X-Budget-Pct': '0.15',
            'X-Latency-ms': '35',
            'X-Route': 'local',
            'X-Correlation-Id': `req_${Date.now()}`
        });
        res.json({
            success: true,
            data: interaction
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
        logger.error('Failed to update interaction', {
            error: error.message,
            interactionId: req.params.id,
            body: req.body
        });
        res.status(500).json({
            success: false,
            error: 'Failed to update interaction',
            message: error.message
        });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const orgId = req.headers['x-org-id'] || 'demo-org-1';
        const userId = req.headers['x-user-id'] || 'demo-user';
        const { id } = req.params;
        const deleted = await interactionsService.deleteInteraction(orgId, id, userId);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: 'Interaction not found'
            });
        }
        res.set({
            'X-Est-Cost-EUR': '0.0005',
            'X-Budget-Pct': '0.05',
            'X-Latency-ms': '20',
            'X-Route': 'local',
            'X-Correlation-Id': `req_${Date.now()}`
        });
        res.json({
            success: true,
            message: 'Interaction deleted successfully'
        });
    }
    catch (error) {
        logger.error('Failed to delete interaction', {
            error: error.message,
            interactionId: req.params.id
        });
        res.status(500).json({
            success: false,
            error: 'Failed to delete interaction',
            message: error.message
        });
    }
});
router.get('/summary', async (req, res) => {
    try {
        const orgId = req.headers['x-org-id'] || 'demo-org-1';
        const summary = await interactionsService.getInteractionSummary(orgId);
        res.set({
            'X-Est-Cost-EUR': '0.0020',
            'X-Budget-Pct': '0.2',
            'X-Latency-ms': '40',
            'X-Route': 'local',
            'X-Correlation-Id': `req_${Date.now()}`
        });
        res.json({
            success: true,
            data: summary
        });
    }
    catch (error) {
        logger.error('Failed to get interaction summary', {
            error: error.message
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get interaction summary',
            message: error.message
        });
    }
});
router.get('/analytics', async (req, res) => {
    try {
        const orgId = req.headers['x-org-id'] || 'demo-org-1';
        const analytics = await interactionsService.getInteractionAnalytics(orgId);
        res.set({
            'X-Est-Cost-EUR': '0.0030',
            'X-Budget-Pct': '0.3',
            'X-Latency-ms': '60',
            'X-Route': 'local',
            'X-Correlation-Id': `req_${Date.now()}`
        });
        res.json({
            success: true,
            data: analytics
        });
    }
    catch (error) {
        logger.error('Failed to get interaction analytics', {
            error: error.message
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get interaction analytics',
            message: error.message
        });
    }
});
router.post('/bulk-update', async (req, res) => {
    try {
        const orgId = req.headers['x-org-id'] || 'demo-org-1';
        const userId = req.headers['x-user-id'] || 'demo-user';
        const { updates } = req.body;
        if (!Array.isArray(updates) || updates.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Updates array is required and must not be empty'
            });
        }
        const result = await interactionsService.bulkUpdateInteractions(orgId, userId, updates);
        res.set({
            'X-Est-Cost-EUR': '0.0050',
            'X-Budget-Pct': '0.5',
            'X-Latency-ms': '100',
            'X-Route': 'local',
            'X-Correlation-Id': `req_${Date.now()}`
        });
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger.error('Failed to bulk update interactions', {
            error: error.message,
            body: req.body
        });
        res.status(500).json({
            success: false,
            error: 'Failed to bulk update interactions',
            message: error.message
        });
    }
});
export { router as interactionsRouter };
//# sourceMappingURL=interactions.js.map