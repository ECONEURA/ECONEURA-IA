import { getPrisma } from '@econeura/db/client.lazy';

export async function runAutoCancel() {
  const prisma = getPrisma();
  // cancel tasks older than 24h and still open
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  await prisma.hITLTask.updateMany({ where: { status: 'open', createdAt: { lt: cutoff } }, data: { status: 'cancelled' } });
}
