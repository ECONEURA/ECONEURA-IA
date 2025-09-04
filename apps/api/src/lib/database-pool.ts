// Database Connection Pooling and Optimization for ECONEURA
import { structuredLogger } from './structured-logger.js';
import { ErrorHandler } from './error-handler.js';

export interface PoolConfig {
  min: number;
  max: number;
  acquireTimeoutMillis: number;
  createTimeoutMillis: number;
  destroyTimeoutMillis: number;
  idleTimeoutMillis: number;
  reapIntervalMillis: number;
  createRetryIntervalMillis: number;
  propagateCreateError: boolean;
}

export interface QueryOptions {
  timeout?: number;
  retries?: number;
  cache?: boolean;
  cacheTtl?: number;
  transaction?: boolean;
  isolationLevel?: 'READ_UNCOMMITTED' | 'READ_COMMITTED' | 'REPEATABLE_READ' | 'SERIALIZABLE';
}

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
  fields: Array<{ name: string; type: string }>;
  duration: number;
  cached: boolean;
}

export interface Transaction {
  id: string;
  startTime: Date;
  queries: Array<{ sql: string; params: any[]; duration: number }>;
  rollback: () => Promise<void>;
  commit: () => Promise<void>;
}

export class DatabasePool {
  private static instance: DatabasePool;
  private connections: any[] = [];
  private availableConnections: any[] = [];
  private config: PoolConfig;
  private stats: {
    totalConnections: number;
    activeConnections: number;
    idleConnections: number;
    totalQueries: number;
    failedQueries: number;
    averageQueryTime: number;
    cacheHits: number;
    cacheMisses: number;
  };

  constructor(config: Partial<PoolConfig> = {}) {
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

  static getInstance(config?: Partial<PoolConfig>): DatabasePool {
    if (!DatabasePool.instance) {
      DatabasePool.instance = new DatabasePool(config);
    }
    return DatabasePool.instance;
  }

  private async initializePool(): Promise<void> {
    try {
      // Create minimum connections
      for (let i = 0; i < this.config.min; i++) {
        await this.createConnection();
      }

      structuredLogger.info('Database pool initialized', {
        operation: 'database_pool',
        minConnections: this.config.min,
        maxConnections: this.config.max
      });
    } catch (error) {
      structuredLogger.error('Failed to initialize database pool', error as Error, {
        operation: 'database_pool'
      });
      throw error;
    }
  }

  private async createConnection(): Promise<any> {
    try {
      // Simulate database connection creation
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
    } catch (error) {
      structuredLogger.error('Failed to create database connection', error as Error, {
        operation: 'database_connection'
      });
      throw error;
    }
  }

  private async acquireConnection(): Promise<any> {
    // Try to get an available connection
    if (this.availableConnections.length > 0) {
      const connection = this.availableConnections.pop()!;
      connection.isActive = true;
      connection.lastUsed = new Date();
      this.stats.activeConnections++;
      this.stats.idleConnections--;
      return connection;
    }

    // Create new connection if under max limit
    if (this.connections.length < this.config.max) {
      const connection = await this.createConnection();
      connection.isActive = true;
      this.stats.activeConnections++;
      this.stats.idleConnections--;
      return connection;
    }

    // Wait for a connection to become available
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection acquisition timeout'));
      }, this.config.acquireTimeoutMillis);

      const checkForConnection = () => {
        if (this.availableConnections.length > 0) {
          clearTimeout(timeout);
          const connection = this.availableConnections.pop()!;
          connection.isActive = true;
          connection.lastUsed = new Date();
          this.stats.activeConnections++;
          this.stats.idleConnections--;
          resolve(connection);
        } else {
          setTimeout(checkForConnection, 100);
        }
      };

