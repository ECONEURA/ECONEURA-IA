import { CreateInventoryKardexUseCase } from '../../application/use-cases/inventory-kardex/create-inventory-kardex.use-case.js';
import { UpdateInventoryKardexUseCase } from '../../application/use-cases/inventory-kardex/update-inventory-kardex.use-case.js';
import { RecordMovementUseCase } from '../../application/use-cases/inventory-kardex/record-movement.use-case.js';
import { CreateInventoryKardexRequestSchema, UpdateInventoryKardexRequestSchema, RecordMovementRequestSchema, InventoryKardexIdParamSchema, InventoryKardexOrganizationIdParamSchema, InventoryKardexSearchQuerySchema, InventoryKardexBulkUpdateSchema, InventoryKardexBulkDeleteSchema, ReserveQuantityRequestSchema, ReleaseReservationRequestSchema } from '../dto/inventory-kardex.dto.js';

import { BaseController } from './base.controller.js';
export class InventoryKardexController extends BaseController {
    inventoryKardexRepository;
    createInventoryKardexUseCase;
    updateInventoryKardexUseCase;
    recordMovementUseCase;
    constructor(inventoryKardexRepository) {
        super();
        this.inventoryKardexRepository = inventoryKardexRepository;
        this.createInventoryKardexUseCase = new CreateInventoryKardexUseCase(inventoryKardexRepository);
        this.updateInventoryKardexUseCase = new UpdateInventoryKardexUseCase(inventoryKardexRepository);
        this.recordMovementUseCase = new RecordMovementUseCase(inventoryKardexRepository);
    }
    async createInventoryKardex(req, res, next) {
        await this.handleAsync(async () => {
            const requestData = CreateInventoryKardexRequestSchema.parse(req.body);
            const createdBy = this.getUserId(req);
            const result = await this.createInventoryKardexUseCase.execute({
                ...requestData,
                createdBy
            });
            const response = this.transformInventoryKardexToResponse(result.data.inventoryKardex);
            this.sendSuccessResponse(res, response, 'Inventory kardex created successfully', 201);
        }, res, next);
    }
    async updateInventoryKardex(req, res, next) {
        await this.handleAsync(async () => {
            const { id } = InventoryKardexIdParamSchema.parse(req.params);
            const requestData = UpdateInventoryKardexRequestSchema.parse(req.body);
            const updatedBy = this.getUserId(req);
            const result = await this.updateInventoryKardexUseCase.execute({
                id,
                ...requestData,
                updatedBy
            });
            const response = this.transformInventoryKardexToResponse(result.data.inventoryKardex);
            this.sendSuccessResponse(res, response, 'Inventory kardex updated successfully');
        }, res, next);
    }
    async deleteInventoryKardex(req, res, next) {
        await this.handleAsync(async () => {
            const { id } = InventoryKardexIdParamSchema.parse(req.params);
            const deletedBy = this.getUserId(req);
            await this.inventoryKardexRepository.delete(id);
            this.sendSuccessResponse(res, null, 'Inventory kardex deleted successfully');
        }, res, next);
    }
    async getInventoryKardex(req, res, next) {
        await this.handleAsync(async () => {
            const { id } = InventoryKardexIdParamSchema.parse(req.params);
            const inventoryKardex = await this.inventoryKardexRepository.findById(id);
            if (!inventoryKardex) {
                this.sendNotFoundResponse(res, 'Inventory kardex');
                return;
            }
            const response = this.transformInventoryKardexToResponse(inventoryKardex);
            this.sendSuccessResponse(res, response);
        }, res, next);
    }
    async getInventoryKardexByOrganization(req, res, next) {
        await this.handleAsync(async () => {
            const { organizationId } = InventoryKardexOrganizationIdParamSchema.parse(req.params);
            const query = InventoryKardexSearchQuerySchema.parse(req.query);
            const result = await this.inventoryKardexRepository.findByOrganizationId(organizationId, query);
            const response = {
                data: result.data.map(inventoryKardex => this.transformInventoryKardexToResponse(inventoryKardex)),
                pagination: result.pagination
            };
            this.sendSuccessResponse(res, response);
        }, res, next);
    }
    async searchInventoryKardex(req, res, next) {
        await this.handleAsync(async () => {
            const { organizationId } = InventoryKardexOrganizationIdParamSchema.parse(req.params);
            const query = InventoryKardexSearchQuerySchema.parse(req.query);
            const result = await this.inventoryKardexRepository.search(query.search || '', organizationId, query);
            const response = {
                data: result.data.map(inventoryKardex => this.transformInventoryKardexToResponse(inventoryKardex)),
                pagination: result.pagination
            };
            this.sendSuccessResponse(res, response);
        }, res, next);
    }
    async getInventoryKardexStats(req, res, next) {
        await this.handleAsync(async () => {
            const { organizationId } = InventoryKardexOrganizationIdParamSchema.parse(req.params);
            const stats = await this.inventoryKardexRepository.getStats(organizationId);
            const response = this.transformStatsToResponse(stats);
            this.sendSuccessResponse(res, response);
        }, res, next);
    }
    async getInventoryByProduct(req, res, next) {
        await this.handleAsync(async () => {
            const { organizationId } = InventoryKardexOrganizationIdParamSchema.parse(req.params);
            const { productId } = req.params;
            const query = InventoryKardexSearchQuerySchema.parse(req.query);
            const result = await this.inventoryKardexRepository.findByProductId(productId, organizationId, query);
            const response = {
                data: result.data.map(inventoryKardex => this.transformInventoryKardexToResponse(inventoryKardex)),
                pagination: result.pagination
            };
            this.sendSuccessResponse(res, response);
        }, res, next);
    }
    async getInventoryByWarehouse(req, res, next) {
        await this.handleAsync(async () => {
            const { organizationId } = InventoryKardexOrganizationIdParamSchema.parse(req.params);
            const { warehouseId } = req.params;
            const query = InventoryKardexSearchQuerySchema.parse(req.query);
            const result = await this.inventoryKardexRepository.findByWarehouseId(warehouseId, organizationId, query);
            const response = {
                data: result.data.map(inventoryKardex => this.transformInventoryKardexToResponse(inventoryKardex)),
                pagination: result.pagination
            };
            this.sendSuccessResponse(res, response);
        }, res, next);
    }
    async getLowStockInventory(req, res, next) {
        await this.handleAsync(async () => {
            const { organizationId } = InventoryKardexOrganizationIdParamSchema.parse(req.params);
            const query = InventoryKardexSearchQuerySchema.parse(req.query);
            const result = await this.inventoryKardexRepository.findLowStock(organizationId, undefined, query);
            const response = {
                data: result.data.map(inventoryKardex => this.transformInventoryKardexToResponse(inventoryKardex)),
                pagination: result.pagination
            };
            this.sendSuccessResponse(res, response);
        }, res, next);
    }
    async getOutOfStockInventory(req, res, next) {
        await this.handleAsync(async () => {
            const { organizationId } = InventoryKardexOrganizationIdParamSchema.parse(req.params);
            const query = InventoryKardexSearchQuerySchema.parse(req.query);
            const result = await this.inventoryKardexRepository.findOutOfStock(organizationId, query);
            const response = {
                data: result.data.map(inventoryKardex => this.transformInventoryKardexToResponse(inventoryKardex)),
                pagination: result.pagination
            };
            this.sendSuccessResponse(res, response);
        }, res, next);
    }
    async getNeedsReorderInventory(req, res, next) {
        await this.handleAsync(async () => {
            const { organizationId } = InventoryKardexOrganizationIdParamSchema.parse(req.params);
            const query = InventoryKardexSearchQuerySchema.parse(req.query);
            const result = await this.inventoryKardexRepository.findNeedsReorder(organizationId, query);
            const response = {
                data: result.data.map(inventoryKardex => this.transformInventoryKardexToResponse(inventoryKardex)),
                pagination: result.pagination
            };
            this.sendSuccessResponse(res, response);
        }, res, next);
    }
    async recordMovement(req, res, next) {
        await this.handleAsync(async () => {
            const requestData = RecordMovementRequestSchema.parse(req.body);
            const createdBy = this.getUserId(req);
            const result = await this.recordMovementUseCase.execute({
                ...requestData,
                createdBy
            });
            const response = {
                inventoryKardex: this.transformInventoryKardexToResponse(result.data.inventoryKardex),
                movement: result.data.movement
            };
            this.sendSuccessResponse(res, response, 'Movement recorded successfully');
        }, res, next);
    }
    async reserveQuantity(req, res, next) {
        await this.handleAsync(async () => {
            const { id } = InventoryKardexIdParamSchema.parse(req.params);
            const requestData = ReserveQuantityRequestSchema.parse(req.body);
            const inventoryKardex = await this.inventoryKardexRepository.findById(id);
            if (!inventoryKardex) {
                this.sendNotFoundResponse(res, 'Inventory kardex');
                return;
            }
            inventoryKardex.reserveQuantity(requestData.quantity, requestData.reference, requestData.referenceId);
            const updatedInventoryKardex = await this.inventoryKardexRepository.update(inventoryKardex);
            const response = this.transformInventoryKardexToResponse(updatedInventoryKardex);
            this.sendSuccessResponse(res, response, 'Quantity reserved successfully');
        }, res, next);
    }
    async releaseReservation(req, res, next) {
        await this.handleAsync(async () => {
            const { id } = InventoryKardexIdParamSchema.parse(req.params);
            const requestData = ReleaseReservationRequestSchema.parse(req.body);
            const inventoryKardex = await this.inventoryKardexRepository.findById(id);
            if (!inventoryKardex) {
                this.sendNotFoundResponse(res, 'Inventory kardex');
                return;
            }
            inventoryKardex.releaseReservation(requestData.quantity);
            const updatedInventoryKardex = await this.inventoryKardexRepository.update(inventoryKardex);
            const response = this.transformInventoryKardexToResponse(updatedInventoryKardex);
            this.sendSuccessResponse(res, response, 'Reservation released successfully');
        }, res, next);
    }
    async bulkUpdateInventoryKardex(req, res, next) {
        await this.handleAsync(async () => {
            const requestData = InventoryKardexBulkUpdateSchema.parse(req.body);
            const updatedBy = this.getUserId(req);
            if (requestData.updates.lowStockThreshold !== undefined) {
                await this.inventoryKardexRepository.updateThresholdsMany(requestData.ids, requestData.updates.lowStockThreshold, requestData.updates.reorderPoint || 0);
            }
            if (requestData.updates.costMethod !== undefined) {
                await this.inventoryKardexRepository.updateCostMethodMany(requestData.ids, requestData.updates.costMethod, requestData.updates.valuationMethod || 'fifo');
            }
            this.sendSuccessResponse(res, {
                updated: requestData.ids.length,
                ids: requestData.ids
            }, `${requestData.ids.length} inventory kardex records updated successfully`);
        }, res, next);
    }
    async bulkDeleteInventoryKardex(req, res, next) {
        await this.handleAsync(async () => {
            const requestData = InventoryKardexBulkDeleteSchema.parse(req.body);
            const deletedBy = this.getUserId(req);
            await this.inventoryKardexRepository.deleteMany(requestData.ids);
            this.sendSuccessResponse(res, {
                deleted: requestData.ids.length,
                ids: requestData.ids
            }, `${requestData.ids.length} inventory kardex records deleted successfully`);
        }, res, next);
    }
    transformInventoryKardexToResponse(inventoryKardex) {
        return {
            id: inventoryKardex.id.value,
            organizationId: inventoryKardex.organizationId.value,
            productId: inventoryKardex.productId,
            warehouseId: inventoryKardex.warehouseId,
            locationId: inventoryKardex.locationId,
            initialQuantity: inventoryKardex.initialQuantity,
            currentQuantity: inventoryKardex.currentQuantity,
            reservedQuantity: inventoryKardex.reservedQuantity,
            availableQuantity: inventoryKardex.availableQuantity,
            unitCost: {
                amount: inventoryKardex.unitCost.amount,
                currency: inventoryKardex.unitCost.currency
            },
            totalCost: {
                amount: inventoryKardex.totalCost.amount,
                currency: inventoryKardex.totalCost.currency
            },
            averageCost: {
                amount: inventoryKardex.averageCost.amount,
                currency: inventoryKardex.averageCost.currency
            },
            lastMovementDate: inventoryKardex.lastMovementDate,
            lastMovementType: inventoryKardex.lastMovementType?.value,
            movements: inventoryKardex.movements.map((movement) => ({
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
            })),
            settings: {
                trackInventory: inventoryKardex.settings.trackInventory,
                allowNegativeStock: inventoryKardex.settings.allowNegativeStock,
                lowStockThreshold: inventoryKardex.settings.lowStockThreshold,
                reorderPoint: inventoryKardex.settings.reorderPoint,
                reorderQuantity: inventoryKardex.settings.reorderQuantity,
                costMethod: inventoryKardex.settings.costMethod,
                valuationMethod: inventoryKardex.settings.valuationMethod,
                autoReorder: inventoryKardex.settings.autoReorder,
                trackExpiration: inventoryKardex.settings.trackExpiration,
                trackSerialNumbers: inventoryKardex.settings.trackSerialNumbers,
                trackBatchNumbers: inventoryKardex.settings.trackBatchNumbers,
                customFields: inventoryKardex.settings.customFields,
                tags: inventoryKardex.settings.tags,
                notes: inventoryKardex.settings.notes
            },
            isActive: inventoryKardex.isActive,
            createdAt: inventoryKardex.createdAt,
            updatedAt: inventoryKardex.updatedAt
        };
    }
    transformStatsToResponse(stats) {
        return {
            total: stats.total,
            active: stats.active,
            inactive: stats.inactive,
            createdThisMonth: stats.createdThisMonth,
            createdThisYear: stats.createdThisYear,
            updatedThisMonth: stats.updatedThisMonth,
            updatedThisYear: stats.updatedThisYear,
            byProduct: stats.byProduct,
            byWarehouse: stats.byWarehouse,
            byLocation: stats.byLocation,
            byMovementType: stats.byMovementType,
            byMovementReason: stats.byMovementReason,
            totalQuantity: stats.totalQuantity,
            totalValue: stats.totalValue,
            availableQuantity: stats.availableQuantity,
            availableValue: stats.availableValue,
            reservedQuantity: stats.reservedQuantity,
            reservedValue: stats.reservedValue,
            lowStockCount: stats.lowStockCount,
            outOfStockCount: stats.outOfStockCount,
            needsReorderCount: stats.needsReorderCount,
            expiredItemsCount: stats.expiredItemsCount,
            expiringItemsCount: stats.expiringItemsCount,
            averageStockTurnover: stats.averageStockTurnover,
            totalMovements: stats.totalMovements,
            movementsIn: stats.movementsIn,
            movementsOut: stats.movementsOut,
            movementsTransfer: stats.movementsTransfer,
            movementsAdjustment: stats.movementsAdjustment
        };
    }
}
//# sourceMappingURL=inventory-kardex.controller.js.map