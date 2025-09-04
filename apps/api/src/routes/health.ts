import { Router } from 'express';
import { healthController } from '../controllers/health';

const router = Router();

// GET /health - Health check endpoint
router.get('/', healthController.getHealth);

// GET /health/ready - Readiness check
router.get('/ready', healthController.getReadiness);

// GET /health/live - Liveness check
router.get('/live', healthController.getLiveness);

export default router;
