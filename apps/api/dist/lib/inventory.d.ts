import { z } from 'zod';
export declare const ProductCategorySchema: z.ZodEnum<["electronics", "clothing", "food", "books", "tools", "furniture", "other"]>;
export type ProductCategory = z.infer<typeof ProductCategorySchema>;
export declare const TransactionTypeSchema: z.ZodEnum<["purchase", "sale", "return", "adjustment", "transfer", "damage", "expiry"]>;
export type TransactionType = z.infer<typeof TransactionTypeSchema>;
export declare const AlertTypeSchema: z.ZodEnum<["low_stock", "out_of_stock", "overstock", "expiry_warning", "expiry_critical"]>;
export type AlertType = z.infer<typeof AlertTypeSchema>;
export declare const AlertStatusSchema: z.ZodEnum<["active", "acknowledged", "resolved", "dismissed"]>;
export type AlertStatus = z.infer<typeof AlertStatusSchema>;
export declare const ProductSchema: z.ZodObject<{
    id: z.ZodString;
    sku: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    category: z.ZodEnum<["electronics", "clothing", "food", "books", "tools", "furniture", "other"]>;
    unit: z.ZodString;
    cost: z.ZodNumber;
    price: z.ZodNumber;
    minStock: z.ZodNumber;
    maxStock: z.ZodNumber;
    currentStock: z.ZodNumber;
    reorderPoint: z.ZodNumber;
    reorderQuantity: z.ZodNumber;
    supplier: z.ZodOptional<z.ZodString>;
    location: z.ZodOptional<z.ZodString>;
    expiryDate: z.ZodOptional<z.ZodDate>;
    barcode: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    name?: string;
    metadata?: Record<string, any>;
    id?: string;
    location?: string;
    tags?: string[];
    createdAt?: Date;
    updatedAt?: Date;
    description?: string;
    category?: "electronics" | "clothing" | "food" | "books" | "tools" | "furniture" | "other";
    sku?: string;
    unit?: string;
    cost?: number;
    supplier?: string;
    price?: number;
    minStock?: number;
    maxStock?: number;
    currentStock?: number;
    reorderPoint?: number;
    reorderQuantity?: number;
    expiryDate?: Date;
    barcode?: string;
}, {
    name?: string;
    metadata?: Record<string, any>;
    id?: string;
    location?: string;
    tags?: string[];
    createdAt?: Date;
    updatedAt?: Date;
    description?: string;
    category?: "electronics" | "clothing" | "food" | "books" | "tools" | "furniture" | "other";
    sku?: string;
    unit?: string;
    cost?: number;
    supplier?: string;
    price?: number;
    minStock?: number;
    maxStock?: number;
    currentStock?: number;
    reorderPoint?: number;
    reorderQuantity?: number;
    expiryDate?: Date;
    barcode?: string;
}>;
export declare const KardexTransactionSchema: z.ZodObject<{
    id: z.ZodString;
    productId: z.ZodString;
    type: z.ZodEnum<["purchase", "sale", "return", "adjustment", "transfer", "damage", "expiry"]>;
    quantity: z.ZodNumber;
    unitCost: z.ZodNumber;
    totalCost: z.ZodNumber;
    reference: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    location: z.ZodOptional<z.ZodString>;
    supplier: z.ZodOptional<z.ZodString>;
    customer: z.ZodOptional<z.ZodString>;
    userId: z.ZodOptional<z.ZodString>;
    orgId: z.ZodString;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    type?: "purchase" | "sale" | "return" | "adjustment" | "transfer" | "damage" | "expiry";
    userId?: string;
    metadata?: Record<string, any>;
    id?: string;
    location?: string;
    orgId?: string;
    customer?: string;
    createdAt?: Date;
    notes?: string;
    reference?: string;
    quantity?: number;
    supplier?: string;
    productId?: string;
    unitCost?: number;
    totalCost?: number;
}, {
    type?: "purchase" | "sale" | "return" | "adjustment" | "transfer" | "damage" | "expiry";
    userId?: string;
    metadata?: Record<string, any>;
    id?: string;
    location?: string;
    orgId?: string;
    customer?: string;
    createdAt?: Date;
    notes?: string;
    reference?: string;
    quantity?: number;
    supplier?: string;
    productId?: string;
    unitCost?: number;
    totalCost?: number;
}>;
export declare const StockAlertSchema: z.ZodObject<{
    id: z.ZodString;
    productId: z.ZodString;
    type: z.ZodEnum<["low_stock", "out_of_stock", "overstock", "expiry_warning", "expiry_critical"]>;
    status: z.ZodEnum<["active", "acknowledged", "resolved", "dismissed"]>;
    message: z.ZodString;
    threshold: z.ZodNumber;
    currentValue: z.ZodNumber;
    severity: z.ZodEnum<["low", "medium", "high", "critical"]>;
    acknowledgedBy: z.ZodOptional<z.ZodString>;
    acknowledgedAt: z.ZodOptional<z.ZodDate>;
    resolvedAt: z.ZodOptional<z.ZodDate>;
    orgId: z.ZodString;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    message?: string;
    type?: "overstock" | "low_stock" | "out_of_stock" | "expiry_warning" | "expiry_critical";
    status?: "acknowledged" | "active" | "resolved" | "dismissed";
    metadata?: Record<string, any>;
    id?: string;
    severity?: "critical" | "low" | "medium" | "high";
    orgId?: string;
    createdAt?: Date;
    updatedAt?: Date;
    threshold?: number;
    acknowledgedBy?: string;
    productId?: string;
    currentValue?: number;
    acknowledgedAt?: Date;
    resolvedAt?: Date;
}, {
    message?: string;
    type?: "overstock" | "low_stock" | "out_of_stock" | "expiry_warning" | "expiry_critical";
    status?: "acknowledged" | "active" | "resolved" | "dismissed";
    metadata?: Record<string, any>;
    id?: string;
    severity?: "critical" | "low" | "medium" | "high";
    orgId?: string;
    createdAt?: Date;
    updatedAt?: Date;
    threshold?: number;
    acknowledgedBy?: string;
    productId?: string;
    currentValue?: number;
    acknowledgedAt?: Date;
    resolvedAt?: Date;
}>;
export declare const InventoryReportSchema: z.ZodObject<{
    totalProducts: z.ZodNumber;
    totalValue: z.ZodNumber;
    lowStockItems: z.ZodNumber;
    outOfStockItems: z.ZodNumber;
    overstockItems: z.ZodNumber;
    expiringItems: z.ZodNumber;
    turnoverRate: z.ZodNumber;
    averageCost: z.ZodNumber;
    topProducts: z.ZodArray<z.ZodObject<{
        productId: z.ZodString;
        productName: z.ZodString;
        quantity: z.ZodNumber;
        value: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        value?: number;
        quantity?: number;
        productId?: string;
        productName?: string;
    }, {
        value?: number;
        quantity?: number;
        productId?: string;
        productName?: string;
    }>, "many">;
    categoryBreakdown: z.ZodRecord<z.ZodString, z.ZodObject<{
        count: z.ZodNumber;
        value: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        value?: number;
        count?: number;
    }, {
        value?: number;
        count?: number;
    }>>;
    recentTransactions: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        productName: z.ZodString;
        type: z.ZodEnum<["purchase", "sale", "return", "adjustment", "transfer", "damage", "expiry"]>;
        quantity: z.ZodNumber;
        date: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        type?: "purchase" | "sale" | "return" | "adjustment" | "transfer" | "damage" | "expiry";
        date?: Date;
        id?: string;
        quantity?: number;
        productName?: string;
    }, {
        type?: "purchase" | "sale" | "return" | "adjustment" | "transfer" | "damage" | "expiry";
        date?: Date;
        id?: string;
        quantity?: number;
        productName?: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    totalValue?: number;
    averageCost?: number;
    totalProducts?: number;
    lowStockItems?: number;
    outOfStockItems?: number;
    overstockItems?: number;
    expiringItems?: number;
    turnoverRate?: number;
    topProducts?: {
        value?: number;
        quantity?: number;
        productId?: string;
        productName?: string;
    }[];
    categoryBreakdown?: Record<string, {
        value?: number;
        count?: number;
    }>;
    recentTransactions?: {
        type?: "purchase" | "sale" | "return" | "adjustment" | "transfer" | "damage" | "expiry";
        date?: Date;
        id?: string;
        quantity?: number;
        productName?: string;
    }[];
}, {
    totalValue?: number;
    averageCost?: number;
    totalProducts?: number;
    lowStockItems?: number;
    outOfStockItems?: number;
    overstockItems?: number;
    expiringItems?: number;
    turnoverRate?: number;
    topProducts?: {
        value?: number;
        quantity?: number;
        productId?: string;
        productName?: string;
    }[];
    categoryBreakdown?: Record<string, {
        value?: number;
        count?: number;
    }>;
    recentTransactions?: {
        type?: "purchase" | "sale" | "return" | "adjustment" | "transfer" | "damage" | "expiry";
        date?: Date;
        id?: string;
        quantity?: number;
        productName?: string;
    }[];
}>;
export interface IInventorySystem {
    createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product>;
    getProduct(id: string): Promise<Product | null>;
    updateProduct(id: string, updates: Partial<Product>): Promise<Product>;
    deleteProduct(id: string): Promise<void>;
    listProducts(filters?: ProductFilters): Promise<Product[]>;
    addTransaction(transaction: Omit<KardexTransaction, 'id' | 'createdAt'>): Promise<KardexTransaction>;
    getTransaction(id: string): Promise<KardexTransaction | null>;
    listTransactions(filters?: TransactionFilters): Promise<KardexTransaction[]>;
    getProductKardex(productId: string): Promise<KardexTransaction[]>;
    createAlert(alert: Omit<StockAlert, 'id' | 'createdAt' | 'updatedAt'>): Promise<StockAlert>;
    getAlert(id: string): Promise<StockAlert | null>;
    updateAlert(id: string, updates: Partial<StockAlert>): Promise<StockAlert>;
    deleteAlert(id: string): Promise<void>;
    listAlerts(filters?: AlertFilters): Promise<StockAlert[]>;
    acknowledgeAlert(id: string, userId: string): Promise<void>;
    resolveAlert(id: string): Promise<void>;
    getInventoryReport(): Promise<InventoryReport>;
    getProductReport(productId: string): Promise<any>;
    getKardexReport(productId: string, fromDate?: Date, toDate?: Date): Promise<any>;
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
export type Product = z.infer<typeof ProductSchema>;
export type KardexTransaction = z.infer<typeof KardexTransactionSchema>;
export type StockAlert = z.infer<typeof StockAlertSchema>;
export type InventoryReport = z.infer<typeof InventoryReportSchema>;
declare class InventorySystemImpl implements IInventorySystem {
    private products;
    private transactions;
    private alerts;
    constructor();
    createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product>;
    getProduct(id: string): Promise<Product | null>;
    updateProduct(id: string, updates: Partial<Product>): Promise<Product>;
    deleteProduct(id: string): Promise<void>;
    listProducts(filters?: ProductFilters): Promise<Product[]>;
    addTransaction(transaction: Omit<KardexTransaction, 'id' | 'createdAt'>): Promise<KardexTransaction>;
    getTransaction(id: string): Promise<KardexTransaction | null>;
    listTransactions(filters?: TransactionFilters): Promise<KardexTransaction[]>;
    getProductKardex(productId: string): Promise<KardexTransaction[]>;
    createAlert(alert: Omit<StockAlert, 'id' | 'createdAt' | 'updatedAt'>): Promise<StockAlert>;
    getAlert(id: string): Promise<StockAlert | null>;
    updateAlert(id: string, updates: Partial<StockAlert>): Promise<StockAlert>;
    deleteAlert(id: string): Promise<void>;
    listAlerts(filters?: AlertFilters): Promise<StockAlert[]>;
    acknowledgeAlert(id: string, userId: string): Promise<void>;
    resolveAlert(id: string): Promise<void>;
    getInventoryReport(): Promise<InventoryReport>;
    getProductReport(productId: string): Promise<any>;
    getKardexReport(productId: string, fromDate?: Date, toDate?: Date): Promise<any>;
    checkStockLevels(): Promise<void>;
    calculateTurnoverRate(productId: string, days?: number): Promise<number>;
    getLowStockProducts(): Promise<Product[]>;
    getExpiringProducts(days?: number): Promise<Product[]>;
    private createLowStockAlert;
    private createOutOfStockAlert;
    private createOverstockAlert;
    private createExpiryAlert;
    private calculateBalance;
    private initializeSampleData;
}
export declare const inventorySystem: InventorySystemImpl;
export {};
//# sourceMappingURL=inventory.d.ts.map