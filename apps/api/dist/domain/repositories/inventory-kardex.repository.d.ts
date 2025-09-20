import { InventoryKardex } from '../entities/inventory-kardex.entity.js';
import { BaseRepository, BaseFilters, BaseSearchOptions, PaginatedResult, BaseStats } from './base.repository.js';
export interface InventoryKardexFilters extends BaseFilters {
    productId?: string;
    warehouseId?: string;
    locationId?: string;
    movementType?: string;
    movementReason?: string;
    status?: string;
    lowStock?: boolean;
    outOfStock?: boolean;
    needsReorder?: boolean;
    hasExpiredItems?: boolean;
    hasExpiringItems?: boolean;
    minQuantity?: number;
    maxQuantity?: number;
    minValue?: number;
    maxValue?: number;
    costMethod?: string;
    valuationMethod?: string;
}
export interface InventoryKardexSearchOptions extends BaseSearchOptions {
    productId?: string;
    warehouseId?: string;
    locationId?: string;
    movementType?: string;
    movementReason?: string;
    status?: string;
    lowStock?: boolean;
    outOfStock?: boolean;
    needsReorder?: boolean;
    hasExpiredItems?: boolean;
    hasExpiringItems?: boolean;
    minQuantity?: number;
    maxQuantity?: number;
    minValue?: number;
    maxValue?: number;
    costMethod?: string;
    valuationMethod?: string;
}
export interface InventoryKardexStats extends BaseStats {
    byProduct: Record<string, number>;
    byWarehouse: Record<string, number>;
    byLocation: Record<string, number>;
    byMovementType: Record<string, number>;
    byMovementReason: Record<string, number>;
    totalQuantity: number;
    totalValue: number;
    availableQuantity: number;
    availableValue: number;
    reservedQuantity: number;
    reservedValue: number;
    lowStockCount: number;
    outOfStockCount: number;
    needsReorderCount: number;
    expiredItemsCount: number;
    expiringItemsCount: number;
    averageStockTurnover: number;
    totalMovements: number;
    movementsIn: number;
    movementsOut: number;
    movementsTransfer: number;
    movementsAdjustment: number;
}
export interface InventoryKardexRepository extends BaseRepository<InventoryKardex> {
    findByProductId(productId: string, organizationId: string, options?: InventoryKardexSearchOptions): Promise<PaginatedResult<InventoryKardex>>;
    findByWarehouseId(warehouseId: string, organizationId: string, options?: InventoryKardexSearchOptions): Promise<PaginatedResult<InventoryKardex>>;
    findByLocationId(locationId: string, organizationId: string, options?: InventoryKardexSearchOptions): Promise<PaginatedResult<InventoryKardex>>;
    findByProductAndWarehouse(productId: string, warehouseId: string, organizationId: string): Promise<InventoryKardex | null>;
    findByProductAndLocation(productId: string, locationId: string, organizationId: string): Promise<InventoryKardex | null>;
    findLowStock(organizationId: string, threshold?: number, options?: InventoryKardexSearchOptions): Promise<PaginatedResult<InventoryKardex>>;
    findOutOfStock(organizationId: string, options?: InventoryKardexSearchOptions): Promise<PaginatedResult<InventoryKardex>>;
    findNeedsReorder(organizationId: string, options?: InventoryKardexSearchOptions): Promise<PaginatedResult<InventoryKardex>>;
    findByQuantityRange(organizationId: string, minQuantity: number, maxQuantity: number, options?: InventoryKardexSearchOptions): Promise<PaginatedResult<InventoryKardex>>;
    findByValueRange(organizationId: string, minValue: number, maxValue: number, options?: InventoryKardexSearchOptions): Promise<PaginatedResult<InventoryKardex>>;
    findByMovementType(movementType: string, organizationId: string, options?: InventoryKardexSearchOptions): Promise<PaginatedResult<InventoryKardex>>;
    findByMovementReason(movementReason: string, organizationId: string, options?: InventoryKardexSearchOptions): Promise<PaginatedResult<InventoryKardex>>;
    findByMovementDateRange(organizationId: string, startDate: Date, endDate: Date, options?: InventoryKardexSearchOptions): Promise<PaginatedResult<InventoryKardex>>;
    findRecentMovements(organizationId: string, days: number, options?: InventoryKardexSearchOptions): Promise<PaginatedResult<InventoryKardex>>;
    findExpiredItems(organizationId: string, options?: InventoryKardexSearchOptions): Promise<PaginatedResult<InventoryKardex>>;
    findExpiringItems(organizationId: string, days: number, options?: InventoryKardexSearchOptions): Promise<PaginatedResult<InventoryKardex>>;
    findByExpirationDateRange(organizationId: string, startDate: Date, endDate: Date, options?: InventoryKardexSearchOptions): Promise<PaginatedResult<InventoryKardex>>;
    searchByProductName(productName: string, organizationId: string): Promise<InventoryKardex[]>;
    searchByBatchNumber(batchNumber: string, organizationId: string): Promise<InventoryKardex[]>;
    searchBySerialNumber(serialNumber: string, organizationId: string): Promise<InventoryKardex[]>;
    searchByReference(reference: string, organizationId: string): Promise<InventoryKardex[]>;
    updateSettingsMany(ids: string[], settings: any): Promise<void>;
    updateThresholdsMany(ids: string[], lowStockThreshold: number, reorderPoint: number): Promise<void>;
    updateCostMethodMany(ids: string[], costMethod: string, valuationMethod: string): Promise<void>;
    adjustStockMany(adjustments: Array<{
        id: string;
        quantity: number;
        unitCost: any;
        reason: string;
    }>): Promise<void>;
    getStats(organizationId: string, filters?: InventoryKardexFilters): Promise<InventoryKardexStats>;
    getStatsByProduct(organizationId: string, productId: string): Promise<InventoryKardexStats>;
    getStatsByWarehouse(organizationId: string, warehouseId: string): Promise<InventoryKardexStats>;
    getStatsByLocation(organizationId: string, locationId: string): Promise<InventoryKardexStats>;
    getInventoryValuation(organizationId: string, filters?: InventoryKardexFilters): Promise<{
        totalValue: number;
        availableValue: number;
        reservedValue: number;
        byWarehouse: Record<string, number>;
        byLocation: Record<string, number>;
        byProduct: Record<string, number>;
        valuationDate: Date;
    }>;
    getStockTurnoverAnalysis(organizationId: string, periodDays?: number): Promise<{
        averageTurnover: number;
        byProduct: Array<{
            productId: string;
            productName: string;
            turnover: number;
            averageStock: number;
            totalMovements: number;
        }>;
        byWarehouse: Array<{
            warehouseId: string;
            warehouseName: string;
            turnover: number;
            averageStock: number;
            totalMovements: number;
        }>;
        analysisDate: Date;
    }>;
    getMovementAnalysis(organizationId: string, startDate: Date, endDate: Date): Promise<{
        totalMovements: number;
        movementsIn: number;
        movementsOut: number;
        movementsTransfer: number;
        movementsAdjustment: number;
        byType: Record<string, number>;
        byReason: Record<string, number>;
        byProduct: Array<{
            productId: string;
            productName: string;
            movementsIn: number;
            movementsOut: number;
            netQuantity: number;
        }>;
        byWarehouse: Array<{
            warehouseId: string;
            warehouseName: string;
            movementsIn: number;
            movementsOut: number;
            netQuantity: number;
        }>;
        trends: Array<{
            date: Date;
            movementsIn: number;
            movementsOut: number;
            netQuantity: number;
        }>;
        analysisDate: Date;
    }>;
    getExpirationAnalysis(organizationId: string): Promise<{
        totalExpired: number;
        totalExpiring: number;
        expiredValue: number;
        expiringValue: number;
        byProduct: Array<{
            productId: string;
            productName: string;
            expiredQuantity: number;
            expiringQuantity: number;
            expiredValue: number;
            expiringValue: number;
        }>;
        byWarehouse: Array<{
            warehouseId: string;
            warehouseName: string;
            expiredQuantity: number;
            expiringQuantity: number;
            expiredValue: number;
            expiringValue: number;
        }>;
        byExpirationDate: Array<{
            expirationDate: Date;
            quantity: number;
            value: number;
            productCount: number;
        }>;
        analysisDate: Date;
    }>;
    existsByProductAndWarehouse(productId: string, warehouseId: string, organizationId: string): Promise<boolean>;
    existsByProductAndLocation(productId: string, locationId: string, organizationId: string): Promise<boolean>;
    getInventoryCount(organizationId: string, filters?: InventoryKardexFilters): Promise<number>;
    getTotalQuantity(organizationId: string, filters?: InventoryKardexFilters): Promise<number>;
    getTotalValue(organizationId: string, filters?: InventoryKardexFilters): Promise<number>;
    getAvailableQuantity(organizationId: string, filters?: InventoryKardexFilters): Promise<number>;
    getAvailableValue(organizationId: string, filters?: InventoryKardexFilters): Promise<number>;
    getReservedQuantity(organizationId: string, filters?: InventoryKardexFilters): Promise<number>;
    getReservedValue(organizationId: string, filters?: InventoryKardexFilters): Promise<number>;
    generateInventoryReport(organizationId: string, filters?: InventoryKardexFilters): Promise<{
        summary: InventoryKardexStats;
        inventory: InventoryKardex[];
        generatedAt: Date;
    }>;
    generateMovementReport(organizationId: string, startDate: Date, endDate: Date): Promise<{
        summary: {
            totalMovements: number;
            movementsIn: number;
            movementsOut: number;
            movementsTransfer: number;
            movementsAdjustment: number;
        };
        movements: Array<{
            id: string;
            productId: string;
            productName: string;
            movementType: string;
            movementReason: string;
            quantity: number;
            unitCost: number;
            totalCost: number;
            movementDate: Date;
            reference: string;
        }>;
        generatedAt: Date;
    }>;
    generateExpirationReport(organizationId: string): Promise<{
        summary: {
            totalExpired: number;
            totalExpiring: number;
            expiredValue: number;
            expiringValue: number;
        };
        expiredItems: Array<{
            productId: string;
            productName: string;
            quantity: number;
            value: number;
            expirationDate: Date;
            daysExpired: number;
        }>;
        expiringItems: Array<{
            productId: string;
            productName: string;
            quantity: number;
            value: number;
            expirationDate: Date;
            daysUntilExpiration: number;
        }>;
        generatedAt: Date;
    }>;
    generateReorderReport(organizationId: string): Promise<{
        summary: {
            totalNeedsReorder: number;
            totalReorderValue: number;
        };
        reorderItems: Array<{
            productId: string;
            productName: string;
            currentQuantity: number;
            reorderPoint: number;
            reorderQuantity: number;
            unitCost: number;
            reorderValue: number;
            supplierId: string;
            supplierName: string;
        }>;
        generatedAt: Date;
    }>;
}
//# sourceMappingURL=inventory-kardex.repository.d.ts.map