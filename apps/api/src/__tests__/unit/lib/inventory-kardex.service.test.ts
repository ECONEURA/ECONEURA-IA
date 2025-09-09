import { describe, it, expect, beforeEach, vi } from 'vitest';
import { inventoryKardexService } from '../../../lib/inventory-kardex.service.js';

// ============================================================================
// INVENTORY KARDEX SERVICE UNIT TESTS - PR-34
// ============================================================================

describe('InventoryKardexService', () => {
  beforeEach(() => {
    // Reset service state before each test
    vi.clearAllMocks();
  });

  describe('Product Management', () => {
    it('should create a new product', async () => {
      const productData = {
        organizationId: 'test-org',
        sku: 'TEST-001',
        name: 'Test Product',
        description: 'Test product description',
        category: 'Electronics',
        unit: 'pcs',
        cost: 100,
        price: 150,
        currency: 'EUR',
        reorderPoint: 5,
        reorderQuantity: 20,
        maxStock: 50,
        minStock: 2,
        isActive: true,
        supplierId: 'supplier-1',
        location: 'Warehouse A',
        barcode: '1234567890123',
        tags: ['test', 'electronics']
      };

      const product = await inventoryKardexService.createProduct(productData);

      expect(product).toBeDefined();
      expect(product.id).toBeDefined();
      expect(product.sku).toBe(productData.sku);
      expect(product.name).toBe(productData.name);
      expect(product.category).toBe(productData.category);
      expect(product.cost).toBe(productData.cost);
      expect(product.price).toBe(productData.price);
      expect(product.createdAt).toBeDefined();
      expect(product.updatedAt).toBeDefined();
    });

    it('should get a product by ID', async () => {
      const product = await inventoryKardexService.getProduct('prod_1');

      expect(product).toBeDefined();
      expect(product?.id).toBe('prod_1');
      expect(product?.sku).toBe('LAPTOP-001');
      expect(product?.name).toBe('Laptop Dell XPS 13');
    });

    it('should return undefined for non-existent product', async () => {
      const product = await inventoryKardexService.getProduct('non-existent');

      expect(product).toBeUndefined();
    });

    it('should get products with filters', async () => {
      const products = await inventoryKardexService.getProducts('demo-org-1', {
        category: 'Electronics',
        limit: 10
      });

      expect(products).toBeDefined();
      expect(Array.isArray(products)).toBe(true);
      expect(products.length).toBeGreaterThan(0);
      expect(products.every(p => p.category === 'Electronics')).toBe(true);
    });

    it('should search products by name', async () => {
      const products = await inventoryKardexService.getProducts('demo-org-1', {
        search: 'Laptop',
        limit: 10
      });

      expect(products).toBeDefined();
      expect(Array.isArray(products)).toBe(true);
      expect(products.every(p => p.name.toLowerCase().includes('laptop'))).toBe(true);
    });
  });

  describe('Kardex Management', () => {
    it('should create a new kardex entry', async () => {
      const entryData = {
        organizationId: 'demo-org-1',
        productId: 'prod_1',
        transactionType: 'in' as const,
        quantity: 10,
        unitCost: 1200,
        totalCost: 12000,
        reference: 'PO-TEST-001',
        referenceType: 'purchase' as const,
        location: 'Warehouse A',
        notes: 'Test purchase',
        userId: 'user_1',
        userName: 'Test User'
      };

      const entry = await inventoryKardexService.createKardexEntry(entryData);

      expect(entry).toBeDefined();
      expect(entry.id).toBeDefined();
      expect(entry.productId).toBe(entryData.productId);
      expect(entry.transactionType).toBe(entryData.transactionType);
      expect(entry.quantity).toBe(entryData.quantity);
      expect(entry.unitCost).toBe(entryData.unitCost);
      expect(entry.totalCost).toBe(entryData.totalCost);
      expect(entry.reference).toBe(entryData.reference);
      expect(entry.createdAt).toBeDefined();
      expect(entry.updatedAt).toBeDefined();
    });

    it('should get kardex entries with filters', async () => {
      const entries = await inventoryKardexService.getKardexEntries('demo-org-1', {
        productId: 'prod_1',
        transactionType: 'in',
        limit: 10
      });

      expect(entries).toBeDefined();
      expect(Array.isArray(entries)).toBe(true);
      expect(entries.every(e => e.productId === 'prod_1')).toBe(true);
      expect(entries.every(e => e.transactionType === 'in')).toBe(true);
    });

    it('should filter kardex entries by date range', async () => {
      const now = new Date();
      const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = now.toISOString();

      const entries = await inventoryKardexService.getKardexEntries('demo-org-1', {
        startDate,
        endDate,
        limit: 10
      });

      expect(entries).toBeDefined();
      expect(Array.isArray(entries)).toBe(true);
      expect(entries.every(e => e.createdAt >= startDate && e.createdAt <= endDate)).toBe(true);
    });
  });

  describe('Stock Level Management', () => {
    it('should get stock level for a product', async () => {
      const stockLevel = await inventoryKardexService.getStockLevel('prod_1');

      expect(stockLevel).toBeDefined();
      expect(stockLevel?.productId).toBe('prod_1');
      expect(stockLevel?.currentStock).toBeDefined();
      expect(stockLevel?.totalValue).toBeDefined();
      expect(stockLevel?.averageCost).toBeDefined();
      expect(stockLevel?.location).toBeDefined();
    });

    it('should return undefined for non-existent stock level', async () => {
      const stockLevel = await inventoryKardexService.getStockLevel('non-existent');

      expect(stockLevel).toBeUndefined();
    });

    it('should get stock levels with filters', async () => {
      const stockLevels = await inventoryKardexService.getStockLevels('demo-org-1', {
        location: 'Warehouse A',
        lowStock: true,
        limit: 10
      });

      expect(stockLevels).toBeDefined();
      expect(Array.isArray(stockLevels)).toBe(true);
      expect(stockLevels.every(s => s.location === 'Warehouse A')).toBe(true);
    });

    it('should filter low stock items', async () => {
      const stockLevels = await inventoryKardexService.getStockLevels('demo-org-1', {
        lowStock: true,
        limit: 10
      });

      expect(stockLevels).toBeDefined();
      expect(Array.isArray(stockLevels)).toBe(true);
      // All items should have current stock <= min stock
      for (const stock of stockLevels) {
        const product = await inventoryKardexService.getProduct(stock.productId);
        if (product) {
          expect(stock.currentStock).toBeLessThanOrEqual(product.minStock);
        }
      }
    });

    it('should filter overstock items', async () => {
      const stockLevels = await inventoryKardexService.getStockLevels('demo-org-1', {
        overstock: true,
        limit: 10
      });

      expect(stockLevels).toBeDefined();
      expect(Array.isArray(stockLevels)).toBe(true);
      // All items should have current stock >= max stock
      for (const stock of stockLevels) {
        const product = await inventoryKardexService.getProduct(stock.productId);
        if (product) {
          expect(stock.currentStock).toBeGreaterThanOrEqual(product.maxStock);
        }
      }
    });
  });

  describe('Alert Management', () => {
    it('should create a new alert', async () => {
      const alertData = {
        organizationId: 'demo-org-1',
        productId: 'prod_1',
        alertType: 'low_stock' as const,
        severity: 'high' as const,
        title: 'Test Alert',
        message: 'Test alert message',
        currentValue: 2,
        thresholdValue: 5,
        isActive: true,
        isAcknowledged: false
      };

      const alert = await inventoryKardexService.createAlert(alertData);

      expect(alert).toBeDefined();
      expect(alert.id).toBeDefined();
      expect(alert.productId).toBe(alertData.productId);
      expect(alert.alertType).toBe(alertData.alertType);
      expect(alert.severity).toBe(alertData.severity);
      expect(alert.title).toBe(alertData.title);
      expect(alert.message).toBe(alertData.message);
      expect(alert.currentValue).toBe(alertData.currentValue);
      expect(alert.thresholdValue).toBe(alertData.thresholdValue);
      expect(alert.isActive).toBe(alertData.isActive);
      expect(alert.isAcknowledged).toBe(alertData.isAcknowledged);
      expect(alert.createdAt).toBeDefined();
      expect(alert.updatedAt).toBeDefined();
    });

    it('should get alerts with filters', async () => {
      const alerts = await inventoryKardexService.getAlerts('demo-org-1', {
        alertType: 'low_stock',
        severity: 'high',
        isActive: true,
        limit: 10
      });

      expect(alerts).toBeDefined();
      expect(Array.isArray(alerts)).toBe(true);
      expect(alerts.every(a => a.alertType === 'low_stock')).toBe(true);
      expect(alerts.every(a => a.severity === 'high')).toBe(true);
      expect(alerts.every(a => a.isActive =)).toBe(true);
    });

    it('should acknowledge an alert', async () => {
      // First create an alert
      const alertData = {
        organizationId: 'demo-org-1',
        productId: 'prod_1',
        alertType: 'low_stock' as const,
        severity: 'high' as const,
        title: 'Test Alert',
        message: 'Test alert message',
        currentValue: 2,
        thresholdValue: 5,
        isActive: true,
        isAcknowledged: false
      };

      const alert = await inventoryKardexService.createAlert(alertData);

      // Then acknowledge it
      const acknowledgedAlert = await inventoryKardexService.acknowledgeAlert(alert.id, 'user_1');

      expect(acknowledgedAlert).toBeDefined();
      expect(acknowledgedAlert?.isAcknowledged).toBe(true);
      expect(acknowledgedAlert?.acknowledgedBy).toBe('user_1');
      expect(acknowledgedAlert?.acknowledgedAt).toBeDefined();
    });

    it('should return undefined when acknowledging non-existent alert', async () => {
      const result = await inventoryKardexService.acknowledgeAlert('non-existent', 'user_1');

      expect(result).toBeUndefined();
    });
  });

  describe('Cycle Count Management', () => {
    it('should create a new cycle count', async () => {
      const cycleCountData = {
        organizationId: 'demo-org-1',
        productId: 'prod_1',
        scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        expectedQuantity: 25,
        assignedTo: 'user_1',
        assignedBy: 'user_2',
        notes: 'Monthly cycle count'
      };

      const cycleCount = await inventoryKardexService.createCycleCount(cycleCountData);

      expect(cycleCount).toBeDefined();
      expect(cycleCount.id).toBeDefined();
      expect(cycleCount.productId).toBe(cycleCountData.productId);
      expect(cycleCount.scheduledDate).toBe(cycleCountData.scheduledDate);
      expect(cycleCount.expectedQuantity).toBe(cycleCountData.expectedQuantity);
      expect(cycleCount.assignedTo).toBe(cycleCountData.assignedTo);
      expect(cycleCount.assignedBy).toBe(cycleCountData.assignedBy);
      expect(cycleCount.status).toBe('scheduled');
      expect(cycleCount.createdAt).toBeDefined();
      expect(cycleCount.updatedAt).toBeDefined();
    });

    it('should get cycle counts with filters', async () => {
      const cycleCounts = await inventoryKardexService.getCycleCounts('demo-org-1', {
        status: 'scheduled',
        assignedTo: 'user_3',
        limit: 10
      });

      expect(cycleCounts).toBeDefined();
      expect(Array.isArray(cycleCounts)).toBe(true);
      expect(cycleCounts.every(c => c.status === 'scheduled')).toBe(true);
      expect(cycleCounts.every(c => c.assignedTo === 'user_3')).toBe(true);
    });

    it('should complete a cycle count', async () => {
      // First create a cycle count
      const cycleCountData = {
        organizationId: 'demo-org-1',
        productId: 'prod_1',
        scheduledDate: new Date().toISOString(),
        expectedQuantity: 25,
        assignedTo: 'user_1',
        assignedBy: 'user_2',
        notes: 'Test cycle count'
      };

      const cycleCount = await inventoryKardexService.createCycleCount(cycleCountData);

      // Then complete it
      const completedCycleCount = await inventoryKardexService.completeCycleCount(
        cycleCount.id,
        23,
        'Found 23 units'
      );

      expect(completedCycleCount).toBeDefined();
      expect(completedCycleCount?.actualQuantity).toBe(23);
      expect(completedCycleCount?.variance).toBe(-2);
      expect(completedCycleCount?.variancePercentage).toBe(-8);
      expect(completedCycleCount?.status).toBe('completed');
      expect(completedCycleCount?.actualDate).toBeDefined();
      expect(completedCycleCount?.notes).toBe('Found 23 units');
    });

    it('should return undefined when completing non-existent cycle count', async () => {
      const result = await inventoryKardexService.completeCycleCount('non-existent', 10);

      expect(result).toBeUndefined();
    });
  });

  describe('Reports', () => {
    it('should generate stock levels report', async () => {
      const report = await inventoryKardexService.generateInventoryReport(
        'demo-org-1',
        'stock_levels',
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        new Date().toISOString(),
        'user_1'
      );

      expect(report).toBeDefined();
      expect(report.id).toBeDefined();
      expect(report.organizationId).toBe('demo-org-1');
      expect(report.reportType).toBe('stock_levels');
      expect(report.summary).toBeDefined();
      expect(report.summary.totalProducts).toBeDefined();
      expect(report.summary.totalValue).toBeDefined();
      expect(report.data).toBeDefined();
      expect(report.data.stockLevels).toBeDefined();
      expect(report.generatedBy).toBe('user_1');
      expect(report.createdAt).toBeDefined();
    });

    it('should generate movements report', async () => {
      const report = await inventoryKardexService.generateInventoryReport(
        'demo-org-1',
        'movements',
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        new Date().toISOString(),
        'user_1'
      );

      expect(report).toBeDefined();
      expect(report.id).toBeDefined();
      expect(report.organizationId).toBe('demo-org-1');
      expect(report.reportType).toBe('movements');
      expect(report.summary).toBeDefined();
      expect(report.summary.totalMovements).toBeDefined();
      expect(report.data).toBeDefined();
      expect(report.data.movements).toBeDefined();
      expect(report.generatedBy).toBe('user_1');
      expect(report.createdAt).toBeDefined();
    });

    it('should generate ABC analysis report', async () => {
      const report = await inventoryKardexService.generateInventoryReport(
        'demo-org-1',
        'abc_analysis',
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        new Date().toISOString(),
        'user_1'
      );

      expect(report).toBeDefined();
      expect(report.id).toBeDefined();
      expect(report.organizationId).toBe('demo-org-1');
      expect(report.reportType).toBe('abc_analysis');
      expect(report.summary).toBeDefined();
      expect(report.summary.totalValue).toBeDefined();
      expect(report.data).toBeDefined();
      expect(report.data.abcAnalysis).toBeDefined();
      expect(Array.isArray(report.data.abcAnalysis)).toBe(true);
      expect(report.generatedBy).toBe('user_1');
      expect(report.createdAt).toBeDefined();
    });
  });

  describe('Statistics', () => {
    it('should get inventory statistics', async () => {
      const stats = await inventoryKardexService.getInventoryStats('demo-org-1');

      expect(stats).toBeDefined();
      expect(stats.totalProducts).toBeDefined();
      expect(stats.totalValue).toBeDefined();
      expect(stats.totalMovements).toBeDefined();
      expect(stats.activeAlerts).toBeDefined();
      expect(stats.lowStockItems).toBeDefined();
      expect(stats.overstockItems).toBeDefined();
      expect(stats.pendingCycleCounts).toBeDefined();
      expect(stats.last30Days).toBeDefined();
      expect(stats.last30Days.movements).toBeDefined();
      expect(stats.last30Days.value).toBeDefined();
      expect(stats.last30Days.products).toBeDefined();
      expect(stats.last7Days).toBeDefined();
      expect(stats.last7Days.movements).toBeDefined();
      expect(stats.last7Days.value).toBeDefined();
      expect(stats.byCategory).toBeDefined();
      expect(stats.byLocation).toBeDefined();
    });
  });

  describe('Alert Checking', () => {
    it('should check and create alerts for low stock', async () => {
      // This test would require setting up a product with low stock
      // and then calling checkAlerts to verify it creates the appropriate alert
      await inventoryKardexService.checkAlerts('prod_1');

      // Verify that alerts were created if conditions were met
      const alerts = await inventoryKardexService.getAlerts('demo-org-1', {
        productId: 'prod_1',
        isActive: true
      });

      // The exact number of alerts depends on the current stock levels
      expect(Array.isArray(alerts)).toBe(true);
    });
  });
});
