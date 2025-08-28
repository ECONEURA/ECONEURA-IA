/**
 * Prisma Service - Database connection and client management
 * ECONEURA API - CRM Database Service
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@econeura/shared/logging';

// Global Prisma instance for hot reloading in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Prisma client configuration
const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Event listeners for logging
prisma.$on('query', (e) => {
  logger.debug('Prisma Query', {
    query: e.query,
    params: e.params,
    duration: e.duration,
  });
});

prisma.$on('error', (e) => {
  logger.error('Prisma Error', new Error(e.message), {
    target: e.target,
  });
});

prisma.$on('info', (e) => {
  logger.info('Prisma Info', {
    message: e.message,
    target: e.target,
  });
});

prisma.$on('warn', (e) => {
  logger.warn('Prisma Warning', {
    message: e.message,
    target: e.target,
  });
});

// Store prisma instance in global for development hot reloading
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Connection helper
export async function connectDatabase() {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
    
    // Test the connection
    await prisma.$queryRaw`SELECT 1`;
    logger.info('Database connection verified');
    
    return true;
  } catch (error) {
    logger.error('Database connection failed', error instanceof Error ? error : new Error(String(error)));
    return false;
  }
}

// Disconnection helper
export async function disconnectDatabase() {
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected successfully');
  } catch (error) {
    logger.error('Database disconnection error', error instanceof Error ? error : new Error(String(error)));
  }
}

// Health check helper
export async function checkDatabaseHealth() {
  try {
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      responseTimeMs: responseTime,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    };
  }
}

// Database metrics helper
export async function getDatabaseMetrics() {
  try {
    const [
      userCount,
      organizationCount,
      contactCount,
      companyCount,
      dealCount,
      activityCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.organization.count(),
      prisma.contact.count(),
      prisma.company.count(),
      prisma.deal.count(),
      prisma.activity.count(),
    ]);

    return {
      entities: {
        users: userCount,
        organizations: organizationCount,
        contacts: contactCount,
        companies: companyCount,
        deals: dealCount,
        activities: activityCount,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Failed to get database metrics', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

export { prisma };
export default prisma;