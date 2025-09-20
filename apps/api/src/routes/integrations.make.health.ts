import { Router, type Router as ExpressRouter } from 'express';

// Router de salud para integraciones con Make. Implementación mínima y estable para CI.
export const makeHealthRouter: ExpressRouter = Router();

makeHealthRouter.get('/v1/integrations/make/health', async (_req, res) => {
  const ok = Boolean(process.env.MAKE_SIGNING_SECRET);
  res.setHeader('X-System-Mode', ok ? 'OK' : 'DEGRADED');
  return res.status(ok ? 200 : 503).json({ status: ok ? 'ok' : 'degraded' });
});

export default makeHealthRouter;
