import { z } from 'zod';
import { Money } from '../value-objects/money.vo.js';

// ============================================================================
// PRODUCT ENTITY
// ============================================================================

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

export class Product {
  private constructor(private props: ProductProps) {}

  // ========================================================================
  // FACTORY METHODS
  // ========================================================================

  static create(props: Omit<ProductProps, 'id' | 'createdAt' | 'updatedAt'>): Product {
    const now = new Date();
    return new Product({
      ...props,
      id: { value: crypto.randomUUID() },
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromJSON(data: ProductProps): Product {
    return new Product(data);
  }

  // ========================================================================
  // GETTERS
  // ========================================================================

  get id(): ProductId { return this.props.id; }
  get organizationId(): OrganizationId { return this.props.organizationId; }
  get name(): string { return this.props.name; }
  get description(): string | undefined { return this.props.description; }
  get shortDescription(): string | undefined { return this.props.shortDescription; }
  get sku(): string { return this.props.sku; }
  get barcode(): string | undefined { return this.props.barcode; }
  get type(): ProductType { return this.props.type; }
  get status(): ProductStatus { return this.props.status; }
  get category(): ProductCategory { return this.props.category; }
  get brand(): ProductBrand | undefined { return this.props.brand; }
  get supplier(): ProductSupplier | undefined { return this.props.supplier; }
  get settings(): ProductSettings { return this.props.settings; }
  get images(): string[] | undefined { return this.props.images; }
  get documents(): string[] | undefined { return this.props.documents; }
  get specifications(): Record<string, any> | undefined { return this.props.specifications; }
  get variants(): ProductVariant[] | undefined { return this.props.variants; }
  get isActive(): boolean { return this.props.isActive; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  // ========================================================================
  // BUSINESS METHODS
  // ========================================================================

  updateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Product name cannot be empty');
    }
    this.props.name = name.trim();
    this.props.updatedAt = new Date();
  }

  updateDescription(description: string): void {
    this.props.description = description;
    this.props.updatedAt = new Date();
  }

  updateShortDescription(shortDescription: string): void {
    this.props.shortDescription = shortDescription;
    this.props.updatedAt = new Date();
  }

  updateSku(sku: string): void {
    if (!sku || sku.trim().length === 0) {
      throw new Error('Product SKU cannot be empty');
    }
    this.props.sku = sku.trim();
    this.props.updatedAt = new Date();
  }

  updateBarcode(barcode: string): void {
    this.props.barcode = barcode;
    this.props.updatedAt = new Date();
  }

  updateType(type: ProductType): void {
    this.props.type = type;
    this.props.updatedAt = new Date();
  }

  updateStatus(status: ProductStatus): void {
    this.props.status = status;
    this.props.updatedAt = new Date();
  }

  updateCategory(category: ProductCategory): void {
    this.props.category = category;
    this.props.updatedAt = new Date();
  }

  updateBrand(brand: ProductBrand): void {
    this.props.brand = brand;
    this.props.updatedAt = new Date();
  }

  updateSupplier(supplier: ProductSupplier): void {
    this.props.supplier = supplier;
    this.props.updatedAt = new Date();
  }

  updateSettings(settings: ProductSettings): void {
    this.props.settings = settings;
    this.props.updatedAt = new Date();
  }

  addImage(imageUrl: string): void {
    if (!this.props.images) {
      this.props.images = [];
    }
    if (!this.props.images.includes(imageUrl)) {
      this.props.images.push(imageUrl);
      this.props.updatedAt = new Date();
    }
  }

  removeImage(imageUrl: string): void {
    if (this.props.images) {
      this.props.images = this.props.images.filter(img => img !== imageUrl);
      this.props.updatedAt = new Date();
    }
  }

  addDocument(documentUrl: string): void {
    if (!this.props.documents) {
      this.props.documents = [];
    }
    if (!this.props.documents.includes(documentUrl)) {
      this.props.documents.push(documentUrl);
      this.props.updatedAt = new Date();
    }
  }

  removeDocument(documentUrl: string): void {
    if (this.props.documents) {
      this.props.documents = this.props.documents.filter(doc => doc !== documentUrl);
      this.props.updatedAt = new Date();
    }
  }

  updateSpecifications(specifications: Record<string, any>): void {
    this.props.specifications = specifications;
    this.props.updatedAt = new Date();
  }

  addVariant(variant: ProductVariant): void {
    if (!this.props.variants) {
      this.props.variants = [];
    }
    this.props.variants.push(variant);
    this.props.updatedAt = new Date();
  }

  removeVariant(variantId: string): void {
    if (this.props.variants) {
      this.props.variants = this.props.variants.filter(v => v.id !== variantId);
      this.props.updatedAt = new Date();
    }
  }

  updateVariant(variantId: string, updates: Partial<ProductVariant>): void {
    if (this.props.variants) {
      const variantIndex = this.props.variants.findIndex(v => v.id === variantId);
      if (variantIndex !== -1) {
        this.props.variants[variantIndex] = { ...this.props.variants[variantIndex], ...updates };
        this.props.updatedAt = new Date();
      }
    }
  }

  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  // ========================================================================
  // VALIDATION METHODS
  // ========================================================================

  validate(): boolean {
    if (!this.props.name || this.props.name.trim().length === 0) {
      return false;
    }
    if (!this.props.sku || this.props.sku.trim().length === 0) {
      return false;
    }
    if (!this.props.organizationId || !this.props.organizationId.value) {
      return false;
    }
    return true;
  }

  // ========================================================================
  // UTILITY METHODS
  // ========================================================================

  toJSON(): ProductProps {
    return { ...this.props };
  }

  clone(): Product {
    return Product.fromJSON(this.toJSON());
  }

  // ========================================================================
  // FACTORY METHODS FOR SPECIFIC PRODUCT TYPES
  // ========================================================================

  static createPhysicalProduct(props: Omit<ProductProps, 'id' | 'type' | 'createdAt' | 'updatedAt'>): Product {
    return Product.create({
      ...props,
      type: { value: 'physical' },
    });
  }

  static createDigitalProduct(props: Omit<ProductProps, 'id' | 'type' | 'createdAt' | 'updatedAt'>): Product {
    return Product.create({
      ...props,
      type: { value: 'digital' },
    });
  }

  static createServiceProduct(props: Omit<ProductProps, 'id' | 'type' | 'createdAt' | 'updatedAt'>): Product {
    return Product.create({
      ...props,
      type: { value: 'service' },
    });
  }

  static createSubscriptionProduct(props: Omit<ProductProps, 'id' | 'type' | 'createdAt' | 'updatedAt'>): Product {
    return Product.create({
      ...props,
      type: { value: 'subscription' },
    });
  }

  static createBundleProduct(props: Omit<ProductProps, 'id' | 'type' | 'createdAt' | 'updatedAt'>): Product {
    return Product.create({
      ...props,
      type: { value: 'bundle' },
    });
  }
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type { ProductId, ProductType, ProductStatus, ProductCategory, ProductBrand, ProductSupplier, ProductSettings, ProductVariant };
