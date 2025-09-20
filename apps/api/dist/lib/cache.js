import { logger } from './logger.js';
export class IntelligentCache {
    memoryCache = new Map();
    config;
    stats = {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        warmupItems: 0,
    };
    constructor(config) {
        this.config = config;
        logger.info('Cache system initialized', {
            type: config.type,
            ttl: config.ttl,
            maxSize: config.maxSize
        });
    }
    async get(key) {
        const item = this.memoryCache.get(key);
        if (!item) {
            this.stats.misses++;
            logger.debug('Cache miss', { key, stats: this.stats });
            return null;
        }
        const now = Date.now();
        const isExpired = (now - item.timestamp) > (item.ttl * 1000);
        if (isExpired) {
            this.memoryCache.delete(key);
            this.stats.misses++;
            logger.debug('Cache expired', { key, age: now - item.timestamp });
            return null;
        }
        item.accessCount++;
        item.lastAccessed = now;
        this.stats.hits++;
        logger.debug('Cache hit', {
            key,
            accessCount: item.accessCount,
            age: now - item.timestamp,
            stats: this.stats
        });
        return item.value;
    }
    async set(key, value, ttl) {
        const now = Date.now();
        const itemTtl = ttl || this.config.ttl;
        const item = {
            value,
            timestamp: now,
            ttl: itemTtl,
            accessCount: 0,
            lastAccessed: now,
        };
        if (this.config.type === 'memory' && this.config.maxSize) {
            if (this.memoryCache.size >= this.config.maxSize) {
                this.evictLeastUsed();
            }
        }
        this.memoryCache.set(key, item);
        this.stats.sets++;
        logger.debug('Cache set', {
            key,
            ttl: itemTtl,
            cacheSize: this.memoryCache.size,
            stats: this.stats
        });
    }
    async delete(key) {
        const deleted = this.memoryCache.delete(key);
        if (deleted) {
            this.stats.deletes++;
            logger.debug('Cache delete', { key, stats: this.stats });
        }
    }
    async clear() {
        const size = this.memoryCache.size;
        this.memoryCache.clear();
        logger.info('Cache cleared', { previousSize: size });
    }
    async warmup(patterns) {
        logger.info('Starting cache warmup', { patternsCount: patterns.length });
        for (const pattern of patterns) {
            await this.set(pattern.key, pattern.value, pattern.ttl);
            this.stats.warmupItems++;
        }
        logger.info('Cache warmup completed', {
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
    evictLeastUsed() {
        let leastUsedKey = null;
        let leastUsedScore = Infinity;
        for (const [key, item] of this.memoryCache.entries()) {
            const score = item.accessCount * 0.3 + (Date.now() - item.lastAccessed) * 0.7;
            if (score < leastUsedScore) {
                leastUsedScore = score;
                leastUsedKey = key;
            }
        }
        if (leastUsedKey) {
            this.memoryCache.delete(leastUsedKey);
            logger.debug('Evicted least used item', { key: leastUsedKey, score: leastUsedScore });
        }
    }
}
export class AICache extends IntelligentCache {
    constructor(config) {
        super(config);
    }
    async getAIResponse(prompt, model) {
        const key = `ai:${model}:${this.hashPrompt(prompt)}`;
        return this.get(key);
    }
    async setAIResponse(prompt, model, response, ttl) {
        const key = `ai:${model}:${this.hashPrompt(prompt)}`;
        await this.set(key, response, ttl);
    }
    async warmupAI() {
        const commonPrompts = [
            {
                prompt: "What is artificial intelligence?",
                response: {
                    content: "Artificial Intelligence (AI) is a branch of computer science that aims to create systems capable of performing tasks that typically require human intelligence.",
                    model: "gpt-4",
                    timestamp: Date.now(),
                },
                ttl: 3600,
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
            {
                prompt: "How does neural networks work?",
                response: {
                    content: "Neural networks are computing systems inspired by biological neural networks, consisting of interconnected nodes that process information.",
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
    hashPrompt(prompt) {
        let hash = 0;
        for (let i = 0; i < prompt.length; i++) {
            const char = prompt.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }
}
export class SearchCache extends IntelligentCache {
    constructor(config) {
        super(config);
    }
    async getSearchResults(query, filters) {
        const key = `search:${this.hashQuery(query, filters)}`;
        return this.get(key);
    }
    async setSearchResults(query, results, filters, ttl) {
        const key = `search:${this.hashQuery(query, filters)}`;
        await this.set(key, results, ttl);
    }
    async warmupSearch() {
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
                ttl: 1800,
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
            {
                query: "neural networks",
                results: {
                    items: [
                        { title: "Neural Network Architecture", url: "https://example.com/nn-architecture" },
                        { title: "Backpropagation Explained", url: "https://example.com/backprop" },
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
    hashQuery(query, filters) {
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
export class CacheManager {
    aiCache;
    searchCache;
    warmupInterval = null;
    constructor() {
        this.aiCache = new AICache({
            type: 'memory',
            ttl: 3600,
            maxSize: 1000,
        });
        this.searchCache = new SearchCache({
            type: 'memory',
            ttl: 1800,
            maxSize: 500,
        });
        logger.info('Cache manager initialized');
    }
    getAICache() {
        return this.aiCache;
    }
    getSearchCache() {
        return this.searchCache;
    }
    async warmupAll() {
        logger.info('Starting comprehensive cache warmup');
        await Promise.all([
            this.aiCache.warmupAI(),
            this.searchCache.warmupSearch(),
        ]);
        logger.info('Comprehensive cache warmup completed');
    }
    startPeriodicWarmup(intervalMinutes = 60) {
        if (this.warmupInterval) {
            clearInterval(this.warmupInterval);
        }
        this.warmupInterval = setInterval(async () => {
            logger.info('Running periodic cache warmup');
            await this.warmupAll();
        }, intervalMinutes * 60 * 1000);
        logger.info('Periodic cache warmup started', { intervalMinutes });
    }
    stopPeriodicWarmup() {
        if (this.warmupInterval) {
            clearInterval(this.warmupInterval);
            this.warmupInterval = null;
            logger.info('Periodic cache warmup stopped');
        }
    }
    getStats() {
        return {
            ai: this.aiCache.getStats(),
            search: this.searchCache.getStats(),
        };
    }
}
//# sourceMappingURL=cache.js.map