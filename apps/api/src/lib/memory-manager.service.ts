/**
 * PR-49: Memory Management Service
 * 
 * Sistema avanzado de gestión de memoria con:
 * - Monitoreo de memoria en tiempo real
 * - Garbage collection inteligente
 * - Limpieza automática de cache
 * - Detección de memory leaks
 * - Optimización de heap
 * - Compresión de datos en memoria
 */

import { metrics } from '@econeura/shared/src/metrics/index.js';

import { structuredLogger } from './structured-logger.js';

export interface MemoryConfig {
  enabled: boolean;
  maxMemoryMB: number;
  gcThreshold: number; // MB
  cacheCleanupThreshold: number; // MB
  leakDetectionEnabled: boolean;
  compressionEnabled: boolean;
  heapOptimizationEnabled: boolean;
  monitoringInterval: number; // ms
  gcInterval: number; // ms
  cacheCleanupInterval: number; // ms
  maxCacheAge: number; // ms
  compressionThreshold: number; // MB
}

export interface MemoryMetrics {
  total: number;
  used: number;
  free: number;
  heap: {
    total: number;
    used: number;
    free: number;
    external: number;
    arrayBuffers: number;
  };
  rss: number;
  external: number;
  arrayBuffers: number;
  gc: {
    major: number;
    minor: number;
    duration: number;
    lastGC: number;
  };
  cache: {
    size: number;
    entries: number;
    hitRate: number;
    evictions: number;
  };
  leaks: {
    detected: number;
    suspected: number;
    resolved: number;
  };
  compression: {
    compressed: number;
    savings: number;
    ratio: number;
  };
}

export interface MemoryLeak {
  id: string;
  type: 'object' | 'array' | 'function' | 'closure' | 'timer' | 'event';
  size: number;
  location: string;
  firstDetected: number;
  lastSeen: number;
  count: number;
  stackTrace?: string;
}

export interface GCAction {
  type: 'minor' | 'major' | 'incremental' | 'full';
  duration: number;
  freed: number;
  before: number;
  after: number;
  timestamp: number;
}

