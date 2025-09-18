import { Router } from 'express';
import { z } from 'zod';
import { makeQuotas } from '../lib/make-quotas.service.js';
import { structuredLogger } from '../lib/structured-logger.js';

const router = Router();

// GET /v1/make-quotas/:orgId - Get quota for organization
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
  } catch (error) {
    structuredLogger.error('Failed to get quota', error as Error, {
      orgId: req.params.orgId
    });
    res.status(500).json({ 
      error: 'Failed to get quota',
      message: (error as Error).message 
    });
  }
});

// GET /v1/make-quotas/:orgId/usage - Get usage for organization
router.get('/:orgId/usage', async (req, res) => {
  try {
    const { orgId } = req.params;
    const usage = await makeQuotas.getOrgUsage(orgId);
    
    res.json({
      success: true,
      data: usage
    });
  } catch (error) {
    structuredLogger.error('Failed to get org usage', error as Error, {
      orgId: req.params.orgId
    });
    res.status(500).json({ 
      error: 'Failed to get org usage',
      message: (error as Error).message 
    });
  }
});

// POST /v1/make-quotas/:orgId/check - Check quota
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
  } catch (error) {
    structuredLogger.error('Failed to check quota', error as Error, {
      orgId: req.params.orgId
    });
    res.status(500).json({ 
      error: 'Failed to check quota',
      message: (error as Error).message 
    });
  }
});

// POST /v1/make-quotas/:orgId/consume - Consume quota
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
  } catch (error) {
    structuredLogger.error('Failed to consume quota', error as Error, {
      orgId: req.params.orgId
    });
    res.status(500).json({ 
      error: 'Failed to consume quota',
      message: (error as Error).message 
    });
  }
});

// POST /v1/make-quotas/:orgId/reset - Reset quota
router.post('/:orgId/reset', async (req, res) => {
  try {
    const { orgId } = req.params;
    await makeQuotas.resetQuota(orgId);
    
    res.json({
      success: true,
      message: 'Quota reset successfully'
    });
  } catch (error) {
    structuredLogger.error('Failed to reset quota', error as Error, {
      orgId: req.params.orgId
    });
    res.status(500).json({ 
      error: 'Failed to reset quota',
      message: (error as Error).message 
    });
  }
});

// POST /v1/make-quotas/idempotency - Check idempotency
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
    
    // Generate new idempotency key if not provided
    const idempotencyKey = key || makeQuotas.generateIdempotencyKey(orgId, data);
    
    res.json({
      success: true,
      data: {
        idempotencyKey,
        cached: false
      }
    });
  } catch (error) {
    structuredLogger.error('Failed to check idempotency', error as Error);
    res.status(500).json({ 
      error: 'Failed to check idempotency',
      message: (error as Error).message 
    });
  }
});

// POST /v1/make-quotas/idempotency/store - Store idempotency response
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
  } catch (error) {
    structuredLogger.error('Failed to store idempotency response', error as Error);
    res.status(500).json({ 
      error: 'Failed to store idempotency response',
      message: (error as Error).message 
    });
  }
});

// POST /v1/make-quotas/webhook/verify - Verify webhook signature
router.post('/webhook/verify', async (req, res) => {
  try {
    const signature = req.headers['x-make-signature'] as string;
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
  } catch (error) {
    structuredLogger.error('Failed to verify webhook signature', error as Error);
    res.status(500).json({ 
      error: 'Failed to verify webhook signature',
      message: (error as Error).message 
    });
  }
});

// GET /v1/make-quotas/stats - Get quota statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await makeQuotas.getQuotaStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    structuredLogger.error('Failed to get quota stats', error as Error);
    res.status(500).json({ 
      error: 'Failed to get quota stats',
      message: (error as Error).message 
    });
  }
});

// GET /v1/make-quotas - Get all quotas
router.get('/', async (req, res) => {
  try {
    const quotas = await makeQuotas.getAllQuotas();
    
    res.json({
      success: true,
      data: quotas,
      count: quotas.length
    });
  } catch (error) {
    structuredLogger.error('Failed to get all quotas', error as Error);
    res.status(500).json({ 
      error: 'Failed to get all quotas',
      message: (error as Error).message 
    });
  }
});

export { router as makeQuotasRouter };