      checkForConnection();
    });
  }

  private releaseConnection(connection: any): void {
    connection.isActive = false;
    connection.lastUsed = new Date();
    this.availableConnections.push(connection);
    this.stats.activeConnections--;
    this.stats.idleConnections++;
  }

  private startMaintenance(): void {
    // Cleanup idle connections
    setInterval(() => {
      this.cleanupIdleConnections();
    }, this.config.reapIntervalMillis);
  }

  private cleanupIdleConnections(): void {
    const now = Date.now();
    const connectionsToRemove: any[] = [];

    for (let i = this.availableConnections.length - 1; i >= 0; i--) {
      const connection = this.availableConnections[i];
      const idleTime = now - connection.lastUsed.getTime();

      if (idleTime > this.config.idleTimeoutMillis && this.connections.length > this.config.min) {
        connectionsToRemove.push(connection);
        this.availableConnections.splice(i, 1);
      }
    }

    // Remove connections
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

  async query<T = any>(
    sql: string,
    params: any[] = [],
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    const startTime = Date.now();
    let connection: any = null;

    try {
      connection = await this.acquireConnection();
      
      // Simulate query execution
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 10));
      
      const duration = Date.now() - startTime;
      connection.queryCount++;

      // Update stats
      this.stats.totalQueries++;
      this.stats.averageQueryTime = 
        (this.stats.averageQueryTime * (this.stats.totalQueries - 1) + duration) / this.stats.totalQueries;

      // Simulate query result
      const result: QueryResult<T> = {
        rows: [] as T[],
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
    } catch (error) {
      this.stats.failedQueries++;
      structuredLogger.error('Database query failed', error as Error, {
        operation: 'database_query',
        sql: sql.substring(0, 100),
        params: params.length,
        connectionId: connection?.id
      });
      throw error;
    } finally {
      if (connection) {
        this.releaseConnection(connection);
      }
    }
  }

  async transaction<T>(
    callback: (tx: Transaction) => Promise<T>
  ): Promise<T> {
    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = new Date();
    const queries: Array<{ sql: string; params: any[]; duration: number }> = [];

    const transaction: Transaction = {
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
    } catch (error) {
      await transaction.rollback();
      structuredLogger.error('Transaction failed', error as Error, {
        operation: 'database_transaction',
        transactionId
      });
      throw error;
    }
  }

  async batch<T = any>(
    queries: Array<{ sql: string; params: any[] }>,
    options: QueryOptions = {}
  ): Promise<QueryResult<T>[]> {
    const results: QueryResult<T>[] = [];
    
    for (const query of queries) {
      const result = await this.query<T>(query.sql, query.params, options);
      results.push(result);
    }

    return results;
  }

  // Prepared statements
  private preparedStatements: Map<string, { sql: string; params: any[] }> = new Map();

  prepare(name: string, sql: string): void {
    this.preparedStatements.set(name, { sql, params: [] });
    structuredLogger.debug('Prepared statement created', {
      operation: 'database_prepare',
      statementName: name,
      sql: sql.substring(0, 100)
    });
  }

  async executePrepared<T = any>(
    name: string,
    params: any[] = [],
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    const prepared = this.preparedStatements.get(name);
    if (!prepared) {
      throw new Error(`Prepared statement '${name}' not found`);
    }

    return this.query<T>(prepared.sql, params, options);
  }

  // Connection health check
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy' | 'degraded';
    connections: {
      total: number;
      active: number;
      idle: number;
      max: number;
    };
    performance: {
      totalQueries: number;
      failedQueries: number;
      averageQueryTime: number;
      errorRate: number;
    };
  }> {
    const errorRate = this.stats.totalQueries > 0 
      ? (this.stats.failedQueries / this.stats.totalQueries) * 100 
      : 0;

    let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    if (errorRate > 10) {
      status = 'unhealthy';
    } else if (errorRate > 5 || this.stats.averageQueryTime > 1000) {
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

  // Pool statistics
  getStats() {
    return { ...this.stats };
  }

  // Pool configuration
  getConfig() {
    return { ...this.config };
  }

  // Update pool configuration
  updateConfig(newConfig: Partial<PoolConfig>): void {
    this.config = { ...this.config, ...newConfig };
    structuredLogger.info('Database pool configuration updated', {
      operation: 'database_pool_config',
      config: this.config
    });
  }

  // Close all connections
  async close(): Promise<void> {
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

// Query builder for type-safe queries
export class QueryBuilder {
  private sql: string = '';
  private params: any[] = [];
  private table: string = '';
  private conditions: string[] = [];
  private joins: string[] = [];
  private orderBy: string[] = [];
  private groupBy: string[] = [];
  private having: string[] = [];
  private limitValue?: number;
  private offsetValue?: number;

  select(columns: string | string[]): QueryBuilder {
    const cols = Array.isArray(columns) ? columns.join(', ') : columns;
    this.sql = `SELECT ${cols}`;
    return this;
  }

  from(table: string): QueryBuilder {
    this.table = table;
    this.sql += ` FROM ${table}`;
    return this;
  }

  where(condition: string, ...params: any[]): QueryBuilder {
    this.conditions.push(condition);
    this.params.push(...params);
    return this;
  }

  join(table: string, condition: string): QueryBuilder {
    this.joins.push(`JOIN ${table} ON ${condition}`);
    return this;
  }

  leftJoin(table: string, condition: string): QueryBuilder {
    this.joins.push(`LEFT JOIN ${table} ON ${condition}`);
    return this;
  }

  rightJoin(table: string, condition: string): QueryBuilder {
    this.joins.push(`RIGHT JOIN ${table} ON ${condition}`);
    return this;
  }

  orderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC'): QueryBuilder {
    this.orderBy.push(`${column} ${direction}`);
    return this;
  }

  groupBy(column: string): QueryBuilder {
    this.groupBy.push(column);
    return this;
  }

  having(condition: string, ...params: any[]): QueryBuilder {
    this.having.push(condition);
    this.params.push(...params);
    return this;
  }

  limit(count: number): QueryBuilder {
    this.limitValue = count;
    return this;
  }

  offset(count: number): QueryBuilder {
    this.offsetValue = count;
    return this;
  }

  build(): { sql: string; params: any[] } {
    let query = this.sql;

    // Add joins
    if (this.joins.length > 0) {
      query += ' ' + this.joins.join(' ');
    }

    // Add conditions
    if (this.conditions.length > 0) {
      query += ' WHERE ' + this.conditions.join(' AND ');
    }

    // Add group by
    if (this.groupBy.length > 0) {
      query += ' GROUP BY ' + this.groupBy.join(', ');
    }

    // Add having
    if (this.having.length > 0) {
      query += ' HAVING ' + this.having.join(' AND ');
    }

    // Add order by
    if (this.orderBy.length > 0) {
      query += ' ORDER BY ' + this.orderBy.join(', ');
    }

    // Add limit
    if (this.limitValue !== undefined) {
      query += ` LIMIT ${this.limitValue}`;
    }

    // Add offset
    if (this.offsetValue !== undefined) {
      query += ` OFFSET ${this.offsetValue}`;
    }

    return { sql: query, params: this.params };
  }
}

export const databasePool = DatabasePool.getInstance();
