import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
    errorFormat: 'pretty',
});
await prisma.$connect();
export function getDatabaseService() {
    return prisma;
}
export default prisma;
//# sourceMappingURL=database.service.js.map