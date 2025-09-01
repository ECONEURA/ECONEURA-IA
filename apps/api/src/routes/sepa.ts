import { Router } from 'express';
import { asyncHandler } from '../lib/errors';
import { importAndReconcile } from '../services/sepa';
import { logger } from '../lib/logger';

const router = Router();

router.post('/import', asyncHandler(async (req, res) => {
  const content = (req.body && typeof req.body === 'string') ? req.body : req.file?.buffer?.toString() || '';
  const type = req.headers['content-type']?.includes('xml') ? 'camt' : 'mt940';
  if (!content) return res.status(400).json({ error: 'No content provided' });

  try {
    const summary = await importAndReconcile(content, type as any);
    res.json({ ok: true, summary });
  } catch (err) {
    const e = err as Error;
    logger.error('SEPA import failed', { error: e.message });
    res.status(500).json({ error: e.message });
  }
}));

export default router;
