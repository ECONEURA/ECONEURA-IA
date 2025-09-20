import { Money } from '../value-objects/money.vo.js';
export interface ProductId {
    value: string;
}
export interface OrganizationId {
    value: string;
}
export interface ProductType {
    value: 'physical' | 'digital' | 'service' | 'subscription' | 'bundle';
}
export interface ProductStatus {
    value: 'active' | 'inactive' | 'discontinued' | 'draft' | 'archived';
}
export interface ProductCategory {
    value: string;
}
export interface ProductBrand {
    value: string;
}
export interface ProductSupplier {
    value: string;
}
export interface ProductSettings {
    inventory: {
        trackInventory: boolean;
        lowStockThreshold: number;
        allowBackorder: boolean;
        allowPreorder: boolean;
    };
    pricing: {
        costPrice?: Money;
        sellingPrice: Money;
        compareAtPrice?: Money;
        margin?: number;
    };
    shipping: {
        weight?: number;
        dimensions?: {
            length: number;
            width: number;
            height: number;
        };
        requiresShipping: boolean;
        freeShipping: boolean;
    };
    seo: {
        metaTitle?: string;
        metaDescription?: string;
        slug: string;
    };
    customFields: Record<string, any>;
    tags: string[];
    notes: string;
}
export interface ProductProps {
    id: ProductId;
    organizationId: OrganizationId;
    name: string;
    description?: string;
    shortDescription?: string;
    sku: string;
    barcode?: string;
    type: ProductType;
    status: ProductStatus;
    category: ProductCategory;
    brand?: ProductBrand;
    supplier?: ProductSupplier;
    settings: ProductSettings;
    images?: string[];
    documents?: string[];
    specifications?: Record<string, any>;
    variants?: ProductVariant[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface ProductVariant {
    id: string;
    name: string;
    sku: string;
    price: Money;
    compareAtPrice?: Money;
    costPrice?: Money;
    inventory: {
        quantity: number;
        reserved: number;
        available: number;
    };
    attributes: Record<string, any>;
    isActive: boolean;
}
export declare class Product {
    private props;
    private constructor();
    static create(props: Omit<ProductProps, 'id' | 'createdAt' | 'updatedAt'>): Product;
    static fromJSON(data: ProductProps): Product;
    get id(): ProductId;
    get organizationId(): OrganizationId;
    get name(): string;
    get description(): string | undefined;
    get shortDescription(): string | undefined;
    get sku(): string;
    get barcode(): string | undefined;
    get type(): ProductType;
    get status(): ProductStatus;
    get category(): ProductCategory;
    get brand(): ProductBrand | undefined;
    get supplier(): ProductSupplier | undefined;
    get settings(): ProductSettings;
    get images(): string[] | undefined;
    get documents(): string[] | undefined;
    get specifications(): Record<string, any> | undefined;
    get variants(): ProductVariant[] | undefined;
    get isActive(): boolean;
    get createdAt(): Date;
    get updatedAt(): Date;
    updateName(name: string): void;
    updateDescription(description: string): void;
    updateShortDescription(shortDescription: string): void;
    updateSku(sku: string): void;
    updateBarcode(barcode: string): void;
    updateType(type: ProductType): void;
    updateStatus(status: ProductStatus): void;
    updateCategory(category: ProductCategory): void;
    updateBrand(brand: ProductBrand): void;
    updateSupplier(supplier: ProductSupplier): void;
    updateSettings(settings: ProductSettings): void;
    addImage(imageUrl: string): void;
    removeImage(imageUrl: string): void;
    addDocument(documentUrl: string): void;
    removeDocument(documentUrl: string): void;
    updateSpecifications(specifications: Record<string, any>): void;
    addVariant(variant: ProductVariant): void;
    removeVariant(variantId: string): void;
    updateVariant(variantId: string, updates: Partial<ProductVariant>): void;
    activate(): void;
    deactivate(): void;
    validate(): boolean;
    toJSON(): ProductProps;
    clone(): Product;
    static createPhysicalProduct(props: Omit<ProductProps, 'id' | 'type' | 'createdAt' | 'updatedAt'>): Product;
    static createDigitalProduct(props: Omit<ProductProps, 'id' | 'type' | 'createdAt' | 'updatedAt'>): Product;
    static createServiceProduct(props: Omit<ProductProps, 'id' | 'type' | 'createdAt' | 'updatedAt'>): Product;
    static createSubscriptionProduct(props: Omit<ProductProps, 'id' | 'type' | 'createdAt' | 'updatedAt'>): Product;
    static createBundleProduct(props: Omit<ProductProps, 'id' | 'type' | 'createdAt' | 'updatedAt'>): Product;
}
export type { ProductId, ProductType, ProductStatus, ProductCategory, ProductBrand, ProductSupplier, ProductSettings, ProductVariant };
//# sourceMappingURL=product.entity.d.ts.map