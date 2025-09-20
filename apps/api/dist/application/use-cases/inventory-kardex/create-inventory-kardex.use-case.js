import { InventoryKardex } from '../../../domain/entities/inventory-kardex.entity.js';
import { BaseUseCase } from '../base.use-case.js';
import { Money } from '../../../domain/value-objects/money.vo.js';
export class CreateInventoryKardexUseCase extends BaseUseCase {
    inventoryKardexRepository;
    constructor(inventoryKardexRepository) {
        super();
        this.inventoryKardexRepository = inventoryKardexRepository;
    }
    async execute(request) {
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
        if (request.warehouseId) {
            const existingKardex = await this.inventoryKardexRepository.findByProductAndWarehouse(request.productId, request.warehouseId, request.organizationId);
            if (existingKardex) {
                throw new Error(`Inventory kardex already exists for product '${request.productId}' in warehouse '${request.warehouseId}'`);
            }
        }
        if (request.locationId) {
            const existingKardex = await this.inventoryKardexRepository.findByProductAndLocation(request.productId, request.locationId, request.organizationId);
            if (existingKardex) {
                throw new Error(`Inventory kardex already exists for product '${request.productId}' in location '${request.locationId}'`);
            }
        }
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
        if (!inventoryKardex.validate()) {
            throw new Error('Invalid inventory kardex data');
        }
        const savedInventoryKardex = await this.inventoryKardexRepository.save(inventoryKardex);
        return this.createSuccessResponse({
            inventoryKardex: savedInventoryKardex,
        }, 'Inventory kardex created successfully');
    }
}
//# sourceMappingURL=create-inventory-kardex.use-case.js.map