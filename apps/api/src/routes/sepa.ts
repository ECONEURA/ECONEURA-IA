import { Router, type Router as ExpressRouter, type Request, type Response } from 'express';
import { asyncHandler } from '../lib/errors';
import { importAndReconcile } from '../services/sepa';
import { logger } from '../lib/logger';

const router: ExpressRouter = Router();

router.post('/import', asyncHandler(async (req: Request, res: Response) => {
  const maybeBody = req.body as unknown;
  const maybeFile = (req as Request & { file?: { buffer?: Buffer } }).file;
  const content = (typeof maybeBody === 'string') ? maybeBody : (maybeFile?.buffer?.toString?.() || '');
  const type = (req.headers['content-type'] as string | undefined)?.includes('xml') ? 'camt' : 'mt940';
  if (!content) return res.status(400).json({ error: 'No content provided' });

  try {
  const summary = await importAndReconcile(content, type as 'camt' | 'mt940');
    res.json({ ok: true, summary });
  } catch (err) {
    const e = err as Error;
    logger.error('SEPA import failed', { error: e.message });
    res.status(500).json({ error: e.message });
  }
}));

export default router;
