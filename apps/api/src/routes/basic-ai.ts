import { Router } from 'express';
import { basicAI } from '../services/basic-ai.service.js';

const router = Router();

router.post('/generate', async (req, res) => {
  try {
    const { prompt } = req.body;
    const response = await basicAI.generateResponse(prompt);
    res.json({ success: true, data: response });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

export { router as basicAIRouter };
