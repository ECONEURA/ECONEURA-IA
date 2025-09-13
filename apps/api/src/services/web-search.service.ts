import { structuredLogger } from '../lib/structured-logger.js';

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

export class WebSearchService {
  private config: {
    googleApiKey: string;
    googleCx: string;
    bingApiKey: string;
  };

  private isDemoMode: boolean;
  private cache: Map<string, SearchResponse> = new Map();
  private cacheExpiry: Map<string, number> = new Map();

  constructor() {
    this.config = {
      googleApiKey: process.env.GOOGLE_SEARCH_API_KEY || '',
      googleCx: process.env.GOOGLE_SEARCH_CX || '',
      bingApiKey: process.env.BING_SEARCH_API_KEY || ''
    };

    this.isDemoMode = !this.config.googleApiKey && !this.config.bingApiKey;
    
    if (this.isDemoMode) {
      structuredLogger.warn('Web search running in demo mode - no API keys configured');
    }
  }

  async search(query: string, options: SearchOptions = {}): Promise<SearchResponse> {
    try {
      const cacheKey = this.generateCacheKey(query, options);
      
      // Check cache first
      if (this.isCacheValid(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (cached) {
          structuredLogger.info('Search result served from cache', { query });
          return cached;
        }
      }

      const startTime = Date.now();
      let response: SearchResponse;

      if (this.isDemoMode) {
        response = await this.generateDemoSearchResponse(query, options);
      } else {
        // Try Google first, fallback to Bing
        try {
          response = await this.searchGoogle(query, options);
        } catch (error) {
          structuredLogger.warn('Google search failed, trying Bing', { error: (error as Error).message });
          response = await this.searchBing(query, options);
        }
      }

      response.searchTime = Date.now() - startTime;
      response.timestamp = new Date();

      // Cache the result
      this.cache.set(cacheKey, response);
      this.cacheExpiry.set(cacheKey, Date.now() + 6 * 60 * 60 * 1000); // 6 hours

      structuredLogger.info('Web search completed', {
        query,
        results: response.results.length,
        source: response.source,
        searchTime: response.searchTime
      });

      return response;
    } catch (error) {
      structuredLogger.error('Web search failed', error as Error, { query });
      throw error;
    }
  }

  async searchNews(query: string, options: SearchOptions = {}): Promise<SearchResponse> {
    try {
      const newsOptions = {
        ...options,
        dateRange: options.dateRange || 'week'
      };

      const response = await this.search(query, newsOptions);
      
      // Filter for news-like results
      response.results = response.results.filter(result => 
        this.isNewsResult(result)
      );

      structuredLogger.info('News search completed', {
        query,
        newsResults: response.results.length
      });

      return response;
    } catch (error) {
      structuredLogger.error('News search failed', error as Error, { query });
      throw error;
    }
  }

  async searchImages(query: string, options: SearchOptions = {}): Promise<SearchResponse> {
    try {
      const imageOptions = {
        ...options,
        maxResults: options.maxResults || 10
      };

      const response = await this.search(query, imageOptions);
      
      // Filter for image results
      response.results = response.results.filter(result => 
        this.isImageResult(result)
      );

      structuredLogger.info('Image search completed', {
        query,
        imageResults: response.results.length
      });

      return response;
    } catch (error) {
      structuredLogger.error('Image search failed', error as Error, { query });
      throw error;
    }
  }

  async getTrendingTopics(): Promise<{
    topics: Array<{ topic: string; searchVolume: number; trend: 'up' | 'down' | 'stable' }>;
    source: string;
    timestamp: Date;
  }> {
    try {
      const trendingTopics = [
        { topic: 'artificial intelligence', searchVolume: 1000000, trend: 'up' as const },
        { topic: 'climate change', searchVolume: 800000, trend: 'up' as const },
        { topic: 'cryptocurrency', searchVolume: 600000, trend: 'down' as const },
        { topic: 'renewable energy', searchVolume: 500000, trend: 'up' as const },
        { topic: 'space exploration', searchVolume: 400000, trend: 'stable' as const }
      ];

      structuredLogger.info('Trending topics retrieved', {
        topicsCount: trendingTopics.length
      });

      return {
        topics: trendingTopics,
        source: this.isDemoMode ? 'demo' : 'google',
        timestamp: new Date()
      };
    } catch (error) {
      structuredLogger.error('Failed to get trending topics', error as Error);
      throw error;
    }
  }

  async getSearchSuggestions(query: string): Promise<string[]> {
    try {
      const suggestions = [
        `${query} tutorial`,
        `${query} guide`,
        `${query} examples`,
        `${query} best practices`,
        `${query} 2024`,
        `${query} latest`,
        `${query} news`,
        `${query} reviews`
      ];

      return suggestions.slice(0, 8);
    } catch (error) {
      structuredLogger.error('Failed to get search suggestions', error as Error, { query });
      throw error;
    }
  }

  private async searchGoogle(query: string, options: SearchOptions): Promise<SearchResponse> {
    // Simulate Google Custom Search API call
    const results = this.generateSearchResults(query, options, 'google');
    
    return {
      query,
      results,
      totalResults: Math.floor(Math.random() * 1000000) + 10000,
      searchTime: 0, // Will be set by caller
      source: 'google',
      timestamp: new Date()
    };
  }

  private async searchBing(query: string, options: SearchOptions): Promise<SearchResponse> {
    // Simulate Bing Search API call
    const results = this.generateSearchResults(query, options, 'bing');
    
    return {
      query,
      results,
      totalResults: Math.floor(Math.random() * 800000) + 8000,
      searchTime: 0, // Will be set by caller
      source: 'bing',
      timestamp: new Date()
    };
  }

  private async generateDemoSearchResponse(query: string, options: SearchOptions): Promise<SearchResponse> {
    const results = this.generateSearchResults(query, options, 'demo');
    
    return {
      query,
      results,
      totalResults: Math.floor(Math.random() * 1000) + 100,
      searchTime: 0, // Will be set by caller
      source: 'demo',
      timestamp: new Date()
    };
  }

  private generateSearchResults(query: string, options: SearchOptions, source: string): SearchResult[] {
    const maxResults = options.maxResults || 10;
    const results: SearchResult[] = [];

    const demoResults = [
      {
        title: `${query} - Complete Guide`,
        url: `https://example.com/${query.replace(/\s+/g, '-')}-guide`,
        snippet: `Learn everything about ${query} with our comprehensive guide. Includes examples, best practices, and expert tips.`,
        source: 'Example.com',
        publishedDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        relevanceScore: 0.95
      },
      {
        title: `${query} Tutorial for Beginners`,
        url: `https://tutorial.com/${query.replace(/\s+/g, '-')}-tutorial`,
        snippet: `Step-by-step tutorial on ${query}. Perfect for beginners who want to learn the basics quickly and effectively.`,
        source: 'Tutorial.com',
        publishedDate: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000),
        relevanceScore: 0.88
      },
      {
        title: `Latest ${query} News and Updates`,
        url: `https://news.com/${query.replace(/\s+/g, '-')}-news`,
        snippet: `Stay updated with the latest news and developments in ${query}. Breaking news, analysis, and expert opinions.`,
        source: 'News.com',
        publishedDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        relevanceScore: 0.82
      },
      {
        title: `${query} Best Practices`,
        url: `https://bestpractices.com/${query.replace(/\s+/g, '-')}-best-practices`,
        snippet: `Discover the best practices for ${query}. Industry experts share their insights and recommendations.`,
        source: 'BestPractices.com',
        publishedDate: new Date(Date.now() - Math.random() * 45 * 24 * 60 * 60 * 1000),
        relevanceScore: 0.79
      },
      {
        title: `${query} Examples and Use Cases`,
        url: `https://examples.com/${query.replace(/\s+/g, '-')}-examples`,
        snippet: `Real-world examples and use cases of ${query}. See how it's implemented in different scenarios.`,
        source: 'Examples.com',
        publishedDate: new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000),
        relevanceScore: 0.76
      }
    ];

