import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../../index.js';

// ============================================================================
// INVENTORY KARDEX API INTEGRATION TESTS - PR-34
// ============================================================================

describe('Inventory Kardex API Integration Tests', () => {
  let testProductId: string;
  let testKardexEntryId: string;
  let testAlertId: string;
  let testCycleCountId: string;

  beforeAll(async () => {
    // Wait for the server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  describe('Product Management Endpoints', () => {
    it('should get products list', async () => {
      const response = await request(app)
        .get('/v1/inventory-kardex/products')
        .query({ organizationId: 'demo-org-1' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.products).toBeDefined();
      expect(Array.isArray(response.body.data.products)).toBe(true);
      expect(response.body.timestamp).toBeDefined();
    });

    it('should create a new product', async () => {
      const productData = {
        organizationId: 'demo-org-1',
        sku: 'TEST-INTEGRATION-001',
        name: 'Integration Test Product',
        description: 'Product created during integration test',
        category: 'Test Category',
        unit: 'pcs',
        cost: 100,
        price: 150,
        currency: 'EUR',
        reorderPoint: 5,
        reorderQuantity: 20,
        maxStock: 50,
        minStock: 2,
        isActive: true,
        supplierId: 'test-supplier',
        location: 'Test Warehouse',
        barcode: '1234567890999',
        tags: ['test', 'integration']
      };

      const response = await request(app)
        .post('/v1/inventory-kardex/products')
        .send(productData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.sku).toBe(productData.sku);
      expect(response.body.data.name).toBe(productData.name);
      expect(response.body.data.category).toBe(productData.category);
      expect(response.body.data.cost).toBe(productData.cost);
      expect(response.body.data.price).toBe(productData.price);
      expect(response.body.timestamp).toBeDefined();

      testProductId = response.body.data.id;
    });

    it('should get a specific product', async () => {
      const response = await request(app)
        .get(`/v1/inventory-kardex/products/${testProductId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(testProductId);
      expect(response.body.data.sku).toBe('TEST-INTEGRATION-001');
      expect(response.body.data.name).toBe('Integration Test Product');
      expect(response.body.timestamp).toBeDefined();
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .get('/v1/inventory-kardex/products/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Product not found');
    });

    it('should filter products by category', async () => {
      const response = await request(app)
        .get('/v1/inventory-kardex/products')
        .query({
          organizationId: 'demo-org-1',
          category: 'Electronics',
          limit: 10
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toBeDefined();
      expect(Array.isArray(response.body.data.products)).toBe(true);
      expect(response.body.data.products.every((p: any) => p.category === 'Electronics')).toBe(true);
    });

    it('should search products by name', async () => {
      const response = await request(app)
        .get('/v1/inventory-kardex/products')
        .query({
          organizationId: 'demo-org-1',
          search: 'Laptop',
          limit: 10
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toBeDefined();
      expect(Array.isArray(response.body.data.products)).toBe(true);
      expect(response.body.data.products.every((p: any) =>
        p.name.toLowerCase().includes('laptop')
      )).toBe(true);
    });
  });

  describe('Kardex Management Endpoints', () => {
    it('should get kardex entries', async () => {
      const response = await request(app)
        .get('/v1/inventory-kardex/kardex')
        .query({ organizationId: 'demo-org-1' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.entries).toBeDefined();
      expect(Array.isArray(response.body.data.entries)).toBe(true);
      expect(response.body.timestamp).toBeDefined();
    });

    it('should create a new kardex entry', async () => {
      const entryData = {
        organizationId: 'demo-org-1',
        productId: testProductId,
        transactionType: 'in',
        quantity: 10,
        unitCost: 100,
        totalCost: 1000,
        reference: 'PO-INTEGRATION-001',
        referenceType: 'purchase',
        location: 'Test Warehouse',
        notes: 'Integration test purchase',
        userId: 'test-user',
        userName: 'Test User'
      };

      const response = await request(app)
        .post('/v1/inventory-kardex/kardex')
        .send(entryData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.productId).toBe(entryData.productId);
      expect(response.body.data.transactionType).toBe(entryData.transactionType);
      expect(response.body.data.quantity).toBe(entryData.quantity);
      expect(response.body.data.unitCost).toBe(entryData.unitCost);
      expect(response.body.data.totalCost).toBe(entryData.totalCost);
      expect(response.body.data.reference).toBe(entryData.reference);
      expect(response.body.timestamp).toBeDefined();

      testKardexEntryId = response.body.data.id;
    });

    it('should filter kardex entries by product', async () => {
      const response = await request(app)
        .get('/v1/inventory-kardex/kardex')
        .query({
          organizationId: 'demo-org-1',
          productId: testProductId,
          limit: 10
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.entries).toBeDefined();
      expect(Array.isArray(response.body.data.entries)).toBe(true);
      expect(response.body.data.entries.every((e: any) => e.productId === testProductId)).toBe(true);
    });

    it('should filter kardex entries by transaction type', async () => {
      const response = await request(app)
        .get('/v1/inventory-kardex/kardex')
        .query({
          organizationId: 'demo-org-1',
          transactionType: 'in',
          limit: 10
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.entries).toBeDefined();
      expect(Array.isArray(response.body.data.entries)).toBe(true);
      expect(response.body.data.entries.every((e: any) => e.transactionType === 'in')).toBe(true);
    });
  });

  describe('Stock Level Management Endpoints', () => {
    it('should get stock levels', async () => {
      const response = await request(app)
        .get('/v1/inventory-kardex/stock-levels')
        .query({ organizationId: 'demo-org-1' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.stockLevels).toBeDefined();
      expect(Array.isArray(response.body.data.stockLevels)).toBe(true);
      expect(response.body.timestamp).toBeDefined();
    });

    it('should get stock level for specific product', async () => {
      const response = await request(app)
        .get(`/v1/inventory-kardex/stock-levels/${testProductId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.productId).toBe(testProductId);
      expect(response.body.data.currentStock).toBeDefined();
      expect(response.body.data.totalValue).toBeDefined();
      expect(response.body.data.averageCost).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
    });

    it('should return 404 for non-existent stock level', async () => {
      const response = await request(app)
        .get('/v1/inventory-kardex/stock-levels/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Stock level not found');
    });

    it('should filter low stock items', async () => {
      const response = await request(app)
        .get('/v1/inventory-kardex/stock-levels')
        .query({
          organizationId: 'demo-org-1',
          lowStock: true,
          limit: 10
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stockLevels).toBeDefined();
      expect(Array.isArray(response.body.data.stockLevels)).toBe(true);
    });

    it('should filter overstock items', async () => {
      const response = await request(app)
        .get('/v1/inventory-kardex/stock-levels')
        .query({
          organizationId: 'demo-org-1',
          overstock: true,
          limit: 10
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stockLevels).toBeDefined();
      expect(Array.isArray(response.body.data.stockLevels)).toBe(true);
    });
  });

  describe('Alert Management Endpoints', () => {
    it('should get alerts', async () => {
      const response = await request(app)
        .get('/v1/inventory-kardex/alerts')
        .query({ organizationId: 'demo-org-1' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.alerts).toBeDefined();
      expect(Array.isArray(response.body.data.alerts)).toBe(true);
      expect(response.body.timestamp).toBeDefined();
    });

    it('should create a new alert', async () => {
      const alertData = {
        organizationId: 'demo-org-1',
        productId: testProductId,
        alertType: 'low_stock',
        severity: 'high',
        title: 'Integration Test Alert',
        message: 'Test alert created during integration test',
        currentValue: 2,
        thresholdValue: 5,
        isActive: true,
        isAcknowledged: false
      };

      const response = await request(app)
        .post('/v1/inventory-kardex/alerts')
        .send(alertData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.productId).toBe(alertData.productId);
      expect(response.body.data.alertType).toBe(alertData.alertType);
      expect(response.body.data.severity).toBe(alertData.severity);
      expect(response.body.data.title).toBe(alertData.title);
      expect(response.body.data.message).toBe(alertData.message);
      expect(response.body.data.currentValue).toBe(alertData.currentValue);
      expect(response.body.data.thresholdValue).toBe(alertData.thresholdValue);
      expect(response.body.data.isActive).toBe(alertData.isActive);
      expect(response.body.data.isAcknowledged).toBe(alertData.isAcknowledged);
      expect(response.body.timestamp).toBeDefined();

      testAlertId = response.body.data.id;
    });

    it('should get a specific alert', async () => {
      const response = await request(app)
        .get(`/v1/inventory-kardex/alerts/${testAlertId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(testAlertId);
      expect(response.body.data.title).toBe('Integration Test Alert');
      expect(response.body.timestamp).toBeDefined();
    });

    it('should acknowledge an alert', async () => {
      const response = await request(app)
        .post(`/v1/inventory-kardex/alerts/${testAlertId}/acknowledge`)
        .send({ acknowledgedBy: 'test-user' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(testAlertId);
      expect(response.body.data.isAcknowledged).toBe(true);
      expect(response.body.data.acknowledgedBy).toBe('test-user');
      expect(response.body.data.acknowledgedAt).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
    });

    it('should resolve an alert', async () => {
      const response = await request(app)
        .post(`/v1/inventory-kardex/alerts/${testAlertId}/resolve`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(testAlertId);
      expect(response.body.timestamp).toBeDefined();
    });

    it('should filter alerts by type', async () => {
      const response = await request(app)
        .get('/v1/inventory-kardex/alerts')
        .query({
          organizationId: 'demo-org-1',
          alertType: 'low_stock',
          limit: 10
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.alerts).toBeDefined();
      expect(Array.isArray(response.body.data.alerts)).toBe(true);
      expect(response.body.data.alerts.every((a: any) => a.alertType === 'low_stock')).toBe(true);
    });

    it('should filter alerts by severity', async () => {
      const response = await request(app)
        .get('/v1/inventory-kardex/alerts')
        .query({
          organizationId: 'demo-org-1',
          severity: 'high',
          limit: 10
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.alerts).toBeDefined();
      expect(Array.isArray(response.body.data.alerts)).toBe(true);
      expect(response.body.data.alerts.every((a: any) => a.severity === 'high')).toBe(true);
    });

    it('should filter active alerts', async () => {
      const response = await request(app)
        .get('/v1/inventory-kardex/alerts')
        .query({
          organizationId: 'demo-org-1',
          isActive: true,
          limit: 10
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.alerts).toBeDefined();
      expect(Array.isArray(response.body.data.alerts)).toBe(true);
      expect(response.body.data.alerts.every((a: any) => a.isActive =)).toBe(true);
    });
  });

  describe('Cycle Count Management Endpoints', () => {
    it('should get cycle counts', async () => {
      const response = await request(app)
        .get('/v1/inventory-kardex/cycle-counts')
        .query({ organizationId: 'demo-org-1' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.cycleCounts).toBeDefined();
      expect(Array.isArray(response.body.data.cycleCounts)).toBe(true);
      expect(response.body.timestamp).toBeDefined();
    });

    it('should create a new cycle count', async () => {
      const cycleCountData = {
        organizationId: 'demo-org-1',
        productId: testProductId,
        scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        expectedQuantity: 10,
        assignedTo: 'test-user',
        assignedBy: 'admin-user',
        notes: 'Integration test cycle count'
      };

      const response = await request(app)
        .post('/v1/inventory-kardex/cycle-counts')
        .send(cycleCountData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.productId).toBe(cycleCountData.productId);
      expect(response.body.data.scheduledDate).toBe(cycleCountData.scheduledDate);
      expect(response.body.data.expectedQuantity).toBe(cycleCountData.expectedQuantity);
      expect(response.body.data.assignedTo).toBe(cycleCountData.assignedTo);
      expect(response.body.data.assignedBy).toBe(cycleCountData.assignedBy);
      expect(response.body.data.status).toBe('scheduled');
      expect(response.body.timestamp).toBeDefined();

      testCycleCountId = response.body.data.id;
    });

    it('should complete a cycle count', async () => {
      const response = await request(app)
        .post(`/v1/inventory-kardex/cycle-counts/${testCycleCountId}/complete`)
        .send({
          actualQuantity: 9,
          notes: 'Found 9 units during count'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(testCycleCountId);
      expect(response.body.data.actualQuantity).toBe(9);
      expect(response.body.data.variance).toBe(-1);
      expect(response.body.data.variancePercentage).toBe(-10);
      expect(response.body.data.status).toBe('completed');
      expect(response.body.data.actualDate).toBeDefined();
      expect(response.body.data.notes).toBe('Found 9 units during count');
      expect(response.body.timestamp).toBeDefined();
    });

    it('should filter cycle counts by status', async () => {
      const response = await request(app)
        .get('/v1/inventory-kardex/cycle-counts')
        .query({
          organizationId: 'demo-org-1',
          status: 'scheduled',
          limit: 10
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cycleCounts).toBeDefined();
      expect(Array.isArray(response.body.data.cycleCounts)).toBe(true);
      expect(response.body.data.cycleCounts.every((c: any) => c.status === 'scheduled')).toBe(true);
    });
  });

  describe('Reports Endpoints', () => {
    it('should generate inventory report', async () => {
      const reportData = {
        organizationId: 'demo-org-1',
        reportType: 'stock_levels',
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
        generatedBy: 'test-user'
      };

      const response = await request(app)
        .post('/v1/inventory-kardex/reports')
        .send(reportData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.organizationId).toBe(reportData.organizationId);
      expect(response.body.data.reportType).toBe(reportData.reportType);
      expect(response.body.data.period).toBeDefined();
      expect(response.body.data.summary).toBeDefined();
      expect(response.body.data.data).toBeDefined();
      expect(response.body.data.generatedBy).toBe(reportData.generatedBy);
      expect(response.body.data.createdAt).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
    });

    it('should generate movements report', async () => {
      const reportData = {
        organizationId: 'demo-org-1',
        reportType: 'movements',
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
        generatedBy: 'test-user'
      };

      const response = await request(app)
        .post('/v1/inventory-kardex/reports')
        .send(reportData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.reportType).toBe('movements');
      expect(response.body.data.data.movements).toBeDefined();
      expect(Array.isArray(response.body.data.data.movements)).toBe(true);
    });

    it('should generate ABC analysis report', async () => {
      const reportData = {
        organizationId: 'demo-org-1',
        reportType: 'abc_analysis',
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
        generatedBy: 'test-user'
      };

      const response = await request(app)
        .post('/v1/inventory-kardex/reports')
        .send(reportData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.reportType).toBe('abc_analysis');
      expect(response.body.data.data.abcAnalysis).toBeDefined();
      expect(Array.isArray(response.body.data.data.abcAnalysis)).toBe(true);
    });
  });

  describe('Statistics Endpoints', () => {
    it('should get inventory statistics', async () => {
      const response = await request(app)
        .get('/v1/inventory-kardex/stats')
        .query({ organizationId: 'demo-org-1' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.totalProducts).toBeDefined();
      expect(response.body.data.totalValue).toBeDefined();
      expect(response.body.data.totalMovements).toBeDefined();
      expect(response.body.data.activeAlerts).toBeDefined();
      expect(response.body.data.lowStockItems).toBeDefined();
      expect(response.body.data.overstockItems).toBeDefined();
      expect(response.body.data.pendingCycleCounts).toBeDefined();
      expect(response.body.data.last30Days).toBeDefined();
      expect(response.body.data.last7Days).toBeDefined();
      expect(response.body.data.byCategory).toBeDefined();
      expect(response.body.data.byLocation).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('Health Check Endpoints', () => {
    it('should get inventory health status', async () => {
      const response = await request(app)
        .get('/v1/inventory-kardex/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.status).toBe('ok');
      expect(response.body.data.totalProducts).toBeDefined();
      expect(response.body.data.totalValue).toBeDefined();
      expect(response.body.data.activeAlerts).toBeDefined();
      expect(response.body.data.lowStockItems).toBeDefined();
      expect(response.body.data.overstockItems).toBeDefined();
      expect(response.body.data.lastUpdated).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('Validation and Error Handling', () => {
    it('should return 400 for invalid product data', async () => {
      const invalidProductData = {
        organizationId: 'demo-org-1',
        sku: '', // Invalid: empty SKU
        name: '', // Invalid: empty name
        category: 'invalid_category',
        cost: -100 // Invalid: negative cost
      };

      const response = await request(app)
        .post('/v1/inventory-kardex/products')
        .send(invalidProductData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid request data');
      expect(response.body.details).toBeDefined();
    });

    it('should return 400 for invalid kardex entry data', async () => {
      const invalidEntryData = {
        organizationId: 'demo-org-1',
        productId: 'non-existent-product',
        transactionType: 'invalid_type',
        quantity: -5, // Invalid: negative quantity
        unitCost: -100, // Invalid: negative unit cost
        totalCost: -500, // Invalid: negative total cost
        reference: '', // Invalid: empty reference
        referenceType: 'invalid_reference_type',
        location: '', // Invalid: empty location
        userId: '', // Invalid: empty user ID
        userName: '' // Invalid: empty user name
      };

      const response = await request(app)
        .post('/v1/inventory-kardex/kardex')
        .send(invalidEntryData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid request data');
      expect(response.body.details).toBeDefined();
    });

    it('should return 400 for invalid alert data', async () => {
      const invalidAlertData = {
        organizationId: 'demo-org-1',
        productId: 'non-existent-product',
        alertType: 'invalid_alert_type',
        severity: 'invalid_severity',
        title: '', // Invalid: empty title
        message: '', // Invalid: empty message
        currentValue: -1, // Invalid: negative current value
        thresholdValue: -1, // Invalid: negative threshold value
        isActive: 'invalid_boolean', // Invalid: not a boolean
        isAcknowledged: 'invalid_boolean' // Invalid: not a boolean
      };

      const response = await request(app)
        .post('/v1/inventory-kardex/alerts')
        .send(invalidAlertData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid request data');
      expect(response.body.details).toBeDefined();
    });

    it('should return 400 for invalid cycle count data', async () => {
      const invalidCycleCountData = {
        organizationId: 'demo-org-1',
        productId: 'non-existent-product',
        scheduledDate: 'invalid-date', // Invalid: not a valid date
        expectedQuantity: -1, // Invalid: negative expected quantity
        assignedTo: '', // Invalid: empty assigned to
        assignedBy: '' // Invalid: empty assigned by
      };

      const response = await request(app)
        .post('/v1/inventory-kardex/cycle-counts')
        .send(invalidCycleCountData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid request data');
      expect(response.body.details).toBeDefined();
    });

    it('should return 400 for invalid report data', async () => {
      const invalidReportData = {
        organizationId: 'demo-org-1',
        reportType: 'invalid_report_type',
        startDate: 'invalid-date', // Invalid: not a valid date
        endDate: 'invalid-date', // Invalid: not a valid date
        generatedBy: '' // Invalid: empty generated by
      };

      const response = await request(app)
        .post('/v1/inventory-kardex/reports')
        .send(invalidReportData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid request data');
      expect(response.body.details).toBeDefined();
    });
  });
});
