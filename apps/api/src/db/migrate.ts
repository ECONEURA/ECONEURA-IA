#!/usr/bin/env tsx

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './connection.js';
import { logger } from '@econeura/shared/logging';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Migration {
  version: number;
  name: string;
  sql: string;
  applied_at?: Date;
}

async function createMigrationsTable(): Promise<void> {
  await db.query.`
    CREATE TABLE IF NOT EXISTS migrations (
      version INTEGER PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      sql TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getAppliedMigrations(): Promise<number[]> {
  const result = await db.query<{ version: number }>('SELECT version FROM migrations ORDER BY version');
  return result.rows.map(row => row.version);
}

async function applyMigration(migration: Migration): Promise<void> {
  logger.info(`Applying migration ${migration.version}: ${migration.name}`);
  
  await db.transaction(async (client) => {
    // Apply the migration
    await client.query(migration.sql);
    
    // Record it as applied
    await client.query(
      'INSERT INTO migrations (version, name, sql) VALUES ($1, $2, $3)',
      [migration.version, migration.name, migration.sql]
    );
  });
  
  logger.info(`Migration ${migration.version} applied successfully`);
}

async function loadSchemaMigration(): Promise<Migration> {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = await fs.readFile(schemaPath, 'utf-8');
  
  return {
    version: 1,
    name: 'Initial schema setup',
    sql: sql,
  };
}

async function runMigrations(): Promise<void> {
  try {
    logger.info('Starting database migrations');
    
    // Ensure migrations table exists
    await createMigrationsTable();
    
    // Get list of applied migrations
    const appliedVersions = await getAppliedMigrations();
    logger.info(`Found ${appliedVersions.length} applied migrations: ${appliedVersions.join(', ')}`);
    
    // Load available migrations
    const migrations: Migration[] = [
      await loadSchemaMigration(),
    ];
    
    // Apply pending migrations
    let appliedCount = 0;
    for (const migration of migrations) {
      if (!appliedVersions.includes(migration.version)) {
        await applyMigration(migration);
        appliedCount++;
      } else {
        logger.debug(`Migration ${migration.version} already applied, skipping`);
      }
    }
    
    if (appliedCount === 0) {
      logger.info('No pending migrations to apply');
    } else {
      logger.info(`Successfully applied ${appliedCount} migrations`);
    }
    
    // Verify database health
    const health = await db.healthCheck();
    if (health.status === 'ok') {
      logger.info(`Database ready (latency: ${health.latency_ms}ms)`);
    } else {
      throw new Error('Database health check failed after migrations');
    }
    
  } catch (error) {
    logger.error('Migration failed', error as Error);
    throw error;
  }
}

// Allow running as script
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
    .then(() => {
      logger.info('Migrations completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Migrations failed', error);
      process.exit(1);
    });
}

export { runMigrations };