interface Product {
    id: string;
    organizationId: string;
    sku: string;
    name: string;
    description: string;
    category: string;
    unit: string;
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
    reference: string;
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
declare class InventoryKardexService {
    private products;
    private kardexEntries;
    private stockLevels;
    private alerts;
    private cycleCounts;
    constructor();
    init(): void;
    private createDemoData;
    private calculateStockLevels;
    createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product>;
    getProduct(productId: string): Promise<Product | undefined>;
    getProducts(organizationId: string, filters?: {
        category?: string;
        location?: string;
        isActive?: boolean;
        search?: string;
        limit?: number;
    }): Promise<Product[]>;
    createKardexEntry(entryData: Omit<KardexEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<KardexEntry>;
    getKardexEntries(organizationId: string, filters?: {
        productId?: string;
        transactionType?: string;
        startDate?: string;
        endDate?: string;
        limit?: number;
    }): Promise<KardexEntry[]>;
    getStockLevel(productId: string): Promise<StockLevel | undefined>;
    getStockLevels(organizationId: string, filters?: {
        location?: string;
        lowStock?: boolean;
        overstock?: boolean;
        limit?: number;
    }): Promise<StockLevel[]>;
    checkAlerts(productId: string): Promise<void>;
    createAlert(alertData: Omit<Alert, 'id' | 'createdAt' | 'updatedAt'>): Promise<Alert>;
    getAlerts(organizationId: string, filters?: {
        alertType?: string;
        severity?: string;
        isActive?: boolean;
        isAcknowledged?: boolean;
        limit?: number;
    }): Promise<Alert[]>;
    acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<Alert | undefined>;
    createCycleCount(cycleCountData: Omit<CycleCount, 'id' | 'createdAt' | 'updatedAt'>): Promise<CycleCount>;
    getCycleCounts(organizationId: string, filters?: {
        status?: string;
        assignedTo?: string;
        startDate?: string;
        endDate?: string;
        limit?: number;
    }): Promise<CycleCount[]>;
    completeCycleCount(cycleCountId: string, actualQuantity: number, notes?: string): Promise<CycleCount | undefined>;
    generateInventoryReport(organizationId: string, reportType: string, startDate: string, endDate: string, generatedBy: string): Promise<InventoryReport>;
    getInventoryStats(organizationId: string): Promise<{
        totalProducts: number;
        totalValue: number;
        totalMovements: number;
        activeAlerts: number;
        lowStockItems: number;
        overstockItems: number;
        pendingCycleCounts: number;
        last30Days: {
            movements: number;
            value: number;
            products: number;
        };
        last7Days: {
            movements: number;
            value: number;
        };
        byCategory: Record<string, number>;
        byLocation: Record<string, number>;
    }>;
}
export declare const inventoryKardexService: InventoryKardexService;
export {};
//# sourceMappingURL=inventory-kardex.service.d.ts.map