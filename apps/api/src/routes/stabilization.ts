import { Router } from 'express';
import { stabilization } from '../services/stabilization.service.js';

const router = Router();

router.post('/fix', async (req, res) => {
  try {
    const result = await stabilization.fixIssues();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fix issues' });
  }
});

export { router as stabilizationRouter };
