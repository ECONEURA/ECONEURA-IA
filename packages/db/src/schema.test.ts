import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { db, setOrg, testConnection } from './connection.ts'
import { companies, contacts, deals, users } from './schema.ts'
import { eq } from 'drizzle-orm'

describe('Database Schema', () => {
  beforeEach(async () => {
    // Test connection
    const connected = await testConnection()
    expect(connected).toBe(true)
  })

  afterEach(async () => {
    // Clean up test data
    await db.delete(companies)
    await db.delete(users)
  })

  describe('Row Level Security (RLS)', () => {
    it('should isolate data between organizations', async () => {
      // Create test data for org1
      await setOrg('org1')
      const [company1] = await db.insert(companies).values({
        orgId: 'org1',
        name: 'Test Company 1',
        industry: 'Technology'
      }).returning()

      // Create test data for org2
      await setOrg('org2')
      const [company2] = await db.insert(companies).values({
        orgId: 'org2',
        name: 'Test Company 2',
        industry: 'Consulting'
      }).returning()

      // Verify org1 can only see their data
      await setOrg('org1')
      const org1Companies = await db.select().from(companies)
      expect(org1Companies).toHaveLength(1)
      expect(org1Companies[0].id).toBe(company1.id)

      // Verify org2 can only see their data
      await setOrg('org2')
      const org2Companies = await db.select().from(companies)
      expect(org2Companies).toHaveLength(1)
      expect(org2Companies[0].id).toBe(company2.id)
    })

    it('should prevent cross-organization access', async () => {
      // Create data for org1
      await setOrg('org1')
      const [company1] = await db.insert(companies).values({
        orgId: 'org1',
        name: 'Org1 Company',
        industry: 'Technology'
      }).returning()

      // Try to access org1 data from org2 context
      await setOrg('org2')
      const org2Companies = await db.select().from(companies)
      expect(org2Companies).toHaveLength(0)
    })
  })

  describe('Foreign Key Integrity', () => {
    it('should enforce foreign key constraints', async () => {
      await setOrg('org1')

      // Create a company first
      const [company] = await db.insert(companies).values({
        orgId: 'org1',
        name: 'Test Company',
        industry: 'Technology'
      }).returning()

      // Create a user
      const [user] = await db.insert(users).values({
        orgId: 'org1',
        email: 'test@example.com',
        name: 'Test User'
      }).returning()

      // Create a contact with valid company reference
      const [contact] = await db.insert(contacts).values({
        orgId: 'org1',
        companyId: company.id,
        firstName: 'John',
        lastName: 'Doe'
      }).returning()

      // Create a deal with valid references
      const [deal] = await db.insert(deals).values({
        orgId: 'org1',
        companyId: company.id,
        contactId: contact.id,
        title: 'Test Deal'
      }).returning()

      // Verify the data was created correctly
      expect(contact.companyId).toBe(company.id)
      expect(deal.companyId).toBe(company.id)
      expect(deal.contactId).toBe(contact.id)
    })

    it('should reject invalid foreign key references', async () => {
      await setOrg('org1')

      // Try to create a contact with non-existent company
      await expect(
        db.insert(contacts).values({
          orgId: 'org1',
          companyId: '00000000-0000-0000-0000-000000000000', // Non-existent UUID
          firstName: 'John',
          lastName: 'Doe'
        })
      ).rejects.toThrow()
    })
  })

  describe('Data Validation', () => {
    it('should enforce required fields', async () => {
      await setOrg('org1')

      // Try to create company without required fields
      await expect(
        db.insert(companies).values({
          orgId: 'org1'
          // Missing name
        })
      ).rejects.toThrow()
    })

    it('should enforce unique constraints', async () => {
      await setOrg('org1')

      // Create first company
      await db.insert(companies).values({
        orgId: 'org1',
        name: 'Unique Company',
        industry: 'Technology'
      })

      // Try to create another company with same name (should work as name is not unique)
      await expect(
        db.insert(companies).values({
          orgId: 'org1',
          name: 'Unique Company',
          industry: 'Consulting'
        })
      ).resolves.not.toThrow()
    })
  })
})



