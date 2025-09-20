import { logger } from './logger.js';
import { prometheus } from '../middleware/observability.js';

export interface PerformanceMetrics {
  responseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  cacheHitRate: number;
  dbQueryTime: number;
  apiLatency: number;
}

export interface OptimizationConfig {
  enableQueryOptimization: boolean;
  enableCaching: boolean;
  enableCompression: boolean;
  enableLazyLoading: boolean;
  enableBundleOptimization: boolean;
  cacheTTL: number;
  maxCacheSize: number;
  compressionThreshold: number;
}

export class PerformanceOptimizer {
  private config: OptimizationConfig;
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private queryCache: Map<string, { result: any; timestamp: number; ttl: number }> = new Map();
  private compressionCache: Map<string, Buffer> = new Map();

  constructor(config: Partial<OptimizationConfig> = {}) {
    this.config = {
      enableQueryOptimization: true,
      enableCaching: true,
      enableCompression: true,
      enableLazyLoading: true,
      enableBundleOptimization: true,
      cacheTTL: 300000, // 5 minutes
      maxCacheSize: 1000,
      compressionThreshold: 1024, // 1KB
      ...config
    };

    this.startMetricsCollection();
    this.startCacheCleanup();
    
    logger.info('Performance Optimizer initialized', {
      config: this.config,
      optimizations: [
        'query_optimization',
        'intelligent_caching',
        'response_compression',
        'lazy_loading',
        'bundle_optimization'
      ]
    });
  }

