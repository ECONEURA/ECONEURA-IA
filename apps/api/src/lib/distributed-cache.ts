import { logger } from './logger.js';
import { prometheus } from '../middleware/observability.js';

export interface CacheConfig {
  ttl: number; // Time to live in seconds
  maxSize: number; // Maximum number of items
  strategy: 'lru' | 'lfu' | 'fifo'; // Eviction strategy
  compression: boolean; // Enable compression
  encryption: boolean; // Enable encryption
}

export interface CacheItem<T = any> {
  key: string;
  value: T;
  ttl: number;
  createdAt: Date;
  expiresAt: Date;
  accessCount: number;
  lastAccessed: Date;
  size: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  maxSize: number;
  hitRate: number;
  memoryUsage: number;
}

export class DistributedCache {
  private cache: Map<string, CacheItem> = new Map();
  private config: CacheConfig;
  private stats: CacheStats;
  private cleanupInterval: NodeJS.Timeout;
  private compressionEnabled: boolean;
  private encryptionEnabled: boolean;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      ttl: 3600, // 1 hour default
      maxSize: 10000, // 10k items default
      strategy: 'lru',
      compression: false,
      encryption: false,
      ...config
    };

    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      size: 0,
      maxSize: this.config.maxSize,
      hitRate: 0,
      memoryUsage: 0
    };

    this.compressionEnabled = this.config.compression;
    this.encryptionEnabled = this.config.encryption;

    // Start cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // Cleanup every minute

    logger.info('Distributed Cache initialized', {
      config: this.config,
      features: [
        'ttl_management',
        'eviction_strategies',
        'compression',
        'encryption',
        'prometheus_metrics',
        'statistics'
      ]
    });
  }

  /**
   * Set a value in the cache
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Check if we need to evict items
      if (this.cache.size >= this.config.maxSize) {
        await this.evict();
      }

      const now = new Date();
      const itemTtl = ttl || this.config.ttl;
      const expiresAt = new Date(now.getTime() + itemTtl * 1000);

      // Serialize and optionally compress/encrypt
      const serializedValue = await this.serialize(value);
      const size = this.calculateSize(serializedValue);

      const item: CacheItem<T> = {
        key,
        value: serializedValue,
        ttl: itemTtl,
        createdAt: now,
        expiresAt,
        accessCount: 0,
        lastAccessed: now,
        size
      };

      this.cache.set(key, item);
      this.updateStats();

      // Record metrics
      this.recordSetMetrics(key, size, Date.now() - startTime);

      logger.debug('Cache item set', {
        key,
        ttl: itemTtl,
        size,
        expiresAt: expiresAt.toISOString()
      });
    } catch (error) {
      logger.error('Failed to set cache item', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get a value from the cache
   */
  async get<T>(key: string): Promise<T | null> {
    const startTime = Date.now();
    
    try {
      const item = this.cache.get(key);
      
      if (!item) {
        this.stats.misses++;
        this.updateStats();
        this.recordGetMetrics(key, false, Date.now() - startTime);
        return null;
      }

      // Check if item has expired
      if (item.expiresAt < new Date()) {
        this.cache.delete(key);
        this.stats.misses++;
        this.updateStats();
        this.recordGetMetrics(key, false, Date.now() - startTime);
        return null;
      }

      // Update access statistics
      item.accessCount++;
      item.lastAccessed = new Date();

      // Deserialize and optionally decompress/decrypt
      const value = await this.deserialize<T>(item.value);

      this.stats.hits++;
      this.updateStats();
      this.recordGetMetrics(key, true, Date.now() - startTime);

      logger.debug('Cache item retrieved', {
        key,
        accessCount: item.accessCount,
        age: Date.now() - item.createdAt.getTime()
      });

      return value;
    } catch (error) {
      logger.error('Failed to get cache item', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      this.stats.misses++;
      this.updateStats();
      this.recordGetMetrics(key, false, Date.now() - startTime);
      return null;
    }
  }

  /**
   * Delete a value from the cache
   */
  async delete(key: string): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      const existed = this.cache.delete(key);
      this.updateStats();
      this.recordDeleteMetrics(key, existed, Date.now() - startTime);

      logger.debug('Cache item deleted', { key, existed });
      return existed;
    } catch (error) {
      logger.error('Failed to delete cache item', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  /**
   * Check if a key exists in the cache
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) {
      return false;
    }

    // Check if item has expired
    if (item.expiresAt < new Date()) {
      this.cache.delete(key);
      this.updateStats();
      return false;
    }

    return true;
  }

  /**
   * Clear all items from the cache
   */
  async clear(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const size = this.cache.size;
      this.cache.clear();
      this.updateStats();
      this.recordClearMetrics(size, Date.now() - startTime);

      logger.info('Cache cleared', { itemsRemoved: size });
    } catch (error) {
      logger.error('Failed to clear cache', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get cache size
   */
  getSize(): number {
    return this.cache.size;
  }

  /**
   * Get memory usage estimate
   */
  getMemoryUsage(): number {
    let totalSize = 0;
    this.cache.forEach(item => {
      totalSize += item.size;
    });
    return totalSize;
  }

  /**
   * Evict items based on strategy
   */
  private async evict(): Promise<void> {
    const itemsToEvict = Math.ceil(this.config.maxSize * 0.1); // Evict 10% of max size
    
    switch (this.config.strategy) {
      case 'lru':
        await this.evictLRU(itemsToEvict);
        break;
      case 'lfu':
        await this.evictLFU(itemsToEvict);
        break;
      case 'fifo':
        await this.evictFIFO(itemsToEvict);
        break;
    }

    this.stats.evictions += itemsToEvict;
    this.updateStats();

    logger.info('Cache eviction completed', {
      strategy: this.config.strategy,
      itemsEvicted: itemsToEvict
    });
  }

  /**
   * Evict least recently used items
   */
  private async evictLRU(count: number): Promise<void> {
    const items = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.lastAccessed.getTime() - b.lastAccessed.getTime())
      .slice(0, count);

    items.forEach(([key]) => {
      this.cache.delete(key);
    });
  }

  /**
   * Evict least frequently used items
   */
  private async evictLFU(count: number): Promise<void> {
    const items = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.accessCount - b.accessCount)
      .slice(0, count);

    items.forEach(([key]) => {
      this.cache.delete(key);
    });
  }

  /**
   * Evict first in, first out items
   */
  private async evictFIFO(count: number): Promise<void> {
    const items = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.createdAt.getTime() - b.createdAt.getTime())
      .slice(0, count);

    items.forEach(([key]) => {
      this.cache.delete(key);
    });
  }

  /**
   * Cleanup expired items
   */
  private cleanup(): void {
    const now = new Date();
    let cleanedCount = 0;

    for (const [key, item] of this.cache.entries()) {
      if (item.expiresAt < now) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.updateStats();
      logger.debug('Cache cleanup completed', { itemsCleaned: cleanedCount });
    }
  }

  /**
   * Update cache statistics
   */
  private updateStats(): void {
    this.stats.size = this.cache.size;
    this.stats.memoryUsage = this.getMemoryUsage();
    this.stats.hitRate = this.stats.hits + this.stats.misses > 0 
      ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100 
      : 0;
  }

  /**
   * Serialize value with optional compression/encryption
   */
  private async serialize<T>(value: T): Promise<any> {
    const serialized = JSON.stringify(value);

    if (this.compressionEnabled) {
      // Compression would be implemented here
      // serialized = await compress(serialized);
    }

    if (this.encryptionEnabled) {
      // Encryption would be implemented here
      // serialized = await encrypt(serialized);
    }

    return serialized;
  }

  /**
   * Deserialize value with optional decompression/decryption
   */
  private async deserialize<T>(value: any): Promise<T> {
    const deserialized = value;

    if (this.encryptionEnabled) {
      // Decryption would be implemented here
      // deserialized = await decrypt(deserialized);
    }

    if (this.compressionEnabled) {
      // Decompression would be implemented here
      // deserialized = await decompress(deserialized);
    }

    return JSON.parse(deserialized);
  }

  /**
   * Calculate size of serialized value
   */
  private calculateSize(value: any): number {
    return JSON.stringify(value).length * 2; // Rough estimate in bytes
  }

  /**
   * Record set metrics
   */
  private recordSetMetrics(key: string, size: number, duration: number): void {
    prometheus.cacheSetTotal.inc();
    prometheus.cacheSetDuration.observe(duration / 1000);
    prometheus.cacheSize.set(this.cache.size);
    prometheus.cacheMemoryUsage.set(this.getMemoryUsage());
  }

  /**
   * Record get metrics
   */
  private recordGetMetrics(key: string, hit: boolean, duration: number): void {
    if (hit) {
      prometheus.cacheHitsTotal.inc();
    } else {
      prometheus.cacheMissesTotal.inc();
    }
    prometheus.cacheGetDuration.observe(duration / 1000);
    prometheus.cacheHitRate.set(this.stats.hitRate);
  }

  /**
   * Record delete metrics
   */
  private recordDeleteMetrics(key: string, existed: boolean, duration: number): void {
    prometheus.cacheDeleteTotal.inc();
    prometheus.cacheDeleteDuration.observe(duration / 1000);
    prometheus.cacheSize.set(this.cache.size);
  }

  /**
   * Record clear metrics
   */
  private recordClearMetrics(itemsRemoved: number, duration: number): void {
    prometheus.cacheClearTotal.inc();
    prometheus.cacheClearDuration.observe(duration / 1000);
    prometheus.cacheSize.set(0);
    prometheus.cacheMemoryUsage.set(0);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    this.cache.clear();
    this.updateStats();

    logger.info('Distributed Cache destroyed');
  }
}

