import { InventoryKardex } from '../../../domain/entities/inventory-kardex.entity.js';
import { InventoryKardexRepository } from '../../../domain/repositories/inventory-kardex.repository.js';
import { BaseUseCase, BaseRequest, BaseResponse } from '../base.use-case.js';
import { Money } from '../../../domain/value-objects/money.vo.js';

// ============================================================================
// RECORD MOVEMENT USE CASE
// ============================================================================

export interface RecordMovementRequest extends BaseRequest {
  inventoryKardexId: string;
  movementType: 'in' | 'out' | 'transfer' | 'adjustment' | 'return' | 'damage' | 'expired' | 'theft';
  movementReason: 'purchase' | 'sale' | 'transfer_in' | 'transfer_out' | 'adjustment' | 'return' | 'damage' | 'expired' | 'theft' | 'production' | 'consumption' | 'other';
  quantity: number;
  unitCost?: {
    amount: number;
    currency: string;
  };
  reference?: string;
  referenceId?: string;
  notes?: string;
  batchNumber?: string;
  expirationDate?: Date;
  serialNumber?: string;
  supplierId?: string;
  customerId?: string;
  toWarehouseId?: string;
  toLocationId?: string;
}

export interface RecordMovementResponse extends BaseResponse {
  data: {
    inventoryKardex: InventoryKardex;
    movement: any;
  };
}

export class RecordMovementUseCase extends BaseUseCase<RecordMovementRequest, RecordMovementResponse> {
  constructor(
    private readonly inventoryKardexRepository: InventoryKardexRepository
  ) {
    super();
  }

  async execute(request: RecordMovementRequest): Promise<RecordMovementResponse> {
    // ========================================================================
    // VALIDATION
    // ========================================================================

    this.validateBaseRequest(request);
    this.validateId(request.inventoryKardexId, 'Inventory Kardex ID');
    this.validateString(request.movementType, 'Movement type');
    this.validateString(request.movementReason, 'Movement reason');

    if (request.quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    // ========================================================================
    // FIND EXISTING INVENTORY KARDEX
    // ========================================================================

    const existingInventoryKardex = await this.inventoryKardexRepository.findById(request.inventoryKardexId);
    if (!existingInventoryKardex) {
      throw new Error(`Inventory kardex with ID '${request.inventoryKardexId}' not found`);
    }

    // ========================================================================
    // BUSINESS LOGIC VALIDATION
    // ========================================================================

    // Validate out movements
    if (request.movementType === 'out' || request.movementType === 'transfer') {
      if (request.quantity > existingInventoryKardex.availableQuantity && !existingInventoryKardex.settings.allowNegativeStock) {
        throw new Error('Insufficient stock available');
      }
    }

    // Validate transfer movements
    if (request.movementType === 'transfer') {
      if (!request.toWarehouseId && !request.toLocationId) {
        throw new Error('Transfer destination (warehouse or location) is required');
      }
    }

    // ========================================================================
    // RECORD MOVEMENT
    // ========================================================================

    let movement: any;

    switch (request.movementType) {
      case 'in':
        const unitCost = request.unitCost ? Money.create(request.unitCost.amount, request.unitCost.currency) : existingInventoryKardex.averageCost;
        existingInventoryKardex.recordInMovement(
          request.quantity,
          unitCost,
          { value: request.movementReason },
          request.reference,
          request.referenceId,
          request.notes,
          request.batchNumber,
          request.expirationDate,
          request.serialNumber,
          request.supplierId,
          request.createdBy
        );
        break;

      case 'out':
        existingInventoryKardex.recordOutMovement(
          request.quantity,
          { value: request.movementReason },
          request.reference,
          request.referenceId,
          request.notes,
          request.batchNumber,
          request.serialNumber,
          request.customerId,
          request.createdBy
        );
        break;

      case 'transfer':
        existingInventoryKardex.recordTransferMovement(
          request.quantity,
          request.toWarehouseId!,
          request.toLocationId,
          { value: request.movementReason },
          request.reference,
          request.referenceId,
          request.notes,
          request.createdBy
        );
        break;

      case 'adjustment':
        const adjustmentUnitCost = request.unitCost ? Money.create(request.unitCost.amount, request.unitCost.currency) : existingInventoryKardex.averageCost;
        existingInventoryKardex.recordAdjustmentMovement(
          request.quantity,
          adjustmentUnitCost,
          { value: request.movementReason },
          request.reference,
          request.referenceId,
          request.notes,
          request.createdBy
        );
        break;

      default:
        throw new Error(`Unsupported movement type: ${request.movementType}`);
    }

    // Get the last movement (the one we just added)
    movement = existingInventoryKardex.movements[existingInventoryKardex.movements.length - 1];

    // ========================================================================
    // VALIDATE UPDATED INVENTORY KARDEX
    // ========================================================================

    if (!existingInventoryKardex.validate()) {
      throw new Error('Invalid inventory kardex data after movement');
    }

    // ========================================================================
    // SAVE UPDATED INVENTORY KARDEX
    // ========================================================================

    const updatedInventoryKardex = await this.inventoryKardexRepository.update(existingInventoryKardex);

    // ========================================================================
    // RETURN RESPONSE
    // ========================================================================

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
