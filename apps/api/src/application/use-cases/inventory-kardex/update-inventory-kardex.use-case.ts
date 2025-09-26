import { InventoryKardex } from '../../../domain/entities/inventory-kardex.entity.js';
import { InventoryKardexRepository } from '../../../domain/repositories/inventory-kardex.repository.js';
import { BaseUseCase, BaseRequest, BaseResponse } from '../base.use-case.js';

// ============================================================================
// UPDATE INVENTORY KARDEX USE CASE
// ============================================================================

export interface UpdateInventoryKardexRequest extends BaseRequest {
  id: string;
  warehouseId?: string;
  locationId?: string;
  settings?: {
    trackInventory?: boolean;
    allowNegativeStock?: boolean;
    lowStockThreshold?: number;
    reorderPoint?: number;
    reorderQuantity?: number;
    costMethod?: 'fifo' | 'lifo' | 'average' | 'standard';
    valuationMethod?: 'fifo' | 'lifo' | 'average' | 'standard';
    autoReorder?: boolean;
    trackExpiration?: boolean;
    trackSerialNumbers?: boolean;
    trackBatchNumbers?: boolean;
    customFields?: Record<string, any>;
    tags?: string[];
    notes?: string;
  };
}

export interface UpdateInventoryKardexResponse extends BaseResponse {
  data: {
    inventoryKardex: InventoryKardex;
  };
}

export class UpdateInventoryKardexUseCase extends BaseUseCase<UpdateInventoryKardexRequest, UpdateInventoryKardexResponse> {
  constructor(
    private readonly inventoryKardexRepository: InventoryKardexRepository
  ) {
    super();
  }

  async execute(request: UpdateInventoryKardexRequest): Promise<UpdateInventoryKardexResponse> {
    // ========================================================================
    // VALIDATION
    // ========================================================================

    this.validateId(request.id, 'Inventory Kardex ID');

    // ========================================================================
    // FIND EXISTING INVENTORY KARDEX
    // ========================================================================

    const existingInventoryKardex = await this.inventoryKardexRepository.findById(request.id);
    if (!existingInventoryKardex) {
      throw new Error(`Inventory kardex with ID '${request.id}' not found`);
    }

    // ========================================================================
    // BUSINESS LOGIC VALIDATION
    // ========================================================================

    // Check if warehouse change would create duplicate
    if (request.warehouseId && request.warehouseId !== existingInventoryKardex.warehouseId) {
      const existingKardex = await this.inventoryKardexRepository.findByProductAndWarehouse(
        existingInventoryKardex.productId,
        request.warehouseId,
        request.organizationId
      );
      if (existingKardex && existingKardex.id.value !== request.id) {
        throw new Error(`Inventory kardex already exists for product '${existingInventoryKardex.productId}' in warehouse '${request.warehouseId}'`);
      }
    }

    // Check if location change would create duplicate
    if (request.locationId && request.locationId !== existingInventoryKardex.locationId) {
      const existingKardex = await this.inventoryKardexRepository.findByProductAndLocation(
        existingInventoryKardex.productId,
        request.locationId,
        request.organizationId
      );
      if (existingKardex && existingKardex.id.value !== request.id) {
        throw new Error(`Inventory kardex already exists for product '${existingInventoryKardex.productId}' in location '${request.locationId}'`);
      }
    }

    // ========================================================================
    // UPDATE INVENTORY KARDEX
    // ========================================================================

    // Update warehouse
    if (request.warehouseId !== undefined) {
      existingInventoryKardex.updateWarehouseId(request.warehouseId);
    }

    // Update location
    if (request.locationId !== undefined) {
      existingInventoryKardex.updateLocationId(request.locationId);
    }

    // Update settings
    if (request.settings !== undefined) {
      const currentSettings = existingInventoryKardex.settings;
      const updatedSettings = {
        trackInventory: request.settings.trackInventory !== undefined ? request.settings.trackInventory : currentSettings.trackInventory,
        allowNegativeStock: request.settings.allowNegativeStock !== undefined ? request.settings.allowNegativeStock : currentSettings.allowNegativeStock,
        lowStockThreshold: request.settings.lowStockThreshold !== undefined ? request.settings.lowStockThreshold : currentSettings.lowStockThreshold,
        reorderPoint: request.settings.reorderPoint !== undefined ? request.settings.reorderPoint : currentSettings.reorderPoint,
        reorderQuantity: request.settings.reorderQuantity !== undefined ? request.settings.reorderQuantity : currentSettings.reorderQuantity,
        costMethod: request.settings.costMethod || currentSettings.costMethod,
        valuationMethod: request.settings.valuationMethod || currentSettings.valuationMethod,
        autoReorder: request.settings.autoReorder !== undefined ? request.settings.autoReorder : currentSettings.autoReorder,
        trackExpiration: request.settings.trackExpiration !== undefined ? request.settings.trackExpiration : currentSettings.trackExpiration,
        trackSerialNumbers: request.settings.trackSerialNumbers !== undefined ? request.settings.trackSerialNumbers : currentSettings.trackSerialNumbers,
        trackBatchNumbers: request.settings.trackBatchNumbers !== undefined ? request.settings.trackBatchNumbers : currentSettings.trackBatchNumbers,
        customFields: { ...currentSettings.customFields, ...request.settings.customFields },
        tags: request.settings.tags || currentSettings.tags,
        notes: request.settings.notes || currentSettings.notes,
      };
      existingInventoryKardex.updateSettings(updatedSettings);
    }

    // ========================================================================
    // VALIDATE UPDATED INVENTORY KARDEX
    // ========================================================================

    if (!existingInventoryKardex.validate()) {
      throw new Error('Invalid inventory kardex data after update');
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
    }, 'Inventory kardex updated successfully');
  }
}
