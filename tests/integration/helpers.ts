// ============================================================================
// INTEGRATION TEST HELPERS
// ============================================================================

import { db } from '../../apps/api/src/lib/database.js';
import { users, organizations, contacts, deals, products, orders, webhooks } from '../../apps/api/src/lib/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// ============================================================================
// DATABASE HELPERS
// ============================================================================

export async function createTestOrganization(data: {
  name: string;
  domain?: string;
  settings?: Record<string, any>;
}) {
  const [organization] = await db.insert(organizations).values({
    id: crypto.randomUUID(),
    name: data.name,
    domain: data.domain,
    settings: data.settings || {},
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }).returning();

  return organization;
}

export async function createTestUser(data: {
  email: string;
  name: string;
  password: string;
  organizationId: string;
  roles?: string[];
}) {
  const hashedPassword = await bcrypt.hash(data.password, 10);
  
  const [user] = await db.insert(users).values({
    id: crypto.randomUUID(),
    email: data.email,
    name: data.name,
    password: hashedPassword,
    organizationId: data.organizationId,
    roles: data.roles || ['user'],
    permissions: [],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }).returning();

  return user;
}

export async function createTestContact(data: {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  organizationId: string;
  tags?: string[];
  customFields?: Record<string, any>;
}) {
  const [contact] = await db.insert(contacts).values({
    id: crypto.randomUUID(),
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    company: data.company,
    title: data.title,
    organizationId: data.organizationId,
    tags: data.tags || [],
    customFields: data.customFields || {},
    createdAt: new Date(),
    updatedAt: new Date()
  }).returning();

  return contact;
}

export async function createTestDeal(data: {
  title: string;
  description?: string;
  value: number;
  currency?: string;
  stage: string;
  probability?: number;
  contactId?: string;
  organizationId: string;
  expectedCloseDate?: string;
  customFields?: Record<string, any>;
}) {
  const [deal] = await db.insert(deals).values({
    id: crypto.randomUUID(),
    title: data.title,
    description: data.description,
    value: data.value,
    currency: data.currency || 'USD',
    stage: data.stage,
    probability: data.probability || 0,
    contactId: data.contactId,
    organizationId: data.organizationId,
    expectedCloseDate: data.expectedCloseDate,
    customFields: data.customFields || {},
    createdAt: new Date(),
    updatedAt: new Date()
  }).returning();

  return deal;
}

export async function createTestProduct(data: {
  name: string;
  description?: string;
  sku: string;
  price: number;
  currency?: string;
  category?: string;
  organizationId: string;
  customFields?: Record<string, any>;
}) {
  const [product] = await db.insert(products).values({
    id: crypto.randomUUID(),
    name: data.name,
    description: data.description,
    sku: data.sku,
    price: data.price,
    currency: data.currency || 'USD',
    category: data.category,
    organizationId: data.organizationId,
    isActive: true,
    customFields: data.customFields || {},
    createdAt: new Date(),
    updatedAt: new Date()
  }).returning();

  return product;
}

export async function createTestOrder(data: {
  orderNumber: string;
  customerId: string;
  organizationId: string;
  status?: string;
  total: number;
  currency?: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  customFields?: Record<string, any>;
}) {
  const [order] = await db.insert(orders).values({
    id: crypto.randomUUID(),
    orderNumber: data.orderNumber,
    customerId: data.customerId,
    organizationId: data.organizationId,
    status: data.status || 'pending',
    total: data.total,
    currency: data.currency || 'USD',
    items: data.items,
    shippingAddress: data.shippingAddress,
    customFields: data.customFields || {},
    createdAt: new Date(),
    updatedAt: new Date()
  }).returning();

  return order;
}

export async function createTestWebhook(data: {
  name: string;
  url: string;
  events: string[];
  organizationId: string;
  headers?: Record<string, string>;
  secret?: string;
}) {
  const [webhook] = await db.insert(webhooks).values({
    id: crypto.randomUUID(),
    name: data.name,
    url: data.url,
    events: data.events,
    organizationId: data.organizationId,
    isActive: true,
    secret: data.secret,
    headers: data.headers || {},
    createdAt: new Date(),
    updatedAt: new Date()
  }).returning();

  return webhook;
}

