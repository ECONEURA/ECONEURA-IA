import { BaseUseCase } from '../base.use-case.js';
import { Money } from '../../../domain/value-objects/money.vo.js';
export class RecordMovementUseCase extends BaseUseCase {
    inventoryKardexRepository;
    constructor(inventoryKardexRepository) {
        super();
        this.inventoryKardexRepository = inventoryKardexRepository;
    }
    async execute(request) {
        this.validateBaseRequest(request);
        this.validateId(request.inventoryKardexId, 'Inventory Kardex ID');
        this.validateString(request.movementType, 'Movement type');
        this.validateString(request.movementReason, 'Movement reason');
        if (request.quantity <= 0) {
            throw new Error('Quantity must be greater than 0');
        }
        const existingInventoryKardex = await this.inventoryKardexRepository.findById(request.inventoryKardexId);
        if (!existingInventoryKardex) {
            throw new Error(`Inventory kardex with ID '${request.inventoryKardexId}' not found`);
        }
        if (request.movementType === 'out' || request.movementType === 'transfer') {
            if (request.quantity > existingInventoryKardex.availableQuantity && !existingInventoryKardex.settings.allowNegativeStock) {
                throw new Error('Insufficient stock available');
            }
        }
        if (request.movementType === 'transfer') {
            if (!request.toWarehouseId && !request.toLocationId) {
                throw new Error('Transfer destination (warehouse or location) is required');
            }
        }
        let movement;
        switch (request.movementType) {
            case 'in':
                const unitCost = request.unitCost ? Money.create(request.unitCost.amount, request.unitCost.currency) : existingInventoryKardex.averageCost;
                existingInventoryKardex.recordInMovement(request.quantity, unitCost, request.movementReason, request.reference, request.referenceId, request.notes, request.batchNumber, request.expirationDate, request.serialNumber, request.supplierId, request.createdBy);
                break;
            case 'out':
                existingInventoryKardex.recordOutMovement(request.quantity, request.movementReason, request.reference, request.referenceId, request.notes, request.batchNumber, request.serialNumber, request.customerId, request.createdBy);
                break;
            case 'transfer':
                existingInventoryKardex.recordTransferMovement(request.quantity, request.toWarehouseId, request.toLocationId, request.movementReason, request.reference, request.referenceId, request.notes, request.createdBy);
                break;
            case 'adjustment':
                const adjustmentUnitCost = request.unitCost ? Money.create(request.unitCost.amount, request.unitCost.currency) : existingInventoryKardex.averageCost;
                existingInventoryKardex.recordAdjustmentMovement(request.quantity, adjustmentUnitCost, request.movementReason, request.reference, request.referenceId, request.notes, request.createdBy);
                break;
            default:
                throw new Error(`Unsupported movement type: ${request.movementType}`);
        }
        movement = existingInventoryKardex.movements[existingInventoryKardex.movements.length - 1];
        if (!existingInventoryKardex.validate()) {
            throw new Error('Invalid inventory kardex data after movement');
        }
        const updatedInventoryKardex = await this.inventoryKardexRepository.update(existingInventoryKardex);
        return this.createSuccessResponse({
            inventoryKardex: updatedInventoryKardex,
            movement: {
                id: movement.id,
                productId: movement.productId,
                warehouseId: movement.warehouseId,
                locationId: movement.locationId,
                movementType: movement.movementType.value,
                movementReason: movement.movementReason.value,
                quantity: movement.quantity,
                unitCost: {
                    amount: movement.unitCost.amount,
                    currency: movement.unitCost.currency
                },
                totalCost: {
                    amount: movement.totalCost.amount,
                    currency: movement.totalCost.currency
                },
                reference: movement.reference,
                referenceId: movement.referenceId,
                notes: movement.notes,
                batchNumber: movement.batchNumber,
                expirationDate: movement.expirationDate,
                serialNumber: movement.serialNumber,
                supplierId: movement.supplierId,
                customerId: movement.customerId,
                userId: movement.userId,
                movementDate: movement.movementDate,
                status: movement.status.value
            }
        }, 'Movement recorded successfully');
    }
}
//# sourceMappingURL=record-movement.use-case.js.map