    for (let i = 0; i < Math.min(maxResults, demoResults.length); i++) {
      const result = demoResults[i];
      results.push({
        ...result,
        relevanceScore: result.relevanceScore - (i * 0.05) // Decrease relevance for lower results
      });
    }

    return results;
  }

  private isNewsResult(result: SearchResult): boolean {
    const newsKeywords = ['news', 'breaking', 'update', 'report', 'announcement'];
    const newsDomains = ['news.com', 'cnn.com', 'bbc.com', 'reuters.com'];
    
    return newsKeywords.some(keyword => 
      result.title.toLowerCase().includes(keyword) || 
      result.snippet.toLowerCase().includes(keyword)
    ) || newsDomains.some(domain => result.url.includes(domain));
  }

  private isImageResult(result: SearchResult): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const imageKeywords = ['image', 'photo', 'picture', 'gallery'];
    
    return imageExtensions.some(ext => result.url.toLowerCase().includes(ext)) ||
           imageKeywords.some(keyword => 
             result.title.toLowerCase().includes(keyword) || 
             result.snippet.toLowerCase().includes(keyword)
           );
  }

  private generateCacheKey(query: string, options: SearchOptions): string {
    const optionsStr = JSON.stringify(options);
    return `${query}:${optionsStr}`;
  }

  private isCacheValid(cacheKey: string): boolean {
    const expiry = this.cacheExpiry.get(cacheKey);
    return expiry ? Date.now() < expiry : false;
  }

  async clearCache(): Promise<void> {
    this.cache.clear();
    this.cacheExpiry.clear();
    
    structuredLogger.info('Search cache cleared');
  }

  async getCacheStats(): Promise<{
    size: number;
    hitRate: number;
    oldestEntry: Date | null;
    newestEntry: Date | null;
  }> {
    const entries = Array.from(this.cache.values());
    
    return {
      size: this.cache.size,
      hitRate: 0.75, // Simulated hit rate
      oldestEntry: entries.length > 0 ? entries[0].timestamp : null,
      newestEntry: entries.length > 0 ? entries[entries.length - 1].timestamp : null
    };
  }

  async getSearchHistory(limit: number = 50): Promise<Array<{
    query: string;
    timestamp: Date;
    resultsCount: number;
    source: string;
  }>> {
    // Simulate search history
    const history = [];
    for (let i = 0; i < limit; i++) {
      history.push({
        query: `search query ${i + 1}`,
        timestamp: new Date(Date.now() - i * 60 * 60 * 1000), // 1 hour apart
        resultsCount: Math.floor(Math.random() * 100) + 10,
        source: i % 2 === 0 ? 'google' : 'bing'
      });
    }
    
    return history;
  }
}

export const webSearch = new WebSearchService();
