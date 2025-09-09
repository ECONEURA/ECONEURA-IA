// ============================================================================
// ECONEURA DATABASE SERVICE
// ============================================================================
// Database connection service with connection pooling, health checks, and monitoring
// Implements hexagonal architecture with proper error handling and logging
// ============================================================================

import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool, type PoolConfig } from 'pg';
import { logger } from '@econeura/shared/utils/logger.js';
import {
  organizations,
  users,
  companies,
  contacts,
  interactions,
  products,
  invoices,
  invoiceItems,
  auditLog,
  sessions,
  apiKeys
} from './schema/index.js';

// ============================================================================
// TYPES
// ============================================================================

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  maxConnections?: number;
  minConnections?: number;
  connectionTimeout?: number;
  idleTimeout?: number;
  queryTimeout?: number;
}

export interface DatabaseHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  activeConnections: number;
  totalConnections: number;
  lastError?: string;
  timestamp: Date;
}

// ============================================================================
// DATABASE SERVICE CLASS
// ============================================================================

export class DatabaseService {
  private pool: Pool;
  private db: NodePgDatabase;
  private config: DatabaseConfig;
  private isConnected: boolean = false;
  private healthCheckInterval?: NodeJS.Timeout;

  constructor(config: DatabaseConfig) {
    this.config = config;
    this.initializePool();
    this.initializeDatabase();
    this.startHealthChecks();
  }

  // ========================================================================
  // INITIALIZATION
  // ========================================================================

  private initializePool(): void {
    const poolConfig: PoolConfig = {
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
      user: this.config.username,
      password: this.config.password,
      ssl: this.config.ssl ? { rejectUnauthorized: false } : false,
      max: this.config.maxConnections || 20,
      min: this.config.minConnections || 5,
      connectionTimeoutMillis: this.config.connectionTimeout || 10000,
      idleTimeoutMillis: this.config.idleTimeout || 30000,
      query_timeout: this.config.queryTimeout || 30000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 0,
    };

    this.pool = new Pool(poolConfig);

    // Pool event handlers
    this.pool.on('connect', (client) => {
      logger.info('Database client connected', {
        totalCount: this.pool.totalCount,
        idleCount: this.pool.idleCount,
        waitingCount: this.pool.waitingCount
      });
    });

    this.pool.on('error', (err) => {
      logger.error('Database pool error', { error: err.message, stack: err.stack });
      this.isConnected = false;
    });

    this.pool.on('remove', (client) => {
      logger.info('Database client removed', {
        totalCount: this.pool.totalCount,
        idleCount: this.pool.idleCount,
        waitingCount: this.pool.waitingCount
      });
    });
  }

  private initializeDatabase(): void {
    this.db = drizzle(this.pool, {
      schema: {
        organizations,
        users,
        companies,
        contacts,
        interactions,
        products,
        invoices,
        invoiceItems,
        auditLog,
        sessions,
        apiKeys
      },
      logger: process.env.NODE_ENV === 'development'
    });
  }

  // ========================================================================
  // CONNECTION MANAGEMENT
  // ========================================================================

  async connect(): Promise<void> {
    try {
      // Test connection
      await this.pool.query('SELECT 1');
      this.isConnected = true;
      logger.info('Database connected successfully', {
        host: this.config.host,
        port: this.config.port,
        database: this.config.database
      });
    } catch (error) {
      this.isConnected = false;
      logger.error('Database connection failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        host: this.config.host,
        port: this.config.port,
        database: this.config.database
      });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
      }

      await this.pool.end();
      this.isConnected = false;
      logger.info('Database disconnected successfully');
    } catch (error) {
      logger.error('Database disconnection error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // ========================================================================
  // HEALTH CHECKS
  // ========================================================================

  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.pool.query('SELECT 1');
        if (!this.isConnected) {
          this.isConnected = true;
          logger.info('Database health check: Connection restored');
        }
      } catch (error) {
        if (this.isConnected) {
          this.isConnected = false;
          logger.error('Database health check: Connection lost', {
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }, 30000); // Check every 30 seconds
  }

  async getHealth(): Promise<DatabaseHealth> {
    const startTime = Date.now();

    try {
      await this.pool.query('SELECT 1');
      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        responseTime,
        activeConnections: this.pool.totalCount - this.pool.idleCount,
        totalConnections: this.pool.totalCount,
        timestamp: new Date()
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      return {
        status: 'unhealthy',
        responseTime,
        activeConnections: this.pool.totalCount - this.pool.idleCount,
        totalConnections: this.pool.totalCount,
        lastError: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    }
  }

  // ========================================================================
  // DATABASE ACCESS
  // ========================================================================

  getDatabase(): NodePgDatabase {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }
    return this.db;
  }

  getPool(): Pool {
    return this.pool;
  }

  // ========================================================================
  // TRANSACTION SUPPORT
  // ========================================================================

  async withTransaction<T>(callback: (db: NodePgDatabase) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      const db = drizzle(client);
      const result = await callback(db);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // ========================================================================
  // QUERY HELPERS
  // ========================================================================

  async executeQuery<T = any>(query: string, params?: any[]): Promise<T[]> {
    try {
      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Database query error', {
        query,
        params,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async executeQueryOne<T = any>(query: string, params?: any[]): Promise<T | null> {
    const results = await this.executeQuery<T>(query, params);
    return results.length > 0 ? results[0] : null;
  }

  // ========================================================================
  // MONITORING
  // ========================================================================

  getPoolStats() {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
      isConnected: this.isConnected
    };
  }

  // ========================================================================
  // UTILITY METHODS
  // ========================================================================

  async ping(): Promise<boolean> {
    try {
      await this.pool.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  async getDatabaseInfo(): Promise<{
    version: string;
    uptime: string;
    connections: number;
    maxConnections: number;
  }> {
    const versionResult = await this.pool.query('SELECT version()');
    const uptimeResult = await this.pool.query('SELECT pg_postmaster_start_time()');
    const connectionsResult = await this.pool.query('SELECT count(*) as connections FROM pg_stat_activity');
    const maxConnectionsResult = await this.pool.query('SHOW max_connections');

    return {
      version: versionResult.rows[0].version,
      uptime: uptimeResult.rows[0].pg_postmaster_start_time,
      connections: parseInt(connectionsResult.rows[0].connections),
      maxConnections: parseInt(maxConnectionsResult.rows[0].max_connections)
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let databaseService: DatabaseService | null = null;

export function getDatabaseService(): DatabaseService {
  if (!databaseService) {
    const config: DatabaseConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'econeura_dev',
      username: process.env.DB_USER || 'econeura_user',
      password: process.env.DB_PASSWORD || 'econeura_password',
      ssl: process.env.DB_SSL === 'true',
      maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
      minConnections: parseInt(process.env.DB_MIN_CONNECTIONS || '5'),
      connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000'),
      idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
      queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT || '30000')
    };

    databaseService = new DatabaseService(config);
  }

  return databaseService;
}

export async function initializeDatabase(): Promise<DatabaseService> {
  const db = getDatabaseService();
  await db.connect();
  return db;
}

export async function shutdownDatabase(): Promise<void> {
  if (databaseService) {
    await databaseService.disconnect();
    databaseService = null;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export { DatabaseService };
export type { DatabaseConfig, DatabaseHealth };
