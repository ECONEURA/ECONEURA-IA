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

export class WebCache {
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
    console.log('Web cache system initialized', {
      type: config.type,
      ttl: config.ttl,
      maxSize: config.maxSize
    });
  }

  async get<T>(key: string): Promise<T | null> {
    const item = this.memoryCache.get(key);

    if (!item) {
      this.stats.misses++;
      return null;
    }

    const now = Date.now();
    const isExpired = (now - item.timestamp) > (item.ttl * 1000);

    if (isExpired) {
      this.memoryCache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update access stats
    item.accessCount++;
    item.lastAccessed = now;
    this.stats.hits++;

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
  }

  async delete(key: string): Promise<void> {
    const deleted = this.memoryCache.delete(key);
    if (deleted) {
      this.stats.deletes++;
    }
  }

  async clear(): Promise<void> {
    const size = this.memoryCache.size;
    this.memoryCache.clear();
    console.log('Web cache cleared', { previousSize: size });
  }

  async warmup(patterns: Array<{ key: string; value: any; ttl?: number }>): Promise<void> {
    console.log('Starting web cache warmup', { patternsCount: patterns.length });

    for (const pattern of patterns) {
      await this.set(pattern.key, pattern.value, pattern.ttl);
      this.stats.warmupItems++;
    }

    console.log('Web cache warmup completed', {
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
    }
  }
}

// Web AI Cache
export class WebAICache extends WebCache {
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
    ];

    const patterns = commonPrompts.map(cp => ({
      key: `ai:gpt-4:${this.hashPrompt(cp.prompt)}`,
      value: cp.response,
      ttl: cp.ttl,
    }));

    await this.warmup(patterns);
  }

  private hashPrompt(prompt: string): string {
    let hash = 0;
    for (let i = 0; i < prompt.length; i++) {
      const char = prompt.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}

// Web Search Cache
export class WebSearchCache extends WebCache {
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

// Web Cache Manager
export class WebCacheManager {
  private aiCache: WebAICache;
  private searchCache: WebSearchCache;
  private warmupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.aiCache = new WebAICache({
      type: 'memory',
      ttl: 3600, // 1 hour
      maxSize: 100,
    });

    this.searchCache = new WebSearchCache({
      type: 'memory',
      ttl: 1800, // 30 minutes
      maxSize: 50,
    });

    console.log('Web cache manager initialized');
  }

  getAICache(): WebAICache {
    return this.aiCache;
  }

  getSearchCache(): WebSearchCache {
    return this.searchCache;
  }

  async warmupAll(): Promise<void> {
    console.log('Starting comprehensive web cache warmup');

    await Promise.all([
      this.aiCache.warmupAI(),
      this.searchCache.warmupSearch(),
    ]);

    console.log('Comprehensive web cache warmup completed');
  }

  startPeriodicWarmup(intervalMinutes: number = 60): void {
    if (this.warmupInterval) {
      clearInterval(this.warmupInterval);
    }

    this.warmupInterval = setInterval(async () => {
      console.log('Running periodic web cache warmup');
      await this.warmupAll();
    }, intervalMinutes * 60 * 1000);

    console.log('Periodic web cache warmup started', { intervalMinutes });
  }

  stopPeriodicWarmup(): void {
    if (this.warmupInterval) {
      clearInterval(this.warmupInterval);
      this.warmupInterval = null;
      console.log('Periodic web cache warmup stopped');
    }
  }

  getStats() {
    return {
      ai: this.aiCache.getStats(),
      search: this.searchCache.getStats(),
    };
  }
}
