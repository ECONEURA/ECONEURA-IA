/**
 * PR-47: Smart Cache Service
 * 
 * Service for intelligent caching with advanced strategies and optimization
 */

import { 
  CacheConfig, 
  CacheEntry, 
  CacheMetrics, 
  CacheWarmingRequest,
  CacheWarmingStatus,
  CacheInvalidationRequest,
  CacheCompressionRequest,
  CacheStats
} from './warmup-types';

export class SmartCacheService {
  private caches: Map<string, CacheConfig> = new Map();
  private cacheEntries: Map<string, Map<string, CacheEntry>> = new Map();
  private cacheMetrics: Map<string, CacheMetrics> = new Map();
  private warmingStatuses: Map<string, CacheWarmingStatus> = new Map();

  constructor() {
    this.initializeDefaultCaches();
  }

  /**
   * Get all cache configurations
   */
  async getCacheConfigs(organizationId: string): Promise<CacheConfig[]> {
    const configs = Array.from(this.caches.values())
      .filter(config => config.organizationId === organizationId);
    
    return configs;
  }

  /**
   * Get a specific cache configuration
   */
  async getCacheConfig(id: string): Promise<CacheConfig | null> {
    return this.caches.get(id) || null;
  }

  /**
   * Create a new cache configuration
   */
  async createCacheConfig(config: Omit<CacheConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<CacheConfig> {
    const id = this.generateId();
    const now = new Date();

    const cacheConfig: CacheConfig = {
      id,
      ...config,
      createdAt: now,
      updatedAt: now
    };

    this.caches.set(id, cacheConfig);
    this.cacheEntries.set(id, new Map());
    this.initializeCacheMetrics(id);

    return cacheConfig;
  }

  /**
   * Update an existing cache configuration
   */
  async updateCacheConfig(id: string, updates: Partial<CacheConfig>): Promise<CacheConfig | null> {
    const config = this.caches.get(id);
    if (!config) {
      return null;
    }

    const updatedConfig: CacheConfig = {
      ...config,
      ...updates,
      updatedAt: new Date()
    };

    this.caches.set(id, updatedConfig);
    return updatedConfig;
  }

  /**
   * Delete a cache configuration
   */
  async deleteCacheConfig(id: string): Promise<boolean> {
    this.cacheEntries.delete(id);
    this.cacheMetrics.delete(id);
    return this.caches.delete(id);
  }

  /**
   * Get cache entry
   */
  async getCacheEntry(cacheId: string, key: string): Promise<CacheEntry | null> {
    const entries = this.cacheEntries.get(cacheId);
    if (!entries) {
      return null;
    }

    const entry = entries.get(key);
    if (!entry) {
      this.updateCacheMetrics(cacheId, 'miss');
      return null;
    }

    // Check TTL
    if (this.isEntryExpired(entry)) {
      entries.delete(key);
      this.updateCacheMetrics(cacheId, 'miss');
      return null;
    }

    // Update access statistics
    entry.lastAccessed = new Date();
    entry.accessCount++;
    this.updateCacheMetrics(cacheId, 'hit');

    return entry;
  }

  /**
   * Set cache entry
   */
  async setCacheEntry(cacheId: string, key: string, value: any, ttl?: number): Promise<void> {
    const config = this.caches.get(cacheId);
    if (!config) {
      throw new Error(`Cache configuration not found: ${cacheId}`);
    }

    const entries = this.cacheEntries.get(cacheId);
    if (!entries) {
      throw new Error(`Cache entries not found: ${cacheId}`);
    }

    // Check cache size limit
    await this.enforceCacheSizeLimit(cacheId);

    const now = new Date();
    const entry: CacheEntry = {
      key,
      value,
      ttl: ttl || config.ttl,
      createdAt: now,
      lastAccessed: now,
      accessCount: 1,
      size: this.calculateEntrySize(value),
      compressed: config.compression,
      encrypted: config.encryption
    };

    entries.set(key, entry);
    this.updateCacheMetrics(cacheId, 'set');
  }

  /**
   * Delete cache entry
   */
  async deleteCacheEntry(cacheId: string, key: string): Promise<boolean> {
    const entries = this.cacheEntries.get(cacheId);
    if (!entries) {
      return false;
    }

    const deleted = entries.delete(key);
    if (deleted) {
      this.updateCacheMetrics(cacheId, 'delete');
    }

    return deleted;
  }

  /**
   * Get cache metrics
   */
  async getCacheMetrics(cacheId: string): Promise<CacheMetrics | null> {
    return this.cacheMetrics.get(cacheId) || null;
  }

  /**
   * Warm up cache
   */
  async warmupCache(request: CacheWarmingRequest): Promise<CacheWarmingStatus> {
    const warmingId = this.generateId();
    const now = new Date();

    const warmingStatus: CacheWarmingStatus = {
      id: warmingId,
      cacheName: request.cacheName,
      status: 'running',
      progress: 0,
      entriesProcessed: 0,
      totalEntries: 0,
      startTime: now,
      errors: []
    };

    this.warmingStatuses.set(warmingId, warmingStatus);

    // Start warming process asynchronously
    this.executeCacheWarming(warmingStatus, request).catch(error => {
      console.error('Cache warming failed:', error);
      warmingStatus.status = 'failed';
      warmingStatus.errors.push(error.message);
    });

    return warmingStatus;
  }

  /**
   * Get cache warming status
   */
  async getCacheWarmingStatus(warmingId: string): Promise<CacheWarmingStatus | null> {
    return this.warmingStatuses.get(warmingId) || null;
  }

  /**
   * Invalidate cache
   */
  async invalidateCache(request: CacheInvalidationRequest): Promise<number> {
    const config = this.caches.get(request.cacheName);
    if (!config) {
      throw new Error(`Cache configuration not found: ${request.cacheName}`);
    }

    const entries = this.cacheEntries.get(request.cacheName);
    if (!entries) {
      return 0;
    }

    let invalidatedCount = 0;

    if (request.keys && request.keys.length > 0) {
      // Invalidate specific keys
      for (const key of request.keys) {
        if (entries.delete(key)) {
          invalidatedCount++;
        }
      }
    } else if (request.pattern) {
      // Invalidate by pattern
      const regex = new RegExp(request.pattern);
      for (const key of entries.keys()) {
        if (regex.test(key)) {
          entries.delete(key);
          invalidatedCount++;
        }
      }
    } else {
      // Invalidate all entries
      invalidatedCount = entries.size;
      entries.clear();
    }

    this.updateCacheMetrics(request.cacheName, 'invalidation', invalidatedCount);
    return invalidatedCount;
  }

  /**
   * Compress cache data
   */
  async compressCache(request: CacheCompressionRequest): Promise<number> {
    const entries = this.cacheEntries.get(request.cacheName);
    if (!entries) {
      throw new Error(`Cache not found: ${request.cacheName}`);
    }

    let compressedCount = 0;
    const originalSize = this.calculateTotalCacheSize(entries);

    for (const [key, entry] of entries) {
      if (!entry.compressed) {
        // Simulate compression
        entry.value = this.simulateCompression(entry.value, request.algorithm, request.level);
        entry.compressed = true;
        entry.size = this.calculateEntrySize(entry.value);
        compressedCount++;
      }
    }

    const compressedSize = this.calculateTotalCacheSize(entries);
    const compressionRatio = originalSize > 0 ? (1 - compressedSize / originalSize) * 100 : 0;

    this.updateCacheMetrics(request.cacheName, 'compression', compressedCount);
    return compressionRatio;
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(organizationId: string): Promise<CacheStats> {
    const configs = await this.getCacheConfigs(organizationId);
    
    let totalSize = 0;
    let totalHitRate = 0;
    let totalCompressionRatio = 0;
    let totalEvictionRate = 0;
    let totalWarmingFrequency = 0;

    for (const config of configs) {
      const metrics = this.cacheMetrics.get(config.id);
      if (metrics) {
        totalSize += metrics.totalSize;
        totalHitRate += metrics.hitRate;
        totalCompressionRatio += metrics.compressionRatio;
        totalEvictionRate += metrics.evictionCount;
        totalWarmingFrequency += 1; // Simplified
      }
    }

    const cacheCount = configs.length;
    const averageHitRate = cacheCount > 0 ? totalHitRate / cacheCount : 0;
    const averageCompressionRatio = cacheCount > 0 ? totalCompressionRatio / cacheCount : 0;

    return {
      totalCaches: cacheCount,
      totalSize,
      averageHitRate,
      compressionRatio: averageCompressionRatio,
      evictionRate: totalEvictionRate,
      warmingFrequency: totalWarmingFrequency
    };
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async executeCacheWarming(status: CacheWarmingStatus, request: CacheWarmingRequest): Promise<void> {
    try {
      // Simulate cache warming process
      const totalEntries = Math.floor(Math.random() * 1000) + 100;
      status.totalEntries = totalEntries;

      for (let i = 0; i < totalEntries; i++) {
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 10));

        // Generate mock cache entry
        const key = `warmed_entry_${i}`;
        const value = { data: `Warmed data ${i}`, timestamp: new Date() };

        // Set cache entry
        await this.setCacheEntry(request.cacheName, key, value);

        status.entriesProcessed = i + 1;
        status.progress = Math.round(((i + 1) / totalEntries) * 100);
      }

      status.status = 'completed';
      status.endTime = new Date();

    } catch (error) {
      status.status = 'failed';
      status.endTime = new Date();
      status.errors.push(error.message);
    }
  }

  private async enforceCacheSizeLimit(cacheId: string): Promise<void> {
    const config = this.caches.get(cacheId);
    if (!config) return;

    const entries = this.cacheEntries.get(cacheId);
    if (!entries) return;

    const currentSize = this.calculateTotalCacheSize(entries);
    if (currentSize <= config.maxSize) return;

    // Evict entries based on strategy
    await this.evictEntries(cacheId, config.maxSize - currentSize);
  }

  private async evictEntries(cacheId: string, targetSize: number): Promise<void> {
    const config = this.caches.get(cacheId);
    if (!config) return;

    const entries = this.cacheEntries.get(cacheId);
    if (!entries) return;

    const strategy = config.strategy;
    let entriesToEvict: string[] = [];

    switch (strategy.type) {
      case 'lru':
        entriesToEvict = this.getLRUEntries(entries, targetSize);
        break;
      case 'lfu':
        entriesToEvict = this.getLFUEntries(entries, targetSize);
        break;
      case 'ttl':
        entriesToEvict = this.getTTLEntries(entries, targetSize);
        break;
      default:
        entriesToEvict = this.getRandomEntries(entries, targetSize);
    }

    // Evict entries
    for (const key of entriesToEvict) {
      entries.delete(key);
    }

    this.updateCacheMetrics(cacheId, 'eviction', entriesToEvict.length);
  }

  private getLRUEntries(entries: Map<string, CacheEntry>, count: number): string[] {
    return Array.from(entries.entries())
      .sort((a, b) => a[1].lastAccessed.getTime() - b[1].lastAccessed.getTime())
      .slice(0, count)
      .map(([key]) => key);
  }

  private getLFUEntries(entries: Map<string, CacheEntry>, count: number): string[] {
    return Array.from(entries.entries())
      .sort((a, b) => a[1].accessCount - b[1].accessCount)
      .slice(0, count)
      .map(([key]) => key);
  }

  private getTTLEntries(entries: Map<string, CacheEntry>, count: number): string[] {
    return Array.from(entries.entries())
      .filter(([_, entry]) => this.isEntryExpired(entry))
      .slice(0, count)
      .map(([key]) => key);
  }

  private getRandomEntries(entries: Map<string, CacheEntry>, count: number): string[] {
    const keys = Array.from(entries.keys());
    return keys.sort(() => Math.random() - 0.5).slice(0, count);
  }

  private isEntryExpired(entry: CacheEntry): boolean {
    const now = new Date();
    const expirationTime = new Date(entry.createdAt.getTime() + entry.ttl * 1000);
    return now > expirationTime;
  }

  private calculateEntrySize(value: any): number {
    // Simplified size calculation
    return JSON.stringify(value).length;
  }

  private calculateTotalCacheSize(entries: Map<string, CacheEntry>): number {
    let totalSize = 0;
    for (const entry of entries.values()) {
      totalSize += entry.size;
    }
    return totalSize;
  }

  private simulateCompression(value: any, algorithm: string, level: number): any {
    // Simulate compression by reducing the value
    const compressed = JSON.stringify(value);
    return `compressed_${algorithm}_${level}_${compressed}`;
  }

  private updateCacheMetrics(cacheId: string, operation: string, count: number = 1): void {
    const metrics = this.cacheMetrics.get(cacheId);
    if (!metrics) return;

    switch (operation) {
      case 'hit':
        metrics.hitCount += count;
        break;
      case 'miss':
        metrics.missCount += count;
        break;
      case 'set':
        metrics.entryCount += count;
        break;
      case 'delete':
        metrics.entryCount -= count;
        break;
      case 'eviction':
        metrics.evictionCount += count;
        break;
      case 'invalidation':
        metrics.entryCount -= count;
        break;
      case 'compression':
        // Update compression ratio
        break;
    }

    // Recalculate rates
    const total = metrics.hitCount + metrics.missCount;
    metrics.hitRate = total > 0 ? (metrics.hitCount / total) * 100 : 0;
    metrics.missRate = total > 0 ? (metrics.missCount / total) * 100 : 0;

    // Update total size
    const entries = this.cacheEntries.get(cacheId);
    if (entries) {
      metrics.totalSize = this.calculateTotalCacheSize(entries);
    }

    metrics.lastCleanup = new Date();
  }

  private initializeCacheMetrics(cacheId: string): void {
    const metrics: CacheMetrics = {
      hitCount: 0,
      missCount: 0,
      hitRate: 0,
      missRate: 0,
      totalSize: 0,
      entryCount: 0,
      evictionCount: 0,
      compressionRatio: 0,
      averageAccessTime: 0,
      lastCleanup: new Date()
    };

    this.cacheMetrics.set(cacheId, metrics);
  }

  private initializeDefaultCaches(): void {
    // Create default cache configuration
    const defaultCache: CacheConfig = {
      id: 'default-cache',
      organizationId: 'org_1',
      name: 'default-cache',
      strategy: {
        type: 'lru',
        maxSize: 1024 * 1024 * 1024, // 1GB
        evictionPolicy: {
          type: 'size-based',
          threshold: 0.8,
          cleanupInterval: 3600
        },
        preloadFrequency: '0 2 * * *'
      },
      compression: true,
      encryption: false,
      ttl: 3600, // 1 hour
      maxSize: 1024 * 1024 * 1024, // 1GB
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.caches.set(defaultCache.id, defaultCache);
    this.cacheEntries.set(defaultCache.id, new Map());
    this.initializeCacheMetrics(defaultCache.id);
  }

  private generateId(): string {
    return `cache_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

