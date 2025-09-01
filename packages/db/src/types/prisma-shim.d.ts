// Minimal Prisma client type stub for typecheck in CI; replace with @prisma/client types in follow-up
declare module '@prisma/client' {
  export class PrismaClient {
    constructor(options?: any);
    $transaction<T>(cb: (tx: any) => Promise<T>): Promise<T>;
    $executeRaw(strings: any, ...args: any[]): Promise<any>;
    $use(fn: any): void;
    $on(event: string, cb: (...args: any[]) => void): void;
    $disconnect(): Promise<void>;
  }
  export type Prisma = any;
}
