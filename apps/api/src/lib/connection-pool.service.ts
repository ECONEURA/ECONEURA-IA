/**
 * PR-50: Connection Pooling Service
 * 
 * Sistema avanzado de gestión de pools de conexiones con:
 * - Pool de conexiones PostgreSQL optimizado
 * - Pool de conexiones Redis para cache
 * - Pool de conexiones HTTP para APIs externas
 * - Monitoreo de conexiones en tiempo real
 * - Balanceo de carga inteligente
 * - Circuit breaker para conexiones fallidas
 * - Health checks automáticos
 * - Métricas de rendimiento
 */

import { structuredLogger } from './structured-logger.js';
import { metrics } from '@econeura/shared/src/metrics/index.js';

export interface PoolConfig {
  enabled: boolean;
  maxConnections: number;
  minConnections: number;
  idleTimeout: number; // ms
  connectionTimeout: number; // ms
  acquireTimeout: number; // ms
  healthCheckInterval: number; // ms
  retryAttempts: number;
  retryDelay: number; // ms
  circuitBreakerThreshold: number;
  circuitBreakerTimeout: number; // ms
  loadBalancingStrategy: 'round-robin' | 'least-connections' | 'weighted';
}

export interface ConnectionMetrics {
  total: number;
  active: number;
  idle: number;
  waiting: number;
  created: number;
  destroyed: number;
  failed: number;
  avgAcquireTime: number;
  avgResponseTime: number;
  healthCheckPassed: number;
  healthCheckFailed: number;
  circuitBreakerOpen: number;
  loadBalanced: number;
}

export interface Connection {
  id: string;
  type: 'postgres' | 'redis' | 'http' | 'external';
  host: string;
  port: number;
  database?: string;
  status: 'idle' | 'active' | 'failed' | 'destroyed';
  createdAt: number;
  lastUsed: number;
  responseTime: number;
  errorCount: number;
  healthStatus: 'healthy' | 'unhealthy' | 'unknown';
  metadata?: Record<string, any>;
}

export interface PoolStats {
  name: string;
  type: string;
  config: PoolConfig;
  metrics: ConnectionMetrics;
  connections: Connection[];
  healthStatus: 'healthy' | 'degraded' | 'critical';
  lastHealthCheck: number;
  circuitBreakerStatus: 'closed' | 'open' | 'half-open';
}

export interface HealthCheckResult {
  connectionId: string;
  success: boolean;
  responseTime: number;
  error?: string;
  timestamp: number;
}

export interface LoadBalanceResult {
  connectionId: string;
  strategy: string;
  weight: number;
  connectionsCount: number;
  timestamp: number;
}

