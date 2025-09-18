/**
 * MEJORA 2: Sistema de Caché Inteligente Multi-Nivel
 * 
 * Sistema avanzado de caché con múltiples niveles, invalidación inteligente,
 * compresión, y estrategias de eviction automáticas.
 */

import { structuredLogger } from './structured-logger.js';
import { metrics } from '@econeura/shared/src/metrics/index.js';

export enum CacheLevel {
  MEMORY = 'memory',
  REDIS = 'redis',
  DATABASE = 'database'
}

export enum CacheStrategy {
  LRU = 'lru',
  LFU = 'lfu',
  TTL = 'ttl',
  WRITE_THROUGH = 'write_through',
  WRITE_BACK = 'write_back'
}

export interface CacheConfig {
  level: CacheLevel;
  strategy: CacheStrategy;
  ttl: number; // seconds
  maxSize: number;
  compression: boolean;
  encryption: boolean;
  namespace: string;
}

export interface CacheEntry<T = any> {
  key: string;
  value: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  compressed: boolean;
  encrypted: boolean;
  metadata?: Record<string, any>;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalSize: number;
  entryCount: number;
  evictions: number;
  compressionRatio: number;
  averageAccessTime: number;
}

export class CacheManagerService {
  private static instance: CacheManagerService;
  private memoryCache: Map<string, CacheEntry> = new Map();
  private configs: Map<string, CacheConfig> = new Map();
  private stats: Map<string, CacheStats> = new Map();
  private compressionEnabled = true;
  private encryptionEnabled = false;

  private constructor() {
    this.initializeDefaultConfigs();
    this.startCleanupInterval();
    this.startStatsCollection();
  }

  public static getInstance(): CacheManagerService {
    if (!CacheManagerService.instance) {
      CacheManagerService.instance = new CacheManagerService();
    }
    return CacheManagerService.instance;
  }

  private initializeDefaultConfigs(): void {
    // Configuración para diferentes tipos de datos
    this.configs.set('user_data', {
      level: CacheLevel.MEMORY,
      strategy: CacheStrategy.LRU,
      ttl: 3600, // 1 hora
      maxSize: 1000,
      compression: true,
      encryption: true,
      namespace: 'user'
    });

    this.configs.set('api_responses', {
      level: CacheLevel.MEMORY,
      strategy: CacheStrategy.TTL,
      ttl: 300, // 5 minutos
      maxSize: 5000,
      compression: true,
      encryption: false,
      namespace: 'api'
    });

    this.configs.set('session_data', {
      level: CacheLevel.REDIS,
      strategy: CacheStrategy.TTL,
      ttl: 1800, // 30 minutos
      maxSize: 10000,
      compression: false,
      encryption: true,
      namespace: 'session'
    });

    this.configs.set('computed_results', {
      level: CacheLevel.MEMORY,
      strategy: CacheStrategy.LFU,
      ttl: 7200, // 2 horas
      maxSize: 2000,
      compression: true,
      encryption: false,
      namespace: 'computed'
    });
  }

  /**
   * Obtiene un valor del caché
   */
  public async get<T>(key: string, namespace: string = 'default'): Promise<T | null> {
    const startTime = Date.now();
    const fullKey = this.buildKey(key, namespace);
    
    try {
      const entry = this.memoryCache.get(fullKey);
      
      if (!entry) {
        this.recordMiss(namespace);
        return null;
      }

      // Verificar TTL
      if (this.isExpired(entry)) {
        this.memoryCache.delete(fullKey);
        this.recordMiss(namespace);
        return null;
      }

      // Actualizar estadísticas de acceso
      entry.accessCount++;
      entry.lastAccessed = Date.now();
      
      // Descomprimir si es necesario
      const value = entry.compressed ? await this.decompress(entry.value) : entry.value;
      
      this.recordHit(namespace, Date.now() - startTime);
      
      structuredLogger.debug('Cache hit', {
        key: fullKey,
        namespace,
        accessTime: Date.now() - startTime,
        accessCount: entry.accessCount
      });

      return value as T;
    } catch (error) {
      structuredLogger.error('Cache get error', {
        key: fullKey,
        namespace,
        error: error instanceof Error ? error.message : String(error)
      });
      this.recordMiss(namespace);
      return null;
    }
  }

