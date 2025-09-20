import { structuredLogger } from './structured-logger.js';

// Inventory Kardex Service - PR-34
// Sistema completo de inventario con Kardex y alertas inteligentes

interface Product {
  id: string;
  organizationId: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  unit: string; // 'pcs', 'kg', 'm', 'l', etc.
  cost: number;
  price: number;
  currency: string;
  reorderPoint: number;
  reorderQuantity: number;
  maxStock: number;
  minStock: number;
  isActive: boolean;
  supplierId?: string;
  location: string;
  barcode?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface KardexEntry {
  id: string;
  organizationId: string;
  productId: string;
  transactionType: 'in' | 'out' | 'adjustment' | 'transfer' | 'return' | 'waste' | 'cycle_count';
  quantity: number;
  unitCost: number;
  totalCost: number;
  reference: string; // Invoice, order, adjustment number
  referenceType: 'purchase' | 'sale' | 'adjustment' | 'transfer' | 'return' | 'cycle_count' | 'waste';
  location: string;
  notes?: string;
  userId: string;
  userName: string;
  createdAt: string;
  updatedAt: string;
}

interface StockLevel {
  productId: string;
  organizationId: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  totalValue: number;
  averageCost: number;
  lastMovement: string;
  lastMovementType: string;
  location: string;
  updatedAt: string;
}

interface Alert {
  id: string;
  organizationId: string;
  productId: string;
  alertType: 'low_stock' | 'overstock' | 'reorder_point' | 'negative_stock' | 'slow_moving' | 'expired' | 'cycle_count_due';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  currentValue: number;
  thresholdValue: number;
  isActive: boolean;
  isAcknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface CycleCount {
  id: string;
  organizationId: string;
  productId: string;
  scheduledDate: string;
  actualDate?: string;
  expectedQuantity: number;
  actualQuantity?: number;
  variance?: number;
  variancePercentage?: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo: string;
  assignedBy: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface InventoryReport {
  id: string;
  organizationId: string;
  reportType: 'stock_levels' | 'movements' | 'valuation' | 'abc_analysis' | 'cycle_count_summary';
  period: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalProducts: number;
    totalValue: number;
    totalMovements: number;
    activeAlerts: number;
    lowStockItems: number;
    overstockItems: number;
  };
  data: any;
  generatedBy: string;
  createdAt: string;
}

class InventoryKardexService {
  private products: Map<string, Product> = new Map();
  private kardexEntries: Map<string, KardexEntry> = new Map();
  private stockLevels: Map<string, StockLevel> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private cycleCounts: Map<string, CycleCount> = new Map();

  constructor() {
    this.init();
  }

  init() {
    this.createDemoData();
    structuredLogger.info('Inventory Kardex Service initialized');
  }

