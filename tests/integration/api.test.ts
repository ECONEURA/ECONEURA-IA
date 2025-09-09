// ============================================================================
// INTEGRATION TESTS - API ENDPOINTS
// ============================================================================

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../apps/api/src/app.js';
import { createTestUser, createTestOrganization, cleanupTestData } from './helpers.js';

// ============================================================================
// TEST SETUP
// ============================================================================

let testUser: any;
let testOrganization: any;
let authToken: string;

beforeAll(async () => {
  // Create test organization
  testOrganization = await createTestOrganization({
    name: 'Test Organization',
    domain: 'test.example.com'
  });

  // Create test user
  testUser = await createTestUser({
    email: 'test@example.com',
    name: 'Test User',
    password: 'password123',
    organizationId: testOrganization.id
  });
});

afterAll(async () => {
  await cleanupTestData();
});

beforeEach(async () => {
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

// ============================================================================
// AUTHENTICATION TESTS
// ============================================================================

describe('Authentication Integration', () => {
  it('should login successfully with valid credentials', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: 'password123',
        organizationId: testOrganization.id
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('user');
    expect(response.body.data).toHaveProperty('accessToken');
    expect(response.body.data).toHaveProperty('refreshToken');
    expect(response.body.data.user.email).toBe(testUser.email);
  });

  it('should reject login with invalid credentials', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: 'wrongpassword',
        organizationId: testOrganization.id
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBeDefined();
  });

  it('should refresh token successfully', async () => {
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: 'password123',
        organizationId: testOrganization.id
      });

    const refreshToken = loginResponse.body.data.refreshToken;

    const response = await request(app)
      .post('/auth/refresh')
      .send({
        refreshToken
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('accessToken');
    expect(response.body.data).toHaveProperty('refreshToken');
  });

  it('should get current user info', async () => {
    const response = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe(testUser.email);
    expect(response.body.data.user.organizationId).toBe(testOrganization.id);
  });

  it('should logout successfully', async () => {
    const response = await request(app)
      .post('/auth/logout')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});

// ============================================================================
// USER MANAGEMENT TESTS
// ============================================================================

describe('User Management Integration', () => {
  it('should list users', async () => {
    const response = await request(app)
      .get('/users')
      .set('Authorization', `Bearer ${authToken}`)
      .query({ page: 1, limit: 10 });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeInstanceOf(Array);
    expect(response.body.pagination).toBeDefined();
  });

  it('should create new user', async () => {
    const newUser = {
      email: 'newuser@example.com',
      name: 'New User',
      password: 'password123',
      organizationId: testOrganization.id,
      roles: ['user']
    };

    const response = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${authToken}`)
      .send(newUser);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.email).toBe(newUser.email);
    expect(response.body.data.name).toBe(newUser.name);
  });

  it('should get user by ID', async () => {
    const response = await request(app)
      .get(`/users/${testUser.id}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(testUser.id);
    expect(response.body.data.email).toBe(testUser.email);
  });

  it('should update user', async () => {
    const updateData = {
      name: 'Updated User Name'
    };

    const response = await request(app)
      .put(`/users/${testUser.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(updateData);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe(updateData.name);
  });
});

// ============================================================================
// CRM INTEGRATION TESTS
// ============================================================================

describe('CRM Integration', () => {
  let testContact: any;

  it('should create contact', async () => {
    const contactData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      company: 'Test Company',
      title: 'Manager',
      tags: ['lead', 'important']
    };

    const response = await request(app)
      .post('/contacts')
      .set('Authorization', `Bearer ${authToken}`)
      .send(contactData);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.firstName).toBe(contactData.firstName);
    expect(response.body.data.lastName).toBe(contactData.lastName);
    expect(response.body.data.email).toBe(contactData.email);

    testContact = response.body.data;
  });

  it('should list contacts', async () => {
    const response = await request(app)
      .get('/contacts')
      .set('Authorization', `Bearer ${authToken}`)
      .query({ page: 1, limit: 10 });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeInstanceOf(Array);
    expect(response.body.pagination).toBeDefined();
  });

  it('should get contact by ID', async () => {
    const response = await request(app)
      .get(`/contacts/${testContact.id}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(testContact.id);
  });

  it('should update contact', async () => {
    const updateData = {
      title: 'Senior Manager',
      tags: ['lead', 'important', 'vip']
    };

    const response = await request(app)
      .put(`/contacts/${testContact.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(updateData);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.title).toBe(updateData.title);
  });

  it('should create deal', async () => {
    const dealData = {
      title: 'Enterprise Deal',
      description: 'Large enterprise contract',
      value: 50000,
      currency: 'USD',
      stage: 'proposal',
      probability: 75,
      contactId: testContact.id,
      expectedCloseDate: '2024-12-31'
    };

    const response = await request(app)
      .post('/deals')
      .set('Authorization', `Bearer ${authToken}`)
      .send(dealData);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.title).toBe(dealData.title);
    expect(response.body.data.value).toBe(dealData.value);
    expect(response.body.data.contactId).toBe(testContact.id);
  });
});

// ============================================================================
// ERP INTEGRATION TESTS
// ============================================================================

describe('ERP Integration', () => {
  let testProduct: any;

  it('should create product', async () => {
    const productData = {
      name: 'Premium Product',
      description: 'High-quality product',
      sku: 'PROD-001',
      price: 99.99,
      currency: 'USD',
      category: 'Electronics'
    };

    const response = await request(app)
      .post('/products')
      .set('Authorization', `Bearer ${authToken}`)
      .send(productData);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe(productData.name);
    expect(response.body.data.sku).toBe(productData.sku);
    expect(response.body.data.price).toBe(productData.price);

    testProduct = response.body.data;
  });

  it('should list products', async () => {
    const response = await request(app)
      .get('/products')
      .set('Authorization', `Bearer ${authToken}`)
      .query({ page: 1, limit: 10 });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeInstanceOf(Array);
    expect(response.body.pagination).toBeDefined();
  });

  it('should create order', async () => {
    const orderData = {
      customerId: testUser.id,
      items: [
        {
          productId: testProduct.id,
          quantity: 2,
          price: testProduct.price
        }
      ],
      shippingAddress: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA'
      }
    };

    const response = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send(orderData);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.customerId).toBe(testUser.id);
    expect(response.body.data.items).toHaveLength(1);
    expect(response.body.data.total).toBe(testProduct.price * 2);
  });
});

// ============================================================================
// AI INTEGRATION TESTS
// ============================================================================

describe('AI Integration', () => {
  it('should process AI chat request', async () => {
    const aiRequest = {
      prompt: 'What is the weather like today?',
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 1000,
      organizationId: testOrganization.id,
      userId: testUser.id
    };

    const response = await request(app)
      .post('/ai/chat')
      .set('Authorization', `Bearer ${authToken}`)
      .send(aiRequest);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('response');
    expect(response.body.data).toHaveProperty('model');
    expect(response.body.data).toHaveProperty('usage');
    expect(response.body.data.usage).toHaveProperty('totalTokens');
  });
});

// ============================================================================
// WEBHOOK INTEGRATION TESTS
// ============================================================================

describe('Webhook Integration', () => {
  let testWebhook: any;

  it('should create webhook', async () => {
    const webhookData = {
      name: 'Test Webhook',
      url: 'https://example.com/webhook',
      events: ['contact.created', 'deal.updated'],
      headers: {
        'X-Custom-Header': 'test-value'
      }
    };

    const response = await request(app)
      .post('/webhooks')
      .set('Authorization', `Bearer ${authToken}`)
      .send(webhookData);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe(webhookData.name);
    expect(response.body.data.url).toBe(webhookData.url);
    expect(response.body.data.events).toEqual(webhookData.events);

    testWebhook = response.body.data;
  });

  it('should list webhooks', async () => {
    const response = await request(app)
      .get('/webhooks')
      .set('Authorization', `Bearer ${authToken}`)
      .query({ page: 1, limit: 10 });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeInstanceOf(Array);
    expect(response.body.pagination).toBeDefined();
  });

  it('should update webhook', async () => {
    const updateData = {
      name: 'Updated Webhook',
      events: ['contact.created', 'deal.updated', 'user.created']
    };

    const response = await request(app)
      .put(`/webhooks/${testWebhook.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(updateData);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe(updateData.name);
    expect(response.body.data.events).toEqual(updateData.events);
  });
});

// ============================================================================
// SYSTEM INTEGRATION TESTS
// ============================================================================

describe('System Integration', () => {
  it('should check system health', async () => {
    const response = await request(app)
      .get('/health');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('status');
    expect(response.body.data).toHaveProperty('version');
    expect(response.body.data).toHaveProperty('services');
  });

  it('should get system metrics', async () => {
    const response = await request(app)
      .get('/metrics')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('requests');
    expect(response.body.data).toHaveProperty('performance');
  });
});

// ============================================================================
// RATE LIMITING INTEGRATION TESTS
// ============================================================================

describe('Rate Limiting Integration', () => {
  it('should apply rate limiting', async () => {
    // Make multiple requests to trigger rate limiting
    const requests = Array.from({ length: 15 }, () =>
      request(app)
        .get('/users')
        .set('Authorization', `Bearer ${authToken}`)
    );

    const responses = await Promise.all(requests);

    // Some requests should be rate limited
    const rateLimitedResponses = responses.filter(r => r.status === 429);
    expect(rateLimitedResponses.length).toBeGreaterThan(0);
  });

  it('should get rate limit status', async () => {
    const response = await request(app)
      .get('/rate-limiting/status')
      .set('Authorization', `Bearer ${authToken}`)
      .query({ key: 'ip:127.0.0.1' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('key');
    expect(response.body.data).toHaveProperty('limitInfo');
    expect(response.body.data).toHaveProperty('stats');
  });
});

// ============================================================================
// ERROR HANDLING INTEGRATION TESTS
// ============================================================================

describe('Error Handling Integration', () => {
  it('should handle validation errors', async () => {
    const response = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        email: 'invalid-email', // Invalid email format
        name: '', // Empty name
        password: '123' // Too short password
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('Validation error');
    expect(response.body.message).toContain('Invalid email format');
  });

  it('should handle authentication errors', async () => {
    const response = await request(app)
      .get('/users')
      .set('Authorization', 'Bearer invalid-token');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBeDefined();
  });

  it('should handle not found errors', async () => {
    const response = await request(app)
      .get('/users/non-existent-id')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBeDefined();
  });

  it('should handle server errors gracefully', async () => {
    // This would require mocking a server error
    // For now, we'll test that the error handler is in place
    const response = await request(app)
      .get('/users')
      .set('Authorization', `Bearer ${authToken}`);

    // Should not return 500 for normal requests
    expect(response.status).not.toBe(500);
  });
});

// ============================================================================
// CORRELATION ID INTEGRATION TESTS
// ============================================================================

describe('Correlation ID Integration', () => {
  it('should include correlation ID in responses', async () => {
    const correlationId = 'test-correlation-123';

    const response = await request(app)
      .get('/users')
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-Correlation-Id', correlationId);

    expect(response.status).toBe(200);
    expect(response.body.requestId).toBe(correlationId);
  });

  it('should generate correlation ID if not provided', async () => {
    const response = await request(app)
      .get('/users')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.requestId).toBeDefined();
    expect(response.body.requestId).toMatch(/^req_\d+$/);
  });
});
