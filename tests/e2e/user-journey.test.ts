// ============================================================================
// END-TO-END TESTS - USER JOURNEY SCENARIOS
// ============================================================================

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
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
    name: 'E2E Test Organization',
    domain: 'e2e.test.example.com'
  });

  // Create test user
  testUser = await createTestUser({
    email: 'e2e@example.com',
    name: 'E2E Test User',
    password: 'password123',
    organizationId: testOrganization.id
  });
});

afterAll(async () => {
  await cleanupTestData();
});

beforeEach(async () => {
  // Login to get fresh auth token
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
// USER ONBOARDING JOURNEY
// ============================================================================

describe('User Onboarding Journey', () => {
  it('should complete full user onboarding flow', async () => {
    // Step 1: User registration (simulated by creating user)
    expect(testUser).toBeDefined();
    expect(testUser.email).toBe('e2e@example.com');

    // Step 2: First login
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: 'password123',
        organizationId: testOrganization.id
      });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.data.user.email).toBe(testUser.email);

    // Step 3: Get user profile
    const profileResponse = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(profileResponse.status).toBe(200);
    expect(profileResponse.body.data.user.name).toBe('E2E Test User');

    // Step 4: Update user profile
    const updateResponse = await request(app)
      .put(`/users/${testUser.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Updated E2E Test User'
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.name).toBe('Updated E2E Test User');

    // Step 5: Logout
    const logoutResponse = await request(app)
      .post('/auth/logout')
      .set('Authorization', `Bearer ${authToken}`);

    expect(logoutResponse.status).toBe(200);
    expect(logoutResponse.body.success).toBe(true);
  });
});

// ============================================================================
// CRM SALES JOURNEY
// ============================================================================

describe('CRM Sales Journey', () => {
  let contact: any;
  let deal: any;

  it('should complete full sales process', async () => {
    // Step 1: Create a new contact
    const contactResponse = await request(app)
      .post('/contacts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@example.com',
        phone: '+1234567890',
        company: 'Acme Corp',
        title: 'CEO',
        tags: ['lead', 'enterprise']
      });

    expect(contactResponse.status).toBe(201);
    expect(contactResponse.body.data.firstName).toBe('John');
    expect(contactResponse.body.data.lastName).toBe('Smith');
    contact = contactResponse.body.data;

    // Step 2: Update contact information
    const updateContactResponse = await request(app)
      .put(`/contacts/${contact.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'CEO & Founder',
        tags: ['lead', 'enterprise', 'vip']
      });

    expect(updateContactResponse.status).toBe(200);
    expect(updateContactResponse.body.data.title).toBe('CEO & Founder');

    // Step 3: Create a deal for the contact
    const dealResponse = await request(app)
      .post('/deals')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Enterprise Software License',
        description: 'Annual enterprise software license for Acme Corp',
        value: 100000,
        currency: 'USD',
        stage: 'proposal',
        probability: 75,
        contactId: contact.id,
        expectedCloseDate: '2024-12-31'
      });

    expect(dealResponse.status).toBe(201);
    expect(dealResponse.body.data.title).toBe('Enterprise Software License');
    expect(dealResponse.body.data.value).toBe(100000);
    expect(dealResponse.body.data.contactId).toBe(contact.id);
    deal = dealResponse.body.data;

    // Step 4: Update deal stage
    const updateDealResponse = await request(app)
      .put(`/deals/${deal.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        stage: 'negotiation',
        probability: 85
      });

    expect(updateDealResponse.status).toBe(200);
    expect(updateDealResponse.body.data.stage).toBe('negotiation');
    expect(updateDealResponse.body.data.probability).toBe(85);

    // Step 5: Move deal to closed-won
    const closeDealResponse = await request(app)
      .put(`/deals/${deal.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        stage: 'closed-won',
        probability: 100
      });

    expect(closeDealResponse.status).toBe(200);
    expect(closeDealResponse.body.data.stage).toBe('closed-won');
    expect(closeDealResponse.body.data.probability).toBe(100);
  });
});

