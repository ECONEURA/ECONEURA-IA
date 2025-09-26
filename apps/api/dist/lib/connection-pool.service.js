import { metrics } from '@econeura/shared/src/metrics/index.js';

import { structuredLogger } from './structured-logger.js';
export class ConnectionPoolService {
    pools = new Map();
    healthCheckIntervals = new Map();
    circuitBreakers = new Map();
    loadBalancers = new Map();
    isMonitoring = false;
    monitoringInterval = null;
    constructor() {
        this.initializeDefaultPools();
        this.startMonitoring();
    }
    initializeDefaultPools() {
        this.createPool('postgres', 'postgres', {
            enabled: true,
            maxConnections: 20,
            minConnections: 5,
            idleTimeout: 300000,
            connectionTimeout: 10000,
            acquireTimeout: 5000,
            healthCheckInterval: 30000,
            retryAttempts: 3,
            retryDelay: 1000,
            circuitBreakerThreshold: 5,
            circuitBreakerTimeout: 60000,
            loadBalancingStrategy: 'least-connections'
        });
        this.createPool('redis', 'redis', {
            enabled: true,
            maxConnections: 15,
            minConnections: 3,
            idleTimeout: 180000,
            connectionTimeout: 5000,
            acquireTimeout: 3000,
            healthCheckInterval: 20000,
            retryAttempts: 3,
            retryDelay: 500,
            circuitBreakerThreshold: 3,
            circuitBreakerTimeout: 30000,
            loadBalancingStrategy: 'round-robin'
        });
        this.createPool('http', 'http', {
            enabled: true,
            maxConnections: 50,
            minConnections: 10,
            idleTimeout: 120000,
            connectionTimeout: 8000,
            acquireTimeout: 2000,
            healthCheckInterval: 60000,
            retryAttempts: 2,
            retryDelay: 2000,
            circuitBreakerThreshold: 10,
            circuitBreakerTimeout: 120000,
            loadBalancingStrategy: 'weighted'
        });
        structuredLogger.info('Default connection pools initialized', {
            pools: Array.from(this.pools.keys()),
            requestId: ''
        });
    }
    createPool(name, type, config) {
        const pool = {
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
        this.initializeConnections(name);
        this.startHealthChecks(name);
        structuredLogger.info('Connection pool created', {
            name,
            type,
            config,
            requestId: ''
        });
    }
    async initializeConnections(poolName) {
        const pool = this.pools.get(poolName);
        if (!pool)
            return;
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
    async createConnection(poolName) {
        const pool = this.pools.get(poolName);
        if (!pool)
            return null;
        const connectionId = `${poolName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const startTime = Date.now();
        try {
            await this.simulateConnectionCreation(poolName);
            const connection = {
                id: connectionId,
                type: pool.type,
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
        }
        catch (error) {
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
    async acquireConnection(poolName, timeout) {
        const pool = this.pools.get(poolName);
        if (!pool) {
            structuredLogger.error('Pool not found', { poolName, requestId: '' });
            return null;
        }
        if (this.isCircuitBreakerOpen(poolName)) {
            structuredLogger.warn('Circuit breaker open for pool', { poolName, requestId: '' });
            return null;
        }
        const acquireTimeout = timeout || pool.config.acquireTimeout;
        const startTime = Date.now();
        try {
            let connection = this.findIdleConnection(poolName);
            if (!connection) {
                if (pool.metrics.total < pool.config.maxConnections) {
                    connection = await this.createConnection(poolName);
                }
                else {
                    connection = await this.waitForConnection(poolName, acquireTimeout);
                }
            }
            if (!connection) {
                pool.metrics.waiting++;
                throw new Error('No connection available');
            }
            connection.status = 'active';
            connection.lastUsed = Date.now();
            pool.metrics.active++;
            pool.metrics.idle--;
            const acquireTime = Date.now() - startTime;
            pool.metrics.avgAcquireTime = (pool.metrics.avgAcquireTime + acquireTime) / 2;
            structuredLogger.info('Connection acquired', {
                poolName,
                connectionId: connection.id,
                acquireTime,
                requestId: ''
            });
            return connection;
        }
        catch (error) {
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
    async releaseConnection(poolName, connectionId) {
        const pool = this.pools.get(poolName);
        if (!pool)
            return;
        const connection = pool.connections.find(c => c.id === connectionId);
        if (!connection)
            return;
        const shouldDestroy = this.shouldDestroyConnection(connection, pool.config);
        if (shouldDestroy) {
            await this.destroyConnection(poolName, connectionId);
        }
        else {
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
    async destroyConnection(poolName, connectionId) {
        const pool = this.pools.get(poolName);
        if (!pool)
            return;
        const connectionIndex = pool.connections.findIndex(c => c.id === connectionId);
        if (connectionIndex === -1)
            return;
        const connection = pool.connections[connectionIndex];
        try {
            await this.simulateConnectionDestruction(poolName);
            pool.connections.splice(connectionIndex, 1);
            pool.metrics.total--;
            pool.metrics.destroyed++;
            if (connection.status === 'active') {
                pool.metrics.active--;
            }
            else {
                pool.metrics.idle--;
            }
            structuredLogger.info('Connection destroyed', {
                poolName,
                connectionId,
                requestId: ''
            });
        }
        catch (error) {
            structuredLogger.error('Failed to destroy connection', {
                poolName,
                connectionId,
                error: error instanceof Error ? error.message : String(error),
                requestId: ''
            });
        }
    }
    startHealthChecks(poolName) {
        const pool = this.pools.get(poolName);
        if (!pool)
            return;
        const interval = setInterval(async () => {
            await this.performHealthCheck(poolName);
        }, pool.config.healthCheckInterval);
        this.healthCheckIntervals.set(poolName, interval);
    }
    async performHealthCheck(poolName) {
        const pool = this.pools.get(poolName);
        if (!pool)
            return;
        const startTime = Date.now();
        let healthyConnections = 0;
        const totalConnections = pool.connections.length;
        for (const connection of pool.connections) {
            try {
                const result = await this.checkConnectionHealth(connection);
                if (result.success) {
                    connection.healthStatus = 'healthy';
                    healthyConnections++;
                    pool.metrics.healthCheckPassed++;
                }
                else {
                    connection.healthStatus = 'unhealthy';
                    pool.metrics.healthCheckFailed++;
                }
                connection.responseTime = result.responseTime;
            }
            catch (error) {
                connection.healthStatus = 'unhealthy';
                connection.errorCount++;
                pool.metrics.healthCheckFailed++;
            }
        }
        const healthRatio = totalConnections > 0 ? healthyConnections / totalConnections : 1;
        pool.healthStatus = healthRatio >= 0.8 ? 'healthy' : healthRatio >= 0.5 ? 'degraded' : 'critical';
        pool.lastHealthCheck = Date.now();
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
    async checkConnectionHealth(connection) {
        const startTime = Date.now();
        try {
            await this.simulateHealthCheck(connection.type);
            return {
                connectionId: connection.id,
                success: true,
                responseTime: Date.now() - startTime,
                timestamp: Date.now()
            };
        }
        catch (error) {
            return {
                connectionId: connection.id,
                success: false,
                responseTime: Date.now() - startTime,
                error: error instanceof Error ? error.message : String(error),
                timestamp: Date.now()
            };
        }
    }
    loadBalance(poolName) {
        const pool = this.pools.get(poolName);
        if (!pool)
            return null;
        const strategy = pool.config.loadBalancingStrategy;
        const connections = pool.connections.filter(c => c.status === 'idle' && c.healthStatus === 'healthy');
        if (connections.length === 0)
            return null;
        let selectedConnection;
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
    startMonitoring() {
        this.isMonitoring = true;
        this.monitoringInterval = setInterval(() => {
            this.updateMetrics();
            this.cleanupIdleConnections();
        }, 30000);
        structuredLogger.info('Connection pool monitoring started', { requestId: '' });
    }
    updateMetrics() {
        for (const [poolName, pool] of this.pools) {
            this.updatePrometheusMetrics(poolName, pool);
        }
    }
    cleanupIdleConnections() {
        for (const [poolName, pool] of this.pools) {
            const now = Date.now();
            const connectionsToDestroy = [];
            for (const connection of pool.connections) {
                if (connection.status === 'idle' &&
                    now - connection.lastUsed > pool.config.idleTimeout) {
                    connectionsToDestroy.push(connection.id);
                }
            }
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
    findIdleConnection(poolName) {
        const pool = this.pools.get(poolName);
        if (!pool)
            return null;
        return pool.connections.find(c => c.status === 'idle' && c.healthStatus === 'healthy') || null;
    }
    async waitForConnection(poolName, timeout) {
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            const connection = this.findIdleConnection(poolName);
            if (connection)
                return connection;
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return null;
    }
    shouldDestroyConnection(connection, config) {
        const now = Date.now();
        const idleTime = now - connection.lastUsed;
        return connection.errorCount > config.retryAttempts ||
            idleTime > config.idleTimeout ||
            connection.healthStatus === 'unhealthy';
    }
    isCircuitBreakerOpen(poolName) {
        const breaker = this.circuitBreakers.get(poolName);
        if (!breaker)
            return false;
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
    recordCircuitBreakerFailure(poolName) {
        const breaker = this.circuitBreakers.get(poolName);
        const config = this.getPoolConfig(poolName);
        if (!breaker || !config)
            return;
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
    roundRobinSelection(poolName, connections) {
        const balancer = this.loadBalancers.get(poolName);
        if (!balancer)
            return connections[0];
        const selected = connections[balancer.index % connections.length];
        balancer.index++;
        return selected;
    }
    leastConnectionsSelection(connections) {
        return connections.reduce((min, conn) => conn.errorCount < min.errorCount ? conn : min);
    }
    weightedSelection(poolName, connections) {
        const balancer = this.loadBalancers.get(poolName);
        if (!balancer)
            return connections[0];
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
    getDefaultHost(poolName) {
        switch (poolName) {
            case 'postgres': return 'localhost';
            case 'redis': return 'localhost';
            case 'http': return 'api.external.com';
            default: return 'localhost';
        }
    }
    getDefaultPort(poolName) {
        switch (poolName) {
            case 'postgres': return 5432;
            case 'redis': return 6379;
            case 'http': return 443;
            default: return 80;
        }
    }
    getPoolConfig(poolName) {
        const pool = this.pools.get(poolName);
        return pool ? pool.config : null;
    }
    async simulateConnectionCreation(poolName) {
        const delay = poolName === 'postgres' ? 50 : poolName === 'redis' ? 20 : 30;
        await new Promise(resolve => setTimeout(resolve, delay));
    }
    async simulateConnectionDestruction(poolName) {
        const delay = poolName === 'postgres' ? 30 : poolName === 'redis' ? 10 : 20;
        await new Promise(resolve => setTimeout(resolve, delay));
    }
    async simulateHealthCheck(type) {
        const delay = type === 'postgres' ? 25 : type === 'redis' ? 15 : 20;
        await new Promise(resolve => setTimeout(resolve, delay));
    }
    updatePrometheusMetrics(poolName, pool) {
        metrics.connectionPoolSize.labels(poolName, 'total').set(pool.metrics.total);
        metrics.connectionPoolSize.labels(poolName, 'active').set(pool.metrics.active);
        metrics.connectionPoolSize.labels(poolName, 'idle').set(pool.metrics.idle);
        metrics.connectionPoolSize.labels(poolName, 'waiting').set(pool.metrics.waiting);
    }
    getStats() {
        return new Map(this.pools);
    }
    getPoolStats(poolName) {
        return this.pools.get(poolName) || null;
    }
    updatePoolConfig(poolName, config) {
        const pool = this.pools.get(poolName);
        if (!pool)
            return;
        pool.config = { ...pool.config, ...config };
        structuredLogger.info('Pool configuration updated', {
            poolName,
            config: pool.config,
            requestId: ''
        });
    }
    stop() {
        this.isMonitoring = false;
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        for (const interval of this.healthCheckIntervals.values()) {
            clearInterval(interval);
        }
        this.healthCheckIntervals.clear();
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
export const connectionPoolService = new ConnectionPoolService();
//# sourceMappingURL=connection-pool.service.js.map