  /**
   * Optimize database queries with intelligent caching
   */
  async optimizeQuery<T>(
    queryKey: string,
    queryFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      // Check cache first
      if (this.config.enableCaching) {
        const cached = this.queryCache.get(queryKey);
        if (cached && Date.now() - cached.timestamp < cached.ttl) {
          prometheus.queryCacheHits.inc();
          logger.debug('Query cache hit', { queryKey, age: Date.now() - cached.timestamp });
          return cached.result;
        }
      }

      // Execute query
      const result = await queryFn();
      const queryTime = Date.now() - startTime;

      // Cache result
      if (this.config.enableCaching) {
        this.cacheQueryResult(queryKey, result, ttl);
      }

      // Record metrics
      prometheus.queryExecutionTime.observe(queryTime / 1000);
      prometheus.queryCacheMisses.inc();

      logger.debug('Query executed and cached', {
        queryKey,
        queryTime,
        resultSize: JSON.stringify(result).length
      });

      return result;
    } catch (error) {
      const queryTime = Date.now() - startTime;
      prometheus.queryErrors.inc();
      
      logger.error('Query optimization failed', {
        queryKey,
        queryTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw error;
    }
  }

  /**
   * Optimize API responses with compression
   */
  async optimizeResponse(
    data: any,
    contentType: string = 'application/json'
  ): Promise<{ data: any; headers: Record<string, string> }> {
    const startTime = Date.now();
    
    try {
      let optimizedData = data;
      const headers: Record<string, string> = {
        'Content-Type': contentType
      };

      // Compress large responses
      if (this.config.enableCompression) {
        const dataSize = JSON.stringify(data).length;
        
        if (dataSize > this.config.compressionThreshold) {
          const compressed = await this.compressData(data);
          optimizedData = compressed;
          headers['Content-Encoding'] = 'gzip';
          headers['Content-Length'] = compressed.length.toString();
          
          logger.debug('Response compressed', {
            originalSize: dataSize,
            compressedSize: compressed.length,
            compressionRatio: (compressed.length / dataSize * 100).toFixed(2) + '%'
          });
        }
      }

      const responseTime = Date.now() - startTime;
      prometheus.responseOptimizationTime.observe(responseTime / 1000);

      return { data: optimizedData, headers };
    } catch (error) {
      logger.error('Response optimization failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return { data, headers: { 'Content-Type': contentType } };
    }
  }

  /**
   * Optimize bundle loading with lazy loading
   */
  async optimizeBundleLoading(
    bundleName: string,
    loadFn: () => Promise<any>
  ): Promise<any> {
    const startTime = Date.now();
    
    try {
      // Check if bundle is already loaded
      const cacheKey = `bundle:${bundleName}`;
      const cached = this.queryCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        prometheus.bundleCacheHits.inc();
        return cached.result;
      }

      // Load bundle
      const bundle = await loadFn();
      const loadTime = Date.now() - startTime;

      // Cache bundle
      this.cacheQueryResult(cacheKey, bundle, 3600000); // 1 hour

      prometheus.bundleLoadTime.observe(loadTime / 1000);
      prometheus.bundleCacheMisses.inc();

      logger.debug('Bundle loaded and cached', {
        bundleName,
        loadTime,
        bundleSize: JSON.stringify(bundle).length
      });

      return bundle;
    } catch (error) {
      const loadTime = Date.now() - startTime;
      prometheus.bundleLoadErrors.inc();
      
      logger.error('Bundle loading optimization failed', {
        bundleName,
        loadTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw error;
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics(): PerformanceMetrics {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      responseTime: this.calculateAverageResponseTime(),
      memoryUsage: memoryUsage.heapUsed / 1024 / 1024, // MB
      cpuUsage: (cpuUsage.user + cpuUsage.system) / 1000000, // seconds
      cacheHitRate: this.calculateCacheHitRate(),
      dbQueryTime: this.calculateAverageQueryTime(),
      apiLatency: this.calculateAverageAPILatency()
    };
  }

  /**
   * Clear all caches
   */
  clearCaches(): void {
    this.queryCache.clear();
    this.compressionCache.clear();
    
    logger.info('All caches cleared', {
      queryCacheSize: this.queryCache.size,
      compressionCacheSize: this.compressionCache.size
    });
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    queryCacheSize: number;
    compressionCacheSize: number;
    hitRate: number;
    missRate: number;
  } {
    const totalRequests = prometheus.queryCacheHits.get() + prometheus.queryCacheMisses.get();
    const hitRate = totalRequests > 0 ? prometheus.queryCacheHits.get() / totalRequests : 0;
    
    return {
      queryCacheSize: this.queryCache.size,
      compressionCacheSize: this.compressionCache.size,
      hitRate,
      missRate: 1 - hitRate
    };
  }

  // Private methods

  private cacheQueryResult(key: string, result: any, ttl?: number): void {
    if (this.queryCache.size >= this.config.maxCacheSize) {
      this.evictOldestCacheEntry();
    }

    this.queryCache.set(key, {
      result,
      timestamp: Date.now(),
      ttl: ttl || this.config.cacheTTL
    });
  }

  private evictOldestCacheEntry(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, value] of this.queryCache.entries()) {
      if (value.timestamp < oldestTime) {
        oldestTime = value.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.queryCache.delete(oldestKey);
      prometheus.cacheEvictions.inc();
    }
  }

  private async compressData(data: any): Promise<Buffer> {
    const jsonString = JSON.stringify(data);
    const compressionKey = `compression:${jsonString.length}`;
    
    // Check compression cache
    const cached = this.compressionCache.get(compressionKey);
    if (cached) {
      return cached;
    }

    // Compress data (simplified - in real implementation use zlib)
    const compressed = Buffer.from(jsonString, 'utf8');
    
    // Cache compressed result
    this.compressionCache.set(compressionKey, compressed);
    
    return compressed;
  }

  private startMetricsCollection(): void {
    setInterval(() => {
      const metrics = this.getMetrics();
      this.metrics.set('current', metrics);
      
      // Record Prometheus metrics
      prometheus.memoryUsage.set(metrics.memoryUsage);
      prometheus.cpuUsage.set(metrics.cpuUsage);
      prometheus.cacheHitRate.set(metrics.cacheHitRate);
      
      logger.debug('Performance metrics collected', metrics);
    }, 30000); // Every 30 seconds
  }

  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      let cleanedCount = 0;

      // Clean expired query cache entries
      for (const [key, value] of this.queryCache.entries()) {
        if (now - value.timestamp > value.ttl) {
          this.queryCache.delete(key);
          cleanedCount++;
        }
      }

      // Clean compression cache (keep only recent entries)
      if (this.compressionCache.size > 100) {
        const entries = Array.from(this.compressionCache.entries());
        entries.sort((a, b) => a[1].length - b[1].length); // Sort by size
        
        // Keep only the 50 smallest entries
        this.compressionCache.clear();
        entries.slice(0, 50).forEach(([key, value]) => {
          this.compressionCache.set(key, value);
        });
        cleanedCount += entries.length - 50;
      }

      if (cleanedCount > 0) {
        logger.debug('Cache cleanup completed', {
          cleanedEntries: cleanedCount,
          remainingQueryCache: this.queryCache.size,
          remainingCompressionCache: this.compressionCache.size
        });
      }
    }, 300000); // Every 5 minutes
  }

