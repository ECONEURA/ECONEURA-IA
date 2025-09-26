import { Router } from 'express';
import { z } from 'zod';

import { validateRequest, authenticate, authorize } from '../middleware/base.middleware.js';
export const createInventoryKardexRoutes = (inventoryKardexController) => {
    const router = Router();
    router.post('/', authenticate, authorize(['inventory:create']), validateRequest({
        body: z.object({
            organizationId: z.string().uuid(),
            productId: z.string().uuid(),
            warehouseId: z.string().uuid().optional(),
            locationId: z.string().uuid().optional(),
            initialQuantity: z.number().min(0),
            unitCost: z.object({
                amount: z.number().min(0),
                currency: z.string().length(3)
            }),
            settings: z.object({
                trackInventory: z.boolean().default(true),
                allowNegativeStock: z.boolean().default(false),
                lowStockThreshold: z.number().min(0).default(10),
                reorderPoint: z.number().min(0).default(5),
                reorderQuantity: z.number().min(0).default(50),
                costMethod: z.enum(['fifo', 'lifo', 'average', 'standard']).default('fifo'),
                valuationMethod: z.enum(['fifo', 'lifo', 'average', 'standard']).default('fifo'),
                autoReorder: z.boolean().default(false),
                trackExpiration: z.boolean().default(false),
                trackSerialNumbers: z.boolean().default(false),
                trackBatchNumbers: z.boolean().default(false),
                customFields: z.record(z.any()).default({}),
                tags: z.array(z.string()).default([]),
                notes: z.string().max(1000).default('')
            })
        })
    }), inventoryKardexController.createInventoryKardex.bind(inventoryKardexController));
    router.put('/:id', authenticate, authorize(['inventory:update']), validateRequest({
        params: z.object({
            id: z.string().uuid()
        }),
        body: z.object({
            warehouseId: z.string().uuid().optional(),
            locationId: z.string().uuid().optional(),
            settings: z.object({
                trackInventory: z.boolean().optional(),
                allowNegativeStock: z.boolean().optional(),
                lowStockThreshold: z.number().min(0).optional(),
                reorderPoint: z.number().min(0).optional(),
                reorderQuantity: z.number().min(0).optional(),
                costMethod: z.enum(['fifo', 'lifo', 'average', 'standard']).optional(),
                valuationMethod: z.enum(['fifo', 'lifo', 'average', 'standard']).optional(),
                autoReorder: z.boolean().optional(),
                trackExpiration: z.boolean().optional(),
                trackSerialNumbers: z.boolean().optional(),
                trackBatchNumbers: z.boolean().optional(),
                customFields: z.record(z.any()).optional(),
                tags: z.array(z.string()).optional(),
                notes: z.string().max(1000).optional()
            }).optional()
        })
    }), inventoryKardexController.updateInventoryKardex.bind(inventoryKardexController));
    router.delete('/:id', authenticate, authorize(['inventory:delete']), validateRequest({
        params: z.object({
            id: z.string().uuid()
        })
    }), inventoryKardexController.deleteInventoryKardex.bind(inventoryKardexController));
    router.get('/:id', authenticate, authorize(['inventory:read']), validateRequest({
        params: z.object({
            id: z.string().uuid()
        })
    }), inventoryKardexController.getInventoryKardex.bind(inventoryKardexController));
    router.get('/organizations/:organizationId', authenticate, authorize(['inventory:read']), validateRequest({
        params: z.object({
            organizationId: z.string().uuid()
        }),
        query: z.object({
            page: z.coerce.number().int().min(1).default(1),
            limit: z.coerce.number().int().min(1).max(100).default(20),
            sortBy: z.string().default('createdAt'),
            sortOrder: z.enum(['asc', 'desc']).default('desc'),
            search: z.string().max(200).optional(),
            productId: z.string().uuid().optional(),
            warehouseId: z.string().uuid().optional(),
            locationId: z.string().uuid().optional(),
            movementType: z.enum(['in', 'out', 'transfer', 'adjustment', 'return', 'damage', 'expired', 'theft']).optional(),
            movementReason: z.enum(['purchase', 'sale', 'transfer_in', 'transfer_out', 'adjustment', 'return', 'damage', 'expired', 'theft', 'production', 'consumption', 'other']).optional(),
            status: z.enum(['pending', 'completed', 'cancelled', 'reversed']).optional(),
            lowStock: z.coerce.boolean().optional(),
            outOfStock: z.coerce.boolean().optional(),
            needsReorder: z.coerce.boolean().optional(),
            hasExpiredItems: z.coerce.boolean().optional(),
            hasExpiringItems: z.coerce.boolean().optional(),
            minQuantity: z.coerce.number().min(0).optional(),
            maxQuantity: z.coerce.number().min(0).optional(),
            minValue: z.coerce.number().min(0).optional(),
            maxValue: z.coerce.number().min(0).optional(),
            costMethod: z.enum(['fifo', 'lifo', 'average', 'standard']).optional(),
            valuationMethod: z.enum(['fifo', 'lifo', 'average', 'standard']).optional()
        })
    }), inventoryKardexController.getInventoryKardexByOrganization.bind(inventoryKardexController));
    router.get('/organizations/:organizationId/search', authenticate, authorize(['inventory:read']), validateRequest({
        params: z.object({
            organizationId: z.string().uuid()
        }),
        query: z.object({
            page: z.coerce.number().int().min(1).default(1),
            limit: z.coerce.number().int().min(1).max(100).default(20),
            sortBy: z.string().default('createdAt'),
            sortOrder: z.enum(['asc', 'desc']).default('desc'),
            search: z.string().max(200).optional(),
            productId: z.string().uuid().optional(),
            warehouseId: z.string().uuid().optional(),
            locationId: z.string().uuid().optional(),
            movementType: z.enum(['in', 'out', 'transfer', 'adjustment', 'return', 'damage', 'expired', 'theft']).optional(),
            movementReason: z.enum(['purchase', 'sale', 'transfer_in', 'transfer_out', 'adjustment', 'return', 'damage', 'expired', 'theft', 'production', 'consumption', 'other']).optional(),
            status: z.enum(['pending', 'completed', 'cancelled', 'reversed']).optional(),
            lowStock: z.coerce.boolean().optional(),
            outOfStock: z.coerce.boolean().optional(),
            needsReorder: z.coerce.boolean().optional(),
            hasExpiredItems: z.coerce.boolean().optional(),
            hasExpiringItems: z.coerce.boolean().optional(),
            minQuantity: z.coerce.number().min(0).optional(),
            maxQuantity: z.coerce.number().min(0).optional(),
            minValue: z.coerce.number().min(0).optional(),
            maxValue: z.coerce.number().min(0).optional(),
            costMethod: z.enum(['fifo', 'lifo', 'average', 'standard']).optional(),
            valuationMethod: z.enum(['fifo', 'lifo', 'average', 'standard']).optional()
        })
    }), inventoryKardexController.searchInventoryKardex.bind(inventoryKardexController));
    router.get('/organizations/:organizationId/stats', authenticate, authorize(['inventory:read']), validateRequest({
        params: z.object({
            organizationId: z.string().uuid()
        })
    }), inventoryKardexController.getInventoryKardexStats.bind(inventoryKardexController));
    router.get('/product/:productId', authenticate, authorize(['inventory:read']), validateRequest({
        params: z.object({
            productId: z.string().uuid()
        }),
        query: z.object({
            organizationId: z.string().uuid(),
            page: z.coerce.number().int().min(1).default(1),
            limit: z.coerce.number().int().min(1).max(100).default(20),
            sortBy: z.string().default('createdAt'),
            sortOrder: z.enum(['asc', 'desc']).default('desc')
        })
    }), inventoryKardexController.getInventoryByProduct.bind(inventoryKardexController));
    router.get('/warehouse/:warehouseId', authenticate, authorize(['inventory:read']), validateRequest({
        params: z.object({
            warehouseId: z.string().uuid()
        }),
        query: z.object({
            organizationId: z.string().uuid(),
            page: z.coerce.number().int().min(1).default(1),
            limit: z.coerce.number().int().min(1).max(100).default(20),
            sortBy: z.string().default('createdAt'),
            sortOrder: z.enum(['asc', 'desc']).default('desc')
        })
    }), inventoryKardexController.getInventoryByWarehouse.bind(inventoryKardexController));
    router.get('/low-stock', authenticate, authorize(['inventory:read']), validateRequest({
        query: z.object({
            organizationId: z.string().uuid(),
            page: z.coerce.number().int().min(1).default(1),
            limit: z.coerce.number().int().min(1).max(100).default(20),
            sortBy: z.string().default('createdAt'),
            sortOrder: z.enum(['asc', 'desc']).default('desc')
        })
    }), inventoryKardexController.getLowStockInventory.bind(inventoryKardexController));
    router.get('/out-of-stock', authenticate, authorize(['inventory:read']), validateRequest({
        query: z.object({
            organizationId: z.string().uuid(),
            page: z.coerce.number().int().min(1).default(1),
            limit: z.coerce.number().int().min(1).max(100).default(20),
            sortBy: z.string().default('createdAt'),
            sortOrder: z.enum(['asc', 'desc']).default('desc')
        })
    }), inventoryKardexController.getOutOfStockInventory.bind(inventoryKardexController));
    router.get('/needs-reorder', authenticate, authorize(['inventory:read']), validateRequest({
        query: z.object({
            organizationId: z.string().uuid(),
            page: z.coerce.number().int().min(1).default(1),
            limit: z.coerce.number().int().min(1).max(100).default(20),
            sortBy: z.string().default('createdAt'),
            sortOrder: z.enum(['asc', 'desc']).default('desc')
        })
    }), inventoryKardexController.getNeedsReorderInventory.bind(inventoryKardexController));
    router.post('/movements', authenticate, authorize(['inventory:update']), validateRequest({
        body: z.object({
            inventoryKardexId: z.string().uuid(),
            movementType: z.enum(['in', 'out', 'transfer', 'adjustment', 'return', 'damage', 'expired', 'theft']),
            movementReason: z.enum(['purchase', 'sale', 'transfer_in', 'transfer_out', 'adjustment', 'return', 'damage', 'expired', 'theft', 'production', 'consumption', 'other']),
            quantity: z.number().min(0.01),
            unitCost: z.object({
                amount: z.number().min(0),
                currency: z.string().length(3)
            }).optional(),
            reference: z.string().max(100).optional(),
            referenceId: z.string().uuid().optional(),
            notes: z.string().max(500).optional(),
            batchNumber: z.string().max(100).optional(),
            expirationDate: z.coerce.date().optional(),
            serialNumber: z.string().max(100).optional(),
            supplierId: z.string().uuid().optional(),
            customerId: z.string().uuid().optional(),
            toWarehouseId: z.string().uuid().optional(),
            toLocationId: z.string().uuid().optional()
        })
    }), inventoryKardexController.recordMovement.bind(inventoryKardexController));
    router.post('/:id/reserve', authenticate, authorize(['inventory:update']), validateRequest({
        params: z.object({
            id: z.string().uuid()
        }),
        body: z.object({
            quantity: z.number().min(0.01),
            reference: z.string().max(100).optional(),
            referenceId: z.string().uuid().optional(),
            notes: z.string().max(500).optional()
        })
    }), inventoryKardexController.reserveQuantity.bind(inventoryKardexController));
    router.post('/:id/release', authenticate, authorize(['inventory:update']), validateRequest({
        params: z.object({
            id: z.string().uuid()
        }),
        body: z.object({
            quantity: z.number().min(0.01),
            notes: z.string().max(500).optional()
        })
    }), inventoryKardexController.releaseReservation.bind(inventoryKardexController));
    router.put('/bulk-update', authenticate, authorize(['inventory:update']), validateRequest({
        body: z.object({
            ids: z.array(z.string().uuid()).min(1),
            updates: z.object({
                lowStockThreshold: z.number().min(0).optional(),
                reorderPoint: z.number().min(0).optional(),
                reorderQuantity: z.number().min(0).optional(),
                costMethod: z.enum(['fifo', 'lifo', 'average', 'standard']).optional(),
                valuationMethod: z.enum(['fifo', 'lifo', 'average', 'standard']).optional(),
                tags: z.array(z.string()).optional()
            })
        })
    }), inventoryKardexController.bulkUpdateInventoryKardex.bind(inventoryKardexController));
    router.delete('/bulk-delete', authenticate, authorize(['inventory:delete']), validateRequest({
        body: z.object({
            ids: z.array(z.string().uuid()).min(1)
        })
    }), inventoryKardexController.bulkDeleteInventoryKardex.bind(inventoryKardexController));
    return router;
};
//# sourceMappingURL=inventory-kardex.routes.js.map