// Minimal Prisma client type stub for typecheck in CI; replace with @prisma/client types in follow-up
declare module '@prisma/client' {
  export class PrismaClient {
    constructor(options?: any);
    $transaction<T>(cb: (tx: any) => Promise<T>): Promise<T>;
    $executeRaw(strings: any, ...args: any[]): Promise<any>;
    $queryRaw(strings: any, ...args: any[]): Promise<any>;
    $use(fn: any): void;
    $on(event: string, cb: (...args: any[]) => void): void;
    $disconnect(): Promise<void>;
    // Minimal model maps used by API codepaths
    hitl_task?: {
      findMany: (args?: any) => Promise<any[]>;
      findUnique: (args: any) => Promise<any | null>;
      create: (args: any) => Promise<any>;
      update: (args: any) => Promise<any>;
    };
    audit_event?: {
      create: (args: any) => Promise<any>;
    };
    organization?: {
      findUnique: (args: any) => Promise<any | null>;
    };
  }
  export type Prisma = any;
}