  private createDemoData() {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    // Demo products
    const product1: Product = {
      id: 'prod_1',
      organizationId: 'demo-org-1',
      sku: 'LAPTOP-001',
      name: 'Laptop Dell XPS 13',
      description: 'Laptop Dell XPS 13, 16GB RAM, 512GB SSD',
      category: 'Electronics',
      unit: 'pcs',
      cost: 1200,
      price: 1500,
      currency: 'EUR',
      reorderPoint: 5,
      reorderQuantity: 20,
      maxStock: 50,
      minStock: 2,
      isActive: true,
      supplierId: 'supp_1',
      location: 'Warehouse A',
      barcode: '1234567890123',
      tags: ['laptop', 'dell', 'xps'],
      createdAt: threeDaysAgo.toISOString(),
      updatedAt: threeDaysAgo.toISOString()
    };

    const product2: Product = {
      id: 'prod_2',
      organizationId: 'demo-org-1',
      sku: 'MOUSE-001',
      name: 'Mouse Logitech MX Master 3',
      description: 'Mouse inalámbrico Logitech MX Master 3',
      category: 'Accessories',
      unit: 'pcs',
      cost: 80,
      price: 100,
      currency: 'EUR',
      reorderPoint: 10,
      reorderQuantity: 50,
      maxStock: 100,
      minStock: 5,
      isActive: true,
      supplierId: 'supp_2',
      location: 'Warehouse A',
      barcode: '1234567890124',
      tags: ['mouse', 'logitech', 'wireless'],
      createdAt: threeDaysAgo.toISOString(),
      updatedAt: threeDaysAgo.toISOString()
    };

    const product3: Product = {
      id: 'prod_3',
      organizationId: 'demo-org-1',
      sku: 'KEYBOARD-001',
      name: 'Teclado Mecánico Corsair K95',
      description: 'Teclado mecánico gaming Corsair K95 RGB',
      category: 'Accessories',
      unit: 'pcs',
      cost: 150,
      price: 200,
      currency: 'EUR',
      reorderPoint: 8,
      reorderQuantity: 30,
      maxStock: 60,
      minStock: 3,
      isActive: true,
      supplierId: 'supp_1',
      location: 'Warehouse B',
      barcode: '1234567890125',
      tags: ['keyboard', 'corsair', 'gaming'],
      createdAt: threeDaysAgo.toISOString(),
      updatedAt: threeDaysAgo.toISOString()
    };

    this.products.set(product1.id, product1);
    this.products.set(product2.id, product2);
    this.products.set(product3.id, product3);

    // Demo kardex entries
    const entry1: KardexEntry = {
      id: 'kardex_1',
      organizationId: 'demo-org-1',
      productId: 'prod_1',
      transactionType: 'in',
      quantity: 25,
      unitCost: 1200,
      totalCost: 30000,
      reference: 'PO-2024-001',
      referenceType: 'purchase',
      location: 'Warehouse A',
      notes: 'Initial stock',
      userId: 'user_1',
      userName: 'Admin User',
      createdAt: threeDaysAgo.toISOString(),
      updatedAt: threeDaysAgo.toISOString()
    };

    const entry2: KardexEntry = {
      id: 'kardex_2',
      organizationId: 'demo-org-1',
      productId: 'prod_1',
      transactionType: 'out',
      quantity: 3,
      unitCost: 1200,
      totalCost: 3600,
      reference: 'SO-2024-001',
      referenceType: 'sale',
      location: 'Warehouse A',
      notes: 'Sale to customer',
      userId: 'user_2',
      userName: 'Sales User',
      createdAt: twoDaysAgo.toISOString(),
      updatedAt: twoDaysAgo.toISOString()
    };

    const entry3: KardexEntry = {
      id: 'kardex_3',
      organizationId: 'demo-org-1',
      productId: 'prod_2',
      transactionType: 'in',
      quantity: 100,
      unitCost: 80,
      totalCost: 8000,
      reference: 'PO-2024-002',
      referenceType: 'purchase',
      location: 'Warehouse A',
      notes: 'Bulk purchase',
      userId: 'user_1',
      userName: 'Admin User',
      createdAt: twoDaysAgo.toISOString(),
      updatedAt: twoDaysAgo.toISOString()
    };

    this.kardexEntries.set(entry1.id, entry1);
    this.kardexEntries.set(entry2.id, entry2);
    this.kardexEntries.set(entry3.id, entry3);

    // Calculate stock levels
    this.calculateStockLevels();

    // Demo alerts
    const alert1: Alert = {
      id: 'alert_1',
      organizationId: 'demo-org-1',
      productId: 'prod_3',
      alertType: 'low_stock',
      severity: 'high',
      title: 'Low Stock Alert',
      message: 'Keyboard stock is below minimum level (3 units)',
      currentValue: 2,
      thresholdValue: 3,
      isActive: true,
      isAcknowledged: false,
      createdAt: oneDayAgo.toISOString(),
      updatedAt: oneDayAgo.toISOString()
    };

    const alert2: Alert = {
      id: 'alert_2',
      organizationId: 'demo-org-1',
      productId: 'prod_2',
      alertType: 'overstock',
      severity: 'medium',
      title: 'Overstock Alert',
      message: 'Mouse stock is above maximum level (100 units)',
      currentValue: 105,
      thresholdValue: 100,
      isActive: true,
      isAcknowledged: false,
      createdAt: oneDayAgo.toISOString(),
      updatedAt: oneDayAgo.toISOString()
    };

    this.alerts.set(alert1.id, alert1);
    this.alerts.set(alert2.id, alert2);

    // Demo cycle counts
    const cycleCount1: CycleCount = {
      id: 'cycle_1',
      organizationId: 'demo-org-1',
      productId: 'prod_1',
      scheduledDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      expectedQuantity: 22,
      status: 'scheduled',
      assignedTo: 'user_3',
      assignedBy: 'user_1',
      notes: 'Monthly cycle count for high-value item',
      createdAt: oneDayAgo.toISOString(),
      updatedAt: oneDayAgo.toISOString()
    };

    this.cycleCounts.set(cycleCount1.id, cycleCount1);
  }

