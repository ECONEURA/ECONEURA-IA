import { Router } from 'express';
import { healthCheck } from './middleware.js';/;
import { registry } from './metrics.js';/;
import { logger } from '../logging/index.js';
const monitoringRouter: Router = Router();
/
/**
 * Health check endpoint/
 *//
monitoringRouter.get('/health', healthCheck());
/
/**
 * Metrics endpoint/
 *//
monitoringRouter.get('/metrics', async (req, res) => {
  try {
    const metrics = await registry.metrics();
    res.set('Content-Type', registry.contentType);
    res.send(metrics);
  } catch (error) {
    logger.error('Failed to collect metrics', error as Error, {});
    res.status(500).send('Failed to collect metrics');
  }
});

export { monitoringRouter };
/