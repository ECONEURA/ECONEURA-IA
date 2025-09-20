import { z } from 'zod';
export declare const MemoryRecordSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    userId: z.ZodOptional<z.ZodString>;
    agentId: z.ZodOptional<z.ZodString>;
    namespace: z.ZodString;
    vector: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    text: z.ZodOptional<z.ZodString>;
    ttlSec: z.ZodOptional<z.ZodNumber>;
    meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    expiresAt: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    userId?: string;
    text?: string;
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    meta?: Record<string, any>;
    expiresAt?: Date;
    tenantId?: string;
    agentId?: string;
    namespace?: string;
    vector?: number[];
    ttlSec?: number;
}, {
    userId?: string;
    text?: string;
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    meta?: Record<string, any>;
    expiresAt?: Date;
    tenantId?: string;
    agentId?: string;
    namespace?: string;
    vector?: number[];
    ttlSec?: number;
}>;
export declare const MemoryPutRequestSchema: z.ZodObject<{
    tenantId: z.ZodString;
    userId: z.ZodOptional<z.ZodString>;
    agentId: z.ZodOptional<z.ZodString>;
    namespace: z.ZodString;
    vector: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    text: z.ZodOptional<z.ZodString>;
    ttlSec: z.ZodOptional<z.ZodNumber>;
    meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    userId?: string;
    text?: string;
    meta?: Record<string, any>;
    tenantId?: string;
    agentId?: string;
    namespace?: string;
    vector?: number[];
    ttlSec?: number;
}, {
    userId?: string;
    text?: string;
    meta?: Record<string, any>;
    tenantId?: string;
    agentId?: string;
    namespace?: string;
    vector?: number[];
    ttlSec?: number;
}>;
export declare const MemoryQueryRequestSchema: z.ZodObject<{
    tenantId: z.ZodString;
    userId: z.ZodOptional<z.ZodString>;
    agentId: z.ZodOptional<z.ZodString>;
    namespace: z.ZodString;
    query: z.ZodString;
    topK: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    query?: string;
    userId?: string;
    tenantId?: string;
    agentId?: string;
    namespace?: string;
    topK?: number;
}, {
    query?: string;
    userId?: string;
    tenantId?: string;
    agentId?: string;
    namespace?: string;
    topK?: number;
}>;
export type MemoryRecord = z.infer<typeof MemoryRecordSchema>;
export type MemoryPutRequest = z.infer<typeof MemoryPutRequestSchema>;
export type MemoryQueryRequest = z.infer<typeof MemoryQueryRequestSchema>;
declare class MemoryRepository {
    private records;
    private indices;
    put(request: MemoryPutRequest, idempotencyKey?: string): Promise<{
        ok: boolean;
        id: string;
    }>;
    query(request: MemoryQueryRequest): Promise<{
        matches: Array<{
            id: string;
            score: number;
            text?: string;
            meta?: Record<string, any>;
        }>;
    }>;
    private generateId;
    private updateIndices;
    private calculateSimilarity;
    cleanup(): Promise<void>;
}
export declare const memoryRepo: MemoryRepository;
export {};
//# sourceMappingURL=memory.repo.d.ts.map