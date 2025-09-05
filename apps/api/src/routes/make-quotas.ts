import { Router } from 'express';
import { z } from 'zod';
import { makeQuotasService } from '../lib/make-quotas.service.js';
import { structuredLogger } from '../lib/structured-logger.js';

const router = Router();

// Validation schemas
const CheckQuotaSchema = z.object({
  organizationId: z.string().min(1),
  quotaType: z.enum(['api_calls', 'data_processing', 'webhook_calls'])
});

const ConsumeQuotaSchema = z.object({
  organizationId: z.string().min(1),
  quotaType: z.enum(['api_calls', 'data_processing', 'webhook_calls']),
  amount: z.number().int().positive().default(1)
});

const CreateIdempotencyKeySchema = z.object({
  key: z.string().min(1),
  organizationId: z.string().min(1),
  requestHash: z.string().min(1),
  ttlMinutes: z.number().int().positive().max(60).default(5)
});

const CompleteIdempotencyKeySchema = z.object({
  responseHash: z.string().min(1)
});

// GET /v1/make-quotas/stats - Get quota statistics
router.get('/stats', async (req, res) => {
  try {
    const { organizationId } = req.query;
    
    const stats = await makeQuotasService.getQuotaStats(
      organizationId as string | undefined
    );

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get quota stats', {
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get quota statistics',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /v1/make-quotas/organization/:orgId - Get organization quotas
router.get('/organization/:orgId', async (req, res) => {
  try {
    const { orgId } = req.params;
    
    const quotas = await makeQuotasService.getOrganizationQuotas(orgId);

    res.json({
      success: true,
      data: {
        organizationId: orgId,
        quotas,
        totalQuotas: quotas.length,
        exceededQuotas: quotas.filter(q => q.isExceeded).length,
        warningQuotas: quotas.filter(q => q.isWarning).length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get organization quotas', {
      error: error instanceof Error ? error.message : 'Unknown error',
      organizationId: req.params.orgId,
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get organization quotas',
      timestamp: new Date().toISOString()
    });
  }
});

// POST /v1/make-quotas/check - Check quota usage
router.post('/check', async (req, res) => {
  try {
    const validatedData = CheckQuotaSchema.parse(req.body);
    
    const usage = await makeQuotasService.checkQuota(
      validatedData.organizationId,
      validatedData.quotaType
    );

    res.json({
      success: true,
      data: usage,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors,
        timestamp: new Date().toISOString()
      });
      return;
    }

    structuredLogger.error('Failed to check quota', {
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.status(500).json({
      success: false,
      error: 'Failed to check quota',
      timestamp: new Date().toISOString()
    });
  }
});

// POST /v1/make-quotas/consume - Consume quota
router.post('/consume', async (req, res) => {
  try {
    const validatedData = ConsumeQuotaSchema.parse(req.body);
    
    const usage = await makeQuotasService.consumeQuota(
      validatedData.organizationId,
      validatedData.quotaType,
      validatedData.amount
    );

    res.json({
      success: true,
      data: usage,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors,
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (error instanceof Error && error.message.includes('Quota exceeded')) {
      res.status(429).json({
        success: false,
        error: 'Quota exceeded',
        message: error.message,
        timestamp: new Date().toISOString()
      });
      return;
    }

    structuredLogger.error('Failed to consume quota', {
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.status(500).json({
      success: false,
      error: 'Failed to consume quota',
      timestamp: new Date().toISOString()
    });
  }
});

// POST /v1/make-quotas/idempotency/create - Create idempotency key
router.post('/idempotency/create', async (req, res) => {
  try {
    const validatedData = CreateIdempotencyKeySchema.parse(req.body);
    
    const idempotencyKey = await makeQuotasService.createIdempotencyKey(
      validatedData.key,
      validatedData.organizationId,
      validatedData.requestHash,
      validatedData.ttlMinutes
    );

    res.json({
      success: true,
      data: idempotencyKey,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors,
        timestamp: new Date().toISOString()
      });
      return;
    }

    structuredLogger.error('Failed to create idempotency key', {
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.status(500).json({
      success: false,
      error: 'Failed to create idempotency key',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /v1/make-quotas/idempotency/:key - Get idempotency key
router.get('/idempotency/:key', async (req, res) => {
  try {
    const { key } = req.params;
    
    const idempotencyKey = await makeQuotasService.getIdempotencyKey(key);

    if (!idempotencyKey) {
      res.status(404).json({
        success: false,
        error: 'Idempotency key not found or expired',
        timestamp: new Date().toISOString()
      });
      return;
    }

    res.json({
      success: true,
      data: idempotencyKey,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get idempotency key', {
      error: error instanceof Error ? error.message : 'Unknown error',
      key: req.params.key,
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get idempotency key',
      timestamp: new Date().toISOString()
    });
  }
});

// POST /v1/make-quotas/idempotency/:key/complete - Complete idempotency key
router.post('/idempotency/:key/complete', async (req, res) => {
  try {
    const { key } = req.params;
    const validatedData = CompleteIdempotencyKeySchema.parse(req.body);
    
    await makeQuotasService.completeIdempotencyKey(key, validatedData.responseHash);

    res.json({
      success: true,
      message: 'Idempotency key completed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors,
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: 'Idempotency key not found',
        timestamp: new Date().toISOString()
      });
      return;
    }

    structuredLogger.error('Failed to complete idempotency key', {
      error: error instanceof Error ? error.message : 'Unknown error',
      key: req.params.key,
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.status(500).json({
      success: false,
      error: 'Failed to complete idempotency key',
      timestamp: new Date().toISOString()
    });
  }
});

// POST /v1/make-quotas/idempotency/:key/fail - Fail idempotency key
router.post('/idempotency/:key/fail', async (req, res) => {
  try {
    const { key } = req.params;
    
    await makeQuotasService.failIdempotencyKey(key);

    res.json({
      success: true,
      message: 'Idempotency key marked as failed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: 'Idempotency key not found',
        timestamp: new Date().toISOString()
      });
      return;
    }

    structuredLogger.error('Failed to fail idempotency key', {
      error: error instanceof Error ? error.message : 'Unknown error',
      key: req.params.key,
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.status(500).json({
      success: false,
      error: 'Failed to fail idempotency key',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /v1/make-quotas/health - Health check
router.get('/health', async (req, res) => {
  try {
    const stats = await makeQuotasService.getQuotaStats();
    
    const health = {
      status: 'ok',
      quotas: {
        total: stats.totalQuotas,
        exceeded: stats.exceededQuotas,
        warning: stats.warningQuotas
      },
      idempotency: {
        activeKeys: 0 // This would need to be tracked separately
      },
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get quota health', {
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get quota health',
      timestamp: new Date().toISOString()
    });
  }
});

export { router as makeQuotasRouter };
