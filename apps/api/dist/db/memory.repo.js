import { z } from 'zod';
export const MemoryRecordSchema = z.object({
    id: z.string(),
    tenantId: z.string(),
    userId: z.string().optional(),
    agentId: z.string().optional(),
    namespace: z.string(),
    vector: z.array(z.number()).optional(),
    text: z.string().optional(),
    ttlSec: z.number().optional(),
    meta: z.record(z.any()).optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
    expiresAt: z.date().optional(),
});
export const MemoryPutRequestSchema = z.object({
    tenantId: z.string(),
    userId: z.string().optional(),
    agentId: z.string().optional(),
    namespace: z.string(),
    vector: z.array(z.number()).optional(),
    text: z.string().optional(),
    ttlSec: z.number().optional(),
    meta: z.record(z.any()).optional(),
});
export const MemoryQueryRequestSchema = z.object({
    tenantId: z.string(),
    userId: z.string().optional(),
    agentId: z.string().optional(),
    namespace: z.string(),
    query: z.string(),
    topK: z.number().optional().default(10),
});
class MemoryRepository {
    records = new Map();
    indices = new Map();
    async put(request, idempotencyKey) {
        const id = idempotencyKey || this.generateId();
        const now = new Date();
        const expiresAt = request.ttlSec ? new Date(now.getTime() + request.ttlSec * 1000) : undefined;
        const record = {
            id,
            tenantId: request.tenantId,
            userId: request.userId,
            agentId: request.agentId,
            namespace: request.namespace,
            vector: request.vector,
            text: request.text,
            ttlSec: request.ttlSec,
            meta: request.meta,
            createdAt: now,
            updatedAt: now,
            expiresAt,
        };
        const key = `${request.tenantId}:${request.namespace}:${id}`;
        this.records.set(key, record);
        this.updateIndices(record);
        return { ok: true, id };
    }
    async query(request) {
        const matches = [];
        const indexKey = `${request.tenantId}:${request.namespace}`;
        const recordIds = this.indices.get(indexKey) || new Set();
        for (const recordId of recordIds) {
            const key = `${request.tenantId}:${request.namespace}:${recordId}`;
            const record = this.records.get(key);
            if (!record)
                continue;
            if (record.expiresAt && record.expiresAt < new Date()) {
                this.records.delete(key);
                continue;
            }
            if (request.userId && record.userId !== request.userId)
                continue;
            if (request.agentId && record.agentId !== request.agentId)
                continue;
            const score = this.calculateSimilarity(request.query, record.text || '');
            if (score > 0.1) {
                matches.push({
                    id: record.id,
                    score,
                    text: record.text,
                    meta: record.meta,
                });
            }
        }
        matches.sort((a, b) => b.score - a.score);
        return { matches: matches.slice(0, request.topK) };
    }
    generateId() {
        return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    updateIndices(record) {
        const tenantIndex = this.indices.get(record.tenantId) || new Set();
        tenantIndex.add(record.id);
        this.indices.set(record.tenantId, tenantIndex);
        const namespaceIndex = this.indices.get(`${record.tenantId}:${record.namespace}`) || new Set();
        namespaceIndex.add(record.id);
        this.indices.set(`${record.tenantId}:${record.namespace}`, namespaceIndex);
    }
    calculateSimilarity(query, text) {
        const queryWords = query.toLowerCase().split(/\s+/);
        const textWords = text.toLowerCase().split(/\s+/);
        let matches = 0;
        for (const queryWord of queryWords) {
            if (textWords.some(word => word.includes(queryWord) || queryWord.includes(word))) {
                matches++;
            }
        }
        return matches / queryWords.length;
    }
    async cleanup() {
        const now = new Date();
        for (const [key, record] of this.records.entries()) {
            if (record.expiresAt && record.expiresAt < now) {
                this.records.delete(key);
            }
        }
    }
}
export const memoryRepo = new MemoryRepository();
//# sourceMappingURL=memory.repo.js.map