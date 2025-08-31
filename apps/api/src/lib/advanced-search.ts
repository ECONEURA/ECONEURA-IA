import { z } from "zod";
import { logger } from "./logger.js";

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export const SearchQuerySchema = z.object({
  query: z.string().min(1),
  filters: z.record(z.any()).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  searchType: z.enum(["semantic", "keyword", "fuzzy", "federated"]).default("keyword"),
  sources: z.array(z.string()).optional(),
  includeSuggestions: z.boolean().default(true),
  useCache: z.boolean().default(true),
});

export const SearchResultSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  url: z.string().optional(),
  type: z.string(),
  score: z.number(),
  highlights: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
  source: z.string(),
  timestamp: z.date(),
});

export const SearchSuggestionSchema = z.object({
  query: z.string(),
  type: z.enum(["history", "popular", "related", "correction"]),
  score: z.number(),
  count: z.number().optional(),
});

export const SearchAnalyticsSchema = z.object({
  totalSearches: z.number(),
  uniqueUsers: z.number(),
  averageQueryLength: z.number(),
  topQueries: z.array(z.object({
    query: z.string(),
    count: z.number(),
  })),
  searchTypes: z.record(z.number()),
  sources: z.record(z.number()),
  averageResponseTime: z.number(),
  cacheHitRate: z.number(),
  zeroResultsRate: z.number(),
});

export const SearchHistorySchema = z.object({
  id: z.string(),
  userId: z.string(),
  query: z.string(),
  results: z.number(),
  timestamp: z.date(),
  searchType: z.string(),
  filters: z.record(z.any()).optional(),
  sessionId: z.string().optional(),
});

export const FederatedSearchConfigSchema = z.object({
  sourceId: z.string(),
  name: z.string(),
  url: z.string(),
  type: z.enum(["api", "database", "file", "web"]),
  priority: z.number().min(1).max(10),
  timeout: z.number().min(1000).max(30000),
  authentication: z.record(z.string()).optional(),
  headers: z.record(z.string()).optional(),
  enabled: z.boolean().default(true),
});

// ============================================================================
// SEARCH ENGINE IMPLEMENTATION
// ============================================================================

export class AdvancedSearchEngine {
  private searchHistory: Map<string, SearchHistorySchema[]> = new Map();
  private searchCache: Map<string, any> = new Map();
  private searchAnalytics: SearchAnalyticsSchema;
  private federatedSources: Map<string, FederatedSearchConfigSchema> = new Map();
  private searchIndex: Map<string, any[]> = new Map();

  constructor() {
    this.searchAnalytics = {
      totalSearches: 0,
      uniqueUsers: 0,
      averageQueryLength: 0,
      topQueries: [],
      searchTypes: {},
      sources: {},
      averageResponseTime: 0,
      cacheHitRate: 0,
      zeroResultsRate: 0,
    };

    this.initializeSampleData();
    logger.info("Advanced Search Engine initialized", { 
      searchEngine: "advanced",
      features: ["semantic", "fuzzy", "federated", "analytics"],
      cacheSize: this.searchCache.size,
      sourcesCount: this.federatedSources.size
    });
  }

  // ============================================================================
  // CORE SEARCH METHODS
  // ============================================================================

