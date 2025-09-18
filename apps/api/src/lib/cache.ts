import { logger } from './logger.js';

export interface CacheConfig {
  type: 'memory' | 'redis';
  ttl: number; // seconds
  maxSize?: number; // for memory cache
  redisUrl?: string;
}

export interface CacheItem<T = any> {
  value: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

export class IntelligentCache {
  private memoryCache: Map<string, CacheItem> = new Map();
  private config: CacheConfig;
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    warmupItems: 0,
  };

  constructor(config: CacheConfig) {
    this.config = config;
    logger.info('Cache system initialized', { 
      type: config.type, 
      ttl: config.ttl,
      maxSize: config.maxSize 
    });
  }

  async get<T>(key: string): Promise<T | null> {
    const item = this.memoryCache.get(key);
    
    if (!item) {
      this.stats.misses++;
      logger.debug('Cache miss', { key, stats: this.stats });
      return null;
    }

    const now = Date.now();
    const isExpired = (now - item.timestamp) > (item.ttl * 1000);

    if (isExpired) {
      this.memoryCache.delete(key);
      this.stats.misses++;
      logger.debug('Cache expired', { key, age: now - item.timestamp });
      return null;
    }

    // Update access stats
    item.accessCount++;
    item.lastAccessed = now;
    this.stats.hits++;

    logger.debug('Cache hit', { 
      key, 
      accessCount: item.accessCount,
      age: now - item.timestamp,
      stats: this.stats 
    });

    return item.value as T;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const now = Date.now();
    const itemTtl = ttl || this.config.ttl;

    const item: CacheItem<T> = {
      value,
      timestamp: now,
      ttl: itemTtl,
      accessCount: 0,
      lastAccessed: now,
    };

    // Check memory limit for memory cache
    if (this.config.type === 'memory' && this.config.maxSize) {
      if (this.memoryCache.size >= this.config.maxSize) {
        this.evictLeastUsed();
      }
    }

    this.memoryCache.set(key, item);
    this.stats.sets++;

    logger.debug('Cache set', { 
      key, 
      ttl: itemTtl,
      cacheSize: this.memoryCache.size,
      stats: this.stats 
    });
  }

  async delete(key: string): Promise<void> {
    const deleted = this.memoryCache.delete(key);
    if (deleted) {
      this.stats.deletes++;
      logger.debug('Cache delete', { key, stats: this.stats });
    }
  }

  async clear(): Promise<void> {
    const size = this.memoryCache.size;
    this.memoryCache.clear();
    logger.info('Cache cleared', { previousSize: size });
  }

  async warmup(patterns: Array<{ key: string; value: any; ttl?: number }>): Promise<void> {
    logger.info('Starting cache warmup', { patternsCount: patterns.length });
    
    for (const pattern of patterns) {
      await this.set(pattern.key, pattern.value, pattern.ttl);
      this.stats.warmupItems++;
    }

    logger.info('Cache warmup completed', { 
      warmupItems: this.stats.warmupItems,
      totalItems: this.memoryCache.size 
    });
  }

  getStats() {
    return {
      ...this.stats,
      size: this.memoryCache.size,
      maxSize: this.config.maxSize,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
    };
  }

  private evictLeastUsed(): void {
    let leastUsedKey: string | null = null;
    let leastUsedScore = Infinity;

    for (const [key, item] of this.memoryCache.entries()) {
      // Score based on access count and last access time
      const score = item.accessCount * 0.3 + (Date.now() - item.lastAccessed) * 0.7;
      
      if (score < leastUsedScore) {
        leastUsedScore = score;
        leastUsedKey = key;
      }
    }

    if (leastUsedKey) {
      this.memoryCache.delete(leastUsedKey);
      logger.debug('Evicted least used item', { key: leastUsedKey, score: leastUsedScore });
    }
  }
}

// AI Cache with specific patterns
export class AICache extends IntelligentCache {
  constructor(config: CacheConfig) {
    super(config);
  }

  async getAIResponse(prompt: string, model: string): Promise<any | null> {
    const key = `ai:${model}:${this.hashPrompt(prompt)}`;
    return this.get(key);
  }

  async setAIResponse(prompt: string, model: string, response: any, ttl?: number): Promise<void> {
    const key = `ai:${model}:${this.hashPrompt(prompt)}`;
    await this.set(key, response, ttl);
  }

