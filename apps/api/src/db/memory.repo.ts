import { z } from 'zod';

// Schemas de validación
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

export type MemoryRecord = z.infer<typeof MemoryRecordSchema>;
export type MemoryPutRequest = z.infer<typeof MemoryPutRequestSchema>;
export type MemoryQueryRequest = z.infer<typeof MemoryQueryRequestSchema>;

// Simulación de base de datos en memoria
class MemoryRepository {
  private records: Map<string, MemoryRecord> = new Map();
  private indices: Map<string, Set<string>> = new Map();

  async put(request: MemoryPutRequest, idempotencyKey?: string): Promise<{ ok: boolean; id: string }> {
    const id = idempotencyKey || this.generateId();
    const now = new Date();
    const expiresAt = request.ttlSec ? new Date(now.getTime() + request.ttlSec * 1000) : undefined;

    const record: MemoryRecord = {
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

    // Upsert por (tenantId, namespace, id)
    const key = `${request.tenantId}:${request.namespace}:${id}`;
    this.records.set(key, record);

    // Actualizar índices
    this.updateIndices(record);

    return { ok: true, id };
  }

  async query(request: MemoryQueryRequest): Promise<{ matches: Array<{ id: string; score: number; text?: string; meta?: Record<string, any> }> }> {
    const matches: Array<{ id: string; score: number; text?: string; meta?: Record<string, any> }> = [];

    // Buscar por tenantId y namespace
    const indexKey = `${request.tenantId}:${request.namespace}`;
    const recordIds = this.indices.get(indexKey) || new Set();

    for (const recordId of recordIds) {
      const key = `${request.tenantId}:${request.namespace}:${recordId}`;
      const record = this.records.get(key);

      if (!record) continue;

      // Verificar TTL
      if (record.expiresAt && record.expiresAt < new Date()) {
        this.records.delete(key);
        continue;
      }

      // Filtros opcionales
      if (request.userId && record.userId !== request.userId) continue;
      if (request.agentId && record.agentId !== request.agentId) continue;

      // Simular búsqueda por similitud (en producción usaría vector search)
      const score = this.calculateSimilarity(request.query, record.text || '');
      
      if (score > 0.1) { // Umbral mínimo
        matches.push({
          id: record.id,
          score,
          text: record.text,
          meta: record.meta,
        });
      }
    }

    // Ordenar por score descendente y limitar
    matches.sort((a, b) => b.score - a.score);
    return { matches: matches.slice(0, request.topK) };
  }

  private generateId(): string {
    return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private updateIndices(record: MemoryRecord): void {
    // Índice por tenantId
    const tenantIndex = this.indices.get(record.tenantId) || new Set();
    tenantIndex.add(record.id);
    this.indices.set(record.tenantId, tenantIndex);

    // Índice por tenantId:namespace
    const namespaceIndex = this.indices.get(`${record.tenantId}:${record.namespace}`) || new Set();
    namespaceIndex.add(record.id);
    this.indices.set(`${record.tenantId}:${record.namespace}`, namespaceIndex);
  }

  private calculateSimilarity(query: string, text: string): number {
    // Simulación simple de similitud (en producción usaría embeddings)
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

  // Método para limpiar registros expirados
  async cleanup(): Promise<void> {
    const now = new Date();
    for (const [key, record] of this.records.entries()) {
      if (record.expiresAt && record.expiresAt < now) {
        this.records.delete(key);
      }
    }
  }
}

export const memoryRepo = new MemoryRepository();
