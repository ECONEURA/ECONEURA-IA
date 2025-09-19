import { Router } from 'express';
const router = Router();
router.get('/ping', (req, res) => {
    res.json({
        success: true,
        message: 'pong',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});
export { router as pingRouter };
//# sourceMappingURL=ping.js.map