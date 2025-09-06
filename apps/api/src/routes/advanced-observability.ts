import { Router } from 'express';
import { advancedObservability } from '../services/advanced-observability.service.js';

const router = Router();

router.get('/metrics', async (req, res) => {
  try {
    const metrics = await advancedObservability.getMetrics();
    res.json({ success: true, data: metrics });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get observability metrics' });
  }
});

export { router as advancedObservabilityRouter };
