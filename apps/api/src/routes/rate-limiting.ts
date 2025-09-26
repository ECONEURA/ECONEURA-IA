// ============================================================================
// RATE LIMITING ADMIN ROUTES
// ============================================================================

import { Router } from 'express';
import { z } from 'zod';
import { Request, Response } from 'express';

import { structuredLogger } from '../lib/structured-logger.js';
import {
  globalRateLimiter 
} from '../middleware/rate-limiting.js';
import { authenticateToken } from '../middleware/auth.js';

// ============================================================================
// ROUTER SETUP
// ============================================================================

const router = Router();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const getStatusSchema = z.object({
  key: z.string().min(1, 'Key is required')
});

const resetLimitSchema = z.object({
  key: z.string().min(1, 'Key is required')
});

const addRuleSchema = z.object({
  id: z.string().min(1, 'Rule ID is required'),
  name: z.string().min(1, 'Rule name is required'),
  windowMs: z.number().min(1000, 'Window must be at least 1000ms'),
  maxRequests: z.number().min(1, 'Max requests must be at least 1'),
  keyType: z.enum(['ip', 'api_key', 'user', 'custom']),
  keyField: z.string().optional(),
  message: z.string().optional(),
  enabled: z.boolean().default(true)
});

const updateRuleSchema = z.object({
  name: z.string().min(1).optional(),
  windowMs: z.number().min(1000).optional(),
  maxRequests: z.number().min(1).optional(),
  keyType: z.enum(['ip', 'api_key', 'user', 'custom']).optional(),
  keyField: z.string().optional(),
  message: z.string().optional(),
  enabled: z.boolean().optional()
});

// ============================================================================
// RATE LIMITING STATUS
// ============================================================================

// GET /rate-limiting/status?key=...
router.get('/status', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] as string || `req_${Date.now()}`;

  try {
    // Validate query parameters
    const validation = getStatusSchema.safeParse(req.query);
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation error',
        message: validation.error.errors.map(e => e.message).join(', '),
        requestId,
        timestamp: new Date().toISOString()
      });
      return;
    }

    const { key } = validation.data;

    // Get rate limit information
    const limitInfo = await globalRateLimiter.getLimitInfo(key);
    const stats = globalRateLimiter.getStats();

    const processingTime = Date.now() - startTime;

    structuredLogger.info('Rate limit status retrieved', {
      requestId,
      key: key.substring(0, 10) + '***', // Partial key for logging
      processingTime
    });

    res.json({
      success: true,
      data: {
        key,
        limitInfo,
        stats
      },
      requestId,
      timestamp: new Date().toISOString(),
      processingTime
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    structuredLogger.error('Failed to get rate limit status', {
      error: errorMessage,
      requestId,
      processingTime
    });

    res.status(500).json({
      error: 'Failed to get rate limit status',
      message: errorMessage,
      requestId,
      timestamp: new Date().toISOString()
    });
  }
});

// ============================================================================
// RESET RATE LIMIT
// ============================================================================

// POST /rate-limiting/reset
router.post('/reset', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] as string || `req_${Date.now()}`;

  try {
    // Validate request body
    const validation = resetLimitSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation error',
        message: validation.error.errors.map(e => e.message).join(', '),
        requestId,
        timestamp: new Date().toISOString()
      });
      return;
    }

    const { key } = validation.data;

    // Reset rate limit
    await globalRateLimiter.resetLimit(key);

    const processingTime = Date.now() - startTime;

    structuredLogger.info('Rate limit reset', {
      requestId,
      key: key.substring(0, 10) + '***',
      userId: req.user?.id,
      processingTime
    });

    res.json({
      success: true,
      message: 'Rate limit reset successfully',
      data: { key },
      requestId,
      timestamp: new Date().toISOString(),
      processingTime
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    structuredLogger.error('Failed to reset rate limit', {
      error: errorMessage,
      requestId,
      userId: req.user?.id,
      processingTime
    });

    res.status(500).json({
      error: 'Failed to reset rate limit',
      message: errorMessage,
      requestId,
      timestamp: new Date().toISOString()
    });
  }
});

// ============================================================================
// RATE LIMITING STATISTICS
// ============================================================================

// GET /rate-limiting/stats
router.get('/stats', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] as string || `req_${Date.now()}`;

  try {
    // Get rate limiting statistics
    const stats = globalRateLimiter.getStats();
    const rules = globalRateLimiter.getAllRules();

    const processingTime = Date.now() - startTime;

    structuredLogger.info('Rate limit stats retrieved', {
      requestId,
      userId: req.user?.id,
      processingTime
    });

    res.json({
      success: true,
      data: {
        stats,
        rules,
        timestamp: new Date().toISOString()
      },
      requestId,
      timestamp: new Date().toISOString(),
      processingTime
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    structuredLogger.error('Failed to get rate limit stats', {
      error: errorMessage,
      requestId,
      userId: req.user?.id,
      processingTime
    });

    res.status(500).json({
      error: 'Failed to get rate limit stats',
      message: errorMessage,
      requestId,
      timestamp: new Date().toISOString()
    });
  }
});

// ============================================================================
// RULE MANAGEMENT
// ============================================================================

