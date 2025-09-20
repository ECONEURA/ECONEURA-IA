import { z } from 'zod';
import { UUIDSchema, OrganizationIdSchema, NotesSchema, TagsSchema, CustomFieldsSchema, BaseSearchQuerySchema, IdParamSchema, OrganizationIdParamSchema, ListResponseSchema, BaseStatsSchema, BulkDeleteSchema, MoneySchema } from './base.dto.js';
export const CreateInventoryKardexRequestSchema = z.object({
    organizationId: OrganizationIdSchema,
    productId: UUIDSchema,
    warehouseId: UUIDSchema.optional(),
    locationId: UUIDSchema.optional(),
    initialQuantity: z.number().min(0, 'Initial quantity must be non-negative'),
    unitCost: MoneySchema,
    settings: z.object({
        trackInventory: z.boolean().default(true),
        allowNegativeStock: z.boolean().default(false),
        lowStockThreshold: z.number().min(0, 'Low stock threshold must be non-negative').default(10),
        reorderPoint: z.number().min(0, 'Reorder point must be non-negative').default(5),
        reorderQuantity: z.number().min(0, 'Reorder quantity must be non-negative').default(50),
        costMethod: z.enum(['fifo', 'lifo', 'average', 'standard'], {
            errorMap: () => ({ message: 'Cost method must be one of: fifo, lifo, average, standard' })
        }).default('fifo'),
        valuationMethod: z.enum(['fifo', 'lifo', 'average', 'standard'], {
            errorMap: () => ({ message: 'Valuation method must be one of: fifo, lifo, average, standard' })
        }).default('fifo'),
        autoReorder: z.boolean().default(false),
        trackExpiration: z.boolean().default(false),
        trackSerialNumbers: z.boolean().default(false),
        trackBatchNumbers: z.boolean().default(false),
        customFields: CustomFieldsSchema,
        tags: TagsSchema,
        notes: NotesSchema
    })
});
export const UpdateInventoryKardexRequestSchema = z.object({
    warehouseId: UUIDSchema.optional(),
    locationId: UUIDSchema.optional(),
    settings: z.object({
        trackInventory: z.boolean().optional(),
        allowNegativeStock: z.boolean().optional(),
        lowStockThreshold: z.number().min(0, 'Low stock threshold must be non-negative').optional(),
        reorderPoint: z.number().min(0, 'Reorder point must be non-negative').optional(),
        reorderQuantity: z.number().min(0, 'Reorder quantity must be non-negative').optional(),
        costMethod: z.enum(['fifo', 'lifo', 'average', 'standard']).optional(),
        valuationMethod: z.enum(['fifo', 'lifo', 'average', 'standard']).optional(),
        autoReorder: z.boolean().optional(),
        trackExpiration: z.boolean().optional(),
        trackSerialNumbers: z.boolean().optional(),
        trackBatchNumbers: z.boolean().optional(),
        customFields: CustomFieldsSchema.optional(),
        tags: TagsSchema.optional(),
        notes: NotesSchema.optional()
    }).optional()
});
export const RecordMovementRequestSchema = z.object({
    inventoryKardexId: UUIDSchema,
    movementType: z.enum(['in', 'out', 'transfer', 'adjustment', 'return', 'damage', 'expired', 'theft'], {
        errorMap: () => ({ message: 'Movement type must be one of: in, out, transfer, adjustment, return, damage, expired, theft' })
    }),
    movementReason: z.enum(['purchase', 'sale', 'transfer_in', 'transfer_out', 'adjustment', 'return', 'damage', 'expired', 'theft', 'production', 'consumption', 'other'], {
        errorMap: () => ({ message: 'Movement reason must be one of: purchase, sale, transfer_in, transfer_out, adjustment, return, damage, expired, theft, production, consumption, other' })
    }),
    quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
    unitCost: MoneySchema.optional(),
    reference: z.string().max(100, 'Reference cannot exceed 100 characters').optional(),
    referenceId: UUIDSchema.optional(),
    notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
    batchNumber: z.string().max(100, 'Batch number cannot exceed 100 characters').optional(),
    expirationDate: z.coerce.date().optional(),
    serialNumber: z.string().max(100, 'Serial number cannot exceed 100 characters').optional(),
    supplierId: UUIDSchema.optional(),
    customerId: UUIDSchema.optional(),
    toWarehouseId: UUIDSchema.optional(),
    toLocationId: UUIDSchema.optional()
}).refine((data) => {
    if (data.movementType === 'transfer' && !data.toWarehouseId && !data.toLocationId) {
        return false;
    }
    return true;
}, {
    message: 'Transfer destination (warehouse or location) is required for transfer movements',
    path: ['toWarehouseId']
});
export const InventoryKardexIdParamSchema = IdParamSchema;
export const InventoryKardexOrganizationIdParamSchema = OrganizationIdParamSchema;
export const InventoryKardexSearchQuerySchema = BaseSearchQuerySchema.extend({
    productId: UUIDSchema.optional(),
    warehouseId: UUIDSchema.optional(),
    locationId: UUIDSchema.optional(),
    movementType: z.enum(['in', 'out', 'transfer', 'adjustment', 'return', 'damage', 'expired', 'theft']).optional(),
    movementReason: z.enum(['purchase', 'sale', 'transfer_in', 'transfer_out', 'adjustment', 'return', 'damage', 'expired', 'theft', 'production', 'consumption', 'other']).optional(),
    status: z.enum(['pending', 'completed', 'cancelled', 'reversed']).optional(),
    lowStock: z.coerce.boolean().optional(),
    outOfStock: z.coerce.boolean().optional(),
    needsReorder: z.coerce.boolean().optional(),
    hasExpiredItems: z.coerce.boolean().optional(),
    hasExpiringItems: z.coerce.boolean().optional(),
    minQuantity: z.coerce.number().min(0, 'Minimum quantity must be non-negative').optional(),
    maxQuantity: z.coerce.number().min(0, 'Maximum quantity must be non-negative').optional(),
    minValue: z.coerce.number().min(0, 'Minimum value must be non-negative').optional(),
    maxValue: z.coerce.number().min(0, 'Maximum value must be non-negative').optional(),
    costMethod: z.enum(['fifo', 'lifo', 'average', 'standard']).optional(),
    valuationMethod: z.enum(['fifo', 'lifo', 'average', 'standard']).optional()
});
export const InventoryKardexBulkUpdateSchema = z.object({
    ids: z.array(UUIDSchema).min(1, 'At least one inventory kardex ID is required'),
    updates: z.object({
        lowStockThreshold: z.number().min(0, 'Low stock threshold must be non-negative').optional(),
        reorderPoint: z.number().min(0, 'Reorder point must be non-negative').optional(),
        reorderQuantity: z.number().min(0, 'Reorder quantity must be non-negative').optional(),
        costMethod: z.enum(['fifo', 'lifo', 'average', 'standard']).optional(),
        valuationMethod: z.enum(['fifo', 'lifo', 'average', 'standard']).optional(),
        tags: z.array(z.string()).optional()
    })
});
export const InventoryKardexBulkDeleteSchema = BulkDeleteSchema;
export const InventoryMovementResponseSchema = z.object({
    id: z.string(),
    productId: z.string(),
    warehouseId: z.string().optional(),
    locationId: z.string().optional(),
    movementType: z.enum(['in', 'out', 'transfer', 'adjustment', 'return', 'damage', 'expired', 'theft']),
    movementReason: z.enum(['purchase', 'sale', 'transfer_in', 'transfer_out', 'adjustment', 'return', 'damage', 'expired', 'theft', 'production', 'consumption', 'other']),
    quantity: z.number(),
    unitCost: MoneySchema,
    totalCost: MoneySchema,
    reference: z.string().optional(),
    referenceId: z.string().optional(),
    notes: z.string().optional(),
    batchNumber: z.string().optional(),
    expirationDate: z.date().optional(),
    serialNumber: z.string().optional(),
    supplierId: z.string().optional(),
    customerId: z.string().optional(),
    userId: z.string().optional(),
    movementDate: z.date(),
    status: z.enum(['pending', 'completed', 'cancelled', 'reversed'])
});
export const InventoryKardexResponseSchema = z.object({
    id: z.string().uuid(),
    organizationId: z.string().uuid(),
    productId: z.string().uuid(),
    warehouseId: z.string().uuid().optional(),
    locationId: z.string().uuid().optional(),
    initialQuantity: z.number(),
    currentQuantity: z.number(),
    reservedQuantity: z.number(),
    availableQuantity: z.number(),
    unitCost: MoneySchema,
    totalCost: MoneySchema,
    averageCost: MoneySchema,
    lastMovementDate: z.date().optional(),
    lastMovementType: z.enum(['in', 'out', 'transfer', 'adjustment', 'return', 'damage', 'expired', 'theft']).optional(),
    movements: z.array(InventoryMovementResponseSchema),
    settings: z.object({
        trackInventory: z.boolean(),
        allowNegativeStock: z.boolean(),
        lowStockThreshold: z.number(),
        reorderPoint: z.number(),
        reorderQuantity: z.number(),
        costMethod: z.enum(['fifo', 'lifo', 'average', 'standard']),
        valuationMethod: z.enum(['fifo', 'lifo', 'average', 'standard']),
        autoReorder: z.boolean(),
        trackExpiration: z.boolean(),
        trackSerialNumbers: z.boolean(),
        trackBatchNumbers: z.boolean(),
        customFields: z.record(z.any()),
        tags: z.array(z.string()),
        notes: z.string()
    }),
    isActive: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date()
});
export const InventoryKardexListResponseSchema = ListResponseSchema.extend({
    data: z.array(InventoryKardexResponseSchema)
});
export const InventoryKardexStatsResponseSchema = BaseStatsSchema.extend({
    byProduct: z.record(z.number()),
    byWarehouse: z.record(z.number()),
    byLocation: z.record(z.number()),
    byMovementType: z.record(z.number()),
    byMovementReason: z.record(z.number()),
    totalQuantity: z.number(),
    totalValue: z.number(),
    availableQuantity: z.number(),
    availableValue: z.number(),
    reservedQuantity: z.number(),
    reservedValue: z.number(),
    lowStockCount: z.number(),
    outOfStockCount: z.number(),
    needsReorderCount: z.number(),
    expiredItemsCount: z.number(),
    expiringItemsCount: z.number(),
    averageStockTurnover: z.number(),
    totalMovements: z.number(),
    movementsIn: z.number(),
    movementsOut: z.number(),
    movementsTransfer: z.number(),
    movementsAdjustment: z.number()
});
export const ReserveQuantityRequestSchema = z.object({
    quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
    reference: z.string().max(100, 'Reference cannot exceed 100 characters').optional(),
    referenceId: UUIDSchema.optional(),
    notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional()
});
export const ReleaseReservationRequestSchema = z.object({
    quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
    notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional()
});
export const InventoryReportRequestSchema = z.object({
    organizationId: OrganizationIdSchema,
    filters: z.object({
        productId: UUIDSchema.optional(),
        warehouseId: UUIDSchema.optional(),
        locationId: UUIDSchema.optional(),
        lowStock: z.boolean().optional(),
        outOfStock: z.boolean().optional(),
        needsReorder: z.boolean().optional(),
        hasExpiredItems: z.boolean().optional(),
        hasExpiringItems: z.boolean().optional(),
        costMethod: z.enum(['fifo', 'lifo', 'average', 'standard']).optional(),
        valuationMethod: z.enum(['fifo', 'lifo', 'average', 'standard']).optional()
    }).optional()
});
export const MovementReportRequestSchema = z.object({
    organizationId: OrganizationIdSchema,
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    filters: z.object({
        productId: UUIDSchema.optional(),
        warehouseId: UUIDSchema.optional(),
        locationId: UUIDSchema.optional(),
        movementType: z.enum(['in', 'out', 'transfer', 'adjustment', 'return', 'damage', 'expired', 'theft']).optional(),
        movementReason: z.enum(['purchase', 'sale', 'transfer_in', 'transfer_out', 'adjustment', 'return', 'damage', 'expired', 'theft', 'production', 'consumption', 'other']).optional(),
        status: z.enum(['pending', 'completed', 'cancelled', 'reversed']).optional()
    }).optional()
});
export const ExpirationReportRequestSchema = z.object({
    organizationId: OrganizationIdSchema,
    days: z.number().int().min(1, 'Days must be at least 1').max(365, 'Days cannot exceed 365').default(30)
});
export const ReorderReportRequestSchema = z.object({
    organizationId: OrganizationIdSchema
});
//# sourceMappingURL=inventory-kardex.dto.js.map