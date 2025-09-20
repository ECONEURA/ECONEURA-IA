import { BaseEntity, BaseEntityProps } from './base.entity.js';
import { Money } from '../value-objects/money.vo.js';
export interface InventoryKardexId {
    value: string;
}
export interface MovementType {
    value: 'in' | 'out' | 'transfer' | 'adjustment' | 'return' | 'damage' | 'expired' | 'theft';
}
export interface MovementStatus {
    value: 'pending' | 'completed' | 'cancelled' | 'reversed';
}
export interface MovementReason {
    value: 'purchase' | 'sale' | 'transfer_in' | 'transfer_out' | 'adjustment' | 'return' | 'damage' | 'expired' | 'theft' | 'production' | 'consumption' | 'other';
}
export interface InventoryMovement {
    id: string;
    productId: string;
    warehouseId?: string;
    locationId?: string;
    movementType: MovementType;
    movementReason: MovementReason;
    quantity: number;
    unitCost: Money;
    totalCost: Money;
    reference?: string;
    referenceId?: string;
    notes?: string;
    batchNumber?: string;
    expirationDate?: Date;
    serialNumber?: string;
    supplierId?: string;
    customerId?: string;
    userId?: string;
    movementDate: Date;
    status: MovementStatus;
}
export interface InventorySettings {
    trackInventory: boolean;
    allowNegativeStock: boolean;
    lowStockThreshold: number;
    reorderPoint: number;
    reorderQuantity: number;
    costMethod: 'fifo' | 'lifo' | 'average' | 'standard';
    valuationMethod: 'fifo' | 'lifo' | 'average' | 'standard';
    autoReorder: boolean;
    trackExpiration: boolean;
    trackSerialNumbers: boolean;
    trackBatchNumbers: boolean;
    customFields: Record<string, any>;
    tags: string[];
    notes: string;
}
export interface InventoryKardexProps extends BaseEntityProps {
    productId: string;
    warehouseId?: string;
    locationId?: string;
    initialQuantity: number;
    currentQuantity: number;
    reservedQuantity: number;
    availableQuantity: number;
    unitCost: Money;
    totalCost: Money;
    averageCost: Money;
    lastMovementDate?: Date;
    lastMovementType?: MovementType;
    movements: InventoryMovement[];
    settings: InventorySettings;
    isActive: boolean;
}
export declare class InventoryKardex extends BaseEntity {
    private props;
    private constructor();
    static create(props: Omit<InventoryKardexProps, 'id' | 'createdAt' | 'updatedAt'>): InventoryKardex;
    static fromJSON(data: InventoryKardexProps): InventoryKardex;
    get productId(): string;
    get warehouseId(): string | undefined;
    get locationId(): string | undefined;
    get initialQuantity(): number;
    get currentQuantity(): number;
    get reservedQuantity(): number;
    get availableQuantity(): number;
    get unitCost(): Money;
    get totalCost(): Money;
    get averageCost(): Money;
    get lastMovementDate(): Date | undefined;
    get lastMovementType(): MovementType | undefined;
    get movements(): InventoryMovement[];
    get settings(): InventorySettings;
    updateProductId(productId: string): void;
    updateWarehouseId(warehouseId: string): void;
    updateLocationId(locationId: string): void;
    updateSettings(settings: InventorySettings): void;
    addMovement(movement: InventoryMovement): void;
    removeMovement(movementId: string): void;
    updateMovement(movementId: string, updates: Partial<InventoryMovement>): void;
    recordInMovement(quantity: number, unitCost: Money, reason: MovementReason, reference?: string, referenceId?: string, notes?: string, batchNumber?: string, expirationDate?: Date, serialNumber?: string, supplierId?: string, userId?: string): void;
    recordOutMovement(quantity: number, reason: MovementReason, reference?: string, referenceId?: string, notes?: string, batchNumber?: string, serialNumber?: string, customerId?: string, userId?: string): void;
    recordTransferMovement(quantity: number, toWarehouseId: string, toLocationId?: string, reason?: MovementReason, reference?: string, referenceId?: string, notes?: string, userId?: string): void;
    recordAdjustmentMovement(quantity: number, unitCost: Money, reason?: MovementReason, reference?: string, referenceId?: string, notes?: string, userId?: string): void;
    reserveQuantity(quantity: number, reference?: string, referenceId?: string): void;
    releaseReservation(quantity: number): void;
    private recalculateQuantities;
    validate(): boolean;
    toJSON(): InventoryKardexProps;
    clone(): InventoryKardex;
    isLowStock(): boolean;
    isOutOfStock(): boolean;
    needsReorder(): boolean;
    getStockValue(): Money;
    getAvailableStockValue(): Money;
    getReservedStockValue(): Money;
    getStockTurnover(periodDays?: number): number;
    getExpiredItems(): InventoryMovement[];
    getExpiringItems(days?: number): InventoryMovement[];
    static createPurchaseMovement(productId: string, quantity: number, unitCost: Money, warehouseId?: string, locationId?: string, supplierId?: string, batchNumber?: string, expirationDate?: Date, reference?: string, referenceId?: string, notes?: string): InventoryMovement;
    static createSaleMovement(productId: string, quantity: number, unitCost: Money, warehouseId?: string, locationId?: string, customerId?: string, reference?: string, referenceId?: string, notes?: string): InventoryMovement;
    static createAdjustmentMovement(productId: string, quantity: number, unitCost: Money, warehouseId?: string, locationId?: string, reason?: MovementReason, reference?: string, referenceId?: string, notes?: string): InventoryMovement;
}
export type { InventoryKardexId, MovementType, MovementStatus, MovementReason, InventoryMovement, InventorySettings };
//# sourceMappingURL=inventory-kardex.entity.d.ts.map