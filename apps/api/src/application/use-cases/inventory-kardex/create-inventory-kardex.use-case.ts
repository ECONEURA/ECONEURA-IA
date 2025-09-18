import { InventoryKardex } from '../../../domain/entities/inventory-kardex.entity.js';
import { InventoryKardexRepository } from '../../../domain/repositories/inventory-kardex.repository.js';
import { BaseUseCase, BaseRequest, BaseResponse } from '../base.use-case.js';
import { Money } from '../../../domain/value-objects/money.vo.js';

// ============================================================================
// CREATE INVENTORY KARDEX USE CASE
// ============================================================================

export interface CreateInventoryKardexRequest extends BaseRequest {
  productId: string;
  warehouseId?: string;
  locationId?: string;
  initialQuantity: number;
  unitCost: {
    amount: number;
    currency: string;
  };
  settings: {
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
  };
}

export interface CreateInventoryKardexResponse extends BaseResponse {
  data: {
    inventoryKardex: InventoryKardex;
  };
}

export class CreateInventoryKardexUseCase extends BaseUseCase<CreateInventoryKardexRequest, CreateInventoryKardexResponse> {
  constructor(
    private readonly inventoryKardexRepository: InventoryKardexRepository
  ) {
    super();
  }

  async execute(request: CreateInventoryKardexRequest): Promise<CreateInventoryKardexResponse> {
    // ========================================================================
    // VALIDATION
    // ========================================================================

    this.validateBaseRequest(request);
    this.validateId(request.productId, 'Product ID');
    this.validateString(request.settings.costMethod, 'Cost method');
    this.validateString(request.settings.valuationMethod, 'Valuation method');

    if (request.initialQuantity < 0) {
      throw new Error('Initial quantity cannot be negative');
    }

    if (request.settings.lowStockThreshold < 0) {
      throw new Error('Low stock threshold cannot be negative');
    }

    if (request.settings.reorderPoint < 0) {
      throw new Error('Reorder point cannot be negative');
    }

    if (request.settings.reorderQuantity < 0) {
      throw new Error('Reorder quantity cannot be negative');
    }

    // ========================================================================
    // BUSINESS LOGIC VALIDATION
    // ========================================================================

    // Check if inventory kardex already exists for this product and warehouse
    if (request.warehouseId) {
      const existingKardex = await this.inventoryKardexRepository.findByProductAndWarehouse(
        request.productId,
        request.warehouseId,
        request.organizationId
      );
      if (existingKardex) {
        throw new Error(`Inventory kardex already exists for product '${request.productId}' in warehouse '${request.warehouseId}'`);
      }
    }

    // Check if inventory kardex already exists for this product and location
    if (request.locationId) {
      const existingKardex = await this.inventoryKardexRepository.findByProductAndLocation(
        request.productId,
        request.locationId,
        request.organizationId
      );
      if (existingKardex) {
        throw new Error(`Inventory kardex already exists for product '${request.productId}' in location '${request.locationId}'`);
      }
    }

    // ========================================================================
    // CREATE INVENTORY KARDEX
    // ========================================================================

    const unitCost = Money.create(request.unitCost.amount, request.unitCost.currency);
    const totalCost = Money.create(request.initialQuantity * request.unitCost.amount, request.unitCost.currency);

    const inventoryKardex = InventoryKardex.create({
      organizationId: request.organizationId,
      productId: request.productId,
      warehouseId: request.warehouseId,
      locationId: request.locationId,
      initialQuantity: request.initialQuantity,
      currentQuantity: request.initialQuantity,
      reservedQuantity: 0,
      availableQuantity: request.initialQuantity,
      unitCost,
      totalCost,
      averageCost: unitCost,
      lastMovementDate: undefined,
      lastMovementType: undefined,
      movements: [],
      settings: {
        trackInventory: request.settings.trackInventory,
        allowNegativeStock: request.settings.allowNegativeStock,
        lowStockThreshold: request.settings.lowStockThreshold,
        reorderPoint: request.settings.reorderPoint,
        reorderQuantity: request.settings.reorderQuantity,
        costMethod: request.settings.costMethod,
        valuationMethod: request.settings.valuationMethod,
        autoReorder: request.settings.autoReorder,
        trackExpiration: request.settings.trackExpiration,
        trackSerialNumbers: request.settings.trackSerialNumbers,
        trackBatchNumbers: request.settings.trackBatchNumbers,
        customFields: request.settings.customFields,
        tags: request.settings.tags,
        notes: request.settings.notes,
      },
      isActive: true,
    });

    // ========================================================================
    // VALIDATE INVENTORY KARDEX
    // ========================================================================

    if (!inventoryKardex.validate()) {
      throw new Error('Invalid inventory kardex data');
    }

    // ========================================================================
    // SAVE INVENTORY KARDEX
    // ========================================================================

    const savedInventoryKardex = await this.inventoryKardexRepository.save(inventoryKardex);

    // ========================================================================
    // RETURN RESPONSE
    // ========================================================================

    return this.createSuccessResponse({
      inventoryKardex: savedInventoryKardex,
    }, 'Inventory kardex created successfully');
  }
}
