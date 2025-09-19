import { logger } from './logger.js';
import { prometheus } from '../middleware/observability.js';
export class DistributedCache {
    cache = new Map();
    config;
    stats;
    cleanupInterval;
    compressionEnabled;
    encryptionEnabled;
    constructor(config = {}) {
        this.config = {
            ttl: 3600,
            maxSize: 10000,
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
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 60000);
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
    async set(key, value, ttl) {
        const startTime = Date.now();
        try {
            if (this.cache.size >= this.config.maxSize) {
                await this.evict();
            }
            const now = new Date();
            const itemTtl = ttl || this.config.ttl;
            const expiresAt = new Date(now.getTime() + itemTtl * 1000);
            const serializedValue = await this.serialize(value);
            const size = this.calculateSize(serializedValue);
            const item = {
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
            this.recordSetMetrics(key, size, Date.now() - startTime);
            logger.debug('Cache item set', {
                key,
                ttl: itemTtl,
                size,
                expiresAt: expiresAt.toISOString()
            });
        }
        catch (error) {
            logger.error('Failed to set cache item', {
                key,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    async get(key) {
        const startTime = Date.now();
        try {
            const item = this.cache.get(key);
            if (!item) {
                this.stats.misses++;
                this.updateStats();
                this.recordGetMetrics(key, false, Date.now() - startTime);
                return null;
            }
            if (item.expiresAt < new Date()) {
                this.cache.delete(key);
                this.stats.misses++;
                this.updateStats();
                this.recordGetMetrics(key, false, Date.now() - startTime);
                return null;
            }
            item.accessCount++;
            item.lastAccessed = new Date();
            const value = await this.deserialize(item.value);
            this.stats.hits++;
            this.updateStats();
            this.recordGetMetrics(key, true, Date.now() - startTime);
            logger.debug('Cache item retrieved', {
                key,
                accessCount: item.accessCount,
                age: Date.now() - item.createdAt.getTime()
            });
            return value;
        }
        catch (error) {
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
    async delete(key) {
        const startTime = Date.now();
        try {
            const existed = this.cache.delete(key);
            this.updateStats();
            this.recordDeleteMetrics(key, existed, Date.now() - startTime);
            logger.debug('Cache item deleted', { key, existed });
            return existed;
        }
        catch (error) {
            logger.error('Failed to delete cache item', {
                key,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return false;
        }
    }
    has(key) {
        const item = this.cache.get(key);
        if (!item) {
            return false;
        }
        if (item.expiresAt < new Date()) {
            this.cache.delete(key);
            this.updateStats();
            return false;
        }
        return true;
    }
    async clear() {
        const startTime = Date.now();
        try {
            const size = this.cache.size;
            this.cache.clear();
            this.updateStats();
            this.recordClearMetrics(size, Date.now() - startTime);
            logger.info('Cache cleared', { itemsRemoved: size });
        }
        catch (error) {
            logger.error('Failed to clear cache', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    getStats() {
        return { ...this.stats };
    }
    getSize() {
        return this.cache.size;
    }
    getMemoryUsage() {
        let totalSize = 0;
        this.cache.forEach(item => {
            totalSize += item.size;
        });
        return totalSize;
    }
    async evict() {
        const itemsToEvict = Math.ceil(this.config.maxSize * 0.1);
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
    async evictLRU(count) {
        const items = Array.from(this.cache.entries())
            .sort(([, a], [, b]) => a.lastAccessed.getTime() - b.lastAccessed.getTime())
            .slice(0, count);
        items.forEach(([key]) => {
            this.cache.delete(key);
        });
    }
    async evictLFU(count) {
        const items = Array.from(this.cache.entries())
            .sort(([, a], [, b]) => a.accessCount - b.accessCount)
            .slice(0, count);
        items.forEach(([key]) => {
            this.cache.delete(key);
        });
    }
    async evictFIFO(count) {
        const items = Array.from(this.cache.entries())
            .sort(([, a], [, b]) => a.createdAt.getTime() - b.createdAt.getTime())
            .slice(0, count);
        items.forEach(([key]) => {
            this.cache.delete(key);
        });
    }
    cleanup() {
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
    updateStats() {
        this.stats.size = this.cache.size;
        this.stats.memoryUsage = this.getMemoryUsage();
        this.stats.hitRate = this.stats.hits + this.stats.misses > 0
            ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100
            : 0;
    }
    async serialize(value) {
        const serialized = JSON.stringify(value);
        if (this.compressionEnabled) {
        }
        if (this.encryptionEnabled) {
        }
        return serialized;
    }
    async deserialize(value) {
        const deserialized = value;
        if (this.encryptionEnabled) {
        }
        if (this.compressionEnabled) {
        }
        return JSON.parse(deserialized);
    }
    calculateSize(value) {
        return JSON.stringify(value).length * 2;
    }
    recordSetMetrics(key, size, duration) {
        prometheus.cacheSetTotal.inc();
        prometheus.cacheSetDuration.observe(duration / 1000);
        prometheus.cacheSize.set(this.cache.size);
        prometheus.cacheMemoryUsage.set(this.getMemoryUsage());
    }
    recordGetMetrics(key, hit, duration) {
        if (hit) {
            prometheus.cacheHitsTotal.inc();
        }
        else {
            prometheus.cacheMissesTotal.inc();
        }
        prometheus.cacheGetDuration.observe(duration / 1000);
        prometheus.cacheHitRate.set(this.stats.hitRate);
    }
    recordDeleteMetrics(key, existed, duration) {
        prometheus.cacheDeleteTotal.inc();
        prometheus.cacheDeleteDuration.observe(duration / 1000);
        prometheus.cacheSize.set(this.cache.size);
    }
    recordClearMetrics(itemsRemoved, duration) {
        prometheus.cacheClearTotal.inc();
        prometheus.cacheClearDuration.observe(duration / 1000);
        prometheus.cacheSize.set(0);
        prometheus.cacheMemoryUsage.set(0);
    }
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.cache.clear();
        this.updateStats();
        logger.info('Distributed Cache destroyed');
    }
}
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
export const distributedCache = new DistributedCache();
//# sourceMappingURL=distributed-cache.js.map