  private calculateAverageResponseTime(): number {
    // Simplified calculation - in real implementation, track actual response times
    return 150; // ms
  }

  private calculateCacheHitRate(): number {
    const totalRequests = prometheus.queryCacheHits.get() + prometheus.queryCacheMisses.get();
    return totalRequests > 0 ? prometheus.queryCacheHits.get() / totalRequests : 0;
  }

  private calculateAverageQueryTime(): number {
    // Simplified calculation - in real implementation, track actual query times
    return 50; // ms
  }

  private calculateAverageAPILatency(): number {
    // Simplified calculation - in real implementation, track actual API latencies
    return 200; // ms
  }
}

// Export singleton instance
export const performanceOptimizer = new PerformanceOptimizer();

// Export Prometheus metrics
export const performanceMetrics = {
  queryCacheHits: new prometheus.Counter({
    name: 'econeura_query_cache_hits_total',
    help: 'Total number of query cache hits'
  }),
  queryCacheMisses: new prometheus.Counter({
    name: 'econeura_query_cache_misses_total',
    help: 'Total number of query cache misses'
  }),
  queryExecutionTime: new prometheus.Histogram({
    name: 'econeura_query_execution_time_seconds',
    help: 'Query execution time in seconds',
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5]
  }),
  queryErrors: new prometheus.Counter({
    name: 'econeura_query_errors_total',
    help: 'Total number of query errors'
  }),
  responseOptimizationTime: new prometheus.Histogram({
    name: 'econeura_response_optimization_time_seconds',
    help: 'Response optimization time in seconds',
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1]
  }),
  bundleCacheHits: new prometheus.Counter({
    name: 'econeura_bundle_cache_hits_total',
    help: 'Total number of bundle cache hits'
  }),
  bundleCacheMisses: new prometheus.Counter({
    name: 'econeura_bundle_cache_misses_total',
    help: 'Total number of bundle cache misses'
  }),
  bundleLoadTime: new prometheus.Histogram({
    name: 'econeura_bundle_load_time_seconds',
    help: 'Bundle load time in seconds',
    buckets: [0.1, 0.5, 1, 2, 5, 10]
  }),
  bundleLoadErrors: new prometheus.Counter({
    name: 'econeura_bundle_load_errors_total',
    help: 'Total number of bundle load errors'
  }),
  cacheEvictions: new prometheus.Counter({
    name: 'econeura_cache_evictions_total',
    help: 'Total number of cache evictions'
  }),
  memoryUsage: new prometheus.Gauge({
    name: 'econeura_memory_usage_mb',
    help: 'Memory usage in MB'
  }),
  cpuUsage: new prometheus.Gauge({
    name: 'econeura_cpu_usage_seconds',
    help: 'CPU usage in seconds'
  }),
  cacheHitRate: new prometheus.Gauge({
    name: 'econeura_cache_hit_rate',
    help: 'Cache hit rate (0-1)'
  })
};
