import { Router } from 'express';

import { analytics } from '../services/analytics.service.js';
const router = Router();
router.get('/data', async (req, res) => {
    try {
        const data = await analytics.getAnalytics();
        res.json({ success: true, data });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get analytics' });
    }
});
export { router as analyticsRouter };
//# sourceMappingURL=analytics.js.map