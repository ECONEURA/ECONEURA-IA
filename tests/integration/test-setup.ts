// ============================================================================
// INTEGRATION TEST SETUP
// ============================================================================

import { beforeAll, afterAll, beforeEach } from 'vitest';
import { db } from '../../apps/api/src/lib/database.js';
import { cleanupTestData } from './helpers.js';

// ============================================================================
// GLOBAL TEST SETUP
// ============================================================================

beforeAll(async () => {
  // Initialize test database connection
  console.log('Setting up integration tests...');
  
  // Ensure database is clean before starting tests
  await cleanupTestData();
  
  console.log('Integration test setup complete');
});

afterAll(async () => {
  // Clean up after all tests
  console.log('Cleaning up integration tests...');
  
  await cleanupTestData();
  
  console.log('Integration test cleanup complete');
});

beforeEach(async () => {
  // Optional: Clean up between tests if needed
  // This can be expensive, so use sparingly
});

// ============================================================================
// TEST ENVIRONMENT CONFIGURATION
// ============================================================================

export const TEST_CONFIG = {
  // Database configuration
  DATABASE_URL: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/econeura_test',
  
  // API configuration
  API_BASE_URL: process.env.TEST_API_URL || 'http://localhost:3001',
  
  // Test timeouts
  DEFAULT_TIMEOUT: 30000, // 30 seconds
  LONG_TIMEOUT: 60000,    // 60 seconds
  
  // Test data configuration
  TEST_ORGANIZATION_PREFIX: 'TEST_ORG_',
  TEST_USER_PREFIX: 'TEST_USER_',
  TEST_CONTACT_PREFIX: 'TEST_CONTACT_',
  
  // Performance thresholds
  PERFORMANCE_THRESHOLDS: {
    FAST: 100,      // < 100ms
    GOOD: 500,      // < 500ms
    ACCEPTABLE: 1000, // < 1000ms
    SLOW: 2000      // < 2000ms
  }
};

// ============================================================================
// TEST UTILITIES
// ============================================================================

