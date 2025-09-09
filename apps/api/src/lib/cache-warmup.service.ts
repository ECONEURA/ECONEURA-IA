import { structuredLogger } from './structured-logger.js';

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
  ttl: number;
}

export interface WarmupResult {
  service: string;
  success: boolean;
  duration: number;
  itemsWarmed: number;
  error?: string;
}

export class CacheWarmupService {
  private cache: Map<string, { value: any; expires: number }> = new Map();
  private stats = { hits: 0, misses: 0 };
  private isWarmingUp = false;

  constructor() {
    this.startCleanupInterval();
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanupExpired();
    }, 60000); // Cleanup every minute
  }

  private cleanupExpired(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, item] of this.cache.entries()) {
      if (item.expires < now) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      structuredLogger.debug('Cache cleanup completed', { cleaned });
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);

    if (!item) {
      this.stats.misses++;
      return null;
    }

    if (item.expires < Date.now()) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return item.value as T;
  }

  async set<T>(key: string, value: T, ttlMs: number = 300000): Promise<void> {
    const expires = Date.now() + ttlMs;
    this.cache.set(key, { value, expires });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
  }

  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? this.stats.hits / total : 0;

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate,
      size: this.cache.size,
      ttl: 300000 // 5 minutes default
    };
  }

  async warmup(): Promise<WarmupResult[]> {
    if (this.isWarmingUp) {
      throw new Error('Warmup already in progress');
    }

    this.isWarmingUp = true;
    const results: WarmupResult[] = [];

    try {
      // Warm up AI responses
      const aiResult = await this.warmupAI();
      results.push(aiResult);

      // Warm up search results
      const searchResult = await this.warmupSearch();
      results.push(searchResult);

      // Warm up analytics
      const analyticsResult = await this.warmupAnalytics();
      results.push(analyticsResult);

      // Warm up business data
      const businessResult = await this.warmupBusinessData();
      results.push(businessResult);

      structuredLogger.info('Cache warmup completed', { results });
    } finally {
      this.isWarmingUp = false;
    }

    return results;
  }

  private async warmupAI(): Promise<WarmupResult> {
    const start = Date.now();
    let itemsWarmed = 0;

    try {
      // Warm up common AI prompts
      const commonPrompts = [
        'sales-email',
        'customer-support',
        'product-description',
        'meeting-summary',
        'deal-analysis',
        'inventory-optimization'
      ];

      for (const prompt of commonPrompts) {
        const key = `ai:${prompt}`;
        const cached = await this.get(key);
        if (!cached) {
          // Simulate AI response
          await this.set(key, {
            response: `Cached response for ${prompt}`,
            timestamp: Date.now(),
            model: 'gpt-4'
          }, 600000); // 10 minutes
          itemsWarmed++;
        }
      }

      return {
        service: 'ai',
        success: true,
        duration: Date.now() - start,
        itemsWarmed
      };
    } catch (error) {
      return {
        service: 'ai',
        success: false,
        duration: Date.now() - start,
        itemsWarmed: 0,
        error: (error as Error).message
      };
    }
  }

  private async warmupSearch(): Promise<WarmupResult> {
    const start = Date.now();
    let itemsWarmed = 0;

    try {
      // Warm up common search queries
      const commonQueries = [
        'companies',
        'contacts',
        'deals',
        'products',
        'invoices',
        'suppliers'
      ];

      for (const query of commonQueries) {
        const key = `search:${query}`;
        const cached = await this.get(key);
        if (!cached) {
          // Simulate search results
          await this.set(key, {
            results: [],
            total: 0,
            query,
            timestamp: Date.now()
          }, 300000); // 5 minutes
          itemsWarmed++;
        }
      }

      return {
        service: 'search',
        success: true,
        duration: Date.now() - start,
        itemsWarmed
      };
    } catch (error) {
      return {
        service: 'search',
        success: false,
        duration: Date.now() - start,
        itemsWarmed: 0,
        error: (error as Error).message
      };
    }
  }

  private async warmupAnalytics(): Promise<WarmupResult> {
    const start = Date.now();
    let itemsWarmed = 0;

    try {
      // Warm up analytics data
      const analyticsKeys = [
        'metrics:dashboard',
        'metrics:performance',
        'metrics:usage',
        'metrics:revenue',
        'metrics:inventory',
        'metrics:customers'
      ];

      for (const key of analyticsKeys) {
        const cached = await this.get(key);
        if (!cached) {
          // Simulate analytics data
          await this.set(key, {
            data: [],
            timestamp: Date.now(),
            period: 'daily'
          }, 600000); // 10 minutes
          itemsWarmed++;
        }
      }

      return {
        service: 'analytics',
        success: true,
        duration: Date.now() - start,
        itemsWarmed
      };
    } catch (error) {
      return {
        service: 'analytics',
        success: false,
        duration: Date.now() - start,
        itemsWarmed: 0,
        error: (error as Error).message
      };
    }
  }

  private async warmupBusinessData(): Promise<WarmupResult> {
    const start = Date.now();
    let itemsWarmed = 0;

    try {
      // Warm up business data
      const businessKeys = [
        'business:companies',
        'business:contacts',
        'business:deals',
        'business:products',
        'business:invoices',
        'business:suppliers'
      ];

      for (const key of businessKeys) {
        const cached = await this.get(key);
        if (!cached) {
          // Simulate business data
          await this.set(key, {
            data: [],
            count: 0,
            timestamp: Date.now()
          }, 180000); // 3 minutes
          itemsWarmed++;
        }
      }

      return {
        service: 'business',
        success: true,
        duration: Date.now() - start,
        itemsWarmed
      };
    } catch (error) {
      return {
        service: 'business',
        success: false,
        duration: Date.now() - start,
        itemsWarmed: 0,
        error: (error as Error).message
      };
    }
  }

  async getCacheKey(key: string): Promise<any> {
    return this.cache.get(key);
  }

  async setCacheKey(key: string, value: any, ttlMs: number = 300000): Promise<void> {
    await this.set(key, value, ttlMs);
  }

  async invalidatePattern(pattern: string): Promise<number> {
    let invalidated = 0;
    const regex = new RegExp(pattern);

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        invalidated++;
      }
    }

    structuredLogger.info('Cache pattern invalidated', { pattern, invalidated });
    return invalidated;
  }
}

export const cacheWarmup = new CacheWarmupService();
