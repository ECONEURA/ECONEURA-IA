import { PrismaClient } from '@prisma/client';

import { structuredLogger } from './structured-logger.js';
const createPrismaClient = () => {
    return new PrismaClient({
        log: [
            { emit: 'event', level: 'query' },
            { emit: 'event', level: 'info' },
            { emit: 'event', level: 'warn' },
            { emit: 'event', level: 'error' },
        ],
    });
};
const db = globalThis.__prisma ?? createPrismaClient();
if (process.env.NODE_ENV === 'development') {
    globalThis.__prisma = db;
}
db.$on('query', (e) => {
    if (process.env.LOG_LEVEL === 'debug') {
        structuredLogger.debug('Database query', {
            query: e.query,
            params: e.params,
            duration: e.duration
        });
    }
});
db.$on('info', (e) => {
    structuredLogger.info('Database info', { message: e.message });
});
db.$on('warn', (e) => {
    structuredLogger.warn('Database warning', { message: e.message });
});
db.$on('error', (e) => {
    structuredLogger.error('Database error', new Error(e.message));
});
export const checkDatabaseHealth = async () => {
    try {
        await db.$queryRaw `SELECT 1`;
        return { status: 'healthy', timestamp: new Date().toISOString() };
    }
    catch (error) {
        structuredLogger.error('Database health check failed', error);
        return {
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error.message
        };
    }
};
export const setRLSContext = async (orgId) => {
    try {
        await db.$executeRaw `SET LOCAL app.org_id = ${orgId}`;
    }
    catch (error) {
        structuredLogger.error('Failed to set RLS context', error, { orgId });
        throw error;
    }
};
export const withRLSTransaction = async (orgId, fn) => {
    return await db.$transaction(async (tx) => {
        await tx.$executeRaw `SET LOCAL app.org_id = ${orgId}`;
        return await fn(tx);
    });
};
export { db };
export default db;
//# sourceMappingURL=database.js.map