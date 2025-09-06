import { Router } from 'express';

const router = Router();

// GET /health - Basic health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// GET /health/live - Liveness probe
router.get('/health/live', (req, res) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString()
  });
});

// GET /health/ready - Readiness probe
router.get('/health/ready', (req, res) => {
  // Check database connection, external services, etc.
  const isReady = true; // Simplified check
  
  if (isReady) {
    res.json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /health/degraded - Degraded mode check
router.get('/health/degraded', (req, res) => {
  // Check if system is in degraded mode
  const isDegraded = false; // Simplified check
  
  res.json({
    status: isDegraded ? 'degraded' : 'healthy',
    mode: isDegraded ? 'degraded' : 'normal',
    timestamp: new Date().toISOString()
  });
});

export { router as healthRouter };
