import { Router } from 'express';
import { activitySchema } from '@econeura/shared/validation/crm';

const router = Router();

router.use((req, res, next) => {
  if (!req.header('x-org-id')) {
    return res.status(400).json({ error: 'Missing x-org-id header' });
  }
  next();
});

router.get('/', async (req, res) => {
  res.json({ ok: true, message: 'List activities (mock)' });
});

router.post('/', async (req, res) => {
  try {
    const data = activitySchema.parse(req.body);
    res.status(201).json({ ok: true, message: 'Activity created (mock)', data });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
