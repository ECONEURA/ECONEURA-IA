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

export interface CacheItem {
  value: any;
  expires: number;
}

export class CacheWarmupService {
  private cache: Map<string, CacheItem> = new Map();
  private stats = { hits: 0, misses: 0 };
  private isWarmingUp = false;

  constructor() {
    this.startCleanupInterval();
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanupExpired();
    }, 300000); // Clean every 5 minutes
  }

  private cleanupExpired(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, item] of this.cache.entries()) {
      if (item.expires < now) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));
    
    if (expiredKeys.length > 0) {
      structuredLogger.debug('Cache cleanup completed', {
        expiredItems: expiredKeys.length,
        remainingItems: this.cache.size
      });
    }
  }

  async warmupAll(): Promise<WarmupResult[]> {
    if (this.isWarmingUp) {
      throw new Error('Cache warmup already in progress');
    }

    this.isWarmingUp = true;
    const results: WarmupResult[] = [];

    try {
      // Warmup critical data
      results.push(await this.warmupUserSessions());
      results.push(await this.warmupFinancialData());
      results.push(await this.warmupSystemMetrics());
      results.push(await this.warmupApiEndpoints());

      structuredLogger.info('Cache warmup completed', {
        totalServices: results.length,
        successfulServices: results.filter(r => r.success).length,
        totalDuration: results.reduce((sum, r) => sum + r.duration, 0)
      });

      return results;
    } finally {
      this.isWarmingUp = false;
    }
  }

  private async warmupUserSessions(): Promise<WarmupResult> {
    const startTime = Date.now();
    
    try {
      // Simulate warming up user session data
      const sessionKeys = ['active_users', 'user_permissions', 'user_preferences'];
      let itemsWarmed = 0;

      for (const key of sessionKeys) {
        const mockData = {
          timestamp: Date.now(),
          data: `cached_${key}_data`
        };
        
        this.set(key, mockData, 3600); // 1 hour TTL
        itemsWarmed++;
      }

      return {
        service: 'UserSessions',
        success: true,
        duration: Date.now() - startTime,
        itemsWarmed
      };
    } catch (error) {
      return {
        service: 'UserSessions',
        success: false,
        duration: Date.now() - startTime,
        itemsWarmed: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async warmupFinancialData(): Promise<WarmupResult> {
    const startTime = Date.now();
    
    try {
      const financialKeys = ['exchange_rates', 'market_data', 'portfolio_summary'];
      let itemsWarmed = 0;

      for (const key of financialKeys) {
        const mockData = {
          timestamp: Date.now(),
          rates: { EUR: 1, USD: 1.1, GBP: 0.85 },
          lastUpdate: new Date().toISOString()
        };
        
        this.set(key, mockData, 1800); // 30 minutes TTL
        itemsWarmed++;
      }

      return {
        service: 'FinancialData',
        success: true,
        duration: Date.now() - startTime,
        itemsWarmed
      };
    } catch (error) {
      return {
        service: 'FinancialData',
        success: false,
        duration: Date.now() - startTime,
        itemsWarmed: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async warmupSystemMetrics(): Promise<WarmupResult> {
    const startTime = Date.now();
    
    try {
      const metricsKeys = ['cpu_usage', 'memory_usage', 'disk_usage', 'network_stats'];
      let itemsWarmed = 0;

      for (const key of metricsKeys) {
        const mockData = {
          timestamp: Date.now(),
          value: Math.random() * 100,
          unit: 'percent'
        };
        
        this.set(key, mockData, 300); // 5 minutes TTL
        itemsWarmed++;
      }

      return {
        service: 'SystemMetrics',
        success: true,
        duration: Date.now() - startTime,
        itemsWarmed
      };
    } catch (error) {
      return {
        service: 'SystemMetrics',
        success: false,
        duration: Date.now() - startTime,
        itemsWarmed: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async warmupApiEndpoints(): Promise<WarmupResult> {
    const startTime = Date.now();
    
    try {
      const endpoints = ['/api/health', '/api/metrics', '/api/status'];
      let itemsWarmed = 0;

      for (const endpoint of endpoints) {
        const mockResponse = {
          timestamp: Date.now(),
          status: 'healthy',
          responseTime: Math.random() * 100
        };
        
        this.set(`endpoint_${endpoint}`, mockResponse, 600); // 10 minutes TTL
        itemsWarmed++;
      }

      return {
        service: 'ApiEndpoints',
        success: true,
        duration: Date.now() - startTime,
        itemsWarmed
      };
    } catch (error) {
      return {
        service: 'ApiEndpoints',
        success: false,
        duration: Date.now() - startTime,
        itemsWarmed: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  set(key: string, value: any, ttlSeconds: number): void {
    const expires = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { value, expires });
  }

  get(key: string): any | undefined {
    const item = this.cache.get(key);
    
    if (!item) {
      this.stats.misses++;
      return undefined;
    }

    if (item.expires < Date.now()) {
      this.cache.delete(key);
      this.stats.misses++;
      return undefined;
    }

    this.stats.hits++;
    return item.value;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (item.expires < Date.now()) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
  }

  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: total > 0 ? this.stats.hits / total : 0,
      size: this.cache.size,
      ttl: 0 // Average TTL calculation would be more complex
    };
  }

  isWarmingUpStatus(): boolean {
    return this.isWarmingUp;
  }
}

// Export singleton instance
export const cacheWarmupService = new CacheWarmupService();
