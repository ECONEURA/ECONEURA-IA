import { Router } from 'express';
import { z } from 'zod';
import { cacheWarmup } from '../lib/cache-warmup.service.js';
import { structuredLogger } from '../lib/structured-logger.js';

const router = Router();

// GET /v1/cache-warmup/stats - Get cache statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = cacheWarmup.getStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    structuredLogger.error('Failed to get cache stats', error as Error);
    res.status(500).json({
      error: 'Failed to get cache stats',
      message: (error as Error).message
    });
  }
});

// POST /v1/cache-warmup/warmup - Start cache warmup
router.post('/warmup', async (req, res) => {
  try {
    const results = await cacheWarmup.warmup();

    res.json({
      success: true,
      data: results,
      message: 'Cache warmup completed'
    });
  } catch (error) {
    structuredLogger.error('Failed to warmup cache', error as Error);
    res.status(500).json({
      error: 'Failed to warmup cache',
      message: (error as Error).message
    });
  }
});

// DELETE /v1/cache-warmup/clear - Clear cache
router.delete('/clear', async (req, res) => {
  try {
    await cacheWarmup.clear();

    res.json({
      success: true,
      message: 'Cache cleared successfully'
    });
  } catch (error) {
    structuredLogger.error('Failed to clear cache', error as Error);
    res.status(500).json({
      error: 'Failed to clear cache',
      message: (error as Error).message
    });
  }
});

// GET /v1/cache-warmup/:key - Get specific cache entry
router.get('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const value = await cacheWarmup.get(key);

    if (value === null) {
      return res.status(404).json({
        error: 'Cache entry not found',
        message: `No cache entry found for key: ${key}`
      });
    }

    res.json({
      success: true,
      data: {
        key,
        value
      }
    });
  } catch (error) {
    structuredLogger.error('Failed to get cache entry', error as Error, {
      key: req.params.key
    });
    res.status(500).json({
      error: 'Failed to get cache entry',
      message: (error as Error).message
    });
  }
});

// POST /v1/cache-warmup/:key - Set cache entry
router.post('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value, ttl } = req.body;

    if (value === undefined) {
      return res.status(400).json({
        error: 'Missing value',
        message: 'Value is required'
      });
    }

    const ttlMs = ttl || 300000; // Default 5 minutes

    await cacheWarmup.set(key, value, ttlMs);

    res.json({
      success: true,
      message: 'Cache entry set successfully',
      data: {
        key,
        ttl: ttlMs
      }
    });
  } catch (error) {
    structuredLogger.error('Failed to set cache entry', error as Error, {
      key: req.params.key
    });
    res.status(500).json({
      error: 'Failed to set cache entry',
      message: (error as Error).message
    });
  }
});

// DELETE /v1/cache-warmup/:key - Delete specific cache entry
router.delete('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    await cacheWarmup.delete(key);

    res.json({
      success: true,
      message: 'Cache entry deleted successfully'
    });
  } catch (error) {
    structuredLogger.error('Failed to delete cache entry', error as Error, {
      key: req.params.key
    });
    res.status(500).json({
      error: 'Failed to delete cache entry',
      message: (error as Error).message
    });
  }
});

// POST /v1/cache-warmup/invalidate - Invalidate cache by pattern
router.post('/invalidate', async (req, res) => {
  try {
    const { pattern } = req.body;

    if (!pattern) {
      return res.status(400).json({
        error: 'Missing pattern',
        message: 'Pattern is required'
      });
    }

    const invalidated = await cacheWarmup.invalidatePattern(pattern);

    res.json({
      success: true,
      message: 'Cache pattern invalidated successfully',
      data: {
        pattern,
        invalidated
      }
    });
  } catch (error) {
    structuredLogger.error('Failed to invalidate cache pattern', error as Error);
    res.status(500).json({
      error: 'Failed to invalidate cache pattern',
      message: (error as Error).message
    });
  }
});

export { router as cacheWarmupRouter };
