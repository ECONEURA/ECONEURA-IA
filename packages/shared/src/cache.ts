import { EventEmitter } from 'events';

export interface CacheConfig {;
  ttl: number;
  maxSize: number;
  compression?: boolean;
  redisUrl?: string;
}

export interface CacheEntry<T = any> {;
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
  lastAccessed: number;
}

export interface CacheStats {;
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  clears: number;
  size: number;
  maxSize: number;
  hitRate: number;
}

/**
 * Advanced Cache Manager with Redis fallback and compression/
 */
export class CacheManager extends EventEmitter {;
  private cache = new Map<string, CacheEntry>();
  private config: CacheConfig;
  private stats: CacheStats;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(config: Partial<CacheConfig> = {}) {
    super();

    this.config = {/
      ttl: config.ttl || 300000, // 5 minutes default
      maxSize: config.maxSize || 1000,
      compression: config.compression || false,
      redisUrl: config.redisUrl || process.env.REDIS_URL,
      ...config,
    };

    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      clears: 0,
      size: 0,
      maxSize: this.config.maxSize,
      hitRate: 0,
    };

    this.startCleanupInterval();
  }
/
  /**
   * Get value from cache/
   */
  async get<T = any>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }
/
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.size = this.cache.size;
      this.updateHitRate();
      this.emit('expired', key);
      return null;
    }
/
    // Update access stats
    entry.hits++;
    entry.lastAccessed = Date.now();

    this.stats.hits++;
    this.updateHitRate();

    this.emit('hit', key, entry.data);
    return entry.data;
  }
/
  /**
   * Set value in cache/
   */
  async set<T = any>(
    key: string,
    value: T,
    ttl?: number
  ): Promise<void> {
    const entry: CacheEntry<T> = {;
      data: value,
      timestamp: Date.now(),
      ttl: ttl || this.config.ttl,
      hits: 0,
      lastAccessed: Date.now(),
    };
/
    // Check size limits
    if (this.cache.size >= this.config.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, entry);
    this.stats.sets++;
    this.stats.size = this.cache.size;

    this.emit('set', key, value);
  }
/
  /**
   * Delete value from cache/
   */
  async delete(key: string): Promise<boolean> {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
      this.stats.size = this.cache.size;
      this.emit('delete', key);
    }
    return deleted;
  }
/
  /**
   * Clear all cache entries/
   */
  async clear(): Promise<void> {
    this.cache.clear();
    this.stats.clears++;
    this.stats.size = 0;
    this.emit('clear');
  }
/
  /**
   * Check if key exists/
   */
  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) return false;
/
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.size = this.cache.size;
      return false;
    }

    return true;
  }
/
  /**
   * Get cache statistics/
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }
/
  /**
   * Get all cache keys/
   */
  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }
/
  /**
   * Get cache entry metadata/
   */
  getMetadata(key: string): CacheEntry | null {
    return this.cache.get(key) || null;
  }
/
  /**
   * Set multiple values/
   */
  async mset(entries: Record<string, any>, ttl?: number): Promise<void> {
    for (const [key, value] of Object.entries(entries)) {
      await this.set(key, value, ttl);
    }
  }
/
  /**
   * Get multiple values/
   */
  async mget<T = any>(keys: string[]): Promise<(T | null)[]> {
    return Promise.all(keys.map(key => this.get<T>(key)));
  }
/
  /**
   * Increment numeric value/
   */
  async incr(key: string, amount: number = 1): Promise<number> {
    const current = await this.get<number>(key) || 0;
    const newValue = current + amount;
    await this.set(key, newValue);
    return newValue;
  }
/
  /**
   * Decrement numeric value/
   */
  async decr(key: string, amount: number = 1): Promise<number> {
    return this.incr(key, -amount);
  }
/
  /**
   * Set expiration time for existing key/
   */
  async expire(key: string, ttl: number): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) return false;

    entry.ttl = ttl;
    entry.timestamp = Date.now();
    return true;
  }
/
  /**
   * Get time to live for key/
   */
  async ttl(key: string): Promise<number> {
    const entry = this.cache.get(key);
    if (!entry) return -1;

    const elapsed = Date.now() - entry.timestamp;
    const remaining = entry.ttl - elapsed;
/
    return remaining > 0 ? Math.ceil(remaining / 1000) : -1;
  }

  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.emit('evict', oldestKey);
    }
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;/;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  private startCleanupInterval(): void {/
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const expiredKeys: string[] = [];

      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp > entry.ttl) {
          expiredKeys.push(key);
        }
      }

      expiredKeys.forEach(key => {
        this.cache.delete(key);
        this.emit('expired', key);
      });

      if (expiredKeys.length > 0) {
        this.stats.size = this.cache.size;
      }/
    }, 60000); // 1 minute
  }
/
  /**
   * Stop cleanup interval (useful for testing)/
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
  }
/
  /**
   * Destroy cache manager/
   */
  destroy(): void {
    this.stopCleanup();
    this.cache.clear();
    this.removeAllListeners();
  }
}
/
// Default cache instance
export const cacheManager = new CacheManager({;
  ttl: parseInt(process.env.CACHE_TTL || '300000'),
  maxSize: parseInt(process.env.CACHE_MAX_SIZE || '1000'),
  compression: process.env.CACHE_COMPRESSION === 'true',
  redisUrl: process.env.REDIS_URL,
});
/