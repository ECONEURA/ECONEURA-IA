import { Router } from 'express';
import { z } from 'zod';
import { contactSchema } from '@econeura/shared/validation/crm';
// import { getContacts, createContact, ... } from '../../services/crm/contacts';

const router = Router();

// Middleware para validar x-org-id
router.use((req, res, next) => {
  if (!req.header('x-org-id')) {
    return res.status(400).json({ error: 'Missing x-org-id header' });
  }
  next();
});

// GET /crm/contacts?search=&page=&limit=
router.get('/', async (req, res) => {
  // const orgId = req.header('x-org-id');
  // const { search = '', page = 1, limit = 20 } = req.query;
  // const result = await getContacts({ orgId, search, page, limit });
  // res.json(result);
  res.json({ ok: true, message: 'List contacts (mock)' });
});

// POST /crm/contacts
router.post('/', async (req, res) => {
  try {
    const data = contactSchema.parse(req.body);
    // const orgId = req.header('x-org-id');
    // const created = await createContact({ ...data, orgId });
    // res.status(201).json(created);
    res.status(201).json({ ok: true, message: 'Contact created (mock)', data });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
