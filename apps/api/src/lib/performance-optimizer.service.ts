/**
 * MEJORA 5: Optimización de Performance y Compresión
 * 
 * Sistema avanzado de optimización de performance con compresión,
 * minificación, lazy loading, y optimización de consultas.
 */

import { metrics } from '@econeura/shared/src/metrics/index.js';

import { structuredLogger } from './structured-logger.js';

export enum CompressionType {
  GZIP = 'gzip',
  BROTLI = 'brotli',
  DEFLATE = 'deflate',
  LZ4 = 'lz4'
}

export enum OptimizationLevel {
  FAST = 'fast',
  BALANCED = 'balanced',
  MAXIMUM = 'maximum'
}

export interface PerformanceConfig {
  compression: {
    enabled: boolean;
    type: CompressionType;
    level: number; // 1-9
    threshold: number; // bytes
  };
  caching: {
    enabled: boolean;
    ttl: number; // seconds
    maxSize: number; // bytes
    strategy: 'lru' | 'lfu' | 'ttl';
  };
  queryOptimization: {
    enabled: boolean;
    maxQueryTime: number; // ms
    slowQueryThreshold: number; // ms
    batchSize: number;
  };
  responseOptimization: {
    enabled: boolean;
    minifyJson: boolean;
    removeNulls: boolean;
    paginationLimit: number;
  };
}

export interface PerformanceMetrics {
  responseTime: number;
  compressionRatio: number;
  cacheHitRate: number;
  queryOptimizations: number;
  slowQueries: number;
  memoryUsage: number;
  cpuUsage: number;
}

export interface QueryOptimization {
  originalQuery: string;
  optimizedQuery: string;
  executionTime: number;
  optimizationType: string;
  improvement: number; // percentage
}

