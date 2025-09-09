import { Pool } from 'pg';

// Database connection
const pgPool = new Pool({
  connectionString: process.env.MEM_PG_URL || 'postgres://localhost:5432/econeura_mem'
});

// Run status interface
export interface AgentRun {
  run_id: string;
  tenant_id: string;
  dept: string;
  agent_key: string;
  status: string;
  progress?: number;
  summary?: string;
  created_at?: Date;
  updated_at?: Date;
}

// Upsert agent run
export async function upsertRun(run: Partial<AgentRun>): Promise<void> {
  try {
    await pgPool.query(`
      INSERT INTO agent_runs (run_id, tenant_id, dept, agent_key, status, progress, summary)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (run_id)
      DO UPDATE SET 
        status = EXCLUDED.status,
        progress = EXCLUDED.progress,
        summary = EXCLUDED.summary,
        updated_at = now()
    `, [
      run.run_id,
      run.tenant_id,
      run.dept,
      run.agent_key,
      run.status,
      run.progress || 0,
      run.summary
    ]);
  } catch (error) {
    console.error('❌ Error upserting run:', error);
    throw error;
  }
}

// Get agent run by ID
export async function getRun(runId: string): Promise<AgentRun | null> {
  try {
    const result = await pgPool.query(`
      SELECT * FROM agent_runs WHERE run_id = $1
    `, [runId]);
    
    return result.rows[0] || null;
  } catch (error) {
    console.error('❌ Error getting run:', error);
    return null;
  }
}

// Get runs by tenant and department
export async function getRunsByTenant(tenantId: string, dept?: string, limit: number = 50): Promise<AgentRun[]> {
  try {
    let query = `
      SELECT * FROM agent_runs 
      WHERE tenant_id = $1
    `;
    const params: any[] = [tenantId];
    
    if (dept) {
      query += ` AND dept = $2`;
      params.push(dept);
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);
    
    const result = await pgPool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('❌ Error getting runs by tenant:', error);
    return [];
  }
}

// Check if idempotency key has been seen
export async function seen(idempotencyKey: string): Promise<boolean> {
  try {
    const result = await pgPool.query(`
      SELECT 1 FROM idempotency_cache 
      WHERE idempotency_key = $1 AND expires_at > now()
    `, [idempotencyKey]);
    
    return result.rows.length > 0;
  } catch (error) {
    console.error('❌ Error checking idempotency:', error);
    return false;
  }
}

// Mark idempotency key as seen
export async function markSeen(idempotencyKey: string): Promise<void> {
  try {
    await pgPool.query(`
      INSERT INTO idempotency_cache (idempotency_key)
      VALUES ($1)
      ON CONFLICT (idempotency_key) DO NOTHING
    `, [idempotencyKey]);
  } catch (error) {
    console.error('❌ Error marking idempotency as seen:', error);
  }
}

// Get run statistics
export async function getRunStats(tenantId: string, dept?: string): Promise<{
  total: number;
  running: number;
  completed: number;
  failed: number;
  hitl: number;
}> {
  try {
    let query = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'RUNNING') as running,
        COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed,
        COUNT(*) FILTER (WHERE status = 'FAILED') as failed,
        COUNT(*) FILTER (WHERE status = 'HITL') as hitl
      FROM agent_runs 
      WHERE tenant_id = $1
    `;
    const params: any[] = [tenantId];
    
    if (dept) {
      query += ` AND dept = $2`;
      params.push(dept);
    }
    
    const result = await pgPool.query(query, params);
    const row = result.rows[0];
    
    return {
      total: parseInt(row.total) || 0,
      running: parseInt(row.running) || 0,
      completed: parseInt(row.completed) || 0,
      failed: parseInt(row.failed) || 0,
      hitl: parseInt(row.hitl) || 0
    };
  } catch (error) {
    console.error('❌ Error getting run stats:', error);
    return {
      total: 0,
      running: 0,
      completed: 0,
      failed: 0,
      hitl: 0
    };
  }
}

