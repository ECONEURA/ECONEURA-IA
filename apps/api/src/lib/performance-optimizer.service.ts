import { structuredLogger } from './structured-logger.js';

// Performance Optimizer Service - MEJORA 1
// Sistema de optimización de rendimiento y gestión de memoria

interface PerformanceMetrics {
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
  };
  cpuUsage: {
    user: number;
    system: number;
  };
  eventLoop: {
    lag: number;
    utilization: number;
  };
  gc: {
    major: number;
    minor: number;
    duration: number;
  };
  connections: {
    active: number;
    idle: number;
    total: number;
  };
  cache: {
    hitRate: number;
    size: number;
    evictions: number;
  };
}

interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  memoryUsage: number;
  responseTime: number;
  errorRate: number;
  lastCheck: string;
}

interface OptimizationConfig {
  memoryThreshold: number; // MB
  cpuThreshold: number; // %
  responseTimeThreshold: number; // ms
  errorRateThreshold: number; // %
  gcThreshold: number; // ms
  cacheSizeLimit: number; // MB
  connectionLimit: number;
  enableLazyLoading: boolean;
  enableServicePooling: boolean;
  enableMemoryOptimization: boolean;
}

class PerformanceOptimizerService {
  private metrics: PerformanceMetrics;
  private serviceHealth: Map<string, ServiceHealth> = new Map();
  private config: OptimizationConfig;
  private optimizationHistory: Array<{
    timestamp: string;
    action: string;
    impact: string;
    metrics: PerformanceMetrics;
  }> = [];

  constructor() {
    this.config = {
      memoryThreshold: 512, // 512MB
      cpuThreshold: 80, // 80%
      responseTimeThreshold: 1000, // 1s
      errorRateThreshold: 5, // 5%
      gcThreshold: 100, // 100ms
      cacheSizeLimit: 256, // 256MB
      connectionLimit: 100,
      enableLazyLoading: true,
      enableServicePooling: true,
      enableMemoryOptimization: true
    };

    this.metrics = this.initializeMetrics();
    this.startMonitoring();
    
    structuredLogger.info('Performance Optimizer Service initialized', {
      config: this.config,
      initialMetrics: this.metrics
    });
  }

