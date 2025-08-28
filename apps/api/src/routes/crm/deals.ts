import { Router } from 'express';
import { dealSchema } from '@econeura/shared/validation/crm';

const router = Router();

router.use((req, res, next) => {
  if (!req.header('x-org-id')) {
    return res.status(400).json({ error: 'Missing x-org-id header' });
  }
  next();
});

router.get('/', async (req, res) => {
  res.json({ ok: true, message: 'List deals (mock)' });
});

router.post('/', async (req, res) => {
  try {
    const data = dealSchema.parse(req.body);
    res.status(201).json({ ok: true, message: 'Deal created (mock)', data });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