// ============================================================================
// CLEANUP HELPERS
// ============================================================================

export async function cleanupTestData() {
  try {
    // Delete in reverse order of dependencies
    await db.delete(webhooks);
    await db.delete(orders);
    await db.delete(products);
    await db.delete(deals);
    await db.delete(contacts);
    await db.delete(users);
    await db.delete(organizations);
  } catch (error) {
    console.error('Error cleaning up test data:', error);
  }
}

export async function cleanupTestOrganization(organizationId: string) {
  try {
    await db.delete(webhooks).where(eq(webhooks.organizationId, organizationId));
    await db.delete(orders).where(eq(orders.organizationId, organizationId));
    await db.delete(products).where(eq(products.organizationId, organizationId));
    await db.delete(deals).where(eq(deals.organizationId, organizationId));
    await db.delete(contacts).where(eq(contacts.organizationId, organizationId));
    await db.delete(users).where(eq(users.organizationId, organizationId));
    await db.delete(organizations).where(eq(organizations.id, organizationId));
  } catch (error) {
    console.error('Error cleaning up test organization:', error);
  }
}

export async function cleanupTestUser(userId: string) {
  try {
    await db.delete(users).where(eq(users.id, userId));
  } catch (error) {
    console.error('Error cleaning up test user:', error);
  }
}

// ============================================================================
// UTILITY HELPERS
// ============================================================================

export function generateTestData() {
  return {
    organization: {
      name: `Test Org ${Date.now()}`,
      domain: `test${Date.now()}.example.com`
    },
    user: {
      email: `test${Date.now()}@example.com`,
      name: `Test User ${Date.now()}`,
      password: 'password123'
    },
    contact: {
      firstName: 'John',
      lastName: 'Doe',
      email: `john.doe${Date.now()}@example.com`,
      phone: '+1234567890',
      company: 'Test Company',
      title: 'Manager'
    },
    deal: {
      title: `Test Deal ${Date.now()}`,
      description: 'Test deal description',
      value: 10000,
      stage: 'proposal',
      probability: 50
    },
    product: {
      name: `Test Product ${Date.now()}`,
      description: 'Test product description',
      sku: `SKU-${Date.now()}`,
      price: 99.99,
      category: 'Test Category'
    },
    order: {
      orderNumber: `ORD-${Date.now()}`,
      status: 'pending',
      total: 199.98,
      items: [
        {
          productId: 'product-id',
          quantity: 2,
          price: 99.99,
          total: 199.98
        }
      ]
    },
    webhook: {
      name: `Test Webhook ${Date.now()}`,
      url: `https://example.com/webhook/${Date.now()}`,
      events: ['contact.created', 'deal.updated']
    }
  };
}

