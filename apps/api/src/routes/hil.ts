import { Router, type Router as ExpressRouter } from 'express';
import { getPrisma } from '@econeura/db';
import { canTransition } from '../hil/service.js';
import { requireAAD } from '../middleware/aad.js';

const router: ExpressRouter = Router();

// Protect HIL endpoints with AAD when required
router.use('/v1/hitl', requireAAD);

// Create a HITL task (draft)
router.post('/v1/hitl', async (req, res) => {
  const prisma: any = getPrisma() as any;
  const { agent_key, org_id, sla_minutes, expires_at } = req.body || {};
  const task = await prisma.hitl_task.create({ data: { agent_key: agent_key || 'unknown', org_id: org_id || 'org:unknown', sla_minutes: sla_minutes ?? 120, expires_at: expires_at ? new Date(expires_at) : null } });
  return res.status(201).json(task);
});

// Get tasks (optionally filter by state)
router.get('/v1/hitl', async (req, res) => {
  const prisma: any = getPrisma() as any;
  const state = req.query.state as string | undefined;
  const where = state ? { state } : undefined;
  const tasks = await prisma.hitl_task.findMany({ where, orderBy: { created_at: 'desc' } });
  return res.json(tasks);
});

// Patch: attempt to transition state
router.patch('/v1/hitl/:id', async (req, res) => {
  const prisma: any = getPrisma() as any;
  const id = req.params.id;
  const { to } = req.body || {};
  const task = await prisma.hitl_task.findUnique({ where: { id } });
  if (!task) return res.status(404).json({ error: 'not_found' });
  if (to && !canTransition(task.state as any, to)) return res.status(400).json({ error: 'invalid_transition' });
  const updated = await prisma.hitl_task.update({ where: { id }, data: { state: to } });
  // record audit event
  await prisma.audit_event.create({ data: { task_id: id, type: 'transition', payload: { from: task.state, to } } as any });
  return res.json(updated);
});

export default router;
