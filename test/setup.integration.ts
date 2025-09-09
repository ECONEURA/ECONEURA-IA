import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { db } from '@econeura/db'

// Global setup for integration tests
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test'

  // Initialize database connection
  await db.connect()

  // Run migrations
  await db.migrate()

  console.log('✅ Integration test setup completed');
})

afterAll(async () => {
  // Clean up database connection
  await db.close()

  console.log('✅ Integration test teardown completed');
})

beforeEach(async () => {
  // Clean database before each test
  await db.seed()
})

afterEach(async () => {
  // Clean up after each test
  // This is handled by the database transaction rollback
})

// Global test utilities
export const testUtils = {
  // Helper to create test data
  async createTestOrg(orgId: string = 'test-org') {
    // Implementation for creating test organization
  },

  // Helper to clean test data
  async cleanTestData() {
    // Implementation for cleaning test data
  },

  // Helper to get test database connection
  getDb() {
    return db;
  },
}
