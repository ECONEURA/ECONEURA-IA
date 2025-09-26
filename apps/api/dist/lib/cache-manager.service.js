import { metrics } from '@econeura/shared/src/metrics/index.js';

import { structuredLogger } from './structured-logger.js';
export var CacheLevel;
(function (CacheLevel) {
    CacheLevel["MEMORY"] = "memory";
    CacheLevel["REDIS"] = "redis";
    CacheLevel["DATABASE"] = "database";
})(CacheLevel || (CacheLevel = {}));
export var CacheStrategy;
(function (CacheStrategy) {
    CacheStrategy["LRU"] = "lru";
    CacheStrategy["LFU"] = "lfu";
    CacheStrategy["TTL"] = "ttl";
    CacheStrategy["WRITE_THROUGH"] = "write_through";
    CacheStrategy["WRITE_BACK"] = "write_back";
})(CacheStrategy || (CacheStrategy = {}));
export class CacheManagerService {
    static instance;
    memoryCache = new Map();
    configs = new Map();
    stats = new Map();
    compressionEnabled = true;
    encryptionEnabled = false;
    constructor() {
        this.initializeDefaultConfigs();
        this.startCleanupInterval();
        this.startStatsCollection();
    }
    static getInstance() {
        if (!CacheManagerService.instance) {
            CacheManagerService.instance = new CacheManagerService();
        }
        return CacheManagerService.instance;
    }
    initializeDefaultConfigs() {
        this.configs.set('user_data', {
            level: CacheLevel.MEMORY,
            strategy: CacheStrategy.LRU,
            ttl: 3600,
            maxSize: 1000,
            compression: true,
            encryption: true,
            namespace: 'user'
        });
        this.configs.set('api_responses', {
            level: CacheLevel.MEMORY,
            strategy: CacheStrategy.TTL,
            ttl: 300,
            maxSize: 5000,
            compression: true,
            encryption: false,
            namespace: 'api'
        });
        this.configs.set('session_data', {
            level: CacheLevel.REDIS,
            strategy: CacheStrategy.TTL,
            ttl: 1800,
            maxSize: 10000,
            compression: false,
            encryption: true,
            namespace: 'session'
        });
        this.configs.set('computed_results', {
            level: CacheLevel.MEMORY,
            strategy: CacheStrategy.LFU,
            ttl: 7200,
            maxSize: 2000,
            compression: true,
            encryption: false,
            namespace: 'computed'
        });
    }
    async get(key, namespace = 'default') {
        const startTime = Date.now();
        const fullKey = this.buildKey(key, namespace);
        try {
            const entry = this.memoryCache.get(fullKey);
            if (!entry) {
                this.recordMiss(namespace);
                return null;
            }
            if (this.isExpired(entry)) {
                this.memoryCache.delete(fullKey);
                this.recordMiss(namespace);
                return null;
            }
            entry.accessCount++;
            entry.lastAccessed = Date.now();
            const value = entry.compressed ? await this.decompress(entry.value) : entry.value;
            this.recordHit(namespace, Date.now() - startTime);
            structuredLogger.debug('Cache hit', {
                key: fullKey,
                namespace,
                accessTime: Date.now() - startTime,
                accessCount: entry.accessCount
            });
            return value;
        }
        catch (error) {
            structuredLogger.error('Cache get error', {
                key: fullKey,
                namespace,
                error: error instanceof Error ? error.message : String(error)
            });
            this.recordMiss(namespace);
            return null;
        }
    }
    async set(key, value, namespace = 'default', customTtl) {
        const startTime = Date.now();
        const fullKey = this.buildKey(key, namespace);
        const config = this.configs.get(namespace) || this.getDefaultConfig();
        try {
            const processedValue = config.compression ? await this.compress(value) : value;
            const entry = {
                key: fullKey,
                value: processedValue,
                timestamp: Date.now(),
                ttl: customTtl || config.ttl,
                accessCount: 0,
                lastAccessed: Date.now(),
                compressed: config.compression,
                encrypted: config.encryption,
                metadata: {
                    size: JSON.stringify(value).length,
                    namespace
                }
            };
            if (this.memoryCache.size >= config.maxSize) {
                await this.evictEntries(namespace, config);
            }
            this.memoryCache.set(fullKey, entry);
            structuredLogger.debug('Cache set', {
                key: fullKey,
                namespace,
                ttl: entry.ttl,
                compressed: entry.compressed,
                size: entry.metadata?.size
            });
            this.recordSet(namespace, Date.now() - startTime);
            return true;
        }
        catch (error) {
            structuredLogger.error('Cache set error', {
                key: fullKey,
                namespace,
                error: error instanceof Error ? error.message : String(error)
            });
            return false;
        }
    }
    async delete(key, namespace = 'default') {
        const fullKey = this.buildKey(key, namespace);
        const deleted = this.memoryCache.delete(fullKey);
        if (deleted) {
            structuredLogger.debug('Cache delete', { key: fullKey, namespace });
        }
        return deleted;
    }
    async invalidateNamespace(namespace) {
        let deletedCount = 0;
        const keysToDelete = [];
        for (const [key, entry] of this.memoryCache.entries()) {
            if (entry.metadata?.namespace === namespace) {
                keysToDelete.push(key);
            }
        }
        for (const key of keysToDelete) {
            if (this.memoryCache.delete(key)) {
                deletedCount++;
            }
        }
        structuredLogger.info('Namespace invalidated', {
            namespace,
            deletedCount
        });
        return deletedCount;
    }
    async invalidatePattern(pattern, namespace = 'default') {
        let deletedCount = 0;
        const regex = new RegExp(pattern);
        const keysToDelete = [];
        for (const [key, entry] of this.memoryCache.entries()) {
            if (entry.metadata?.namespace === namespace && regex.test(key)) {
                keysToDelete.push(key);
            }
        }
        for (const key of keysToDelete) {
            if (this.memoryCache.delete(key)) {
                deletedCount++;
            }
        }
        structuredLogger.info('Pattern invalidated', {
            pattern,
            namespace,
            deletedCount
        });
        return deletedCount;
    }
    getStats(namespace) {
        if (namespace) {
            return this.stats.get(namespace) || this.createEmptyStats();
        }
        const allStats = {};
        for (const [ns, stats] of this.stats.entries()) {
            allStats[ns] = stats;
        }
        return allStats;
    }
    async cleanup() {
        let cleanedCount = 0;
        const keysToDelete = [];
        for (const [key, entry] of this.memoryCache.entries()) {
            if (this.isExpired(entry)) {
                keysToDelete.push(key);
            }
        }
        for (const key of keysToDelete) {
            if (this.memoryCache.delete(key)) {
                cleanedCount++;
            }
        }
        if (cleanedCount > 0) {
            structuredLogger.info('Cache cleanup completed', { cleanedCount });
        }
        return cleanedCount;
    }
    buildKey(key, namespace) {
        return `${namespace}:${key}`;
    }
    isExpired(entry) {
        const now = Date.now();
        return (now - entry.timestamp) > (entry.ttl * 1000);
    }
    async evictEntries(namespace, config) {
        const entries = Array.from(this.memoryCache.entries())
            .filter(([_, entry]) => entry.metadata?.namespace === namespace);
        let toEvict = [];
        switch (config.strategy) {
            case CacheStrategy.LRU:
                toEvict = entries
                    .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed)
                    .slice(0, Math.ceil(entries.length * 0.1))
                    .map(([key]) => key);
                break;
            case CacheStrategy.LFU:
                toEvict = entries
                    .sort((a, b) => a[1].accessCount - b[1].accessCount)
                    .slice(0, Math.ceil(entries.length * 0.1))
                    .map(([key]) => key);
                break;
            case CacheStrategy.TTL:
                toEvict = entries
                    .filter(([_, entry]) => this.isExpired(entry))
                    .map(([key]) => key);
                break;
        }
        for (const key of toEvict) {
            this.memoryCache.delete(key);
            this.recordEviction(namespace);
        }
    }
    async compress(value) {
        return value;
    }
    async decompress(value) {
        return value;
    }
    recordHit(namespace, accessTime) {
        const stats = this.getOrCreateStats(namespace);
        stats.hits++;
        stats.hitRate = stats.hits / (stats.hits + stats.misses);
        stats.averageAccessTime = (stats.averageAccessTime * (stats.hits - 1) + accessTime) / stats.hits;
        metrics.cacheHits.inc({ namespace });
        metrics.cacheAccessTime.observe({ namespace }, accessTime);
    }
    recordMiss(namespace) {
        const stats = this.getOrCreateStats(namespace);
        stats.misses++;
        stats.hitRate = stats.hits / (stats.hits + stats.misses);
        metrics.cacheMisses.inc({ namespace });
    }
    recordSet(namespace, setTime) {
        const stats = this.getOrCreateStats(namespace);
        stats.entryCount = this.memoryCache.size;
        metrics.cacheSets.inc({ namespace });
        metrics.cacheSetTime.observe({ namespace }, setTime);
    }
    recordEviction(namespace) {
        const stats = this.getOrCreateStats(namespace);
        stats.evictions++;
        metrics.cacheEvictions.inc({ namespace });
    }
    getOrCreateStats(namespace) {
        if (!this.stats.has(namespace)) {
            this.stats.set(namespace, this.createEmptyStats());
        }
        return this.stats.get(namespace);
    }
    createEmptyStats() {
        return {
            hits: 0,
            misses: 0,
            hitRate: 0,
            totalSize: 0,
            entryCount: 0,
            evictions: 0,
            compressionRatio: 0,
            averageAccessTime: 0
        };
    }
    getDefaultConfig() {
        return {
            level: CacheLevel.MEMORY,
            strategy: CacheStrategy.TTL,
            ttl: 300,
            maxSize: 1000,
            compression: false,
            encryption: false,
            namespace: 'default'
        };
    }
    startCleanupInterval() {
        setInterval(async () => {
            await this.cleanup();
        }, 60000);
    }
    startStatsCollection() {
        setInterval(() => {
            this.updateStats();
        }, 30000);
    }
    updateStats() {
        for (const [namespace, stats] of this.stats.entries()) {
            stats.entryCount = Array.from(this.memoryCache.values())
                .filter(entry => entry.metadata?.namespace === namespace).length;
            metrics.cacheSize.set({ namespace }, stats.entryCount);
            metrics.cacheHitRate.set({ namespace }, stats.hitRate);
        }
    }
}
export const cacheManagerService = CacheManagerService.getInstance();
//# sourceMappingURL=cache-manager.service.js.map