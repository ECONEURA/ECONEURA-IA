import { Money } from '../value-objects/money.vo.js';

import { BaseEntity } from './base.entity.js';
export class InventoryKardex extends BaseEntity {
    props;
    constructor(props) {
        super(props);
        this.props = props;
    }
    static create(props) {
        const now = new Date();
        return new InventoryKardex({
            ...props,
            id: crypto.randomUUID(),
            createdAt: now,
            updatedAt: now,
        });
    }
    static fromJSON(data) {
        return new InventoryKardex(data);
    }
    get productId() { return this.props.productId; }
    get warehouseId() { return this.props.warehouseId; }
    get locationId() { return this.props.locationId; }
    get initialQuantity() { return this.props.initialQuantity; }
    get currentQuantity() { return this.props.currentQuantity; }
    get reservedQuantity() { return this.props.reservedQuantity; }
    get availableQuantity() { return this.props.availableQuantity; }
    get unitCost() { return this.props.unitCost; }
    get totalCost() { return this.props.totalCost; }
    get averageCost() { return this.props.averageCost; }
    get lastMovementDate() { return this.props.lastMovementDate; }
    get lastMovementType() { return this.props.lastMovementType; }
    get movements() { return this.props.movements; }
    get settings() { return this.props.settings; }
    updateProductId(productId) {
        if (!productId || productId.trim().length === 0) {
            throw new Error('Product ID cannot be empty');
        }
        this.props.productId = productId.trim();
        this.updateTimestamp();
    }
    updateWarehouseId(warehouseId) {
        this.props.warehouseId = warehouseId;
        this.updateTimestamp();
    }
    updateLocationId(locationId) {
        this.props.locationId = locationId;
        this.updateTimestamp();
    }
    updateSettings(settings) {
        this.props.settings = settings;
        this.updateTimestamp();
    }
    addMovement(movement) {
        this.props.movements.push(movement);
        this.recalculateQuantities();
        this.updateTimestamp();
    }
    removeMovement(movementId) {
        this.props.movements = this.props.movements.filter(movement => movement.id !== movementId);
        this.recalculateQuantities();
        this.updateTimestamp();
    }
    updateMovement(movementId, updates) {
        const movementIndex = this.props.movements.findIndex(movement => movement.id === movementId);
        if (movementIndex !== -1) {
            this.props.movements[movementIndex] = { ...this.props.movements[movementIndex], ...updates };
            this.recalculateQuantities();
            this.updateTimestamp();
        }
    }
    recordInMovement(quantity, unitCost, reason, reference, referenceId, notes, batchNumber, expirationDate, serialNumber, supplierId, userId) {
        const movement = {
            id: crypto.randomUUID(),
            productId: this.props.productId,
            warehouseId: this.props.warehouseId,
            locationId: this.props.locationId,
            movementType: 'in',
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
            status: 'completed'
        };
        this.addMovement(movement);
    }
    recordOutMovement(quantity, reason, reference, referenceId, notes, batchNumber, serialNumber, customerId, userId) {
        if (quantity > this.props.availableQuantity && !this.props.settings.allowNegativeStock) {
            throw new Error('Insufficient stock available');
        }
        const movement = {
            id: crypto.randomUUID(),
            productId: this.props.productId,
            warehouseId: this.props.warehouseId,
            locationId: this.props.locationId,
            movementType: 'out',
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
            status: 'completed'
        };
        this.addMovement(movement);
    }
    recordTransferMovement(quantity, toWarehouseId, toLocationId, reason = 'transfer_out', reference, referenceId, notes, userId) {
        if (quantity > this.props.availableQuantity) {
            throw new Error('Insufficient stock available for transfer');
        }
        const movement = {
            id: crypto.randomUUID(),
            productId: this.props.productId,
            warehouseId: this.props.warehouseId,
            locationId: this.props.locationId,
            movementType: 'transfer',
            movementReason: reason,
            quantity: -quantity,
            unitCost: this.props.averageCost,
            totalCost: Money.create(-quantity * this.props.averageCost.amount, this.props.averageCost.currency),
            reference,
            referenceId,
            notes,
            userId,
            movementDate: new Date(),
            status: 'completed'
        };
        this.addMovement(movement);
    }
    recordAdjustmentMovement(quantity, unitCost, reason = 'adjustment', reference, referenceId, notes, userId) {
        const movement = {
            id: crypto.randomUUID(),
            productId: this.props.productId,
            warehouseId: this.props.warehouseId,
            locationId: this.props.locationId,
            movementType: 'adjustment',
            movementReason: reason,
            quantity,
            unitCost,
            totalCost: Money.create(quantity * unitCost.amount, unitCost.currency),
            reference,
            referenceId,
            notes,
            userId,
            movementDate: new Date(),
            status: 'completed'
        };
        this.addMovement(movement);
    }
    reserveQuantity(quantity, reference, referenceId) {
        if (quantity > this.props.availableQuantity) {
            throw new Error('Insufficient stock available for reservation');
        }
        this.props.reservedQuantity += quantity;
        this.props.availableQuantity -= quantity;
        this.updateTimestamp();
    }
    releaseReservation(quantity) {
        if (quantity > this.props.reservedQuantity) {
            throw new Error('Cannot release more quantity than reserved');
        }
        this.props.reservedQuantity -= quantity;
        this.props.availableQuantity += quantity;
        this.updateTimestamp();
    }
    recalculateQuantities() {
        let totalQuantity = this.props.initialQuantity;
        let totalCost = Money.create(0, this.props.unitCost.currency);
        let totalQuantityForAverage = 0;
        const sortedMovements = [...this.props.movements].sort((a, b) => a.movementDate.getTime() - b.movementDate.getTime());
        for (const movement of sortedMovements) {
            if (movement.status.value === 'completed') {
                totalQuantity += movement.quantity;
                if (movement.quantity > 0) {
                    totalCost = Money.create(totalCost.amount + movement.totalCost.amount, totalCost.currency);
                    totalQuantityForAverage += movement.quantity;
                }
                else {
                    totalCost = Money.create(totalCost.amount + movement.totalCost.amount, totalCost.currency);
                }
            }
        }
        this.props.currentQuantity = totalQuantity;
        this.props.totalCost = totalCost;
        if (totalQuantityForAverage > 0) {
            this.props.averageCost = Money.create(totalCost.amount / totalQuantityForAverage, totalCost.currency);
        }
        this.props.availableQuantity = this.props.currentQuantity - this.props.reservedQuantity;
        if (sortedMovements.length > 0) {
            const lastMovement = sortedMovements[sortedMovements.length - 1];
            this.props.lastMovementDate = lastMovement.movementDate;
            this.props.lastMovementType = lastMovement.movementType;
        }
    }
    validate() {
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
    toJSON() {
        return { ...this.props };
    }
    clone() {
        return InventoryKardex.fromJSON(this.toJSON());
    }
    isLowStock() {
        return this.props.availableQuantity <= this.props.settings.lowStockThreshold;
    }
    isOutOfStock() {
        return this.props.availableQuantity <= 0;
    }
    needsReorder() {
        return this.props.availableQuantity <= this.props.settings.reorderPoint;
    }
    getStockValue() {
        return Money.create(this.props.currentQuantity * this.props.averageCost.amount, this.props.averageCost.currency);
    }
    getAvailableStockValue() {
        return Money.create(this.props.availableQuantity * this.props.averageCost.amount, this.props.averageCost.currency);
    }
    getReservedStockValue() {
        return Money.create(this.props.reservedQuantity * this.props.averageCost.amount, this.props.averageCost.currency);
    }
    getStockTurnover(periodDays = 365) {
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - (periodDays * 24 * 60 * 60 * 1000));
        const movementsInPeriod = this.props.movements.filter(movement => movement.movementDate >= startDate &&
            movement.movementDate <= endDate &&
            movement.movementType.value === 'out' &&
            movement.status.value === 'completed');
        const totalOutQuantity = movementsInPeriod.reduce((sum, movement) => sum + Math.abs(movement.quantity), 0);
        const averageStock = this.props.currentQuantity / 2;
        return averageStock > 0 ? totalOutQuantity / averageStock : 0;
    }
    getExpiredItems() {
        const now = new Date();
        return this.props.movements.filter(movement => movement.expirationDate &&
            movement.expirationDate < now &&
            movement.quantity > 0);
    }
    getExpiringItems(days = 30) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);
        return this.props.movements.filter(movement => movement.expirationDate &&
            movement.expirationDate <= futureDate &&
            movement.quantity > 0);
    }
    static createPurchaseMovement(productId, quantity, unitCost, warehouseId, locationId, supplierId, batchNumber, expirationDate, reference, referenceId, notes) {
        return {
            id: crypto.randomUUID(),
            productId,
            warehouseId,
            locationId,
            movementType: 'in',
            movementReason: 'purchase',
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
            status: 'completed'
        };
    }
    static createSaleMovement(productId, quantity, unitCost, warehouseId, locationId, customerId, reference, referenceId, notes) {
        return {
            id: crypto.randomUUID(),
            productId,
            warehouseId,
            locationId,
            movementType: 'out',
            movementReason: 'sale',
            quantity: -quantity,
            unitCost,
            totalCost: Money.create(-quantity * unitCost.amount, unitCost.currency),
            reference,
            referenceId,
            notes,
            customerId,
            movementDate: new Date(),
            status: 'completed'
        };
    }
    static createAdjustmentMovement(productId, quantity, unitCost, warehouseId, locationId, reason = 'adjustment', reference, referenceId, notes) {
        return {
            id: crypto.randomUUID(),
            productId,
            warehouseId,
            locationId,
            movementType: 'adjustment',
            movementReason: reason,
            quantity,
            unitCost,
            totalCost: Money.create(quantity * unitCost.amount, unitCost.currency),
            reference,
            referenceId,
            notes,
            movementDate: new Date(),
            status: 'completed'
        };
    }
}
//# sourceMappingURL=inventory-kardex.entity.js.map