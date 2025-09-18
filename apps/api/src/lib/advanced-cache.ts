// Advanced Caching Layer for ECONEURA
import { structuredLogger } from './structured-logger.js';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  maxSize?: number; // Maximum number of items
  strategy?: 'lru' | 'lfu' | 'fifo'; // Eviction strategy
  serialize?: boolean; // Whether to serialize/deserialize values
  compress?: boolean; // Whether to compress values
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
  hitRate: number;
  size: number;
  maxSize: number;
  memoryUsage: number;
}

export class AdvancedCache {
  private cache: Map<string, any; timestamp: number; accessCount: number; lastAccessed: number> = new Map();
  private options: Required<CacheOptions>;
  private stats: CacheStats;

  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: options.ttl || 3600, // 1 hour default
      maxSize: options.maxSize || 1000,
      strategy: options.strategy || 'lru',
      serialize: options.serialize || false,
      compress: options.compress || false
    };

    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      hitRate: 0,
      size: 0,
      maxSize: this.options.maxSize,
      memoryUsage: 0
    };

    // Start cleanup interval
    setInterval(() => {
      this.cleanup();
    }, 60000); // Cleanup every minute
  }

  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > this.options.ttl * 1000) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => {
      this.cache.delete(key);
      this.stats.evictions++;
    });

    this.updateStats();
  }

  private updateStats(): void {
    this.stats.size = this.cache.size;
    this.stats.hitRate = this.stats.hits / (this.stats.hits + this.stats.misses) || 0;
    this.stats.memoryUsage = this.estimateMemoryUsage();
  }

  private estimateMemoryUsage(): number {
    let usage = 0;
    for (const [key, item] of this.cache.entries()) {
      usage += key.length * 2; // UTF-16 string
      usage += JSON.stringify(item.value).length * 2;
      usage += 24; // Object overhead
    }
    return usage;
  }

  private evict(): void {
    if (this.cache.size < this.options.maxSize) {
      return;
    }

    let keyToEvict: string | null = null;

    switch (this.options.strategy) {
      case 'lru':
        keyToEvict = this.findLRUKey();
        break;
      case 'lfu':
        keyToEvict = this.findLFUKey();
        break;
      case 'fifo':
        keyToEvict = this.findFIFOKey();
        break;
    }

    if (keyToEvict) {
      this.cache.delete(keyToEvict);
      this.stats.evictions++;
    }
  }

  private findLRUKey(): string | null {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.lastAccessed < oldestTime) {
        oldestTime = item.lastAccessed;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  private findLFUKey(): string | null {
    let leastFrequentKey: string | null = null;
    let leastFrequentCount = Infinity;

    for (const [key, item] of this.cache.entries()) {
      if (item.accessCount < leastFrequentCount) {
        leastFrequentCount = item.accessCount;
        leastFrequentKey = key;
      }
    }

    return leastFrequentKey;
  }

  private findFIFOKey(): string | null {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  private serialize(value: any): string {
    if (!this.options.serialize) {
      return value;
    }
    return JSON.stringify(value);
  }

  private deserialize(value: string): any {
    if (!this.options.serialize) {
      return value;
    }
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  private compress(value: string): string {
    if (!this.options.compress) {
      return value;
    }
    // Simple compression - in production, use a proper compression library
    return Buffer.from(value).toString('base64');
  }

  private decompress(value: string): string {
    if (!this.options.compress) {
      return value;
    }
    try {
      return Buffer.from(value, 'base64').toString();
    } catch {
      return value;
    }
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      this.stats.misses++;
      this.updateStats();
      structuredLogger.cache('GET', key, false);
      return null;
    }

    const now = Date.now();
    if (now - item.timestamp > this.options.ttl * 1000) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.evictions++;
      this.updateStats();
      structuredLogger.cache('GET', key, false, { reason: 'expired' });
      return null;
    }

    // Update access statistics
    item.accessCount++;
    item.lastAccessed = now;
    this.cache.set(key, item);

    this.stats.hits++;
    this.updateStats();
    
    const value = this.deserialize(item.value);
    structuredLogger.cache('GET', key, true);
    return value;
  }

  set<T>(key: string, value: T, ttl?: number): void {
    const now = Date.now();
    const itemTtl = ttl || this.options.ttl;

    // Evict if necessary
    this.evict();

    const serializedValue = this.serialize(value);
    const compressedValue = this.compress(serializedValue);

    this.cache.set(key, {
      value: compressedValue,
      timestamp: now,
      accessCount: 1,
      lastAccessed: now
    });

    this.stats.sets++;
    this.updateStats();
    structuredLogger.cache('SET', key, true, { ttl: itemTtl });
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
      this.updateStats();
      structuredLogger.cache('DELETE', key, true);
    }
    return deleted;
  }

  clear(): void {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      hitRate: 0,
      size: 0,
      maxSize: this.options.maxSize,
      memoryUsage: 0
    };
    structuredLogger.cache('CLEAR', 'all', true);
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) {
      return false;
    }

    const now = Date.now();
    if (now - item.timestamp > this.options.ttl * 1000) {
      this.cache.delete(key);
      this.stats.evictions++;
      return false;
    }

    return true;
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  size(): number {
    return this.cache.size;
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  // Advanced cache operations
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    this.set(key, value, ttl);
    return value;
  }

  async getOrSetSync<T>(
    key: string,
    factory: () => T,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = factory();
    this.set(key, value, ttl);
    return value;
  }

  // Cache warming
  async warmup<T>(
    keys: string[],
    factory: (key: string) => Promise<T>,
    ttl?: number
  ): Promise<void> {
    const promises = keys.map(async (key) => {
      if (!this.has(key)) {
        const value = await factory(key);
        this.set(key, value, ttl);
      }
    });

    await Promise.all(promises);
    structuredLogger.cache('WARMUP', 'multiple', true, { count: keys.length });
  }

  // Cache invalidation patterns
  invalidatePattern(pattern: RegExp): number {
    let invalidated = 0;
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        invalidated++;
      }
    }
    
    if (invalidated > 0) {
      this.stats.deletes += invalidated;
      this.updateStats();
      structuredLogger.cache('INVALIDATE_PATTERN', pattern.source, true, { count: invalidated });
    }
    
    return invalidated;
  }

  // Cache tagging
  private tags: Map<string, Set<string>> = new Map();

  tag(key: string, tags: string[]): void {
    for (const tag of tags) {
      if (!this.tags.has(tag)) {
        this.tags.set(tag, new Set());
      }
      this.tags.get(tag)!.add(key);
    }
  }

  invalidateByTag(tag: string): number {
    const keys = this.tags.get(tag);
    if (!keys) {
      return 0;
    }

    let invalidated = 0;
    for (const key of keys) {
      if (this.cache.delete(key)) {
        invalidated++;
      }
    }

    this.tags.delete(tag);
    
    if (invalidated > 0) {
      this.stats.deletes += invalidated;
      this.updateStats();
      structuredLogger.cache('INVALIDATE_TAG', tag, true, { count: invalidated });
    }
    
    return invalidated;
  }

  // Cache statistics and monitoring
  getDetailedStats(): {
    stats: CacheStats;
    topKeys: Array<{ key: string; accessCount: number; lastAccessed: number }>;
    memoryBreakdown: {
      keys: number;
      values: number;
      overhead: number;
    };
  } {
    const topKeys = Array.from(this.cache.entries())
      .map(([key, item]) => ({
        key,
        accessCount: item.accessCount,
        lastAccessed: item.lastAccessed
      }))
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 10);

    const memoryBreakdown = {
      keys: 0,
      values: 0,
      overhead: 0
    };

    for (const [key, item] of this.cache.entries()) {
      memoryBreakdown.keys += key.length * 2;
      memoryBreakdown.values += JSON.stringify(item.value).length * 2;
      memoryBreakdown.overhead += 24;
    }

    return {
      stats: this.getStats(),
      topKeys,
      memoryBreakdown
    };
  }
}

