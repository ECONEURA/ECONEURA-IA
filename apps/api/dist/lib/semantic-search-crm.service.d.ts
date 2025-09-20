interface SemanticDocument {
    id: string;
    organizationId: string;
    type: 'contact' | 'company' | 'deal' | 'invoice' | 'product' | 'interaction' | 'note' | 'task';
    title: string;
    content: string;
    metadata: {
        entityId: string;
        entityType: string;
        tags: string[];
        categories: string[];
        priority: 'low' | 'medium' | 'high' | 'critical';
        status: string;
        createdBy: string;
        lastModifiedBy: string;
        language: string;
        confidence: number;
    };
    embeddings: {
        vector: number[];
        model: string;
        version: string;
        dimensions: number;
        generatedAt: string;
    };
    searchableFields: {
        name?: string;
        email?: string;
        phone?: string;
        company?: string;
        description?: string;
        notes?: string;
        tags?: string[];
    };
    createdAt: string;
    updatedAt: string;
    indexedAt: string;
}
interface SearchQuery {
    id: string;
    organizationId: string;
    query: string;
    type: 'semantic' | 'hybrid' | 'keyword' | 'fuzzy';
    filters: {
        documentTypes?: string[];
        tags?: string[];
        categories?: string[];
        priority?: string[];
        status?: string[];
        dateRange?: {
            start: string;
            end: string;
        };
        createdBy?: string[];
        language?: string;
    };
    options: {
        limit: number;
        offset: number;
        includeMetadata: boolean;
        includeEmbeddings: boolean;
        similarityThreshold: number;
        boostFields: Record<string, number>;
        highlightMatches: boolean;
    };
    results: {
        documents: SemanticDocument[];
        total: number;
        executionTime: number;
        queryVector?: number[];
        suggestions?: string[];
        facets?: Record<string, any>;
    };
    createdAt: string;
}
interface SearchIndex {
    id: string;
    organizationId: string;
    name: string;
    description: string;
    status: 'building' | 'ready' | 'updating' | 'error';
    configuration: {
        model: string;
        dimensions: number;
        similarityMetric: 'cosine' | 'euclidean' | 'dot_product';
        chunkSize: number;
        overlapSize: number;
        language: string;
        autoUpdate: boolean;
        updateInterval: number;
    };
    statistics: {
        totalDocuments: number;
        totalVectors: number;
        lastUpdated: string;
        averageVectorLength: number;
        memoryUsage: number;
        buildTime: number;
    };
    createdAt: string;
    updatedAt: string;
}
interface SearchAnalytics {
    id: string;
    organizationId: string;
    queryId: string;
    userId: string;
    sessionId: string;
    query: string;
    results: {
        totalFound: number;
        clickedDocuments: string[];
        timeSpent: number;
        satisfaction: number;
        feedback?: string;
    };
    performance: {
        queryTime: number;
        indexTime: number;
        cacheHit: boolean;
        modelUsed: string;
    };
    timestamp: string;
}
interface SearchSuggestion {
    id: string;
    organizationId: string;
    query: string;
    suggestions: {
        text: string;
        type: 'autocomplete' | 'related' | 'popular' | 'semantic';
        score: number;
        metadata?: Record<string, any>;
    }[];
    context: {
        userId?: string;
        sessionId?: string;
        previousQueries?: string[];
        userPreferences?: Record<string, any>;
    };
    createdAt: string;
}
declare class SemanticSearchCRMService {
    private documents;
    private searchQueries;
    private searchIndexes;
    private searchAnalytics;
    private searchSuggestions;
    constructor();
    init(): void;
    private createDemoData;
    private generateMockEmbedding;
    indexDocument(documentData: Omit<SemanticDocument, 'id' | 'embeddings' | 'indexedAt'>): Promise<SemanticDocument>;
    getDocument(documentId: string): Promise<SemanticDocument | undefined>;
    updateDocument(documentId: string, updates: Partial<SemanticDocument>): Promise<SemanticDocument | undefined>;
    semanticSearch(query: string, organizationId: string, options?: {
        type?: 'semantic' | 'hybrid' | 'keyword' | 'fuzzy';
        filters?: SearchQuery['filters'];
        limit?: number;
        offset?: number;
        similarityThreshold?: number;
        includeMetadata?: boolean;
    }): Promise<SearchQuery>;
    private generateSuggestions;
    private generateFacets;
    getSearchIndexes(organizationId: string): Promise<SearchIndex[]>;
    createSearchIndex(indexData: Omit<SearchIndex, 'id' | 'statistics' | 'createdAt' | 'updatedAt'>): Promise<SearchIndex>;
    logSearchAnalytics(analyticsData: Omit<SearchAnalytics, 'id' | 'timestamp'>): Promise<SearchAnalytics>;
    getSearchSuggestions(query: string, organizationId: string, context?: {
        userId?: string;
        sessionId?: string;
        previousQueries?: string[];
    }): Promise<SearchSuggestion>;
    getSearchStats(organizationId: string): Promise<{
        totalDocuments: number;
        totalQueries: number;
        totalAnalytics: number;
        totalIndexes: number;
        documentStats: {
            byType: Record<string, number>;
            byPriority: Record<string, number>;
            byLanguage: Record<string, number>;
            averageConfidence: number;
        };
        searchStats: {
            totalSearches: number;
            averageResults: number;
            averageExecutionTime: number;
            byType: Record<string, number>;
        };
        last24Hours: {
            searches: number;
            documentsIndexed: number;
            analytics: number;
        };
        last7Days: {
            searches: number;
            documentsIndexed: number;
            analytics: number;
        };
        performanceStats: {
            averageQueryTime: number;
            cacheHitRate: number;
            averageSatisfaction: number;
        };
        topQueries: {
            query: string;
            count: number;
        }[];
        topTags: {
            tag: string;
            count: number;
        }[];
    }>;
    private getDocumentTypeStats;
    private getDocumentPriorityStats;
    private getDocumentLanguageStats;
    private getSearchTypeStats;
    private getTopQueries;
    private getTopTags;
}
export declare const semanticSearchCRMService: SemanticSearchCRMService;
export {};
//# sourceMappingURL=semantic-search-crm.service.d.ts.map