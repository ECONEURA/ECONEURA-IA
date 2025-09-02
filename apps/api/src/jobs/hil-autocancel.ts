import { logger } from '../lib/logger.js';
import { getPrisma } from '@econeura/db';

export async function runAutoCancel() {
  // Guard: do nothing if no DB configured
  if (!process.env.POSTGRES_URL && !process.env.DATABASE_URL) {
    logger.info('HIL auto-cancel skipped (no DB config)');
    return;
  }
  const prisma: any = getPrisma() as any;
  if (!prisma?.hitl_task?.findMany) return;
  // best-effort: mark expired tasks as failed
  try {
    const now = new Date();
    const expired = await prisma.hitl_task.findMany({ where: { expires_at: { lt: now }, state: { not: 'failed' } } });
    for (const t of expired) {
      await prisma.hitl_task.update({ where: { id: (t as any).id }, data: { state: 'failed' } });
      await prisma.audit_event.create({ data: { task_id: (t as any).id, type: 'auto_cancel', payload: { reason: 'expired' } } as any });
    }
    logger.info(`HIL auto-cancel processed ${expired.length} tasks`);
  } catch (err) {
    logger.warn('HIL auto-cancel failed', { error: (err as Error).message });
  }
}