export function generateTestId(prefix: string = 'TEST'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateTestEmail(prefix: string = 'test'): string {
  return `${prefix}_${Date.now()}@example.com`;
}

export function generateTestPhone(): string {
  const areaCode = Math.floor(Math.random() * 900) + 100;
  const exchange = Math.floor(Math.random() * 900) + 100;
  const number = Math.floor(Math.random() * 9000) + 1000;
  return `+1${areaCode}${exchange}${number}`;
}

export function generateTestSku(prefix: string = 'SKU'): string {
  return `${prefix}_${Date.now()}`;
}

export function generateTestOrderNumber(prefix: string = 'ORD'): string {
  return `${prefix}_${Date.now()}`;
}

// ============================================================================
// TEST DATA FACTORIES
// ============================================================================

export const TestDataFactory = {
  organization: (overrides: any = {}) => ({
    name: `Test Organization ${Date.now()}`,
    domain: `test${Date.now()}.example.com`,
    settings: {},
    isActive: true,
    ...overrides
  }),

  user: (overrides: any = {}) => ({
    email: generateTestEmail(),
    name: `Test User ${Date.now()}`,
    password: 'password123',
    roles: ['user'],
    permissions: [],
    isActive: true,
    ...overrides
  }),

  contact: (overrides: any = {}) => ({
    firstName: 'John',
    lastName: 'Doe',
    email: generateTestEmail('contact'),
    phone: generateTestPhone(),
    company: 'Test Company',
    title: 'Manager',
    tags: ['test'],
    customFields: {},
    ...overrides
  }),

  deal: (overrides: any = {}) => ({
    title: `Test Deal ${Date.now()}`,
    description: 'Test deal description',
    value: 10000,
    currency: 'USD',
    stage: 'proposal',
    probability: 50,
    customFields: {},
    ...overrides
  }),

  product: (overrides: any = {}) => ({
    name: `Test Product ${Date.now()}`,
    description: 'Test product description',
    sku: generateTestSku(),
    price: 99.99,
    currency: 'USD',
    category: 'Test Category',
    isActive: true,
    customFields: {},
    ...overrides
  }),

  order: (overrides: any = {}) => ({
    orderNumber: generateTestOrderNumber(),
    status: 'pending',
    total: 199.98,
    currency: 'USD',
    items: [
      {
        productId: 'test-product-id',
        quantity: 2,
        price: 99.99,
        total: 199.98
      }
    ],
    customFields: {},
    ...overrides
  }),

  webhook: (overrides: any = {}) => ({
    name: `Test Webhook ${Date.now()}`,
    url: `https://example.com/webhook/${Date.now()}`,
    events: ['test.event'],
    isActive: true,
    headers: {},
    ...overrides
  }),

  aiRequest: (overrides: any = {}) => ({
    prompt: 'Test AI prompt',
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 500,
    ...overrides
  })
};

// ============================================================================
// TEST ASSERTIONS
// ============================================================================

export const TestAssertions = {
  expectValidResponse: (response: any) => {
    expect(response.body).toHaveProperty('success');
    expect(response.body).toHaveProperty('requestId');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body.requestId).toBeDefined();
    expect(response.body.timestamp).toBeDefined();
  },

  expectValidPaginatedResponse: (response: any) => {
    TestAssertions.expectValidResponse(response);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('pagination');
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.pagination).toHaveProperty('page');
    expect(response.body.pagination).toHaveProperty('limit');
    expect(response.body.pagination).toHaveProperty('total');
  },

  expectValidErrorResponse: (response: any, expectedStatus: number) => {
    expect(response.status).toBe(expectedStatus);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error');
    expect(response.body).toHaveProperty('requestId');
    expect(response.body).toHaveProperty('timestamp');
  },

  expectValidUserResponse: (response: any) => {
    TestAssertions.expectValidResponse(response);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data).toHaveProperty('email');
    expect(response.body.data).toHaveProperty('name');
    expect(response.body.data).toHaveProperty('organizationId');
    expect(response.body.data).toHaveProperty('roles');
    expect(response.body.data).toHaveProperty('permissions');
    expect(response.body.data).toHaveProperty('isActive');
    expect(response.body.data).toHaveProperty('createdAt');
    expect(response.body.data).toHaveProperty('updatedAt');
  },

  expectValidContactResponse: (response: any) => {
    TestAssertions.expectValidResponse(response);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data).toHaveProperty('firstName');
    expect(response.body.data).toHaveProperty('lastName');
    expect(response.body.data).toHaveProperty('organizationId');
    expect(response.body.data).toHaveProperty('tags');
    expect(response.body.data).toHaveProperty('customFields');
    expect(response.body.data).toHaveProperty('createdAt');
    expect(response.body.data).toHaveProperty('updatedAt');
  },

  expectValidDealResponse: (response: any) => {
    TestAssertions.expectValidResponse(response);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data).toHaveProperty('title');
    expect(response.body.data).toHaveProperty('value');
    expect(response.body.data).toHaveProperty('stage');
    expect(response.body.data).toHaveProperty('organizationId');
    expect(response.body.data).toHaveProperty('createdAt');
    expect(response.body.data).toHaveProperty('updatedAt');
  },

  expectValidProductResponse: (response: any) => {
    TestAssertions.expectValidResponse(response);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data).toHaveProperty('name');
    expect(response.body.data).toHaveProperty('sku');
    expect(response.body.data).toHaveProperty('price');
    expect(response.body.data).toHaveProperty('organizationId');
    expect(response.body.data).toHaveProperty('isActive');
    expect(response.body.data).toHaveProperty('createdAt');
    expect(response.body.data).toHaveProperty('updatedAt');
  },

  expectValidOrderResponse: (response: any) => {
    TestAssertions.expectValidResponse(response);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data).toHaveProperty('orderNumber');
    expect(response.body.data).toHaveProperty('customerId');
    expect(response.body.data).toHaveProperty('organizationId');
    expect(response.body.data).toHaveProperty('status');
    expect(response.body.data).toHaveProperty('total');
    expect(response.body.data).toHaveProperty('items');
    expect(response.body.data).toHaveProperty('createdAt');
    expect(response.body.data).toHaveProperty('updatedAt');
  },

  expectValidWebhookResponse: (response: any) => {
    TestAssertions.expectValidResponse(response);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data).toHaveProperty('name');
    expect(response.body.data).toHaveProperty('url');
    expect(response.body.data).toHaveProperty('events');
    expect(response.body.data).toHaveProperty('organizationId');
    expect(response.body.data).toHaveProperty('isActive');
    expect(response.body.data).toHaveProperty('createdAt');
    expect(response.body.data).toHaveProperty('updatedAt');
  },

  expectValidAIResponse: (response: any) => {
    TestAssertions.expectValidResponse(response);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data).toHaveProperty('prompt');
    expect(response.body.data).toHaveProperty('response');
    expect(response.body.data).toHaveProperty('model');
    expect(response.body.data).toHaveProperty('usage');
    expect(response.body.data.usage).toHaveProperty('totalTokens');
    expect(response.body.data).toHaveProperty('cost');
    expect(response.body.data).toHaveProperty('processingTime');
    expect(response.body.data).toHaveProperty('createdAt');
  }
};

