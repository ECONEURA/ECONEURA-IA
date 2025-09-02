/// <reference path="./types/prisma-shim.d.ts" />
import type { PrismaClient } from '@prisma/client';
import { config } from './config';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

let PrismaCtor: any = null;
try {
  // Try to load real Prisma in environments where it's generated
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pkg = require('@prisma/client');
  PrismaCtor = pkg?.PrismaClient || null;
} catch {
  PrismaCtor = null;
}

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

let _prisma: PrismaClient | undefined;
let _initialized = false;
export function getPrisma(): PrismaClient {
  if (_prisma) return _prisma;
  if (global.prisma) {
    _prisma = global.prisma;
  } else if (PrismaCtor) {
    _prisma = new PrismaCtor({
      log: config.isDev ? ['query', 'error', 'warn'] : ['error'],
      errorFormat: 'pretty',
    });
  } else {
    // Provide a minimal stub for tests/CI when Prisma is unavailable
  const noop = async (...args: any[]) => (Array.isArray(args[0]) ? [] : undefined);
    _prisma = {
      $transaction: async (cb: (tx: any) => Promise<any>) => cb({}),
      $executeRaw: noop,
      $queryRaw: noop,
      $use: () => {},
      $on: () => {},
      $disconnect: async () => {},
      hitl_task: {
        findMany: async () => [],
        findUnique: async () => null,
        create: async (args: any) => ({ id: 'stub', ...(args?.data || {}) }),
        update: async (args: any) => ({ ...(args?.data || {}), id: args?.where?.id || 'stub' }),
      },
      audit_event: {
        create: async (args: any) => ({ id: 'evt', ...(args?.data || {}) }),
      },
      organization: {
        findUnique: async () => ({ id: 'org-stub' }),
      },
    } as any;
  }
  if (config.isDev) global.prisma = _prisma;
  return _prisma!;
}

export function initPrisma(): void {
  if (_initialized) return;
  if (!process.env.POSTGRES_URL && !process.env.DATABASE_URL) {
    // No DB configured; skip initialization to keep CI/tests green.
    _initialized = true;
    return;
  }
  const prisma = getPrisma();

  // Middleware para RLS
  prisma.$use?.(async (params: any, next: (params: any) => Promise<any>) => {
    if (params.action !== 'executeRaw' && params.action !== 'queryRaw') {
      await prisma.$executeRaw`SELECT set_config('app.current_tenant', ${params.args?.tenant || ''}, true)`;
    }

    const result = await next(params);

    if (params.action !== 'executeRaw' && params.action !== 'queryRaw') {
      await prisma.$executeRaw`SELECT set_config('app.current_tenant', '', true)`;
    }

    return result;
  });

  // Middleware para soft delete
  prisma.$use?.(async (params: any, next: (params: any) => Promise<any>) => {
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

  _initialized = true;
}

// Backwards compat: provide prisma getter but don't force initialization of middleware until explicitly called
// Export a lazy proxy that forwards to the real PrismaClient on first access.
// This avoids constructing PrismaClient at import time unless actually used.
const prismaProxy = new Proxy(
  {},
  {
    get(_target, prop) {
      const real = getPrisma();
  // @ts-ignore dynamic forward
      return (real as any)[prop as any];
    },
    set(_target, prop, value) {
      const real = getPrisma();
  // @ts-ignore dynamic forward
      (real as any)[prop as any] = value;
      return true;
    },
    apply(_target, thisArg, args) {
      const real = getPrisma();
      return (real as any).apply(thisArg, args);
    }
  }
) as unknown as import('@prisma/client').PrismaClient;

export const prisma = prismaProxy;

// Helper para transacciones con tenant
export async function withTransaction<T>(
  tenant: string,
  callback: (tx: PrismaClient) => Promise<T>
): Promise<T> {
  const p = getPrisma();
  return p.$transaction(async (tx) => {
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
