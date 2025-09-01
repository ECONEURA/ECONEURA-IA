import { PrismaClient } from '@prisma/client';
import { config } from '../config';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient({
  log: config.isDev ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'pretty',
});

if (config.isDev) {
  global.prisma = prisma;
}

// Middleware para RLS
prisma.$use(async (params, next) => {
  // Establecer el tenant ID para todas las operaciones
  if (params.action !== 'executeRaw' && params.action !== 'queryRaw') {
    await prisma.$executeRaw`SELECT set_config('app.current_tenant', ${params.args?.tenant || ''}, true)`;
  }

  const result = await next(params);

  // Limpiar el tenant ID después de la operación
  if (params.action !== 'executeRaw' && params.action !== 'queryRaw') {
    await prisma.$executeRaw`SELECT set_config('app.current_tenant', '', true)`;
  }

  return result;
});

// Middleware para soft delete
prisma.$use(async (params, next) => {
  if (params.action === 'delete') {
    params.action = 'update';
    params.args.data = { deletedAt: new Date() };
  }
  if (params.action === 'deleteMany') {
    params.action = 'updateMany';
    if (params.args.data !== undefined) {
      params.args.data.deletedAt = new Date();
    } else {
      params.args.data = { deletedAt: new Date() };
    }
  }
  return next(params);
});

// Helper para transacciones con tenant
export async function withTransaction<T>(
  tenant: string,
  callback: (tx: PrismaClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      SELECT set_config('app.current_tenant', ${tenant}, true);
      SELECT set_config('app.timestamp', NOW()::text, true);
    `;
    
    const result = await callback(tx);
    
    await tx.$executeRaw`
      SELECT set_config('app.current_tenant', '', true);
      SELECT set_config('app.timestamp', '', true);
    `;
    
    return result;
  });
}

// Helper para queries con tenant
export function withTenant<T extends Record<string, unknown>>(
  tenant: string,
  data: T
): T & { tenant: string } {
  return {
    ...data,
    tenant
  };
}
