import { Router } from 'express';
import { getPrisma } from '@econeura/db/client.lazy';

const router = Router();

// Create a HITL task
router.post('/v1/hitl', async (req, res) => {
  const prisma = getPrisma();
  const { name, payload } = req.body || {};
  const task = await prisma.hITLTask.create({ data: { name: name || 'unnamed', payload: JSON.stringify(payload || {}) } });
  res.status(201).json(task);
});

// Get tasks
router.get('/v1/hitl', async (req, res) => {
  const prisma = getPrisma();
  const tasks = await prisma.hITLTask.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(tasks);
});

// Patch (cancel/complete)
router.patch('/v1/hitl/:id', async (req, res) => {
  const prisma = getPrisma();
  const id = Number(req.params.id);
  const data = req.body || {};
  const task = await prisma.hITLTask.update({ where: { id }, data });
  res.json(task);
});

export default router;