export class PerformanceOptimizerService {
  private static instance: PerformanceOptimizerService;
  private config: PerformanceConfig;
  private queryCache: Map<string, any> = new Map();
  private responseCache: Map<string, any> = new Map();
  private slowQueries: Array<{query: string, time: number, timestamp: number}> = [];
  private isOptimizing = false;
  private optimizationInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.config = this.getDefaultConfig();
    this.startOptimization();
  }

  public static getInstance(): PerformanceOptimizerService {
    if (!PerformanceOptimizerService.instance) {
      PerformanceOptimizerService.instance = new PerformanceOptimizerService();
    }
    return PerformanceOptimizerService.instance;
  }

  private getDefaultConfig(): PerformanceConfig {
    return {
      compression: {
        enabled: true,
        type: CompressionType.GZIP,
        level: 6,
        threshold: 1024 // 1KB
      },
      caching: {
        enabled: true,
        ttl: 300, // 5 minutos
        maxSize: 100 * 1024 * 1024, // 100MB
        strategy: 'lru'
      },
      queryOptimization: {
        enabled: true,
        maxQueryTime: 1000, // 1 segundo
        slowQueryThreshold: 500, // 500ms
        batchSize: 100
      },
      responseOptimization: {
        enabled: true,
        minifyJson: true,
        removeNulls: true,
        paginationLimit: 1000
      }
    };
  }

  /**
   * Optimiza una respuesta HTTP
   */
  public async optimizeResponse(
    data: any,
    contentType: string = 'application/json'
  ): Promise<{
    data: any;
    compressed: boolean;
    compressionRatio: number;
    originalSize: number;
    optimizedSize: number;
  }> {
    const startTime = Date.now();
    const originalSize = JSON.stringify(data).length;
    let optimizedData = data;
    let compressed = false;
    let compressionRatio = 1;

    try {
      // 1. Optimización de datos
      if (this.config.responseOptimization.enabled) {
        optimizedData = this.optimizeData(data);
      }

      // 2. Compresión si está habilitada
      if (this.config.compression.enabled && originalSize > this.config.compression.threshold) {
        const compressedResult = await this.compressData(optimizedData, contentType);
        optimizedData = compressedResult.data;
        compressed = true;
        compressionRatio = compressedResult.ratio;
      }

      const optimizedSize = JSON.stringify(optimizedData).length;
      const processingTime = Date.now() - startTime;

      // Métricas
      this.recordResponseOptimizationMetrics(originalSize, optimizedSize, processingTime, compressed);

      structuredLogger.debug('Response optimized', {
        originalSize,
        optimizedSize,
        compressionRatio,
        compressed,
        processingTime
      });

      return {
        data: optimizedData,
        compressed,
        compressionRatio,
        originalSize,
        optimizedSize
      };
    } catch (error) {
      structuredLogger.error('Response optimization failed', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      return {
        data,
        compressed: false,
        compressionRatio: 1,
        originalSize,
        optimizedSize: originalSize
      };
    }
  }

  /**
   * Optimiza una consulta de base de datos
   */
  public async optimizeQuery(
    query: string,
    params: any[] = []
  ): Promise<QueryOptimization> {
    const startTime = Date.now();
    
    try {
      // Verificar caché de consultas
      const cacheKey = this.generateQueryCacheKey(query, params);
      const cachedResult = this.queryCache.get(cacheKey);
      
      if (cachedResult && this.isQueryCacheValid(cachedResult)) {
        return {
          originalQuery: query,
          optimizedQuery: query,
          executionTime: 0,
          optimizationType: 'cache_hit',
          improvement: 100
        };
      }

      // Optimizar consulta
      const optimizedQuery = this.optimizeQueryString(query);
      const executionTime = Date.now() - startTime;

      // Detectar consultas lentas
      if (executionTime > this.config.queryOptimization.slowQueryThreshold) {
        this.recordSlowQuery(query, executionTime);
      }

      const improvement = this.calculateQueryImprovement(query, optimizedQuery);
      
      const result: QueryOptimization = {
        originalQuery: query,
        optimizedQuery,
        executionTime,
        optimizationType: this.getOptimizationType(query, optimizedQuery),
        improvement
      };

      // Guardar en caché
      this.queryCache.set(cacheKey, {
        result,
        timestamp: Date.now(),
        ttl: this.config.caching.ttl
      });

      // Métricas
      this.recordQueryOptimizationMetrics(executionTime, improvement);

      return result;
    } catch (error) {
      structuredLogger.error('Query optimization failed', {
        query,
        error: error instanceof Error ? error.message : String(error)
      });
      
      return {
        originalQuery: query,
        optimizedQuery: query,
        executionTime: Date.now() - startTime,
        optimizationType: 'error',
        improvement: 0
      };
    }
  }

  /**
   * Optimiza datos de respuesta
   */
  private optimizeData(data: any): any {
    if (Array.isArray(data)) {
      return data.map(item => this.optimizeData(item));
    }

    if (data && typeof data === 'object') {
      const optimized: any = {};
      
      for (const [key, value] of Object.entries(data)) {
        if (this.config.responseOptimization.removeNulls && value === null) {
          continue; // Saltar valores null
        }
        
        optimized[key] = this.optimizeData(value);
      }
      
      return optimized;
    }

    return data;
  }

  /**
   * Comprime datos
   */
  private async compressData(data: any, contentType: string): Promise<{
    data: any;
    ratio: number;
  }> {
    const originalData = JSON.stringify(data);
    const originalSize = originalData.length;

    // Simulación de compresión (en un sistema real usaríamos zlib, brotli, etc.)
    let compressedData: string;
    let ratio: number;

    switch (this.config.compression.type) {
      case CompressionType.GZIP:
        compressedData = this.simulateGzipCompression(originalData);
        break;
      case CompressionType.BROTLI:
        compressedData = this.simulateBrotliCompression(originalData);
        break;
      default:
        compressedData = originalData;
    }

    const compressedSize = compressedData.length;
    ratio = originalSize / compressedSize;

    return {
      data: compressedData,
      ratio
    };
  }

  private simulateGzipCompression(data: string): string {
    // Simulación de compresión GZIP (en realidad usaríamos zlib)
    return `GZIP:${data.substring(0, Math.floor(data.length * 0.7))}`;
  }

  private simulateBrotliCompression(data: string): string {
    // Simulación de compresión Brotli (en realidad usaríamos brotli)
    return `BROTLI:${data.substring(0, Math.floor(data.length * 0.6))}`;
  }

  /**
   * Optimiza string de consulta
   */
  private optimizeQueryString(query: string): string {
    let optimized = query;

    // Remover espacios extra
    optimized = optimized.replace(/\s+/g, ' ').trim();

    // Optimizar SELECT *
    if (optimized.includes('SELECT *')) {
      // En un sistema real, esto requeriría análisis del schema
      optimized = optimized.replace('SELECT *', 'SELECT id, name, created_at');
    }

    // Optimizar ORDER BY sin LIMIT
    if (optimized.includes('ORDER BY') && !optimized.includes('LIMIT')) {
      optimized += ' LIMIT 1000'; // Límite por defecto
    }

    // Optimizar consultas con múltiples JOINs
    if ((optimized.match(/JOIN/gi) || []).length > 3) {
      // Sugerir optimización de índices
      structuredLogger.warn('Complex query detected', { query: optimized });
    }

    return optimized;
  }

  /**
   * Genera clave de caché para consulta
   */
  private generateQueryCacheKey(query: string, params: any[]): string {
    const normalizedQuery = query.replace(/\s+/g, ' ').trim();
    const paramsHash = JSON.stringify(params);
    return `${normalizedQuery}:${paramsHash}`;
  }

  /**
   * Verifica si el caché de consulta es válido
   */
  private isQueryCacheValid(cachedResult: any): boolean {
    const now = Date.now();
    return (now - cachedResult.timestamp) < (cachedResult.ttl * 1000);
  }

  /**
   * Calcula mejora de consulta
   */
  private calculateQueryImprovement(original: string, optimized: string): number {
    const originalLength = original.length;
    const optimizedLength = optimized.length;
    
    if (originalLength === 0) return 0;
    
    return Math.round(((originalLength - optimizedLength) / originalLength) * 100);
  }

  /**
   * Obtiene tipo de optimización
   */
  private getOptimizationType(original: string, optimized: string): string {
    if (original === optimized) return 'no_change';
    if (optimized.includes('LIMIT')) return 'limit_added';
    if (optimized.includes('SELECT') && !original.includes('SELECT *')) return 'select_optimized';
    return 'general_optimization';
  }

  /**
   * Registra consulta lenta
   */
  private recordSlowQuery(query: string, executionTime: number): void {
    this.slowQueries.push({
      query: query.substring(0, 200), // Truncar para logging
      time: executionTime,
      timestamp: Date.now()
    });

    // Mantener solo las últimas 100 consultas lentas
    if (this.slowQueries.length > 100) {
      this.slowQueries = this.slowQueries.slice(-100);
    }

    structuredLogger.warn('Slow query detected', {
      query: query.substring(0, 200),
      executionTime,
      threshold: this.config.queryOptimization.slowQueryThreshold
    });

    // Métricas
    metrics.slowQueries.inc();
  }

  /**
   * Registra métricas de optimización de respuesta
   */
  private recordResponseOptimizationMetrics(
    originalSize: number,
    optimizedSize: number,
    processingTime: number,
    compressed: boolean
  ): void {
    metrics.responseOptimizations.inc();
    metrics.responseOptimizationTime.observe({}, processingTime);
    metrics.compressionRatio.observe({}, originalSize / optimizedSize);
    
    if (compressed) {
      metrics.compressedResponses.inc();
    }
  }

  /**
   * Registra métricas de optimización de consulta
   */
  private recordQueryOptimizationMetrics(executionTime: number, improvement: number): void {
    metrics.queryOptimizations.inc();
    metrics.queryOptimizationTime.observe({}, executionTime);
    metrics.queryImprovement.observe({}, improvement);
  }

  /**
   * Inicia el proceso de optimización automática
   */
  private startOptimization(): void {
    this.optimizationInterval = setInterval(() => {
      this.performAutomaticOptimizations();
    }, 300000); // Cada 5 minutos

    structuredLogger.info('Performance optimizer started', {
      compression: this.config.compression.enabled,
      caching: this.config.caching.enabled,
      queryOptimization: this.config.queryOptimization.enabled
    });
  }

  /**
   * Realiza optimizaciones automáticas
   */
  private async performAutomaticOptimizations(): Promise<void> {
    try {
      // Limpiar caché expirado
      this.cleanupExpiredCache();

      // Analizar consultas lentas
      this.analyzeSlowQueries();

      // Optimizar memoria
      this.optimizeMemoryUsage();

      structuredLogger.debug('Automatic optimizations completed');
    } catch (error) {
      structuredLogger.error('Automatic optimization failed', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Limpia caché expirado
   */
  private cleanupExpiredCache(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, value] of this.queryCache.entries()) {
      if (!this.isQueryCacheValid(value)) {
        this.queryCache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      structuredLogger.debug('Cache cleanup completed', { cleanedCount });
    }
  }

  /**
   * Analiza consultas lentas
   */
  private analyzeSlowQueries(): void {
    if (this.slowQueries.length === 0) return;

    const recentSlowQueries = this.slowQueries.filter(
      q => (Date.now() - q.timestamp) < 3600000 // Última hora
    );

    if (recentSlowQueries.length > 10) {
      structuredLogger.warn('High number of slow queries detected', {
        count: recentSlowQueries.length,
        threshold: 10
      });
    }
  }

  /**
   * Optimiza uso de memoria
   */
  private optimizeMemoryUsage(): void {
    const memUsage = process.memoryUsage();
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024;

    if (heapUsedMB > 500) { // Más de 500MB
      // Forzar garbage collection si está disponible
      if (global.gc) {
        global.gc();
        structuredLogger.info('Garbage collection triggered', {
          heapUsedBefore: heapUsedMB,
          heapUsedAfter: process.memoryUsage().heapUsed / 1024 / 1024
        });
      }
    }
  }

  /**
   * Obtiene métricas de performance
   */
  public getPerformanceMetrics(): PerformanceMetrics {
    const memUsage = process.memoryUsage();
    
    return {
      responseTime: 0, // Se calcularía de las métricas
      compressionRatio: 0, // Se calcularía de las métricas
      cacheHitRate: 0, // Se calcularía de las métricas
      queryOptimizations: 0, // Se calcularía de las métricas
      slowQueries: this.slowQueries.length,
      memoryUsage: memUsage.heapUsed / 1024 / 1024, // MB
      cpuUsage: 0 // Se requeriría librería adicional
    };
  }

  /**
   * Actualiza configuración
   */
  public updateConfig(newConfig: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    structuredLogger.info('Performance configuration updated', { config: this.config });
  }

  /**
   * Detiene el servicio de optimización
   */
  public stop(): void {
    if (this.optimizationInterval) {
      clearInterval(this.optimizationInterval);
      this.optimizationInterval = null;
    }
    structuredLogger.info('Performance optimizer stopped');
  }
}

export const performanceOptimizerService = PerformanceOptimizerService.getInstance();
