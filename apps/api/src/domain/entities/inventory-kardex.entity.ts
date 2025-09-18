import { z } from 'zod';
import { BaseEntity, BaseEntityProps } from './base.entity.js';
import { Money } from '../value-objects/money.vo.js';

// ============================================================================
// INVENTORY KARDEX ENTITY
// ============================================================================

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

export class InventoryKardex extends BaseEntity {
  private constructor(private props: InventoryKardexProps) {
    super(props);
  }

  // ========================================================================
  // FACTORY METHODS
  // ========================================================================

  static create(props: Omit<InventoryKardexProps, 'id' | 'createdAt' | 'updatedAt'>): InventoryKardex {
    const now = new Date();
    return new InventoryKardex({
      ...props,
      id: { value: crypto.randomUUID() },
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromJSON(data: InventoryKardexProps): InventoryKardex {
    return new InventoryKardex(data);
  }

  // ========================================================================
  // GETTERS
  // ========================================================================

  get productId(): string { return this.props.productId; }
  get warehouseId(): string | undefined { return this.props.warehouseId; }
  get locationId(): string | undefined { return this.props.locationId; }
  get initialQuantity(): number { return this.props.initialQuantity; }
  get currentQuantity(): number { return this.props.currentQuantity; }
  get reservedQuantity(): number { return this.props.reservedQuantity; }
  get availableQuantity(): number { return this.props.availableQuantity; }
  get unitCost(): Money { return this.props.unitCost; }
  get totalCost(): Money { return this.props.totalCost; }
  get averageCost(): Money { return this.props.averageCost; }
  get lastMovementDate(): Date | undefined { return this.props.lastMovementDate; }
  get lastMovementType(): MovementType | undefined { return this.props.lastMovementType; }
  get movements(): InventoryMovement[] { return this.props.movements; }
  get settings(): InventorySettings { return this.props.settings; }

  // ========================================================================
  // BUSINESS METHODS
  // ========================================================================

  updateProductId(productId: string): void {
    if (!productId || productId.trim().length === 0) {
      throw new Error('Product ID cannot be empty');
    }
    this.props.productId = productId.trim();
    this.updateTimestamp();
  }

  updateWarehouseId(warehouseId: string): void {
    this.props.warehouseId = warehouseId;
    this.updateTimestamp();
  }

  updateLocationId(locationId: string): void {
    this.props.locationId = locationId;
    this.updateTimestamp();
  }

  updateSettings(settings: InventorySettings): void {
    this.props.settings = settings;
    this.updateTimestamp();
  }

  addMovement(movement: InventoryMovement): void {
    this.props.movements.push(movement);
    this.recalculateQuantities();
    this.updateTimestamp();
  }

  removeMovement(movementId: string): void {
    this.props.movements = this.props.movements.filter(movement => movement.id !== movementId);
    this.recalculateQuantities();
    this.updateTimestamp();
  }

  updateMovement(movementId: string, updates: Partial<InventoryMovement>): void {
    const movementIndex = this.props.movements.findIndex(movement => movement.id === movementId);
    if (movementIndex !== -1) {
      this.props.movements[movementIndex] = { ...this.props.movements[movementIndex], ...updates };
      this.recalculateQuantities();
      this.updateTimestamp();
    }
  }

  recordInMovement(
    quantity: number,
    unitCost: Money,
    reason: MovementReason,
    reference?: string,
    referenceId?: string,
    notes?: string,
    batchNumber?: string,
    expirationDate?: Date,
    serialNumber?: string,
    supplierId?: string,
    userId?: string
  ): void {
    const movement: InventoryMovement = {
      id: crypto.randomUUID(),
      productId: this.props.productId,
      warehouseId: this.props.warehouseId,
      locationId: this.props.locationId,
      movementType: { value: 'in' },
      movementReason: reason,
      quantity,
      unitCost,
      totalCost: Money.create(quantity * unitCost.amount, unitCost.currency),
      reference,
      referenceId,
      notes,
      batchNumber,
      expirationDate,
      serialNumber,
      supplierId,
      userId,
      movementDate: new Date(),
      status: { value: 'completed' }
    };

    this.addMovement(movement);
  }

  recordOutMovement(
    quantity: number,
    reason: MovementReason,
    reference?: string,
    referenceId?: string,
    notes?: string,
    batchNumber?: string,
    serialNumber?: string,
    customerId?: string,
    userId?: string
  ): void {
    if (quantity > this.props.availableQuantity && !this.props.settings.allowNegativeStock) {
      throw new Error('Insufficient stock available');
    }

    const movement: InventoryMovement = {
      id: crypto.randomUUID(),
      productId: this.props.productId,
      warehouseId: this.props.warehouseId,
      locationId: this.props.locationId,
      movementType: { value: 'out' },
      movementReason: reason,
      quantity: -quantity,
      unitCost: this.props.averageCost,
      totalCost: Money.create(-quantity * this.props.averageCost.amount, this.props.averageCost.currency),
      reference,
      referenceId,
      notes,
      batchNumber,
      serialNumber,
      customerId,
      userId,
      movementDate: new Date(),
      status: { value: 'completed' }
    };

    this.addMovement(movement);
  }

  recordTransferMovement(
    quantity: number,
    toWarehouseId: string,
    toLocationId?: string,
    reason: MovementReason = { value: 'transfer_out' },
    reference?: string,
    referenceId?: string,
    notes?: string,
    userId?: string
  ): void {
    if (quantity > this.props.availableQuantity) {
      throw new Error('Insufficient stock available for transfer');
    }

    const movement: InventoryMovement = {
      id: crypto.randomUUID(),
      productId: this.props.productId,
      warehouseId: this.props.warehouseId,
      locationId: this.props.locationId,
      movementType: { value: 'transfer' },
      movementReason: reason,
      quantity: -quantity,
      unitCost: this.props.averageCost,
      totalCost: Money.create(-quantity * this.props.averageCost.amount, this.props.averageCost.currency),
      reference,
      referenceId,
      notes,
      userId,
      movementDate: new Date(),
      status: { value: 'completed' }
    };

    this.addMovement(movement);
  }

  recordAdjustmentMovement(
    quantity: number,
    unitCost: Money,
    reason: MovementReason = { value: 'adjustment' },
    reference?: string,
    referenceId?: string,
    notes?: string,
    userId?: string
  ): void {
    const movement: InventoryMovement = {
      id: crypto.randomUUID(),
      productId: this.props.productId,
      warehouseId: this.props.warehouseId,
      locationId: this.props.locationId,
      movementType: { value: 'adjustment' },
      movementReason: reason,
      quantity,
      unitCost,
      totalCost: Money.create(quantity * unitCost.amount, unitCost.currency),
      reference,
      referenceId,
      notes,
      userId,
      movementDate: new Date(),
      status: { value: 'completed' }
    };

    this.addMovement(movement);
  }

  reserveQuantity(quantity: number, reference?: string, referenceId?: string): void {
    if (quantity > this.props.availableQuantity) {
      throw new Error('Insufficient stock available for reservation');
    }

    this.props.reservedQuantity += quantity;
    this.props.availableQuantity -= quantity;
    this.updateTimestamp();
  }

  releaseReservation(quantity: number): void {
    if (quantity > this.props.reservedQuantity) {
      throw new Error('Cannot release more quantity than reserved');
    }

    this.props.reservedQuantity -= quantity;
    this.props.availableQuantity += quantity;
    this.updateTimestamp();
  }

  // ========================================================================
  // PRIVATE METHODS
  // ========================================================================

  private recalculateQuantities(): void {
    let totalQuantity = this.props.initialQuantity;
    let totalCost = Money.create(0, this.props.unitCost.currency);
    let totalQuantityForAverage = 0;

    // Sort movements by date to ensure proper calculation
    const sortedMovements = [...this.props.movements].sort((a, b) => 
      a.movementDate.getTime() - b.movementDate.getTime()
    );

    for (const movement of sortedMovements) {
      if (movement.status.value === 'completed') {
        totalQuantity += movement.quantity;
        
        if (movement.quantity > 0) {
          // In movement - add to cost calculation
          totalCost = Money.create(
            totalCost.amount + movement.totalCost.amount,
            totalCost.currency
          );
          totalQuantityForAverage += movement.quantity;
        } else {
          // Out movement - subtract from cost calculation
          totalCost = Money.create(
            totalCost.amount + movement.totalCost.amount,
            totalCost.currency
          );
        }
      }
    }

    this.props.currentQuantity = totalQuantity;
    this.props.totalCost = totalCost;
    
    // Calculate average cost
    if (totalQuantityForAverage > 0) {
      this.props.averageCost = Money.create(
        totalCost.amount / totalQuantityForAverage,
        totalCost.currency
      );
    }

    // Update available quantity
    this.props.availableQuantity = this.props.currentQuantity - this.props.reservedQuantity;

    // Update last movement info
    if (sortedMovements.length > 0) {
      const lastMovement = sortedMovements[sortedMovements.length - 1];
      this.props.lastMovementDate = lastMovement.movementDate;
      this.props.lastMovementType = lastMovement.movementType;
    }
  }

  // ========================================================================
  // VALIDATION METHODS
  // ========================================================================

  validate(): boolean {
    if (!this.validateBase()) {
      return false;
    }

    if (!this.props.productId || this.props.productId.trim().length === 0) {
      return false;
    }

    if (this.props.currentQuantity < 0 && !this.props.settings.allowNegativeStock) {
      return false;
    }

    if (this.props.reservedQuantity < 0) {
      return false;
    }

    if (this.props.availableQuantity < 0) {
      return false;
    }

    return true;
  }

  // ========================================================================
  // UTILITY METHODS
  // ========================================================================

  toJSON(): InventoryKardexProps {
    return { ...this.props };
  }

  clone(): InventoryKardex {
    return InventoryKardex.fromJSON(this.toJSON());
  }

  // ========================================================================
  // BUSINESS LOGIC METHODS
  // ========================================================================

  isLowStock(): boolean {
    return this.props.availableQuantity <= this.props.settings.lowStockThreshold;
  }

  isOutOfStock(): boolean {
    return this.props.availableQuantity <= 0;
  }

  needsReorder(): boolean {
    return this.props.availableQuantity <= this.props.settings.reorderPoint;
  }

  getStockValue(): Money {
    return Money.create(
      this.props.currentQuantity * this.props.averageCost.amount,
      this.props.averageCost.currency
    );
  }

  getAvailableStockValue(): Money {
    return Money.create(
      this.props.availableQuantity * this.props.averageCost.amount,
      this.props.averageCost.currency
    );
  }

  getReservedStockValue(): Money {
    return Money.create(
      this.props.reservedQuantity * this.props.averageCost.amount,
      this.props.averageCost.currency
    );
  }

  getStockTurnover(periodDays: number = 365): number {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (periodDays * 24 * 60 * 60 * 1000));
    
    const movementsInPeriod = this.props.movements.filter(movement => 
      movement.movementDate >= startDate && 
      movement.movementDate <= endDate &&
      movement.movementType.value === 'out' &&
      movement.status.value === 'completed'
    );

    const totalOutQuantity = movementsInPeriod.reduce((sum, movement) => sum + Math.abs(movement.quantity), 0);
    const averageStock = this.props.currentQuantity / 2;
    
    return averageStock > 0 ? totalOutQuantity / averageStock : 0;
  }

  getExpiredItems(): InventoryMovement[] {
    const now = new Date();
    return this.props.movements.filter(movement => 
      movement.expirationDate && 
      movement.expirationDate < now &&
      movement.quantity > 0
    );
  }

  getExpiringItems(days: number = 30): InventoryMovement[] {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    return this.props.movements.filter(movement => 
      movement.expirationDate && 
      movement.expirationDate <= futureDate &&
      movement.quantity > 0
    );
  }

  // ========================================================================
  // FACTORY METHODS FOR SPECIFIC MOVEMENT TYPES
  // ========================================================================

  static createPurchaseMovement(
    productId: string,
    quantity: number,
    unitCost: Money,
    warehouseId?: string,
    locationId?: string,
    supplierId?: string,
    batchNumber?: string,
    expirationDate?: Date,
    reference?: string,
    referenceId?: string,
    notes?: string
  ): InventoryMovement {
    return {
      id: crypto.randomUUID(),
      productId,
      warehouseId,
      locationId,
      movementType: { value: 'in' },
      movementReason: { value: 'purchase' },
      quantity,
      unitCost,
      totalCost: Money.create(quantity * unitCost.amount, unitCost.currency),
      reference,
      referenceId,
      notes,
      batchNumber,
      expirationDate,
      supplierId,
      movementDate: new Date(),
      status: { value: 'completed' }
    };
  }

  static createSaleMovement(
    productId: string,
    quantity: number,
    unitCost: Money,
    warehouseId?: string,
    locationId?: string,
    customerId?: string,
    reference?: string,
    referenceId?: string,
    notes?: string
  ): InventoryMovement {
    return {
      id: crypto.randomUUID(),
      productId,
      warehouseId,
      locationId,
      movementType: { value: 'out' },
      movementReason: { value: 'sale' },
      quantity: -quantity,
      unitCost,
      totalCost: Money.create(-quantity * unitCost.amount, unitCost.currency),
      reference,
      referenceId,
      notes,
      customerId,
      movementDate: new Date(),
      status: { value: 'completed' }
    };
  }

  static createAdjustmentMovement(
    productId: string,
    quantity: number,
    unitCost: Money,
    warehouseId?: string,
    locationId?: string,
    reason: MovementReason = { value: 'adjustment' },
    reference?: string,
    referenceId?: string,
    notes?: string
  ): InventoryMovement {
    return {
      id: crypto.randomUUID(),
      productId,
      warehouseId,
      locationId,
      movementType: { value: 'adjustment' },
      movementReason: reason,
      quantity,
      unitCost,
      totalCost: Money.create(quantity * unitCost.amount, unitCost.currency),
      reference,
      referenceId,
      notes,
      movementDate: new Date(),
      status: { value: 'completed' }
    };
  }
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type { InventoryKardexId, MovementType, MovementStatus, MovementReason, InventoryMovement, InventorySettings };
