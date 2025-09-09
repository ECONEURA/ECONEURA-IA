import { z } from 'zod';

// ============================================================================
// TIPOS Y ESQUEMAS
// ============================================================================

export const ProductCategorySchema = z.enum(['electronics', 'clothing', 'food', 'books', 'tools', 'furniture', 'other']);
export type ProductCategory = z.infer<typeof ProductCategorySchema>;

export const TransactionTypeSchema = z.enum(['purchase', 'sale', 'return', 'adjustment', 'transfer', 'damage', 'expiry']);
export type TransactionType = z.infer<typeof TransactionTypeSchema>;

export const AlertTypeSchema = z.enum(['low_stock', 'out_of_stock', 'overstock', 'expiry_warning', 'expiry_critical']);
export type AlertType = z.infer<typeof AlertTypeSchema>;

export const AlertStatusSchema = z.enum(['active', 'acknowledged', 'resolved', 'dismissed']);
export type AlertStatus = z.infer<typeof AlertStatusSchema>;

// ============================================================================
// ESQUEMAS DE PRODUCTOS
// ============================================================================

export const ProductSchema = z.object({
  id: z.string(),
  sku: z.string(),
  name: z.string(),
  description: z.string().optional(),
  category: ProductCategorySchema,
  unit: z.string(), // unidades, kg, litros, etc.
  cost: z.number().positive(),
  price: z.number().positive(),
  minStock: z.number().min(0),
  maxStock: z.number().min(0),
  currentStock: z.number().min(0),
  reorderPoint: z.number().min(0),
  reorderQuantity: z.number().positive(),
  supplier: z.string().optional(),
  location: z.string().optional(),
  expiryDate: z.date().optional(),
  barcode: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// ============================================================================
// ESQUEMAS DE TRANSACCIONES KARDEX
// ============================================================================

export const KardexTransactionSchema = z.object({
  id: z.string(),
  productId: z.string(),
  type: TransactionTypeSchema,
  quantity: z.number(),
  unitCost: z.number().positive(),
  totalCost: z.number().positive(),
  reference: z.string().optional(), // factura, orden, etc.
  notes: z.string().optional(),
  location: z.string().optional(),
  supplier: z.string().optional(),
  customer: z.string().optional(),
  userId: z.string().optional(),
  orgId: z.string(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.date(),
});

// ============================================================================
// ESQUEMAS DE ALERTAS
// ============================================================================

export const StockAlertSchema = z.object({
  id: z.string(),
  productId: z.string(),
  type: AlertTypeSchema,
  status: AlertStatusSchema,
  message: z.string(),
  threshold: z.number(),
  currentValue: z.number(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  acknowledgedBy: z.string().optional(),
  acknowledgedAt: z.date().optional(),
  resolvedAt: z.date().optional(),
  orgId: z.string(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// ============================================================================
// ESQUEMAS DE REPORTES
// ============================================================================

export const InventoryReportSchema = z.object({
  totalProducts: z.number(),
  totalValue: z.number(),
  lowStockItems: z.number(),
  outOfStockItems: z.number(),
  overstockItems: z.number(),
  expiringItems: z.number(),
  turnoverRate: z.number(),
  averageCost: z.number(),
  topProducts: z.array(z.object({
    productId: z.string(),
    productName: z.string(),
    quantity: z.number(),
    value: z.number(),
  })),
  categoryBreakdown: z.record(z.object({
    count: z.number(),
    value: z.number(),
  })),
  recentTransactions: z.array(z.object({
    id: z.string(),
    productName: z.string(),
    type: TransactionTypeSchema,
    quantity: z.number(),
    date: z.date(),
  })),
});

// ============================================================================
// INTERFACES
// ============================================================================

export interface IInventorySystem {
  // Productos
  createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product>;
  getProduct(id: string): Promise<Product | null>;
  updateProduct(id: string, updates: Partial<Product>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  listProducts(filters?: ProductFilters): Promise<Product[]>;

  // Transacciones Kardex
  addTransaction(transaction: Omit<KardexTransaction, 'id' | 'createdAt'>): Promise<KardexTransaction>;
  getTransaction(id: string): Promise<KardexTransaction | null>;
  listTransactions(filters?: TransactionFilters): Promise<KardexTransaction[]>;
  getProductKardex(productId: string): Promise<KardexTransaction[]>;

  // Alertas
  createAlert(alert: Omit<StockAlert, 'id' | 'createdAt' | 'updatedAt'>): Promise<StockAlert>;
  getAlert(id: string): Promise<StockAlert | null>;
  updateAlert(id: string, updates: Partial<StockAlert>): Promise<StockAlert>;
  deleteAlert(id: string): Promise<void>;
  listAlerts(filters?: AlertFilters): Promise<StockAlert[]>;
  acknowledgeAlert(id: string, userId: string): Promise<void>;
  resolveAlert(id: string): Promise<void>;

  // Reportes
  getInventoryReport(): Promise<InventoryReport>;
  getProductReport(productId: string): Promise<any>;
  getKardexReport(productId: string, fromDate?: Date, toDate?: Date): Promise<any>;

  // Utilidades
  checkStockLevels(): Promise<void>;
  calculateTurnoverRate(productId: string, days?: number): Promise<number>;
  getLowStockProducts(): Promise<Product[]>;
  getExpiringProducts(days?: number): Promise<Product[]>;
}

export interface ProductFilters {
  category?: ProductCategory;
  supplier?: string;
  location?: string;
  lowStock?: boolean;
  outOfStock?: boolean;
  overstock?: boolean;
  expiring?: boolean;
  tags?: string[];
}

export interface TransactionFilters {
  productId?: string;
  type?: TransactionType;
  fromDate?: Date;
  toDate?: Date;
  userId?: string;
  orgId?: string;
}

export interface AlertFilters {
  productId?: string;
  type?: AlertType;
  status?: AlertStatus;
  severity?: string;
  fromDate?: Date;
  toDate?: Date;
  orgId?: string;
}

// ============================================================================
// TIPOS DERIVADOS
// ============================================================================

export type Product = z.infer<typeof ProductSchema>;
export type KardexTransaction = z.infer<typeof KardexTransactionSchema>;
export type StockAlert = z.infer<typeof StockAlertSchema>;
export type InventoryReport = z.infer<typeof InventoryReportSchema>;

// ============================================================================
// IMPLEMENTACIÓN DEL SISTEMA DE INVENTARIO
// ============================================================================

class InventorySystemImpl implements IInventorySystem {
  private products: Map<string, Product> = new Map();
  private transactions: Map<string, KardexTransaction> = new Map();
  private alerts: Map<string, StockAlert> = new Map();

  constructor() {
    this.initializeSampleData();
  }

  // ============================================================================
  // GESTIÓN DE PRODUCTOS
  // ============================================================================

  async createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const id = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const newProduct: Product = {
      ...product,
      id,
      createdAt: now,
      updatedAt: now,
    };

    this.products.set(id, newProduct);

    // Verificar niveles de stock después de crear
    await this.checkStockLevels();

    return newProduct;
  }

  async getProduct(id: string): Promise<Product | null> {
    return this.products.get(id) || null;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const product = this.products.get(id);
    if (!product) {
      throw new Error(`Product ${id} not found`);
    }

    const updatedProduct: Product = {
      ...product,
      ...updates,
      updatedAt: new Date(),
    };

    this.products.set(id, updatedProduct);

    // Verificar niveles de stock después de actualizar
    await this.checkStockLevels();

    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<void> {
    const product = this.products.get(id);
    if (!product) {
      throw new Error(`Product ${id} not found`);
    }

    // Verificar que no hay transacciones pendientes
    const pendingTransactions = Array.from(this.transactions.values()).filter(
      t => t.productId === id
    );

    if (pendingTransactions.length > 0) {
      throw new Error(`Cannot delete product with ${pendingTransactions.length} transactions`);
    }

    this.products.delete(id);
  }

  async listProducts(filters?: ProductFilters): Promise<Product[]> {
    let products = Array.from(this.products.values());

    if (filters?.category) {
      products = products.filter(p => p.category === filters.category);
    }

    if (filters?.supplier) {
      products = products.filter(p => p.supplier === filters.supplier);
    }

    if (filters?.location) {
      products = products.filter(p => p.location === filters.location);
    }

    if (filters?.lowStock) {
      products = products.filter(p => p.currentStock <= p.reorderPoint);
    }

    if (filters?.outOfStock) {
      products = products.filter(p => p.currentStock === 0);
    }

    if (filters?.overstock) {
      products = products.filter(p => p.currentStock > p.maxStock);
    }

    if (filters?.expiring) {
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      products = products.filter(p =>
        p.expiryDate && p.expiryDate <= thirtyDaysFromNow && p.currentStock > 0
      );
    }

    if (filters?.tags && filters.tags.length > 0) {
      products = products.filter(p =>
        p.tags?.some(tag => filters.tags!.includes(tag))
      );
    }

    return products.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  // ============================================================================
  // GESTIÓN DE TRANSACCIONES KARDEX
  // ============================================================================

  async addTransaction(transaction: Omit<KardexTransaction, 'id' | 'createdAt'>): Promise<KardexTransaction> {
    const id = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const newTransaction: KardexTransaction = {
      ...transaction,
      id,
      createdAt: now,
    };

    // Actualizar stock del producto
    const product = this.products.get(transaction.productId);
    if (!product) {
      throw new Error(`Product ${transaction.productId} not found`);
    }

    let newStock = product.currentStock;
    switch (transaction.type) {
      case 'purchase':
      case 'return':
        newStock += transaction.quantity;
        break;
      case 'sale':
      case 'damage':
      case 'expiry':
        newStock -= transaction.quantity;
        break;
      case 'adjustment':
        newStock = transaction.quantity; // Ajuste directo
        break;
      case 'transfer':
        // Para transferencias, asumimos que es entre ubicaciones
        // El stock total no cambia, solo la ubicación
        break;
    }

    if (newStock < 0) {
      throw new Error(`Insufficient stock for transaction. Current: ${product.currentStock}, Required: ${transaction.quantity}`);
    }

    // Actualizar producto
    await this.updateProduct(transaction.productId, {
      currentStock: newStock,
    });

    this.transactions.set(id, newTransaction);

    // Verificar niveles de stock después de la transacción
    await this.checkStockLevels();

    return newTransaction;
  }

  async getTransaction(id: string): Promise<KardexTransaction | null> {
    return this.transactions.get(id) || null;
  }

  async listTransactions(filters?: TransactionFilters): Promise<KardexTransaction[]> {
    let transactions = Array.from(this.transactions.values());

    if (filters?.productId) {
      transactions = transactions.filter(t => t.productId === filters.productId);
    }

    if (filters?.type) {
      transactions = transactions.filter(t => t.type === filters.type);
    }

    if (filters?.fromDate) {
      transactions = transactions.filter(t => t.createdAt >= filters.fromDate!);
    }

    if (filters?.toDate) {
      transactions = transactions.filter(t => t.createdAt <= filters.toDate!);
    }

    if (filters?.userId) {
      transactions = transactions.filter(t => t.userId === filters.userId);
    }

    if (filters?.orgId) {
      transactions = transactions.filter(t => t.orgId === filters.orgId);
    }

    return transactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getProductKardex(productId: string): Promise<KardexTransaction[]> {
    return this.listTransactions({ productId });
  }

  // ============================================================================
  // GESTIÓN DE ALERTAS
  // ============================================================================

  async createAlert(alert: Omit<StockAlert, 'id' | 'createdAt' | 'updatedAt'>): Promise<StockAlert> {
    const id = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const newAlert: StockAlert = {
      ...alert,
      id,
      createdAt: now,
      updatedAt: now,
    };

    this.alerts.set(id, newAlert);
    return newAlert;
  }

  async getAlert(id: string): Promise<StockAlert | null> {
    return this.alerts.get(id) || null;
  }

  async updateAlert(id: string, updates: Partial<StockAlert>): Promise<StockAlert> {
    const alert = this.alerts.get(id);
    if (!alert) {
      throw new Error(`Alert ${id} not found`);
    }

    const updatedAlert: StockAlert = {
      ...alert,
      ...updates,
      updatedAt: new Date(),
    };

    this.alerts.set(id, updatedAlert);
    return updatedAlert;
  }

  async deleteAlert(id: string): Promise<void> {
    const alert = this.alerts.get(id);
    if (!alert) {
      throw new Error(`Alert ${id} not found`);
    }

    this.alerts.delete(id);
  }

  async listAlerts(filters?: AlertFilters): Promise<StockAlert[]> {
    let alerts = Array.from(this.alerts.values());

    if (filters?.productId) {
      alerts = alerts.filter(a => a.productId === filters.productId);
    }

    if (filters?.type) {
      alerts = alerts.filter(a => a.type === filters.type);
    }

    if (filters?.status) {
      alerts = alerts.filter(a => a.status === filters.status);
    }

    if (filters?.severity) {
      alerts = alerts.filter(a => a.severity === filters.severity);
    }

    if (filters?.fromDate) {
      alerts = alerts.filter(a => a.createdAt >= filters.fromDate!);
    }

    if (filters?.toDate) {
      alerts = alerts.filter(a => a.createdAt <= filters.toDate!);
    }

    if (filters?.orgId) {
      alerts = alerts.filter(a => a.orgId === filters.orgId);
    }

    return alerts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async acknowledgeAlert(id: string, userId: string): Promise<void> {
    await this.updateAlert(id, {
      status: 'acknowledged',
      acknowledgedBy: userId,
      acknowledgedAt: new Date(),
    });
  }

  async resolveAlert(id: string): Promise<void> {
    await this.updateAlert(id, {
      status: 'resolved',
      resolvedAt: new Date(),
    });
  }

  // ============================================================================
  // REPORTES
  // ============================================================================

  async getInventoryReport(): Promise<InventoryReport> {
    const products = Array.from(this.products.values());
    const transactions = Array.from(this.transactions.values());

    const totalProducts = products.length;
    const totalValue = products.reduce((sum, p) => sum + (p.currentStock * p.cost), 0);
    const lowStockItems = products.filter(p => p.currentStock <= p.reorderPoint).length;
    const outOfStockItems = products.filter(p => p.currentStock === 0).length;
    const overstockItems = products.filter(p => p.currentStock > p.maxStock).length;

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiringItems = products.filter(p =>
      p.expiryDate && p.expiryDate <= thirtyDaysFromNow && p.currentStock > 0
    ).length;

    // Calcular tasa de rotación promedio
    let totalTurnoverRate = 0;
    for (const product of products) {
      totalTurnoverRate += await this.calculateTurnoverRate(product.id);
    }
    const turnoverRate = products.length > 0 ? totalTurnoverRate / products.length : 0;

    const averageCost = products.length > 0
      ? products.reduce((sum, p) => sum + p.cost, 0) / products.length
      : 0;

    // Top productos por valor
    const topProducts = products
      .map(p => ({
        productId: p.id,
        productName: p.name,
        quantity: p.currentStock,
        value: p.currentStock * p.cost,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Desglose por categoría
    const categoryBreakdown: Record<string, { count: number; value: number }> = {};
    products.forEach(p => {
      if (!categoryBreakdown[p.category]) {
        categoryBreakdown[p.category] = { count: 0, value: 0 };
      }
      categoryBreakdown[p.category].count++;
      categoryBreakdown[p.category].value += p.currentStock * p.cost;
    });

    // Transacciones recientes
    const recentTransactions = transactions
      .slice(0, 10)
      .map(t => {
        const product = products.find(p => p.id === t.productId);
        return {
          id: t.id,
          productName: product?.name || 'Unknown',
          type: t.type,
          quantity: t.quantity,
          date: t.createdAt,
        };
      });

    return {
      totalProducts,
      totalValue,
      lowStockItems,
      outOfStockItems,
      overstockItems,
      expiringItems,
      turnoverRate,
      averageCost,
      topProducts,
      categoryBreakdown,
      recentTransactions,
    };
  }

  async getProductReport(productId: string): Promise<any> {
    const product = await this.getProduct(productId);
    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }

    const transactions = await this.getProductKardex(productId);
    const alerts = await this.listAlerts({ productId });
    const turnoverRate = await this.calculateTurnoverRate(productId);

    return {
      product,
      transactions: transactions.slice(0, 20), // Últimas 20 transacciones
      alerts: alerts.filter(a => a.status === 'active'),
      turnoverRate,
      stockLevel: {
        current: product.currentStock,
        min: product.minStock,
        max: product.maxStock,
        reorderPoint: product.reorderPoint,
        percentage: (product.currentStock / product.maxStock) * 100,
      },
    };
  }

  async getKardexReport(productId: string, fromDate?: Date, toDate?: Date): Promise<any> {
    const product = await this.getProduct(productId);
    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }

    const filters: TransactionFilters = { productId };
    if (fromDate) filters.fromDate = fromDate;
    if (toDate) filters.toDate = toDate;

    const transactions = await this.listTransactions(filters);

    // Calcular movimientos
    const movements = transactions.map(t => ({
      date: t.createdAt,
      type: t.type,
      quantity: t.quantity,
      unitCost: t.unitCost,
      totalCost: t.totalCost,
      balance: this.calculateBalance(transactions, t.createdAt),
      reference: t.reference,
      notes: t.notes,
    }));

    return {
      product,
      movements,
      summary: {
        totalTransactions: transactions.length,
        totalPurchases: transactions.filter(t => t.type === 'purchase').length,
        totalSales: transactions.filter(t => t.type === 'sale').length,
        totalPurchased: transactions
          .filter(t => t.type === 'purchase')
          .reduce((sum, t) => sum + t.quantity, 0),
        totalSold: transactions
          .filter(t => t.type === 'sale')
          .reduce((sum, t) => sum + t.quantity, 0),
        averageCost: transactions.length > 0
          ? transactions.reduce((sum, t) => sum + t.unitCost, 0) / transactions.length
          : 0,
      },
    };
  }

  // ============================================================================
  // UTILIDADES
  // ============================================================================

  async checkStockLevels(): Promise<void> {
    const products = Array.from(this.products.values());

    for (const product of products) {
      // Verificar stock bajo
      if (product.currentStock <= product.reorderPoint && product.currentStock > 0) {
        await this.createLowStockAlert(product);
      }

      // Verificar stock agotado
      if (product.currentStock === 0) {
        await this.createOutOfStockAlert(product);
      }

      // Verificar sobrestock
      if (product.currentStock > product.maxStock) {
        await this.createOverstockAlert(product);
      }

      // Verificar productos próximos a vencer
      if (product.expiryDate) {
        const now = new Date();
        const daysUntilExpiry = Math.ceil((product.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry <= 7 && product.currentStock > 0) {
          await this.createExpiryAlert(product, 'critical');
        } else if (daysUntilExpiry <= 30 && product.currentStock > 0) {
          await this.createExpiryAlert(product, 'high');
        }
      }
    }
  }

  async calculateTurnoverRate(productId: string, days: number = 365): Promise<number> {
    const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const transactions = await this.listTransactions({
      productId,
      fromDate,
      type: 'sale'
    });

    const totalSold = transactions.reduce((sum, t) => sum + t.quantity, 0);
    const product = await this.getProduct(productId);

    if (!product || product.currentStock === 0) {
      return 0;
    }

    return totalSold / product.currentStock;
  }

  async getLowStockProducts(): Promise<Product[]> {
    return this.listProducts({ lowStock: true });
  }

  async getExpiringProducts(days: number = 30): Promise<Product[]> {
    const products = Array.from(this.products.values());
    const cutoffDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    return products.filter(p => ;
      p.expiryDate && p.expiryDate <= cutoffDate && p.currentStock > 0
    );
  }

  // ============================================================================
  // MÉTODOS PRIVADOS PARA ALERTAS
  // ============================================================================

  private async createLowStockAlert(product: Product): Promise<void> {
    const existingAlert = Array.from(this.alerts.values()).find(a =>
      a.productId === product.id &&
      a.type === 'low_stock' &&
      a.status === 'active'
    );

    if (!existingAlert) {
      await this.createAlert({
        productId: product.id,
        type: 'low_stock',
        status: 'active',
        message: `Low stock alert: ${product.name} has ${product.currentStock} units remaining`,
        threshold: product.reorderPoint,
        currentValue: product.currentStock,
        severity: 'medium',
        orgId: 'demo-org',
      });
    }
  }

  private async createOutOfStockAlert(product: Product): Promise<void> {
    const existingAlert = Array.from(this.alerts.values()).find(a =>
      a.productId === product.id &&
      a.type === 'out_of_stock' &&
      a.status === 'active'
    );

    if (!existingAlert) {
      await this.createAlert({
        productId: product.id,
        type: 'out_of_stock',
        status: 'active',
        message: `Out of stock alert: ${product.name} is completely out of stock`,
        threshold: 0,
        currentValue: 0,
        severity: 'critical',
        orgId: 'demo-org',
      });
    }
  }

  private async createOverstockAlert(product: Product): Promise<void> {
    const existingAlert = Array.from(this.alerts.values()).find(a =>
      a.productId === product.id &&
      a.type === 'overstock' &&
      a.status === 'active'
    );

    if (!existingAlert) {
      await this.createAlert({
        productId: product.id,
        type: 'overstock',
        status: 'active',
        message: `Overstock alert: ${product.name} has ${product.currentStock} units (max: ${product.maxStock})`,
        threshold: product.maxStock,
        currentValue: product.currentStock,
        severity: 'medium',
        orgId: 'demo-org',
      });
    }
  }

  private async createExpiryAlert(product: Product, severity: 'high' | 'critical'): Promise<void> {
    const alertType = severity === 'critical' ? 'expiry_critical' : 'expiry_warning';
    const existingAlert = Array.from(this.alerts.values()).find(a =>
      a.productId === product.id &&
      a.type === alertType &&
      a.status === 'active'
    );

    if (!existingAlert && product.expiryDate) {
      const daysUntilExpiry = Math.ceil((product.expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

      await this.createAlert({
        productId: product.id,
        type: alertType,
        status: 'active',
        message: `Expiry alert: ${product.name} expires in ${daysUntilExpiry} days`,
        threshold: severity === 'critical' ? 7 : 30,
        currentValue: daysUntilExpiry,
        severity,
        orgId: 'demo-org',
      });
    }
  }

  private calculateBalance(transactions: KardexTransaction[], upToDate: Date): number {
    return transactions;
      .filter(t => t.createdAt <= upToDate)
      .reduce((balance, t) => {
        switch (t.type) {
          case 'purchase':
          case 'return':
            return balance + t.quantity;
          case 'sale':
          case 'damage':
          case 'expiry':
            return balance - t.quantity;
          case 'adjustment':
            return t.quantity; // Ajuste directo
          case 'transfer':
            return balance; // No cambia el balance total
          default:
            return balance;
        }
      }, 0);
  }

  // ============================================================================
  // DATOS DE EJEMPLO
  // ============================================================================

  private initializeSampleData(): void {
    // Crear productos de ejemplo
    const sampleProducts: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        sku: 'LAPTOP-001',
        name: 'Laptop Dell XPS 13',
        description: 'Laptop ultrabook de 13 pulgadas',
        category: 'electronics',
        unit: 'units',
        cost: 800,
        price: 1200,
        minStock: 5,
        maxStock: 50,
        currentStock: 15,
        reorderPoint: 10,
        reorderQuantity: 20,
        supplier: 'Dell Inc.',
        location: 'Warehouse A',
        tags: ['laptop', 'ultrabook', 'dell'],
      },
      {
        sku: 'MOUSE-001',
        name: 'Mouse Logitech MX Master',
        description: 'Mouse inalámbrico ergonómico',
        category: 'electronics',
        unit: 'units',
        cost: 50,
        price: 80,
        minStock: 10,
        maxStock: 100,
        currentStock: 8,
        reorderPoint: 15,
        reorderQuantity: 30,
        supplier: 'Logitech',
        location: 'Warehouse A',
        tags: ['mouse', 'wireless', 'ergonomic'],
      },
      {
        sku: 'BOOK-001',
        name: 'Clean Code by Robert Martin',
        description: 'Libro sobre buenas prácticas de programación',
        category: 'books',
        unit: 'units',
        cost: 25,
        price: 40,
        minStock: 3,
        maxStock: 20,
        currentStock: 0,
        reorderPoint: 5,
        reorderQuantity: 10,
        supplier: 'Prentice Hall',
        location: 'Warehouse B',
        tags: ['programming', 'clean-code', 'robert-martin'],
      },
      {
        sku: 'FOOD-001',
        name: 'Organic Bananas',
        description: 'Plátanos orgánicos frescos',
        category: 'food',
        unit: 'kg',
        cost: 2,
        price: 4,
        minStock: 50,
        maxStock: 200,
        currentStock: 30,
        reorderPoint: 60,
        reorderQuantity: 100,
        supplier: 'Organic Farms Co.',
        location: 'Cold Storage',
        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
        tags: ['organic', 'fresh', 'bananas'],
      },
    ];

    // Crear productos
    sampleProducts.forEach(async (product) => {
      await this.createProduct(product);
    });

    // Crear algunas transacciones de ejemplo
    setTimeout(async () => {
      const products = Array.from(this.products.values());

      if (products.length > 0) {
        // Compra inicial
        await this.addTransaction({
          productId: products[0].id,
          type: 'purchase',
          quantity: 20,
          unitCost: products[0].cost,
          totalCost: 20 * products[0].cost,
          reference: 'PO-2024-001',
          notes: 'Initial stock purchase',
          supplier: products[0].supplier,
          orgId: 'demo-org',
        });

        // Venta
        await this.addTransaction({
          productId: products[0].id,
          type: 'sale',
          quantity: 5,
          unitCost: products[0].cost,
          totalCost: 5 * products[0].cost,
          reference: 'SO-2024-001',
          notes: 'Customer sale',
          customer: 'Customer A',
          orgId: 'demo-org',
        });
      }
    }, 1000);
  }
}

// Instancia global
export const inventorySystem = new InventorySystemImpl();
