import { Pool, PoolClient, QueryResult } from 'pg';
import { logger } from '@econeura/shared/logging';

export class DatabaseConnection {
  private pool: Pool;
  private static instance: DatabaseConnection;

  private constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/econeura',
      max: parseInt(process.env.DB_POOL_SIZE || '20'),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      application_name: 'econeura-api',
    });

    // Handle pool errors
    this.pool.on('error', (err) => {
      logger.error('Database pool error', err);
    });

    // Log connection events in development
    if (process.env.NODE_ENV === 'development') {
      this.pool.on('connect', (client) => {
        logger.debug('Database client connected', {
          processID: client.processID,
          connectionCount: this.pool.totalCount,
        });
      });

      this.pool.on('remove', (client) => {
        logger.debug('Database client removed', {
          processID: client.processID,
          connectionCount: this.pool.totalCount,
        });
      });
    }
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async query<T = unknown>(
    text: string,
    params?: unknown[],
    orgId?: string
  ): Promise<QueryResult<T>> {
    const start = Date.now();
    let client: PoolClient | undefined;

    try {
      client = await this.pool.connect();
      
      // Set RLS context if orgId provided
      if (orgId) {
        await client.query("SELECT set_config('app.current_org_id', $1, true)", [orgId]);
      }

      const result = await client.query<T>(text, params);
      const duration = Date.now() - start;

      logger.debug('Database query executed', {
        query: text.substring(0, 100),
        duration_ms: duration,
        rows: result.rowCount,
        org_id: orgId,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - start;
      logger.error('Database query failed', error as Error, {
        query: text.substring(0, 100),
        duration_ms: duration,
        org_id: orgId,
      });
      throw error;
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  public async transaction<T>(
    callback: (client: PoolClient) => Promise<T>,
    orgId?: string
  ): Promise<T> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Set RLS context if orgId provided
      if (orgId) {
        await client.query("SELECT set_config('app.current_org_id', $1, true)", [orgId]);
      }

      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  public async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  public async close(): Promise<void> {
    await this.pool.end();
    logger.info('Database pool closed');
  }

  public getPoolStats(): { totalCount: number; idleCount: number; waitingCount: number } {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
    };
  }

  // Health check method
  public async healthCheck(): Promise<{ status: 'ok' | 'error'; latency_ms: number }> {
    const start = Date.now();
    
    try {
      await this.query('SELECT 1');
      return {
        status: 'ok',
        latency_ms: Date.now() - start,
      };
    } catch (error) {
      logger.error('Database health check failed', error as Error);
      return {
        status: 'error',
        latency_ms: Date.now() - start,
      };
    }
  }

  // Tenant isolation helper - ensures all queries are scoped to org
  public async queryWithOrgScope<T = unknown>(
    orgId: string,
    text: string,
    params?: unknown[]
  ): Promise<QueryResult<T>> {
    return this.query<T>(text, params, orgId);
  }

  // Helper for batch operations
  public async batchInsert<T>(
    table: string,
    columns: string[],
    rows: T[][],
    orgId?: string
  ): Promise<void> {
    if (rows.length === 0) return;

    const placeholders = rows
      .map((_, rowIndex) =>
        `(${columns.map((_, colIndex) => `$${rowIndex * columns.length + colIndex + 1}`).join(', ')})`
      )
      .join(', ');

    const values = rows.flat();
    const query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${placeholders}`;

    await this.query(query, values, orgId);
  }
}

// Singleton export
export const db = DatabaseConnection.getInstance();

// Type helpers for common queries
export interface OrgScopedQuery {
  orgId: string;
  query: string;
  params?: unknown[];
}

export interface PaginationParams {
  limit: number;
  offset: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  hasMore: boolean;
}

// Helper function for paginated queries
export async function queryPaginated<T>(
  orgId: string,
  baseQuery: string,
  countQuery: string,
  params: unknown[],
  pagination: PaginationParams
): Promise<PaginatedResult<T>> {
  const [dataResult, countResult] = await Promise.all([
    db.queryWithOrgScope<T>(
      orgId,
      `${baseQuery} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, pagination.limit, pagination.offset]
    ),
    db.queryWithOrgScope<{ count: string }>(orgId, countQuery, params),
  ]);

  const total = parseInt(countResult.rows[0]?.count || '0');

  return {
    data: dataResult.rows,
    total,
    hasMore: pagination.offset + dataResult.rows.length < total,
  };
}