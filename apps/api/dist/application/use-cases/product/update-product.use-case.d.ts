import { Product } from '../../../domain/entities/product.entity.js';
import { ProductRepository } from '../../../domain/repositories/product.repository.js';
export interface UpdateProductRequest {
    id: string;
    name?: string;
    description?: string;
    shortDescription?: string;
    sku?: string;
    barcode?: string;
    type?: 'physical' | 'digital' | 'service' | 'subscription' | 'bundle';
    status?: 'active' | 'inactive' | 'discontinued' | 'draft' | 'archived';
    category?: string;
    brand?: string;
    supplier?: string;
    settings?: {
        inventory?: {
            trackInventory?: boolean;
            lowStockThreshold?: number;
            allowBackorder?: boolean;
            allowPreorder?: boolean;
        };
        pricing?: {
            costPrice?: {
                amount: number;
                currency: string;
            };
            sellingPrice?: {
                amount: number;
                currency: string;
            };
            compareAtPrice?: {
                amount: number;
                currency: string;
            };
            margin?: number;
        };
        shipping?: {
            weight?: number;
            dimensions?: {
                length: number;
                width: number;
                height: number;
            };
            requiresShipping?: boolean;
            freeShipping?: boolean;
        };
        seo?: {
            metaTitle?: string;
            metaDescription?: string;
            slug?: string;
        };
        customFields?: Record<string, any>;
        tags?: string[];
        notes?: string;
    };
    images?: string[];
    documents?: string[];
    specifications?: Record<string, any>;
    variants?: Array<{
        id?: string;
        name: string;
        sku: string;
        price: {
            amount: number;
            currency: string;
        };
        compareAtPrice?: {
            amount: number;
            currency: string;
        };
        costPrice?: {
            amount: number;
            currency: string;
        };
        inventory: {
            quantity: number;
            reserved: number;
            available: number;
        };
        attributes: Record<string, any>;
        isActive: boolean;
    }>;
}
export interface UpdateProductResponse {
    success: true;
    data: {
        product: Product;
    };
}
export declare class UpdateProductUseCase {
    private readonly productRepository;
    constructor(productRepository: ProductRepository);
    execute(request: UpdateProductRequest): Promise<UpdateProductResponse>;
}
//# sourceMappingURL=update-product.use-case.d.ts.map