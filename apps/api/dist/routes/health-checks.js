import { Router } from 'express';

import { healthChecks } from '../services/health-checks.service.js';
const router = Router();
router.get('/status', async (req, res) => {
    try {
        const status = await healthChecks.getHealthStatus();
        res.json({ success: true, data: status });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get health status' });
    }
});
export { router as healthChecksRouter };
//# sourceMappingURL=health-checks.js.map