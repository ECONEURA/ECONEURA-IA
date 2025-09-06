import { Router } from 'express';
import { getMetrics } from '../lib/observability.js';

const router = Router();

// GET /metrics - Prometheus metrics
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await getMetrics();
    res.set('Content-Type', 'text/plain');
    res.send(metrics);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get metrics',
      message: (error as Error).message
    });
  }
});

export { router as metricsRouter };
