// Database connection and utilities
export { db, setOrg, getCurrentOrg, testConnection, closeConnection } from './connection.ts'
// Exponer instancia de prisma
export { prisma } from './client';

// Schema exports
export * from './schema.ts'

// Seed function
export { seed } from './seed.ts'

// Database helpers
export async function withOrg<T>(orgId: string, fn: () => Promise<T>): Promise<T> {
  // await setOrg(orgId)
  return fn()
}

// RLS test helpers
export async function testRLSIsolation() {
  const { db, setOrg } = await import('./connection.ts')
  const { companies } = await import('./schema.ts')
  
  // Set org context for org1
  await setOrg('org1')
  const org1Companies = await db.select().from(companies)
  
  // Set org context for org2
  await setOrg('org2')
  const org2Companies = await db.select().from(companies)
  
  // Verify isolation
  return {
    org1Count: org1Companies.length,
    org2Count: org2Companies.length,
    isolated: org1Companies.length === 0 || org2Companies.length === 0
  }
}



