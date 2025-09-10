import { Database } from '../../../../packages/db/src/database';
import { MemoryEntry } from '../services/memory.service';

export interface MemoryFilter {
  tenantId: string;
  userId?: string;
  agentId?: string;
  namespace: string;
}

export class MemoryRepository {
  private db: Database;

  constructor() {
    this.db = new Database();
  }

  /**
   * Upsert memory entry (insert or update)
   */
  async upsertMemory(entry: MemoryEntry): Promise<void> {
    const query = `
      INSERT INTO memory_entries (
        id, tenant_id, user_id, agent_id, namespace, 
        vector, text, meta, created_at, updated_at, expires_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
      )
      ON CONFLICT (id) DO UPDATE SET
        vector = EXCLUDED.vector,
        text = EXCLUDED.text,
        meta = EXCLUDED.meta,
        updated_at = EXCLUDED.updated_at,
        expires_at = EXCLUDED.expires_at
    `;

    const values = [
      entry.id,
      entry.tenantId,
      entry.userId,
      entry.agentId,
      entry.namespace,
      entry.vector ? JSON.stringify(entry.vector) : null,
      entry.text,
      entry.meta ? JSON.stringify(entry.meta) : null,
      entry.createdAt,
      entry.updatedAt,
      entry.expiresAt
    ];

    await this.db.query(query, values);
  }

  /**
   * Get memory entries with filters
   */
  async getMemoryEntries(filter: MemoryFilter): Promise<MemoryEntry[]> {
    let query = `
      SELECT 
        id, tenant_id, user_id, agent_id, namespace,
        vector, text, meta, created_at, updated_at, expires_at
      FROM memory_entries
      WHERE tenant_id = $1 AND namespace = $2
    `;

    const values: any[] = [filter.tenantId, filter.namespace];
    let paramIndex = 3;

    if (filter.userId) {
      query += ` AND user_id = $${paramIndex}`;
      values.push(filter.userId);
      paramIndex++;
    }

    if (filter.agentId) {
      query += ` AND agent_id = $${paramIndex}`;
      values.push(filter.agentId);
      paramIndex++;
    }

    query += ` ORDER BY updated_at DESC`;

    const result = await this.db.query(query, values);

    return result.rows.map(row => ({
      id: row.id,
      tenantId: row.tenant_id,
      userId: row.user_id,
      agentId: row.agent_id,
      namespace: row.namespace,
      vector: row.vector ? JSON.parse(row.vector) : undefined,
      text: row.text,
      meta: row.meta ? JSON.parse(row.meta) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      expiresAt: row.expires_at ? new Date(row.expires_at) : undefined
    }));
  }

  /**
   * Get memory entry by ID
   */
  async getMemoryById(id: string): Promise<MemoryEntry | null> {
    const query = `
      SELECT 
        id, tenant_id, user_id, agent_id, namespace,
        vector, text, meta, created_at, updated_at, expires_at
      FROM memory_entries
      WHERE id = $1
    `;

    const result = await this.db.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      tenantId: row.tenant_id,
      userId: row.user_id,
      agentId: row.agent_id,
      namespace: row.namespace,
      vector: row.vector ? JSON.parse(row.vector) : undefined,
      text: row.text,
      meta: row.meta ? JSON.parse(row.meta) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      expiresAt: row.expires_at ? new Date(row.expires_at) : undefined
    };
  }

  /**
   * Delete memory entry by ID
   */
  async deleteMemory(id: string): Promise<boolean> {
    const query = `DELETE FROM memory_entries WHERE id = $1`;
    const result = await this.db.query(query, [id]);
    return result.rowCount > 0;
  }

  /**
   * Delete expired memory entries
   */
  async deleteExpiredEntries(): Promise<number> {
    const query = `
      DELETE FROM memory_entries 
      WHERE expires_at IS NOT NULL AND expires_at < NOW()
    `;
    const result = await this.db.query(query);
    return result.rowCount || 0;
  }

  /**
   * Get memory statistics by tenant
   */
  async getMemoryStats(tenantId: string): Promise<{
    totalEntries: number;
    totalNamespaces: number;
    expiredEntries: number;
  }> {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_entries,
        COUNT(DISTINCT namespace) as total_namespaces,
        COUNT(CASE WHEN expires_at IS NOT NULL AND expires_at < NOW() THEN 1 END) as expired_entries
      FROM memory_entries
      WHERE tenant_id = $1
    `;

    const result = await this.db.query(statsQuery, [tenantId]);
    const row = result.rows[0];

    return {
      totalEntries: parseInt(row.total_entries),
      totalNamespaces: parseInt(row.total_namespaces),
      expiredEntries: parseInt(row.expired_entries)
    };
  }

  /**
   * Create memory entries table (migration)
   */
  async createTable(): Promise<void> {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS memory_entries (
        id VARCHAR(255) PRIMARY KEY,
        tenant_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        agent_id VARCHAR(255) NOT NULL,
        namespace VARCHAR(255) NOT NULL,
        vector JSONB,
        text TEXT,
        meta JSONB,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE,
        
        -- Indexes for performance
        INDEX idx_memory_tenant_namespace (tenant_id, namespace),
        INDEX idx_memory_user_agent (user_id, agent_id),
        INDEX idx_memory_expires_at (expires_at),
        INDEX idx_memory_updated_at (updated_at)
      )
    `;

    await this.db.query(createTableQuery);
  }
}
