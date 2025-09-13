// ============================================================================
// SMOKE TESTS - PERFORMANCE & LOAD TESTING
// ============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../apps/api/src/app.js';
import { createTestUser, createTestOrganization, cleanupTestData } from '../integration/helpers.js';

// ============================================================================
// TEST SETUP
// ============================================================================

let testUser: any;
let testOrganization: any;
let authToken: string;

beforeAll(async () => {
  // Create test organization
  testOrganization = await createTestOrganization({
    name: 'Performance Test Organization',
    domain: 'perf.test.example.com'
  });

  // Create test user
  testUser = await createTestUser({
    email: 'perf@example.com',
    name: 'Performance Test User',
    password: 'password123',
    organizationId: testOrganization.id
  });

  // Login to get auth token
  const loginResponse = await request(app)
    .post('/auth/login')
    .send({
      email: testUser.email,
      password: 'password123',
      organizationId: testOrganization.id
    });

  authToken = loginResponse.body.data.accessToken;
});

afterAll(async () => {
  await cleanupTestData();
});

// ============================================================================
// PERFORMANCE THRESHOLDS
// ============================================================================

const PERFORMANCE_THRESHOLDS = {
  // Response time thresholds (in milliseconds)
  FAST: 100,      // < 100ms - Excellent
  GOOD: 500,      // < 500ms - Good
  ACCEPTABLE: 1000, // < 1000ms - Acceptable
  SLOW: 2000,     // < 2000ms - Slow but tolerable
  
  // Throughput thresholds (requests per second)
  MIN_THROUGHPUT: 10,  // Minimum 10 RPS
  TARGET_THROUGHPUT: 50, // Target 50 RPS
  
  // Error rate thresholds
  MAX_ERROR_RATE: 0.01, // Maximum 1% error rate
  TARGET_ERROR_RATE: 0.001, // Target 0.1% error rate
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function measureResponseTime(startTime: number): number {
  return Date.now() - startTime;
}

function calculateThroughput(requests: number, durationMs: number): number {
  return (requests / durationMs) * 1000;
}

function calculateErrorRate(errors: number, total: number): number {
  return errors / total;
}

async function makeConcurrentRequests(
  requestFn: () => Promise<any>,
  concurrency: number,
  totalRequests: number
): Promise<{
  responses: any[];
  totalTime: number;
  errorCount: number;
  averageResponseTime: number;
  throughput: number;
  errorRate: number;
}> {
  const startTime = Date.now();
  const responses: any[] = [];
  let errorCount = 0;

  // Create batches of concurrent requests
  const batches = Math.ceil(totalRequests / concurrency);
  
  for (let batch = 0; batch < batches; batch++) {
    const batchSize = Math.min(concurrency, totalRequests - batch * concurrency);
    const batchPromises = Array.from({ length: batchSize }, () => 
      requestFn().catch(error => {
        errorCount++;
        return { error: error.message };
      })
    );

    const batchResponses = await Promise.all(batchPromises);
    responses.push(...batchResponses);
  }

  const totalTime = Date.now() - startTime;
  const successfulResponses = responses.filter(r => !r.error);
  const averageResponseTime = successfulResponses.reduce((sum, r) => 
    sum + (r.responseTime || 0), 0) / successfulResponses.length;
  const throughput = calculateThroughput(totalRequests, totalTime);
  const errorRate = calculateErrorRate(errorCount, totalRequests);

  return {
    responses,
    totalTime,
    errorCount,
    averageResponseTime,
    throughput,
    errorRate
  };
}

// ============================================================================
// HEALTH CHECK PERFORMANCE TESTS
// ============================================================================

describe('Health Check Performance', () => {
  it('should respond to health check quickly', async () => {
    const startTime = Date.now();
    
    const response = await request(app)
      .get('/health');

    const responseTime = measureResponseTime(startTime);

    expect(response.status).toBe(200);
    expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.FAST);
  });

  it('should handle concurrent health checks', async () => {
    const requestFn = () => request(app).get('/health');
    
    const result = await makeConcurrentRequests(requestFn, 10, 50);

    expect(result.errorRate).toBeLessThan(PERFORMANCE_THRESHOLDS.MAX_ERROR_RATE);
    expect(result.averageResponseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.GOOD);
    expect(result.throughput).toBeGreaterThan(PERFORMANCE_THRESHOLDS.MIN_THROUGHPUT);
  });
});

// ============================================================================
// AUTHENTICATION PERFORMANCE TESTS
// ============================================================================

