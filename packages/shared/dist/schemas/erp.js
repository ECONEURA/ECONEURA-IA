import { z } from 'zod';
const BaseEntity = z.object({
    id: z.string().uuid(),
    orgId: z.string().uuid(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    deletedAt: z.string().datetime().nullable().optional(),
});
export const ProductSchema = BaseEntity.extend({
    sku: z.string().min(1).max(100),
    name: z.string().min(1).max(200),
    description: z.string().max(5000).optional(),
    category: z.string().max(100).optional(),
    unit: z.string().max(50).default('unit'),
    status: z.enum(['active', 'inactive', 'discontinued']).default('active'),
    barcode: z.string().max(100).optional(),
    weight: z.number().min(0).optional(),
    dimensions: z.object({
        length: z.number().min(0),
        width: z.number().min(0),
        height: z.number().min(0),
        unit: z.enum(['cm', 'm', 'in', 'ft']).default('cm'),
    }).optional(),
    costPrice: z.number().min(0).default(0),
    sellingPrice: z.number().min(0).default(0),
    currency: z.string().length(3).default('EUR'),
    taxRate: z.number().min(0).max(100).default(21),
    minStockLevel: z.number().int().min(0).default(0),
    maxStockLevel: z.number().int().min(0).optional(),
    reorderPoint: z.number().int().min(0).default(0),
    reorderQuantity: z.number().int().min(1).default(1),
    tags: z.array(z.string()).default([]),
    metadata: z.record(z.unknown()).optional(),
});
export const CreateProductSchema = ProductSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
});
export const UpdateProductSchema = CreateProductSchema.partial();
export const ProductFilterSchema = z.object({
    q: z.string().optional(),
    sku: z.string().optional(),
    category: z.string().optional(),
    status: z.enum(['active', 'inactive', 'discontinued']).optional(),
    minPrice: z.number().min(0).optional(),
    maxPrice: z.number().optional(),
    lowStock: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
});
export const SupplierSchema = BaseEntity.extend({
    code: z.string().min(1).max(50),
    name: z.string().min(1).max(200),
    taxId: z.string().max(50).optional(),
    contactPerson: z.string().max(200).optional(),
    email: z.string().email(),
    phone: z.string().max(50).optional(),
    website: z.string().url().optional(),
    address: z.string().max(500).optional(),
    city: z.string().max(100).optional(),
    postalCode: z.string().max(20).optional(),
    country: z.string().max(100).optional(),
    status: z.enum(['active', 'inactive', 'blocked']).default('active'),
    paymentTerms: z.string().max(200).optional(),
    deliveryLeadTime: z.number().int().min(0).default(0),
    rating: z.number().min(0).max(5).optional(),
    tags: z.array(z.string()).default([]),
    metadata: z.record(z.unknown()).optional(),
});
export const CreateSupplierSchema = SupplierSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
});
export const UpdateSupplierSchema = CreateSupplierSchema.partial();
export const SupplierFilterSchema = z.object({
    q: z.string().optional(),
    code: z.string().optional(),
    status: z.enum(['active', 'inactive', 'blocked']).optional(),
    country: z.string().optional(),
    minRating: z.number().min(0).max(5).optional(),
    tags: z.array(z.string()).optional(),
});
export const WarehouseSchema = BaseEntity.extend({
    code: z.string().min(1).max(50),
    name: z.string().min(1).max(200),
    type: z.enum(['main', 'secondary', 'transit', 'virtual']).default('main'),
    address: z.string().max(500),
    city: z.string().max(100),
    postalCode: z.string().max(20),
    country: z.string().max(100),
    manager: z.string().max(200).optional(),
    phone: z.string().max(50).optional(),
    email: z.string().email().optional(),
    capacity: z.number().int().min(0).optional(),
    status: z.enum(['active', 'inactive', 'maintenance']).default('active'),
    metadata: z.record(z.unknown()).optional(),
});
export const CreateWarehouseSchema = WarehouseSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
});
export const UpdateWarehouseSchema = CreateWarehouseSchema.partial();
export const InventorySchema = BaseEntity.extend({
    productId: z.string().uuid(),
    warehouseId: z.string().uuid(),
    quantity: z.number().int().min(0).default(0),
    reservedQuantity: z.number().int().min(0).default(0),
    availableQuantity: z.number().int().min(0).default(0),
    location: z.string().max(100).optional(),
    batchNumber: z.string().max(100).optional(),
    serialNumber: z.string().max(100).optional(),
    expiryDate: z.string().datetime().optional(),
    lastCountDate: z.string().datetime().optional(),
    lastCountQuantity: z.number().int().min(0).optional(),
    metadata: z.record(z.unknown()).optional(),
});
export const CreateInventorySchema = InventorySchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    availableQuantity: true,
});
export const UpdateInventorySchema = CreateInventorySchema.partial();
export const InventoryAdjustmentSchema = BaseEntity.extend({
    productId: z.string().uuid(),
    warehouseId: z.string().uuid(),
    type: z.enum([
        'purchase',
        'sale',
        'return',
        'damage',
        'loss',
        'count',
        'transfer_in',
        'transfer_out',
        'production',
        'adjustment'
    ]),
    quantity: z.number().int(),
    previousQuantity: z.number().int().min(0),
    newQuantity: z.number().int().min(0),
    cost: z.number().min(0).optional(),
    reason: z.string().max(500).optional(),
    referenceType: z.enum(['purchase_order', 'sales_order', 'transfer', 'manual', 'production']).optional(),
    referenceId: z.string().uuid().optional(),
    performedByUserId: z.string().uuid(),
    approvedByUserId: z.string().uuid().optional(),
    batchNumber: z.string().max(100).optional(),
    metadata: z.record(z.unknown()).optional(),
});
export const CreateInventoryAdjustmentSchema = z.object({
    productId: z.string().uuid(),
    warehouseId: z.string().uuid(),
    type: InventoryAdjustmentSchema.shape.type,
    quantity: z.number().int(),
    reason: z.string().max(500).optional(),
    referenceType: InventoryAdjustmentSchema.shape.referenceType.optional(),
    referenceId: z.string().uuid().optional(),
    batchNumber: z.string().max(100).optional(),
    idempotencyKey: z.string().min(1).max(255),
});
export const PurchaseOrderSchema = BaseEntity.extend({
    orderNumber: z.string().min(1).max(50),
    supplierId: z.string().uuid(),
    warehouseId: z.string().uuid(),
    status: z.enum(['draft', 'sent', 'confirmed', 'partial', 'received', 'cancelled']).default('draft'),
    orderDate: z.string().datetime(),
    expectedDeliveryDate: z.string().datetime().optional(),
    actualDeliveryDate: z.string().datetime().optional(),
    subtotal: z.number().min(0).default(0),
    taxAmount: z.number().min(0).default(0),
    shippingCost: z.number().min(0).default(0),
    totalAmount: z.number().min(0).default(0),
    currency: z.string().length(3).default('EUR'),
    paymentTerms: z.string().max(200).optional(),
    notes: z.string().max(5000).optional(),
    approvedByUserId: z.string().uuid().optional(),
    approvedAt: z.string().datetime().optional(),
    metadata: z.record(z.unknown()).optional(),
});
export const PurchaseOrderItemSchema = z.object({
    id: z.string().uuid(),
    purchaseOrderId: z.string().uuid(),
    productId: z.string().uuid(),
    quantity: z.number().int().min(1),
    unitPrice: z.number().min(0),
    discount: z.number().min(0).max(100).default(0),
    taxRate: z.number().min(0).max(100).default(21),
    subtotal: z.number().min(0),
    taxAmount: z.number().min(0),
    total: z.number().min(0),
    receivedQuantity: z.number().int().min(0).default(0),
    notes: z.string().max(500).optional(),
});
export const CreatePurchaseOrderSchema = PurchaseOrderSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    orderNumber: true,
}).extend({
    items: z.array(PurchaseOrderItemSchema.omit({ id: true, purchaseOrderId: true })),
});
//# sourceMappingURL=erp.js.map