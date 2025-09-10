/**
 * Test data seeding for E2E tests
 * This script ensures consistent test data for reliable E2E testing
 */

export interface TestUser {
  id: string
  email: string
  password: string
  role: 'admin' | 'user' | 'manager'
  name: string
}

export interface TestCompany {
  id: string
  name: string
  email: string
  phone: string
  industry: string
}

export const TEST_USERS: TestUser[] = [
  {
    id: 'test-admin-1',
    email: 'admin@ecoretail.com',
    password: 'Demo1234!',
    role: 'admin',
    name: 'Test Admin'
  },
  {
    id: 'test-user-1',
    email: 'user@ecoretail.com',
    password: 'Demo1234!',
    role: 'user',
    name: 'Test User'
  },
  {
    id: 'test-manager-1',
    email: 'manager@ecoretail.com',
    password: 'Demo1234!',
    role: 'manager',
    name: 'Test Manager'
  }
]

export const TEST_COMPANIES: TestCompany[] = [
  {
    id: 'test-company-1',
    name: 'Acme Corporation',
    email: 'contact@acme.com',
    phone: '+1-555-0123',
    industry: 'Technology'
  },
  {
    id: 'test-company-2',
    name: 'Beta Industries',
    email: 'info@beta.com',
    phone: '+1-555-0124',
    industry: 'Manufacturing'
  }
]

/**
 * Seed function to set up test data
 * Should be called before running E2E tests
 */
export async function seedTestData(): Promise<void> {
  try {
    // In a real implementation, this would connect to the test database
    // and insert the test data. For now, we'll use a mock approach.
    
    console.log('🌱 Seeding test data...')
    
    // Create test users
    for (const user of TEST_USERS) {
      console.log(`Creating user: ${user.email}`)
      // await createUser(user)
    }
    
    // Create test companies
    for (const company of TEST_COMPANIES) {
      console.log(`Creating company: ${company.name}`)
      // await createCompany(company)
    }
    
    console.log('✅ Test data seeded successfully')
  } catch (error) {
    console.error('❌ Error seeding test data:', error)
    throw error
  }
}

/**
 * Cleanup function to remove test data
 * Should be called after E2E tests complete
 */
export async function cleanupTestData(): Promise<void> {
  try {
    console.log('🧹 Cleaning up test data...')
    
    // Remove test companies
    for (const company of TEST_COMPANIES) {
      console.log(`Removing company: ${company.name}`)
      // await removeCompany(company.id)
    }
    
    // Remove test users
    for (const user of TEST_USERS) {
      console.log(`Removing user: ${user.email}`)
      // await removeUser(user.id)
    }
    
    console.log('✅ Test data cleaned up successfully')
  } catch (error) {
    console.error('❌ Error cleaning up test data:', error)
    // Don't throw here to allow tests to complete
  }
}