  async warmupAI(): Promise<void> {
    const commonPrompts = [
      {
        prompt: "What is artificial intelligence?",
        response: {
          content: "Artificial Intelligence (AI) is a branch of computer science that aims to create systems capable of performing tasks that typically require human intelligence.",
          model: "gpt-4",
          timestamp: Date.now(),
        },
        ttl: 3600, // 1 hour
      },
      {
        prompt: "Explain machine learning",
        response: {
          content: "Machine Learning is a subset of AI that enables computers to learn and improve from experience without being explicitly programmed.",
          model: "gpt-4",
          timestamp: Date.now(),
        },
        ttl: 3600,
      },
      {
        prompt: "How does neural networks work?",
        response: {
          content: "Neural networks are computing systems inspired by biological neural networks, consisting of interconnected nodes that process information.",
          model: "gpt-4",
          timestamp: Date.now(),
        },
        ttl: 3600,
      },
    ];

    const patterns = commonPrompts.map(cp => ({
      key: `ai:gpt-4:${this.hashPrompt(cp.prompt)}`,
      value: cp.response,
      ttl: cp.ttl,
    }));

    await this.warmup(patterns);
  }

  private hashPrompt(prompt: string): string {
    // Simple hash function for demo purposes
    let hash = 0;
    for (let i = 0; i < prompt.length; i++) {
      const char = prompt.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}

// Search Cache with specific patterns
export class SearchCache extends IntelligentCache {
  constructor(config: CacheConfig) {
    super(config);
  }

  async getSearchResults(query: string, filters?: any): Promise<any | null> {
    const key = `search:${this.hashQuery(query, filters)}`;
    return this.get(key);
  }

  async setSearchResults(query: string, results: any, filters?: any, ttl?: number): Promise<void> {
    const key = `search:${this.hashQuery(query, filters)}`;
    await this.set(key, results, ttl);
  }

  async warmupSearch(): Promise<void> {
    const commonQueries = [
      {
        query: "artificial intelligence",
        results: {
          items: [
            { title: "AI Fundamentals", url: "https://example.com/ai-fundamentals" },
            { title: "Machine Learning Basics", url: "https://example.com/ml-basics" },
          ],
          total: 2,
          timestamp: Date.now(),
        },
        ttl: 1800, // 30 minutes
      },
      {
        query: "machine learning",
        results: {
          items: [
            { title: "ML Algorithms", url: "https://example.com/ml-algorithms" },
            { title: "Deep Learning Guide", url: "https://example.com/deep-learning" },
          ],
          total: 2,
          timestamp: Date.now(),
        },
        ttl: 1800,
      },
      {
        query: "neural networks",
        results: {
          items: [
            { title: "Neural Network Architecture", url: "https://example.com/nn-architecture" },
            { title: "Backpropagation Explained", url: "https://example.com/backprop" },
          ],
          total: 2,
          timestamp: Date.now(),
        },
        ttl: 1800,
      },
    ];

    const patterns = commonQueries.map(cq => ({
      key: `search:${this.hashQuery(cq.query)}`,
      value: cq.results,
      ttl: cq.ttl,
    }));

    await this.warmup(patterns);
  }

  private hashQuery(query: string, filters?: any): string {
    const queryString = query + (filters ? JSON.stringify(filters) : '');
    let hash = 0;
    for (let i = 0; i < queryString.length; i++) {
      const char = queryString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}

// Cache manager for coordinating multiple caches
export class CacheManager {
  private aiCache: AICache;
  private searchCache: SearchCache;
  private warmupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.aiCache = new AICache({
      type: 'memory',
      ttl: 3600, // 1 hour
      maxSize: 1000,
    });

    this.searchCache = new SearchCache({
      type: 'memory',
      ttl: 1800, // 30 minutes
      maxSize: 500,
    });

    logger.info('Cache manager initialized');
  }

  getAICache(): AICache {
    return this.aiCache;
  }

  getSearchCache(): SearchCache {
    return this.searchCache;
  }

  async warmupAll(): Promise<void> {
    logger.info('Starting comprehensive cache warmup');
    
    await Promise.all([
      this.aiCache.warmupAI(),
      this.searchCache.warmupSearch(),
    ]);

    logger.info('Comprehensive cache warmup completed');
  }

  startPeriodicWarmup(intervalMinutes: number = 60): void {
    if (this.warmupInterval) {
      clearInterval(this.warmupInterval);
    }

    this.warmupInterval = setInterval(async () => {
      logger.info('Running periodic cache warmup');
      await this.warmupAll();
    }, intervalMinutes * 60 * 1000);

    logger.info('Periodic cache warmup started', { intervalMinutes });
  }

  stopPeriodicWarmup(): void {
    if (this.warmupInterval) {
      clearInterval(this.warmupInterval);
      this.warmupInterval = null;
      logger.info('Periodic cache warmup stopped');
    }
  }

  getStats() {
    return {
      ai: this.aiCache.getStats(),
      search: this.searchCache.getStats(),
    };
  }
}