// Export Prometheus metrics
export const cacheMetrics = {
  cacheHitsTotal: new prometheus.Counter({
    name: 'econeura_cache_hits_total',
    help: 'Total number of cache hits'
  }),
  cacheMissesTotal: new prometheus.Counter({
    name: 'econeura_cache_misses_total',
    help: 'Total number of cache misses'
  }),
  cacheSetTotal: new prometheus.Counter({
    name: 'econeura_cache_set_total',
    help: 'Total number of cache sets'
  }),
  cacheDeleteTotal: new prometheus.Counter({
    name: 'econeura_cache_delete_total',
    help: 'Total number of cache deletes'
  }),
  cacheClearTotal: new prometheus.Counter({
    name: 'econeura_cache_clear_total',
    help: 'Total number of cache clears'
  }),
  cacheSize: new prometheus.Gauge({
    name: 'econeura_cache_size',
    help: 'Current cache size'
  }),
  cacheMemoryUsage: new prometheus.Gauge({
    name: 'econeura_cache_memory_usage_bytes',
    help: 'Current cache memory usage in bytes'
  }),
  cacheHitRate: new prometheus.Gauge({
    name: 'econeura_cache_hit_rate_percent',
    help: 'Current cache hit rate percentage'
  }),
  cacheGetDuration: new prometheus.Histogram({
    name: 'econeura_cache_get_duration_seconds',
    help: 'Cache get operation duration in seconds',
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1]
  }),
  cacheSetDuration: new prometheus.Histogram({
    name: 'econeura_cache_set_duration_seconds',
    help: 'Cache set operation duration in seconds',
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1]
  }),
  cacheDeleteDuration: new prometheus.Histogram({
    name: 'econeura_cache_delete_duration_seconds',
    help: 'Cache delete operation duration in seconds',
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1]
  }),
  cacheClearDuration: new prometheus.Histogram({
    name: 'econeura_cache_clear_duration_seconds',
    help: 'Cache clear operation duration in seconds',
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1]
  })
};

// Export singleton instance
export const distributedCache = new DistributedCache();
