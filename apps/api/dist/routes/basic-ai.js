import { Router } from 'express';
import { basicAIService } from '../lib/basic-ai/basic-ai.service.js';
const router = Router();
router.post('/generate', async (req, res) => {
    try {
        const { prompt } = req.body;
        const response = await basicAIService.generateResponse(prompt);
        res.json({ success: true, data: response });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to generate response' });
    }
});
export { router as basicAIRouter };
//# sourceMappingURL=basic-ai.js.map