import { Router } from 'express';
import { sseManager } from '../lib/sse-manager.js';
import { structuredLogger } from '../lib/structured-logger.js';
const router = Router();
router.get('/events', (req, res) => {
    try {
        const orgId = req.headers['x-org-id'] || 'org-demo';
        const userId = Array.isArray(req.headers['x-user-id']) ? req.headers['x-user-id'][0] : req.headers['x-user-id'];
        const subscriptions = req.query.subscribe;
        const eventTypes = subscriptions ? subscriptions.split(',').map(s => s.trim()) : [];
        const clientId = sseManager.addClient(orgId, userId, res, eventTypes);
        res.set({
            'X-Est-Cost-EUR': '0.0005',
            'X-Budget-Pct': '0.1',
            'X-Latency-ms': '10',
            'X-Route': 'local',
            'X-Correlation-Id': clientId
        });
        structuredLogger.info('SSE connection established', {
            clientId,
            orgId,
            userId,
            subscriptions: eventTypes
        });
        setTimeout(() => {
            sseManager.sendToClient(clientId, {
                event: 'system_status',
                data: {
                    status: 'connected',
                    timestamp: new Date().toISOString(),
                    server: 'econeura-api',
                    version: '1.0.0'
                }
            });
        }, 100);
    }
    catch (error) {
        structuredLogger.error('Failed to establish SSE connection', error, {
            orgId: req.headers['x-org-id'],
            userId: Array.isArray(req.headers['x-user-id']) ? req.headers['x-user-id'][0] : req.headers['x-user-id']
        });
        res.status(500).json({
            error: 'Failed to establish SSE connection',
            message: error.message
        });
    }
});
router.post('/broadcast', (req, res) => {
    try {
        const orgId = req.headers['x-org-id'] || 'org-demo';
        const userId = req.headers['x-user-id'] || 'system';
        const { event, data, eventType } = req.body;
        if (!event || !data) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'event and data are required'
            });
        }
        const sentCount = sseManager.broadcastToOrg(orgId, {
            event,
            data: {
                ...data,
                timestamp: new Date().toISOString(),
                source: 'broadcast',
                userId
            }
        }, eventType);
        structuredLogger.info('SSE event broadcasted', {
            orgId,
            userId,
            event,
            eventType,
            sentCount
        });
        res.json({
            success: true,
            message: `Event broadcasted to ${sentCount} clients`,
            sentCount,
            event,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Failed to broadcast SSE event', error, {
            orgId: req.headers['x-org-id'],
            body: req.body
        });
        res.status(500).json({
            error: 'Failed to broadcast event',
            message: error.message
        });
    }
});
router.get('/stats', (req, res) => {
    try {
        const stats = sseManager.getStats();
        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get SSE stats', error);
        res.status(500).json({
            error: 'Failed to get SSE stats',
            message: error.message
        });
    }
});
export { router as eventsRouter };
//# sourceMappingURL=events.js.map