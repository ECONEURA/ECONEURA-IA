import { Router } from 'express';
import { azureIntegration } from '../services/azure-integration.service.js';

const router = Router();

router.get('/status', async (req, res) => {
  try {
    const status = await azureIntegration.connectToAzure();
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get Azure status' });
  }
});

export { router as azureIntegrationRouter };
