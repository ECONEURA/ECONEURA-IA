import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from '@econeura/shared'
import * as schema from './schema.ts'

// Create postgres connection
const connectionString = `postgresql://${env().PGUSER}:${env().PGPASSWORD}@${env().PGHOST}:${env().PGPORT}/${env().PGDATABASE}`

const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
})

// Create drizzle instance
export const db = drizzle(client, { schema })

// Helper function to set organization context for RLS
export async function setOrg(orgId: string): Promise<void> {
  await client`SELECT set_config('app.org_id', ${orgId}, true)`
}

// Helper function to get current organization context
export async function getCurrentOrg(): Promise<string | null> {
  const result = await client`SELECT current_setting('app.org_id', true) as org_id`
  return result[0]?.org_id || null
}

// Test connection
export async function testConnection(): Promise<boolean> {
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
  await client.end()
}



