import { MemoryRepository } from '../db/memory.repo';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';

export interface MemoryPutRequest {
  tenantId: string;
  userId: string;
  agentId: string;
  namespace: string;
  vector?: number[];
  text?: string;
  ttlSec?: number;
  meta?: Record<string, any>;
  idempotencyKey?: string;
}

export interface MemoryQueryRequest {
  tenantId: string;
  userId?: string;
  agentId?: string;
  namespace: string;
  query: string;
  topK?: number;
}

export interface MemoryEntry {
  id: string;
  tenantId: string;
  userId: string;
  agentId: string;
  namespace: string;
  vector?: number[];
  text?: string;
  meta?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

export interface MemoryMatch {
  id: string;
  score: number;
  text?: string;
  meta?: Record<string, any>;
}

export class MemoryService {
  private memoryRepo: MemoryRepository;

  constructor() {
    this.memoryRepo = new MemoryRepository();
  }

  /**
   * Store or update memory entry with idempotency support
   */
  async putMemory(request: MemoryPutRequest): Promise<{ id: string }> {
    const {
      tenantId,
      userId,
      agentId,
      namespace,
      vector,
      text,
      ttlSec,
      meta,
      idempotencyKey
    } = request;

    // Generate deterministic ID for idempotency
    let memoryId: string;
    if (idempotencyKey) {
      const hash = createHash('sha256')
        .update(`${tenantId}:${namespace}:${idempotencyKey}`)
        .digest('hex');
      memoryId = `mem-${hash.substring(0, 12)}`;
    } else {
      memoryId = `mem-${uuidv4()}`;
    }

    // Calculate expiration time if TTL provided
    const expiresAt = ttlSec ? new Date(Date.now() + ttlSec * 1000) : undefined;

    const memoryEntry: MemoryEntry = {
      id: memoryId,
      tenantId,
      userId,
      agentId,
      namespace,
      vector,
      text,
      meta,
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt
    };

    // Upsert memory entry
    await this.memoryRepo.upsertMemory(memoryEntry);

    return { id: memoryId };
  }

  /**
   * Query memory entries with vector similarity search
   */
  async queryMemory(request: MemoryQueryRequest): Promise<MemoryMatch[]> {
    const {
      tenantId,
      userId,
      agentId,
      namespace,
      query,
      topK = 5
    } = request;

    // Get memory entries with filters
    const entries = await this.memoryRepo.getMemoryEntries({
      tenantId,
      userId,
      agentId,
      namespace
    });

    // Filter out expired entries
    const now = new Date();
    const validEntries = entries.filter(entry => 
      !entry.expiresAt || entry.expiresAt > now
    );

    // Perform similarity search
    const matches = this.performSimilaritySearch(validEntries, query, topK);

    return matches;
  }

  /**
   * Perform similarity search using vector embeddings or text matching
   */
  private performSimilaritySearch(
    entries: MemoryEntry[],
    query: string,
    topK: number
  ): MemoryMatch[] {
    const matches: MemoryMatch[] = [];

    for (const entry of entries) {
      let score = 0;

      // Vector similarity (if available)
      if (entry.vector && entry.vector.length > 0) {
        // Simple text-to-vector conversion for demo
        // In production, use proper embedding model
        const queryVector = this.textToVector(query);
        score = this.cosineSimilarity(entry.vector, queryVector);
      }

      // Text similarity (fallback or additional scoring)
      if (entry.text) {
        const textScore = this.textSimilarity(query, entry.text);
        score = Math.max(score, textScore);
      }

      // Meta field matching
      if (entry.meta) {
        const metaScore = this.metaSimilarity(query, entry.meta);
        score = Math.max(score, metaScore);
      }

      if (score > 0.1) { // Minimum threshold
        matches.push({
          id: entry.id,
          score,
          text: entry.text,
          meta: entry.meta
        });
      }
    }

    // Sort by score and return top K
    return matches
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  /**
   * Convert text to vector (simplified implementation)
   */
  private textToVector(text: string): number[] {
    // Simplified vector representation
    // In production, use proper embedding model like OpenAI, Cohere, etc.
    const words = text.toLowerCase().split(/\s+/);
    const vector = new Array(128).fill(0);
    
    for (let i = 0; i < Math.min(words.length, 128); i++) {
      const hash = this.simpleHash(words[i]);
      vector[i] = (hash % 100) / 100; // Normalize to 0-1
    }
    
    return vector;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Calculate text similarity using simple word overlap
   */
  private textSimilarity(query: string, text: string): number {
    const queryWords = new Set(query.toLowerCase().split(/\s+/));
    const textWords = text.toLowerCase().split(/\s+/);
    
    let matches = 0;
    for (const word of textWords) {
      if (queryWords.has(word)) {
        matches++;
      }
    }
    
    return matches / Math.max(queryWords.size, textWords.length);
  }

  /**
   * Calculate metadata similarity
   */
  private metaSimilarity(query: string, meta: Record<string, any>): number {
    const queryLower = query.toLowerCase();
    let maxScore = 0;

    for (const [key, value] of Object.entries(meta)) {
      if (typeof value === 'string') {
        const valueLower = value.toLowerCase();
        if (valueLower.includes(queryLower)) {
          maxScore = Math.max(maxScore, 0.8);
        }
      }
    }

    return maxScore;
  }

  /**
   * Simple hash function for text-to-vector conversion
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}