// ============================================================================
// PERFORMANCE TESTING UTILITIES
// ============================================================================

export const PerformanceUtils = {
  measureResponseTime: (startTime: number): number => {
    return Date.now() - startTime;
  },

  calculateThroughput: (requests: number, durationMs: number): number => {
    return (requests / durationMs) * 1000;
  },

  calculateErrorRate: (errors: number, total: number): number => {
    return errors / total;
  },

  async makeConcurrentRequests<T>(
    requestFn: () => Promise<T>,
    concurrency: number,
    totalRequests: number
  ): Promise<{
    responses: T[];
    totalTime: number;
    errorCount: number;
    averageResponseTime: number;
    throughput: number;
    errorRate: number;
  }> {
    const startTime = Date.now();
    const responses: T[] = [];
    let errorCount = 0;

    const batches = Math.ceil(totalRequests / concurrency);
    
    for (let batch = 0; batch < batches; batch++) {
      const batchSize = Math.min(concurrency, totalRequests - batch * concurrency);
      const batchPromises = Array.from({ length: batchSize }, () => 
        requestFn().catch(error => {
          errorCount++;
          return { error: error.message } as T;
        })
      );

      const batchResponses = await Promise.all(batchPromises);
      responses.push(...batchResponses);
    }

    const totalTime = Date.now() - startTime;
    const successfulResponses = responses.filter(r => !(r as any).error);
    const averageResponseTime = successfulResponses.reduce((sum, r) => 
      sum + ((r as any).responseTime || 0), 0) / successfulResponses.length;
    const throughput = PerformanceUtils.calculateThroughput(totalRequests, totalTime);
    const errorRate = PerformanceUtils.calculateErrorRate(errorCount, totalRequests);

    return {
      responses,
      totalTime,
      errorCount,
      averageResponseTime,
      throughput,
      errorRate
    };
  }
};

// ============================================================================
// TEST ENVIRONMENT HELPERS
// ============================================================================

export function isTestEnvironment(): boolean {
  return process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
}

export function getTestTimeout(): number {
  return TEST_CONFIG.DEFAULT_TIMEOUT;
}

export function getLongTestTimeout(): number {
  return TEST_CONFIG.LONG_TIMEOUT;
}

export function shouldSkipSlowTests(): boolean {
  return process.env.SKIP_SLOW_TESTS === 'true';
}

export function shouldSkipPerformanceTests(): boolean {
  return process.env.SKIP_PERFORMANCE_TESTS === 'true';
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  TEST_CONFIG,
  TestDataFactory,
  TestAssertions,
  PerformanceUtils
};
