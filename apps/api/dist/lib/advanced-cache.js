export class AdvancedCache {
    cache = new Map();
    options;
    stats;
    constructor(options = {}) {
        this.options = {
            ttl: options.ttl || 3600,
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
        setInterval(() => {
            this.cleanup();
        }, 60000);
    }
    cleanup() {
        const now = Date.now();
        const expiredKeys = [];
        for (const [key, item] of this.cache.entries()) {
            if (now - item.timestamp > this.options.ttl * 1000) {
                expiredKeys.push(key);
            }
        }
        expiredKeys.forEach(key => this.delete(key));
    }
    set(key, value) {
        const now = Date.now();
        if (this.cache.size >= this.options.maxSize && !this.cache.has(key)) {
            this.evict();
        }
        this.cache.set(key, {
            value,
            timestamp: now,
            accessCount: 1,
            lastAccessed: now
        });
        this.stats.sets++;
        this.updateStats();
    }
    get(key) {
        const item = this.cache.get(key);
        if (!item) {
            this.stats.misses++;
            this.updateStats();
            return undefined;
        }
        const now = Date.now();
        if (now - item.timestamp > this.options.ttl * 1000) {
            this.delete(key);
            this.stats.misses++;
            this.updateStats();
            return undefined;
        }
        item.accessCount++;
        item.lastAccessed = now;
        this.stats.hits++;
        this.updateStats();
        return item.value;
    }
    delete(key) {
        const deleted = this.cache.delete(key);
        if (deleted) {
            this.stats.deletes++;
            this.updateStats();
        }
        return deleted;
    }
    evict() {
        if (this.cache.size === 0)
            return;
        let keyToEvict;
        switch (this.options.strategy) {
            case 'lru':
                keyToEvict = this.findLRU();
                break;
            case 'lfu':
                keyToEvict = this.findLFU();
                break;
            case 'fifo':
                keyToEvict = this.cache.keys().next().value;
                break;
            default:
                keyToEvict = this.cache.keys().next().value;
        }
        this.cache.delete(keyToEvict);
        this.stats.evictions++;
    }
    findLRU() {
        let oldestKey = '';
        let oldestTime = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (item.lastAccessed < oldestTime) {
                oldestTime = item.lastAccessed;
                oldestKey = key;
            }
        }
        return oldestKey;
    }
    findLFU() {
        let leastUsedKey = '';
        let leastCount = Infinity;
        for (const [key, item] of this.cache.entries()) {
            if (item.accessCount < leastCount) {
                leastCount = item.accessCount;
                leastUsedKey = key;
            }
        }
        return leastUsedKey;
    }
    updateStats() {
        this.stats.size = this.cache.size;
        this.stats.hitRate = this.stats.hits / (this.stats.hits + this.stats.misses) || 0;
        let memoryUsage = 0;
        for (const [key, item] of this.cache.entries()) {
            memoryUsage += key.length * 2;
            memoryUsage += JSON.stringify(item.value).length * 2;
            memoryUsage += 32;
        }
        this.stats.memoryUsage = memoryUsage;
    }
    getStats() {
        return { ...this.stats };
    }
    clear() {
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
    }
    has(key) {
        return this.cache.has(key);
    }
    keys() {
        return this.cache.keys();
    }
    size() {
        return this.cache.size;
    }
}
export const advancedCache = new AdvancedCache();
//# sourceMappingURL=advanced-cache.js.map