import { structuredLogger } from './structured-logger.js';
export class DatabasePool {
    static instance;
    connections = [];
    availableConnections = [];
    config;
    stats;
    constructor(config = {}) {
        this.config = {
            min: config.min || 2,
            max: config.max || 10,
            acquireTimeoutMillis: config.acquireTimeoutMillis || 30000,
            createTimeoutMillis: config.createTimeoutMillis || 30000,
            destroyTimeoutMillis: config.destroyTimeoutMillis || 5000,
            idleTimeoutMillis: config.idleTimeoutMillis || 30000,
            reapIntervalMillis: config.reapIntervalMillis || 1000,
            createRetryIntervalMillis: config.createRetryIntervalMillis || 200,
            propagateCreateError: config.propagateCreateError || false
        };
        this.stats = {
            totalConnections: 0,
            activeConnections: 0,
            idleConnections: 0,
            totalQueries: 0,
            failedQueries: 0,
            averageQueryTime: 0,
            cacheHits: 0,
            cacheMisses: 0
        };
        this.initializePool();
        this.startMaintenance();
    }
    static getInstance(config) {
        if (!DatabasePool.instance) {
            DatabasePool.instance = new DatabasePool(config);
        }
        return DatabasePool.instance;
    }
    async initializePool() {
        try {
            for (let i = 0; i < this.config.min; i++) {
                await this.createConnection();
            }
            structuredLogger.info('Database pool initialized', {
                operation: 'database_pool',
                minConnections: this.config.min,
                maxConnections: this.config.max
            });
        }
        catch (error) {
            structuredLogger.error('Failed to initialize database pool', error, {
                operation: 'database_pool'
            });
            throw error;
        }
    }
    async createConnection() {
        try {
            const connection = {
                id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                createdAt: new Date(),
                lastUsed: new Date(),
                isActive: false,
                queryCount: 0
            };
            this.connections.push(connection);
            this.availableConnections.push(connection);
            this.stats.totalConnections++;
            this.stats.idleConnections++;
            structuredLogger.debug('Database connection created', {
                operation: 'database_connection',
                connectionId: connection.id,
                totalConnections: this.stats.totalConnections
            });
            return connection;
        }
        catch (error) {
            structuredLogger.error('Failed to create database connection', error, {
                operation: 'database_connection'
            });
            throw error;
        }
    }
    async acquireConnection() {
        if (this.availableConnections.length > 0) {
            const connection = this.availableConnections.pop();
            connection.isActive = true;
            connection.lastUsed = new Date();
            this.stats.activeConnections++;
            this.stats.idleConnections--;
            return connection;
        }
        if (this.connections.length < this.config.max) {
            const connection = await this.createConnection();
            connection.isActive = true;
            this.stats.activeConnections++;
            this.stats.idleConnections--;
            return connection;
        }
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Connection acquisition timeout'));
            }, this.config.acquireTimeoutMillis);
            const checkForConnection = () => {
                if (this.availableConnections.length > 0) {
                    clearTimeout(timeout);
                    const connection = this.availableConnections.pop();
                    connection.isActive = true;
                    connection.lastUsed = new Date();
                    this.stats.activeConnections++;
                    this.stats.idleConnections--;
                    resolve(connection);
                }
                else {
                    setTimeout(checkForConnection, 100);
                }
            };
            checkForConnection();
        });
    }
    releaseConnection(connection) {
        connection.isActive = false;
        connection.lastUsed = new Date();
        this.availableConnections.push(connection);
        this.stats.activeConnections--;
        this.stats.idleConnections++;
    }
    startMaintenance() {
        setInterval(() => {
            this.cleanupIdleConnections();
        }, this.config.reapIntervalMillis);
    }
    cleanupIdleConnections() {
        const now = Date.now();
        const connectionsToRemove = [];
        for (let i = this.availableConnections.length - 1; i >= 0; i--) {
            const connection = this.availableConnections[i];
            const idleTime = now - connection.lastUsed.getTime();
            if (idleTime > this.config.idleTimeoutMillis && this.connections.length > this.config.min) {
                connectionsToRemove.push(connection);
                this.availableConnections.splice(i, 1);
            }
        }
        connectionsToRemove.forEach(connection => {
            const index = this.connections.indexOf(connection);
            if (index > -1) {
                this.connections.splice(index, 1);
                this.stats.totalConnections--;
                this.stats.idleConnections--;
            }
        });
        if (connectionsToRemove.length > 0) {
            structuredLogger.debug('Cleaned up idle connections', {
                operation: 'database_cleanup',
                removedConnections: connectionsToRemove.length,
                remainingConnections: this.connections.length
            });
        }
    }
    async query(sql, params = [], options = {}) {
        const startTime = Date.now();
        let connection = null;
        try {
            connection = await this.acquireConnection();
            await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 10));
            const duration = Date.now() - startTime;
            connection.queryCount++;
            this.stats.totalQueries++;
            this.stats.averageQueryTime =
                (this.stats.averageQueryTime * (this.stats.totalQueries - 1) + duration) / this.stats.totalQueries;
            const result = {
                rows: [],
                rowCount: 0,
                fields: [],
                duration,
                cached: false
            };
            structuredLogger.database('SELECT', 'simulated_table', duration, {
                sql: sql.substring(0, 100),
                params: params.length,
                connectionId: connection.id
            });
            return result;
        }
        catch (error) {
            this.stats.failedQueries++;
            structuredLogger.error('Database query failed', error, {
                operation: 'database_query',
                sql: sql.substring(0, 100),
                params: params.length,
                connectionId: connection?.id
            });
            throw error;
        }
        finally {
            if (connection) {
                this.releaseConnection(connection);
            }
        }
    }
    async transaction(callback) {
        const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const startTime = new Date();
        const queries = [];
        const transaction = {
            id: transactionId,
            startTime,
            queries,
            rollback: async () => {
                structuredLogger.info('Transaction rolled back', {
                    operation: 'database_transaction',
                    transactionId,
                    queries: queries.length
                });
            },
            commit: async () => {
                structuredLogger.info('Transaction committed', {
                    operation: 'database_transaction',
                    transactionId,
                    queries: queries.length,
                    duration: Date.now() - startTime.getTime()
                });
            }
        };
        try {
            structuredLogger.info('Transaction started', {
                operation: 'database_transaction',
                transactionId
            });
            const result = await callback(transaction);
            await transaction.commit();
            return result;
        }
        catch (error) {
            await transaction.rollback();
            structuredLogger.error('Transaction failed', error, {
                operation: 'database_transaction',
                transactionId
            });
            throw error;
        }
    }
    async batch(queries, options = {}) {
        const results = [];
        for (const query of queries) {
            const result = await this.query(query.sql, query.params, options);
            results.push(result);
        }
        return results;
    }
    preparedStatements = new Map();
    prepare(name, sql) {
        this.preparedStatements.set(name, { sql, params: [] });
        structuredLogger.debug('Prepared statement created', {
            operation: 'database_prepare',
            statementName: name,
            sql: sql.substring(0, 100)
        });
    }
    async executePrepared(name, params = [], options = {}) {
        const prepared = this.preparedStatements.get(name);
        if (!prepared) {
            throw new Error(`Prepared statement '${name}' not found`);
        }
        return this.query(prepared.sql, params, options);
    }
    async healthCheck() {
        const errorRate = this.stats.totalQueries > 0
            ? (this.stats.failedQueries / this.stats.totalQueries) * 100
            : 0;
        let status = 'healthy';
        if (errorRate > 10) {
            status = 'unhealthy';
        }
        else if (errorRate > 5 || this.stats.averageQueryTime > 1000) {
            status = 'degraded';
        }
        return {
            status,
            connections: {
                total: this.stats.totalConnections,
                active: this.stats.activeConnections,
                idle: this.stats.idleConnections,
                max: this.config.max
            },
            performance: {
                totalQueries: this.stats.totalQueries,
                failedQueries: this.stats.failedQueries,
                averageQueryTime: this.stats.averageQueryTime,
                errorRate
            }
        };
    }
    getStats() {
        return { ...this.stats };
    }
    getConfig() {
        return { ...this.config };
    }
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        structuredLogger.info('Database pool configuration updated', {
            operation: 'database_pool_config',
            config: this.config
        });
    }
    async close() {
        structuredLogger.info('Closing database pool', {
            operation: 'database_pool_close',
            totalConnections: this.connections.length
        });
        this.connections = [];
        this.availableConnections = [];
        this.stats = {
            totalConnections: 0,
            activeConnections: 0,
            idleConnections: 0,
            totalQueries: 0,
            failedQueries: 0,
            averageQueryTime: 0,
            cacheHits: 0,
            cacheMisses: 0
        };
    }
}
export class QueryBuilder {
    sql = '';
    params = [];
    table = '';
    conditions = [];
    joins = [];
    orderByClauses = [];
    groupByClauses = [];
    havingClauses = [];
    limitValue;
    offsetValue;
    select(columns) {
        const cols = Array.isArray(columns) ? columns.join(', ') : columns;
        this.sql = `SELECT ${cols}`;
        return this;
    }
    from(table) {
        this.table = table;
        this.sql += ` FROM ${table}`;
        return this;
    }
    where(condition, ...params) {
        this.conditions.push(condition);
        this.params.push(...params);
        return this;
    }
    join(table, condition) {
        this.joins.push(`JOIN ${table} ON ${condition}`);
        return this;
    }
    leftJoin(table, condition) {
        this.joins.push(`LEFT JOIN ${table} ON ${condition}`);
        return this;
    }
    rightJoin(table, condition) {
        this.joins.push(`RIGHT JOIN ${table} ON ${condition}`);
        return this;
    }
    orderBy(column, direction = 'ASC') {
        this.orderByClauses.push(`${column} ${direction}`);
        return this;
    }
    groupBy(column) {
        this.groupByClauses.push(column);
        return this;
    }
    having(condition, ...params) {
        this.havingClauses.push(condition);
        this.params.push(...params);
        return this;
    }
    limit(count) {
        this.limitValue = count;
        return this;
    }
    offset(count) {
        this.offsetValue = count;
        return this;
    }
    build() {
        let query = this.sql;
        if (this.joins.length > 0) {
            query += ' ' + this.joins.join(' ');
        }
        if (this.conditions.length > 0) {
            query += ' WHERE ' + this.conditions.join(' AND ');
        }
        if (this.groupByClauses.length > 0) {
            query += ' GROUP BY ' + this.groupByClauses.join(', ');
        }
        if (this.havingClauses.length > 0) {
            query += ' HAVING ' + this.havingClauses.join(' AND ');
        }
        if (this.orderByClauses.length > 0) {
            query += ' ORDER BY ' + this.orderByClauses.join(', ');
        }
        if (this.limitValue !== undefined) {
            query += ` LIMIT ${this.limitValue}`;
        }
        if (this.offsetValue !== undefined) {
            query += ` OFFSET ${this.offsetValue}`;
        }
        return { sql: query, params: this.params };
    }
}
export const databasePool = DatabasePool.getInstance();
//# sourceMappingURL=database-pool.js.map