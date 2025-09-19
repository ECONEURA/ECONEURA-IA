import { z } from "zod";
declare const SearchQuerySchema: z.ZodObject<{
    query: z.ZodString;
    userId: z.ZodOptional<z.ZodString>;
    orgId: z.ZodOptional<z.ZodString>;
    filters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodOptional<z.ZodEnum<["asc", "desc"]>>;
    page: z.ZodOptional<z.ZodNumber>;
    limit: z.ZodOptional<z.ZodNumber>;
    sources: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    includeFederated: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    query?: string;
    userId?: string;
    page?: number;
    limit?: number;
    filters?: Record<string, any>;
    orgId?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    sources?: string[];
    includeFederated?: boolean;
}, {
    query?: string;
    userId?: string;
    page?: number;
    limit?: number;
    filters?: Record<string, any>;
    orgId?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    sources?: string[];
    includeFederated?: boolean;
}>;
declare const SearchResultSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    content: z.ZodString;
    url: z.ZodOptional<z.ZodString>;
    type: z.ZodEnum<["document", "user", "product", "federated"]>;
    score: z.ZodNumber;
    highlights: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    source: z.ZodString;
    timestamp: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    type?: "user" | "product" | "document" | "federated";
    timestamp?: Date;
    metadata?: Record<string, any>;
    url?: string;
    title?: string;
    id?: string;
    source?: string;
    score?: number;
    content?: string;
    highlights?: string[];
}, {
    type?: "user" | "product" | "document" | "federated";
    timestamp?: Date;
    metadata?: Record<string, any>;
    url?: string;
    title?: string;
    id?: string;
    source?: string;
    score?: number;
    content?: string;
    highlights?: string[];
}>;
declare const SearchSuggestionSchema: z.ZodObject<{
    query: z.ZodString;
    type: z.ZodEnum<["history", "popular", "related", "correction"]>;
    score: z.ZodNumber;
    count: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    query?: string;
    type?: "history" | "popular" | "related" | "correction";
    count?: number;
    score?: number;
}, {
    query?: string;
    type?: "history" | "popular" | "related" | "correction";
    count?: number;
    score?: number;
}>;
declare const SearchHistorySchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    query: z.ZodString;
    resultsCount: z.ZodNumber;
    timestamp: z.ZodDate;
    filters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    sources: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    query?: string;
    userId?: string;
    timestamp?: Date;
    filters?: Record<string, any>;
    id?: string;
    resultsCount?: number;
    sources?: string[];
}, {
    query?: string;
    userId?: string;
    timestamp?: Date;
    filters?: Record<string, any>;
    id?: string;
    resultsCount?: number;
    sources?: string[];
}>;
declare const SearchAnalyticsSchema: z.ZodObject<{
    totalSearches: z.ZodNumber;
    averageResponseTime: z.ZodNumber;
    cacheHitRate: z.ZodNumber;
    popularQueries: z.ZodArray<z.ZodObject<{
        query: z.ZodString;
        count: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        query?: string;
        count?: number;
    }, {
        query?: string;
        count?: number;
    }>, "many">;
    searchByType: z.ZodRecord<z.ZodString, z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    totalSearches?: number;
    averageResponseTime?: number;
    cacheHitRate?: number;
    popularQueries?: {
        query?: string;
        count?: number;
    }[];
    searchByType?: Record<string, number>;
}, {
    totalSearches?: number;
    averageResponseTime?: number;
    cacheHitRate?: number;
    popularQueries?: {
        query?: string;
        count?: number;
    }[];
    searchByType?: Record<string, number>;
}>;
declare const FederatedSearchConfigSchema: z.ZodObject<{
    sourceId: z.ZodString;
    name: z.ZodString;
    url: z.ZodString;
    type: z.ZodEnum<["api", "database", "file"]>;
    config: z.ZodRecord<z.ZodString, z.ZodAny>;
    enabled: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    type?: "database" | "api" | "file";
    name?: string;
    url?: string;
    config?: Record<string, any>;
    enabled?: boolean;
    sourceId?: string;
}, {
    type?: "database" | "api" | "file";
    name?: string;
    url?: string;
    config?: Record<string, any>;
    enabled?: boolean;
    sourceId?: string;
}>;
export declare class AdvancedSearchEngine {
    private searchIndex;
    private searchCache;
    private searchHistory;
    private searchAnalytics;
    private federatedSources;
    constructor();
    search(params: z.infer<typeof SearchQuerySchema>): Promise<{
        results: z.infer<typeof SearchResultSchema>[];
        suggestions: z.infer<typeof SearchSuggestionSchema>[];
        analytics: z.infer<typeof SearchAnalyticsSchema>;
        totalCount: number;
        page: number;
        limit: number;
    }>;
    private performLocalSearch;
    private performFederatedSearch;
    private matchesQuery;
    private calculateScore;
    private generateHighlights;
    private applyFilters;
    private sortResults;
    private queryFederatedSource;
    generateSuggestions(query: string, results: z.infer<typeof SearchResultSchema>[]): Promise<z.infer<typeof SearchSuggestionSchema>[]>;
    private getHistorySuggestions;
    private getPopularSuggestions;
    private getRelatedSuggestions;
    private getSpellCorrections;
    saveSearchHistory(params: z.infer<typeof SearchQuerySchema>, resultsCount: number): Promise<void>;
    private updateAnalytics;
    getSearchAnalytics(): z.infer<typeof SearchAnalyticsSchema>;
    getSearchHistory(userId: string): z.infer<typeof SearchHistorySchema>[];
    addFederatedSource(config: z.infer<typeof FederatedSearchConfigSchema>): void;
    removeFederatedSource(sourceId: string): void;
    getFederatedSources(): z.infer<typeof FederatedSearchConfigSchema>[];
    private generateCacheKey;
    clearCache(): void;
    getCacheStats(): {
        size: number;
        hitRate: number;
    };
    private initializeSampleData;
}
export declare const advancedSearchEngine: AdvancedSearchEngine;
export {};
//# sourceMappingURL=advanced-search.d.ts.map