// ============================================================================
// ERP ORDER JOURNEY
// ============================================================================

describe('ERP Order Journey', () => {
  let product: any;
  let order: any;

  it('should complete full order process', async () => {
    // Step 1: Create a product
    const productResponse = await request(app)
      .post('/products')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Premium Software License',
        description: 'Annual premium software license',
        sku: 'PSL-2024',
        price: 999.99,
        currency: 'USD',
        category: 'Software'
      });

    expect(productResponse.status).toBe(201);
    expect(productResponse.body.data.name).toBe('Premium Software License');
    expect(productResponse.body.data.sku).toBe('PSL-2024');
    product = productResponse.body.data;

    // Step 2: Create an order
    const orderResponse = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        customerId: testUser.id,
        items: [
          {
            productId: product.id,
            quantity: 2,
            price: product.price
          }
        ],
        shippingAddress: {
          street: '123 Business St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        }
      });

    expect(orderResponse.status).toBe(201);
    expect(orderResponse.body.data.customerId).toBe(testUser.id);
    expect(orderResponse.body.data.items).toHaveLength(1);
    expect(orderResponse.body.data.total).toBe(product.price * 2);
    order = orderResponse.body.data;

    // Step 3: Update order status to processing
    const processOrderResponse = await request(app)
      .put(`/orders/${order.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        status: 'processing'
      });

    expect(processOrderResponse.status).toBe(200);
    expect(processOrderResponse.body.data.status).toBe('processing');

    // Step 4: Update order status to shipped
    const shipOrderResponse = await request(app)
      .put(`/orders/${order.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        status: 'shipped'
      });

    expect(shipOrderResponse.status).toBe(200);
    expect(shipOrderResponse.body.data.status).toBe('shipped');

    // Step 5: Update order status to delivered
    const deliverOrderResponse = await request(app)
      .put(`/orders/${order.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        status: 'delivered'
      });

    expect(deliverOrderResponse.status).toBe(200);
    expect(deliverOrderResponse.body.data.status).toBe('delivered');
  });
});

// ============================================================================
// AI ASSISTANT JOURNEY
// ============================================================================

describe('AI Assistant Journey', () => {
  it('should complete AI assistant interaction flow', async () => {
    // Step 1: Initial AI chat
    const chatResponse1 = await request(app)
      .post('/ai/chat')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        prompt: 'Hello, I need help with my CRM system',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 500,
        organizationId: testOrganization.id,
        userId: testUser.id
      });

    expect(chatResponse1.status).toBe(200);
    expect(chatResponse1.body.data.response).toBeDefined();
    expect(chatResponse1.body.data.model).toBe('gpt-4');

    // Step 2: Follow-up question
    const chatResponse2 = await request(app)
      .post('/ai/chat')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        prompt: 'How can I create a new contact?',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 500,
        organizationId: testOrganization.id,
        userId: testUser.id
      });

    expect(chatResponse2.status).toBe(200);
    expect(chatResponse2.body.data.response).toBeDefined();

    // Step 3: Complex query
    const chatResponse3 = await request(app)
      .post('/ai/chat')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        prompt: 'Analyze my sales pipeline and suggest improvements',
        model: 'gpt-4',
        temperature: 0.5,
        maxTokens: 1000,
        organizationId: testOrganization.id,
        userId: testUser.id
      });

    expect(chatResponse3.status).toBe(200);
    expect(chatResponse3.body.data.response).toBeDefined();
    expect(chatResponse3.body.data.usage.totalTokens).toBeGreaterThan(0);
  });
});

// ============================================================================
// WEBHOOK INTEGRATION JOURNEY
// ============================================================================

describe('Webhook Integration Journey', () => {
  let webhook: any;

  it('should complete webhook setup and management flow', async () => {
    // Step 1: Create a webhook
    const webhookResponse = await request(app)
      .post('/webhooks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'CRM Integration Webhook',
        url: 'https://example.com/webhook/crm',
        events: ['contact.created', 'deal.updated', 'order.created'],
        headers: {
          'X-API-Key': 'webhook-secret-key',
          'Content-Type': 'application/json'
        }
      });

    expect(webhookResponse.status).toBe(201);
    expect(webhookResponse.body.data.name).toBe('CRM Integration Webhook');
    expect(webhookResponse.body.data.events).toHaveLength(3);
    webhook = webhookResponse.body.data;

    // Step 2: Update webhook configuration
    const updateWebhookResponse = await request(app)
      .put(`/webhooks/${webhook.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        events: ['contact.created', 'deal.updated', 'order.created', 'user.created'],
        headers: {
          'X-API-Key': 'updated-webhook-secret-key',
          'Content-Type': 'application/json',
          'X-Custom-Header': 'custom-value'
        }
      });

    expect(updateWebhookResponse.status).toBe(200);
    expect(updateWebhookResponse.body.data.events).toHaveLength(4);
    expect(updateWebhookResponse.body.data.headers['X-Custom-Header']).toBe('custom-value');

    // Step 3: Disable webhook
    const disableWebhookResponse = await request(app)
      .put(`/webhooks/${webhook.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        isActive: false
      });

    expect(disableWebhookResponse.status).toBe(200);
    expect(disableWebhookResponse.body.data.isActive).toBe(false);

    // Step 4: Re-enable webhook
    const enableWebhookResponse = await request(app)
      .put(`/webhooks/${webhook.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        isActive: true
      });

    expect(enableWebhookResponse.status).toBe(200);
    expect(enableWebhookResponse.body.data.isActive).toBe(true);
  });
});

