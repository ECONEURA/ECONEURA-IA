import request from 'supertest';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import app from '../app.js';
import { db } from '../lib/db.js';
import { products } from '@econeura/db/schema';
import { eq } from 'drizzle-orm';

describe('Products API', () => {
  const testOrgId = 'test-org-123';
  const testUserId = 'test-user-456';

  beforeEach(async () => {
    // Clean up test data
    await db.delete(products).where(eq(products.orgId, testOrgId));
  });

  afterEach(async () => {
    // Clean up test data
    await db.delete(products).where(eq(products.orgId, testOrgId));
  });

  describe('GET /api/products', () => {
    it('should return products with pagination', async () => {
      // Create test products
      const testProducts = [
        {
          orgId: testOrgId,
          name: 'Test Product 1',
          description: 'Test Description 1',
          sku: 'TEST-001',
          category: 'Test Category',
          unit_price: 100.00,
          cost_price: 80.00,
          currency: 'EUR',
          unit: 'piece',
          stock_quantity: 10,
          min_stock_level: 2,
          is_active: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          orgId: testOrgId,
          name: 'Test Product 2',
          description: 'Test Description 2',
          sku: 'TEST-002',
          category: 'Test Category',
          unit_price: 200.00,
          cost_price: 160.00,
          currency: 'EUR',
          unit: 'piece',
          stock_quantity: 5,
          min_stock_level: 1,
          is_active: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      await db.insert(products).values(testProducts);

      const response = await request(app)
        .get('/api/products')
        .set('x-org-id', testOrgId)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.total).toBe(2);
      expect(response.body.pagination.hasMore).toBe(false);
    });

    it('should filter products by category', async () => {
      const testProducts = [
        {
          orgId: testOrgId,
          name: 'Laptop',
          description: 'Test Laptop',
          sku: 'LAP-001',
          category: 'Laptops',
          unit_price: 1000.00,
          cost_price: 800.00,
          currency: 'EUR',
          unit: 'piece',
          stock_quantity: 5,
          min_stock_level: 1,
          is_active: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          orgId: testOrgId,
          name: 'Monitor',
          description: 'Test Monitor',
          sku: 'MON-001',
          category: 'Monitors',
          unit_price: 300.00,
          cost_price: 240.00,
          currency: 'EUR',
          unit: 'piece',
          stock_quantity: 8,
          min_stock_level: 2,
          is_active: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      await db.insert(products).values(testProducts);

      const response = await request(app)
        .get('/api/products?category=Laptops')
        .set('x-org-id', testOrgId)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].category).toBe('Laptops');
    });

    it('should search products by name', async () => {
      const testProducts = [
        {
          orgId: testOrgId,
          name: 'Dell Laptop',
          description: 'Test Laptop',
          sku: 'LAP-001',
          category: 'Laptops',
          unit_price: 1000.00,
          cost_price: 800.00,
          currency: 'EUR',
          unit: 'piece',
          stock_quantity: 5,
          min_stock_level: 1,
          is_active: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          orgId: testOrgId,
          name: 'HP Monitor',
          description: 'Test Monitor',
          sku: 'MON-001',
          category: 'Monitors',
          unit_price: 300.00,
          cost_price: 240.00,
          currency: 'EUR',
          unit: 'piece',
          stock_quantity: 8,
          min_stock_level: 2,
          is_active: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      await db.insert(products).values(testProducts);

      const response = await request(app)
        .get('/api/products?search=Dell')
        .set('x-org-id', testOrgId)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toContain('Dell');
    });

    it('should require organization ID', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(400);

      expect(response.body.title).toBe('Missing Organization ID');
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return a single product', async () => {
      const testProduct = {
        orgId: testOrgId,
        name: 'Test Product',
        description: 'Test Description',
        sku: 'TEST-001',
        category: 'Test Category',
        unit_price: 100.00,
        cost_price: 80.00,
        currency: 'EUR',
        unit: 'piece',
        stock_quantity: 10,
        min_stock_level: 2,
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const [insertedProduct] = await db.insert(products).values(testProduct).returning();

      const response = await request(app)
        .get(`/api/products/${insertedProduct.id}`)
        .set('x-org-id', testOrgId)
        .expect(200);

      expect(response.body.data.id).toBe(insertedProduct.id);
      expect(response.body.data.name).toBe('Test Product');
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .get('/api/products/non-existent-id')
        .set('x-org-id', testOrgId)
        .expect(404);

      expect(response.body.title).toBe('Product Not Found');
    });
  });

  describe('POST /api/products', () => {
    it('should create a new product', async () => {
      const newProduct = {
        name: 'New Product',
        description: 'New Product Description',
        sku: 'NEW-001',
        category: 'New Category',
        unit_price: 150.00,
        cost_price: 120.00,
        currency: 'EUR',
        unit: 'piece',
        stock_quantity: 20,
        min_stock_level: 5,
        is_active: true
      };

      const response = await request(app)
        .post('/api/products')
        .set('x-org-id', testOrgId)
        .set('x-user-id', testUserId)
        .send(newProduct)
        .expect(201);

      expect(response.body.data.name).toBe('New Product');
      expect(response.body.data.org_id).toBe(testOrgId);
      expect(response.body.data.id).toBeDefined();
    });

    it('should validate required fields', async () => {
      const invalidProduct = {
        description: 'Missing name and SKU'
      };

      const response = await request(app)
        .post('/api/products')
        .set('x-org-id', testOrgId)
        .set('x-user-id', testUserId)
        .send(invalidProduct)
        .expect(400);

      expect(response.body.title).toBe('Validation Error');
    });
  });

  describe('PUT /api/products/:id', () => {
    it('should update an existing product', async () => {
      const testProduct = {
        orgId: testOrgId,
        name: 'Original Name',
        description: 'Original Description',
        sku: 'ORIG-001',
        category: 'Original Category',
        unit_price: 100.00,
        cost_price: 80.00,
        currency: 'EUR',
        unit: 'piece',
        stock_quantity: 10,
        min_stock_level: 2,
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const [insertedProduct] = await db.insert(products).values(testProduct).returning();

      const updateData = {
        name: 'Updated Name',
        unit_price: 150.00
      };

      const response = await request(app)
        .put(`/api/products/${insertedProduct.id}`)
        .set('x-org-id', testOrgId)
        .send(updateData)
        .expect(200);

      expect(response.body.data.name).toBe('Updated Name');
      expect(response.body.data.unit_price).toBe(150.00);
      expect(response.body.data.description).toBe('Original Description'); // Should remain unchanged
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .put('/api/products/non-existent-id')
        .set('x-org-id', testOrgId)
        .send({ name: 'Updated Name' })
        .expect(404);

      expect(response.body.title).toBe('Product Not Found');
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('should delete an existing product', async () => {
      const testProduct = {
        orgId: testOrgId,
        name: 'Product to Delete',
        description: 'Will be deleted',
        sku: 'DELETE-001',
        category: 'Test Category',
        unit_price: 100.00,
        cost_price: 80.00,
        currency: 'EUR',
        unit: 'piece',
        stock_quantity: 10,
        min_stock_level: 2,
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const [insertedProduct] = await db.insert(products).values(testProduct).returning();

      await request(app)
        .delete(`/api/products/${insertedProduct.id}`)
        .set('x-org-id', testOrgId)
        .expect(204);

      // Verify product is deleted
      const response = await request(app)
        .get(`/api/products/${insertedProduct.id}`)
        .set('x-org-id', testOrgId)
        .expect(404);
    });
  });

  describe('GET /api/products/categories', () => {
    it('should return unique product categories', async () => {
      const testProducts = [
        {
          orgId: testOrgId,
          name: 'Product 1',
          description: 'Test Product 1',
          sku: 'TEST-001',
          category: 'Laptops',
          unit_price: 100.00,
          cost_price: 80.00,
          currency: 'EUR',
          unit: 'piece',
          stock_quantity: 10,
          min_stock_level: 2,
          is_active: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          orgId: testOrgId,
          name: 'Product 2',
          description: 'Test Product 2',
          sku: 'TEST-002',
          category: 'Monitors',
          unit_price: 200.00,
          cost_price: 160.00,
          currency: 'EUR',
          unit: 'piece',
          stock_quantity: 5,
          min_stock_level: 1,
          is_active: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          orgId: testOrgId,
          name: 'Product 3',
          description: 'Test Product 3',
          sku: 'TEST-003',
          category: 'Laptops',
          unit_price: 300.00,
          cost_price: 240.00,
          currency: 'EUR',
          unit: 'piece',
          stock_quantity: 8,
          min_stock_level: 2,
          is_active: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      await db.insert(products).values(testProducts);

      const response = await request(app)
        .get('/api/products/categories')
        .set('x-org-id', testOrgId)
        .expect(200);

      expect(response.body.data).toContain('Laptops');
      expect(response.body.data).toContain('Monitors');
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe('GET /api/products/low-stock', () => {
    it('should return products with low stock', async () => {
      const testProducts = [
        {
          orgId: testOrgId,
          name: 'Low Stock Product',
          description: 'Product with low stock',
          sku: 'LOW-001',
          category: 'Test Category',
          unit_price: 100.00,
          cost_price: 80.00,
          currency: 'EUR',
          unit: 'piece',
          stock_quantity: 1, // Below min_stock_level
          min_stock_level: 5,
          is_active: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          orgId: testOrgId,
          name: 'Normal Stock Product',
          description: 'Product with normal stock',
          sku: 'NORMAL-001',
          category: 'Test Category',
          unit_price: 200.00,
          cost_price: 160.00,
          currency: 'EUR',
          unit: 'piece',
          stock_quantity: 10, // Above min_stock_level
          min_stock_level: 5,
          is_active: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      await db.insert(products).values(testProducts);

      const response = await request(app)
        .get('/api/products/low-stock')
        .set('x-org-id', testOrgId)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Low Stock Product');
    });
  });
});