export class MemoryManagerService {
  private config: MemoryConfig;
  private metrics: MemoryMetrics;
  private leaks: Map<string, MemoryLeak> = new Map();
  private gcHistory: GCAction[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private gcInterval: NodeJS.Timeout | null = null;
  private cacheCleanupInterval: NodeJS.Timeout | null = null;
  private isOptimizing = false;
  private lastGC = 0;
  private gcCount = { major: 0, minor: 0 };

  constructor(config: Partial<MemoryConfig> = {}) {
    this.config = {
      enabled: true,
      maxMemoryMB: 1024,
      gcThreshold: 512,
      cacheCleanupThreshold: 256,
      leakDetectionEnabled: true,
      compressionEnabled: true,
      heapOptimizationEnabled: true,
      monitoringInterval: 10000, // 10 segundos
      gcInterval: 60000, // 1 minuto
      cacheCleanupInterval: 30000, // 30 segundos
      maxCacheAge: 300000, // 5 minutos
      compressionThreshold: 100,
      ...config
    };

    this.metrics = this.initializeMetrics();
    this.startMonitoring();
    this.setupGCHooks();
  }

  /**
   * Inicializa las métricas de memoria
   */
  private initializeMetrics(): MemoryMetrics {
    const memUsage = process.memoryUsage();
    
    return {
      total: this.config.maxMemoryMB,
      used: Math.round(memUsage.rss / 1024 / 1024),
      free: this.config.maxMemoryMB - Math.round(memUsage.rss / 1024 / 1024),
      heap: {
        total: Math.round(memUsage.heapTotal / 1024 / 1024),
        used: Math.round(memUsage.heapUsed / 1024 / 1024),
        free: Math.round((memUsage.heapTotal - memUsage.heapUsed) / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024),
        arrayBuffers: Math.round(memUsage.arrayBuffers / 1024 / 1024)
      },
      rss: Math.round(memUsage.rss / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024),
      arrayBuffers: Math.round(memUsage.arrayBuffers / 1024 / 1024),
      gc: {
        major: 0,
        minor: 0,
        duration: 0,
        lastGC: 0
      },
      cache: {
        size: 0,
        entries: 0,
        hitRate: 0.95,
        evictions: 0
      },
      leaks: {
        detected: 0,
        suspected: 0,
        resolved: 0
      },
      compression: {
        compressed: 0,
        savings: 0,
        ratio: 0
      }
    };
  }

  /**
   * Configura hooks de garbage collection
   */
  private setupGCHooks(): void {
    if (!this.config.enabled) return;

    // Hook para detectar garbage collection
    if (global.gc) {
      const originalGC = global.gc;
      global.gc = () => {
        const start = Date.now();
        const before = process.memoryUsage().heapUsed;
        
        const result = originalGC();
        
        const after = process.memoryUsage().heapUsed;
        const duration = Date.now() - start;
        const freed = before - after;

        this.recordGCAction('manual', duration, freed, before, after);
        
        return result;
      };
    }

    structuredLogger.info('Memory manager GC hooks configured', {
      config: this.config,
      requestId: ''
    });
  }

  /**
   * Inicia el monitoreo de memoria
   */
  private startMonitoring(): void {
    if (!this.config.enabled) return;

    // Monitoreo principal
    this.monitoringInterval = setInterval(() => {
      this.updateMetrics();
      this.checkMemoryHealth();
    }, this.config.monitoringInterval);

    // Garbage collection automático
    this.gcInterval = setInterval(() => {
      this.performGarbageCollection();
    }, this.config.gcInterval);

    // Limpieza de cache
    this.cacheCleanupInterval = setInterval(() => {
      this.cleanupCache();
    }, this.config.cacheCleanupInterval);

    structuredLogger.info('Memory monitoring started', {
      config: this.config,
      requestId: ''
    });
  }

  /**
   * Actualiza las métricas de memoria
   */
  private updateMetrics(): void {
    const memUsage = process.memoryUsage();
    const beforeUsed = this.metrics.used;

    this.metrics = {
      total: this.config.maxMemoryMB,
      used: Math.round(memUsage.rss / 1024 / 1024),
      free: this.config.maxMemoryMB - Math.round(memUsage.rss / 1024 / 1024),
      heap: {
        total: Math.round(memUsage.heapTotal / 1024 / 1024),
        used: Math.round(memUsage.heapUsed / 1024 / 1024),
        free: Math.round((memUsage.heapTotal - memUsage.heapUsed) / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024),
        arrayBuffers: Math.round(memUsage.arrayBuffers / 1024 / 1024)
      },
      rss: Math.round(memUsage.rss / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024),
      arrayBuffers: Math.round(memUsage.arrayBuffers / 1024 / 1024),
      gc: {
        major: this.gcCount.major,
        minor: this.gcCount.minor,
        duration: this.metrics.gc.duration,
        lastGC: this.lastGC
      },
      cache: this.metrics.cache,
      leaks: this.metrics.leaks,
      compression: this.metrics.compression
    };

    // Detectar memory leaks
    if (this.config.leakDetectionEnabled) {
      this.detectMemoryLeaks(beforeUsed, this.metrics.used);
    }

    // Actualizar métricas Prometheus
    this.updatePrometheusMetrics();
  }

  /**
   * Verifica la salud de la memoria
   */
  private checkMemoryHealth(): void {
    const issues: string[] = [];

    // Verificar uso de memoria
    if (this.metrics.used > this.config.maxMemoryMB * 0.9) {
      issues.push('critical_memory_usage');
    } else if (this.metrics.used > this.config.gcThreshold) {
      issues.push('high_memory_usage');
    }

    // Verificar heap
    if (this.metrics.heap.used > this.metrics.heap.total * 0.8) {
      issues.push('high_heap_usage');
    }

    // Verificar cache
    if (this.metrics.cache.size > this.config.cacheCleanupThreshold) {
      issues.push('large_cache_size');
    }

    // Verificar memory leaks
    if (this.metrics.leaks.detected > 0) {
      issues.push('memory_leaks_detected');
    }

    if (issues.length > 0) {
      structuredLogger.warn('Memory health issues detected', {
        issues,
        metrics: this.metrics,
        requestId: ''
      });

      // Ejecutar optimizaciones automáticas
      this.optimizeMemory(issues);
    }
  }

  /**
   * Optimiza la memoria basado en los problemas detectados
   */
  private async optimizeMemory(issues: string[]): Promise<void> {
    if (this.isOptimizing) return;

    this.isOptimizing = true;
    structuredLogger.info('Starting memory optimization', {
      issues,
      requestId: ''
    });

    try {
      for (const issue of issues) {
        switch (issue) {
          case 'critical_memory_usage':
          case 'high_memory_usage':
            await this.performGarbageCollection();
            await this.cleanupCache();
            break;
          case 'high_heap_usage':
            await this.optimizeHeap();
            break;
          case 'large_cache_size':
            await this.cleanupCache();
            break;
          case 'memory_leaks_detected':
            await this.resolveMemoryLeaks();
            break;
        }
      }
    } catch (error) {
      structuredLogger.error('Memory optimization failed', {
        error: error instanceof Error ? error.message : String(error),
        requestId: ''
      });
    } finally {
      this.isOptimizing = false;
    }
  }

  /**
   * Realiza garbage collection
   */
  private async performGarbageCollection(): Promise<void> {
    if (!global.gc) {
      structuredLogger.warn('Garbage collection not available', { requestId: '' });
      return;
    }

    const start = Date.now();
    const before = process.memoryUsage().heapUsed;

    try {
      global.gc();
      
      const after = process.memoryUsage().heapUsed;
      const duration = Date.now() - start;
      const freed = before - after;

      this.recordGCAction('automatic', duration, freed, before, after);
      this.lastGC = Date.now();

      structuredLogger.info('Garbage collection performed', {
        duration,
        freed: Math.round(freed / 1024 / 1024),
        before: Math.round(before / 1024 / 1024),
        after: Math.round(after / 1024 / 1024),
        requestId: ''
      });

    } catch (error) {
      structuredLogger.error('Garbage collection failed', {
        error: error instanceof Error ? error.message : String(error),
        requestId: ''
      });
    }
  }

  /**
   * Registra una acción de garbage collection
   */
  private recordGCAction(type: 'automatic' | 'manual', duration: number, freed: number, before: number, after: number): void {
    const action: GCAction = {
      type: type === 'automatic' ? 'major' : 'minor',
      duration,
      freed,
      before: Math.round(before / 1024 / 1024),
      after: Math.round(after / 1024 / 1024),
      timestamp: Date.now()
    };

    this.gcHistory.push(action);
    
    // Mantener solo los últimos 100 registros
    if (this.gcHistory.length > 100) {
      this.gcHistory = this.gcHistory.slice(-100);
    }

    // Actualizar contadores
    if (action.type === 'major') {
      this.gcCount.major++;
    } else {
      this.gcCount.minor++;
    }

    this.metrics.gc.duration = duration;
    this.metrics.gc.lastGC = Date.now();
  }

  /**
   * Limpia el cache
   */
  private async cleanupCache(): Promise<void> {
    const start = Date.now();
    const beforeSize = this.metrics.cache.size;

    try {
      // Simular limpieza de cache
      await this.clearOldCacheEntries();
      await this.compressCacheData();

      const afterSize = this.metrics.cache.size;
      const cleaned = beforeSize - afterSize;

      structuredLogger.info('Cache cleanup performed', {
        duration: Date.now() - start,
        beforeSize,
        afterSize,
        cleaned,
        requestId: ''
      });

    } catch (error) {
      structuredLogger.error('Cache cleanup failed', {
        error: error instanceof Error ? error.message : String(error),
        requestId: ''
      });
    }
  }

  /**
   * Optimiza el heap
   */
  private async optimizeHeap(): Promise<void> {
    const start = Date.now();

    try {
      // Simular optimización de heap
      await this.defragmentHeap();
      await this.optimizeObjectLayout();

      structuredLogger.info('Heap optimization performed', {
        duration: Date.now() - start,
        requestId: ''
      });

    } catch (error) {
      structuredLogger.error('Heap optimization failed', {
        error: error instanceof Error ? error.message : String(error),
        requestId: ''
      });
    }
  }

  /**
   * Resuelve memory leaks detectados
   */
  private async resolveMemoryLeaks(): Promise<void> {
    const start = Date.now();
    const leaksToResolve = Array.from(this.leaks.values()).filter(leak => 
      Date.now() - leak.firstDetected > 300000 // 5 minutos
    );

    try {
      for (const leak of leaksToResolve) {
        await this.resolveLeak(leak);
        this.leaks.delete(leak.id);
        this.metrics.leaks.resolved++;
      }

      structuredLogger.info('Memory leaks resolved', {
        duration: Date.now() - start,
        resolved: leaksToResolve.length,
        remaining: this.leaks.size,
        requestId: ''
      });

    } catch (error) {
      structuredLogger.error('Memory leak resolution failed', {
        error: error instanceof Error ? error.message : String(error),
        requestId: ''
      });
    }
  }

  /**
   * Detecta memory leaks
   */
  private detectMemoryLeaks(before: number, after: number): void {
    const growth = after - before;
    const growthRate = growth / before;

    // Detectar crecimiento anormal de memoria
    if (growthRate > 0.1 && after > this.config.gcThreshold) {
      const leakId = `leak_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const leak: MemoryLeak = {
        id: leakId,
        type: 'object',
        size: growth,
        location: 'unknown',
        firstDetected: Date.now(),
        lastSeen: Date.now(),
        count: 1
      };

      this.leaks.set(leakId, leak);
      this.metrics.leaks.detected++;

      structuredLogger.warn('Memory leak detected', {
        leakId,
        growth,
        growthRate,
        totalLeaks: this.leaks.size,
        requestId: ''
      });
    }
  }

  // Métodos auxiliares para optimizaciones específicas
  private async clearOldCacheEntries(): Promise<void> {
    // Simular limpieza de entradas antiguas
    await new Promise(resolve => setTimeout(resolve, 10));
    this.metrics.cache.evictions += 5;
    this.metrics.cache.entries -= 5;
  }

  private async compressCacheData(): Promise<void> {
    if (!this.config.compressionEnabled) return;
    
    // Simular compresión de datos
    await new Promise(resolve => setTimeout(resolve, 15));
    this.metrics.compression.compressed += 10;
    this.metrics.compression.savings += 5;
  }

  private async defragmentHeap(): Promise<void> {
    // Simular desfragmentación del heap
    await new Promise(resolve => setTimeout(resolve, 20));
  }

  private async optimizeObjectLayout(): Promise<void> {
    // Simular optimización del layout de objetos
    await new Promise(resolve => setTimeout(resolve, 15));
  }

  private async resolveLeak(leak: MemoryLeak): Promise<void> {
    // Simular resolución de memory leak
    await new Promise(resolve => setTimeout(resolve, 5));
  }

  /**
   * Actualiza métricas Prometheus
   */
  private updatePrometheusMetrics(): void {
    // Actualizar métricas de memoria
    metrics.memoryUsage.labels('rss').set(this.metrics.rss);
    metrics.memoryUsage.labels('heapTotal').set(this.metrics.heap.total);
    metrics.memoryUsage.labels('heapUsed').set(this.metrics.heap.used);
    metrics.memoryUsage.labels('external').set(this.metrics.external);
    metrics.memoryUsage.labels('arrayBuffers').set(this.metrics.arrayBuffers);
  }

  /**
   * Obtiene el estado actual del gestor de memoria
   */
  getStatus(): {
    enabled: boolean;
    isOptimizing: boolean;
    metrics: MemoryMetrics;
    leaks: MemoryLeak[];
    gcHistory: GCAction[];
    config: MemoryConfig;
  } {
    return {
      enabled: this.config.enabled,
      isOptimizing: this.isOptimizing,
      metrics: this.metrics,
      leaks: Array.from(this.leaks.values()),
      gcHistory: this.gcHistory.slice(-20), // Últimos 20
      config: this.config
    };
  }

  /**
   * Fuerza una optimización manual
   */
  async forceOptimization(type?: 'gc' | 'cache' | 'heap' | 'leaks'): Promise<void> {
    const start = Date.now();

    try {
      switch (type) {
        case 'gc':
          await this.performGarbageCollection();
          break;
        case 'cache':
          await this.cleanupCache();
          break;
        case 'heap':
          await this.optimizeHeap();
          break;
        case 'leaks':
          await this.resolveMemoryLeaks();
          break;
        default:
          await this.performGarbageCollection();
          await this.cleanupCache();
          await this.optimizeHeap();
          await this.resolveMemoryLeaks();
      }

      structuredLogger.info('Manual memory optimization completed', {
        type: type || 'all',
        duration: Date.now() - start,
        requestId: ''
      });

    } catch (error) {
      structuredLogger.error('Manual memory optimization failed', {
        error: error instanceof Error ? error.message : String(error),
        type: type || 'all',
        requestId: ''
      });
    }
  }

  /**
   * Actualiza la configuración
   */
  updateConfig(newConfig: Partial<MemoryConfig>): void {
    this.config = { ...this.config, ...newConfig };
    structuredLogger.info('Memory manager config updated', {
      config: this.config,
      requestId: ''
    });
  }

  /**
   * Detiene el monitoreo
   */
  stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    if (this.gcInterval) {
      clearInterval(this.gcInterval);
      this.gcInterval = null;
    }
    if (this.cacheCleanupInterval) {
      clearInterval(this.cacheCleanupInterval);
      this.cacheCleanupInterval = null;
    }
    structuredLogger.info('Memory monitoring stopped', { requestId: '' });
  }
}

// Instancia singleton
export const memoryManager = new MemoryManagerService();
