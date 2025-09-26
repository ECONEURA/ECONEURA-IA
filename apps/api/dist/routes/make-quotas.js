import { Router } from 'express';

import { makeQuotas } from '../lib/make-quotas.service.js';
import { structuredLogger } from '../lib/structured-logger.js';
const router = Router();
router.get('/:orgId', async (req, res) => {
    try {
        const { orgId } = req.params;
        const quota = await makeQuotas.getQuota(orgId);
        if (!quota) {
            return res.status(404).json({
                error: 'Quota not found',
                message: `No quota found for organization ${orgId}`
            });
        }
        res.json({
            success: true,
            data: quota
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get quota', error, {
            orgId: req.params.orgId
        });
        res.status(500).json({
            error: 'Failed to get quota',
            message: error.message
        });
    }
});
router.get('/:orgId/usage', async (req, res) => {
    try {
        const { orgId } = req.params;
        const usage = await makeQuotas.getOrgUsage(orgId);
        res.json({
            success: true,
            data: usage
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get org usage', error, {
            orgId: req.params.orgId
        });
        res.status(500).json({
            error: 'Failed to get org usage',
            message: error.message
        });
    }
});
router.post('/:orgId/check', async (req, res) => {
    try {
        const { orgId } = req.params;
        const { amount = 1 } = req.body;
        const { allowed, quota } = await makeQuotas.checkQuota(orgId);
        res.json({
            success: true,
            data: {
                allowed,
                quota,
                requestedAmount: amount
            }
        });
    }
    catch (error) {
        structuredLogger.error('Failed to check quota', error, {
            orgId: req.params.orgId
        });
        res.status(500).json({
            error: 'Failed to check quota',
            message: error.message
        });
    }
});
router.post('/:orgId/consume', async (req, res) => {
    try {
        const { orgId } = req.params;
        const { amount = 1 } = req.body;
        const success = await makeQuotas.consumeQuota(orgId, amount);
        if (!success) {
            return res.status(429).json({
                error: 'Quota exceeded',
                message: `Organization ${orgId} has exceeded its quota`
            });
        }
        res.json({
            success: true,
            message: 'Quota consumed successfully'
        });
    }
    catch (error) {
        structuredLogger.error('Failed to consume quota', error, {
            orgId: req.params.orgId
        });
        res.status(500).json({
            error: 'Failed to consume quota',
            message: error.message
        });
    }
});
router.post('/:orgId/reset', async (req, res) => {
    try {
        const { orgId } = req.params;
        await makeQuotas.resetQuota(orgId);
        res.json({
            success: true,
            message: 'Quota reset successfully'
        });
    }
    catch (error) {
        structuredLogger.error('Failed to reset quota', error, {
            orgId: req.params.orgId
        });
        res.status(500).json({
            error: 'Failed to reset quota',
            message: error.message
        });
    }
});
router.post('/idempotency', async (req, res) => {
    try {
        const { key, orgId, data } = req.body;
        if (!key || !orgId) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'key and orgId are required'
            });
        }
        const existingResponse = await makeQuotas.checkIdempotency(key, orgId);
        if (existingResponse) {
            return res.json({
                success: true,
                data: existingResponse,
                cached: true
            });
        }
        const idempotencyKey = key || makeQuotas.generateIdempotencyKey(orgId, data);
        res.json({
            success: true,
            data: {
                idempotencyKey,
                cached: false
            }
        });
    }
    catch (error) {
        structuredLogger.error('Failed to check idempotency', error);
        res.status(500).json({
            error: 'Failed to check idempotency',
            message: error.message
        });
    }
});
router.post('/idempotency/store', async (req, res) => {
    try {
        const { key, orgId, response, ttl } = req.body;
        if (!key || !orgId || !response) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'key, orgId, and response are required'
            });
        }
        const ttlMinutes = ttl || 5;
        await makeQuotas.storeIdempotency(key, orgId, response, ttlMinutes);
        res.json({
            success: true,
            message: 'Idempotency response stored successfully'
        });
    }
    catch (error) {
        structuredLogger.error('Failed to store idempotency response', error);
        res.status(500).json({
            error: 'Failed to store idempotency response',
            message: error.message
        });
    }
});
router.post('/webhook/verify', async (req, res) => {
    try {
        const signature = req.headers['x-make-signature'];
        const payload = JSON.stringify(req.body);
        if (!signature) {
            return res.status(400).json({
                error: 'Missing signature',
                message: 'x-make-signature header is required'
            });
        }
        const isValid = await makeQuotas.verifyWebhookSignature(payload, signature);
        if (!isValid) {
            return res.status(401).json({
                error: 'Invalid signature',
                message: 'Webhook signature verification failed'
            });
        }
        res.json({
            success: true,
            message: 'Webhook signature verified'
        });
    }
    catch (error) {
        structuredLogger.error('Failed to verify webhook signature', error);
        res.status(500).json({
            error: 'Failed to verify webhook signature',
            message: error.message
        });
    }
});
router.get('/stats', async (req, res) => {
    try {
        const stats = await makeQuotas.getQuotaStats();
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get quota stats', error);
        res.status(500).json({
            error: 'Failed to get quota stats',
            message: error.message
        });
    }
});
router.get('/', async (req, res) => {
    try {
        const quotas = await makeQuotas.getAllQuotas();
        res.json({
            success: true,
            data: quotas,
            count: quotas.length
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get all quotas', error);
        res.status(500).json({
            error: 'Failed to get all quotas',
            message: error.message
        });
    }
});
export { router as makeQuotasRouter };
//# sourceMappingURL=make-quotas.js.map