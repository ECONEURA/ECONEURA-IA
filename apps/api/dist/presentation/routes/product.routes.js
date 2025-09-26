import { Router } from 'express';
import { z } from 'zod';

import { validateRequest } from '../middleware/validation.middleware.js';
export const createProductRoutes = (productController) => {
    const router = Router();
    router.post('/', validateRequest({
        body: z.object({
            organizationId: z.string().uuid(),
            name: z.string().min(1).max(200),
            description: z.string().max(2000).optional(),
            shortDescription: z.string().max(500).optional(),
            sku: z.string().min(1).max(100),
            barcode: z.string().max(100).optional(),
            type: z.enum(['physical', 'digital', 'service', 'subscription', 'bundle']),
            status: z.enum(['active', 'inactive', 'discontinued', 'draft', 'archived']),
            category: z.string().min(1).max(100),
            brand: z.string().max(100).optional(),
            supplier: z.string().max(100).optional(),
            settings: z.object({
                inventory: z.object({
                    trackInventory: z.boolean().default(true),
                    lowStockThreshold: z.number().int().min(0).default(10),
                    allowBackorder: z.boolean().default(false),
                    allowPreorder: z.boolean().default(false)
                }),
                pricing: z.object({
                    costPrice: z.object({
                        amount: z.number().min(0),
                        currency: z.string().length(3)
                    }).optional(),
                    sellingPrice: z.object({
                        amount: z.number().min(0),
                        currency: z.string().length(3)
                    }),
                    compareAtPrice: z.object({
                        amount: z.number().min(0),
                        currency: z.string().length(3)
                    }).optional(),
                    margin: z.number().min(0).max(100).optional()
                }),
                shipping: z.object({
                    weight: z.number().min(0).optional(),
                    dimensions: z.object({
                        length: z.number().min(0),
                        width: z.number().min(0),
                        height: z.number().min(0)
                    }).optional(),
                    requiresShipping: z.boolean().default(true),
                    freeShipping: z.boolean().default(false)
                }),
                seo: z.object({
                    metaTitle: z.string().max(60).optional(),
                    metaDescription: z.string().max(160).optional(),
                    slug: z.string().min(1).max(100)
                }),
                customFields: z.record(z.any()).default({}),
                tags: z.array(z.string()).default([]),
                notes: z.string().max(1000).default('')
            }),
            images: z.array(z.string().url()).optional(),
            documents: z.array(z.string().url()).optional(),
            specifications: z.record(z.any()).optional(),
            variants: z.array(z.object({
                name: z.string().min(1).max(100),
                sku: z.string().min(1).max(100),
                price: z.object({
                    amount: z.number().min(0),
                    currency: z.string().length(3)
                }),
                compareAtPrice: z.object({
                    amount: z.number().min(0),
                    currency: z.string().length(3)
                }).optional(),
                costPrice: z.object({
                    amount: z.number().min(0),
                    currency: z.string().length(3)
                }).optional(),
                inventory: z.object({
                    quantity: z.number().int().min(0),
                    reserved: z.number().int().min(0),
                    available: z.number().int().min(0)
                }),
                attributes: z.record(z.any()).default({}),
                isActive: z.boolean().default(true)
            })).optional()
        })
    }), productController.createProduct.bind(productController));
    router.put('/:id', validateRequest({
        params: z.object({
            id: z.string().uuid()
        }),
        body: z.object({
            name: z.string().min(1).max(200).optional(),
            description: z.string().max(2000).optional(),
            shortDescription: z.string().max(500).optional(),
            sku: z.string().min(1).max(100).optional(),
            barcode: z.string().max(100).optional(),
            type: z.enum(['physical', 'digital', 'service', 'subscription', 'bundle']).optional(),
            status: z.enum(['active', 'inactive', 'discontinued', 'draft', 'archived']).optional(),
            category: z.string().min(1).max(100).optional(),
            brand: z.string().max(100).optional(),
            supplier: z.string().max(100).optional(),
            settings: z.object({
                inventory: z.object({
                    trackInventory: z.boolean().optional(),
                    lowStockThreshold: z.number().int().min(0).optional(),
                    allowBackorder: z.boolean().optional(),
                    allowPreorder: z.boolean().optional()
                }).optional(),
                pricing: z.object({
                    costPrice: z.object({
                        amount: z.number().min(0),
                        currency: z.string().length(3)
                    }).optional(),
                    sellingPrice: z.object({
                        amount: z.number().min(0),
                        currency: z.string().length(3)
                    }).optional(),
                    compareAtPrice: z.object({
                        amount: z.number().min(0),
                        currency: z.string().length(3)
                    }).optional(),
                    margin: z.number().min(0).max(100).optional()
                }).optional(),
                shipping: z.object({
                    weight: z.number().min(0).optional(),
                    dimensions: z.object({
                        length: z.number().min(0),
                        width: z.number().min(0),
                        height: z.number().min(0)
                    }).optional(),
                    requiresShipping: z.boolean().optional(),
                    freeShipping: z.boolean().optional()
                }).optional(),
                seo: z.object({
                    metaTitle: z.string().max(60).optional(),
                    metaDescription: z.string().max(160).optional(),
                    slug: z.string().min(1).max(100).optional()
                }).optional(),
                customFields: z.record(z.any()).optional(),
                tags: z.array(z.string()).optional(),
                notes: z.string().max(1000).optional()
            }).optional(),
            images: z.array(z.string().url()).optional(),
            documents: z.array(z.string().url()).optional(),
            specifications: z.record(z.any()).optional(),
            variants: z.array(z.object({
                id: z.string().uuid().optional(),
                name: z.string().min(1).max(100),
                sku: z.string().min(1).max(100),
                price: z.object({
                    amount: z.number().min(0),
                    currency: z.string().length(3)
                }),
                compareAtPrice: z.object({
                    amount: z.number().min(0),
                    currency: z.string().length(3)
                }).optional(),
                costPrice: z.object({
                    amount: z.number().min(0),
                    currency: z.string().length(3)
                }).optional(),
                inventory: z.object({
                    quantity: z.number().int().min(0),
                    reserved: z.number().int().min(0),
                    available: z.number().int().min(0)
                }),
                attributes: z.record(z.any()).default({}),
                isActive: z.boolean().default(true)
            })).optional()
        })
    }), productController.updateProduct.bind(productController));
    router.delete('/:id', validateRequest({
        params: z.object({
            id: z.string().uuid()
        })
    }), productController.deleteProduct.bind(productController));
    router.get('/:id', validateRequest({
        params: z.object({
            id: z.string().uuid()
        })
    }), productController.getProduct.bind(productController));
    router.get('/organizations/:organizationId', validateRequest({
        params: z.object({
            organizationId: z.string().uuid()
        }),
        query: z.object({
            page: z.coerce.number().int().min(1).default(1),
            limit: z.coerce.number().int().min(1).max(100).default(20),
            sortBy: z.enum(['name', 'sku', 'category', 'brand', 'createdAt', 'updatedAt']).default('createdAt'),
            sortOrder: z.enum(['asc', 'desc']).default('desc'),
            search: z.string().max(200).optional(),
            type: z.enum(['physical', 'digital', 'service', 'subscription', 'bundle']).optional(),
            status: z.enum(['active', 'inactive', 'discontinued', 'draft', 'archived']).optional(),
            category: z.string().optional(),
            brand: z.string().optional(),
            supplier: z.string().optional(),
            minPrice: z.coerce.number().min(0).optional(),
            maxPrice: z.coerce.number().min(0).optional(),
            inStock: z.coerce.boolean().optional(),
            lowStock: z.coerce.boolean().optional()
        })
    }), productController.getProductsByOrganization.bind(productController));
    router.get('/organizations/:organizationId/search', validateRequest({
        params: z.object({
            organizationId: z.string().uuid()
        }),
        query: z.object({
            page: z.coerce.number().int().min(1).default(1),
            limit: z.coerce.number().int().min(1).max(100).default(20),
            sortBy: z.enum(['name', 'sku', 'category', 'brand', 'createdAt', 'updatedAt']).default('createdAt'),
            sortOrder: z.enum(['asc', 'desc']).default('desc'),
            search: z.string().max(200).optional(),
            type: z.enum(['physical', 'digital', 'service', 'subscription', 'bundle']).optional(),
            status: z.enum(['active', 'inactive', 'discontinued', 'draft', 'archived']).optional(),
            category: z.string().optional(),
            brand: z.string().optional(),
            supplier: z.string().optional(),
            minPrice: z.coerce.number().min(0).optional(),
            maxPrice: z.coerce.number().min(0).optional(),
            inStock: z.coerce.boolean().optional(),
            lowStock: z.coerce.boolean().optional()
        })
    }), productController.searchProducts.bind(productController));
    router.get('/organizations/:organizationId/stats', validateRequest({
        params: z.object({
            organizationId: z.string().uuid()
        })
    }), productController.getProductStats.bind(productController));
    router.get('/type/:type', validateRequest({
        params: z.object({
            type: z.enum(['physical', 'digital', 'service', 'subscription', 'bundle'])
        }),
        query: z.object({
            page: z.coerce.number().int().min(1).default(1),
            limit: z.coerce.number().int().min(1).max(100).default(20),
            sortBy: z.enum(['name', 'sku', 'category', 'brand', 'createdAt', 'updatedAt']).default('createdAt'),
            sortOrder: z.enum(['asc', 'desc']).default('desc')
        })
    }), async (req, res, next) => {
        try {
            const { type } = req.params;
            const products = await productController['productRepository'].findByType(type);
            res.status(200).json({
                success: true,
                data: products.map(product => ({
                    id: product.id.value,
                    name: product.name,
                    sku: product.sku,
                    type: product.type.value,
                    status: product.status.value,
                    category: product.category.value,
                    brand: product.brand?.value,
                    supplier: product.supplier?.value,
                    isActive: product.isActive,
                    createdAt: product.createdAt,
                    updatedAt: product.updatedAt
                }))
            });
        }
        catch (error) {
            next(error);
        }
    });
    router.get('/status/:status', validateRequest({
        params: z.object({
            status: z.enum(['active', 'inactive', 'discontinued', 'draft', 'archived'])
        }),
        query: z.object({
            page: z.coerce.number().int().min(1).default(1),
            limit: z.coerce.number().int().min(1).max(100).default(20),
            sortBy: z.enum(['name', 'sku', 'category', 'brand', 'createdAt', 'updatedAt']).default('createdAt'),
            sortOrder: z.enum(['asc', 'desc']).default('desc')
        })
    }), async (req, res, next) => {
        try {
            const { status } = req.params;
            const products = await productController['productRepository'].findByStatus(status);
            res.status(200).json({
                success: true,
                data: products.map(product => ({
                    id: product.id.value,
                    name: product.name,
                    sku: product.sku,
                    type: product.type.value,
                    status: product.status.value,
                    category: product.category.value,
                    brand: product.brand?.value,
                    supplier: product.supplier?.value,
                    isActive: product.isActive,
                    createdAt: product.createdAt,
                    updatedAt: product.updatedAt
                }))
            });
        }
        catch (error) {
            next(error);
        }
    });
    router.get('/category/:category', validateRequest({
        params: z.object({
            category: z.string().min(1).max(100)
        }),
        query: z.object({
            page: z.coerce.number().int().min(1).default(1),
            limit: z.coerce.number().int().min(1).max(100).default(20),
            sortBy: z.enum(['name', 'sku', 'category', 'brand', 'createdAt', 'updatedAt']).default('createdAt'),
            sortOrder: z.enum(['asc', 'desc']).default('desc')
        })
    }), async (req, res, next) => {
        try {
            const { category } = req.params;
            const products = await productController['productRepository'].findByCategory(category);
            res.status(200).json({
                success: true,
                data: products.map(product => ({
                    id: product.id.value,
                    name: product.name,
                    sku: product.sku,
                    type: product.type.value,
                    status: product.status.value,
                    category: product.category.value,
                    brand: product.brand?.value,
                    supplier: product.supplier?.value,
                    isActive: product.isActive,
                    createdAt: product.createdAt,
                    updatedAt: product.updatedAt
                }))
            });
        }
        catch (error) {
            next(error);
        }
    });
    router.get('/brand/:brand', validateRequest({
        params: z.object({
            brand: z.string().min(1).max(100)
        }),
        query: z.object({
            page: z.coerce.number().int().min(1).default(1),
            limit: z.coerce.number().int().min(1).max(100).default(20),
            sortBy: z.enum(['name', 'sku', 'category', 'brand', 'createdAt', 'updatedAt']).default('createdAt'),
            sortOrder: z.enum(['asc', 'desc']).default('desc')
        })
    }), async (req, res, next) => {
        try {
            const { brand } = req.params;
            const products = await productController['productRepository'].findByBrand(brand);
            res.status(200).json({
                success: true,
                data: products.map(product => ({
                    id: product.id.value,
                    name: product.name,
                    sku: product.sku,
                    type: product.type.value,
                    status: product.status.value,
                    category: product.category.value,
                    brand: product.brand?.value,
                    supplier: product.supplier?.value,
                    isActive: product.isActive,
                    createdAt: product.createdAt,
                    updatedAt: product.updatedAt
                }))
            });
        }
        catch (error) {
            next(error);
        }
    });
    router.get('/supplier/:supplier', validateRequest({
        params: z.object({
            supplier: z.string().min(1).max(100)
        }),
        query: z.object({
            page: z.coerce.number().int().min(1).default(1),
            limit: z.coerce.number().int().min(1).max(100).default(20),
            sortBy: z.enum(['name', 'sku', 'category', 'brand', 'createdAt', 'updatedAt']).default('createdAt'),
            sortOrder: z.enum(['asc', 'desc']).default('desc')
        })
    }), async (req, res, next) => {
        try {
            const { supplier } = req.params;
            const products = await productController['productRepository'].findBySupplier(supplier);
            res.status(200).json({
                success: true,
                data: products.map(product => ({
                    id: product.id.value,
                    name: product.name,
                    sku: product.sku,
                    type: product.type.value,
                    status: product.status.value,
                    category: product.category.value,
                    brand: product.brand?.value,
                    supplier: product.supplier?.value,
                    isActive: product.isActive,
                    createdAt: product.createdAt,
                    updatedAt: product.updatedAt
                }))
            });
        }
        catch (error) {
            next(error);
        }
    });
    router.get('/sku/:sku', validateRequest({
        params: z.object({
            sku: z.string().min(1).max(100)
        })
    }), async (req, res, next) => {
        try {
            const { sku } = req.params;
            const product = await productController['productRepository'].findBySku(sku);
            if (!product) {
                res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: {
                    id: product.id.value,
                    name: product.name,
                    sku: product.sku,
                    type: product.type.value,
                    status: product.status.value,
                    category: product.category.value,
                    brand: product.brand?.value,
                    supplier: product.supplier?.value,
                    isActive: product.isActive,
                    createdAt: product.createdAt,
                    updatedAt: product.updatedAt
                }
            });
        }
        catch (error) {
            next(error);
        }
    });
    router.get('/barcode/:barcode', validateRequest({
        params: z.object({
            barcode: z.string().min(1).max(100)
        })
    }), async (req, res, next) => {
        try {
            const { barcode } = req.params;
            const product = await productController['productRepository'].findByBarcode(barcode);
            if (!product) {
                res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: {
                    id: product.id.value,
                    name: product.name,
                    sku: product.sku,
                    barcode: product.barcode,
                    type: product.type.value,
                    status: product.status.value,
                    category: product.category.value,
                    brand: product.brand?.value,
                    supplier: product.supplier?.value,
                    isActive: product.isActive,
                    createdAt: product.createdAt,
                    updatedAt: product.updatedAt
                }
            });
        }
        catch (error) {
            next(error);
        }
    });
    router.get('/inventory/low-stock', validateRequest({
        query: z.object({
            organizationId: z.string().uuid(),
            threshold: z.coerce.number().int().min(0).optional()
        })
    }), async (req, res, next) => {
        try {
            const { organizationId, threshold } = req.query;
            const products = await productController['productRepository'].findByLowStock(organizationId, threshold);
            res.status(200).json({
                success: true,
                data: products.map(product => ({
                    id: product.id.value,
                    name: product.name,
                    sku: product.sku,
                    type: product.type.value,
                    status: product.status.value,
                    category: product.category.value,
                    brand: product.brand?.value,
                    supplier: product.supplier?.value,
                    isActive: product.isActive,
                    createdAt: product.createdAt,
                    updatedAt: product.updatedAt
                }))
            });
        }
        catch (error) {
            next(error);
        }
    });
    router.get('/inventory/out-of-stock', validateRequest({
        query: z.object({
            organizationId: z.string().uuid()
        })
    }), async (req, res, next) => {
        try {
            const { organizationId } = req.query;
            const products = await productController['productRepository'].findByOutOfStock(organizationId);
            res.status(200).json({
                success: true,
                data: products.map(product => ({
                    id: product.id.value,
                    name: product.name,
                    sku: product.sku,
                    type: product.type.value,
                    status: product.status.value,
                    category: product.category.value,
                    brand: product.brand?.value,
                    supplier: product.supplier?.value,
                    isActive: product.isActive,
                    createdAt: product.createdAt,
                    updatedAt: product.updatedAt
                }))
            });
        }
        catch (error) {
            next(error);
        }
    });
    router.get('/inventory/in-stock', validateRequest({
        query: z.object({
            organizationId: z.string().uuid()
        })
    }), async (req, res, next) => {
        try {
            const { organizationId } = req.query;
            const products = await productController['productRepository'].findByInStock(organizationId);
            res.status(200).json({
                success: true,
                data: products.map(product => ({
                    id: product.id.value,
                    name: product.name,
                    sku: product.sku,
                    type: product.type.value,
                    status: product.status.value,
                    category: product.category.value,
                    brand: product.brand?.value,
                    supplier: product.supplier?.value,
                    isActive: product.isActive,
                    createdAt: product.createdAt,
                    updatedAt: product.updatedAt
                }))
            });
        }
        catch (error) {
            next(error);
        }
    });
    router.put('/bulk-update', validateRequest({
        body: z.object({
            ids: z.array(z.string().uuid()).min(1),
            updates: z.object({
                status: z.enum(['active', 'inactive', 'discontinued', 'draft', 'archived']).optional(),
                category: z.string().optional(),
                brand: z.string().optional(),
                supplier: z.string().optional(),
                tags: z.array(z.string()).optional()
            })
        })
    }), productController.bulkUpdateProducts.bind(productController));
    router.delete('/bulk-delete', validateRequest({
        body: z.object({
            ids: z.array(z.string().uuid()).min(1)
        })
    }), productController.bulkDeleteProducts.bind(productController));
    return router;
};
//# sourceMappingURL=product.routes.js.map