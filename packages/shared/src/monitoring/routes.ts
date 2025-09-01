import { Router } from 'express';
import { healthCheck } from './middleware';
import { registry } from './metrics';
import { EconeuraLogger } from './logger';

const logger = new EconeuraLogger();
const monitoringRouter: Router = Router();

/**
 * Health check endpoint
 */
monitoringRouter.get('/health', healthCheck());

/**
 * Metrics endpoint
 */
monitoringRouter.get('/metrics', async (req, res) => {
  try {
    const metrics = await registry.metrics();
    res.set('Content-Type', registry.contentType);
    res.send(metrics);
  } catch (error) {
    logger.error('Failed to collect metrics', { error });
    res.status(500).send('Failed to collect metrics');
  }
});

export { monitoringRouter };