describe('Authentication Performance', () => {
  it('should login quickly', async () => {
    const startTime = Date.now();
    
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: 'password123',
        organizationId: testOrganization.id
      });

    const responseTime = measureResponseTime(startTime);

    expect(response.status).toBe(200);
    expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.GOOD);
  });

  it('should handle concurrent logins', async () => {
    const requestFn = () => request(app)
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: 'password123',
        organizationId: testOrganization.id
      });
    
    const result = await makeConcurrentRequests(requestFn, 5, 20);

    expect(result.errorRate).toBeLessThan(PERFORMANCE_THRESHOLDS.MAX_ERROR_RATE);
    expect(result.averageResponseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.ACCEPTABLE);
  });

  it('should validate tokens quickly', async () => {
    const startTime = Date.now();
    
    const response = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    const responseTime = measureResponseTime(startTime);

    expect(response.status).toBe(200);
    expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.FAST);
  });
});

// ============================================================================
// API ENDPOINT PERFORMANCE TESTS
// ============================================================================

describe('API Endpoint Performance', () => {
  it('should list users quickly', async () => {
    const startTime = Date.now();
    
    const response = await request(app)
      .get('/users')
      .set('Authorization', `Bearer ${authToken}`)
      .query({ page: 1, limit: 10 });

    const responseTime = measureResponseTime(startTime);

    expect(response.status).toBe(200);
    expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.GOOD);
  });

  it('should handle concurrent user requests', async () => {
    const requestFn = () => request(app)
      .get('/users')
      .set('Authorization', `Bearer ${authToken}`)
      .query({ page: 1, limit: 10 });
    
    const result = await makeConcurrentRequests(requestFn, 10, 30);

    expect(result.errorRate).toBeLessThan(PERFORMANCE_THRESHOLDS.MAX_ERROR_RATE);
    expect(result.averageResponseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.ACCEPTABLE);
  });

  it('should create users efficiently', async () => {
    const startTime = Date.now();
    
    const response = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        email: `perf-user-${Date.now()}@example.com`,
        name: 'Performance Test User',
        password: 'password123',
        organizationId: testOrganization.id
      });

    const responseTime = measureResponseTime(startTime);

    expect(response.status).toBe(201);
    expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.ACCEPTABLE);
  });
});

// ============================================================================
// CRM PERFORMANCE TESTS
// ============================================================================

describe('CRM Performance', () => {
  it('should create contacts efficiently', async () => {
    const startTime = Date.now();
    
    const response = await request(app)
      .post('/contacts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        firstName: 'John',
        lastName: 'Doe',
        email: `john.doe.${Date.now()}@example.com`,
        phone: '+1234567890',
        company: 'Test Company',
        title: 'Manager'
      });

    const responseTime = measureResponseTime(startTime);

    expect(response.status).toBe(201);
    expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.ACCEPTABLE);
  });

  it('should list contacts quickly', async () => {
    const startTime = Date.now();
    
    const response = await request(app)
      .get('/contacts')
      .set('Authorization', `Bearer ${authToken}`)
      .query({ page: 1, limit: 10 });

    const responseTime = measureResponseTime(startTime);

    expect(response.status).toBe(200);
    expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.GOOD);
  });

  it('should handle concurrent contact operations', async () => {
    const requestFn = () => request(app)
      .get('/contacts')
      .set('Authorization', `Bearer ${authToken}`)
      .query({ page: 1, limit: 10 });
    
    const result = await makeConcurrentRequests(requestFn, 8, 24);

    expect(result.errorRate).toBeLessThan(PERFORMANCE_THRESHOLDS.MAX_ERROR_RATE);
    expect(result.averageResponseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.ACCEPTABLE);
  });
});

// ============================================================================
// ERP PERFORMANCE TESTS
// ============================================================================

describe('ERP Performance', () => {
  it('should create products efficiently', async () => {
    const startTime = Date.now();
    
    const response = await request(app)
      .post('/products')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: `Performance Product ${Date.now()}`,
        description: 'Performance test product',
        sku: `PERF-${Date.now()}`,
        price: 99.99,
        category: 'Performance Test'
      });

    const responseTime = measureResponseTime(startTime);

    expect(response.status).toBe(201);
    expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.ACCEPTABLE);
  });

  it('should list products quickly', async () => {
    const startTime = Date.now();
    
    const response = await request(app)
      .get('/products')
      .set('Authorization', `Bearer ${authToken}`)
      .query({ page: 1, limit: 10 });

    const responseTime = measureResponseTime(startTime);

    expect(response.status).toBe(200);
    expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.GOOD);
  });
});

// ============================================================================
// AI PERFORMANCE TESTS
// ============================================================================

describe('AI Performance', () => {
  it('should process AI requests within acceptable time', async () => {
    const startTime = Date.now();
    
    const response = await request(app)
      .post('/ai/chat')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        prompt: 'What is 2+2?',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 100,
        organizationId: testOrganization.id,
        userId: testUser.id
      });

    const responseTime = measureResponseTime(startTime);

    expect(response.status).toBe(200);
    expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.SLOW); // AI requests can be slower
  });
});