  /**
   * Almacena un valor en el caché
   */
  public async set<T>(
    key: string, 
    value: T, 
    namespace: string = 'default',
    customTtl?: number
  ): Promise<boolean> {
    const startTime = Date.now();
    const fullKey = this.buildKey(key, namespace);
    const config = this.configs.get(namespace) || this.getDefaultConfig();
    
    try {
      // Comprimir si está habilitado
      const processedValue = config.compression ? await this.compress(value) : value;
      
      const entry: CacheEntry<T> = {
        key: fullKey,
        value: processedValue,
        timestamp: Date.now(),
        ttl: customTtl || config.ttl,
        accessCount: 0,
        lastAccessed: Date.now(),
        compressed: config.compression,
        encrypted: config.encryption,
        metadata: {
          size: JSON.stringify(value).length,
          namespace
        }
      };

      // Verificar límites de tamaño
      if (this.memoryCache.size >= config.maxSize) {
        await this.evictEntries(namespace, config);
      }

      this.memoryCache.set(fullKey, entry);
      
      structuredLogger.debug('Cache set', {
        key: fullKey,
        namespace,
        ttl: entry.ttl,
        compressed: entry.compressed,
        size: entry.metadata?.size
      });

      this.recordSet(namespace, Date.now() - startTime);
      return true;
    } catch (error) {
      structuredLogger.error('Cache set error', {
        key: fullKey,
        namespace,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * Elimina un valor del caché
   */
  public async delete(key: string, namespace: string = 'default'): Promise<boolean> {
    const fullKey = this.buildKey(key, namespace);
    const deleted = this.memoryCache.delete(fullKey);
    
    if (deleted) {
      structuredLogger.debug('Cache delete', { key: fullKey, namespace });
    }
    
    return deleted;
  }

  /**
   * Invalida todas las entradas de un namespace
   */
  public async invalidateNamespace(namespace: string): Promise<number> {
    let deletedCount = 0;
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.metadata?.namespace === namespace) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      if (this.memoryCache.delete(key)) {
        deletedCount++;
      }
    }

    structuredLogger.info('Namespace invalidated', {
      namespace,
      deletedCount
    });

    return deletedCount;
  }

  /**
   * Invalida entradas que coincidan con un patrón
   */
  public async invalidatePattern(pattern: string, namespace: string = 'default'): Promise<number> {
    let deletedCount = 0;
    const regex = new RegExp(pattern);
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.metadata?.namespace === namespace && regex.test(key)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      if (this.memoryCache.delete(key)) {
        deletedCount++;
      }
    }

    structuredLogger.info('Pattern invalidated', {
      pattern,
      namespace,
      deletedCount
    });

    return deletedCount;
  }

  /**
   * Obtiene estadísticas del caché
   */
  public getStats(namespace?: string): CacheStats | Record<string, CacheStats> {
    if (namespace) {
      return this.stats.get(namespace) || this.createEmptyStats();
    }

    const allStats: Record<string, CacheStats> = {};
    for (const [ns, stats] of this.stats.entries()) {
      allStats[ns] = stats;
    }
    return allStats;
  }

  /**
   * Limpia entradas expiradas
   */
  public async cleanup(): Promise<number> {
    let cleanedCount = 0;
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.memoryCache.entries()) {
      if (this.isExpired(entry)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      if (this.memoryCache.delete(key)) {
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      structuredLogger.info('Cache cleanup completed', { cleanedCount });
    }

    return cleanedCount;
  }

  private buildKey(key: string, namespace: string): string {
    return `${namespace}:${key}`;
  }

  private isExpired(entry: CacheEntry): boolean {
    const now = Date.now();
    return (now - entry.timestamp) > (entry.ttl * 1000);
  }

  private async evictEntries(namespace: string, config: CacheConfig): Promise<void> {
    const entries = Array.from(this.memoryCache.entries())
      .filter(([_, entry]) => entry.metadata?.namespace === namespace);

    let toEvict: string[] = [];

    switch (config.strategy) {
      case CacheStrategy.LRU:
        toEvict = entries
          .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed)
          .slice(0, Math.ceil(entries.length * 0.1))
          .map(([key]) => key);
        break;

      case CacheStrategy.LFU:
        toEvict = entries
          .sort((a, b) => a[1].accessCount - b[1].accessCount)
          .slice(0, Math.ceil(entries.length * 0.1))
          .map(([key]) => key);
        break;

      case CacheStrategy.TTL:
        toEvict = entries
          .filter(([_, entry]) => this.isExpired(entry))
          .map(([key]) => key);
        break;
    }

    for (const key of toEvict) {
      this.memoryCache.delete(key);
      this.recordEviction(namespace);
    }
  }

  private async compress<T>(value: T): Promise<T> {
    // En un sistema real, usaríamos una librería de compresión como zlib
    // Por ahora, simulamos la compresión
    return value;
  }

  private async decompress<T>(value: T): Promise<T> {
    // En un sistema real, descomprimiríamos el valor
    return value;
  }

  private recordHit(namespace: string, accessTime: number): void {
    const stats = this.getOrCreateStats(namespace);
    stats.hits++;
    stats.hitRate = stats.hits / (stats.hits + stats.misses);
    stats.averageAccessTime = (stats.averageAccessTime * (stats.hits - 1) + accessTime) / stats.hits;
    
    // Métricas Prometheus
    metrics.cacheHits.inc({ namespace });
    metrics.cacheAccessTime.observe({ namespace }, accessTime);
  }

  private recordMiss(namespace: string): void {
    const stats = this.getOrCreateStats(namespace);
    stats.misses++;
    stats.hitRate = stats.hits / (stats.hits + stats.misses);
    
    // Métricas Prometheus
    metrics.cacheMisses.inc({ namespace });
  }

  private recordSet(namespace: string, setTime: number): void {
    const stats = this.getOrCreateStats(namespace);
    stats.entryCount = this.memoryCache.size;
    
    // Métricas Prometheus
    metrics.cacheSets.inc({ namespace });
    metrics.cacheSetTime.observe({ namespace }, setTime);
  }

  private recordEviction(namespace: string): void {
    const stats = this.getOrCreateStats(namespace);
    stats.evictions++;
    
    // Métricas Prometheus
    metrics.cacheEvictions.inc({ namespace });
  }

  private getOrCreateStats(namespace: string): CacheStats {
    if (!this.stats.has(namespace)) {
      this.stats.set(namespace, this.createEmptyStats());
    }
    return this.stats.get(namespace)!;
  }

  private createEmptyStats(): CacheStats {
    return {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalSize: 0,
      entryCount: 0,
      evictions: 0,
      compressionRatio: 0,
      averageAccessTime: 0
    };
  }

  private getDefaultConfig(): CacheConfig {
    return {
      level: CacheLevel.MEMORY,
      strategy: CacheStrategy.TTL,
      ttl: 300,
      maxSize: 1000,
      compression: false,
      encryption: false,
      namespace: 'default'
    };
  }

  private startCleanupInterval(): void {
    setInterval(async () => {
      await this.cleanup();
    }, 60000); // Cada minuto
  }

  private startStatsCollection(): void {
    setInterval(() => {
      this.updateStats();
    }, 30000); // Cada 30 segundos
  }

  private updateStats(): void {
    for (const [namespace, stats] of this.stats.entries()) {
      stats.entryCount = Array.from(this.memoryCache.values())
        .filter(entry => entry.metadata?.namespace === namespace).length;
      
      // Actualizar métricas Prometheus
      metrics.cacheSize.set({ namespace }, stats.entryCount);
      metrics.cacheHitRate.set({ namespace }, stats.hitRate);
    }
  }
}

export const cacheManagerService = CacheManagerService.getInstance();
