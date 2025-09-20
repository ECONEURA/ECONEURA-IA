import { z } from "zod";
import { logger } from './logger.js';
const SearchQuerySchema = z.object({
    query: z.string().min(1),
    userId: z.string().optional(),
    orgId: z.string().optional(),
    filters: z.record(z.any()).optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
    page: z.number().min(1).optional(),
    limit: z.number().min(1).max(100).optional(),
    sources: z.array(z.string()).optional(),
    includeFederated: z.boolean().optional(),
});
const SearchResultSchema = z.object({
    id: z.string(),
    title: z.string(),
    content: z.string(),
    url: z.string().optional(),
    type: z.enum(["document", "user", "product", "federated"]),
    score: z.number().min(0).max(1),
    highlights: z.array(z.string()).optional(),
    metadata: z.record(z.any()).optional(),
    source: z.string(),
    timestamp: z.date(),
});
const SearchSuggestionSchema = z.object({
    query: z.string(),
    type: z.enum(["history", "popular", "related", "correction"]),
    score: z.number().min(0).max(1),
    count: z.number().optional(),
});
const SearchHistorySchema = z.object({
    id: z.string(),
    userId: z.string(),
    query: z.string(),
    resultsCount: z.number(),
    timestamp: z.date(),
    filters: z.record(z.any()).optional(),
    sources: z.array(z.string()).optional(),
});
const SearchAnalyticsSchema = z.object({
    totalSearches: z.number(),
    averageResponseTime: z.number(),
    cacheHitRate: z.number(),
    popularQueries: z.array(z.object({
        query: z.string(),
        count: z.number(),
    })),
    searchByType: z.record(z.number()),
});
const FederatedSearchConfigSchema = z.object({
    sourceId: z.string(),
    name: z.string(),
    url: z.string(),
    type: z.enum(["api", "database", "file"]),
    config: z.record(z.any()),
    enabled: z.boolean(),
});
export class AdvancedSearchEngine {
    searchIndex = new Map();
    searchCache = new Map();
    searchHistory = new Map();
    searchAnalytics = {
        totalSearches: 0,
        averageResponseTime: 0,
        cacheHitRate: 0,
        popularQueries: [],
        searchByType: {},
    };
    federatedSources = new Map();
    constructor() {
        this.initializeSampleData();
        logger.info("Advanced search engine initialized");
    }
    async search(params) {
        const startTime = Date.now();
        try {
            const cacheKey = this.generateCacheKey(params);
            const cachedResult = this.searchCache.get(cacheKey);
            if (cachedResult) {
                this.updateAnalytics(startTime, true);
                return cachedResult;
            }
            let results = [];
            results = await this.performLocalSearch(params);
            if (params.includeFederated !== false) {
                const federatedResults = await this.performFederatedSearch(params);
                results = results.concat(federatedResults);
            }
            results = this.applyFilters(results, params.filters);
            results = this.sortResults(results, params.sortBy, params.sortOrder);
            const page = params.page || 1;
            const limit = params.limit || 20;
            const startIndex = (page - 1) * limit;
            const paginatedResults = results.slice(startIndex, startIndex + limit);
            const suggestions = await this.generateSuggestions(params.query, results);
            if (params.userId) {
                await this.saveSearchHistory(params, results.length);
            }
            this.updateAnalytics(startTime, false);
            const result = {
                results: paginatedResults,
                suggestions,
                analytics: this.getSearchAnalytics(),
                totalCount: results.length,
                page,
                limit,
            };
            this.searchCache.set(cacheKey, result);
            return result;
        }
        catch (error) {
            throw error;
        }
    }
    async performLocalSearch(params) {
        const results = [];
        const query = params.query.toLowerCase();
        const documents = this.searchIndex.get("documents") || [];
        for (const doc of documents) {
            if (this.matchesQuery(doc, query)) {
                results.push({
                    id: doc.id,
                    title: doc.title,
                    content: doc.content,
                    url: doc.url,
                    type: "document",
                    score: this.calculateScore(doc, query),
                    highlights: this.generateHighlights(doc, query),
                    metadata: doc.metadata,
                    source: "local",
                    timestamp: new Date(doc.timestamp),
                });
            }
        }
        const users = this.searchIndex.get("users") || [];
        for (const user of users) {
            if (this.matchesQuery(user, query)) {
                results.push({
                    id: user.id,
                    title: user.name,
                    content: user.email,
                    url: `/users/${user.id}`,
                    type: "user",
                    score: this.calculateScore(user, query),
                    highlights: this.generateHighlights(user, query),
                    metadata: user.metadata,
                    source: "local",
                    timestamp: new Date(user.timestamp),
                });
            }
        }
        const products = this.searchIndex.get("products") || [];
        for (const product of products) {
            if (this.matchesQuery(product, query)) {
                results.push({
                    id: product.id,
                    title: product.name,
                    content: product.description,
                    url: `/products/${product.id}`,
                    type: "product",
                    score: this.calculateScore(product, query),
                    highlights: this.generateHighlights(product, query),
                    metadata: product.metadata,
                    source: "local",
                    timestamp: new Date(product.timestamp),
                });
            }
        }
        return results;
    }
    async performFederatedSearch(params) {
        const results = [];
        const sources = params.sources || Array.from(this.federatedSources.keys());
        for (const sourceId of sources) {
            const source = this.federatedSources.get(sourceId);
            if (source && source.enabled) {
                try {
                    const sourceResults = await this.queryFederatedSource(source, params);
                    results.push(...sourceResults);
                }
                catch (error) {
                    logger.error("Federated search failed", { error: error.message });
                }
            }
        }
        return results;
    }
    matchesQuery(item, query) {
        const searchableFields = [
            item.title || "",
            item.name || "",
            item.content || "",
            item.description || "",
            item.email || "",
        ].join(" ").toLowerCase();
        return searchableFields.includes(query);
    }
    calculateScore(item, query) {
        const searchableFields = [
            item.title || "",
            item.name || "",
            item.content || "",
            item.description || "",
            item.email || "",
        ].join(" ").toLowerCase();
        const queryWords = query.split(" ");
        let score = 0;
        for (const word of queryWords) {
            if (searchableFields.includes(word)) {
                score += 0.2;
            }
        }
        return Math.min(score, 1);
    }
    generateHighlights(item, query) {
        const highlights = [];
        const searchableFields = [
            item.title || "",
            item.name || "",
            item.content || "",
            item.description || "",
            item.email || "",
        ];
        const queryWords = query.split(" ");
        for (const field of searchableFields) {
            for (const word of queryWords) {
                if (field.toLowerCase().includes(word)) {
                    const index = field.toLowerCase().indexOf(word);
                    const highlight = field.substring(Math.max(0, index - 20), index + word.length + 20);
                    highlights.push(`...${highlight}...`);
                }
            }
        }
        return highlights.slice(0, 3);
    }
    applyFilters(results, filters) {
        if (!filters)
            return results;
        return results.filter(result => {
            for (const [key, value] of Object.entries(filters)) {
                if (result.metadata && result.metadata[key] !== value) {
                    return false;
                }
            }
            return true;
        });
    }
    sortResults(results, sortBy, sortOrder = "desc") {
        if (!sortBy)
            return results;
        return results.sort((a, b) => {
            const aValue = a[sortBy];
            const bValue = b[sortBy];
            if (aValue < bValue)
                return sortOrder === "asc" ? -1 : 1;
            if (aValue > bValue)
                return sortOrder === "asc" ? 1 : -1;
            return 0;
        });
    }
    async queryFederatedSource(source, params) {
        const results = [];
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
        for (let i = 0; i < Math.floor(Math.random() * 5) + 1; i++) {
            results.push({
                id: `${source.sourceId}-${i}`,
                title: `Result from ${source.name}`,
                content: `Content from federated source ${source.name} for query: ${params.query}`,
                url: `${source.url}/result/${i}`,
                type: "federated",
                score: Math.random(),
                highlights: [`Highlight from ${source.name}`],
                metadata: { source: source.sourceId },
                source: source.sourceId,
                timestamp: new Date(),
            });
        }
        return results;
    }
    async generateSuggestions(query, results) {
        const suggestions = [];
        const historySuggestions = this.getHistorySuggestions(query);
        suggestions.push(...historySuggestions);
        const popularSuggestions = this.getPopularSuggestions(query);
        suggestions.push(...popularSuggestions);
        const relatedSuggestions = this.getRelatedSuggestions(query, results);
        suggestions.push(...relatedSuggestions);
        const correctionSuggestions = this.getSpellCorrections(query);
        suggestions.push(...correctionSuggestions);
        return suggestions
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);
    }
    getHistorySuggestions(query) {
        const suggestions = [];
        const queryLower = query.toLowerCase();
        for (const [userId, history] of this.searchHistory.entries()) {
            for (const entry of history) {
                if (entry.query.toLowerCase().includes(queryLower) && entry.query !== query) {
                    suggestions.push({
                        query: entry.query,
                        type: "history",
                        score: 0.8,
                        count: 1,
                    });
                }
            }
        }
        return suggestions;
    }
    getPopularSuggestions(query) {
        const suggestions = [];
        const queryLower = query.toLowerCase();
        const popularQueries = [
            "user management",
            "product catalog",
            "analytics dashboard",
            "security settings",
            "workflow engine",
        ];
        for (const popularQuery of popularQueries) {
            if (popularQuery.toLowerCase().includes(queryLower)) {
                suggestions.push({
                    query: popularQuery,
                    type: "popular",
                    score: 0.9,
                    count: 10,
                });
            }
        }
        return suggestions;
    }
    getRelatedSuggestions(query, results) {
        const suggestions = [];
        for (const result of results.slice(0, 3)) {
            const words = result.title.split(" ");
            for (const word of words) {
                if (word.length > 3 && !query.toLowerCase().includes(word.toLowerCase())) {
                    suggestions.push({
                        query: `${query} ${word}`,
                        type: "related",
                        score: 0.6,
                        count: 1,
                    });
                }
            }
        }
        return suggestions;
    }
    getSpellCorrections(query) {
        const suggestions = [];
        const corrections = {
            "usar": "user",
            "produt": "product",
            "analitics": "analytics",
            "securty": "security",
        };
        for (const [incorrect, correct] of Object.entries(corrections)) {
            if (query.toLowerCase().includes(incorrect)) {
                const correctedQuery = query.toLowerCase().replace(incorrect, correct);
                suggestions.push({
                    query: correctedQuery,
                    type: "correction",
                    score: 0.7,
                    count: 1,
                });
            }
        }
        return suggestions;
    }
    async saveSearchHistory(params, resultsCount) {
        const historyEntry = {
            id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: params.userId,
            query: params.query,
            resultsCount,
            timestamp: new Date(),
            filters: params.filters,
            sources: params.sources,
        };
        const userId = historyEntry.userId;
        if (!this.searchHistory.has(userId)) {
            this.searchHistory.set(userId, []);
        }
        this.searchHistory.get(userId).push(historyEntry);
        if (this.searchHistory.get(userId).length > 50) {
            this.searchHistory.get(userId).shift();
        }
        logger.info("Search history saved");
    }
    updateAnalytics(startTime, cacheHit) {
        const responseTime = Date.now() - startTime;
        this.searchAnalytics.totalSearches++;
        this.searchAnalytics.averageResponseTime =
            (this.searchAnalytics.averageResponseTime * (this.searchAnalytics.totalSearches - 1) + responseTime) / this.searchAnalytics.totalSearches;
        if (cacheHit) {
            this.searchAnalytics.cacheHitRate =
                (this.searchAnalytics.cacheHitRate * (this.searchAnalytics.totalSearches - 1) + 1) / this.searchAnalytics.totalSearches;
        }
        else {
            this.searchAnalytics.cacheHitRate =
                (this.searchAnalytics.cacheHitRate * (this.searchAnalytics.totalSearches - 1)) / this.searchAnalytics.totalSearches;
        }
    }
    getSearchAnalytics() {
        return { ...this.searchAnalytics };
    }
    getSearchHistory(userId) {
        return this.searchHistory.get(userId) || [];
    }
    addFederatedSource(config) {
        this.federatedSources.set(config.sourceId, config);
        logger.info("Federated source added");
    }
    removeFederatedSource(sourceId) {
        this.federatedSources.delete(sourceId);
        logger.info("Federated source removed");
    }
    getFederatedSources() {
        return Array.from(this.federatedSources.values());
    }
    generateCacheKey(params) {
        return `search_${JSON.stringify(params)}`;
    }
    clearCache() {
        this.searchCache.clear();
        logger.info("Search cache cleared", { cacheSize: 0 });
    }
    getCacheStats() {
        return {
            size: this.searchCache.size,
            hitRate: this.searchAnalytics.cacheHitRate,
        };
    }
    initializeSampleData() {
        this.searchIndex.set("documents", [
            {
                id: "doc_1",
                title: "User Management Guide",
                content: "Complete guide for managing users in the system",
                url: "/docs/user-management",
                metadata: { category: "documentation", author: "admin" },
                timestamp: new Date(),
            },
            {
                id: "doc_2",
                title: "Product Catalog API",
                content: "API documentation for product catalog management",
                url: "/docs/product-api",
                metadata: { category: "api", author: "developer" },
                timestamp: new Date(),
            },
            {
                id: "doc_3",
                title: "Analytics Dashboard Setup",
                content: "How to set up and configure analytics dashboards",
                url: "/docs/analytics-setup",
                metadata: { category: "tutorial", author: "analyst" },
                timestamp: new Date(),
            },
        ]);
        this.searchIndex.set("users", [
            {
                id: "user_1",
                name: "John Doe",
                email: "john.doe@example.com",
                metadata: { role: "admin", department: "IT" },
                timestamp: new Date(),
            },
            {
                id: "user_2",
                name: "Jane Smith",
                email: "jane.smith@example.com",
                metadata: { role: "user", department: "Marketing" },
                timestamp: new Date(),
            },
        ]);
        this.searchIndex.set("products", [
            {
                id: "prod_1",
                name: "Enterprise CRM",
                description: "Complete customer relationship management solution",
                metadata: { category: "software", price: 999 },
                timestamp: new Date(),
            },
            {
                id: "prod_2",
                name: "Analytics Platform",
                description: "Advanced analytics and reporting platform",
                metadata: { category: "software", price: 1499 },
                timestamp: new Date(),
            },
        ]);
        this.addFederatedSource({
            sourceId: "external_api",
            name: "External API",
            url: "https://api.external.com",
            type: "api",
            config: { apiKey: "mock_key" },
            enabled: true,
        });
        this.addFederatedSource({
            sourceId: "database",
            name: "Legacy Database",
            url: "postgresql://legacy:5432",
            type: "database",
            config: { connectionString: "mock_connection" },
            enabled: true,
        });
        this.addFederatedSource({
            sourceId: "file_system",
            name: "File System",
            url: "/mnt/files",
            type: "file",
            config: { path: "/mnt/files" },
            enabled: true,
        });
        logger.info("Sample data initialized for advanced search engine");
    }
}
export const advancedSearchEngine = new AdvancedSearchEngine();
//# sourceMappingURL=advanced-search.js.map