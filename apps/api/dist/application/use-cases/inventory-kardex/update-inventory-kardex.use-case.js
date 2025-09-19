import { BaseUseCase } from '../base.use-case.js';
export class UpdateInventoryKardexUseCase extends BaseUseCase {
    inventoryKardexRepository;
    constructor(inventoryKardexRepository) {
        super();
        this.inventoryKardexRepository = inventoryKardexRepository;
    }
    async execute(request) {
        this.validateId(request.id, 'Inventory Kardex ID');
        const existingInventoryKardex = await this.inventoryKardexRepository.findById(request.id);
        if (!existingInventoryKardex) {
            throw new Error(`Inventory kardex with ID '${request.id}' not found`);
        }
        if (request.warehouseId && request.warehouseId !== existingInventoryKardex.warehouseId) {
            const existingKardex = await this.inventoryKardexRepository.findByProductAndWarehouse(existingInventoryKardex.productId, request.warehouseId, request.organizationId);
            if (existingKardex && existingKardex.id.value !== request.id) {
                throw new Error(`Inventory kardex already exists for product '${existingInventoryKardex.productId}' in warehouse '${request.warehouseId}'`);
            }
        }
        if (request.locationId && request.locationId !== existingInventoryKardex.locationId) {
            const existingKardex = await this.inventoryKardexRepository.findByProductAndLocation(existingInventoryKardex.productId, request.locationId, request.organizationId);
            if (existingKardex && existingKardex.id.value !== request.id) {
                throw new Error(`Inventory kardex already exists for product '${existingInventoryKardex.productId}' in location '${request.locationId}'`);
            }
        }
        if (request.warehouseId !== undefined) {
            existingInventoryKardex.updateWarehouseId(request.warehouseId);
        }
        if (request.locationId !== undefined) {
            existingInventoryKardex.updateLocationId(request.locationId);
        }
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
        if (!existingInventoryKardex.validate()) {
            throw new Error('Invalid inventory kardex data after update');
        }
        const updatedInventoryKardex = await this.inventoryKardexRepository.update(existingInventoryKardex);
        return this.createSuccessResponse({
            inventoryKardex: updatedInventoryKardex,
        }, 'Inventory kardex updated successfully');
    }
}
//# sourceMappingURL=update-inventory-kardex.use-case.js.map