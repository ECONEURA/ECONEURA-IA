import { BaseRepository } from './base.repository.js';
import { SearchResult, SearchQuery, SearchFilters, SearchSuggestion, SearchAnalytics } from '../entities/search-result.entity.js';
export interface SearchRepository extends BaseRepository<SearchResult> {
    search(query: SearchQuery): Promise<SearchResult[]>;
    searchByType(type: string, query: string, filters?: SearchFilters): Promise<SearchResult[]>;
    semanticSearch(query: string, filters?: SearchFilters): Promise<SearchResult[]>;
    fuzzySearch(query: string, filters?: SearchFilters): Promise<SearchResult[]>;
    getSuggestions(query: string, limit?: number): Promise<SearchSuggestion[]>;
    getPopularSearches(limit?: number): Promise<string[]>;
    getAvailableFilters(): Promise<Record<string, any[]>>;
    getCategories(): Promise<string[]>;
    getTags(): Promise<string[]>;
    indexEntity(entity: any, type: string): Promise<void>;
    reindexAll(): Promise<void>;
    removeFromIndex(entityId: string, type: string): Promise<void>;
    trackSearch(analytics: SearchAnalytics): Promise<void>;
    getSearchAnalytics(dateFrom?: Date, dateTo?: Date): Promise<SearchAnalytics[]>;
    updateSearchConfig(config: SearchConfig): Promise<void>;
    getSearchConfig(): Promise<SearchConfig>;
}
export interface SearchConfig {
    defaultSearchType: string;
    maxResults: number;
    enableSemanticSearch: boolean;
    enableFuzzySearch: boolean;
    scoreWeights: {
        title: number;
        description: number;
        content: number;
        tags: number;
        metadata: number;
    };
    enableFilters: boolean;
    maxFilters: number;
    enableSuggestions: boolean;
    maxSuggestions: number;
    suggestionThreshold: number;
}
//# sourceMappingURL=search.repository.d.ts.map