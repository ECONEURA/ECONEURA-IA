// Cache Service - Optimización de Performance
// Sistema de caching avanzado para mejorar performance del sistema

import { logger } from './logger.js';

export interface CacheConfig {
  defaultTTL: number; // TTL por defecto en segundos
  maxSize: number; // Tamaño máximo del cache
  cleanupInterval: number; // Intervalo de limpieza en ms
  enableMetrics: boolean; // Habilitar métricas de cache
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  size: number;
  hitRate: number;
  memoryUsage: number;
}

export interface CacheEntry<T = any> {
  value: T;
  expiresAt: number;
  createdAt: number;
  accessCount: number;
  lastAccessed: number;
}

export class CacheService {
  private cache = new Map<string, CacheEntry>();
  private metrics: CacheMetrics;
  private config: CacheConfig;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 300, // 5 minutos
      maxSize: 10000,
      cleanupInterval: 60000, // 1 minuto
      enableMetrics: true,
      ...config
    };

    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      size: 0,
      hitRate: 0,
      memoryUsage: 0
    };

    this.startCleanupTimer();
    logger.info('CacheService initialized', { config: this.config });
  }

  /**
   * Obtener valor del cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.metrics.misses++;
      this.updateHitRate();
      return null;
    }

    // Verificar si ha expirado
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.metrics.misses++;
      this.updateHitRate();
      return null;
    }

    // Actualizar estadísticas de acceso
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.metrics.hits++;
    this.updateHitRate();

    return entry.value as T;
  }

  /**
   * Establecer valor en el cache
   */
  set<T>(key: string, value: T, ttl?: number): void {
    const now = Date.now();
    const expiresAt = now + (ttl || this.config.defaultTTL) * 1000;

    // Verificar límite de tamaño
    if (this.cache.size >= this.config.maxSize) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      value,
      expiresAt,
      createdAt: now,
      accessCount: 0,
      lastAccessed: now
    };

    this.cache.set(key, entry);
    this.metrics.sets++;
    this.updateMetrics();

    logger.debug('Cache entry set', { key, ttl: ttl || this.config.defaultTTL });
  }

  /**
   * Eliminar valor del cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.metrics.deletes++;
      this.updateMetrics();
    }
    return deleted;
  }

  /**
   * Verificar si existe una clave en el cache
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Limpiar todo el cache
   */
  clear(): void {
    this.cache.clear();
    this.updateMetrics();
    logger.info('Cache cleared');
  }

  /**
   * Obtener múltiples valores
   */
  mget<T>(keys: string[]): Record<string, T | null> {
    const result: Record<string, T | null> = {};
    
    for (const key of keys) {
      result[key] = this.get<T>(key);
    }
    
    return result;
  }

  /**
   * Establecer múltiples valores
   */
  mset<T>(entries: Record<string, T>, ttl?: number): void {
    for (const [key, value] of Object.entries(entries)) {
      this.set(key, value, ttl);
    }
  }

  /**
   * Obtener o establecer (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string, 
    factory: () => Promise<T>, 
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    this.set(key, value, ttl);
    return value;
  }

  /**
   * Invalidar cache por patrón
   */
  invalidatePattern(pattern: string): number {
    const regex = new RegExp(pattern);
    let count = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }

    this.updateMetrics();
    logger.info('Cache invalidated by pattern', { pattern, count });
    return count;
  }

  /**
   * Obtener métricas del cache
   */
  getMetrics(): CacheMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  /**
   * Obtener estadísticas detalladas
   */
  getStats(): any {
    const entries = Array.from(this.cache.values());
    const now = Date.now();

    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      utilization: (this.cache.size / this.config.maxSize) * 100,
      expired: entries.filter(e => now > e.expiresAt).length,
      averageAge: entries.length > 0 
        ? entries.reduce((sum, e) => sum + (now - e.createdAt), 0) / entries.length / 1000
        : 0,
      averageAccessCount: entries.length > 0
        ? entries.reduce((sum, e) => sum + e.accessCount, 0) / entries.length
        : 0,
      topKeys: entries
        .sort((a, b) => b.accessCount - a.accessCount)
        .slice(0, 10)
        .map(e => ({ accessCount: e.accessCount, age: (now - e.createdAt) / 1000 }))
    };
  }

  /**
   * Configurar TTL dinámico basado en patrones
   */
  setTTLPattern(pattern: string, ttl: number): void {
    // Esta funcionalidad se puede extender para configurar TTLs específicos
    logger.info('TTL pattern configured', { pattern, ttl });
  }

  /**
   * Exportar cache para backup
   */
  export(): Record<string, any> {
    const data: Record<string, any> = {};
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now < entry.expiresAt) {
        data[key] = {
          value: entry.value,
          ttl: Math.floor((entry.expiresAt - now) / 1000),
          createdAt: entry.createdAt,
          accessCount: entry.accessCount
        };
      }
    }

    return data;
  }

  /**
   * Importar cache desde backup
   */
  import(data: Record<string, any>): void {
    const now = Date.now();

    for (const [key, entry] of Object.entries(data)) {
      const cacheEntry: CacheEntry = {
        value: entry.value,
        expiresAt: now + entry.ttl * 1000,
        createdAt: entry.createdAt || now,
        accessCount: entry.accessCount || 0,
        lastAccessed: now
      };

      this.cache.set(key, cacheEntry);
    }

    this.updateMetrics();
    logger.info('Cache imported', { entries: Object.keys(data).length });
  }

  private evictLRU(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      logger.debug('LRU entry evicted', { key: oldestKey });
    }
  }

  private updateHitRate(): void {
    const total = this.metrics.hits + this.metrics.misses;
    this.metrics.hitRate = total > 0 ? (this.metrics.hits / total) * 100 : 0;
  }

  private updateMetrics(): void {
    this.metrics.size = this.cache.size;
    this.metrics.memoryUsage = this.estimateMemoryUsage();
  }

  private estimateMemoryUsage(): number {
    // Estimación aproximada del uso de memoria
    let size = 0;
    for (const [key, entry] of this.cache.entries()) {
      size += key.length * 2; // UTF-16
      size += JSON.stringify(entry.value).length * 2;
      size += 100; // Overhead de la estructura
    }
    return size;
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.updateMetrics();
      logger.debug('Cache cleanup completed', { cleaned, remaining: this.cache.size });
    }
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.clear();
    logger.info('CacheService destroyed');
  }
}

// Instancia singleton
export const cacheService = new CacheService({
  defaultTTL: 300, // 5 minutos
  maxSize: 10000,
  cleanupInterval: 60000, // 1 minuto
  enableMetrics: true
});

// Middleware de cache para Express
export const cacheMiddleware = (ttl: number = 300) => {
  return (req: any, res: any, next: any) => {
    const key = `api:${req.method}:${req.originalUrl}:${JSON.stringify(req.query)}`;
    
    const cached = cacheService.get(key);
    if (cached) {
      res.set('X-Cache', 'HIT');
      return res.json(cached);
    }

    const originalSend = res.json;
    res.json = function(data: any) {
      cacheService.set(key, data, ttl);
      res.set('X-Cache', 'MISS');
      return originalSend.call(this, data);
    };

    next();
  };
};

// Decorador para métodos de servicio
export function Cached(ttl: number = 300, keyGenerator?: (...args: any[]) => string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const key = keyGenerator 
        ? keyGenerator(...args)
        : `service:${target.constructor.name}:${propertyName}:${JSON.stringify(args)}`;

      return cacheService.getOrSet(key, () => method.apply(this, args), ttl);
    };
  };
}