// ============================================================================
// RATE LIMITING PERFORMANCE TESTS
// ============================================================================

describe('Rate Limiting Performance', () => {
  it('should handle rate limiting efficiently', async () => {
    const requestFn = () => request(app)
      .get('/users')
      .set('Authorization', `Bearer ${authToken}`);
    
    const result = await makeConcurrentRequests(requestFn, 20, 100);

    // Some requests should be rate limited (429 status)
    const rateLimitedResponses = result.responses.filter(r => 
      r.status === 429 || (r.error && r.error.includes('429'))
    );

    expect(rateLimitedResponses.length).toBeGreaterThan(0);
    expect(result.errorRate).toBeLessThan(0.5); // Allow up to 50% rate limiting
  });
});

// ============================================================================
// MEMORY AND RESOURCE TESTS
// ============================================================================

describe('Memory and Resource Usage', () => {
  it('should not leak memory during concurrent requests', async () => {
    const initialMemory = process.memoryUsage();
    
    const requestFn = () => request(app)
      .get('/users')
      .set('Authorization', `Bearer ${authToken}`);
    
    // Make many requests to test for memory leaks
    const result = await makeConcurrentRequests(requestFn, 10, 100);
    
    const finalMemory = process.memoryUsage();
    const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
    
    // Memory increase should be reasonable (less than 50MB)
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    expect(result.errorRate).toBeLessThan(PERFORMANCE_THRESHOLDS.MAX_ERROR_RATE);
  });

  it('should handle large payloads efficiently', async () => {
    const largePayload = {
      firstName: 'John',
      lastName: 'Doe',
      email: `large.payload.${Date.now()}@example.com`,
      phone: '+1234567890',
      company: 'Test Company',
      title: 'Manager',
      customFields: {
        // Create a large custom fields object
        ...Object.fromEntries(
          Array.from({ length: 100 }, (_, i) => [`field${i}`, `value${i}`])
        )
      }
    };

    const startTime = Date.now();
    
    const response = await request(app)
      .post('/contacts')
      .set('Authorization', `Bearer ${authToken}`)
      .send(largePayload);

    const responseTime = measureResponseTime(startTime);

    expect(response.status).toBe(201);
    expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.ACCEPTABLE);
  });
});

// ============================================================================
// STRESS TESTS
// ============================================================================

describe('Stress Tests', () => {
  it('should handle high concurrency', async () => {
    const requestFn = () => request(app)
      .get('/health');
    
    const result = await makeConcurrentRequests(requestFn, 50, 200);

    expect(result.errorRate).toBeLessThan(PERFORMANCE_THRESHOLDS.MAX_ERROR_RATE);
    expect(result.throughput).toBeGreaterThan(PERFORMANCE_THRESHOLDS.MIN_THROUGHPUT);
  });

  it('should maintain performance under load', async () => {
    const requestFn = () => request(app)
      .get('/users')
      .set('Authorization', `Bearer ${authToken}`)
      .query({ page: 1, limit: 10 });
    
    const result = await makeConcurrentRequests(requestFn, 20, 100);

    expect(result.errorRate).toBeLessThan(PERFORMANCE_THRESHOLDS.MAX_ERROR_RATE);
    expect(result.averageResponseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.ACCEPTABLE);
  });
});

// ============================================================================
// PERFORMANCE SUMMARY
// ============================================================================

describe('Performance Summary', () => {
  it('should meet overall performance requirements', async () => {
    const tests = [
      { name: 'Health Check', fn: () => request(app).get('/health') },
      { name: 'User List', fn: () => request(app).get('/users').set('Authorization', `Bearer ${authToken}`) },
      { name: 'Contact List', fn: () => request(app).get('/contacts').set('Authorization', `Bearer ${authToken}`) },
      { name: 'Product List', fn: () => request(app).get('/products').set('Authorization', `Bearer ${authToken}`) }
    ];

    const results = [];

    for (const test of tests) {
      const startTime = Date.now();
      const response = await test.fn();
      const responseTime = measureResponseTime(startTime);
      
      results.push({
        name: test.name,
        status: response.status,
        responseTime,
        passed: responseTime < PERFORMANCE_THRESHOLDS.ACCEPTABLE
      });
    }

    // All tests should pass performance requirements
    const failedTests = results.filter(r => !r.passed);
    expect(failedTests).toHaveLength(0);

    // Log performance summary
    console.log('\n=== PERFORMANCE SUMMARY ===');
    results.forEach(result => {
      console.log(`${result.name}: ${result.responseTime}ms (${result.passed ? 'PASS' : 'FAIL'})`);
    });
    console.log('===========================\n');
  });
});
