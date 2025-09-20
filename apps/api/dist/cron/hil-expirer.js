import cron from 'node-cron';
export function startHilExpirer(getPrisma) {
    cron.schedule('*/5 * * * *', async () => {
        try {
            if (!getPrisma)
                return;
            const prisma = getPrisma();
            const now = new Date();
            await prisma.hitl_task.updateMany({
                where: { expires_at: { lt: now }, state: { in: ['draft', 'pending_approval', 'approved', 'dispatched'] } },
                data: { state: 'failed' },
            });
        }
        catch {
        }
    });
}
//# sourceMappingURL=hil-expirer.js.map