  async search(params: z.infer<typeof SearchQuerySchema>): Promise<{
    results: z.infer<typeof SearchResultSchema>[];
    suggestions: z.infer<typeof SearchSuggestionSchema>[];
    analytics: {
      totalResults: number;
      responseTime: number;
      cacheHit: boolean;
      sourcesQueried: string[];
    };
  }> {
    const startTime = Date.now();
    const validatedParams = SearchQuerySchema.parse(params);
    
    logger.info("Processing search request", {
      query: validatedParams.query,
      searchType: validatedParams.searchType,
      filters: validatedParams.filters,
      page: validatedParams.page,
      limit: validatedParams.limit,
      useCache: validatedParams.useCache
    });

    // Check cache first
    const cacheKey = this.generateCacheKey(validatedParams);
    if (validatedParams.useCache && this.searchCache.has(cacheKey)) {
      const cachedResult = this.searchCache.get(cacheKey);
      this.updateAnalytics(startTime, true);
      
      logger.info("Search result served from cache", {
        query: validatedParams.query,
        cacheHit: true,
        responseTime: Date.now() - startTime
      });

      return cachedResult;
    }

    let results: z.infer<typeof SearchResultSchema>[] = [];
    const sourcesQueried: string[] = [];

    // Execute search based on type
    switch (validatedParams.searchType) {
      case "semantic":
        results = await this.semanticSearch(validatedParams);
        break;
      case "fuzzy":
        results = await this.fuzzySearch(validatedParams);
        break;
      case "federated":
        results = await this.federatedSearch(validatedParams);
        sourcesQueried.push(...validatedParams.sources || []);
        break;
      default:
        results = await this.keywordSearch(validatedParams);
    }

    // Apply filters and sorting
    results = this.applyFilters(results, validatedParams.filters);
    results = this.sortResults(results, validatedParams.sortBy, validatedParams.sortOrder);

    // Pagination
    const startIndex = (validatedParams.page - 1) * validatedParams.limit;
    const paginatedResults = results.slice(startIndex, startIndex + validatedParams.limit);

    // Generate suggestions
    const suggestions = validatedParams.includeSuggestions 
      ? await this.generateSuggestions(validatedParams.query, results)
      : [];

    // Save to history
    await this.saveSearchHistory(validatedParams, results.length);

    // Cache results
    if (validatedParams.useCache) {
      this.searchCache.set(cacheKey, {
        results: paginatedResults,
        suggestions,
        analytics: {
          totalResults: results.length,
          responseTime: Date.now() - startTime,
          cacheHit: false,
          sourcesQueried,
        }
      });
    }

    this.updateAnalytics(startTime, false);

    logger.info("Search completed successfully", {
      query: validatedParams.query,
      totalResults: results.length,
      returnedResults: paginatedResults.length,
      responseTime: Date.now() - startTime,
      searchType: validatedParams.searchType
    });

    return {
      results: paginatedResults,
      suggestions,
      analytics: {
        totalResults: results.length,
        responseTime: Date.now() - startTime,
        cacheHit: false,
        sourcesQueried,
      }
    };
  }

  // ============================================================================
  // SEARCH ALGORITHMS
  // ============================================================================

