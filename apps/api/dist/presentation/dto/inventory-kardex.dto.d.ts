import { z } from 'zod';
export declare const CreateInventoryKardexRequestSchema: z.ZodObject<{
    organizationId: z.ZodString;
    productId: z.ZodString;
    warehouseId: z.ZodOptional<z.ZodString>;
    locationId: z.ZodOptional<z.ZodString>;
    initialQuantity: z.ZodNumber;
    unitCost: z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        amount?: number;
        currency?: string;
    }, {
        amount?: number;
        currency?: string;
    }>;
    settings: z.ZodObject<{
        trackInventory: z.ZodDefault<z.ZodBoolean>;
        allowNegativeStock: z.ZodDefault<z.ZodBoolean>;
        lowStockThreshold: z.ZodDefault<z.ZodNumber>;
        reorderPoint: z.ZodDefault<z.ZodNumber>;
        reorderQuantity: z.ZodDefault<z.ZodNumber>;
        costMethod: z.ZodDefault<z.ZodEnum<["fifo", "lifo", "average", "standard"]>>;
        valuationMethod: z.ZodDefault<z.ZodEnum<["fifo", "lifo", "average", "standard"]>>;
        autoReorder: z.ZodDefault<z.ZodBoolean>;
        trackExpiration: z.ZodDefault<z.ZodBoolean>;
        trackSerialNumbers: z.ZodDefault<z.ZodBoolean>;
        trackBatchNumbers: z.ZodDefault<z.ZodBoolean>;
        customFields: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
        tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        notes: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        tags?: string[];
        notes?: string;
        reorderPoint?: number;
        reorderQuantity?: number;
        customFields?: Record<string, any>;
        costMethod?: "fifo" | "standard" | "lifo" | "average";
        valuationMethod?: "fifo" | "standard" | "lifo" | "average";
        trackInventory?: boolean;
        allowNegativeStock?: boolean;
        lowStockThreshold?: number;
        autoReorder?: boolean;
        trackExpiration?: boolean;
        trackSerialNumbers?: boolean;
        trackBatchNumbers?: boolean;
    }, {
        tags?: string[];
        notes?: string;
        reorderPoint?: number;
        reorderQuantity?: number;
        customFields?: Record<string, any>;
        costMethod?: "fifo" | "standard" | "lifo" | "average";
        valuationMethod?: "fifo" | "standard" | "lifo" | "average";
        trackInventory?: boolean;
        allowNegativeStock?: boolean;
        lowStockThreshold?: number;
        autoReorder?: boolean;
        trackExpiration?: boolean;
        trackSerialNumbers?: boolean;
        trackBatchNumbers?: boolean;
    }>;
}, "strip", z.ZodTypeAny, {
    organizationId?: string;
    settings?: {
        tags?: string[];
        notes?: string;
        reorderPoint?: number;
        reorderQuantity?: number;
        customFields?: Record<string, any>;
        costMethod?: "fifo" | "standard" | "lifo" | "average";
        valuationMethod?: "fifo" | "standard" | "lifo" | "average";
        trackInventory?: boolean;
        allowNegativeStock?: boolean;
        lowStockThreshold?: number;
        autoReorder?: boolean;
        trackExpiration?: boolean;
        trackSerialNumbers?: boolean;
        trackBatchNumbers?: boolean;
    };
    productId?: string;
    unitCost?: {
        amount?: number;
        currency?: string;
    };
    warehouseId?: string;
    locationId?: string;
    initialQuantity?: number;
}, {
    organizationId?: string;
    settings?: {
        tags?: string[];
        notes?: string;
        reorderPoint?: number;
        reorderQuantity?: number;
        customFields?: Record<string, any>;
        costMethod?: "fifo" | "standard" | "lifo" | "average";
        valuationMethod?: "fifo" | "standard" | "lifo" | "average";
        trackInventory?: boolean;
        allowNegativeStock?: boolean;
        lowStockThreshold?: number;
        autoReorder?: boolean;
        trackExpiration?: boolean;
        trackSerialNumbers?: boolean;
        trackBatchNumbers?: boolean;
    };
    productId?: string;
    unitCost?: {
        amount?: number;
        currency?: string;
    };
    warehouseId?: string;
    locationId?: string;
    initialQuantity?: number;
}>;
export declare const UpdateInventoryKardexRequestSchema: z.ZodObject<{
    warehouseId: z.ZodOptional<z.ZodString>;
    locationId: z.ZodOptional<z.ZodString>;
    settings: z.ZodOptional<z.ZodObject<{
        trackInventory: z.ZodOptional<z.ZodBoolean>;
        allowNegativeStock: z.ZodOptional<z.ZodBoolean>;
        lowStockThreshold: z.ZodOptional<z.ZodNumber>;
        reorderPoint: z.ZodOptional<z.ZodNumber>;
        reorderQuantity: z.ZodOptional<z.ZodNumber>;
        costMethod: z.ZodOptional<z.ZodEnum<["fifo", "lifo", "average", "standard"]>>;
        valuationMethod: z.ZodOptional<z.ZodEnum<["fifo", "lifo", "average", "standard"]>>;
        autoReorder: z.ZodOptional<z.ZodBoolean>;
        trackExpiration: z.ZodOptional<z.ZodBoolean>;
        trackSerialNumbers: z.ZodOptional<z.ZodBoolean>;
        trackBatchNumbers: z.ZodOptional<z.ZodBoolean>;
        customFields: z.ZodOptional<z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>>;
        tags: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
        notes: z.ZodOptional<z.ZodDefault<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        tags?: string[];
        notes?: string;
        reorderPoint?: number;
        reorderQuantity?: number;
        customFields?: Record<string, any>;
        costMethod?: "fifo" | "standard" | "lifo" | "average";
        valuationMethod?: "fifo" | "standard" | "lifo" | "average";
        trackInventory?: boolean;
        allowNegativeStock?: boolean;
        lowStockThreshold?: number;
        autoReorder?: boolean;
        trackExpiration?: boolean;
        trackSerialNumbers?: boolean;
        trackBatchNumbers?: boolean;
    }, {
        tags?: string[];
        notes?: string;
        reorderPoint?: number;
        reorderQuantity?: number;
        customFields?: Record<string, any>;
        costMethod?: "fifo" | "standard" | "lifo" | "average";
        valuationMethod?: "fifo" | "standard" | "lifo" | "average";
        trackInventory?: boolean;
        allowNegativeStock?: boolean;
        lowStockThreshold?: number;
        autoReorder?: boolean;
        trackExpiration?: boolean;
        trackSerialNumbers?: boolean;
        trackBatchNumbers?: boolean;
    }>>;
}, "strip", z.ZodTypeAny, {
    settings?: {
        tags?: string[];
        notes?: string;
        reorderPoint?: number;
        reorderQuantity?: number;
        customFields?: Record<string, any>;
        costMethod?: "fifo" | "standard" | "lifo" | "average";
        valuationMethod?: "fifo" | "standard" | "lifo" | "average";
        trackInventory?: boolean;
        allowNegativeStock?: boolean;
        lowStockThreshold?: number;
        autoReorder?: boolean;
        trackExpiration?: boolean;
        trackSerialNumbers?: boolean;
        trackBatchNumbers?: boolean;
    };
    warehouseId?: string;
    locationId?: string;
}, {
    settings?: {
        tags?: string[];
        notes?: string;
        reorderPoint?: number;
        reorderQuantity?: number;
        customFields?: Record<string, any>;
        costMethod?: "fifo" | "standard" | "lifo" | "average";
        valuationMethod?: "fifo" | "standard" | "lifo" | "average";
        trackInventory?: boolean;
        allowNegativeStock?: boolean;
        lowStockThreshold?: number;
        autoReorder?: boolean;
        trackExpiration?: boolean;
        trackSerialNumbers?: boolean;
        trackBatchNumbers?: boolean;
    };
    warehouseId?: string;
    locationId?: string;
}>;
export declare const RecordMovementRequestSchema: z.ZodEffects<z.ZodObject<{
    inventoryKardexId: z.ZodString;
    movementType: z.ZodEnum<["in", "out", "transfer", "adjustment", "return", "damage", "expired", "theft"]>;
    movementReason: z.ZodEnum<["purchase", "sale", "transfer_in", "transfer_out", "adjustment", "return", "damage", "expired", "theft", "production", "consumption", "other"]>;
    quantity: z.ZodNumber;
    unitCost: z.ZodOptional<z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        amount?: number;
        currency?: string;
    }, {
        amount?: number;
        currency?: string;
    }>>;
    reference: z.ZodOptional<z.ZodString>;
    referenceId: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    batchNumber: z.ZodOptional<z.ZodString>;
    expirationDate: z.ZodOptional<z.ZodDate>;
    serialNumber: z.ZodOptional<z.ZodString>;
    supplierId: z.ZodOptional<z.ZodString>;
    customerId: z.ZodOptional<z.ZodString>;
    toWarehouseId: z.ZodOptional<z.ZodString>;
    toLocationId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    notes?: string;
    reference?: string;
    quantity?: number;
    unitCost?: {
        amount?: number;
        currency?: string;
    };
    movementType?: "in" | "return" | "adjustment" | "transfer" | "damage" | "expired" | "out" | "theft";
    movementReason?: "production" | "other" | "purchase" | "sale" | "return" | "adjustment" | "damage" | "expired" | "theft" | "transfer_in" | "transfer_out" | "consumption";
    referenceId?: string;
    batchNumber?: string;
    expirationDate?: Date;
    serialNumber?: string;
    supplierId?: string;
    customerId?: string;
    inventoryKardexId?: string;
    toWarehouseId?: string;
    toLocationId?: string;
}, {
    notes?: string;
    reference?: string;
    quantity?: number;
    unitCost?: {
        amount?: number;
        currency?: string;
    };
    movementType?: "in" | "return" | "adjustment" | "transfer" | "damage" | "expired" | "out" | "theft";
    movementReason?: "production" | "other" | "purchase" | "sale" | "return" | "adjustment" | "damage" | "expired" | "theft" | "transfer_in" | "transfer_out" | "consumption";
    referenceId?: string;
    batchNumber?: string;
    expirationDate?: Date;
    serialNumber?: string;
    supplierId?: string;
    customerId?: string;
    inventoryKardexId?: string;
    toWarehouseId?: string;
    toLocationId?: string;
}>, {
    notes?: string;
    reference?: string;
    quantity?: number;
    unitCost?: {
        amount?: number;
        currency?: string;
    };
    movementType?: "in" | "return" | "adjustment" | "transfer" | "damage" | "expired" | "out" | "theft";
    movementReason?: "production" | "other" | "purchase" | "sale" | "return" | "adjustment" | "damage" | "expired" | "theft" | "transfer_in" | "transfer_out" | "consumption";
    referenceId?: string;
    batchNumber?: string;
    expirationDate?: Date;
    serialNumber?: string;
    supplierId?: string;
    customerId?: string;
    inventoryKardexId?: string;
    toWarehouseId?: string;
    toLocationId?: string;
}, {
    notes?: string;
    reference?: string;
    quantity?: number;
    unitCost?: {
        amount?: number;
        currency?: string;
    };
    movementType?: "in" | "return" | "adjustment" | "transfer" | "damage" | "expired" | "out" | "theft";
    movementReason?: "production" | "other" | "purchase" | "sale" | "return" | "adjustment" | "damage" | "expired" | "theft" | "transfer_in" | "transfer_out" | "consumption";
    referenceId?: string;
    batchNumber?: string;
    expirationDate?: Date;
    serialNumber?: string;
    supplierId?: string;
    customerId?: string;
    inventoryKardexId?: string;
    toWarehouseId?: string;
    toLocationId?: string;
}>;
export declare const InventoryKardexIdParamSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id?: string;
}, {
    id?: string;
}>;
export declare const InventoryKardexOrganizationIdParamSchema: z.ZodObject<{
    organizationId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    organizationId?: string;
}, {
    organizationId?: string;
}>;
export declare const InventoryKardexSearchQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sortBy: z.ZodDefault<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
} & {
    search: z.ZodOptional<z.ZodString>;
} & {
    productId: z.ZodOptional<z.ZodString>;
    warehouseId: z.ZodOptional<z.ZodString>;
    locationId: z.ZodOptional<z.ZodString>;
    movementType: z.ZodOptional<z.ZodEnum<["in", "out", "transfer", "adjustment", "return", "damage", "expired", "theft"]>>;
    movementReason: z.ZodOptional<z.ZodEnum<["purchase", "sale", "transfer_in", "transfer_out", "adjustment", "return", "damage", "expired", "theft", "production", "consumption", "other"]>>;
    status: z.ZodOptional<z.ZodEnum<["pending", "completed", "cancelled", "reversed"]>>;
    lowStock: z.ZodOptional<z.ZodBoolean>;
    outOfStock: z.ZodOptional<z.ZodBoolean>;
    needsReorder: z.ZodOptional<z.ZodBoolean>;
    hasExpiredItems: z.ZodOptional<z.ZodBoolean>;
    hasExpiringItems: z.ZodOptional<z.ZodBoolean>;
    minQuantity: z.ZodOptional<z.ZodNumber>;
    maxQuantity: z.ZodOptional<z.ZodNumber>;
    minValue: z.ZodOptional<z.ZodNumber>;
    maxValue: z.ZodOptional<z.ZodNumber>;
    costMethod: z.ZodOptional<z.ZodEnum<["fifo", "lifo", "average", "standard"]>>;
    valuationMethod: z.ZodOptional<z.ZodEnum<["fifo", "lifo", "average", "standard"]>>;
}, "strip", z.ZodTypeAny, {
    status?: "pending" | "completed" | "cancelled" | "reversed";
    page?: number;
    limit?: number;
    search?: string;
    lowStock?: boolean;
    outOfStock?: boolean;
    productId?: string;
    warehouseId?: string;
    locationId?: string;
    movementType?: "in" | "return" | "adjustment" | "transfer" | "damage" | "expired" | "out" | "theft";
    movementReason?: "production" | "other" | "purchase" | "sale" | "return" | "adjustment" | "damage" | "expired" | "theft" | "transfer_in" | "transfer_out" | "consumption";
    needsReorder?: boolean;
    hasExpiredItems?: boolean;
    hasExpiringItems?: boolean;
    minQuantity?: number;
    maxQuantity?: number;
    minValue?: number;
    maxValue?: number;
    costMethod?: "fifo" | "standard" | "lifo" | "average";
    valuationMethod?: "fifo" | "standard" | "lifo" | "average";
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}, {
    status?: "pending" | "completed" | "cancelled" | "reversed";
    page?: number;
    limit?: number;
    search?: string;
    lowStock?: boolean;
    outOfStock?: boolean;
    productId?: string;
    warehouseId?: string;
    locationId?: string;
    movementType?: "in" | "return" | "adjustment" | "transfer" | "damage" | "expired" | "out" | "theft";
    movementReason?: "production" | "other" | "purchase" | "sale" | "return" | "adjustment" | "damage" | "expired" | "theft" | "transfer_in" | "transfer_out" | "consumption";
    needsReorder?: boolean;
    hasExpiredItems?: boolean;
    hasExpiringItems?: boolean;
    minQuantity?: number;
    maxQuantity?: number;
    minValue?: number;
    maxValue?: number;
    costMethod?: "fifo" | "standard" | "lifo" | "average";
    valuationMethod?: "fifo" | "standard" | "lifo" | "average";
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}>;
export declare const InventoryKardexBulkUpdateSchema: z.ZodObject<{
    ids: z.ZodArray<z.ZodString, "many">;
    updates: z.ZodObject<{
        lowStockThreshold: z.ZodOptional<z.ZodNumber>;
        reorderPoint: z.ZodOptional<z.ZodNumber>;
        reorderQuantity: z.ZodOptional<z.ZodNumber>;
        costMethod: z.ZodOptional<z.ZodEnum<["fifo", "lifo", "average", "standard"]>>;
        valuationMethod: z.ZodOptional<z.ZodEnum<["fifo", "lifo", "average", "standard"]>>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        tags?: string[];
        reorderPoint?: number;
        reorderQuantity?: number;
        costMethod?: "fifo" | "standard" | "lifo" | "average";
        valuationMethod?: "fifo" | "standard" | "lifo" | "average";
        lowStockThreshold?: number;
    }, {
        tags?: string[];
        reorderPoint?: number;
        reorderQuantity?: number;
        costMethod?: "fifo" | "standard" | "lifo" | "average";
        valuationMethod?: "fifo" | "standard" | "lifo" | "average";
        lowStockThreshold?: number;
    }>;
}, "strip", z.ZodTypeAny, {
    updates?: {
        tags?: string[];
        reorderPoint?: number;
        reorderQuantity?: number;
        costMethod?: "fifo" | "standard" | "lifo" | "average";
        valuationMethod?: "fifo" | "standard" | "lifo" | "average";
        lowStockThreshold?: number;
    };
    ids?: string[];
}, {
    updates?: {
        tags?: string[];
        reorderPoint?: number;
        reorderQuantity?: number;
        costMethod?: "fifo" | "standard" | "lifo" | "average";
        valuationMethod?: "fifo" | "standard" | "lifo" | "average";
        lowStockThreshold?: number;
    };
    ids?: string[];
}>;
export declare const InventoryKardexBulkDeleteSchema: z.ZodObject<{
    ids: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    ids?: string[];
}, {
    ids?: string[];
}>;
export declare const InventoryMovementResponseSchema: z.ZodObject<{
    id: z.ZodString;
    productId: z.ZodString;
    warehouseId: z.ZodOptional<z.ZodString>;
    locationId: z.ZodOptional<z.ZodString>;
    movementType: z.ZodEnum<["in", "out", "transfer", "adjustment", "return", "damage", "expired", "theft"]>;
    movementReason: z.ZodEnum<["purchase", "sale", "transfer_in", "transfer_out", "adjustment", "return", "damage", "expired", "theft", "production", "consumption", "other"]>;
    quantity: z.ZodNumber;
    unitCost: z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        amount?: number;
        currency?: string;
    }, {
        amount?: number;
        currency?: string;
    }>;
    totalCost: z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        amount?: number;
        currency?: string;
    }, {
        amount?: number;
        currency?: string;
    }>;
    reference: z.ZodOptional<z.ZodString>;
    referenceId: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    batchNumber: z.ZodOptional<z.ZodString>;
    expirationDate: z.ZodOptional<z.ZodDate>;
    serialNumber: z.ZodOptional<z.ZodString>;
    supplierId: z.ZodOptional<z.ZodString>;
    customerId: z.ZodOptional<z.ZodString>;
    userId: z.ZodOptional<z.ZodString>;
    movementDate: z.ZodDate;
    status: z.ZodEnum<["pending", "completed", "cancelled", "reversed"]>;
}, "strip", z.ZodTypeAny, {
    status?: "pending" | "completed" | "cancelled" | "reversed";
    userId?: string;
    id?: string;
    notes?: string;
    reference?: string;
    quantity?: number;
    productId?: string;
    unitCost?: {
        amount?: number;
        currency?: string;
    };
    totalCost?: {
        amount?: number;
        currency?: string;
    };
    warehouseId?: string;
    locationId?: string;
    movementType?: "in" | "return" | "adjustment" | "transfer" | "damage" | "expired" | "out" | "theft";
    movementReason?: "production" | "other" | "purchase" | "sale" | "return" | "adjustment" | "damage" | "expired" | "theft" | "transfer_in" | "transfer_out" | "consumption";
    referenceId?: string;
    batchNumber?: string;
    expirationDate?: Date;
    serialNumber?: string;
    supplierId?: string;
    customerId?: string;
    movementDate?: Date;
}, {
    status?: "pending" | "completed" | "cancelled" | "reversed";
    userId?: string;
    id?: string;
    notes?: string;
    reference?: string;
    quantity?: number;
    productId?: string;
    unitCost?: {
        amount?: number;
        currency?: string;
    };
    totalCost?: {
        amount?: number;
        currency?: string;
    };
    warehouseId?: string;
    locationId?: string;
    movementType?: "in" | "return" | "adjustment" | "transfer" | "damage" | "expired" | "out" | "theft";
    movementReason?: "production" | "other" | "purchase" | "sale" | "return" | "adjustment" | "damage" | "expired" | "theft" | "transfer_in" | "transfer_out" | "consumption";
    referenceId?: string;
    batchNumber?: string;
    expirationDate?: Date;
    serialNumber?: string;
    supplierId?: string;
    customerId?: string;
    movementDate?: Date;
}>;
export declare const InventoryKardexResponseSchema: z.ZodObject<{
    id: z.ZodString;
    organizationId: z.ZodString;
    productId: z.ZodString;
    warehouseId: z.ZodOptional<z.ZodString>;
    locationId: z.ZodOptional<z.ZodString>;
    initialQuantity: z.ZodNumber;
    currentQuantity: z.ZodNumber;
    reservedQuantity: z.ZodNumber;
    availableQuantity: z.ZodNumber;
    unitCost: z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        amount?: number;
        currency?: string;
    }, {
        amount?: number;
        currency?: string;
    }>;
    totalCost: z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        amount?: number;
        currency?: string;
    }, {
        amount?: number;
        currency?: string;
    }>;
    averageCost: z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        amount?: number;
        currency?: string;
    }, {
        amount?: number;
        currency?: string;
    }>;
    lastMovementDate: z.ZodOptional<z.ZodDate>;
    lastMovementType: z.ZodOptional<z.ZodEnum<["in", "out", "transfer", "adjustment", "return", "damage", "expired", "theft"]>>;
    movements: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        productId: z.ZodString;
        warehouseId: z.ZodOptional<z.ZodString>;
        locationId: z.ZodOptional<z.ZodString>;
        movementType: z.ZodEnum<["in", "out", "transfer", "adjustment", "return", "damage", "expired", "theft"]>;
        movementReason: z.ZodEnum<["purchase", "sale", "transfer_in", "transfer_out", "adjustment", "return", "damage", "expired", "theft", "production", "consumption", "other"]>;
        quantity: z.ZodNumber;
        unitCost: z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            amount?: number;
            currency?: string;
        }, {
            amount?: number;
            currency?: string;
        }>;
        totalCost: z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            amount?: number;
            currency?: string;
        }, {
            amount?: number;
            currency?: string;
        }>;
        reference: z.ZodOptional<z.ZodString>;
        referenceId: z.ZodOptional<z.ZodString>;
        notes: z.ZodOptional<z.ZodString>;
        batchNumber: z.ZodOptional<z.ZodString>;
        expirationDate: z.ZodOptional<z.ZodDate>;
        serialNumber: z.ZodOptional<z.ZodString>;
        supplierId: z.ZodOptional<z.ZodString>;
        customerId: z.ZodOptional<z.ZodString>;
        userId: z.ZodOptional<z.ZodString>;
        movementDate: z.ZodDate;
        status: z.ZodEnum<["pending", "completed", "cancelled", "reversed"]>;
    }, "strip", z.ZodTypeAny, {
        status?: "pending" | "completed" | "cancelled" | "reversed";
        userId?: string;
        id?: string;
        notes?: string;
        reference?: string;
        quantity?: number;
        productId?: string;
        unitCost?: {
            amount?: number;
            currency?: string;
        };
        totalCost?: {
            amount?: number;
            currency?: string;
        };
        warehouseId?: string;
        locationId?: string;
        movementType?: "in" | "return" | "adjustment" | "transfer" | "damage" | "expired" | "out" | "theft";
        movementReason?: "production" | "other" | "purchase" | "sale" | "return" | "adjustment" | "damage" | "expired" | "theft" | "transfer_in" | "transfer_out" | "consumption";
        referenceId?: string;
        batchNumber?: string;
        expirationDate?: Date;
        serialNumber?: string;
        supplierId?: string;
        customerId?: string;
        movementDate?: Date;
    }, {
        status?: "pending" | "completed" | "cancelled" | "reversed";
        userId?: string;
        id?: string;
        notes?: string;
        reference?: string;
        quantity?: number;
        productId?: string;
        unitCost?: {
            amount?: number;
            currency?: string;
        };
        totalCost?: {
            amount?: number;
            currency?: string;
        };
        warehouseId?: string;
        locationId?: string;
        movementType?: "in" | "return" | "adjustment" | "transfer" | "damage" | "expired" | "out" | "theft";
        movementReason?: "production" | "other" | "purchase" | "sale" | "return" | "adjustment" | "damage" | "expired" | "theft" | "transfer_in" | "transfer_out" | "consumption";
        referenceId?: string;
        batchNumber?: string;
        expirationDate?: Date;
        serialNumber?: string;
        supplierId?: string;
        customerId?: string;
        movementDate?: Date;
    }>, "many">;
    settings: z.ZodObject<{
        trackInventory: z.ZodBoolean;
        allowNegativeStock: z.ZodBoolean;
        lowStockThreshold: z.ZodNumber;
        reorderPoint: z.ZodNumber;
        reorderQuantity: z.ZodNumber;
        costMethod: z.ZodEnum<["fifo", "lifo", "average", "standard"]>;
        valuationMethod: z.ZodEnum<["fifo", "lifo", "average", "standard"]>;
        autoReorder: z.ZodBoolean;
        trackExpiration: z.ZodBoolean;
        trackSerialNumbers: z.ZodBoolean;
        trackBatchNumbers: z.ZodBoolean;
        customFields: z.ZodRecord<z.ZodString, z.ZodAny>;
        tags: z.ZodArray<z.ZodString, "many">;
        notes: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        tags?: string[];
        notes?: string;
        reorderPoint?: number;
        reorderQuantity?: number;
        customFields?: Record<string, any>;
        costMethod?: "fifo" | "standard" | "lifo" | "average";
        valuationMethod?: "fifo" | "standard" | "lifo" | "average";
        trackInventory?: boolean;
        allowNegativeStock?: boolean;
        lowStockThreshold?: number;
        autoReorder?: boolean;
        trackExpiration?: boolean;
        trackSerialNumbers?: boolean;
        trackBatchNumbers?: boolean;
    }, {
        tags?: string[];
        notes?: string;
        reorderPoint?: number;
        reorderQuantity?: number;
        customFields?: Record<string, any>;
        costMethod?: "fifo" | "standard" | "lifo" | "average";
        valuationMethod?: "fifo" | "standard" | "lifo" | "average";
        trackInventory?: boolean;
        allowNegativeStock?: boolean;
        lowStockThreshold?: number;
        autoReorder?: boolean;
        trackExpiration?: boolean;
        trackSerialNumbers?: boolean;
        trackBatchNumbers?: boolean;
    }>;
    isActive: z.ZodBoolean;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    organizationId?: string;
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    isActive?: boolean;
    settings?: {
        tags?: string[];
        notes?: string;
        reorderPoint?: number;
        reorderQuantity?: number;
        customFields?: Record<string, any>;
        costMethod?: "fifo" | "standard" | "lifo" | "average";
        valuationMethod?: "fifo" | "standard" | "lifo" | "average";
        trackInventory?: boolean;
        allowNegativeStock?: boolean;
        lowStockThreshold?: number;
        autoReorder?: boolean;
        trackExpiration?: boolean;
        trackSerialNumbers?: boolean;
        trackBatchNumbers?: boolean;
    };
    averageCost?: {
        amount?: number;
        currency?: string;
    };
    productId?: string;
    unitCost?: {
        amount?: number;
        currency?: string;
    };
    totalCost?: {
        amount?: number;
        currency?: string;
    };
    warehouseId?: string;
    locationId?: string;
    initialQuantity?: number;
    currentQuantity?: number;
    reservedQuantity?: number;
    availableQuantity?: number;
    lastMovementDate?: Date;
    lastMovementType?: "in" | "return" | "adjustment" | "transfer" | "damage" | "expired" | "out" | "theft";
    movements?: {
        status?: "pending" | "completed" | "cancelled" | "reversed";
        userId?: string;
        id?: string;
        notes?: string;
        reference?: string;
        quantity?: number;
        productId?: string;
        unitCost?: {
            amount?: number;
            currency?: string;
        };
        totalCost?: {
            amount?: number;
            currency?: string;
        };
        warehouseId?: string;
        locationId?: string;
        movementType?: "in" | "return" | "adjustment" | "transfer" | "damage" | "expired" | "out" | "theft";
        movementReason?: "production" | "other" | "purchase" | "sale" | "return" | "adjustment" | "damage" | "expired" | "theft" | "transfer_in" | "transfer_out" | "consumption";
        referenceId?: string;
        batchNumber?: string;
        expirationDate?: Date;
        serialNumber?: string;
        supplierId?: string;
        customerId?: string;
        movementDate?: Date;
    }[];
}, {
    organizationId?: string;
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    isActive?: boolean;
    settings?: {
        tags?: string[];
        notes?: string;
        reorderPoint?: number;
        reorderQuantity?: number;
        customFields?: Record<string, any>;
        costMethod?: "fifo" | "standard" | "lifo" | "average";
        valuationMethod?: "fifo" | "standard" | "lifo" | "average";
        trackInventory?: boolean;
        allowNegativeStock?: boolean;
        lowStockThreshold?: number;
        autoReorder?: boolean;
        trackExpiration?: boolean;
        trackSerialNumbers?: boolean;
        trackBatchNumbers?: boolean;
    };
    averageCost?: {
        amount?: number;
        currency?: string;
    };
    productId?: string;
    unitCost?: {
        amount?: number;
        currency?: string;
    };
    totalCost?: {
        amount?: number;
        currency?: string;
    };
    warehouseId?: string;
    locationId?: string;
    initialQuantity?: number;
    currentQuantity?: number;
    reservedQuantity?: number;
    availableQuantity?: number;
    lastMovementDate?: Date;
    lastMovementType?: "in" | "return" | "adjustment" | "transfer" | "damage" | "expired" | "out" | "theft";
    movements?: {
        status?: "pending" | "completed" | "cancelled" | "reversed";
        userId?: string;
        id?: string;
        notes?: string;
        reference?: string;
        quantity?: number;
        productId?: string;
        unitCost?: {
            amount?: number;
            currency?: string;
        };
        totalCost?: {
            amount?: number;
            currency?: string;
        };
        warehouseId?: string;
        locationId?: string;
        movementType?: "in" | "return" | "adjustment" | "transfer" | "damage" | "expired" | "out" | "theft";
        movementReason?: "production" | "other" | "purchase" | "sale" | "return" | "adjustment" | "damage" | "expired" | "theft" | "transfer_in" | "transfer_out" | "consumption";
        referenceId?: string;
        batchNumber?: string;
        expirationDate?: Date;
        serialNumber?: string;
        supplierId?: string;
        customerId?: string;
        movementDate?: Date;
    }[];
}>;
export declare const InventoryKardexListResponseSchema: z.ZodObject<{
    pagination: z.ZodObject<{
        page: z.ZodNumber;
        limit: z.ZodNumber;
        total: z.ZodNumber;
        totalPages: z.ZodNumber;
        hasNext: z.ZodBoolean;
        hasPrev: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
        hasNext?: boolean;
        hasPrev?: boolean;
    }, {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
        hasNext?: boolean;
        hasPrev?: boolean;
    }>;
} & {
    data: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        organizationId: z.ZodString;
        productId: z.ZodString;
        warehouseId: z.ZodOptional<z.ZodString>;
        locationId: z.ZodOptional<z.ZodString>;
        initialQuantity: z.ZodNumber;
        currentQuantity: z.ZodNumber;
        reservedQuantity: z.ZodNumber;
        availableQuantity: z.ZodNumber;
        unitCost: z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            amount?: number;
            currency?: string;
        }, {
            amount?: number;
            currency?: string;
        }>;
        totalCost: z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            amount?: number;
            currency?: string;
        }, {
            amount?: number;
            currency?: string;
        }>;
        averageCost: z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            amount?: number;
            currency?: string;
        }, {
            amount?: number;
            currency?: string;
        }>;
        lastMovementDate: z.ZodOptional<z.ZodDate>;
        lastMovementType: z.ZodOptional<z.ZodEnum<["in", "out", "transfer", "adjustment", "return", "damage", "expired", "theft"]>>;
        movements: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            productId: z.ZodString;
            warehouseId: z.ZodOptional<z.ZodString>;
            locationId: z.ZodOptional<z.ZodString>;
            movementType: z.ZodEnum<["in", "out", "transfer", "adjustment", "return", "damage", "expired", "theft"]>;
            movementReason: z.ZodEnum<["purchase", "sale", "transfer_in", "transfer_out", "adjustment", "return", "damage", "expired", "theft", "production", "consumption", "other"]>;
            quantity: z.ZodNumber;
            unitCost: z.ZodObject<{
                amount: z.ZodNumber;
                currency: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                amount?: number;
                currency?: string;
            }, {
                amount?: number;
                currency?: string;
            }>;
            totalCost: z.ZodObject<{
                amount: z.ZodNumber;
                currency: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                amount?: number;
                currency?: string;
            }, {
                amount?: number;
                currency?: string;
            }>;
            reference: z.ZodOptional<z.ZodString>;
            referenceId: z.ZodOptional<z.ZodString>;
            notes: z.ZodOptional<z.ZodString>;
            batchNumber: z.ZodOptional<z.ZodString>;
            expirationDate: z.ZodOptional<z.ZodDate>;
            serialNumber: z.ZodOptional<z.ZodString>;
            supplierId: z.ZodOptional<z.ZodString>;
            customerId: z.ZodOptional<z.ZodString>;
            userId: z.ZodOptional<z.ZodString>;
            movementDate: z.ZodDate;
            status: z.ZodEnum<["pending", "completed", "cancelled", "reversed"]>;
        }, "strip", z.ZodTypeAny, {
            status?: "pending" | "completed" | "cancelled" | "reversed";
            userId?: string;
            id?: string;
            notes?: string;
            reference?: string;
            quantity?: number;
            productId?: string;
            unitCost?: {
                amount?: number;
                currency?: string;
            };
            totalCost?: {
                amount?: number;
                currency?: string;
            };
            warehouseId?: string;
            locationId?: string;
            movementType?: "in" | "return" | "adjustment" | "transfer" | "damage" | "expired" | "out" | "theft";
            movementReason?: "production" | "other" | "purchase" | "sale" | "return" | "adjustment" | "damage" | "expired" | "theft" | "transfer_in" | "transfer_out" | "consumption";
            referenceId?: string;
            batchNumber?: string;
            expirationDate?: Date;
            serialNumber?: string;
            supplierId?: string;
            customerId?: string;
            movementDate?: Date;
        }, {
            status?: "pending" | "completed" | "cancelled" | "reversed";
            userId?: string;
            id?: string;
            notes?: string;
            reference?: string;
            quantity?: number;
            productId?: string;
            unitCost?: {
                amount?: number;
                currency?: string;
            };
            totalCost?: {
                amount?: number;
                currency?: string;
            };
            warehouseId?: string;
            locationId?: string;
            movementType?: "in" | "return" | "adjustment" | "transfer" | "damage" | "expired" | "out" | "theft";
            movementReason?: "production" | "other" | "purchase" | "sale" | "return" | "adjustment" | "damage" | "expired" | "theft" | "transfer_in" | "transfer_out" | "consumption";
            referenceId?: string;
            batchNumber?: string;
            expirationDate?: Date;
            serialNumber?: string;
            supplierId?: string;
            customerId?: string;
            movementDate?: Date;
        }>, "many">;
        settings: z.ZodObject<{
            trackInventory: z.ZodBoolean;
            allowNegativeStock: z.ZodBoolean;
            lowStockThreshold: z.ZodNumber;
            reorderPoint: z.ZodNumber;
            reorderQuantity: z.ZodNumber;
            costMethod: z.ZodEnum<["fifo", "lifo", "average", "standard"]>;
            valuationMethod: z.ZodEnum<["fifo", "lifo", "average", "standard"]>;
            autoReorder: z.ZodBoolean;
            trackExpiration: z.ZodBoolean;
            trackSerialNumbers: z.ZodBoolean;
            trackBatchNumbers: z.ZodBoolean;
            customFields: z.ZodRecord<z.ZodString, z.ZodAny>;
            tags: z.ZodArray<z.ZodString, "many">;
            notes: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            tags?: string[];
            notes?: string;
            reorderPoint?: number;
            reorderQuantity?: number;
            customFields?: Record<string, any>;
            costMethod?: "fifo" | "standard" | "lifo" | "average";
            valuationMethod?: "fifo" | "standard" | "lifo" | "average";
            trackInventory?: boolean;
            allowNegativeStock?: boolean;
            lowStockThreshold?: number;
            autoReorder?: boolean;
            trackExpiration?: boolean;
            trackSerialNumbers?: boolean;
            trackBatchNumbers?: boolean;
        }, {
            tags?: string[];
            notes?: string;
            reorderPoint?: number;
            reorderQuantity?: number;
            customFields?: Record<string, any>;
            costMethod?: "fifo" | "standard" | "lifo" | "average";
            valuationMethod?: "fifo" | "standard" | "lifo" | "average";
            trackInventory?: boolean;
            allowNegativeStock?: boolean;
            lowStockThreshold?: number;
            autoReorder?: boolean;
            trackExpiration?: boolean;
            trackSerialNumbers?: boolean;
            trackBatchNumbers?: boolean;
        }>;
        isActive: z.ZodBoolean;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        organizationId?: string;
        id?: string;
        createdAt?: Date;
        updatedAt?: Date;
        isActive?: boolean;
        settings?: {
            tags?: string[];
            notes?: string;
            reorderPoint?: number;
            reorderQuantity?: number;
            customFields?: Record<string, any>;
            costMethod?: "fifo" | "standard" | "lifo" | "average";
            valuationMethod?: "fifo" | "standard" | "lifo" | "average";
            trackInventory?: boolean;
            allowNegativeStock?: boolean;
            lowStockThreshold?: number;
            autoReorder?: boolean;
            trackExpiration?: boolean;
            trackSerialNumbers?: boolean;
            trackBatchNumbers?: boolean;
        };
        averageCost?: {
            amount?: number;
            currency?: string;
        };
        productId?: string;
        unitCost?: {
            amount?: number;
            currency?: string;
        };
        totalCost?: {
            amount?: number;
            currency?: string;
        };
        warehouseId?: string;
        locationId?: string;
        initialQuantity?: number;
        currentQuantity?: number;
        reservedQuantity?: number;
        availableQuantity?: number;
        lastMovementDate?: Date;
        lastMovementType?: "in" | "return" | "adjustment" | "transfer" | "damage" | "expired" | "out" | "theft";
        movements?: {
            status?: "pending" | "completed" | "cancelled" | "reversed";
            userId?: string;
            id?: string;
            notes?: string;
            reference?: string;
            quantity?: number;
            productId?: string;
            unitCost?: {
                amount?: number;
                currency?: string;
            };
            totalCost?: {
                amount?: number;
                currency?: string;
            };
            warehouseId?: string;
            locationId?: string;
            movementType?: "in" | "return" | "adjustment" | "transfer" | "damage" | "expired" | "out" | "theft";
            movementReason?: "production" | "other" | "purchase" | "sale" | "return" | "adjustment" | "damage" | "expired" | "theft" | "transfer_in" | "transfer_out" | "consumption";
            referenceId?: string;
            batchNumber?: string;
            expirationDate?: Date;
            serialNumber?: string;
            supplierId?: string;
            customerId?: string;
            movementDate?: Date;
        }[];
    }, {
        organizationId?: string;
        id?: string;
        createdAt?: Date;
        updatedAt?: Date;
        isActive?: boolean;
        settings?: {
            tags?: string[];
            notes?: string;
            reorderPoint?: number;
            reorderQuantity?: number;
            customFields?: Record<string, any>;
            costMethod?: "fifo" | "standard" | "lifo" | "average";
            valuationMethod?: "fifo" | "standard" | "lifo" | "average";
            trackInventory?: boolean;
            allowNegativeStock?: boolean;
            lowStockThreshold?: number;
            autoReorder?: boolean;
            trackExpiration?: boolean;
            trackSerialNumbers?: boolean;
            trackBatchNumbers?: boolean;
        };
        averageCost?: {
            amount?: number;
            currency?: string;
        };
        productId?: string;
        unitCost?: {
            amount?: number;
            currency?: string;
        };
        totalCost?: {
            amount?: number;
            currency?: string;
        };
        warehouseId?: string;
        locationId?: string;
        initialQuantity?: number;
        currentQuantity?: number;
        reservedQuantity?: number;
        availableQuantity?: number;
        lastMovementDate?: Date;
        lastMovementType?: "in" | "return" | "adjustment" | "transfer" | "damage" | "expired" | "out" | "theft";
        movements?: {
            status?: "pending" | "completed" | "cancelled" | "reversed";
            userId?: string;
            id?: string;
            notes?: string;
            reference?: string;
            quantity?: number;
            productId?: string;
            unitCost?: {
                amount?: number;
                currency?: string;
            };
            totalCost?: {
                amount?: number;
                currency?: string;
            };
            warehouseId?: string;
            locationId?: string;
            movementType?: "in" | "return" | "adjustment" | "transfer" | "damage" | "expired" | "out" | "theft";
            movementReason?: "production" | "other" | "purchase" | "sale" | "return" | "adjustment" | "damage" | "expired" | "theft" | "transfer_in" | "transfer_out" | "consumption";
            referenceId?: string;
            batchNumber?: string;
            expirationDate?: Date;
            serialNumber?: string;
            supplierId?: string;
            customerId?: string;
            movementDate?: Date;
        }[];
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    data?: {
        organizationId?: string;
        id?: string;
        createdAt?: Date;
        updatedAt?: Date;
        isActive?: boolean;
        settings?: {
            tags?: string[];
            notes?: string;
            reorderPoint?: number;
            reorderQuantity?: number;
            customFields?: Record<string, any>;
            costMethod?: "fifo" | "standard" | "lifo" | "average";
            valuationMethod?: "fifo" | "standard" | "lifo" | "average";
            trackInventory?: boolean;
            allowNegativeStock?: boolean;
            lowStockThreshold?: number;
            autoReorder?: boolean;
            trackExpiration?: boolean;
            trackSerialNumbers?: boolean;
            trackBatchNumbers?: boolean;
        };
        averageCost?: {
            amount?: number;
            currency?: string;
        };
        productId?: string;
        unitCost?: {
            amount?: number;
            currency?: string;
        };
        totalCost?: {
            amount?: number;
            currency?: string;
        };
        warehouseId?: string;
        locationId?: string;
        initialQuantity?: number;
        currentQuantity?: number;
        reservedQuantity?: number;
        availableQuantity?: number;
        lastMovementDate?: Date;
        lastMovementType?: "in" | "return" | "adjustment" | "transfer" | "damage" | "expired" | "out" | "theft";
        movements?: {
            status?: "pending" | "completed" | "cancelled" | "reversed";
            userId?: string;
            id?: string;
            notes?: string;
            reference?: string;
            quantity?: number;
            productId?: string;
            unitCost?: {
                amount?: number;
                currency?: string;
            };
            totalCost?: {
                amount?: number;
                currency?: string;
            };
            warehouseId?: string;
            locationId?: string;
            movementType?: "in" | "return" | "adjustment" | "transfer" | "damage" | "expired" | "out" | "theft";
            movementReason?: "production" | "other" | "purchase" | "sale" | "return" | "adjustment" | "damage" | "expired" | "theft" | "transfer_in" | "transfer_out" | "consumption";
            referenceId?: string;
            batchNumber?: string;
            expirationDate?: Date;
            serialNumber?: string;
            supplierId?: string;
            customerId?: string;
            movementDate?: Date;
        }[];
    }[];
    pagination?: {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
        hasNext?: boolean;
        hasPrev?: boolean;
    };
}, {
    data?: {
        organizationId?: string;
        id?: string;
        createdAt?: Date;
        updatedAt?: Date;
        isActive?: boolean;
        settings?: {
            tags?: string[];
            notes?: string;
            reorderPoint?: number;
            reorderQuantity?: number;
            customFields?: Record<string, any>;
            costMethod?: "fifo" | "standard" | "lifo" | "average";
            valuationMethod?: "fifo" | "standard" | "lifo" | "average";
            trackInventory?: boolean;
            allowNegativeStock?: boolean;
            lowStockThreshold?: number;
            autoReorder?: boolean;
            trackExpiration?: boolean;
            trackSerialNumbers?: boolean;
            trackBatchNumbers?: boolean;
        };
        averageCost?: {
            amount?: number;
            currency?: string;
        };
        productId?: string;
        unitCost?: {
            amount?: number;
            currency?: string;
        };
        totalCost?: {
            amount?: number;
            currency?: string;
        };
        warehouseId?: string;
        locationId?: string;
        initialQuantity?: number;
        currentQuantity?: number;
        reservedQuantity?: number;
        availableQuantity?: number;
        lastMovementDate?: Date;
        lastMovementType?: "in" | "return" | "adjustment" | "transfer" | "damage" | "expired" | "out" | "theft";
        movements?: {
            status?: "pending" | "completed" | "cancelled" | "reversed";
            userId?: string;
            id?: string;
            notes?: string;
            reference?: string;
            quantity?: number;
            productId?: string;
            unitCost?: {
                amount?: number;
                currency?: string;
            };
            totalCost?: {
                amount?: number;
                currency?: string;
            };
            warehouseId?: string;
            locationId?: string;
            movementType?: "in" | "return" | "adjustment" | "transfer" | "damage" | "expired" | "out" | "theft";
            movementReason?: "production" | "other" | "purchase" | "sale" | "return" | "adjustment" | "damage" | "expired" | "theft" | "transfer_in" | "transfer_out" | "consumption";
            referenceId?: string;
            batchNumber?: string;
            expirationDate?: Date;
            serialNumber?: string;
            supplierId?: string;
            customerId?: string;
            movementDate?: Date;
        }[];
    }[];
    pagination?: {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
        hasNext?: boolean;
        hasPrev?: boolean;
    };
}>;
export declare const InventoryKardexStatsResponseSchema: z.ZodObject<{
    total: z.ZodNumber;
    active: z.ZodNumber;
    inactive: z.ZodNumber;
    createdThisMonth: z.ZodNumber;
    createdThisYear: z.ZodNumber;
    updatedThisMonth: z.ZodNumber;
    updatedThisYear: z.ZodNumber;
} & {
    byProduct: z.ZodRecord<z.ZodString, z.ZodNumber>;
    byWarehouse: z.ZodRecord<z.ZodString, z.ZodNumber>;
    byLocation: z.ZodRecord<z.ZodString, z.ZodNumber>;
    byMovementType: z.ZodRecord<z.ZodString, z.ZodNumber>;
    byMovementReason: z.ZodRecord<z.ZodString, z.ZodNumber>;
    totalQuantity: z.ZodNumber;
    totalValue: z.ZodNumber;
    availableQuantity: z.ZodNumber;
    availableValue: z.ZodNumber;
    reservedQuantity: z.ZodNumber;
    reservedValue: z.ZodNumber;
    lowStockCount: z.ZodNumber;
    outOfStockCount: z.ZodNumber;
    needsReorderCount: z.ZodNumber;
    expiredItemsCount: z.ZodNumber;
    expiringItemsCount: z.ZodNumber;
    averageStockTurnover: z.ZodNumber;
    totalMovements: z.ZodNumber;
    movementsIn: z.ZodNumber;
    movementsOut: z.ZodNumber;
    movementsTransfer: z.ZodNumber;
    movementsAdjustment: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    active?: number;
    inactive?: number;
    totalValue?: number;
    total?: number;
    totalMovements?: number;
    reservedQuantity?: number;
    availableQuantity?: number;
    createdThisMonth?: number;
    createdThisYear?: number;
    updatedThisMonth?: number;
    updatedThisYear?: number;
    byProduct?: Record<string, number>;
    byWarehouse?: Record<string, number>;
    byLocation?: Record<string, number>;
    byMovementType?: Record<string, number>;
    byMovementReason?: Record<string, number>;
    totalQuantity?: number;
    availableValue?: number;
    reservedValue?: number;
    lowStockCount?: number;
    outOfStockCount?: number;
    needsReorderCount?: number;
    expiredItemsCount?: number;
    expiringItemsCount?: number;
    averageStockTurnover?: number;
    movementsIn?: number;
    movementsOut?: number;
    movementsTransfer?: number;
    movementsAdjustment?: number;
}, {
    active?: number;
    inactive?: number;
    totalValue?: number;
    total?: number;
    totalMovements?: number;
    reservedQuantity?: number;
    availableQuantity?: number;
    createdThisMonth?: number;
    createdThisYear?: number;
    updatedThisMonth?: number;
    updatedThisYear?: number;
    byProduct?: Record<string, number>;
    byWarehouse?: Record<string, number>;
    byLocation?: Record<string, number>;
    byMovementType?: Record<string, number>;
    byMovementReason?: Record<string, number>;
    totalQuantity?: number;
    availableValue?: number;
    reservedValue?: number;
    lowStockCount?: number;
    outOfStockCount?: number;
    needsReorderCount?: number;
    expiredItemsCount?: number;
    expiringItemsCount?: number;
    averageStockTurnover?: number;
    movementsIn?: number;
    movementsOut?: number;
    movementsTransfer?: number;
    movementsAdjustment?: number;
}>;
export declare const ReserveQuantityRequestSchema: z.ZodObject<{
    quantity: z.ZodNumber;
    reference: z.ZodOptional<z.ZodString>;
    referenceId: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    notes?: string;
    reference?: string;
    quantity?: number;
    referenceId?: string;
}, {
    notes?: string;
    reference?: string;
    quantity?: number;
    referenceId?: string;
}>;
export declare const ReleaseReservationRequestSchema: z.ZodObject<{
    quantity: z.ZodNumber;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    notes?: string;
    quantity?: number;
}, {
    notes?: string;
    quantity?: number;
}>;
export declare const InventoryReportRequestSchema: z.ZodObject<{
    organizationId: z.ZodString;
    filters: z.ZodOptional<z.ZodObject<{
        productId: z.ZodOptional<z.ZodString>;
        warehouseId: z.ZodOptional<z.ZodString>;
        locationId: z.ZodOptional<z.ZodString>;
        lowStock: z.ZodOptional<z.ZodBoolean>;
        outOfStock: z.ZodOptional<z.ZodBoolean>;
        needsReorder: z.ZodOptional<z.ZodBoolean>;
        hasExpiredItems: z.ZodOptional<z.ZodBoolean>;
        hasExpiringItems: z.ZodOptional<z.ZodBoolean>;
        costMethod: z.ZodOptional<z.ZodEnum<["fifo", "lifo", "average", "standard"]>>;
        valuationMethod: z.ZodOptional<z.ZodEnum<["fifo", "lifo", "average", "standard"]>>;
    }, "strip", z.ZodTypeAny, {
        lowStock?: boolean;
        outOfStock?: boolean;
        productId?: string;
        warehouseId?: string;
        locationId?: string;
        needsReorder?: boolean;
        hasExpiredItems?: boolean;
        hasExpiringItems?: boolean;
        costMethod?: "fifo" | "standard" | "lifo" | "average";
        valuationMethod?: "fifo" | "standard" | "lifo" | "average";
    }, {
        lowStock?: boolean;
        outOfStock?: boolean;
        productId?: string;
        warehouseId?: string;
        locationId?: string;
        needsReorder?: boolean;
        hasExpiredItems?: boolean;
        hasExpiringItems?: boolean;
        costMethod?: "fifo" | "standard" | "lifo" | "average";
        valuationMethod?: "fifo" | "standard" | "lifo" | "average";
    }>>;
}, "strip", z.ZodTypeAny, {
    organizationId?: string;
    filters?: {
        lowStock?: boolean;
        outOfStock?: boolean;
        productId?: string;
        warehouseId?: string;
        locationId?: string;
        needsReorder?: boolean;
        hasExpiredItems?: boolean;
        hasExpiringItems?: boolean;
        costMethod?: "fifo" | "standard" | "lifo" | "average";
        valuationMethod?: "fifo" | "standard" | "lifo" | "average";
    };
}, {
    organizationId?: string;
    filters?: {
        lowStock?: boolean;
        outOfStock?: boolean;
        productId?: string;
        warehouseId?: string;
        locationId?: string;
        needsReorder?: boolean;
        hasExpiredItems?: boolean;
        hasExpiringItems?: boolean;
        costMethod?: "fifo" | "standard" | "lifo" | "average";
        valuationMethod?: "fifo" | "standard" | "lifo" | "average";
    };
}>;
export declare const MovementReportRequestSchema: z.ZodObject<{
    organizationId: z.ZodString;
    startDate: z.ZodDate;
    endDate: z.ZodDate;
    filters: z.ZodOptional<z.ZodObject<{
        productId: z.ZodOptional<z.ZodString>;
        warehouseId: z.ZodOptional<z.ZodString>;
        locationId: z.ZodOptional<z.ZodString>;
        movementType: z.ZodOptional<z.ZodEnum<["in", "out", "transfer", "adjustment", "return", "damage", "expired", "theft"]>>;
        movementReason: z.ZodOptional<z.ZodEnum<["purchase", "sale", "transfer_in", "transfer_out", "adjustment", "return", "damage", "expired", "theft", "production", "consumption", "other"]>>;
        status: z.ZodOptional<z.ZodEnum<["pending", "completed", "cancelled", "reversed"]>>;
    }, "strip", z.ZodTypeAny, {
        status?: "pending" | "completed" | "cancelled" | "reversed";
        productId?: string;
        warehouseId?: string;
        locationId?: string;
        movementType?: "in" | "return" | "adjustment" | "transfer" | "damage" | "expired" | "out" | "theft";
        movementReason?: "production" | "other" | "purchase" | "sale" | "return" | "adjustment" | "damage" | "expired" | "theft" | "transfer_in" | "transfer_out" | "consumption";
    }, {
        status?: "pending" | "completed" | "cancelled" | "reversed";
        productId?: string;
        warehouseId?: string;
        locationId?: string;
        movementType?: "in" | "return" | "adjustment" | "transfer" | "damage" | "expired" | "out" | "theft";
        movementReason?: "production" | "other" | "purchase" | "sale" | "return" | "adjustment" | "damage" | "expired" | "theft" | "transfer_in" | "transfer_out" | "consumption";
    }>>;
}, "strip", z.ZodTypeAny, {
    organizationId?: string;
    filters?: {
        status?: "pending" | "completed" | "cancelled" | "reversed";
        productId?: string;
        warehouseId?: string;
        locationId?: string;
        movementType?: "in" | "return" | "adjustment" | "transfer" | "damage" | "expired" | "out" | "theft";
        movementReason?: "production" | "other" | "purchase" | "sale" | "return" | "adjustment" | "damage" | "expired" | "theft" | "transfer_in" | "transfer_out" | "consumption";
    };
    startDate?: Date;
    endDate?: Date;
}, {
    organizationId?: string;
    filters?: {
        status?: "pending" | "completed" | "cancelled" | "reversed";
        productId?: string;
        warehouseId?: string;
        locationId?: string;
        movementType?: "in" | "return" | "adjustment" | "transfer" | "damage" | "expired" | "out" | "theft";
        movementReason?: "production" | "other" | "purchase" | "sale" | "return" | "adjustment" | "damage" | "expired" | "theft" | "transfer_in" | "transfer_out" | "consumption";
    };
    startDate?: Date;
    endDate?: Date;
}>;
export declare const ExpirationReportRequestSchema: z.ZodObject<{
    organizationId: z.ZodString;
    days: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    organizationId?: string;
    days?: number;
}, {
    organizationId?: string;
    days?: number;
}>;
export declare const ReorderReportRequestSchema: z.ZodObject<{
    organizationId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    organizationId?: string;
}, {
    organizationId?: string;
}>;
export type CreateInventoryKardexRequest = z.infer<typeof CreateInventoryKardexRequestSchema>;
export type UpdateInventoryKardexRequest = z.infer<typeof UpdateInventoryKardexRequestSchema>;
export type RecordMovementRequest = z.infer<typeof RecordMovementRequestSchema>;
export type InventoryKardexIdParam = z.infer<typeof InventoryKardexIdParamSchema>;
export type InventoryKardexOrganizationIdParam = z.infer<typeof InventoryKardexOrganizationIdParamSchema>;
export type InventoryKardexSearchQuery = z.infer<typeof InventoryKardexSearchQuerySchema>;
export type InventoryKardexBulkUpdate = z.infer<typeof InventoryKardexBulkUpdateSchema>;
export type InventoryKardexBulkDelete = z.infer<typeof InventoryKardexBulkDeleteSchema>;
export type InventoryKardexResponse = z.infer<typeof InventoryKardexResponseSchema>;
export type InventoryKardexListResponse = z.infer<typeof InventoryKardexListResponseSchema>;
export type InventoryKardexStatsResponse = z.infer<typeof InventoryKardexStatsResponseSchema>;
export type InventoryMovementResponse = z.infer<typeof InventoryMovementResponseSchema>;
export type ReserveQuantityRequest = z.infer<typeof ReserveQuantityRequestSchema>;
export type ReleaseReservationRequest = z.infer<typeof ReleaseReservationRequestSchema>;
export type InventoryReportRequest = z.infer<typeof InventoryReportRequestSchema>;
export type MovementReportRequest = z.infer<typeof MovementReportRequestSchema>;
export type ExpirationReportRequest = z.infer<typeof ExpirationReportRequestSchema>;
export type ReorderReportRequest = z.infer<typeof ReorderReportRequestSchema>;
//# sourceMappingURL=inventory-kardex.dto.d.ts.map