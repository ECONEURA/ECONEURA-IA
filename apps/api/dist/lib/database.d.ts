import { PrismaClient } from '@prisma/client';
declare global {
    var __prisma: PrismaClient | undefined;
}
declare const db: PrismaClient;
export declare const checkDatabaseHealth: () => Promise<{
    status: string;
    timestamp: string;
    error?: undefined;
} | {
    status: string;
    timestamp: string;
    error: string;
}>;
export declare const setRLSContext: (orgId: string) => Promise<void>;
export declare const withRLSTransaction: <T>(orgId: string, fn: (tx: PrismaClient) => Promise<T>) => Promise<T>;
export { db };
export default db;
//# sourceMappingURL=database.d.ts.map