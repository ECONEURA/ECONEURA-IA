import { PrismaClient } from '@prisma/client';
import { structuredLogger } from './structured-logger.js';

// Create a global variable to store the Prisma client
declare global {
  var __prisma: PrismaClient | undefined;
}

// Create Prisma client instance
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

// Use global variable in development to prevent multiple instances
const db = globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma = db;
}

// Set up Prisma logging
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

// Health check function
export const checkDatabaseHealth = async () => {
  try {
    await db.$queryRaw`SELECT 1`;
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error) {
    structuredLogger.error('Database health check failed', error as Error);
    return { 
      status: 'unhealthy', 
      timestamp: new Date().toISOString(),
      error: (error as Error).message 
    };
  }
};

// Set RLS context for multi-tenant queries
export const setRLSContext = async (orgId: string) => {
  try {
    await db.$executeRaw`SET LOCAL app.org_id = ${orgId}`;
  } catch (error) {
    structuredLogger.error('Failed to set RLS context', error as Error, { orgId });
    throw error;
  }
};

// Transaction wrapper with RLS context
export const withRLSTransaction = async <T>(
  orgId: string,
  fn: (tx: PrismaClient) => Promise<T>
): Promise<T> => {
  return await db.$transaction(async (tx) => {
    // Set RLS context for this transaction
    await tx.$executeRaw`SET LOCAL app.org_id = ${orgId}`;
    return await fn(tx);
  });
};

export { db };
export default db;