export class ConnectionPoolService {
  private pools: Map<string, PoolStats> = new Map();
  private healthCheckIntervals: Map<string, NodeJS.Timeout> = new Map();
  private circuitBreakers: Map<string, { failures: number; lastFailure: number; state: 'closed' | 'open' | 'half-open' }> = new Map();
  private loadBalancers: Map<string, { index: number; weights: Map<string, number> }> = new Map();
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeDefaultPools();
    this.startMonitoring();
  }

  /**
   * Inicializa pools por defecto
   */
  private initializeDefaultPools(): void {
    // Pool PostgreSQL
    this.createPool('postgres', 'postgres', {
      enabled: true,
      maxConnections: 20,
      minConnections: 5,
      idleTimeout: 300000, // 5 minutos
      connectionTimeout: 10000, // 10 segundos
      acquireTimeout: 5000, // 5 segundos
      healthCheckInterval: 30000, // 30 segundos
      retryAttempts: 3,
      retryDelay: 1000, // 1 segundo
      circuitBreakerThreshold: 5,
      circuitBreakerTimeout: 60000, // 1 minuto
      loadBalancingStrategy: 'least-connections'
    });

    // Pool Redis
    this.createPool('redis', 'redis', {
      enabled: true,
      maxConnections: 15,
      minConnections: 3,
      idleTimeout: 180000, // 3 minutos
      connectionTimeout: 5000, // 5 segundos
      acquireTimeout: 3000, // 3 segundos
      healthCheckInterval: 20000, // 20 segundos
      retryAttempts: 3,
      retryDelay: 500, // 500ms
      circuitBreakerThreshold: 3,
      circuitBreakerTimeout: 30000, // 30 segundos
      loadBalancingStrategy: 'round-robin'
    });

    // Pool HTTP para APIs externas
    this.createPool('http', 'http', {
      enabled: true,
      maxConnections: 50,
      minConnections: 10,
      idleTimeout: 120000, // 2 minutos
      connectionTimeout: 8000, // 8 segundos
      acquireTimeout: 2000, // 2 segundos
      healthCheckInterval: 60000, // 1 minuto
      retryAttempts: 2,
      retryDelay: 2000, // 2 segundos
      circuitBreakerThreshold: 10,
      circuitBreakerTimeout: 120000, // 2 minutos
      loadBalancingStrategy: 'weighted'
    });

    structuredLogger.info('Default connection pools initialized', {
      pools: Array.from(this.pools.keys()),
      requestId: ''
    });
  }

  /**
   * Crea un nuevo pool de conexiones
   */
  createPool(name: string, type: string, config: PoolConfig): void {
    const pool: PoolStats = {
      name,
      type,
      config,
      metrics: {
        total: 0,
        active: 0,
        idle: 0,
        waiting: 0,
        created: 0,
        destroyed: 0,
        failed: 0,
        avgAcquireTime: 0,
        avgResponseTime: 0,
        healthCheckPassed: 0,
        healthCheckFailed: 0,
        circuitBreakerOpen: 0,
        loadBalanced: 0
      },
      connections: [],
      healthStatus: 'healthy',
      lastHealthCheck: 0,
      circuitBreakerStatus: 'closed'
    };

    this.pools.set(name, pool);
    this.circuitBreakers.set(name, { failures: 0, lastFailure: 0, state: 'closed' });
    this.loadBalancers.set(name, { index: 0, weights: new Map() });

    // Inicializar conexiones mínimas
    this.initializeConnections(name);

    // Iniciar health checks
    this.startHealthChecks(name);

    structuredLogger.info('Connection pool created', {
      name,
      type,
      config,
      requestId: ''
    });
  }

  /**
   * Inicializa conexiones para un pool
   */
  private async initializeConnections(poolName: string): Promise<void> {
    const pool = this.pools.get(poolName);
    if (!pool) return;

    const { minConnections } = pool.config;
    
    for (let i = 0; i < minConnections; i++) {
      await this.createConnection(poolName);
    }

    structuredLogger.info('Pool connections initialized', {
      poolName,
      connectionsCreated: minConnections,
      requestId: ''
    });
  }

  /**
   * Crea una nueva conexión
   */
  private async createConnection(poolName: string): Promise<Connection | null> {
    const pool = this.pools.get(poolName);
    if (!pool) return null;

    const connectionId = `${poolName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    try {
      // Simular creación de conexión
      await this.simulateConnectionCreation(poolName);

      const connection: Connection = {
        id: connectionId,
        type: pool.type as Connection['type'],
        host: this.getDefaultHost(poolName),
        port: this.getDefaultPort(poolName),
        database: poolName === 'postgres' ? 'econeura' : undefined,
        status: 'idle',
        createdAt: Date.now(),
        lastUsed: 0,
        responseTime: Date.now() - startTime,
        errorCount: 0,
        healthStatus: 'healthy',
        metadata: {
          poolName,
          createdBy: 'system'
        }
      };

      pool.connections.push(connection);
      pool.metrics.total++;
      pool.metrics.created++;
      pool.metrics.idle++;

      structuredLogger.info('Connection created', {
        poolName,
        connectionId,
        responseTime: connection.responseTime,
        requestId: ''
      });

      return connection;

    } catch (error) {
      pool.metrics.failed++;
      
      structuredLogger.error('Failed to create connection', {
        poolName,
        connectionId,
        error: error instanceof Error ? error.message : String(error),
        requestId: ''
      });

      return null;
    }
  }

  /**
   * Obtiene una conexión del pool
   */
  async acquireConnection(poolName: string, timeout?: number): Promise<Connection | null> {
    const pool = this.pools.get(poolName);
    if (!pool) {
      structuredLogger.error('Pool not found', { poolName, requestId: '' });
      return null;
    }

    // Verificar circuit breaker
    if (this.isCircuitBreakerOpen(poolName)) {
      structuredLogger.warn('Circuit breaker open for pool', { poolName, requestId: '' });
      return null;
    }

    const acquireTimeout = timeout || pool.config.acquireTimeout;
    const startTime = Date.now();

    try {
      // Buscar conexión idle
      let connection = this.findIdleConnection(poolName);
      
      if (!connection) {
        // Crear nueva conexión si no hay idle y no se ha alcanzado el máximo
        if (pool.metrics.total < pool.config.maxConnections) {
          connection = await this.createConnection(poolName);
        } else {
          // Esperar por una conexión disponible
          connection = await this.waitForConnection(poolName, acquireTimeout);
        }
      }

      if (!connection) {
        pool.metrics.waiting++;
        throw new Error('No connection available');
      }

      // Marcar como activa
      connection.status = 'active';
      connection.lastUsed = Date.now();
      pool.metrics.active++;
      pool.metrics.idle--;

      // Actualizar métricas
      const acquireTime = Date.now() - startTime;
      pool.metrics.avgAcquireTime = (pool.metrics.avgAcquireTime + acquireTime) / 2;

      structuredLogger.info('Connection acquired', {
        poolName,
        connectionId: connection.id,
        acquireTime,
        requestId: ''
      });

      return connection;

    } catch (error) {
      pool.metrics.failed++;
      
      structuredLogger.error('Failed to acquire connection', {
        poolName,
        error: error instanceof Error ? error.message : String(error),
        requestId: ''
      });

      this.recordCircuitBreakerFailure(poolName);
      return null;
    }
  }

  /**
   * Libera una conexión al pool
   */
  async releaseConnection(poolName: string, connectionId: string): Promise<void> {
    const pool = this.pools.get(poolName);
    if (!pool) return;

    const connection = pool.connections.find(c => c.id === connectionId);
    if (!connection) return;

    // Verificar si la conexión debe ser destruida
    const shouldDestroy = this.shouldDestroyConnection(connection, pool.config);

    if (shouldDestroy) {
      await this.destroyConnection(poolName, connectionId);
    } else {
      // Marcar como idle
      connection.status = 'idle';
      connection.lastUsed = Date.now();
      pool.metrics.active--;
      pool.metrics.idle++;

      structuredLogger.info('Connection released', {
        poolName,
        connectionId,
        requestId: ''
      });
    }
  }

  /**
   * Destruye una conexión
   */
  private async destroyConnection(poolName: string, connectionId: string): Promise<void> {
    const pool = this.pools.get(poolName);
    if (!pool) return;

    const connectionIndex = pool.connections.findIndex(c => c.id === connectionId);
    if (connectionIndex === -1) return;

    const connection = pool.connections[connectionIndex];
    
    try {
      // Simular destrucción de conexión
      await this.simulateConnectionDestruction(poolName);

      pool.connections.splice(connectionIndex, 1);
      pool.metrics.total--;
      pool.metrics.destroyed++;
      
      if (connection.status === 'active') {
        pool.metrics.active--;
      } else {
        pool.metrics.idle--;
      }

      structuredLogger.info('Connection destroyed', {
        poolName,
        connectionId,
        requestId: ''
      });

    } catch (error) {
      structuredLogger.error('Failed to destroy connection', {
        poolName,
        connectionId,
        error: error instanceof Error ? error.message : String(error),
        requestId: ''
      });
    }
  }

  /**
   * Inicia health checks para un pool
   */
  private startHealthChecks(poolName: string): void {
    const pool = this.pools.get(poolName);
    if (!pool) return;

    const interval = setInterval(async () => {
      await this.performHealthCheck(poolName);
    }, pool.config.healthCheckInterval);

    this.healthCheckIntervals.set(poolName, interval);
  }

  /**
   * Realiza health check en un pool
   */
  private async performHealthCheck(poolName: string): Promise<void> {
    const pool = this.pools.get(poolName);
    if (!pool) return;

    const startTime = Date.now();
    let healthyConnections = 0;
    let totalConnections = pool.connections.length;

    for (const connection of pool.connections) {
      try {
        const result = await this.checkConnectionHealth(connection);
        if (result.success) {
          connection.healthStatus = 'healthy';
          healthyConnections++;
          pool.metrics.healthCheckPassed++;
        } else {
          connection.healthStatus = 'unhealthy';
          pool.metrics.healthCheckFailed++;
        }
        connection.responseTime = result.responseTime;
      } catch (error) {
        connection.healthStatus = 'unhealthy';
        connection.errorCount++;
        pool.metrics.healthCheckFailed++;
      }
    }

    // Actualizar estado de salud del pool
    const healthRatio = totalConnections > 0 ? healthyConnections / totalConnections : 1;
    pool.healthStatus = healthRatio >= 0.8 ? 'healthy' : healthRatio >= 0.5 ? 'degraded' : 'critical';
    pool.lastHealthCheck = Date.now();

    // Crear conexiones adicionales si es necesario
    if (pool.metrics.total < pool.config.minConnections) {
      const needed = pool.config.minConnections - pool.metrics.total;
      for (let i = 0; i < needed; i++) {
        await this.createConnection(poolName);
      }
    }

    structuredLogger.info('Health check completed', {
      poolName,
      healthyConnections,
      totalConnections,
      healthRatio,
      healthStatus: pool.healthStatus,
      duration: Date.now() - startTime,
      requestId: ''
    });
  }

  /**
   * Verifica la salud de una conexión individual
   */
  private async checkConnectionHealth(connection: Connection): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      // Simular health check
      await this.simulateHealthCheck(connection.type);

      return {
        connectionId: connection.id,
        success: true,
        responseTime: Date.now() - startTime,
        timestamp: Date.now()
      };

    } catch (error) {
      return {
        connectionId: connection.id,
        success: false,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now()
      };
    }
  }

  /**
   * Balancea la carga entre conexiones
   */
  loadBalance(poolName: string): Connection | null {
    const pool = this.pools.get(poolName);
    if (!pool) return null;

    const strategy = pool.config.loadBalancingStrategy;
    const connections = pool.connections.filter(c => c.status === 'idle' && c.healthStatus === 'healthy');

    if (connections.length === 0) return null;

    let selectedConnection: Connection;

    switch (strategy) {
      case 'round-robin':
        selectedConnection = this.roundRobinSelection(poolName, connections);
        break;
      case 'least-connections':
        selectedConnection = this.leastConnectionsSelection(connections);
        break;
      case 'weighted':
        selectedConnection = this.weightedSelection(poolName, connections);
        break;
      default:
        selectedConnection = connections[0];
    }

    pool.metrics.loadBalanced++;
    
    structuredLogger.info('Load balancing performed', {
      poolName,
      strategy,
      selectedConnectionId: selectedConnection.id,
      availableConnections: connections.length,
      requestId: ''
    });

    return selectedConnection;
  }

  /**
   * Inicia el monitoreo general
   */
  private startMonitoring(): void {
    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.updateMetrics();
      this.cleanupIdleConnections();
    }, 30000); // 30 segundos

    structuredLogger.info('Connection pool monitoring started', { requestId: '' });
  }

  /**
   * Actualiza métricas de todos los pools
   */
  private updateMetrics(): void {
    for (const [poolName, pool] of this.pools) {
      // Actualizar métricas Prometheus
      this.updatePrometheusMetrics(poolName, pool);
    }
  }

  /**
   * Limpia conexiones idle
   */
  private cleanupIdleConnections(): void {
    for (const [poolName, pool] of this.pools) {
      const now = Date.now();
      const connectionsToDestroy: string[] = [];

      for (const connection of pool.connections) {
        if (connection.status === 'idle' && 
            now - connection.lastUsed > pool.config.idleTimeout) {
          connectionsToDestroy.push(connection.id);
        }
      }

      // Destruir conexiones idle
      for (const connectionId of connectionsToDestroy) {
        this.destroyConnection(poolName, connectionId);
      }

      if (connectionsToDestroy.length > 0) {
        structuredLogger.info('Idle connections cleaned up', {
          poolName,
          destroyedCount: connectionsToDestroy.length,
          requestId: ''
        });
      }
    }
  }

  // Métodos auxiliares
  private findIdleConnection(poolName: string): Connection | null {
    const pool = this.pools.get(poolName);
    if (!pool) return null;

    return pool.connections.find(c => c.status === 'idle' && c.healthStatus === 'healthy') || null;
  }

  private async waitForConnection(poolName: string, timeout: number): Promise<Connection | null> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const connection = this.findIdleConnection(poolName);
      if (connection) return connection;
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return null;
  }

  private shouldDestroyConnection(connection: Connection, config: PoolConfig): boolean {
    const now = Date.now();
    const idleTime = now - connection.lastUsed;
    
    return connection.errorCount > config.retryAttempts || 
           idleTime > config.idleTimeout ||
           connection.healthStatus === 'unhealthy';
  }

  private isCircuitBreakerOpen(poolName: string): boolean {
    const breaker = this.circuitBreakers.get(poolName);
    if (!breaker) return false;

    if (breaker.state === 'open') {
      const now = Date.now();
      if (now - breaker.lastFailure > this.getPoolConfig(poolName)?.circuitBreakerTimeout || 0) {
        breaker.state = 'half-open';
        return false;
      }
      return true;
    }

    return false;
  }

  private recordCircuitBreakerFailure(poolName: string): void {
    const breaker = this.circuitBreakers.get(poolName);
    const config = this.getPoolConfig(poolName);
    
    if (!breaker || !config) return;

    breaker.failures++;
    breaker.lastFailure = Date.now();

    if (breaker.failures >= config.circuitBreakerThreshold) {
      breaker.state = 'open';
      const pool = this.pools.get(poolName);
      if (pool) {
        pool.circuitBreakerStatus = 'open';
        pool.metrics.circuitBreakerOpen++;
      }
    }
  }

  private roundRobinSelection(poolName: string, connections: Connection[]): Connection {
    const balancer = this.loadBalancers.get(poolName);
    if (!balancer) return connections[0];

    const selected = connections[balancer.index % connections.length];
    balancer.index++;
    return selected;
  }

  private leastConnectionsSelection(connections: Connection[]): Connection {
    return connections.reduce((min, conn) => 
      conn.errorCount < min.errorCount ? conn : min
    );
  }

  private weightedSelection(poolName: string, connections: Connection[]): Connection {
    const balancer = this.loadBalancers.get(poolName);
    if (!balancer) return connections[0];

    // Calcular pesos basados en response time y error count
    const weights = connections.map(conn => {
      const responseWeight = Math.max(0, 100 - conn.responseTime);
      const errorWeight = Math.max(0, 10 - conn.errorCount);
      return responseWeight + errorWeight;
    });

    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < connections.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return connections[i];
      }
    }

    return connections[0];
  }

  private getDefaultHost(poolName: string): string {
    switch (poolName) {
      case 'postgres': return 'localhost';
      case 'redis': return 'localhost';
      case 'http': return 'api.external.com';
      default: return 'localhost';
    }
  }

  private getDefaultPort(poolName: string): number {
    switch (poolName) {
      case 'postgres': return 5432;
      case 'redis': return 6379;
      case 'http': return 443;
      default: return 80;
    }
  }

  private getPoolConfig(poolName: string): PoolConfig | null {
    const pool = this.pools.get(poolName);
    return pool ? pool.config : null;
  }

  // Métodos de simulación
  private async simulateConnectionCreation(poolName: string): Promise<void> {
    const delay = poolName === 'postgres' ? 50 : poolName === 'redis' ? 20 : 30;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  private async simulateConnectionDestruction(poolName: string): Promise<void> {
    const delay = poolName === 'postgres' ? 30 : poolName === 'redis' ? 10 : 20;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  private async simulateHealthCheck(type: string): Promise<void> {
    const delay = type === 'postgres' ? 25 : type === 'redis' ? 15 : 20;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Actualiza métricas Prometheus
   */
  private updatePrometheusMetrics(poolName: string, pool: PoolStats): void {
    // Actualizar métricas de conexiones
    metrics.connectionPoolSize.labels(poolName, 'total').set(pool.metrics.total);
    metrics.connectionPoolSize.labels(poolName, 'active').set(pool.metrics.active);
    metrics.connectionPoolSize.labels(poolName, 'idle').set(pool.metrics.idle);
    metrics.connectionPoolSize.labels(poolName, 'waiting').set(pool.metrics.waiting);
  }

  /**
   * Obtiene estadísticas de todos los pools
   */
  getStats(): Map<string, PoolStats> {
    return new Map(this.pools);
  }

  /**
   * Obtiene estadísticas de un pool específico
   */
  getPoolStats(poolName: string): PoolStats | null {
    return this.pools.get(poolName) || null;
  }

  /**
   * Actualiza configuración de un pool
   */
  updatePoolConfig(poolName: string, config: Partial<PoolConfig>): void {
    const pool = this.pools.get(poolName);
    if (!pool) return;

    pool.config = { ...pool.config, ...config };
    
    structuredLogger.info('Pool configuration updated', {
      poolName,
      config: pool.config,
      requestId: ''
    });
  }

  /**
   * Detiene el servicio
   */
  stop(): void {
    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    // Detener health checks
    for (const interval of this.healthCheckIntervals.values()) {
      clearInterval(interval);
    }
    this.healthCheckIntervals.clear();

    // Destruir todas las conexiones
    for (const poolName of this.pools.keys()) {
      const pool = this.pools.get(poolName);
      if (pool) {
        for (const connection of pool.connections) {
          this.destroyConnection(poolName, connection.id);
        }
      }
    }

    structuredLogger.info('Connection pool service stopped', { requestId: '' });
  }
}

// Instancia singleton
export const connectionPoolService = new ConnectionPoolService();