// ============================================================================
// COMPLETE BUSINESS WORKFLOW
// ============================================================================

describe('Complete Business Workflow', () => {
  let contact: any;
  let deal: any;
  let product: any;
  let order: any;
  let webhook: any;

  it('should complete end-to-end business process', async () => {
    // Phase 1: Lead Management
    // Create a new lead (contact)
    const contactResponse = await request(app)
      .post('/contacts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@company.com',
        phone: '+1987654321',
        company: 'Tech Startup Inc',
        title: 'CTO',
        tags: ['lead', 'startup', 'tech']
      });

    expect(contactResponse.status).toBe(201);
    contact = contactResponse.body.data;

    // Phase 2: Sales Process
    // Create a deal for the lead
    const dealResponse = await request(app)
      .post('/deals')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Enterprise Software Implementation',
        description: 'Full enterprise software implementation for Tech Startup Inc',
        value: 50000,
        currency: 'USD',
        stage: 'qualification',
        probability: 60,
        contactId: contact.id,
        expectedCloseDate: '2024-11-30'
      });

    expect(dealResponse.status).toBe(201);
    deal = dealResponse.body.data;

    // Move deal through sales stages
    const stages = ['proposal', 'negotiation', 'closed-won'];
    for (const stage of stages) {
      const stageResponse = await request(app)
        .put(`/deals/${deal.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ stage });

      expect(stageResponse.status).toBe(200);
      expect(stageResponse.body.data.stage).toBe(stage);
    }

    // Phase 3: Product Management
    // Create products for the order
    const productResponse = await request(app)
      .post('/products')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Enterprise Software License',
        description: 'Annual enterprise software license',
        sku: 'ESL-2024',
        price: 25000,
        currency: 'USD',
        category: 'Software'
      });

    expect(productResponse.status).toBe(201);
    product = productResponse.body.data;

    // Phase 4: Order Processing
    // Create order for the won deal
    const orderResponse = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        customerId: testUser.id,
        items: [
          {
            productId: product.id,
            quantity: 2,
            price: product.price
          }
        ],
        shippingAddress: {
          street: '456 Tech Street',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94105',
          country: 'USA'
        }
      });

    expect(orderResponse.status).toBe(201);
    order = orderResponse.body.data;

    // Process the order
    const orderStages = ['processing', 'shipped', 'delivered'];
    for (const status of orderStages) {
      const statusResponse = await request(app)
        .put(`/orders/${order.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status });

      expect(statusResponse.status).toBe(200);
      expect(statusResponse.body.data.status).toBe(status);
    }

    // Phase 5: Integration Setup
    // Set up webhook for ongoing integration
    const webhookResponse = await request(app)
      .post('/webhooks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Business Process Webhook',
        url: 'https://company.com/webhook/business',
        events: ['contact.created', 'deal.closed-won', 'order.delivered'],
        headers: {
          'X-API-Key': 'business-webhook-key'
        }
      });

    expect(webhookResponse.status).toBe(201);
    webhook = webhookResponse.body.data;

    // Phase 6: AI Analysis
    // Get AI insights on the completed process
    const aiResponse = await request(app)
      .post('/ai/chat')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        prompt: 'Analyze this completed business process and provide insights',
        model: 'gpt-4',
        temperature: 0.3,
        maxTokens: 800,
        organizationId: testOrganization.id,
        userId: testUser.id
      });

    expect(aiResponse.status).toBe(200);
    expect(aiResponse.body.data.response).toBeDefined();

    // Phase 7: Verification
    // Verify all data is properly linked and accessible
    const finalContactResponse = await request(app)
      .get(`/contacts/${contact.id}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(finalContactResponse.status).toBe(200);
    expect(finalContactResponse.body.data.id).toBe(contact.id);

    const finalDealResponse = await request(app)
      .get(`/deals/${deal.id}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(finalDealResponse.status).toBe(200);
    expect(finalDealResponse.body.data.stage).toBe('closed-won');

    const finalOrderResponse = await request(app)
      .get(`/orders/${order.id}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(finalOrderResponse.status).toBe(200);
    expect(finalOrderResponse.body.data.status).toBe('delivered');
  });
});

// ============================================================================
// ERROR RECOVERY JOURNEY
// ============================================================================

describe('Error Recovery Journey', () => {
  it('should handle and recover from various error scenarios', async () => {
    // Test 1: Invalid authentication
    const invalidAuthResponse = await request(app)
      .get('/users')
      .set('Authorization', 'Bearer invalid-token');

    expect(invalidAuthResponse.status).toBe(401);

    // Test 2: Invalid data validation
    const invalidDataResponse = await request(app)
      .post('/contacts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        firstName: '', // Invalid: empty first name
        email: 'invalid-email' // Invalid: malformed email
      });

    expect(invalidDataResponse.status).toBe(400);

    // Test 3: Resource not found
    const notFoundResponse = await request(app)
      .get('/contacts/non-existent-id')
      .set('Authorization', `Bearer ${authToken}`);

    expect(notFoundResponse.status).toBe(404);

    // Test 4: Recovery - successful request after errors
    const recoveryResponse = await request(app)
      .post('/contacts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        firstName: 'Recovery',
        lastName: 'Test',
        email: 'recovery@example.com'
      });

    expect(recoveryResponse.status).toBe(201);
    expect(recoveryResponse.body.data.firstName).toBe('Recovery');
  });
});

// ============================================================================
// PERFORMANCE UNDER LOAD JOURNEY
// ============================================================================

describe('Performance Under Load Journey', () => {
  it('should maintain functionality under concurrent load', async () => {
    const concurrentRequests = Array.from({ length: 10 }, (_, i) =>
      request(app)
        .post('/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: `Concurrent${i}`,
          lastName: 'Test',
          email: `concurrent${i}@example.com`
        })
    );

    const responses = await Promise.all(concurrentRequests);
    
    // Most requests should succeed
    const successfulResponses = responses.filter(r => r.status === 201);
    expect(successfulResponses.length).toBeGreaterThan(8);

    // Verify data integrity
    const listResponse = await request(app)
      .get('/contacts')
      .set('Authorization', `Bearer ${authToken}`)
      .query({ page: 1, limit: 20 });

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data.length).toBeGreaterThan(0);
  });
});
