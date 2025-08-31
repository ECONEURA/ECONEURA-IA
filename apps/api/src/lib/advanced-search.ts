import { z } from "zod";
import { logger } from "./logger.js";

// ============================================================================
// SCHEMAS
// ============================================================================

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

// ============================================================================
// ADVANCED SEARCH ENGINE
// ============================================================================

export class AdvancedSearchEngine {
  private searchIndex: Map<string, any[]> = new Map();
  private searchCache: Map<string, any> = new Map();
  private searchHistory: Map<string, any[]> = new Map();
  private searchAnalytics: any = {
    totalSearches: 0,
    averageResponseTime: 0,
    cacheHitRate: 0,
    popularQueries: [],
    searchByType: {},
  };
  private federatedSources: Map<string, any> = new Map();

  constructor() {
    this.initializeSampleData();
    logger.info("Advanced search engine initialized");
  }

  // ============================================================================
  // MAIN SEARCH FUNCTION
  // ============================================================================

    async search(params: z.infer<typeof SearchQuerySchema>): Promise<{
    results: z.infer<typeof SearchResultSchema>[];
    suggestions: z.infer<typeof SearchSuggestionSchema>[];
    analytics: z.infer<typeof SearchAnalyticsSchema>;
    totalCount: number;
    page: number;
    limit: number;
  }> {
    const startTime = Date.now();

    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(params);
      const cachedResult = this.searchCache.get(cacheKey);
      
      if (cachedResult) {
        this.updateAnalytics(startTime, true);
        return cachedResult;
      }

      // Perform search
      let results: z.infer<typeof SearchResultSchema>[] = [];

      // Local search
      results = await this.performLocalSearch(params);

      // Federated search if enabled
      if (params.includeFederated !== false) {
        const federatedResults = await this.performFederatedSearch(params);
        results = results.concat(federatedResults);
      }

      // Apply filters
      results = this.applyFilters(results, params.filters);

      // Sort results
      results = this.sortResults(results, params.sortBy, params.sortOrder);

      // Pagination
      const page = params.page || 1;
      const limit = params.limit || 20;
      const startIndex = (page - 1) * limit;
      const paginatedResults = results.slice(startIndex, startIndex + limit);

      // Generate suggestions
      const suggestions = await this.generateSuggestions(params.query, results);

      // Save search history
      if (params.userId) {
        await this.saveSearchHistory(params, results.length);
      }

      // Update analytics
      this.updateAnalytics(startTime, false);

      // Cache results
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

    } catch (error) {
      throw error;
    }
  }

  // ============================================================================
  // SEARCH IMPLEMENTATIONS
  // ============================================================================

  private async performLocalSearch(params: z.infer<typeof SearchQuerySchema>): Promise<z.infer<typeof SearchResultSchema>[]> {
    const results: z.infer<typeof SearchResultSchema>[] = [];
    const query = params.query.toLowerCase();

    // Search in documents
    const documents = this.searchIndex.get("documents") || [];
    for (const doc of documents) {
      if (this.matchesQuery(doc, query)) {
        results.push({
          id: doc.id,
          title: doc.title,
          content: doc.content,
          url: doc.url,
          type: "document" as const,
          score: this.calculateScore(doc, query),
          highlights: this.generateHighlights(doc, query),
          metadata: doc.metadata,
          source: "local",
          timestamp: new Date(doc.timestamp),
        });
      }
    }

    // Search in users
    const users = this.searchIndex.get("users") || [];
    for (const user of users) {
      if (this.matchesQuery(user, query)) {
        results.push({
          id: user.id,
          title: user.name,
          content: user.email,
          url: `/users/${user.id}`,
          type: "user" as const,
          score: this.calculateScore(user, query),
          highlights: this.generateHighlights(user, query),
          metadata: user.metadata,
          source: "local",
          timestamp: new Date(user.timestamp),
        });
      }
    }

    // Search in products
    const products = this.searchIndex.get("products") || [];
    for (const product of products) {
      if (this.matchesQuery(product, query)) {
        results.push({
          id: product.id,
          title: product.name,
          content: product.description,
          url: `/products/${product.id}`,
          type: "product" as const,
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

  private async performFederatedSearch(params: z.infer<typeof SearchQuerySchema>): Promise<z.infer<typeof SearchResultSchema>[]> {
    const results: z.infer<typeof SearchResultSchema>[] = [];
    const sources = params.sources || Array.from(this.federatedSources.keys());

    for (const sourceId of sources) {
      const source = this.federatedSources.get(sourceId);
      if (source && source.enabled) {
        try {
          const sourceResults = await this.queryFederatedSource(source, params);
          results.push(...sourceResults);
        } catch (error) {
          logger.error("Federated search failed", { error: (error as Error).message });
        }
      }
    }

    return results;
  }

  private matchesQuery(item: any, query: string): boolean {
    const searchableFields = [
      item.title || "",
      item.name || "",
      item.content || "",
      item.description || "",
      item.email || "",
    ].join(" ").toLowerCase();

    return searchableFields.includes(query);
  }

  private calculateScore(item: any, query: string): number {
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

  private generateHighlights(item: any, query: string): string[] {
    const highlights: string[] = [];
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

  private applyFilters(results: z.infer<typeof SearchResultSchema>[], filters: Record<string, any> | undefined): z.infer<typeof SearchResultSchema>[] {
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

  private async queryFederatedSource(source: any, params: z.infer<typeof SearchQuerySchema>): Promise<z.infer<typeof SearchResultSchema>[]> {
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
        type: "federated" as const,
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
            type: "history" as const,
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

    // Mock popular queries
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
          type: "popular" as const,
          score: 0.9,
          count: 10,
        });
      }
    }

    return suggestions;
  }

  private getRelatedSuggestions(query: string, results: z.infer<typeof SearchResultSchema>[]): z.infer<typeof SearchSuggestionSchema>[] {
    const suggestions: z.infer<typeof SearchSuggestionSchema>[] = [];

    // Generate related queries based on result content
    for (const result of results.slice(0, 3)) {
      const words = result.title.split(" ");
      for (const word of words) {
        if (word.length > 3 && !query.toLowerCase().includes(word.toLowerCase())) {
          suggestions.push({
            query: `${query} ${word}`,
            type: "related" as const,
            score: 0.6,
            count: 1,
          });
        }
      }
    }

    return suggestions;
  }

  private getSpellCorrections(query: string): z.infer<typeof SearchSuggestionSchema>[] {
    const suggestions: z.infer<typeof SearchSuggestionSchema>[] = [];

    // Simple spell correction (mock)
    const corrections: Record<string, string> = {
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
          type: "correction" as const,
          score: 0.7,
          count: 1,
        });
      }
    }

    return suggestions;
  }

  // ============================================================================
  // HISTORY AND ANALYTICS
  // ============================================================================

  async saveSearchHistory(params: z.infer<typeof SearchQuerySchema>, resultsCount: number): Promise<void> {
    const historyEntry: z.infer<typeof SearchHistorySchema> = {
      id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: params.userId!,
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

    this.searchHistory.get(userId)!.push(historyEntry);

    // Keep only last 50 searches per user
    if (this.searchHistory.get(userId)!.length > 50) {
      this.searchHistory.get(userId)!.shift();
    }

    logger.info("Search history saved");
  }

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
    logger.info("Federated source added");
  }

  removeFederatedSource(sourceId: string): void {
    this.federatedSources.delete(sourceId);
    logger.info("Federated source removed");
  }

  getFederatedSources(): z.infer<typeof FederatedSearchConfigSchema>[] {
    return Array.from(this.federatedSources.values());
  }

  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================

  private generateCacheKey(params: z.infer<typeof SearchQuerySchema>): string {
    return `search_${JSON.stringify(params)}`;
  }

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
    // Sample documents
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

    // Sample users
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

    // Sample products
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

    // Add federated sources
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

// Export singleton instance
export const advancedSearchEngine = new AdvancedSearchEngine();