  private initializeMetrics(): PerformanceMetrics {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      memoryUsage: {
        rss: Math.round(memUsage.rss / 1024 / 1024), // MB
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024),
        arrayBuffers: Math.round(memUsage.arrayBuffers / 1024 / 1024)
      },
      cpuUsage: {
        user: cpuUsage.user / 1000000, // seconds
        system: cpuUsage.system / 1000000
      },
      eventLoop: {
        lag: 0,
        utilization: 0
      },
      gc: {
        major: 0,
        minor: 0,
        duration: 0
      },
      connections: {
        active: 0,
        idle: 0,
        total: 0
      },
      cache: {
        hitRate: 0,
        size: 0,
        evictions: 0
      }
    };
  }

  private startMonitoring(): void {
    // Monitoreo cada 30 segundos
    setInterval(() => {
      this.collectMetrics();
      this.analyzePerformance();
      this.optimizeIfNeeded();
    }, 30000);

    // Monitoreo de event loop lag
    setInterval(() => {
      const start = process.hrtime.bigint();
      setImmediate(() => {
        const lag = Number(process.hrtime.bigint() - start) / 1000000; // ms
        this.metrics.eventLoop.lag = lag;
      });
    }, 1000);
  }

  private collectMetrics(): void {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    this.metrics = {
      memoryUsage: {
        rss: Math.round(memUsage.rss / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024),
        arrayBuffers: Math.round(memUsage.arrayBuffers / 1024 / 1024)
      },
      cpuUsage: {
        user: cpuUsage.user / 1000000,
        system: cpuUsage.system / 1000000
      },
      eventLoop: {
        lag: this.metrics.eventLoop.lag,
        utilization: this.calculateEventLoopUtilization()
      },
      gc: this.metrics.gc, // Se actualiza por eventos GC
      connections: this.getConnectionMetrics(),
      cache: this.getCacheMetrics()
    };
  }

  private calculateEventLoopUtilization(): number {
    // Simulación de cálculo de utilización del event loop
    const lag = this.metrics.eventLoop.lag;
    if (lag > 10) return Math.min(100, (lag / 10) * 100);
    return Math.max(0, (lag / 5) * 50);
  }

  private getConnectionMetrics() {
    // Simulación de métricas de conexiones
    return {
      active: Math.floor(Math.random() * 20) + 5,
      idle: Math.floor(Math.random() * 10) + 2,
      total: Math.floor(Math.random() * 30) + 7
    };
  }

  private getCacheMetrics() {
    // Simulación de métricas de cache
    return {
      hitRate: Math.random() * 0.3 + 0.7, // 70-100%
      size: Math.floor(Math.random() * 50) + 10, // MB
      evictions: Math.floor(Math.random() * 100)
    };
  }

  private analyzePerformance(): void {
    const issues: string[] = [];
    
    // Análisis de memoria
    if (this.metrics.memoryUsage.heapUsed > this.config.memoryThreshold) {
      issues.push(`High memory usage: ${this.metrics.memoryUsage.heapUsed}MB > ${this.config.memoryThreshold}MB`);
    }
    
    // Análisis de CPU
    if (this.metrics.eventLoop.utilization > this.config.cpuThreshold) {
      issues.push(`High CPU utilization: ${this.metrics.eventLoop.utilization.toFixed(1)}% > ${this.config.cpuThreshold}%`);
    }
    
    // Análisis de event loop lag
    if (this.metrics.eventLoop.lag > 50) {
      issues.push(`High event loop lag: ${this.metrics.eventLoop.lag.toFixed(1)}ms`);
    }
    
    // Análisis de conexiones
    if (this.metrics.connections.total > this.config.connectionLimit) {
      issues.push(`Too many connections: ${this.metrics.connections.total} > ${this.config.connectionLimit}`);
    }
    
    if (issues.length > 0) {
      structuredLogger.warn('Performance issues detected', {
        issues,
        metrics: this.metrics
      });
    }
  }

  private optimizeIfNeeded(): void {
    const optimizations: string[] = [];
    
    // Optimización de memoria
    if (this.metrics.memoryUsage.heapUsed > this.config.memoryThreshold) {
      this.forceGarbageCollection();
      optimizations.push('Forced garbage collection');
    }
    
    // Optimización de cache
    if (this.metrics.cache.size > this.config.cacheSizeLimit) {
      this.optimizeCache();
      optimizations.push('Cache optimization');
    }
    
    // Optimización de conexiones
    if (this.metrics.connections.total > this.config.connectionLimit) {
      this.optimizeConnections();
      optimizations.push('Connection optimization');
    }
    
    // Optimización de servicios
    if (this.config.enableServicePooling) {
      this.optimizeServicePool();
      optimizations.push('Service pool optimization');
    }
    
    if (optimizations.length > 0) {
      this.recordOptimization(optimizations.join(', '));
      structuredLogger.info('Performance optimizations applied', {
        optimizations,
        metrics: this.metrics
      });
    }
  }

  private forceGarbageCollection(): void {
    if (global.gc) {
      const start = Date.now();
      global.gc();
      const duration = Date.now() - start;
      this.metrics.gc.major++;
      this.metrics.gc.duration = duration;
    }
  }

  private optimizeCache(): void {
    // Simulación de optimización de cache
    this.metrics.cache.evictions += Math.floor(Math.random() * 10) + 1;
    this.metrics.cache.size = Math.max(0, this.metrics.cache.size - 10);
  }

  private optimizeConnections(): void {
    // Simulación de optimización de conexiones
    this.metrics.connections.idle = Math.max(0, this.metrics.connections.idle - 5);
    this.metrics.connections.total = this.metrics.connections.active + this.metrics.connections.idle;
  }

  private optimizeServicePool(): void {
    // Simulación de optimización del pool de servicios
    // En una implementación real, esto podría incluir:
    // - Lazy loading de servicios no utilizados
    // - Pooling de conexiones de base de datos
    // - Reutilización de objetos pesados
  }

  private recordOptimization(action: string): void {
    this.optimizationHistory.push({
      timestamp: new Date().toISOString(),
      action,
      impact: this.calculateImpact(),
      metrics: { ...this.metrics }
    });
    
    // Mantener solo los últimos 100 registros
    if (this.optimizationHistory.length > 100) {
      this.optimizationHistory = this.optimizationHistory.slice(-100);
    }
  }

  private calculateImpact(): string {
    const memoryImprovement = this.metrics.memoryUsage.heapUsed < this.config.memoryThreshold ? 'Memory optimized' : 'Memory still high';
    const cpuImprovement = this.metrics.eventLoop.utilization < this.config.cpuThreshold ? 'CPU optimized' : 'CPU still high';
    return `${memoryImprovement}, ${cpuImprovement}`;
  }

  // Métodos públicos para monitoreo
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  getServiceHealth(): ServiceHealth[] {
    return Array.from(this.serviceHealth.values());
  }

  getOptimizationHistory(): Array<{
    timestamp: string;
    action: string;
    impact: string;
    metrics: PerformanceMetrics;
  }> {
    return [...this.optimizationHistory];
  }

  updateConfig(newConfig: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    structuredLogger.info('Performance optimizer config updated', {
      newConfig,
      fullConfig: this.config
    });
  }

  // Método para registrar salud de servicios
  updateServiceHealth(serviceName: string, health: Omit<ServiceHealth, 'name' | 'lastCheck'>): void {
    this.serviceHealth.set(serviceName, {
      name: serviceName,
      ...health,
      lastCheck: new Date().toISOString()
    });
  }

  // Método para obtener recomendaciones
  getRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (this.metrics.memoryUsage.heapUsed > this.config.memoryThreshold * 0.8) {
      recommendations.push('Consider increasing memory limit or optimizing memory usage');
    }
    
    if (this.metrics.eventLoop.utilization > this.config.cpuThreshold * 0.8) {
      recommendations.push('Consider scaling horizontally or optimizing CPU-intensive operations');
    }
    
    if (this.metrics.eventLoop.lag > 20) {
      recommendations.push('Consider optimizing synchronous operations or using worker threads');
    }
    
    if (this.metrics.cache.hitRate < 0.8) {
      recommendations.push('Consider optimizing cache strategy or increasing cache size');
    }
    
    if (this.metrics.connections.total > this.config.connectionLimit * 0.8) {
      recommendations.push('Consider implementing connection pooling or increasing connection limits');
    }
    
    return recommendations;
  }

  // Método para obtener estadísticas de rendimiento
  getPerformanceStats() {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const recentOptimizations = this.optimizationHistory.filter(
      opt => new Date(opt.timestamp) >= last24Hours
    );
    
    return {
      current: {
        memoryUsage: this.metrics.memoryUsage,
        cpuUsage: this.metrics.cpuUsage,
        eventLoop: this.metrics.eventLoop,
        connections: this.metrics.connections,
        cache: this.metrics.cache
      },
      thresholds: {
        memory: this.config.memoryThreshold,
        cpu: this.config.cpuThreshold,
        responseTime: this.config.responseTimeThreshold,
        errorRate: this.config.errorRateThreshold
      },
      health: {
        overall: this.calculateOverallHealth(),
        services: this.getServiceHealth(),
        recommendations: this.getRecommendations()
      },
      optimizations: {
        total: this.optimizationHistory.length,
        last24Hours: recentOptimizations.length,
        recent: recentOptimizations.slice(-5)
      },
      config: this.config
    };
  }

  private calculateOverallHealth(): 'healthy' | 'degraded' | 'unhealthy' {
    const issues = [];
    
    if (this.metrics.memoryUsage.heapUsed > this.config.memoryThreshold) issues.push('memory');
    if (this.metrics.eventLoop.utilization > this.config.cpuThreshold) issues.push('cpu');
    if (this.metrics.eventLoop.lag > 100) issues.push('lag');
    if (this.metrics.connections.total > this.config.connectionLimit) issues.push('connections');
    
    if (issues.length === 0) return 'healthy';
    if (issues.length <= 2) return 'degraded';
    return 'unhealthy';
  }
}

export const performanceOptimizerService = new PerformanceOptimizerService();