// Cache manager for multiple cache instances
export class CacheManager {
  private caches: Map<string, AdvancedCache> = new Map();

  createCache(name: string, options: CacheOptions = {}): AdvancedCache {
    if (this.caches.has(name)) {
      throw new Error(`Cache '${name}' already exists`);
    }

    const cache = new AdvancedCache(options);
    this.caches.set(name, cache);
    return cache;
  }

  getCache(name: string): AdvancedCache | null {
    return this.caches.get(name) || null;
  }

  deleteCache(name: string): boolean {
    const cache = this.caches.get(name);
    if (cache) {
      cache.clear();
      this.caches.delete(name);
      return true;
    }
    return false;
  }

  getAllStats(): Record<string, CacheStats> {
    const stats: Record<string, CacheStats> = {};
    for (const [name, cache] of this.caches.entries()) {
      stats[name] = cache.getStats();
    }
    return stats;
  }

  clearAll(): void {
    for (const cache of this.caches.values()) {
      cache.clear();
    }
  }
}

// Global cache instances
export const cacheManager = new CacheManager();

// Predefined cache instances
export const userCache = cacheManager.createCache('users', {
  ttl: 1800, // 30 minutes
  maxSize: 1000,
  strategy: 'lru'
});

export const organizationCache = cacheManager.createCache('organizations', {
  ttl: 3600, // 1 hour
  maxSize: 100,
  strategy: 'lru'
});

export const policyCache = cacheManager.createCache('policies', {
  ttl: 7200, // 2 hours
  maxSize: 500,
  strategy: 'lru'
});

export const sessionCache = cacheManager.createCache('sessions', {
  ttl: 900, // 15 minutes
  maxSize: 10000,
  strategy: 'lru'
});

export const apiCache = cacheManager.createCache('api', {
  ttl: 300, // 5 minutes
  maxSize: 2000,
  strategy: 'lru'
});
