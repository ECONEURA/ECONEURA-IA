import { logger } from '../lib/logger.js';
export async function runAutoCancel() {
    if (!process.env.POSTGRES_URL && !process.env.DATABASE_URL) {
        logger.info('HIL auto-cancel skipped (no DB config)');
        return;
    }
    const { getPrisma } = await import('@econeura/db');
    const getPrismaFn = getPrisma;
    const prisma = getPrismaFn();
    if (!prisma?.hitl_task?.findMany)
        return;
    try {
        const now = new Date();
        const expired = await prisma.hitl_task.findMany({ where: { expires_at: { lt: now }, state: { not: 'failed' } } });
        for (const t of expired) {
            const id = t.id;
            if (!id)
                continue;
            await prisma.hitl_task.update({ where: { id }, data: { state: 'failed' } });
            await prisma.audit_event.create({ data: { task_id: id, type: 'auto_cancel', payload: { reason: 'expired' } } });
        }
        logger.info(`HIL auto-cancel processed ${expired.length} tasks`);
    }
    catch (err) {
        logger.warn('HIL auto-cancel failed', { error: err.message });
    }
}
//# sourceMappingURL=hil-autocancel.js.map