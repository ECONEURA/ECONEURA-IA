import { Router } from 'express';
export const makeHealthRouter = Router();
makeHealthRouter.get('/v1/integrations/make/health', async (_req, res) => {
    const ok = Boolean(process.env.MAKE_SIGNING_SECRET);
    res.setHeader('X-System-Mode', ok ? 'OK' : 'DEGRADED');
    return res.status(ok ? 200 : 503).json({ status: ok ? 'ok' : 'degraded' });
});
export default makeHealthRouter;
//# sourceMappingURL=integrations.make.health.js.map