export function createAuthHeaders(token: string) {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

export function createCorrelationHeaders(correlationId?: string) {
  return {
    'X-Correlation-Id': correlationId || `test-${Date.now()}`,
    'Content-Type': 'application/json'
  };
}

export function createApiKeyHeaders(apiKey: string) {
  return {
    'X-API-Key': apiKey,
    'Content-Type': 'application/json'
  };
}

// ============================================================================
// ASSERTION HELPERS
// ============================================================================

export function expectValidResponse(response: any) {
  expect(response.body).toHaveProperty('success');
  expect(response.body).toHaveProperty('requestId');
  expect(response.body).toHaveProperty('timestamp');
  expect(response.body.requestId).toBeDefined();
  expect(response.body.timestamp).toBeDefined();
}

export function expectValidPaginatedResponse(response: any) {
  expectValidResponse(response);
  expect(response.body).toHaveProperty('data');
  expect(response.body).toHaveProperty('pagination');
  expect(Array.isArray(response.body.data)).toBe(true);
  expect(response.body.pagination).toHaveProperty('page');
  expect(response.body.pagination).toHaveProperty('limit');
  expect(response.body.pagination).toHaveProperty('total');
}

export function expectValidErrorResponse(response: any, expectedStatus: number) {
  expect(response.status).toBe(expectedStatus);
  expect(response.body).toHaveProperty('success', false);
  expect(response.body).toHaveProperty('error');
  expect(response.body).toHaveProperty('requestId');
  expect(response.body).toHaveProperty('timestamp');
}

export function expectValidUserResponse(response: any) {
  expectValidResponse(response);
  expect(response.body.data).toHaveProperty('id');
  expect(response.body.data).toHaveProperty('email');
  expect(response.body.data).toHaveProperty('name');
  expect(response.body.data).toHaveProperty('organizationId');
  expect(response.body.data).toHaveProperty('roles');
  expect(response.body.data).toHaveProperty('permissions');
  expect(response.body.data).toHaveProperty('isActive');
  expect(response.body.data).toHaveProperty('createdAt');
  expect(response.body.data).toHaveProperty('updatedAt');
}

export function expectValidContactResponse(response: any) {
  expectValidResponse(response);
  expect(response.body.data).toHaveProperty('id');
  expect(response.body.data).toHaveProperty('firstName');
  expect(response.body.data).toHaveProperty('lastName');
  expect(response.body.data).toHaveProperty('organizationId');
  expect(response.body.data).toHaveProperty('tags');
  expect(response.body.data).toHaveProperty('customFields');
  expect(response.body.data).toHaveProperty('createdAt');
  expect(response.body.data).toHaveProperty('updatedAt');
}

export function expectValidDealResponse(response: any) {
  expectValidResponse(response);
  expect(response.body.data).toHaveProperty('id');
  expect(response.body.data).toHaveProperty('title');
  expect(response.body.data).toHaveProperty('value');
  expect(response.body.data).toHaveProperty('stage');
  expect(response.body.data).toHaveProperty('organizationId');
  expect(response.body.data).toHaveProperty('createdAt');
  expect(response.body.data).toHaveProperty('updatedAt');
}

export function expectValidProductResponse(response: any) {
  expectValidResponse(response);
  expect(response.body.data).toHaveProperty('id');
  expect(response.body.data).toHaveProperty('name');
  expect(response.body.data).toHaveProperty('sku');
  expect(response.body.data).toHaveProperty('price');
  expect(response.body.data).toHaveProperty('organizationId');
  expect(response.body.data).toHaveProperty('isActive');
  expect(response.body.data).toHaveProperty('createdAt');
  expect(response.body.data).toHaveProperty('updatedAt');
}

export function expectValidOrderResponse(response: any) {
  expectValidResponse(response);
  expect(response.body.data).toHaveProperty('id');
  expect(response.body.data).toHaveProperty('orderNumber');
  expect(response.body.data).toHaveProperty('customerId');
  expect(response.body.data).toHaveProperty('organizationId');
  expect(response.body.data).toHaveProperty('status');
  expect(response.body.data).toHaveProperty('total');
  expect(response.body.data).toHaveProperty('items');
  expect(response.body.data).toHaveProperty('createdAt');
  expect(response.body.data).toHaveProperty('updatedAt');
}

export function expectValidWebhookResponse(response: any) {
  expectValidResponse(response);
  expect(response.body.data).toHaveProperty('id');
  expect(response.body.data).toHaveProperty('name');
  expect(response.body.data).toHaveProperty('url');
  expect(response.body.data).toHaveProperty('events');
  expect(response.body.data).toHaveProperty('organizationId');
  expect(response.body.data).toHaveProperty('isActive');
  expect(response.body.data).toHaveProperty('createdAt');
  expect(response.body.data).toHaveProperty('updatedAt');
}

// ============================================================================
// WAIT HELPERS
// ============================================================================

export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function waitForCondition(
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await wait(interval);
  }
  
  throw new Error(`Condition not met within ${timeout}ms`);
}

// ============================================================================
// MOCK HELPERS
// ============================================================================

export function createMockRequest(overrides: any = {}) {
  return {
    method: 'GET',
    url: '/test',
    headers: {},
    body: {},
    query: {},
    params: {},
    user: null,
    ...overrides
  };
}

export function createMockResponse() {
  const res: any = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    header: vi.fn().mockReturnThis(),
    locals: {}
  };
  return res;
}

export function createMockNext() {
  return vi.fn();
}
