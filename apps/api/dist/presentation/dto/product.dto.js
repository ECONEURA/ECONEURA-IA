import { z } from 'zod';
export const CreateProductRequestSchema = z.object({
    organizationId: z.string().uuid('Invalid organization ID format'),
    name: z.string().min(1, 'Product name is required').max(200, 'Product name cannot exceed 200 characters'),
    description: z.string().max(2000, 'Description cannot exceed 2000 characters').optional(),
    shortDescription: z.string().max(500, 'Short description cannot exceed 500 characters').optional(),
    sku: z.string().min(1, 'SKU is required').max(100, 'SKU cannot exceed 100 characters'),
    barcode: z.string().max(100, 'Barcode cannot exceed 100 characters').optional(),
    type: z.enum(['physical', 'digital', 'service', 'subscription', 'bundle'], {
        errorMap: () => ({ message: 'Type must be one of: physical, digital, service, subscription, bundle' })
    }),
    status: z.enum(['active', 'inactive', 'discontinued', 'draft', 'archived'], {
        errorMap: () => ({ message: 'Status must be one of: active, inactive, discontinued, draft, archived' })
    }),
    category: z.string().min(1, 'Category is required').max(100, 'Category cannot exceed 100 characters'),
    brand: z.string().max(100, 'Brand cannot exceed 100 characters').optional(),
    supplier: z.string().max(100, 'Supplier cannot exceed 100 characters').optional(),
    settings: z.object({
        inventory: z.object({
            trackInventory: z.boolean().default(true),
            lowStockThreshold: z.number().int().min(0, 'Low stock threshold must be non-negative').default(10),
            allowBackorder: z.boolean().default(false),
            allowPreorder: z.boolean().default(false)
        }),
        pricing: z.object({
            costPrice: z.object({
                amount: z.number().min(0, 'Cost price must be non-negative'),
                currency: z.string().length(3, 'Currency must be 3 characters')
            }).optional(),
            sellingPrice: z.object({
                amount: z.number().min(0, 'Selling price must be non-negative'),
                currency: z.string().length(3, 'Currency must be 3 characters')
            }),
            compareAtPrice: z.object({
                amount: z.number().min(0, 'Compare at price must be non-negative'),
                currency: z.string().length(3, 'Currency must be 3 characters')
            }).optional(),
            margin: z.number().min(0, 'Margin must be non-negative').max(100, 'Margin cannot exceed 100%').optional()
        }),
        shipping: z.object({
            weight: z.number().min(0, 'Weight must be non-negative').optional(),
            dimensions: z.object({
                length: z.number().min(0, 'Length must be non-negative'),
                width: z.number().min(0, 'Width must be non-negative'),
                height: z.number().min(0, 'Height must be non-negative')
            }).optional(),
            requiresShipping: z.boolean().default(true),
            freeShipping: z.boolean().default(false)
        }),
        seo: z.object({
            metaTitle: z.string().max(60, 'Meta title cannot exceed 60 characters').optional(),
            metaDescription: z.string().max(160, 'Meta description cannot exceed 160 characters').optional(),
            slug: z.string().min(1, 'Slug is required').max(100, 'Slug cannot exceed 100 characters')
        }),
        customFields: z.record(z.any()).default({}),
        tags: z.array(z.string()).default([]),
        notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').default('')
    }),
    images: z.array(z.string().url('Invalid image URL')).optional(),
    documents: z.array(z.string().url('Invalid document URL')).optional(),
    specifications: z.record(z.any()).optional(),
    variants: z.array(z.object({
        name: z.string().min(1, 'Variant name is required').max(100, 'Variant name cannot exceed 100 characters'),
        sku: z.string().min(1, 'Variant SKU is required').max(100, 'Variant SKU cannot exceed 100 characters'),
        price: z.object({
            amount: z.number().min(0, 'Variant price must be non-negative'),
            currency: z.string().length(3, 'Currency must be 3 characters')
        }),
        compareAtPrice: z.object({
            amount: z.number().min(0, 'Compare at price must be non-negative'),
            currency: z.string().length(3, 'Currency must be 3 characters')
        }).optional(),
        costPrice: z.object({
            amount: z.number().min(0, 'Cost price must be non-negative'),
            currency: z.string().length(3, 'Currency must be 3 characters')
        }).optional(),
        inventory: z.object({
            quantity: z.number().int().min(0, 'Quantity must be non-negative'),
            reserved: z.number().int().min(0, 'Reserved quantity must be non-negative'),
            available: z.number().int().min(0, 'Available quantity must be non-negative')
        }),
        attributes: z.record(z.any()).default({}),
        isActive: z.boolean().default(true)
    })).optional()
});
export const UpdateProductRequestSchema = z.object({
    name: z.string().min(1, 'Product name is required').max(200, 'Product name cannot exceed 200 characters').optional(),
    description: z.string().max(2000, 'Description cannot exceed 2000 characters').optional(),
    shortDescription: z.string().max(500, 'Short description cannot exceed 500 characters').optional(),
    sku: z.string().min(1, 'SKU is required').max(100, 'SKU cannot exceed 100 characters').optional(),
    barcode: z.string().max(100, 'Barcode cannot exceed 100 characters').optional(),
    type: z.enum(['physical', 'digital', 'service', 'subscription', 'bundle'], {
        errorMap: () => ({ message: 'Type must be one of: physical, digital, service, subscription, bundle' })
    }).optional(),
    status: z.enum(['active', 'inactive', 'discontinued', 'draft', 'archived'], {
        errorMap: () => ({ message: 'Status must be one of: active, inactive, discontinued, draft, archived' })
    }).optional(),
    category: z.string().min(1, 'Category is required').max(100, 'Category cannot exceed 100 characters').optional(),
    brand: z.string().max(100, 'Brand cannot exceed 100 characters').optional(),
    supplier: z.string().max(100, 'Supplier cannot exceed 100 characters').optional(),
    settings: z.object({
        inventory: z.object({
            trackInventory: z.boolean().optional(),
            lowStockThreshold: z.number().int().min(0, 'Low stock threshold must be non-negative').optional(),
            allowBackorder: z.boolean().optional(),
            allowPreorder: z.boolean().optional()
        }).optional(),
        pricing: z.object({
            costPrice: z.object({
                amount: z.number().min(0, 'Cost price must be non-negative'),
                currency: z.string().length(3, 'Currency must be 3 characters')
            }).optional(),
            sellingPrice: z.object({
                amount: z.number().min(0, 'Selling price must be non-negative'),
                currency: z.string().length(3, 'Currency must be 3 characters')
            }).optional(),
            compareAtPrice: z.object({
                amount: z.number().min(0, 'Compare at price must be non-negative'),
                currency: z.string().length(3, 'Currency must be 3 characters')
            }).optional(),
            margin: z.number().min(0, 'Margin must be non-negative').max(100, 'Margin cannot exceed 100%').optional()
        }).optional(),
        shipping: z.object({
            weight: z.number().min(0, 'Weight must be non-negative').optional(),
            dimensions: z.object({
                length: z.number().min(0, 'Length must be non-negative'),
                width: z.number().min(0, 'Width must be non-negative'),
                height: z.number().min(0, 'Height must be non-negative')
            }).optional(),
            requiresShipping: z.boolean().optional(),
            freeShipping: z.boolean().optional()
        }).optional(),
        seo: z.object({
            metaTitle: z.string().max(60, 'Meta title cannot exceed 60 characters').optional(),
            metaDescription: z.string().max(160, 'Meta description cannot exceed 160 characters').optional(),
            slug: z.string().min(1, 'Slug is required').max(100, 'Slug cannot exceed 100 characters').optional()
        }).optional(),
        customFields: z.record(z.any()).optional(),
        tags: z.array(z.string()).optional(),
        notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional()
    }).optional(),
    images: z.array(z.string().url('Invalid image URL')).optional(),
    documents: z.array(z.string().url('Invalid document URL')).optional(),
    specifications: z.record(z.any()).optional(),
    variants: z.array(z.object({
        id: z.string().uuid('Invalid variant ID format').optional(),
        name: z.string().min(1, 'Variant name is required').max(100, 'Variant name cannot exceed 100 characters'),
        sku: z.string().min(1, 'Variant SKU is required').max(100, 'Variant SKU cannot exceed 100 characters'),
        price: z.object({
            amount: z.number().min(0, 'Variant price must be non-negative'),
            currency: z.string().length(3, 'Currency must be 3 characters')
        }),
        compareAtPrice: z.object({
            amount: z.number().min(0, 'Compare at price must be non-negative'),
            currency: z.string().length(3, 'Currency must be 3 characters')
        }).optional(),
        costPrice: z.object({
            amount: z.number().min(0, 'Cost price must be non-negative'),
            currency: z.string().length(3, 'Currency must be 3 characters')
        }).optional(),
        inventory: z.object({
            quantity: z.number().int().min(0, 'Quantity must be non-negative'),
            reserved: z.number().int().min(0, 'Reserved quantity must be non-negative'),
            available: z.number().int().min(0, 'Available quantity must be non-negative')
        }),
        attributes: z.record(z.any()).default({}),
        isActive: z.boolean().default(true)
    })).optional()
});
export const ProductIdParamSchema = z.object({
    id: z.string().uuid('Invalid product ID format')
});
export const ProductOrganizationIdParamSchema = z.object({
    organizationId: z.string().uuid('Invalid organization ID format')
});
export const ProductSearchQuerySchema = z.object({
    page: z.coerce.number().int().min(1, 'Page must be at least 1').default(1),
    limit: z.coerce.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
    sortBy: z.enum(['name', 'sku', 'category', 'brand', 'createdAt', 'updatedAt']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    search: z.string().max(200, 'Search term cannot exceed 200 characters').optional(),
    type: z.enum(['physical', 'digital', 'service', 'subscription', 'bundle']).optional(),
    status: z.enum(['active', 'inactive', 'discontinued', 'draft', 'archived']).optional(),
    category: z.string().optional(),
    brand: z.string().optional(),
    supplier: z.string().optional(),
    minPrice: z.coerce.number().min(0, 'Minimum price must be non-negative').optional(),
    maxPrice: z.coerce.number().min(0, 'Maximum price must be non-negative').optional(),
    inStock: z.coerce.boolean().optional(),
    lowStock: z.coerce.boolean().optional()
});
export const ProductBulkUpdateSchema = z.object({
    ids: z.array(z.string().uuid('Invalid product ID format')).min(1, 'At least one product ID is required'),
    updates: z.object({
        status: z.enum(['active', 'inactive', 'discontinued', 'draft', 'archived']).optional(),
        category: z.string().optional(),
        brand: z.string().optional(),
        supplier: z.string().optional(),
        tags: z.array(z.string()).optional()
    })
});
export const ProductBulkDeleteSchema = z.object({
    ids: z.array(z.string().uuid('Invalid product ID format')).min(1, 'At least one product ID is required')
});
export const ProductResponseSchema = z.object({
    id: z.string().uuid(),
    organizationId: z.string().uuid(),
    name: z.string(),
    description: z.string().optional(),
    shortDescription: z.string().optional(),
    sku: z.string(),
    barcode: z.string().optional(),
    type: z.enum(['physical', 'digital', 'service', 'subscription', 'bundle']),
    status: z.enum(['active', 'inactive', 'discontinued', 'draft', 'archived']),
    category: z.string(),
    brand: z.string().optional(),
    supplier: z.string().optional(),
    settings: z.object({
        inventory: z.object({
            trackInventory: z.boolean(),
            lowStockThreshold: z.number(),
            allowBackorder: z.boolean(),
            allowPreorder: z.boolean()
        }),
        pricing: z.object({
            costPrice: z.object({
                amount: z.number(),
                currency: z.string()
            }).optional(),
            sellingPrice: z.object({
                amount: z.number(),
                currency: z.string()
            }),
            compareAtPrice: z.object({
                amount: z.number(),
                currency: z.string()
            }).optional(),
            margin: z.number().optional()
        }),
        shipping: z.object({
            weight: z.number().optional(),
            dimensions: z.object({
                length: z.number(),
                width: z.number(),
                height: z.number()
            }).optional(),
            requiresShipping: z.boolean(),
            freeShipping: z.boolean()
        }),
        seo: z.object({
            metaTitle: z.string().optional(),
            metaDescription: z.string().optional(),
            slug: z.string()
        }),
        customFields: z.record(z.any()),
        tags: z.array(z.string()),
        notes: z.string()
    }),
    images: z.array(z.string()).optional(),
    documents: z.array(z.string()).optional(),
    specifications: z.record(z.any()).optional(),
    variants: z.array(z.object({
        id: z.string(),
        name: z.string(),
        sku: z.string(),
        price: z.object({
            amount: z.number(),
            currency: z.string()
        }),
        compareAtPrice: z.object({
            amount: z.number(),
            currency: z.string()
        }).optional(),
        costPrice: z.object({
            amount: z.number(),
            currency: z.string()
        }).optional(),
        inventory: z.object({
            quantity: z.number(),
            reserved: z.number(),
            available: z.number()
        }),
        attributes: z.record(z.any()),
        isActive: z.boolean()
    })).optional(),
    isActive: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date()
});
export const ProductListResponseSchema = z.object({
    data: z.array(ProductResponseSchema),
    pagination: z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        totalPages: z.number(),
        hasNext: z.boolean(),
        hasPrev: z.boolean()
    })
});
export const ProductStatsResponseSchema = z.object({
    total: z.number(),
    active: z.number(),
    inactive: z.number(),
    draft: z.number(),
    discontinued: z.number(),
    archived: z.number(),
    byType: z.record(z.number()),
    byCategory: z.record(z.number()),
    byBrand: z.record(z.number()),
    bySupplier: z.record(z.number()),
    lowStock: z.number(),
    outOfStock: z.number(),
    totalValue: z.number(),
    averagePrice: z.number(),
    averageMargin: z.number()
});
//# sourceMappingURL=product.dto.js.map