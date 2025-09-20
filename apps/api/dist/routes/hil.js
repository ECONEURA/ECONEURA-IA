import { Router } from 'express';
import { canTransition } from '../hil/service.js';
import { requireAAD } from '../middleware/aad.js';
const router = Router();
router.use('/v1/hitl', requireAAD);
router.use('/v1/hil', requireAAD);
router.post('/v1/hitl', async (req, res) => {
    const { getPrisma } = await import('@econeura/db');
    const getPrismaFn = getPrisma;
    const prisma = getPrismaFn();
    const { agent_key, org_id, sla_minutes, expires_at } = req.body || {};
    const task = await prisma.hitl_task.create({ data: { agent_key: agent_key || 'unknown', org_id: org_id || 'org:unknown', sla_minutes: sla_minutes ?? 120, expires_at: expires_at ? new Date(expires_at) : null } });
    return res.status(201).json(task);
});
router.post('/v1/hil', async (req, res) => {
    const { getPrisma } = await import('@econeura/db');
    const prisma = getPrisma();
    const { agent_key, org_id, sla_minutes, expires_at } = req.body || {};
    const task = await prisma.hitl_task.create({ data: { agent_key: agent_key || 'unknown', org_id: org_id || 'org:unknown', sla_minutes: sla_minutes ?? 120, expires_at: expires_at ? new Date(expires_at) : null } });
    return res.status(201).json(task);
});
router.get('/v1/hitl', async (req, res) => {
    const { getPrisma } = await import('@econeura/db');
    const prisma = getPrisma();
    const state = req.query.state;
    const where = state ? { state } : undefined;
    const tasks = await prisma.hitl_task.findMany({ where, orderBy: { created_at: 'desc' } });
    return res.json(tasks);
});
router.get('/v1/hil', async (req, res) => {
    const { getPrisma } = await import('@econeura/db');
    const prisma = getPrisma();
    const state = req.query.state;
    const where = state ? { state } : undefined;
    const tasks = await prisma.hitl_task.findMany({ where, orderBy: { created_at: 'desc' } });
    return res.json(tasks);
});
router.patch('/v1/hitl/:id', async (req, res) => {
    const { getPrisma } = await import('@econeura/db');
    const prisma = getPrisma();
    const id = req.params.id;
    const { to } = req.body || {};
    const task = await prisma.hitl_task.findUnique({ where: { id } });
    if (!task)
        return res.status(404).json({ error: 'not_found' });
    if (to && !canTransition(task.state, to))
        return res.status(400).json({ error: 'invalid_transition' });
    const updated = await prisma.hitl_task.update({ where: { id }, data: { state: to } });
    try {
        await prisma.audit_event.create({ data: { task_id: id, type: 'transition', payload: { from: task.state, to } } });
    }
    catch (e) {
    }
    return res.json(updated);
});
export default router;
//# sourceMappingURL=hil.js.map