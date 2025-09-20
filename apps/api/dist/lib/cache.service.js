import { logger } from './logger.js';
export class CacheService {
    cache = new Map();
    metrics;
    config;
    cleanupTimer;
    constructor(config = {}) {
        this.config = {
            defaultTTL: 300,
            maxSize: 10000,
            cleanupInterval: 60000,
            enableMetrics: true,
            ...config
        };
        this.metrics = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            size: 0,
            hitRate: 0,
            memoryUsage: 0
        };
        this.startCleanupTimer();
        logger.info('CacheService initialized', { config: this.config });
    }
    get(key) {
        const entry = this.cache.get(key);
        if (!entry) {
            this.metrics.misses++;
            this.updateHitRate();
            return null;
        }
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            this.metrics.misses++;
            this.updateHitRate();
            return null;
        }
        entry.accessCount++;
        entry.lastAccessed = Date.now();
        this.metrics.hits++;
        this.updateHitRate();
        return entry.value;
    }
    set(key, value, ttl) {
        const now = Date.now();
        const expiresAt = now + (ttl || this.config.defaultTTL) * 1000;
        if (this.cache.size >= this.config.maxSize) {
            this.evictLRU();
        }
        const entry = {
            value,
            expiresAt,
            createdAt: now,
            accessCount: 0,
            lastAccessed: now
        };
        this.cache.set(key, entry);
        this.metrics.sets++;
        this.updateMetrics();
        logger.debug('Cache entry set', { key, ttl: ttl || this.config.defaultTTL });
    }
    delete(key) {
        const deleted = this.cache.delete(key);
        if (deleted) {
            this.metrics.deletes++;
            this.updateMetrics();
        }
        return deleted;
    }
    has(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return false;
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return false;
        }
        return true;
    }
    clear() {
        this.cache.clear();
        this.updateMetrics();
        logger.info('Cache cleared');
    }
    mget(keys) {
        const result = {};
        for (const key of keys) {
            result[key] = this.get(key);
        }
        return result;
    }
    mset(entries, ttl) {
        for (const [key, value] of Object.entries(entries)) {
            this.set(key, value, ttl);
        }
    }
    async getOrSet(key, factory, ttl) {
        const cached = this.get(key);
        if (cached !== null) {
            return cached;
        }
        const value = await factory();
        this.set(key, value, ttl);
        return value;
    }
    invalidatePattern(pattern) {
        const regex = new RegExp(pattern);
        let count = 0;
        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                this.cache.delete(key);
                count++;
            }
        }
        this.updateMetrics();
        logger.info('Cache invalidated by pattern', { pattern, count });
        return count;
    }
    getMetrics() {
        this.updateMetrics();
        return { ...this.metrics };
    }
    getStats() {
        const entries = Array.from(this.cache.values());
        const now = Date.now();
        return {
            size: this.cache.size,
            maxSize: this.config.maxSize,
            utilization: (this.cache.size / this.config.maxSize) * 100,
            expired: entries.filter(e => now > e.expiresAt).length,
            averageAge: entries.length > 0
                ? entries.reduce((sum, e) => sum + (now - e.createdAt), 0) / entries.length / 1000
                : 0,
            averageAccessCount: entries.length > 0
                ? entries.reduce((sum, e) => sum + e.accessCount, 0) / entries.length
                : 0,
            topKeys: entries
                .sort((a, b) => b.accessCount - a.accessCount)
                .slice(0, 10)
                .map(e => ({ accessCount: e.accessCount, age: (now - e.createdAt) / 1000 }))
        };
    }
    setTTLPattern(pattern, ttl) {
        logger.info('TTL pattern configured', { pattern, ttl });
    }
    export() {
        const data = {};
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now < entry.expiresAt) {
                data[key] = {
                    value: entry.value,
                    ttl: Math.floor((entry.expiresAt - now) / 1000),
                    createdAt: entry.createdAt,
                    accessCount: entry.accessCount
                };
            }
        }
        return data;
    }
    import(data) {
        const now = Date.now();
        for (const [key, entry] of Object.entries(data)) {
            const cacheEntry = {
                value: entry.value,
                expiresAt: now + entry.ttl * 1000,
                createdAt: entry.createdAt || now,
                accessCount: entry.accessCount || 0,
                lastAccessed: now
            };
            this.cache.set(key, cacheEntry);
        }
        this.updateMetrics();
        logger.info('Cache imported', { entries: Object.keys(data).length });
    }
    evictLRU() {
        let oldestKey = '';
        let oldestTime = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (entry.lastAccessed < oldestTime) {
                oldestTime = entry.lastAccessed;
                oldestKey = key;
            }
        }
        if (oldestKey) {
            this.cache.delete(oldestKey);
            logger.debug('LRU entry evicted', { key: oldestKey });
        }
    }
    updateHitRate() {
        const total = this.metrics.hits + this.metrics.misses;
        this.metrics.hitRate = total > 0 ? (this.metrics.hits / total) * 100 : 0;
    }
    updateMetrics() {
        this.metrics.size = this.cache.size;
        this.metrics.memoryUsage = this.estimateMemoryUsage();
    }
    estimateMemoryUsage() {
        let size = 0;
        for (const [key, entry] of this.cache.entries()) {
            size += key.length * 2;
            size += JSON.stringify(entry.value).length * 2;
            size += 100;
        }
        return size;
    }
    startCleanupTimer() {
        this.cleanupTimer = setInterval(() => {
            this.cleanup();
        }, this.config.cleanupInterval);
    }
    cleanup() {
        const now = Date.now();
        let cleaned = 0;
        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                this.cache.delete(key);
                cleaned++;
            }
        }
        if (cleaned > 0) {
            this.updateMetrics();
            logger.debug('Cache cleanup completed', { cleaned, remaining: this.cache.size });
        }
    }
    destroy() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
        }
        this.clear();
        logger.info('CacheService destroyed');
    }
}
export const cacheService = new CacheService({
    defaultTTL: 300,
    maxSize: 10000,
    cleanupInterval: 60000,
    enableMetrics: true
});
export const cacheMiddleware = (ttl = 300) => {
    return (req, res, next) => {
        const key = `api:${req.method}:${req.originalUrl}:${JSON.stringify(req.query)}`;
        const cached = cacheService.get(key);
        if (cached) {
            res.set('X-Cache', 'HIT');
            return res.json(cached);
        }
        const originalSend = res.json;
        res.json = function (data) {
            cacheService.set(key, data, ttl);
            res.set('X-Cache', 'MISS');
            return originalSend.call(this, data);
        };
        next();
    };
};
export function Cached(ttl = 300, keyGenerator) {
    return function (target, propertyName, descriptor) {
        const method = descriptor.value;
        descriptor.value = async function (...args) {
            const key = keyGenerator
                ? keyGenerator(...args)
                : `service:${target.constructor.name}:${propertyName}:${JSON.stringify(args)}`;
            return cacheService.getOrSet(key, () => method.apply(this, args), ttl);
        };
    };
}
//# sourceMappingURL=cache.service.js.map