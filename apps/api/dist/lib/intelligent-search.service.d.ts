import { SearchRequest, SearchResult, SearchResponse, SearchCluster, SearchAnalytics, EmbeddingRequest, EmbeddingResponse, SearchOptimization, SearchStats } from './warmup-types.js';
export declare class IntelligentSearchService {
    private searchHistory;
    private embeddings;
    private searchClusters;
    private optimizations;
    constructor();
    semanticSearch(request: SearchRequest): Promise<SearchResponse>;
    generateEmbedding(request: EmbeddingRequest): Promise<EmbeddingResponse>;
    optimizeQuery(query: string, context?: string): Promise<SearchOptimization>;
    getSearchSuggestions(query: string, limit?: number): Promise<string[]>;
    getSearchAnalytics(organizationId: string, timeRange?: {
        start: Date;
        end: Date;
    }): Promise<SearchAnalytics[]>;
    getSearchStats(organizationId: string): Promise<SearchStats>;
    createSearchClusters(documents: SearchResult[]): Promise<SearchCluster[]>;
    private performVectorSearch;
    private enhanceSearchResults;
    private generateHighlights;
    private generateExplanation;
    private generateSuggestions;
    private createClusters;
    private calculateCentroid;
    private calculateCoherence;
    private simulateEmbeddingGeneration;
    private estimateTokens;
    private calculateEmbeddingCost;
    private performQueryOptimization;
    private identifyImprovements;
    private calculatePerformanceGain;
    private getTopQueries;
    private calculateSearchAccuracy;
    private performClustering;
    private initializeDefaultData;
    private generateId;
}
//# sourceMappingURL=intelligent-search.service.d.ts.map