  private calculateStockLevels() {
    // Calculate current stock levels based on kardex entries
    for (const product of this.products.values()) {
      const entries = Array.from(this.kardexEntries.values())
        .filter(e => e.productId === product.id)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      let currentStock = 0;
      let totalCost = 0;
      let totalQuantity = 0;
      let lastMovement = '';
      let lastMovementType = '';

      for (const entry of entries) {
        if (entry.transactionType === 'in' || entry.transactionType === 'return') {
          currentStock += entry.quantity;
          totalCost += entry.totalCost;
          totalQuantity += entry.quantity;
        } else if (entry.transactionType === 'out' || entry.transactionType === 'waste') {
          currentStock -= entry.quantity;
        } else if (entry.transactionType === 'adjustment') {
          currentStock += entry.quantity;
          totalCost += entry.totalCost;
          totalQuantity += entry.quantity;
        }

        lastMovement = entry.createdAt;
        lastMovementType = entry.transactionType;
      }

      const averageCost = totalQuantity > 0 ? totalCost / totalQuantity : 0;
      const reservedStock = 0; // TODO: Calculate from pending orders

      const stockLevel: StockLevel = {
        productId: product.id,
        organizationId: product.organizationId,
        currentStock,
        reservedStock,
        availableStock: currentStock - reservedStock,
        totalValue: currentStock * averageCost,
        averageCost,
        lastMovement,
        lastMovementType,
        location: product.location,
        updatedAt: new Date().toISOString()
      };

      this.stockLevels.set(product.id, stockLevel);
    }
  }

  // Product Management
  async createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const now = new Date().toISOString();
    const newProduct: Product = {
      id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      ...productData,
      createdAt: now,
      updatedAt: now
    };

    this.products.set(newProduct.id, newProduct);
    structuredLogger.info('Product created', { 
      productId: newProduct.id, 
      organizationId: newProduct.organizationId,
      sku: newProduct.sku,
      name: newProduct.name
    });

    return newProduct;
  }

  async getProduct(productId: string): Promise<Product | undefined> {
    return this.products.get(productId);
  }

  async getProducts(organizationId: string, filters: {
    category?: string;
    location?: string;
    isActive?: boolean;
    search?: string;
    limit?: number;
  } = {}): Promise<Product[]> {
    let products = Array.from(this.products.values())
      .filter(p => p.organizationId === organizationId);

    if (filters.category) {
      products = products.filter(p => p.category === filters.category);
    }

    if (filters.location) {
      products = products.filter(p => p.location === filters.location);
    }

    if (filters.isActive !== undefined) {
      products = products.filter(p => p.isActive === filters.isActive);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.sku.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower)
      );
    }

    if (filters.limit) {
      products = products.slice(0, filters.limit);
    }

