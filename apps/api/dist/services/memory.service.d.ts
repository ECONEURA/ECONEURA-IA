import { MemoryPutRequest, MemoryQueryRequest } from '../db/memory.repo.js';
export declare class MemoryService {
    putMemory(request: MemoryPutRequest, idempotencyKey?: string): Promise<{
        ok: boolean;
        id: string;
        timestamp: string;
    }>;
    queryMemory(request: MemoryQueryRequest): Promise<{
        matches: {
            id: string;
            score: number;
            text?: string;
            meta?: Record<string, any>;
        }[];
        query: any;
        namespace: any;
        timestamp: string;
        totalMatches: number;
    }>;
    getMemoryStats(tenantId: string): Promise<{
        tenantId: string;
        totalRecords: number;
        namespaces: any[];
        lastUpdated: string;
    }>;
    cleanupExpiredMemories(): Promise<{
        ok: boolean;
        timestamp: string;
    }>;
}
export declare const memoryService: MemoryService;
//# sourceMappingURL=memory.service.d.ts.map