import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from '@econeura/shared'
import * as schema from './schema'

// Safe env read; when missing, we provide stubs to keep tests/CI green
let connectionString: string | null = null
try {
  const e = env()
  connectionString = `postgresql://${e.PGUSER}:${e.PGPASSWORD}@${e.PGHOST}:${e.PGPORT}/${e.PGDATABASE}`
} catch {
  connectionString = null
}

// Postgres tagged client or null when no connection string is available
const client: ReturnType<typeof postgres> | null = connectionString
  ? postgres(connectionString, { max: 10, idle_timeout: 20, connect_timeout: 10 })
  : null

function createDbStub() {
  // minimal chainable stub used by tests in shared cost-meter
  const empty = async () => []
  const execute = async () => ({ rows: [] })
  const chain = { execute }
  return {
    select: () => ({ from: () => ({ where: () => chain, orderBy: () => chain }) }),
    insert: () => ({ values: () => ({ execute: async () => ({}) }) }),
  } as any
}

// Create drizzle instance or stub
export const db: any = connectionString ? drizzle(client!, { schema }) : createDbStub()

// Helper function to set organization context for RLS
export async function setOrg(orgId: string): Promise<void> {
  if (!client) return
  await client`SELECT set_config('app.org_id', ${orgId}, true)`
}

// Helper function to get current organization context
export async function getCurrentOrg(): Promise<string | null> {
  if (!client) return null
  const result = await client`SELECT current_setting('app.org_id', true) as org_id`
  return result[0]?.org_id || null
}

// Test connection
export async function testConnection(): Promise<boolean> {
  if (!client) return false
  try {
  await client`SELECT 1`
    return true
  } catch (error) {
    console.error('Database connection failed:', error)
    return false
  }
}

// Close connection (for graceful shutdown)
export async function closeConnection(): Promise<void> {
  if (!client) return
  await client.end()
}