  private async semanticSearch(params: z.infer<typeof SearchQuerySchema>): Promise<z.infer<typeof SearchResultSchema>[]> {
    // Simulate semantic search with embeddings
    const queryEmbedding = this.generateEmbedding(params.query);
    const results: z.infer<typeof SearchResultSchema>[] = [];

    for (const [source, documents] of this.searchIndex.entries()) {
      for (const doc of documents) {
        const docEmbedding = this.generateEmbedding(doc.content);
        const similarity = this.calculateCosineSimilarity(queryEmbedding, docEmbedding);
        
        if (similarity > 0.3) { // Threshold for semantic relevance
          results.push({
            id: doc.id,
            title: doc.title,
            content: doc.content,
            url: doc.url,
            type: doc.type,
            score: similarity,
            highlights: this.extractHighlights(doc.content, params.query),
            metadata: doc.metadata,
            source,
            timestamp: new Date(),
          });
        }
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }

  private async fuzzySearch(params: z.infer<typeof SearchQuerySchema>): Promise<z.infer<typeof SearchResultSchema>[]> {
    const results: z.infer<typeof SearchResultSchema>[] = [];
    const query = params.query.toLowerCase();

    for (const [source, documents] of this.searchIndex.entries()) {
      for (const doc of documents) {
        const content = doc.content.toLowerCase();
        const title = doc.title.toLowerCase();
        
        // Calculate fuzzy match scores
        const contentScore = this.calculateFuzzyScore(content, query);
        const titleScore = this.calculateFuzzyScore(title, query);
        
        const totalScore = (contentScore * 0.7) + (titleScore * 0.3);
        
        if (totalScore > 0.5) {
          results.push({
            id: doc.id,
            title: doc.title,
            content: doc.content,
            url: doc.url,
            type: doc.type,
            score: totalScore,
            highlights: this.extractFuzzyHighlights(doc.content, query),
            metadata: doc.metadata,
            source,
            timestamp: new Date(),
          });
        }
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }

  private async federatedSearch(params: z.infer<typeof SearchQuerySchema>): Promise<z.infer<typeof SearchResultSchema>[]> {
    const results: z.infer<typeof SearchResultSchema>[] = [];
    const sources = params.sources || Array.from(this.federatedSources.keys());

    for (const sourceId of sources) {
      const source = this.federatedSources.get(sourceId);
      if (!source || !source.enabled) continue;

      try {
        const sourceResults = await this.queryFederatedSource(source, params);
        results.push(...sourceResults);
      } catch (error) {
        logger.error("Federated search failed for source", {
          sourceId,
          error: (error as Error).message,
          query: params.query
        });
      }
    }

    return results;
  }

  private async keywordSearch(params: z.infer<typeof SearchQuerySchema>): Promise<z.infer<typeof SearchResultSchema>[]> {
    const results: z.infer<typeof SearchResultSchema>[] = [];
    const query = params.query.toLowerCase();
    const keywords = query.split(/\s+/);

    for (const [source, documents] of this.searchIndex.entries()) {
      for (const doc of documents) {
        const content = doc.content.toLowerCase();
        const title = doc.title.toLowerCase();
        
        let score = 0;
        let matches = 0;

        for (const keyword of keywords) {
          if (content.includes(keyword)) {
            score += 1;
            matches++;
          }
          if (title.includes(keyword)) {
            score += 2; // Title matches are worth more
            matches++;
          }
        }

        if (matches > 0) {
          const relevanceScore = score / keywords.length;
          results.push({
            id: doc.id,
            title: doc.title,
            content: doc.content,
            url: doc.url,
            type: doc.type,
            score: relevanceScore,
            highlights: this.extractKeywordHighlights(doc.content, keywords),
            metadata: doc.metadata,
            source,
            timestamp: new Date(),
          });
        }
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private generateCacheKey(params: z.infer<typeof SearchQuerySchema>): string {
    return `search:${params.query}:${params.searchType}:${JSON.stringify(params.filters)}:${params.page}:${params.limit}`;
  }

  private generateEmbedding(text: string): number[] {
    // Simulate embedding generation
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(128).fill(0);
    
    for (let i = 0; i < Math.min(words.length, 128); i++) {
      embedding[i] = words[i].length / 10; // Simple hash-based embedding
    }
    
    return embedding;
  }

  private calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  private calculateFuzzyScore(text: string, query: string): number {
    // Simple Levenshtein-based fuzzy scoring
    const distance = this.levenshteinDistance(text, query);
    const maxLength = Math.max(text.length, query.length);
    return 1 - (distance / maxLength);
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  private extractHighlights(content: string, query: string): string[] {
    const highlights: string[] = [];
    const sentences = content.split(/[.!?]+/);
    const queryLower = query.toLowerCase();

    for (const sentence of sentences) {
      if (sentence.toLowerCase().includes(queryLower)) {
        highlights.push(sentence.trim());
      }
    }

    return highlights.slice(0, 3);
  }

  private extractFuzzyHighlights(content: string, query: string): string[] {
    const highlights: string[] = [];
    const words = content.split(/\s+/);
    const queryWords = query.split(/\s+/);

    for (let i = 0; i < words.length - queryWords.length + 1; i++) {
      let match = true;
      for (let j = 0; j < queryWords.length; j++) {
        if (this.levenshteinDistance(words[i + j].toLowerCase(), queryWords[j]) > 2) {
          match = false;
          break;
        }
      }
      if (match) {
        highlights.push(words.slice(i, i + queryWords.length).join(" "));
      }
    }

    return highlights.slice(0, 3);
  }

  private extractKeywordHighlights(content: string, keywords: string[]): string[] {
    const highlights: string[] = [];
    const sentences = content.split(/[.!?]+/);

    for (const sentence of sentences) {
      const sentenceLower = sentence.toLowerCase();
      let hasKeyword = false;
      
      for (const keyword of keywords) {
        if (sentenceLower.includes(keyword)) {
          hasKeyword = true;
          break;
        }
      }
      
      if (hasKeyword) {
        highlights.push(sentence.trim());
      }
    }

    return highlights.slice(0, 3);
  }

  private applyFilters(results: z.infer<typeof SearchResultSchema>[], filters: Record<string, any> | undefined): z.infer<typeof SearchResultSchema>[]> {
    if (!filters) return results;

    return results.filter(result => {
      for (const [key, value] of Object.entries(filters)) {
        if (result.metadata && result.metadata[key] !== value) {
          return false;
        }
      }
      return true;
    });
  }

  private sortResults(results: z.infer<typeof SearchResultSchema>[], sortBy?: string, sortOrder: "asc" | "desc" = "desc"): z.infer<typeof SearchResultSchema>[] {
    if (!sortBy) return results;

    return results.sort((a, b) => {
      let aValue: any = a[sortBy as keyof typeof a];
      let bValue: any = b[sortBy as keyof typeof b];

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }

  private async queryFederatedSource(source: FederatedSearchConfigSchema, params: z.infer<typeof SearchQuerySchema>): Promise<z.infer<typeof SearchResultSchema>[]> {
    // Simulate federated source query
    const results: z.infer<typeof SearchResultSchema>[] = [];
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
    
    // Return mock results based on source type
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

  // ============================================================================
  // SUGGESTIONS AND HISTORY
  // ============================================================================

  async generateSuggestions(query: string, results: z.infer<typeof SearchResultSchema>[]): Promise<z.infer<typeof SearchSuggestionSchema>[]> {
    const suggestions: z.infer<typeof SearchSuggestionSchema>[] = [];

    // History-based suggestions
    const historySuggestions = this.getHistorySuggestions(query);
    suggestions.push(...historySuggestions);

    // Popular queries
    const popularSuggestions = this.getPopularSuggestions(query);
    suggestions.push(...popularSuggestions);

    // Related queries based on results
    const relatedSuggestions = this.getRelatedSuggestions(query, results);
    suggestions.push(...relatedSuggestions);

    // Spell correction
    const correctionSuggestions = this.getSpellCorrections(query);
    suggestions.push(...correctionSuggestions);

    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }

  private getHistorySuggestions(query: string): z.infer<typeof SearchSuggestionSchema>[] {
    const suggestions: z.infer<typeof SearchSuggestionSchema>[] = [];
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

  private getPopularSuggestions(query: string): z.infer<typeof SearchSuggestionSchema>[] {
    const suggestions: z.infer<typeof SearchSuggestionSchema>[] = [];
    const queryLower = query.toLowerCase();

    // Simulate popular queries
    const popularQueries = [
      "machine learning",
      "artificial intelligence",
      "data analytics",
      "cloud computing",
      "cybersecurity",
      "blockchain",
      "internet of things",
      "big data",
      "devops",
      "microservices"
    ];

    for (const popularQuery of popularQueries) {
      if (popularQuery.toLowerCase().includes(queryLower)) {
        suggestions.push({
          query: popularQuery,
          type: "popular",
          score: 0.9,
          count: Math.floor(Math.random() * 1000) + 100,
        });
      }
    }

    return suggestions;
  }

  private getRelatedSuggestions(query: string, results: z.infer<typeof SearchResultSchema>[]): z.infer<typeof SearchSuggestionSchema>[] {
    const suggestions: z.infer<typeof SearchSuggestionSchema>[] = [];
    const words = query.toLowerCase().split(/\s+/);

    // Generate related queries based on result content
    for (const result of results.slice(0, 5)) {
      const contentWords = result.content.toLowerCase().split(/\s+/);
      const newWords = contentWords.filter(word => !words.includes(word) && word.length > 3);
      
      if (newWords.length > 0) {
        const relatedQuery = [...words, newWords[0]].join(" ");
        suggestions.push({
          query: relatedQuery,
          type: "related",
          score: 0.7,
        });
      }
    }

    return suggestions;
  }

  private getSpellCorrections(query: string): z.infer<typeof SearchSuggestionSchema>[] {
    const suggestions: z.infer<typeof SearchSuggestionSchema>[] = [];
    const words = query.split(/\s+/);

    // Simple spell correction simulation
    const corrections: Record<string, string> = {
      "machin": "machine",
      "learnin": "learning",
      "artificil": "artificial",
      "inteligence": "intelligence",
      "analitics": "analytics",
      "computin": "computing",
    };

    for (const word of words) {
      if (corrections[word.toLowerCase()]) {
        const correctedQuery = query.replace(word, corrections[word.toLowerCase()]);
        suggestions.push({
          query: correctedQuery,
          type: "correction",
          score: 0.6,
        });
      }
    }

    return suggestions;
  }

  async saveSearchHistory(params: z.infer<typeof SearchQuerySchema>, resultsCount: number): Promise<void> {
    const historyEntry: z.infer<typeof SearchHistorySchema> = {
      id: `search-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: "anonymous", // In real implementation, get from auth context
      query: params.query,
      results: resultsCount,
      timestamp: new Date(),
      searchType: params.searchType,
      filters: params.filters,
      sessionId: "session-123", // In real implementation, get from session
    };

    const userId = historyEntry.userId;
    if (!this.searchHistory.has(userId)) {
      this.searchHistory.set(userId, []);
    }

    this.searchHistory.get(userId)!.push(historyEntry);

    // Keep only last 100 searches per user
    const userHistory = this.searchHistory.get(userId)!;
    if (userHistory.length > 100) {
      this.searchHistory.set(userId, userHistory.slice(-100));
    }
  }

  // ============================================================================
  // ANALYTICS AND MONITORING
  // ============================================================================

  private updateAnalytics(startTime: number, cacheHit: boolean): void {
    const responseTime = Date.now() - startTime;
    
    this.searchAnalytics.totalSearches++;
    this.searchAnalytics.averageResponseTime = 
      (this.searchAnalytics.averageResponseTime * (this.searchAnalytics.totalSearches - 1) + responseTime) / this.searchAnalytics.totalSearches;
    
    if (cacheHit) {
      this.searchAnalytics.cacheHitRate = 
        (this.searchAnalytics.cacheHitRate * (this.searchAnalytics.totalSearches - 1) + 1) / this.searchAnalytics.totalSearches;
    } else {
      this.searchAnalytics.cacheHitRate = 
        (this.searchAnalytics.cacheHitRate * (this.searchAnalytics.totalSearches - 1)) / this.searchAnalytics.totalSearches;
    }
  }

  getSearchAnalytics(): z.infer<typeof SearchAnalyticsSchema> {
    return { ...this.searchAnalytics };
  }

  getSearchHistory(userId: string): z.infer<typeof SearchHistorySchema>[] {
    return this.searchHistory.get(userId) || [];
  }

  // ============================================================================
  // FEDERATED SOURCES MANAGEMENT
  // ============================================================================

  addFederatedSource(config: z.infer<typeof FederatedSearchConfigSchema>): void {
    this.federatedSources.set(config.sourceId, config);
    logger.info("Federated source added", {
      sourceId: config.sourceId,
      name: config.name,
      type: config.type,
      priority: config.priority
    });
  }

  removeFederatedSource(sourceId: string): void {
    this.federatedSources.delete(sourceId);
    logger.info("Federated source removed", { sourceId });
  }

  getFederatedSources(): z.infer<typeof FederatedSearchConfigSchema>[] {
    return Array.from(this.federatedSources.values());
  }

  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================

  clearCache(): void {
    this.searchCache.clear();
    logger.info("Search cache cleared", { cacheSize: 0 });
  }

  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.searchCache.size,
      hitRate: this.searchAnalytics.cacheHitRate,
    };
  }

  // ============================================================================
  // SAMPLE DATA INITIALIZATION
  // ============================================================================

  private initializeSampleData(): void {
    // Initialize search index with sample documents
    this.searchIndex.set("documents", [
      {
        id: "doc-1",
        title: "Machine Learning Fundamentals",
        content: "Machine learning is a subset of artificial intelligence that enables computers to learn and make decisions without being explicitly programmed. It uses algorithms to identify patterns in data and make predictions or decisions based on those patterns.",
        url: "/docs/ml-fundamentals",
        type: "article",
        metadata: { category: "AI", difficulty: "beginner" },
      },
      {
        id: "doc-2",
        title: "Advanced Data Analytics Techniques",
        content: "Data analytics involves the process of examining data sets to draw conclusions about the information they contain. Advanced techniques include predictive analytics, prescriptive analytics, and real-time analytics.",
        url: "/docs/advanced-analytics",
        type: "article",
        metadata: { category: "Analytics", difficulty: "advanced" },
      },
      {
        id: "doc-3",
        title: "Cloud Computing Architecture",
        content: "Cloud computing provides on-demand access to computing resources over the internet. It includes various service models like IaaS, PaaS, and SaaS, and deployment models like public, private, and hybrid clouds.",
        url: "/docs/cloud-architecture",
        type: "article",
        metadata: { category: "Cloud", difficulty: "intermediate" },
      },
      {
        id: "doc-4",
        title: "Cybersecurity Best Practices",
        content: "Cybersecurity involves protecting systems, networks, and programs from digital attacks. Best practices include regular updates, strong authentication, encryption, and security awareness training.",
        url: "/docs/cybersecurity",
        type: "article",
        metadata: { category: "Security", difficulty: "intermediate" },
      },
      {
        id: "doc-5",
        title: "Blockchain Technology Overview",
        content: "Blockchain is a distributed ledger technology that enables secure, transparent, and tamper-proof record-keeping. It's the foundation for cryptocurrencies and has applications in supply chain, finance, and more.",
        url: "/docs/blockchain",
        type: "article",
        metadata: { category: "Blockchain", difficulty: "beginner" },
      },
    ]);

    // Initialize federated sources
    this.addFederatedSource({
      sourceId: "api-docs",
      name: "API Documentation",
      url: "https://api.example.com/search",
      type: "api",
      priority: 8,
      timeout: 5000,
      enabled: true,
    });

    this.addFederatedSource({
      sourceId: "database",
      name: "Internal Database",
      url: "internal://database/search",
      type: "database",
      priority: 10,
      timeout: 3000,
      enabled: true,
    });

    this.addFederatedSource({
      sourceId: "file-system",
      name: "File System",
      url: "file:///var/data/search",
      type: "file",
      priority: 6,
      timeout: 2000,
      enabled: true,
    });

    logger.info("Sample data initialized for advanced search engine", {
      documentsCount: this.searchIndex.get("documents")?.length || 0,
      federatedSourcesCount: this.federatedSources.size
    });
  }
}

// ============================================================================
// EXPORT INSTANCE
// ============================================================================

export const advancedSearchEngine = new AdvancedSearchEngine();