// GET /rate-limiting/rules
router.get('/rules', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] as string || `req_${Date.now()}`;

  try {
    const rules = globalRateLimiter.getAllRules();

    const processingTime = Date.now() - startTime;

    res.json({
      success: true,
      data: { rules },
      requestId,
      timestamp: new Date().toISOString(),
      processingTime
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    structuredLogger.error('Failed to get rate limit rules', {
      error: errorMessage,
      requestId,
      processingTime
    });

    res.status(500).json({
      error: 'Failed to get rate limit rules',
      message: errorMessage,
      requestId,
      timestamp: new Date().toISOString()
    });
  }
});

// POST /rate-limiting/rules
router.post('/rules', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] as string || `req_${Date.now()}`;

  try {
    // Validate request body
    const validation = addRuleSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation error',
        message: validation.error.errors.map(e => e.message).join(', '),
        requestId,
        timestamp: new Date().toISOString()
      });
      return;
    }

    const ruleData = validation.data;

    // Check if rule already exists
    const existingRule = globalRateLimiter.getRule(ruleData.id);
    if (existingRule) {
      res.status(409).json({
        error: 'Rule already exists',
        message: `Rule with ID '${ruleData.id}' already exists`,
        requestId,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Add new rule
    globalRateLimiter.addRule(ruleData);

    const processingTime = Date.now() - startTime;

    structuredLogger.info('Rate limit rule added', {
      requestId,
      ruleId: ruleData.id,
      userId: req.user?.id,
      processingTime
    });

    res.status(201).json({
      success: true,
      message: 'Rate limit rule added successfully',
      data: { rule: ruleData },
      requestId,
      timestamp: new Date().toISOString(),
      processingTime
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    structuredLogger.error('Failed to add rate limit rule', {
      error: errorMessage,
      requestId,
      userId: req.user?.id,
      processingTime
    });

    res.status(500).json({
      error: 'Failed to add rate limit rule',
      message: errorMessage,
      requestId,
      timestamp: new Date().toISOString()
    });
  }
});

// PUT /rate-limiting/rules/:id
router.put('/rules/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] as string || `req_${Date.now()}`;

  try {
    const { id } = req.params;

    // Validate request body
    const validation = updateRuleSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation error',
        message: validation.error.errors.map(e => e.message).join(', '),
        requestId,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Check if rule exists
    const existingRule = globalRateLimiter.getRule(id);
    if (!existingRule) {
      res.status(404).json({
        error: 'Rule not found',
        message: `Rule with ID '${id}' not found`,
        requestId,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Update rule (remove and re-add with updated data)
    globalRateLimiter.removeRule(id);
    const updatedRule = { ...existingRule, ...validation.data };
    globalRateLimiter.addRule(updatedRule);

    const processingTime = Date.now() - startTime;

    structuredLogger.info('Rate limit rule updated', {
      requestId,
      ruleId: id,
      userId: req.user?.id,
      processingTime
    });

    res.json({
      success: true,
      message: 'Rate limit rule updated successfully',
      data: { rule: updatedRule },
      requestId,
      timestamp: new Date().toISOString(),
      processingTime
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    structuredLogger.error('Failed to update rate limit rule', {
      error: errorMessage,
      requestId,
      ruleId: req.params.id,
      userId: req.user?.id,
      processingTime
    });

    res.status(500).json({
      error: 'Failed to update rate limit rule',
      message: errorMessage,
      requestId,
      timestamp: new Date().toISOString()
    });
  }
});

// DELETE /rate-limiting/rules/:id
router.delete('/rules/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] as string || `req_${Date.now()}`;

  try {
    const { id } = req.params;

    // Check if rule exists
    const existingRule = globalRateLimiter.getRule(id);
    if (!existingRule) {
      res.status(404).json({
        error: 'Rule not found',
        message: `Rule with ID '${id}' not found`,
        requestId,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Remove rule
    const removed = globalRateLimiter.removeRule(id);

    const processingTime = Date.now() - startTime;

    structuredLogger.info('Rate limit rule removed', {
      requestId,
      ruleId: id,
      userId: req.user?.id,
      processingTime
    });

    res.json({
      success: true,
      message: 'Rate limit rule removed successfully',
      data: { ruleId: id, removed },
      requestId,
      timestamp: new Date().toISOString(),
      processingTime
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    structuredLogger.error('Failed to remove rate limit rule', {
      error: errorMessage,
      requestId,
      ruleId: req.params.id,
      userId: req.user?.id,
      processingTime
    });

    res.status(500).json({
      error: 'Failed to remove rate limit rule',
      message: errorMessage,
      requestId,
      timestamp: new Date().toISOString()
    });
  }
});

// ============================================================================
// CLEAR ALL LIMITS
// ============================================================================

// POST /rate-limiting/clear
router.post('/clear', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] as string || `req_${Date.now()}`;

  try {
    // Clear all rate limits
    await globalRateLimiter.clearAllLimits();

    const processingTime = Date.now() - startTime;

    structuredLogger.info('All rate limits cleared', {
      requestId,
      userId: req.user?.id,
      processingTime
    });

    res.json({
      success: true,
      message: 'All rate limits cleared successfully',
      requestId,
      timestamp: new Date().toISOString(),
      processingTime
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    structuredLogger.error('Failed to clear all rate limits', {
      error: errorMessage,
      requestId,
      userId: req.user?.id,
      processingTime
    });

    res.status(500).json({
      error: 'Failed to clear all rate limits',
      message: errorMessage,
      requestId,
      timestamp: new Date().toISOString()
    });
  }
});

export { router as rateLimitingRouter };
