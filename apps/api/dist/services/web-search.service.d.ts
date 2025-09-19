export interface SearchResult {
    title: string;
    url: string;
    snippet: string;
    source: string;
    publishedDate?: Date;
    relevanceScore: number;
}
export interface SearchResponse {
    query: string;
    results: SearchResult[];
    totalResults: number;
    searchTime: number;
    source: 'google' | 'bing' | 'demo';
    timestamp: Date;
}
export interface SearchOptions {
    maxResults?: number;
    language?: string;
    region?: string;
    safeSearch?: 'off' | 'moderate' | 'strict';
    dateRange?: 'day' | 'week' | 'month' | 'year';
}
export declare class WebSearchService {
    private config;
    private isDemoMode;
    private cache;
    private cacheExpiry;
    constructor();
    search(query: string, options?: SearchOptions): Promise<SearchResponse>;
    searchNews(query: string, options?: SearchOptions): Promise<SearchResponse>;
    searchImages(query: string, options?: SearchOptions): Promise<SearchResponse>;
    getTrendingTopics(): Promise<{
        topics: Array<{
            topic: string;
            searchVolume: number;
            trend: 'up' | 'down' | 'stable';
        }>;
        source: string;
        timestamp: Date;
    }>;
    getSearchSuggestions(query: string): Promise<string[]>;
    private searchGoogle;
    private searchBing;
    private generateDemoSearchResponse;
    private generateSearchResults;
    private isNewsResult;
    private isImageResult;
    private generateCacheKey;
    private isCacheValid;
    clearCache(): Promise<void>;
    getCacheStats(): Promise<{
        size: number;
        hitRate: number;
        oldestEntry: Date | null;
        newestEntry: Date | null;
    }>;
    getSearchHistory(limit?: number): Promise<Array<{
        query: string;
        timestamp: Date;
        resultsCount: number;
        source: string;
    }>>;
}
export declare const webSearch: WebSearchService;
//# sourceMappingURL=web-search.service.d.ts.map