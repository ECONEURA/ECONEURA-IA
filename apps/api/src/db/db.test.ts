import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import { db } from './connection.js';
import { runMigrations } from './migrate.js';
import { runSeeding } from './seed.js';

describe('Database Integration Tests', () => {
  let container: StartedTestContainer;

  beforeAll(async () => {
    // Start PostgreSQL container
    container = await new GenericContainer('postgres:15')
      .withEnvironment({
        POSTGRES_DB: 'econeura_test',
        POSTGRES_USER: 'postgres',
        POSTGRES_PASSWORD: 'postgres',
      })
      .withExposedPorts(5432)
      .start();

    const port = container.getMappedPort(5432);
    process.env.DATABASE_URL = `postgres://postgres:postgres@localhost:${port}/econeura_test`;

    // Run migrations
    await runMigrations();
  }, 60000); // 60s timeout for container startup

  afterAll(async () => {
    await db.close();
    if (container) {
      await container.stop();
    }
  });

  it('should connect to database and run health check', async () => {
    const health = await db.healthCheck();
    expect(health.status).toBe('ok');
    expect(health.latency_ms).toBeGreaterThan(0);
  });

  it('should have created all required tables', async () => {
    const tables = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    const tableNames = tables.rows.map(row => row.table_name);
    
    expect(tableNames).toContain('organizations');
    expect(tableNames).toContain('customers');
    expect(tableNames).toContain('invoices');
    expect(tableNames).toContain('interactions');
    expect(tableNames).toContain('audit_events');
    expect(tableNames).toContain('org_limits');
    expect(tableNames).toContain('org_usage_daily');
    expect(tableNames).toContain('idempotency_keys');
    expect(tableNames).toContain('flow_executions');
    expect(tableNames).toContain('job_queue');
    expect(tableNames).toContain('migrations');
  });

  it('should enforce org_id scoping in queries', async () => {
    // Seed test data first
    await runSeeding();
    
    // Query customers with org scoping
    const demoCustomers = await db.queryWithOrgScope(
      'org-demo',
      'SELECT COUNT(*) as count FROM customers WHERE org_id = $1',
      ['org-demo']
    );
    
    const testCustomers = await db.queryWithOrgScope(
      'org-test', 
      'SELECT COUNT(*) as count FROM customers WHERE org_id = $1',
      ['org-test']
    );
    
    expect(parseInt(demoCustomers.rows[0].count)).toBeGreaterThan(1);
    expect(parseInt(testCustomers.rows[0].count)).toBe(1);
  });

  it('should prevent tenant data leakage', async () => {
    // Try to access data from wrong org
    const result = await db.queryWithOrgScope(
      'org-test',
      'SELECT COUNT(*) as count FROM customers WHERE org_id = $1',
      ['org-demo'] // Different org than context
    );
    
    // Should return 0 because of org scoping
    expect(parseInt(result.rows[0].count)).toBe(0);
  });

  it('should handle invoice relationships correctly', async () => {
    const overdueInvoices = await db.queryWithOrgScope(
      'org-demo',
      `SELECT i.amount, c.name, c.email 
       FROM invoices i 
       JOIN customers c ON i.org_id = c.org_id AND i.customer_id = c.id 
       WHERE i.org_id = $1 AND i.status = 'overdue'
       ORDER BY i.due_date`,
      ['org-demo']
    );
    
    expect(overdueInvoices.rows.length).toBeGreaterThan(0);
    overdueInvoices.rows.forEach(invoice => {
      expect(invoice.amount).toBeGreaterThan(0);
      expect(invoice.name).toBeTruthy();
      expect(invoice.email).toContain('@');
    });
  });

  it('should support batch operations', async () => {
    const testData = [
      ['org-demo', 'batch1@test.com', 'Batch User 1'],
      ['org-demo', 'batch2@test.com', 'Batch User 2'],
      ['org-demo', 'batch3@test.com', 'Batch User 3'],
    ];
    
    await db.batchInsert(
      'customers',
      ['org_id', 'email', 'name'],
      testData,
      'org-demo'
    );
    
    const result = await db.queryWithOrgScope(
      'org-demo',
      "SELECT COUNT(*) as count FROM customers WHERE email LIKE 'batch%@test.com'",
      []
    );
    
    expect(parseInt(result.rows[0].count)).toBe(3);
  });

  it('should handle transactions correctly', async () => {
    await expect(
      db.transaction(async (client) => {
        // Insert organization
        await client.query(
          'INSERT INTO organizations (org_id, name, api_key_hash) VALUES ($1, $2, $3)',
          ['tx-test', 'Transaction Test Org', 'hash123']
        );
        
        // Insert customer 
        await client.query(
          'INSERT INTO customers (org_id, email, name) VALUES ($1, $2, $3)',
          ['tx-test', 'tx@test.com', 'Transaction User']
        );
        
        // Simulate error
        throw new Error('Rollback test');
      }, 'tx-test')
    ).rejects.toThrow('Rollback test');
    
    // Verify rollback worked
    const orgResult = await db.query(
      'SELECT COUNT(*) as count FROM organizations WHERE org_id = $1',
      ['tx-test']
    );
    
    expect(parseInt(orgResult.rows[0].count)).toBe(0);
  });

  it('should create audit event partitions', async () => {
    // Check if partition tables were created
    const partitions = await db.query(`
      SELECT schemaname, tablename 
      FROM pg_tables 
      WHERE tablename LIKE 'audit_events_%'
      ORDER BY tablename
    `);
    
    expect(partitions.rows.length).toBeGreaterThan(0);
    
    // Test inserting audit event
    await db.query(
      `INSERT INTO audit_events (org_id, route, actor, outcome, payload) 
       VALUES ($1, $2, $3, $4, $5)`,
      ['org-demo', '/api/test', 'system', 'success', JSON.stringify({ test: true })]
    );
    
    const auditCount = await db.query(
      'SELECT COUNT(*) as count FROM audit_events WHERE org_id = $1',
      ['org-demo']
    );
    
    expect(parseInt(auditCount.rows[0].count)).toBeGreaterThan(0);
  });
});