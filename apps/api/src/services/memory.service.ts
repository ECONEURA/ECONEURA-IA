import { z } from 'zod';

import { memoryRepo, MemoryPutRequest, MemoryQueryRequest } from '../db/memory.repo.js';

export class MemoryService {
  async putMemory(request: MemoryPutRequest, idempotencyKey?: string) {
    try {
      // Validar request
      const validatedRequest = MemoryPutRequest.parse(request);
      
      // Verificar que al menos vector o text esté presente
      if (!validatedRequest.vector && !validatedRequest.text) {
        throw new Error('Either vector or text must be provided');
      }

      const result = await memoryRepo.put(validatedRequest, idempotencyKey);
      
      return {
        ok: result.ok,
        id: result.id,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
      }
      throw error;
    }
  }

  async queryMemory(request: MemoryQueryRequest) {
    try {
      // Validar request
      const validatedRequest = MemoryQueryRequest.parse(request);
      
      const result = await memoryRepo.query(validatedRequest);
      
      return {
        matches: result.matches,
        query: validatedRequest.query,
        namespace: validatedRequest.namespace,
        timestamp: new Date().toISOString(),
        totalMatches: result.matches.length,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
      }
      throw error;
    }
  }

  async getMemoryStats(tenantId: string) {
    try {
      // En una implementación real, esto consultaría la base de datos
      return {
        tenantId,
        totalRecords: 0, // Placeholder
        namespaces: [], // Placeholder
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Failed to get memory stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async cleanupExpiredMemories() {
    try {
      await memoryRepo.cleanup();
      return {
        ok: true,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Failed to cleanup expired memories: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const memoryService = new MemoryService();