    return products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Kardex Management
  async createKardexEntry(entryData: Omit<KardexEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<KardexEntry> {
    const now = new Date().toISOString();
    const newEntry: KardexEntry = {
      id: `kardex_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      ...entryData,
      createdAt: now,
      updatedAt: now
    };

    this.kardexEntries.set(newEntry.id, newEntry);
    
    // Recalculate stock levels
    this.calculateStockLevels();
    
    // Check for alerts
    await this.checkAlerts(newEntry.productId);

    structuredLogger.info('Kardex entry created', { 
      entryId: newEntry.id, 
      organizationId: newEntry.organizationId,
      productId: newEntry.productId,
      transactionType: newEntry.transactionType,
      quantity: newEntry.quantity
    });

    return newEntry;
  }

  async getKardexEntries(organizationId: string, filters: {
    productId?: string;
    transactionType?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  } = {}): Promise<KardexEntry[]> {
    let entries = Array.from(this.kardexEntries.values())
      .filter(e => e.organizationId === organizationId);

    if (filters.productId) {
      entries = entries.filter(e => e.productId === filters.productId);
    }

    if (filters.transactionType) {
      entries = entries.filter(e => e.transactionType === filters.transactionType);
    }

    if (filters.startDate) {
      entries = entries.filter(e => e.createdAt >= filters.startDate!);
    }

    if (filters.endDate) {
      entries = entries.filter(e => e.createdAt <= filters.endDate!);
    }

    if (filters.limit) {
      entries = entries.slice(0, filters.limit);
    }

    return entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Stock Level Management
  async getStockLevel(productId: string): Promise<StockLevel | undefined> {
    return this.stockLevels.get(productId);
  }

  async getStockLevels(organizationId: string, filters: {
    location?: string;
    lowStock?: boolean;
    overstock?: boolean;
    limit?: number;
  } = {}): Promise<StockLevel[]> {
    let stockLevels = Array.from(this.stockLevels.values())
      .filter(s => s.organizationId === organizationId);

    if (filters.location) {
      stockLevels = stockLevels.filter(s => s.location === filters.location);
    }

    if (filters.lowStock) {
      stockLevels = stockLevels.filter(s => {
        const product = this.products.get(s.productId);
        return product && s.currentStock <= product.minStock;
      });
    }

    if (filters.overstock) {
      stockLevels = stockLevels.filter(s => {
        const product = this.products.get(s.productId);
        return product && s.currentStock >= product.maxStock;
      });
    }

    if (filters.limit) {
      stockLevels = stockLevels.slice(0, filters.limit);
    }

    return stockLevels.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  // Alert Management
  async checkAlerts(productId: string): Promise<void> {
    const product = this.products.get(productId);
    const stockLevel = this.stockLevels.get(productId);
    
    if (!product || !stockLevel) return;

    // Check low stock alert
    if (stockLevel.currentStock <= product.minStock) {
      await this.createAlert({
        organizationId: product.organizationId,
        productId: product.id,
        alertType: 'low_stock',
        severity: 'high',
        title: 'Low Stock Alert',
        message: `${product.name} stock is below minimum level (${product.minStock} units)`,
        currentValue: stockLevel.currentStock,
        thresholdValue: product.minStock,
        isActive: true,
        isAcknowledged: false
      });
    }

    // Check overstock alert
    if (stockLevel.currentStock >= product.maxStock) {
      await this.createAlert({
        organizationId: product.organizationId,
        productId: product.id,
        alertType: 'overstock',
        severity: 'medium',
        title: 'Overstock Alert',
        message: `${product.name} stock is above maximum level (${product.maxStock} units)`,
        currentValue: stockLevel.currentStock,
        thresholdValue: product.maxStock,
        isActive: true,
        isAcknowledged: false
      });
    }

    // Check reorder point alert
    if (stockLevel.currentStock <= product.reorderPoint) {
      await this.createAlert({
        organizationId: product.organizationId,
        productId: product.id,
        alertType: 'reorder_point',
        severity: 'medium',
        title: 'Reorder Point Alert',
        message: `${product.name} has reached reorder point (${product.reorderPoint} units)`,
        currentValue: stockLevel.currentStock,
        thresholdValue: product.reorderPoint,
        isActive: true,
        isAcknowledged: false
      });
    }

    // Check negative stock alert
    if (stockLevel.currentStock < 0) {
      await this.createAlert({
        organizationId: product.organizationId,
        productId: product.id,
        alertType: 'negative_stock',
        severity: 'critical',
        title: 'Negative Stock Alert',
        message: `${product.name} has negative stock (${stockLevel.currentStock} units)`,
        currentValue: stockLevel.currentStock,
        thresholdValue: 0,
        isActive: true,
        isAcknowledged: false
      });
    }
  }

  async createAlert(alertData: Omit<Alert, 'id' | 'createdAt' | 'updatedAt'>): Promise<Alert> {
    const now = new Date().toISOString();
    const newAlert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      ...alertData,
      createdAt: now,
      updatedAt: now
    };

    this.alerts.set(newAlert.id, newAlert);
    structuredLogger.warn('Inventory alert created', { 
      alertId: newAlert.id, 
      organizationId: newAlert.organizationId,
      productId: newAlert.productId,
      alertType: newAlert.alertType,
      severity: newAlert.severity
    });

    return newAlert;
  }

  async getAlerts(organizationId: string, filters: {
    alertType?: string;
    severity?: string;
    isActive?: boolean;
    isAcknowledged?: boolean;
    limit?: number;
  } = {}): Promise<Alert[]> {
    let alerts = Array.from(this.alerts.values())
      .filter(a => a.organizationId === organizationId);

    if (filters.alertType) {
      alerts = alerts.filter(a => a.alertType === filters.alertType);
    }

    if (filters.severity) {
      alerts = alerts.filter(a => a.severity === filters.severity);
    }

    if (filters.isActive !== undefined) {
      alerts = alerts.filter(a => a.isActive === filters.isActive);
    }

    if (filters.isAcknowledged !== undefined) {
      alerts = alerts.filter(a => a.isAcknowledged === filters.isAcknowledged);
    }

    if (filters.limit) {
      alerts = alerts.slice(0, filters.limit);
    }

    return alerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<Alert | undefined> {
    const alert = this.alerts.get(alertId);
    if (!alert) return undefined;

    alert.isAcknowledged = true;
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = new Date().toISOString();
    alert.updatedAt = new Date().toISOString();

    this.alerts.set(alertId, alert);
    structuredLogger.info('Alert acknowledged', { 
      alertId, 
      acknowledgedBy,
      alertType: alert.alertType
    });

    return alert;
  }

  // Cycle Count Management
  async createCycleCount(cycleCountData: Omit<CycleCount, 'id' | 'createdAt' | 'updatedAt'>): Promise<CycleCount> {
    const now = new Date().toISOString();
    const newCycleCount: CycleCount = {
      id: `cycle_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      ...cycleCountData,
      status: cycleCountData.status || 'scheduled',
      createdAt: now,
      updatedAt: now
    };

    this.cycleCounts.set(newCycleCount.id, newCycleCount);
    structuredLogger.info('Cycle count created', { 
      cycleCountId: newCycleCount.id, 
      organizationId: newCycleCount.organizationId,
      productId: newCycleCount.productId,
      scheduledDate: newCycleCount.scheduledDate
    });

    return newCycleCount;
  }

  async getCycleCounts(organizationId: string, filters: {
    status?: string;
    assignedTo?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  } = {}): Promise<CycleCount[]> {
    let cycleCounts = Array.from(this.cycleCounts.values())
      .filter(c => c.organizationId === organizationId);

    if (filters.status) {
      cycleCounts = cycleCounts.filter(c => c.status === filters.status);
    }

    if (filters.assignedTo) {
      cycleCounts = cycleCounts.filter(c => c.assignedTo === filters.assignedTo);
    }

    if (filters.startDate) {
      cycleCounts = cycleCounts.filter(c => c.scheduledDate >= filters.startDate!);
    }

    if (filters.endDate) {
      cycleCounts = cycleCounts.filter(c => c.scheduledDate <= filters.endDate!);
    }

    if (filters.limit) {
      cycleCounts = cycleCounts.slice(0, filters.limit);
    }

    return cycleCounts.sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
  }

  async completeCycleCount(cycleCountId: string, actualQuantity: number, notes?: string): Promise<CycleCount | undefined> {
    const cycleCount = this.cycleCounts.get(cycleCountId);
    if (!cycleCount) return undefined;

    cycleCount.actualQuantity = actualQuantity;
    cycleCount.variance = actualQuantity - cycleCount.expectedQuantity;
    cycleCount.variancePercentage = cycleCount.expectedQuantity > 0 ? 
      (cycleCount.variance / cycleCount.expectedQuantity) * 100 : 0;
    cycleCount.status = 'completed';
    cycleCount.actualDate = new Date().toISOString();
    cycleCount.updatedAt = new Date().toISOString();
    
    if (notes) {
      cycleCount.notes = notes;
    }

    this.cycleCounts.set(cycleCountId, cycleCount);

    // Create adjustment entry if there's a variance
    if (cycleCount.variance !== 0) {
      const product = this.products.get(cycleCount.productId);
      if (product) {
        await this.createKardexEntry({
          organizationId: cycleCount.organizationId,
          productId: cycleCount.productId,
          transactionType: 'adjustment',
          quantity: cycleCount.variance,
          unitCost: product.cost,
          totalCost: cycleCount.variance * product.cost,
          reference: `CYCLE-${cycleCountId}`,
          referenceType: 'cycle_count',
          location: product.location,
          notes: `Cycle count adjustment: ${cycleCount.variance > 0 ? '+' : ''}${cycleCount.variance} units`,
          userId: cycleCount.assignedTo,
          userName: 'Cycle Count User'
        });
      }
    }

    structuredLogger.info('Cycle count completed', { 
      cycleCountId, 
      expectedQuantity: cycleCount.expectedQuantity,
      actualQuantity,
      variance: cycleCount.variance
    });

    return cycleCount;
  }

  // Reports
  async generateInventoryReport(organizationId: string, reportType: string, startDate: string, endDate: string, generatedBy: string): Promise<InventoryReport> {
    let summary: any = {};
    let data: any = {};

    switch (reportType) {
      case 'stock_levels': {
        const stockLevels = await this.getStockLevels(organizationId);
        summary = {
          totalProducts: stockLevels.length,
          totalValue: stockLevels.reduce((sum, s) => sum + s.totalValue, 0),
          totalMovements: 0,
          activeAlerts: Array.from(this.alerts.values()).filter(a => a.organizationId === organizationId && a.isActive).length,
          lowStockItems: stockLevels.filter(s => {
            const product = this.products.get(s.productId);
            return product && s.currentStock <= product.minStock;
          }).length,
          overstockItems: stockLevels.filter(s => {
            const product = this.products.get(s.productId);
            return product && s.currentStock >= product.maxStock;
          }).length
        };
        data = { stockLevels };
        break;
      }
      case 'movements': {
        const movements = await this.getKardexEntries(organizationId, { startDate, endDate });
        summary = {
          totalProducts: new Set(movements.map(m => m.productId)).size,
          totalValue: movements.reduce((sum, m) => sum + m.totalCost, 0),
          totalMovements: movements.length,
          activeAlerts: 0,
          lowStockItems: 0,
          overstockItems: 0
        };
        data = { movements };
        break;
      }
      case 'abc_analysis': {
        const allStockLevels = await this.getStockLevels(organizationId);
        const sortedByValue = allStockLevels.sort((a, b) => b.totalValue - a.totalValue);
        const totalValue = sortedByValue.reduce((sum, s) => sum + s.totalValue, 0);
        
        let cumulativeValue = 0;
        const abcAnalysis = sortedByValue.map((stock, index) => {
          cumulativeValue += stock.totalValue;
          const percentage = (stock.totalValue / totalValue) * 100;
          const cumulativePercentage = (cumulativeValue / totalValue) * 100;
          
          let category = 'C';
          if (cumulativePercentage <= 80) category = 'A';
          else if (cumulativePercentage <= 95) category = 'B';
          
          return {
            productId: stock.productId,
            product: this.products.get(stock.productId),
            stockLevel: stock,
            percentage,
            cumulativePercentage,
            category
          };
        });

        summary = {
          totalProducts: abcAnalysis.length,
          totalValue,
          totalMovements: 0,
          activeAlerts: 0,
          lowStockItems: 0,
          overstockItems: 0
        };
        data = { abcAnalysis };
        break;
      }
      default: {
        // handle other report types or do nothing
        break;
      }
    }

    const report: InventoryReport = {
      id: `report_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      organizationId,
      reportType: reportType as any,
      period: { startDate, endDate },
      summary,
      data,
      generatedBy,
      createdAt: new Date().toISOString()
    };

    structuredLogger.info('Inventory report generated', { 
      reportId: report.id, 
      organizationId,
      reportType,
      period: `${startDate} to ${endDate}`
    });

    return report;
  }

  // Statistics
  async getInventoryStats(organizationId: string) {
    const products = Array.from(this.products.values()).filter(p => p.organizationId === organizationId);
    const stockLevels = Array.from(this.stockLevels.values()).filter(s => s.organizationId === organizationId);
    const alerts = Array.from(this.alerts.values()).filter(a => a.organizationId === organizationId);
    const cycleCounts = Array.from(this.cycleCounts.values()).filter(c => c.organizationId === organizationId);

    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentMovements = Array.from(this.kardexEntries.values())
      .filter(e => e.organizationId === organizationId && new Date(e.createdAt) >= last30Days);

    return {
      totalProducts: products.length,
      totalValue: stockLevels.reduce((sum, s) => sum + s.totalValue, 0),
      totalMovements: recentMovements.length,
      activeAlerts: alerts.filter(a => a.isActive).length,
      lowStockItems: stockLevels.filter(s => {
        const product = this.products.get(s.productId);
        return product && s.currentStock <= product.minStock;
      }).length,
      overstockItems: stockLevels.filter(s => {
        const product = this.products.get(s.productId);
        return product && s.currentStock >= product.maxStock;
      }).length,
      pendingCycleCounts: cycleCounts.filter(c => c.status === 'scheduled').length,
      last30Days: {
        movements: recentMovements.length,
        value: recentMovements.reduce((sum, m) => sum + m.totalCost, 0),
        products: new Set(recentMovements.map(m => m.productId)).size
      },
      last7Days: {
        movements: recentMovements.filter(m => new Date(m.createdAt) >= last7Days).length,
        value: recentMovements.filter(m => new Date(m.createdAt) >= last7Days).reduce((sum, m) => sum + m.totalCost, 0)
      },
      byCategory: products.reduce((acc, product) => {
        acc[product.category] = (acc[product.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byLocation: products.reduce((acc, product) => {
        acc[product.location] = (acc[product.location] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }
}

export const inventoryKardexService = new InventoryKardexService();
