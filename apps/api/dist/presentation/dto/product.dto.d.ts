import { z } from 'zod';
export declare const CreateProductRequestSchema: z.ZodObject<{
    organizationId: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    shortDescription: z.ZodOptional<z.ZodString>;
    sku: z.ZodString;
    barcode: z.ZodOptional<z.ZodString>;
    type: z.ZodEnum<["physical", "digital", "service", "subscription", "bundle"]>;
    status: z.ZodEnum<["active", "inactive", "discontinued", "draft", "archived"]>;
    category: z.ZodString;
    brand: z.ZodOptional<z.ZodString>;
    supplier: z.ZodOptional<z.ZodString>;
    settings: z.ZodObject<{
        inventory: z.ZodObject<{
            trackInventory: z.ZodDefault<z.ZodBoolean>;
            lowStockThreshold: z.ZodDefault<z.ZodNumber>;
            allowBackorder: z.ZodDefault<z.ZodBoolean>;
            allowPreorder: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            trackInventory?: boolean;
            lowStockThreshold?: number;
            allowBackorder?: boolean;
            allowPreorder?: boolean;
        }, {
            trackInventory?: boolean;
            lowStockThreshold?: number;
            allowBackorder?: boolean;
            allowPreorder?: boolean;
        }>;
        pricing: z.ZodObject<{
            costPrice: z.ZodOptional<z.ZodObject<{
                amount: z.ZodNumber;
                currency: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                amount?: number;
                currency?: string;
            }, {
                amount?: number;
                currency?: string;
            }>>;
            sellingPrice: z.ZodObject<{
                amount: z.ZodNumber;
                currency: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                amount?: number;
                currency?: string;
            }, {
                amount?: number;
                currency?: string;
            }>;
            compareAtPrice: z.ZodOptional<z.ZodObject<{
                amount: z.ZodNumber;
                currency: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                amount?: number;
                currency?: string;
            }, {
                amount?: number;
                currency?: string;
            }>>;
            margin: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            compareAtPrice?: {
                amount?: number;
                currency?: string;
            };
            costPrice?: {
                amount?: number;
                currency?: string;
            };
            sellingPrice?: {
                amount?: number;
                currency?: string;
            };
            margin?: number;
        }, {
            compareAtPrice?: {
                amount?: number;
                currency?: string;
            };
            costPrice?: {
                amount?: number;
                currency?: string;
            };
            sellingPrice?: {
                amount?: number;
                currency?: string;
            };
            margin?: number;
        }>;
        shipping: z.ZodObject<{
            weight: z.ZodOptional<z.ZodNumber>;
            dimensions: z.ZodOptional<z.ZodObject<{
                length: z.ZodNumber;
                width: z.ZodNumber;
                height: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                length?: number;
                width?: number;
                height?: number;
            }, {
                length?: number;
                width?: number;
                height?: number;
            }>>;
            requiresShipping: z.ZodDefault<z.ZodBoolean>;
            freeShipping: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            weight?: number;
            dimensions?: {
                length?: number;
                width?: number;
                height?: number;
            };
            requiresShipping?: boolean;
            freeShipping?: boolean;
        }, {
            weight?: number;
            dimensions?: {
                length?: number;
                width?: number;
                height?: number;
            };
            requiresShipping?: boolean;
            freeShipping?: boolean;
        }>;
        seo: z.ZodObject<{
            metaTitle: z.ZodOptional<z.ZodString>;
            metaDescription: z.ZodOptional<z.ZodString>;
            slug: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            slug?: string;
            metaTitle?: string;
            metaDescription?: string;
        }, {
            slug?: string;
            metaTitle?: string;
            metaDescription?: string;
        }>;
        customFields: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
        tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        notes: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        tags?: string[];
        notes?: string;
        customFields?: Record<string, any>;
        inventory?: {
            trackInventory?: boolean;
            lowStockThreshold?: number;
            allowBackorder?: boolean;
            allowPreorder?: boolean;
        };
        shipping?: {
            weight?: number;
            dimensions?: {
                length?: number;
                width?: number;
                height?: number;
            };
            requiresShipping?: boolean;
            freeShipping?: boolean;
        };
        pricing?: {
            compareAtPrice?: {
                amount?: number;
                currency?: string;
            };
            costPrice?: {
                amount?: number;
                currency?: string;
            };
            sellingPrice?: {
                amount?: number;
                currency?: string;
            };
            margin?: number;
        };
        seo?: {
            slug?: string;
            metaTitle?: string;
            metaDescription?: string;
        };
    }, {
        tags?: string[];
        notes?: string;
        customFields?: Record<string, any>;
        inventory?: {
            trackInventory?: boolean;
            lowStockThreshold?: number;
            allowBackorder?: boolean;
            allowPreorder?: boolean;
        };
        shipping?: {
            weight?: number;
            dimensions?: {
                length?: number;
                width?: number;
                height?: number;
            };
            requiresShipping?: boolean;
            freeShipping?: boolean;
        };
        pricing?: {
            compareAtPrice?: {
                amount?: number;
                currency?: string;
            };
            costPrice?: {
                amount?: number;
                currency?: string;
            };
            sellingPrice?: {
                amount?: number;
                currency?: string;
            };
            margin?: number;
        };
        seo?: {
            slug?: string;
            metaTitle?: string;
            metaDescription?: string;
        };
    }>;
    images: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    documents: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    specifications: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    variants: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        sku: z.ZodString;
        price: z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            amount?: number;
            currency?: string;
        }, {
            amount?: number;
            currency?: string;
        }>;
        compareAtPrice: z.ZodOptional<z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            amount?: number;
            currency?: string;
        }, {
            amount?: number;
            currency?: string;
        }>>;
        costPrice: z.ZodOptional<z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            amount?: number;
            currency?: string;
        }, {
            amount?: number;
            currency?: string;
        }>>;
        inventory: z.ZodObject<{
            quantity: z.ZodNumber;
            reserved: z.ZodNumber;
            available: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            quantity?: number;
            available?: number;
            reserved?: number;
        }, {
            quantity?: number;
            available?: number;
            reserved?: number;
        }>;
        attributes: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
        isActive: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        name?: string;
        isActive?: boolean;
        sku?: string;
        price?: {
            amount?: number;
            currency?: string;
        };
        compareAtPrice?: {
            amount?: number;
            currency?: string;
        };
        costPrice?: {
            amount?: number;
            currency?: string;
        };
        inventory?: {
            quantity?: number;
            available?: number;
            reserved?: number;
        };
        attributes?: Record<string, any>;
    }, {
        name?: string;
        isActive?: boolean;
        sku?: string;
        price?: {
            amount?: number;
            currency?: string;
        };
        compareAtPrice?: {
            amount?: number;
            currency?: string;
        };
        costPrice?: {
            amount?: number;
            currency?: string;
        };
        inventory?: {
            quantity?: number;
            available?: number;
            reserved?: number;
        };
        attributes?: Record<string, any>;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    type?: "service" | "physical" | "digital" | "subscription" | "bundle";
    status?: "active" | "inactive" | "archived" | "draft" | "discontinued";
    organizationId?: string;
    name?: string;
    images?: string[];
    documents?: string[];
    description?: string;
    category?: string;
    brand?: string;
    settings?: {
        tags?: string[];
        notes?: string;
        customFields?: Record<string, any>;
        inventory?: {
            trackInventory?: boolean;
            lowStockThreshold?: number;
            allowBackorder?: boolean;
            allowPreorder?: boolean;
        };
        shipping?: {
            weight?: number;
            dimensions?: {
                length?: number;
                width?: number;
                height?: number;
            };
            requiresShipping?: boolean;
            freeShipping?: boolean;
        };
        pricing?: {
            compareAtPrice?: {
                amount?: number;
                currency?: string;
            };
            costPrice?: {
                amount?: number;
                currency?: string;
            };
            sellingPrice?: {
                amount?: number;
                currency?: string;
            };
            margin?: number;
        };
        seo?: {
            slug?: string;
            metaTitle?: string;
            metaDescription?: string;
        };
    };
    sku?: string;
    supplier?: string;
    barcode?: string;
    shortDescription?: string;
    specifications?: Record<string, any>;
    variants?: {
        name?: string;
        isActive?: boolean;
        sku?: string;
        price?: {
            amount?: number;
            currency?: string;
        };
        compareAtPrice?: {
            amount?: number;
            currency?: string;
        };
        costPrice?: {
            amount?: number;
            currency?: string;
        };
        inventory?: {
            quantity?: number;
            available?: number;
            reserved?: number;
        };
        attributes?: Record<string, any>;
    }[];
}, {
    type?: "service" | "physical" | "digital" | "subscription" | "bundle";
    status?: "active" | "inactive" | "archived" | "draft" | "discontinued";
    organizationId?: string;
    name?: string;
    images?: string[];
    documents?: string[];
    description?: string;
    category?: string;
    brand?: string;
    settings?: {
        tags?: string[];
        notes?: string;
        customFields?: Record<string, any>;
        inventory?: {
            trackInventory?: boolean;
            lowStockThreshold?: number;
            allowBackorder?: boolean;
            allowPreorder?: boolean;
        };
        shipping?: {
            weight?: number;
            dimensions?: {
                length?: number;
                width?: number;
                height?: number;
            };
            requiresShipping?: boolean;
            freeShipping?: boolean;
        };
        pricing?: {
            compareAtPrice?: {
                amount?: number;
                currency?: string;
            };
            costPrice?: {
                amount?: number;
                currency?: string;
            };
            sellingPrice?: {
                amount?: number;
                currency?: string;
            };
            margin?: number;
        };
        seo?: {
            slug?: string;
            metaTitle?: string;
            metaDescription?: string;
        };
    };
    sku?: string;
    supplier?: string;
    barcode?: string;
    shortDescription?: string;
    specifications?: Record<string, any>;
    variants?: {
        name?: string;
        isActive?: boolean;
        sku?: string;
        price?: {
            amount?: number;
            currency?: string;
        };
        compareAtPrice?: {
            amount?: number;
            currency?: string;
        };
        costPrice?: {
            amount?: number;
            currency?: string;
        };
        inventory?: {
            quantity?: number;
            available?: number;
            reserved?: number;
        };
        attributes?: Record<string, any>;
    }[];
}>;
export declare const UpdateProductRequestSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    shortDescription: z.ZodOptional<z.ZodString>;
    sku: z.ZodOptional<z.ZodString>;
    barcode: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<["physical", "digital", "service", "subscription", "bundle"]>>;
    status: z.ZodOptional<z.ZodEnum<["active", "inactive", "discontinued", "draft", "archived"]>>;
    category: z.ZodOptional<z.ZodString>;
    brand: z.ZodOptional<z.ZodString>;
    supplier: z.ZodOptional<z.ZodString>;
    settings: z.ZodOptional<z.ZodObject<{
        inventory: z.ZodOptional<z.ZodObject<{
            trackInventory: z.ZodOptional<z.ZodBoolean>;
            lowStockThreshold: z.ZodOptional<z.ZodNumber>;
            allowBackorder: z.ZodOptional<z.ZodBoolean>;
            allowPreorder: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            trackInventory?: boolean;
            lowStockThreshold?: number;
            allowBackorder?: boolean;
            allowPreorder?: boolean;
        }, {
            trackInventory?: boolean;
            lowStockThreshold?: number;
            allowBackorder?: boolean;
            allowPreorder?: boolean;
        }>>;
        pricing: z.ZodOptional<z.ZodObject<{
            costPrice: z.ZodOptional<z.ZodObject<{
                amount: z.ZodNumber;
                currency: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                amount?: number;
                currency?: string;
            }, {
                amount?: number;
                currency?: string;
            }>>;
            sellingPrice: z.ZodOptional<z.ZodObject<{
                amount: z.ZodNumber;
                currency: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                amount?: number;
                currency?: string;
            }, {
                amount?: number;
                currency?: string;
            }>>;
            compareAtPrice: z.ZodOptional<z.ZodObject<{
                amount: z.ZodNumber;
                currency: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                amount?: number;
                currency?: string;
            }, {
                amount?: number;
                currency?: string;
            }>>;
            margin: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            compareAtPrice?: {
                amount?: number;
                currency?: string;
            };
            costPrice?: {
                amount?: number;
                currency?: string;
            };
            sellingPrice?: {
                amount?: number;
                currency?: string;
            };
            margin?: number;
        }, {
            compareAtPrice?: {
                amount?: number;
                currency?: string;
            };
            costPrice?: {
                amount?: number;
                currency?: string;
            };
            sellingPrice?: {
                amount?: number;
                currency?: string;
            };
            margin?: number;
        }>>;
        shipping: z.ZodOptional<z.ZodObject<{
            weight: z.ZodOptional<z.ZodNumber>;
            dimensions: z.ZodOptional<z.ZodObject<{
                length: z.ZodNumber;
                width: z.ZodNumber;
                height: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                length?: number;
                width?: number;
                height?: number;
            }, {
                length?: number;
                width?: number;
                height?: number;
            }>>;
            requiresShipping: z.ZodOptional<z.ZodBoolean>;
            freeShipping: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            weight?: number;
            dimensions?: {
                length?: number;
                width?: number;
                height?: number;
            };
            requiresShipping?: boolean;
            freeShipping?: boolean;
        }, {
            weight?: number;
            dimensions?: {
                length?: number;
                width?: number;
                height?: number;
            };
            requiresShipping?: boolean;
            freeShipping?: boolean;
        }>>;
        seo: z.ZodOptional<z.ZodObject<{
            metaTitle: z.ZodOptional<z.ZodString>;
            metaDescription: z.ZodOptional<z.ZodString>;
            slug: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            slug?: string;
            metaTitle?: string;
            metaDescription?: string;
        }, {
            slug?: string;
            metaTitle?: string;
            metaDescription?: string;
        }>>;
        customFields: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        notes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        tags?: string[];
        notes?: string;
        customFields?: Record<string, any>;
        inventory?: {
            trackInventory?: boolean;
            lowStockThreshold?: number;
            allowBackorder?: boolean;
            allowPreorder?: boolean;
        };
        shipping?: {
            weight?: number;
            dimensions?: {
                length?: number;
                width?: number;
                height?: number;
            };
            requiresShipping?: boolean;
            freeShipping?: boolean;
        };
        pricing?: {
            compareAtPrice?: {
                amount?: number;
                currency?: string;
            };
            costPrice?: {
                amount?: number;
                currency?: string;
            };
            sellingPrice?: {
                amount?: number;
                currency?: string;
            };
            margin?: number;
        };
        seo?: {
            slug?: string;
            metaTitle?: string;
            metaDescription?: string;
        };
    }, {
        tags?: string[];
        notes?: string;
        customFields?: Record<string, any>;
        inventory?: {
            trackInventory?: boolean;
            lowStockThreshold?: number;
            allowBackorder?: boolean;
            allowPreorder?: boolean;
        };
        shipping?: {
            weight?: number;
            dimensions?: {
                length?: number;
                width?: number;
                height?: number;
            };
            requiresShipping?: boolean;
            freeShipping?: boolean;
        };
        pricing?: {
            compareAtPrice?: {
                amount?: number;
                currency?: string;
            };
            costPrice?: {
                amount?: number;
                currency?: string;
            };
            sellingPrice?: {
                amount?: number;
                currency?: string;
            };
            margin?: number;
        };
        seo?: {
            slug?: string;
            metaTitle?: string;
            metaDescription?: string;
        };
    }>>;
    images: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    documents: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    specifications: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    variants: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        name: z.ZodString;
        sku: z.ZodString;
        price: z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            amount?: number;
            currency?: string;
        }, {
            amount?: number;
            currency?: string;
        }>;
        compareAtPrice: z.ZodOptional<z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            amount?: number;
            currency?: string;
        }, {
            amount?: number;
            currency?: string;
        }>>;
        costPrice: z.ZodOptional<z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            amount?: number;
            currency?: string;
        }, {
            amount?: number;
            currency?: string;
        }>>;
        inventory: z.ZodObject<{
            quantity: z.ZodNumber;
            reserved: z.ZodNumber;
            available: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            quantity?: number;
            available?: number;
            reserved?: number;
        }, {
            quantity?: number;
            available?: number;
            reserved?: number;
        }>;
        attributes: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
        isActive: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        name?: string;
        id?: string;
        isActive?: boolean;
        sku?: string;
        price?: {
            amount?: number;
            currency?: string;
        };
        compareAtPrice?: {
            amount?: number;
            currency?: string;
        };
        costPrice?: {
            amount?: number;
            currency?: string;
        };
        inventory?: {
            quantity?: number;
            available?: number;
            reserved?: number;
        };
        attributes?: Record<string, any>;
    }, {
        name?: string;
        id?: string;
        isActive?: boolean;
        sku?: string;
        price?: {
            amount?: number;
            currency?: string;
        };
        compareAtPrice?: {
            amount?: number;
            currency?: string;
        };
        costPrice?: {
            amount?: number;
            currency?: string;
        };
        inventory?: {
            quantity?: number;
            available?: number;
            reserved?: number;
        };
        attributes?: Record<string, any>;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    type?: "service" | "physical" | "digital" | "subscription" | "bundle";
    status?: "active" | "inactive" | "archived" | "draft" | "discontinued";
    name?: string;
    images?: string[];
    documents?: string[];
    description?: string;
    category?: string;
    brand?: string;
    settings?: {
        tags?: string[];
        notes?: string;
        customFields?: Record<string, any>;
        inventory?: {
            trackInventory?: boolean;
            lowStockThreshold?: number;
            allowBackorder?: boolean;
            allowPreorder?: boolean;
        };
        shipping?: {
            weight?: number;
            dimensions?: {
                length?: number;
                width?: number;
                height?: number;
            };
            requiresShipping?: boolean;
            freeShipping?: boolean;
        };
        pricing?: {
            compareAtPrice?: {
                amount?: number;
                currency?: string;
            };
            costPrice?: {
                amount?: number;
                currency?: string;
            };
            sellingPrice?: {
                amount?: number;
                currency?: string;
            };
            margin?: number;
        };
        seo?: {
            slug?: string;
            metaTitle?: string;
            metaDescription?: string;
        };
    };
    sku?: string;
    supplier?: string;
    barcode?: string;
    shortDescription?: string;
    specifications?: Record<string, any>;
    variants?: {
        name?: string;
        id?: string;
        isActive?: boolean;
        sku?: string;
        price?: {
            amount?: number;
            currency?: string;
        };
        compareAtPrice?: {
            amount?: number;
            currency?: string;
        };
        costPrice?: {
            amount?: number;
            currency?: string;
        };
        inventory?: {
            quantity?: number;
            available?: number;
            reserved?: number;
        };
        attributes?: Record<string, any>;
    }[];
}, {
    type?: "service" | "physical" | "digital" | "subscription" | "bundle";
    status?: "active" | "inactive" | "archived" | "draft" | "discontinued";
    name?: string;
    images?: string[];
    documents?: string[];
    description?: string;
    category?: string;
    brand?: string;
    settings?: {
        tags?: string[];
        notes?: string;
        customFields?: Record<string, any>;
        inventory?: {
            trackInventory?: boolean;
            lowStockThreshold?: number;
            allowBackorder?: boolean;
            allowPreorder?: boolean;
        };
        shipping?: {
            weight?: number;
            dimensions?: {
                length?: number;
                width?: number;
                height?: number;
            };
            requiresShipping?: boolean;
            freeShipping?: boolean;
        };
        pricing?: {
            compareAtPrice?: {
                amount?: number;
                currency?: string;
            };
            costPrice?: {
                amount?: number;
                currency?: string;
            };
            sellingPrice?: {
                amount?: number;
                currency?: string;
            };
            margin?: number;
        };
        seo?: {
            slug?: string;
            metaTitle?: string;
            metaDescription?: string;
        };
    };
    sku?: string;
    supplier?: string;
    barcode?: string;
    shortDescription?: string;
    specifications?: Record<string, any>;
    variants?: {
        name?: string;
        id?: string;
        isActive?: boolean;
        sku?: string;
        price?: {
            amount?: number;
            currency?: string;
        };
        compareAtPrice?: {
            amount?: number;
            currency?: string;
        };
        costPrice?: {
            amount?: number;
            currency?: string;
        };
        inventory?: {
            quantity?: number;
            available?: number;
            reserved?: number;
        };
        attributes?: Record<string, any>;
    }[];
}>;
export declare const ProductIdParamSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id?: string;
}, {
    id?: string;
}>;
export declare const ProductOrganizationIdParamSchema: z.ZodObject<{
    organizationId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    organizationId?: string;
}, {
    organizationId?: string;
}>;
export declare const ProductSearchQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sortBy: z.ZodDefault<z.ZodEnum<["name", "sku", "category", "brand", "createdAt", "updatedAt"]>>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
    search: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<["physical", "digital", "service", "subscription", "bundle"]>>;
    status: z.ZodOptional<z.ZodEnum<["active", "inactive", "discontinued", "draft", "archived"]>>;
    category: z.ZodOptional<z.ZodString>;
    brand: z.ZodOptional<z.ZodString>;
    supplier: z.ZodOptional<z.ZodString>;
    minPrice: z.ZodOptional<z.ZodNumber>;
    maxPrice: z.ZodOptional<z.ZodNumber>;
    inStock: z.ZodOptional<z.ZodBoolean>;
    lowStock: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    type?: "service" | "physical" | "digital" | "subscription" | "bundle";
    status?: "active" | "inactive" | "archived" | "draft" | "discontinued";
    page?: number;
    limit?: number;
    category?: string;
    brand?: string;
    search?: string;
    supplier?: string;
    lowStock?: boolean;
    sortBy?: "name" | "createdAt" | "updatedAt" | "category" | "brand" | "sku";
    sortOrder?: "asc" | "desc";
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
}, {
    type?: "service" | "physical" | "digital" | "subscription" | "bundle";
    status?: "active" | "inactive" | "archived" | "draft" | "discontinued";
    page?: number;
    limit?: number;
    category?: string;
    brand?: string;
    search?: string;
    supplier?: string;
    lowStock?: boolean;
    sortBy?: "name" | "createdAt" | "updatedAt" | "category" | "brand" | "sku";
    sortOrder?: "asc" | "desc";
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
}>;
export declare const ProductBulkUpdateSchema: z.ZodObject<{
    ids: z.ZodArray<z.ZodString, "many">;
    updates: z.ZodObject<{
        status: z.ZodOptional<z.ZodEnum<["active", "inactive", "discontinued", "draft", "archived"]>>;
        category: z.ZodOptional<z.ZodString>;
        brand: z.ZodOptional<z.ZodString>;
        supplier: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        status?: "active" | "inactive" | "archived" | "draft" | "discontinued";
        tags?: string[];
        category?: string;
        brand?: string;
        supplier?: string;
    }, {
        status?: "active" | "inactive" | "archived" | "draft" | "discontinued";
        tags?: string[];
        category?: string;
        brand?: string;
        supplier?: string;
    }>;
}, "strip", z.ZodTypeAny, {
    updates?: {
        status?: "active" | "inactive" | "archived" | "draft" | "discontinued";
        tags?: string[];
        category?: string;
        brand?: string;
        supplier?: string;
    };
    ids?: string[];
}, {
    updates?: {
        status?: "active" | "inactive" | "archived" | "draft" | "discontinued";
        tags?: string[];
        category?: string;
        brand?: string;
        supplier?: string;
    };
    ids?: string[];
}>;
export declare const ProductBulkDeleteSchema: z.ZodObject<{
    ids: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    ids?: string[];
}, {
    ids?: string[];
}>;
export declare const ProductResponseSchema: z.ZodObject<{
    id: z.ZodString;
    organizationId: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    shortDescription: z.ZodOptional<z.ZodString>;
    sku: z.ZodString;
    barcode: z.ZodOptional<z.ZodString>;
    type: z.ZodEnum<["physical", "digital", "service", "subscription", "bundle"]>;
    status: z.ZodEnum<["active", "inactive", "discontinued", "draft", "archived"]>;
    category: z.ZodString;
    brand: z.ZodOptional<z.ZodString>;
    supplier: z.ZodOptional<z.ZodString>;
    settings: z.ZodObject<{
        inventory: z.ZodObject<{
            trackInventory: z.ZodBoolean;
            lowStockThreshold: z.ZodNumber;
            allowBackorder: z.ZodBoolean;
            allowPreorder: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            trackInventory?: boolean;
            lowStockThreshold?: number;
            allowBackorder?: boolean;
            allowPreorder?: boolean;
        }, {
            trackInventory?: boolean;
            lowStockThreshold?: number;
            allowBackorder?: boolean;
            allowPreorder?: boolean;
        }>;
        pricing: z.ZodObject<{
            costPrice: z.ZodOptional<z.ZodObject<{
                amount: z.ZodNumber;
                currency: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                amount?: number;
                currency?: string;
            }, {
                amount?: number;
                currency?: string;
            }>>;
            sellingPrice: z.ZodObject<{
                amount: z.ZodNumber;
                currency: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                amount?: number;
                currency?: string;
            }, {
                amount?: number;
                currency?: string;
            }>;
            compareAtPrice: z.ZodOptional<z.ZodObject<{
                amount: z.ZodNumber;
                currency: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                amount?: number;
                currency?: string;
            }, {
                amount?: number;
                currency?: string;
            }>>;
            margin: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            compareAtPrice?: {
                amount?: number;
                currency?: string;
            };
            costPrice?: {
                amount?: number;
                currency?: string;
            };
            sellingPrice?: {
                amount?: number;
                currency?: string;
            };
            margin?: number;
        }, {
            compareAtPrice?: {
                amount?: number;
                currency?: string;
            };
            costPrice?: {
                amount?: number;
                currency?: string;
            };
            sellingPrice?: {
                amount?: number;
                currency?: string;
            };
            margin?: number;
        }>;
        shipping: z.ZodObject<{
            weight: z.ZodOptional<z.ZodNumber>;
            dimensions: z.ZodOptional<z.ZodObject<{
                length: z.ZodNumber;
                width: z.ZodNumber;
                height: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                length?: number;
                width?: number;
                height?: number;
            }, {
                length?: number;
                width?: number;
                height?: number;
            }>>;
            requiresShipping: z.ZodBoolean;
            freeShipping: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            weight?: number;
            dimensions?: {
                length?: number;
                width?: number;
                height?: number;
            };
            requiresShipping?: boolean;
            freeShipping?: boolean;
        }, {
            weight?: number;
            dimensions?: {
                length?: number;
                width?: number;
                height?: number;
            };
            requiresShipping?: boolean;
            freeShipping?: boolean;
        }>;
        seo: z.ZodObject<{
            metaTitle: z.ZodOptional<z.ZodString>;
            metaDescription: z.ZodOptional<z.ZodString>;
            slug: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            slug?: string;
            metaTitle?: string;
            metaDescription?: string;
        }, {
            slug?: string;
            metaTitle?: string;
            metaDescription?: string;
        }>;
        customFields: z.ZodRecord<z.ZodString, z.ZodAny>;
        tags: z.ZodArray<z.ZodString, "many">;
        notes: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        tags?: string[];
        notes?: string;
        customFields?: Record<string, any>;
        inventory?: {
            trackInventory?: boolean;
            lowStockThreshold?: number;
            allowBackorder?: boolean;
            allowPreorder?: boolean;
        };
        shipping?: {
            weight?: number;
            dimensions?: {
                length?: number;
                width?: number;
                height?: number;
            };
            requiresShipping?: boolean;
            freeShipping?: boolean;
        };
        pricing?: {
            compareAtPrice?: {
                amount?: number;
                currency?: string;
            };
            costPrice?: {
                amount?: number;
                currency?: string;
            };
            sellingPrice?: {
                amount?: number;
                currency?: string;
            };
            margin?: number;
        };
        seo?: {
            slug?: string;
            metaTitle?: string;
            metaDescription?: string;
        };
    }, {
        tags?: string[];
        notes?: string;
        customFields?: Record<string, any>;
        inventory?: {
            trackInventory?: boolean;
            lowStockThreshold?: number;
            allowBackorder?: boolean;
            allowPreorder?: boolean;
        };
        shipping?: {
            weight?: number;
            dimensions?: {
                length?: number;
                width?: number;
                height?: number;
            };
            requiresShipping?: boolean;
            freeShipping?: boolean;
        };
        pricing?: {
            compareAtPrice?: {
                amount?: number;
                currency?: string;
            };
            costPrice?: {
                amount?: number;
                currency?: string;
            };
            sellingPrice?: {
                amount?: number;
                currency?: string;
            };
            margin?: number;
        };
        seo?: {
            slug?: string;
            metaTitle?: string;
            metaDescription?: string;
        };
    }>;
    images: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    documents: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    specifications: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    variants: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        sku: z.ZodString;
        price: z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            amount?: number;
            currency?: string;
        }, {
            amount?: number;
            currency?: string;
        }>;
        compareAtPrice: z.ZodOptional<z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            amount?: number;
            currency?: string;
        }, {
            amount?: number;
            currency?: string;
        }>>;
        costPrice: z.ZodOptional<z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            amount?: number;
            currency?: string;
        }, {
            amount?: number;
            currency?: string;
        }>>;
        inventory: z.ZodObject<{
            quantity: z.ZodNumber;
            reserved: z.ZodNumber;
            available: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            quantity?: number;
            available?: number;
            reserved?: number;
        }, {
            quantity?: number;
            available?: number;
            reserved?: number;
        }>;
        attributes: z.ZodRecord<z.ZodString, z.ZodAny>;
        isActive: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        name?: string;
        id?: string;
        isActive?: boolean;
        sku?: string;
        price?: {
            amount?: number;
            currency?: string;
        };
        compareAtPrice?: {
            amount?: number;
            currency?: string;
        };
        costPrice?: {
            amount?: number;
            currency?: string;
        };
        inventory?: {
            quantity?: number;
            available?: number;
            reserved?: number;
        };
        attributes?: Record<string, any>;
    }, {
        name?: string;
        id?: string;
        isActive?: boolean;
        sku?: string;
        price?: {
            amount?: number;
            currency?: string;
        };
        compareAtPrice?: {
            amount?: number;
            currency?: string;
        };
        costPrice?: {
            amount?: number;
            currency?: string;
        };
        inventory?: {
            quantity?: number;
            available?: number;
            reserved?: number;
        };
        attributes?: Record<string, any>;
    }>, "many">>;
    isActive: z.ZodBoolean;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    type?: "service" | "physical" | "digital" | "subscription" | "bundle";
    status?: "active" | "inactive" | "archived" | "draft" | "discontinued";
    organizationId?: string;
    name?: string;
    images?: string[];
    documents?: string[];
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    description?: string;
    category?: string;
    isActive?: boolean;
    brand?: string;
    settings?: {
        tags?: string[];
        notes?: string;
        customFields?: Record<string, any>;
        inventory?: {
            trackInventory?: boolean;
            lowStockThreshold?: number;
            allowBackorder?: boolean;
            allowPreorder?: boolean;
        };
        shipping?: {
            weight?: number;
            dimensions?: {
                length?: number;
                width?: number;
                height?: number;
            };
            requiresShipping?: boolean;
            freeShipping?: boolean;
        };
        pricing?: {
            compareAtPrice?: {
                amount?: number;
                currency?: string;
            };
            costPrice?: {
                amount?: number;
                currency?: string;
            };
            sellingPrice?: {
                amount?: number;
                currency?: string;
            };
            margin?: number;
        };
        seo?: {
            slug?: string;
            metaTitle?: string;
            metaDescription?: string;
        };
    };
    sku?: string;
    supplier?: string;
    barcode?: string;
    shortDescription?: string;
    specifications?: Record<string, any>;
    variants?: {
        name?: string;
        id?: string;
        isActive?: boolean;
        sku?: string;
        price?: {
            amount?: number;
            currency?: string;
        };
        compareAtPrice?: {
            amount?: number;
            currency?: string;
        };
        costPrice?: {
            amount?: number;
            currency?: string;
        };
        inventory?: {
            quantity?: number;
            available?: number;
            reserved?: number;
        };
        attributes?: Record<string, any>;
    }[];
}, {
    type?: "service" | "physical" | "digital" | "subscription" | "bundle";
    status?: "active" | "inactive" | "archived" | "draft" | "discontinued";
    organizationId?: string;
    name?: string;
    images?: string[];
    documents?: string[];
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    description?: string;
    category?: string;
    isActive?: boolean;
    brand?: string;
    settings?: {
        tags?: string[];
        notes?: string;
        customFields?: Record<string, any>;
        inventory?: {
            trackInventory?: boolean;
            lowStockThreshold?: number;
            allowBackorder?: boolean;
            allowPreorder?: boolean;
        };
        shipping?: {
            weight?: number;
            dimensions?: {
                length?: number;
                width?: number;
                height?: number;
            };
            requiresShipping?: boolean;
            freeShipping?: boolean;
        };
        pricing?: {
            compareAtPrice?: {
                amount?: number;
                currency?: string;
            };
            costPrice?: {
                amount?: number;
                currency?: string;
            };
            sellingPrice?: {
                amount?: number;
                currency?: string;
            };
            margin?: number;
        };
        seo?: {
            slug?: string;
            metaTitle?: string;
            metaDescription?: string;
        };
    };
    sku?: string;
    supplier?: string;
    barcode?: string;
    shortDescription?: string;
    specifications?: Record<string, any>;
    variants?: {
        name?: string;
        id?: string;
        isActive?: boolean;
        sku?: string;
        price?: {
            amount?: number;
            currency?: string;
        };
        compareAtPrice?: {
            amount?: number;
            currency?: string;
        };
        costPrice?: {
            amount?: number;
            currency?: string;
        };
        inventory?: {
            quantity?: number;
            available?: number;
            reserved?: number;
        };
        attributes?: Record<string, any>;
    }[];
}>;
export declare const ProductListResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        organizationId: z.ZodString;
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        shortDescription: z.ZodOptional<z.ZodString>;
        sku: z.ZodString;
        barcode: z.ZodOptional<z.ZodString>;
        type: z.ZodEnum<["physical", "digital", "service", "subscription", "bundle"]>;
        status: z.ZodEnum<["active", "inactive", "discontinued", "draft", "archived"]>;
        category: z.ZodString;
        brand: z.ZodOptional<z.ZodString>;
        supplier: z.ZodOptional<z.ZodString>;
        settings: z.ZodObject<{
            inventory: z.ZodObject<{
                trackInventory: z.ZodBoolean;
                lowStockThreshold: z.ZodNumber;
                allowBackorder: z.ZodBoolean;
                allowPreorder: z.ZodBoolean;
            }, "strip", z.ZodTypeAny, {
                trackInventory?: boolean;
                lowStockThreshold?: number;
                allowBackorder?: boolean;
                allowPreorder?: boolean;
            }, {
                trackInventory?: boolean;
                lowStockThreshold?: number;
                allowBackorder?: boolean;
                allowPreorder?: boolean;
            }>;
            pricing: z.ZodObject<{
                costPrice: z.ZodOptional<z.ZodObject<{
                    amount: z.ZodNumber;
                    currency: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    amount?: number;
                    currency?: string;
                }, {
                    amount?: number;
                    currency?: string;
                }>>;
                sellingPrice: z.ZodObject<{
                    amount: z.ZodNumber;
                    currency: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    amount?: number;
                    currency?: string;
                }, {
                    amount?: number;
                    currency?: string;
                }>;
                compareAtPrice: z.ZodOptional<z.ZodObject<{
                    amount: z.ZodNumber;
                    currency: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    amount?: number;
                    currency?: string;
                }, {
                    amount?: number;
                    currency?: string;
                }>>;
                margin: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                compareAtPrice?: {
                    amount?: number;
                    currency?: string;
                };
                costPrice?: {
                    amount?: number;
                    currency?: string;
                };
                sellingPrice?: {
                    amount?: number;
                    currency?: string;
                };
                margin?: number;
            }, {
                compareAtPrice?: {
                    amount?: number;
                    currency?: string;
                };
                costPrice?: {
                    amount?: number;
                    currency?: string;
                };
                sellingPrice?: {
                    amount?: number;
                    currency?: string;
                };
                margin?: number;
            }>;
            shipping: z.ZodObject<{
                weight: z.ZodOptional<z.ZodNumber>;
                dimensions: z.ZodOptional<z.ZodObject<{
                    length: z.ZodNumber;
                    width: z.ZodNumber;
                    height: z.ZodNumber;
                }, "strip", z.ZodTypeAny, {
                    length?: number;
                    width?: number;
                    height?: number;
                }, {
                    length?: number;
                    width?: number;
                    height?: number;
                }>>;
                requiresShipping: z.ZodBoolean;
                freeShipping: z.ZodBoolean;
            }, "strip", z.ZodTypeAny, {
                weight?: number;
                dimensions?: {
                    length?: number;
                    width?: number;
                    height?: number;
                };
                requiresShipping?: boolean;
                freeShipping?: boolean;
            }, {
                weight?: number;
                dimensions?: {
                    length?: number;
                    width?: number;
                    height?: number;
                };
                requiresShipping?: boolean;
                freeShipping?: boolean;
            }>;
            seo: z.ZodObject<{
                metaTitle: z.ZodOptional<z.ZodString>;
                metaDescription: z.ZodOptional<z.ZodString>;
                slug: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                slug?: string;
                metaTitle?: string;
                metaDescription?: string;
            }, {
                slug?: string;
                metaTitle?: string;
                metaDescription?: string;
            }>;
            customFields: z.ZodRecord<z.ZodString, z.ZodAny>;
            tags: z.ZodArray<z.ZodString, "many">;
            notes: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            tags?: string[];
            notes?: string;
            customFields?: Record<string, any>;
            inventory?: {
                trackInventory?: boolean;
                lowStockThreshold?: number;
                allowBackorder?: boolean;
                allowPreorder?: boolean;
            };
            shipping?: {
                weight?: number;
                dimensions?: {
                    length?: number;
                    width?: number;
                    height?: number;
                };
                requiresShipping?: boolean;
                freeShipping?: boolean;
            };
            pricing?: {
                compareAtPrice?: {
                    amount?: number;
                    currency?: string;
                };
                costPrice?: {
                    amount?: number;
                    currency?: string;
                };
                sellingPrice?: {
                    amount?: number;
                    currency?: string;
                };
                margin?: number;
            };
            seo?: {
                slug?: string;
                metaTitle?: string;
                metaDescription?: string;
            };
        }, {
            tags?: string[];
            notes?: string;
            customFields?: Record<string, any>;
            inventory?: {
                trackInventory?: boolean;
                lowStockThreshold?: number;
                allowBackorder?: boolean;
                allowPreorder?: boolean;
            };
            shipping?: {
                weight?: number;
                dimensions?: {
                    length?: number;
                    width?: number;
                    height?: number;
                };
                requiresShipping?: boolean;
                freeShipping?: boolean;
            };
            pricing?: {
                compareAtPrice?: {
                    amount?: number;
                    currency?: string;
                };
                costPrice?: {
                    amount?: number;
                    currency?: string;
                };
                sellingPrice?: {
                    amount?: number;
                    currency?: string;
                };
                margin?: number;
            };
            seo?: {
                slug?: string;
                metaTitle?: string;
                metaDescription?: string;
            };
        }>;
        images: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        documents: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        specifications: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        variants: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            sku: z.ZodString;
            price: z.ZodObject<{
                amount: z.ZodNumber;
                currency: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                amount?: number;
                currency?: string;
            }, {
                amount?: number;
                currency?: string;
            }>;
            compareAtPrice: z.ZodOptional<z.ZodObject<{
                amount: z.ZodNumber;
                currency: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                amount?: number;
                currency?: string;
            }, {
                amount?: number;
                currency?: string;
            }>>;
            costPrice: z.ZodOptional<z.ZodObject<{
                amount: z.ZodNumber;
                currency: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                amount?: number;
                currency?: string;
            }, {
                amount?: number;
                currency?: string;
            }>>;
            inventory: z.ZodObject<{
                quantity: z.ZodNumber;
                reserved: z.ZodNumber;
                available: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                quantity?: number;
                available?: number;
                reserved?: number;
            }, {
                quantity?: number;
                available?: number;
                reserved?: number;
            }>;
            attributes: z.ZodRecord<z.ZodString, z.ZodAny>;
            isActive: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            name?: string;
            id?: string;
            isActive?: boolean;
            sku?: string;
            price?: {
                amount?: number;
                currency?: string;
            };
            compareAtPrice?: {
                amount?: number;
                currency?: string;
            };
            costPrice?: {
                amount?: number;
                currency?: string;
            };
            inventory?: {
                quantity?: number;
                available?: number;
                reserved?: number;
            };
            attributes?: Record<string, any>;
        }, {
            name?: string;
            id?: string;
            isActive?: boolean;
            sku?: string;
            price?: {
                amount?: number;
                currency?: string;
            };
            compareAtPrice?: {
                amount?: number;
                currency?: string;
            };
            costPrice?: {
                amount?: number;
                currency?: string;
            };
            inventory?: {
                quantity?: number;
                available?: number;
                reserved?: number;
            };
            attributes?: Record<string, any>;
        }>, "many">>;
        isActive: z.ZodBoolean;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        type?: "service" | "physical" | "digital" | "subscription" | "bundle";
        status?: "active" | "inactive" | "archived" | "draft" | "discontinued";
        organizationId?: string;
        name?: string;
        images?: string[];
        documents?: string[];
        id?: string;
        createdAt?: Date;
        updatedAt?: Date;
        description?: string;
        category?: string;
        isActive?: boolean;
        brand?: string;
        settings?: {
            tags?: string[];
            notes?: string;
            customFields?: Record<string, any>;
            inventory?: {
                trackInventory?: boolean;
                lowStockThreshold?: number;
                allowBackorder?: boolean;
                allowPreorder?: boolean;
            };
            shipping?: {
                weight?: number;
                dimensions?: {
                    length?: number;
                    width?: number;
                    height?: number;
                };
                requiresShipping?: boolean;
                freeShipping?: boolean;
            };
            pricing?: {
                compareAtPrice?: {
                    amount?: number;
                    currency?: string;
                };
                costPrice?: {
                    amount?: number;
                    currency?: string;
                };
                sellingPrice?: {
                    amount?: number;
                    currency?: string;
                };
                margin?: number;
            };
            seo?: {
                slug?: string;
                metaTitle?: string;
                metaDescription?: string;
            };
        };
        sku?: string;
        supplier?: string;
        barcode?: string;
        shortDescription?: string;
        specifications?: Record<string, any>;
        variants?: {
            name?: string;
            id?: string;
            isActive?: boolean;
            sku?: string;
            price?: {
                amount?: number;
                currency?: string;
            };
            compareAtPrice?: {
                amount?: number;
                currency?: string;
            };
            costPrice?: {
                amount?: number;
                currency?: string;
            };
            inventory?: {
                quantity?: number;
                available?: number;
                reserved?: number;
            };
            attributes?: Record<string, any>;
        }[];
    }, {
        type?: "service" | "physical" | "digital" | "subscription" | "bundle";
        status?: "active" | "inactive" | "archived" | "draft" | "discontinued";
        organizationId?: string;
        name?: string;
        images?: string[];
        documents?: string[];
        id?: string;
        createdAt?: Date;
        updatedAt?: Date;
        description?: string;
        category?: string;
        isActive?: boolean;
        brand?: string;
        settings?: {
            tags?: string[];
            notes?: string;
            customFields?: Record<string, any>;
            inventory?: {
                trackInventory?: boolean;
                lowStockThreshold?: number;
                allowBackorder?: boolean;
                allowPreorder?: boolean;
            };
            shipping?: {
                weight?: number;
                dimensions?: {
                    length?: number;
                    width?: number;
                    height?: number;
                };
                requiresShipping?: boolean;
                freeShipping?: boolean;
            };
            pricing?: {
                compareAtPrice?: {
                    amount?: number;
                    currency?: string;
                };
                costPrice?: {
                    amount?: number;
                    currency?: string;
                };
                sellingPrice?: {
                    amount?: number;
                    currency?: string;
                };
                margin?: number;
            };
            seo?: {
                slug?: string;
                metaTitle?: string;
                metaDescription?: string;
            };
        };
        sku?: string;
        supplier?: string;
        barcode?: string;
        shortDescription?: string;
        specifications?: Record<string, any>;
        variants?: {
            name?: string;
            id?: string;
            isActive?: boolean;
            sku?: string;
            price?: {
                amount?: number;
                currency?: string;
            };
            compareAtPrice?: {
                amount?: number;
                currency?: string;
            };
            costPrice?: {
                amount?: number;
                currency?: string;
            };
            inventory?: {
                quantity?: number;
                available?: number;
                reserved?: number;
            };
            attributes?: Record<string, any>;
        }[];
    }>, "many">;
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
}, "strip", z.ZodTypeAny, {
    data?: {
        type?: "service" | "physical" | "digital" | "subscription" | "bundle";
        status?: "active" | "inactive" | "archived" | "draft" | "discontinued";
        organizationId?: string;
        name?: string;
        images?: string[];
        documents?: string[];
        id?: string;
        createdAt?: Date;
        updatedAt?: Date;
        description?: string;
        category?: string;
        isActive?: boolean;
        brand?: string;
        settings?: {
            tags?: string[];
            notes?: string;
            customFields?: Record<string, any>;
            inventory?: {
                trackInventory?: boolean;
                lowStockThreshold?: number;
                allowBackorder?: boolean;
                allowPreorder?: boolean;
            };
            shipping?: {
                weight?: number;
                dimensions?: {
                    length?: number;
                    width?: number;
                    height?: number;
                };
                requiresShipping?: boolean;
                freeShipping?: boolean;
            };
            pricing?: {
                compareAtPrice?: {
                    amount?: number;
                    currency?: string;
                };
                costPrice?: {
                    amount?: number;
                    currency?: string;
                };
                sellingPrice?: {
                    amount?: number;
                    currency?: string;
                };
                margin?: number;
            };
            seo?: {
                slug?: string;
                metaTitle?: string;
                metaDescription?: string;
            };
        };
        sku?: string;
        supplier?: string;
        barcode?: string;
        shortDescription?: string;
        specifications?: Record<string, any>;
        variants?: {
            name?: string;
            id?: string;
            isActive?: boolean;
            sku?: string;
            price?: {
                amount?: number;
                currency?: string;
            };
            compareAtPrice?: {
                amount?: number;
                currency?: string;
            };
            costPrice?: {
                amount?: number;
                currency?: string;
            };
            inventory?: {
                quantity?: number;
                available?: number;
                reserved?: number;
            };
            attributes?: Record<string, any>;
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
        type?: "service" | "physical" | "digital" | "subscription" | "bundle";
        status?: "active" | "inactive" | "archived" | "draft" | "discontinued";
        organizationId?: string;
        name?: string;
        images?: string[];
        documents?: string[];
        id?: string;
        createdAt?: Date;
        updatedAt?: Date;
        description?: string;
        category?: string;
        isActive?: boolean;
        brand?: string;
        settings?: {
            tags?: string[];
            notes?: string;
            customFields?: Record<string, any>;
            inventory?: {
                trackInventory?: boolean;
                lowStockThreshold?: number;
                allowBackorder?: boolean;
                allowPreorder?: boolean;
            };
            shipping?: {
                weight?: number;
                dimensions?: {
                    length?: number;
                    width?: number;
                    height?: number;
                };
                requiresShipping?: boolean;
                freeShipping?: boolean;
            };
            pricing?: {
                compareAtPrice?: {
                    amount?: number;
                    currency?: string;
                };
                costPrice?: {
                    amount?: number;
                    currency?: string;
                };
                sellingPrice?: {
                    amount?: number;
                    currency?: string;
                };
                margin?: number;
            };
            seo?: {
                slug?: string;
                metaTitle?: string;
                metaDescription?: string;
            };
        };
        sku?: string;
        supplier?: string;
        barcode?: string;
        shortDescription?: string;
        specifications?: Record<string, any>;
        variants?: {
            name?: string;
            id?: string;
            isActive?: boolean;
            sku?: string;
            price?: {
                amount?: number;
                currency?: string;
            };
            compareAtPrice?: {
                amount?: number;
                currency?: string;
            };
            costPrice?: {
                amount?: number;
                currency?: string;
            };
            inventory?: {
                quantity?: number;
                available?: number;
                reserved?: number;
            };
            attributes?: Record<string, any>;
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
export declare const ProductStatsResponseSchema: z.ZodObject<{
    total: z.ZodNumber;
    active: z.ZodNumber;
    inactive: z.ZodNumber;
    draft: z.ZodNumber;
    discontinued: z.ZodNumber;
    archived: z.ZodNumber;
    byType: z.ZodRecord<z.ZodString, z.ZodNumber>;
    byCategory: z.ZodRecord<z.ZodString, z.ZodNumber>;
    byBrand: z.ZodRecord<z.ZodString, z.ZodNumber>;
    bySupplier: z.ZodRecord<z.ZodString, z.ZodNumber>;
    lowStock: z.ZodNumber;
    outOfStock: z.ZodNumber;
    totalValue: z.ZodNumber;
    averagePrice: z.ZodNumber;
    averageMargin: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    active?: number;
    inactive?: number;
    archived?: number;
    totalValue?: number;
    total?: number;
    draft?: number;
    lowStock?: number;
    outOfStock?: number;
    discontinued?: number;
    byType?: Record<string, number>;
    byCategory?: Record<string, number>;
    byBrand?: Record<string, number>;
    bySupplier?: Record<string, number>;
    averagePrice?: number;
    averageMargin?: number;
}, {
    active?: number;
    inactive?: number;
    archived?: number;
    totalValue?: number;
    total?: number;
    draft?: number;
    lowStock?: number;
    outOfStock?: number;
    discontinued?: number;
    byType?: Record<string, number>;
    byCategory?: Record<string, number>;
    byBrand?: Record<string, number>;
    bySupplier?: Record<string, number>;
    averagePrice?: number;
    averageMargin?: number;
}>;
export type CreateProductRequest = z.infer<typeof CreateProductRequestSchema>;
export type UpdateProductRequest = z.infer<typeof UpdateProductRequestSchema>;
export type ProductIdParam = z.infer<typeof ProductIdParamSchema>;
export type ProductOrganizationIdParam = z.infer<typeof ProductOrganizationIdParamSchema>;
export type ProductSearchQuery = z.infer<typeof ProductSearchQuerySchema>;
export type ProductBulkUpdate = z.infer<typeof ProductBulkUpdateSchema>;
export type ProductBulkDelete = z.infer<typeof ProductBulkDeleteSchema>;
export type ProductResponse = z.infer<typeof ProductResponseSchema>;
export type ProductListResponse = z.infer<typeof ProductListResponseSchema>;
export type ProductStatsResponse = z.infer<typeof ProductStatsResponseSchema>;
//# sourceMappingURL=product.dto.d.ts.map