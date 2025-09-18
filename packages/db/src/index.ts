// Database connection and utilities
export { db, setOrg, getCurrentOrg, testConnection, closeConnection } from './connection.js'
// Exponer instancia de prisma
export { prisma, getPrisma, initPrisma } from './client.js';

// Schema exports
export * from './schema.js'

// Seed function
export { seed } from './seed.js'

// Database helpers
export async function withOrg<T>(orgId: string, fn: () => Promise<T>): Promise<T> {
  // await setOrg(orgId)
  return fn()
}

// RLS test helpers
export async function testRLSIsolation() {
  const { db, setOrg } = await import('./connection')
  const { companies } = await import('./schema')

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



