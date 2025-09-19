import { structuredLogger } from './structured-logger.js';
export class CacheWarmupService {
    cache = new Map();
    stats = { hits: 0, misses: 0 };
    isWarmingUp = false;
    constructor() {
        this.startCleanupInterval();
    }
    startCleanupInterval() {
        setInterval(() => {
            this.cleanupExpired();
        }, 300000);
    }
    cleanupExpired() {
        const now = Date.now();
        const expiredKeys = [];
        for (const [key, item] of this.cache.entries()) {
            if (item.expires < now) {
                expiredKeys.push(key);
            }
        }
        expiredKeys.forEach(key => this.cache.delete(key));
        if (expiredKeys.length > 0) {
            structuredLogger.debug('Cache cleanup completed', {
                expiredItems: expiredKeys.length,
                remainingItems: this.cache.size
            });
        }
    }
    async warmupAll() {
        if (this.isWarmingUp) {
            throw new Error('Cache warmup already in progress');
        }
        this.isWarmingUp = true;
        const results = [];
        try {
            results.push(await this.warmupUserSessions());
            results.push(await this.warmupFinancialData());
            results.push(await this.warmupSystemMetrics());
            results.push(await this.warmupApiEndpoints());
            structuredLogger.info('Cache warmup completed', {
                totalServices: results.length,
                successfulServices: results.filter(r => r.success).length,
                totalDuration: results.reduce((sum, r) => sum + r.duration, 0)
            });
            return results;
        }
        finally {
            this.isWarmingUp = false;
        }
    }
    async warmupUserSessions() {
        const startTime = Date.now();
        try {
            const sessionKeys = ['active_users', 'user_permissions', 'user_preferences'];
            let itemsWarmed = 0;
            for (const key of sessionKeys) {
                const mockData = {
                    timestamp: Date.now(),
                    data: `cached_${key}_data`
                };
                this.set(key, mockData, 3600);
                itemsWarmed++;
            }
            return {
                service: 'UserSessions',
                success: true,
                duration: Date.now() - startTime,
                itemsWarmed
            };
        }
        catch (error) {
            return {
                service: 'UserSessions',
                success: false,
                duration: Date.now() - startTime,
                itemsWarmed: 0,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async warmupFinancialData() {
        const startTime = Date.now();
        try {
            const financialKeys = ['exchange_rates', 'market_data', 'portfolio_summary'];
            let itemsWarmed = 0;
            for (const key of financialKeys) {
                const mockData = {
                    timestamp: Date.now(),
                    rates: { EUR: 1, USD: 1.1, GBP: 0.85 },
                    lastUpdate: new Date().toISOString()
                };
                this.set(key, mockData, 1800);
                itemsWarmed++;
            }
            return {
                service: 'FinancialData',
                success: true,
                duration: Date.now() - startTime,
                itemsWarmed
            };
        }
        catch (error) {
            return {
                service: 'FinancialData',
                success: false,
                duration: Date.now() - startTime,
                itemsWarmed: 0,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async warmupSystemMetrics() {
        const startTime = Date.now();
        try {
            const metricsKeys = ['cpu_usage', 'memory_usage', 'disk_usage', 'network_stats'];
            let itemsWarmed = 0;
            for (const key of metricsKeys) {
                const mockData = {
                    timestamp: Date.now(),
                    value: Math.random() * 100,
                    unit: 'percent'
                };
                this.set(key, mockData, 300);
                itemsWarmed++;
            }
            return {
                service: 'SystemMetrics',
                success: true,
                duration: Date.now() - startTime,
                itemsWarmed
            };
        }
        catch (error) {
            return {
                service: 'SystemMetrics',
                success: false,
                duration: Date.now() - startTime,
                itemsWarmed: 0,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async warmupApiEndpoints() {
        const startTime = Date.now();
        try {
            const endpoints = ['/api/health', '/api/metrics', '/api/status'];
            let itemsWarmed = 0;
            for (const endpoint of endpoints) {
                const mockResponse = {
                    timestamp: Date.now(),
                    status: 'healthy',
                    responseTime: Math.random() * 100
                };
                this.set(`endpoint_${endpoint}`, mockResponse, 600);
                itemsWarmed++;
            }
            return {
                service: 'ApiEndpoints',
                success: true,
                duration: Date.now() - startTime,
                itemsWarmed
            };
        }
        catch (error) {
            return {
                service: 'ApiEndpoints',
                success: false,
                duration: Date.now() - startTime,
                itemsWarmed: 0,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    set(key, value, ttlSeconds) {
        const expires = Date.now() + (ttlSeconds * 1000);
        this.cache.set(key, { value, expires });
    }
    get(key) {
        const item = this.cache.get(key);
        if (!item) {
            this.stats.misses++;
            return undefined;
        }
        if (item.expires < Date.now()) {
            this.cache.delete(key);
            this.stats.misses++;
            return undefined;
        }
        this.stats.hits++;
        return item.value;
    }
    has(key) {
        const item = this.cache.get(key);
        if (!item)
            return false;
        if (item.expires < Date.now()) {
            this.cache.delete(key);
            return false;
        }
        return true;
    }
    delete(key) {
        return this.cache.delete(key);
    }
    clear() {
        this.cache.clear();
        this.stats = { hits: 0, misses: 0 };
    }
    getStats() {
        const total = this.stats.hits + this.stats.misses;
        return {
            hits: this.stats.hits,
            misses: this.stats.misses,
            hitRate: total > 0 ? this.stats.hits / total : 0,
            size: this.cache.size,
            ttl: 0
        };
    }
    isWarmingUpStatus() {
        return this.isWarmingUp;
    }
}
export const cacheWarmupService = new CacheWarmupService();
//# sourceMappingURL=cache-warmup.service.js.map