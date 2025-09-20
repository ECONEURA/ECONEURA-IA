import cron from 'node-cron';

export function startHilExpirer(getPrisma?: () => any) {
  // cada 5 minutos marca como failed las tareas expiradas
  cron.schedule('*/5 * * * *', async () => {
    try {
      if (!getPrisma) return;
      const prisma = getPrisma();
      const now = new Date();
      await prisma.hitl_task.updateMany({
        where: { expires_at: { lt: now }, state: { in: ['draft','pending_approval','approved','dispatched'] } },
        data: { state: 'failed' },
      });
    } catch {
      // no-op: evitar romper la app por errores de cron
    }
  });
}
