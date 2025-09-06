import { Product } from '../../../domain/entities/product.entity.js';
import { ProductRepository } from '../../../domain/repositories/product.repository.js';
import { Money } from '../../../domain/value-objects/money.vo.js';

// ============================================================================
// UPDATE PRODUCT USE CASE
// ============================================================================

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

export class UpdateProductUseCase {
  constructor(
    private readonly productRepository: ProductRepository
  ) {}

  async execute(request: UpdateProductRequest): Promise<UpdateProductResponse> {
    // ========================================================================
    // VALIDATION
    // ========================================================================

    if (!request.id || request.id.trim().length === 0) {
      throw new Error('Product ID is required');
    }

    // ========================================================================
    // FIND EXISTING PRODUCT
    // ========================================================================

    const existingProduct = await this.productRepository.findById(request.id);
    if (!existingProduct) {
      throw new Error(`Product with ID '${request.id}' not found`);
    }

    // ========================================================================
    // BUSINESS LOGIC VALIDATION
    // ========================================================================

    // Check if SKU already exists (if being updated)
    if (request.sku && request.sku !== existingProduct.sku) {
      const existingProductBySku = await this.productRepository.findBySku(request.sku);
      if (existingProductBySku && existingProductBySku.id.value !== request.id) {
        throw new Error(`Product with SKU '${request.sku}' already exists`);
      }
    }

    // Check if barcode already exists (if being updated)
    if (request.barcode && request.barcode !== existingProduct.barcode) {
      const existingProductByBarcode = await this.productRepository.findByBarcode(request.barcode);
      if (existingProductByBarcode && existingProductByBarcode.id.value !== request.id) {
        throw new Error(`Product with barcode '${request.barcode}' already exists`);
      }
    }

    // ========================================================================
    // UPDATE PRODUCT
    // ========================================================================

    // Update basic fields
    if (request.name !== undefined) {
      existingProduct.updateName(request.name);
    }

    if (request.description !== undefined) {
      existingProduct.updateDescription(request.description);
    }

    if (request.shortDescription !== undefined) {
      existingProduct.updateShortDescription(request.shortDescription);
    }

    if (request.sku !== undefined) {
      existingProduct.updateSku(request.sku);
    }

    if (request.barcode !== undefined) {
      existingProduct.updateBarcode(request.barcode);
    }

    if (request.type !== undefined) {
      existingProduct.updateType({ value: request.type });
    }

    if (request.status !== undefined) {
      existingProduct.updateStatus({ value: request.status });
    }

    if (request.category !== undefined) {
      existingProduct.updateCategory({ value: request.category });
    }

    if (request.brand !== undefined) {
      existingProduct.updateBrand({ value: request.brand });
    }

    if (request.supplier !== undefined) {
      existingProduct.updateSupplier({ value: request.supplier });
    }

    // Update settings
    if (request.settings !== undefined) {
      const currentSettings = existingProduct.settings;
      const updatedSettings = {
        inventory: {
          ...currentSettings.inventory,
          ...request.settings.inventory,
        },
        pricing: {
          ...currentSettings.pricing,
          ...request.settings.pricing,
          costPrice: request.settings.pricing?.costPrice ? Money.create(
            request.settings.pricing.costPrice.amount,
            request.settings.pricing.costPrice.currency
          ) : currentSettings.pricing.costPrice,
          sellingPrice: request.settings.pricing?.sellingPrice ? Money.create(
            request.settings.pricing.sellingPrice.amount,
            request.settings.pricing.sellingPrice.currency
          ) : currentSettings.pricing.sellingPrice,
          compareAtPrice: request.settings.pricing?.compareAtPrice ? Money.create(
            request.settings.pricing.compareAtPrice.amount,
            request.settings.pricing.compareAtPrice.currency
          ) : currentSettings.pricing.compareAtPrice,
        },
        shipping: {
          ...currentSettings.shipping,
          ...request.settings.shipping,
        },
        seo: {
          ...currentSettings.seo,
          ...request.settings.seo,
        },
        customFields: {
          ...currentSettings.customFields,
          ...request.settings.customFields,
        },
        tags: request.settings.tags || currentSettings.tags,
        notes: request.settings.notes || currentSettings.notes,
      };
      existingProduct.updateSettings(updatedSettings);
    }

    // Update images
    if (request.images !== undefined) {
      // Remove all existing images and add new ones
      const currentImages = existingProduct.images || [];
      currentImages.forEach(image => existingProduct.removeImage(image));
      request.images.forEach(image => existingProduct.addImage(image));
    }

    // Update documents
    if (request.documents !== undefined) {
      // Remove all existing documents and add new ones
      const currentDocuments = existingProduct.documents || [];
      currentDocuments.forEach(doc => existingProduct.removeDocument(doc));
      request.documents.forEach(doc => existingProduct.addDocument(doc));
    }

    // Update specifications
    if (request.specifications !== undefined) {
      existingProduct.updateSpecifications(request.specifications);
    }

    // Update variants
    if (request.variants !== undefined) {
      // Remove all existing variants and add new ones
      const currentVariants = existingProduct.variants || [];
      currentVariants.forEach(variant => existingProduct.removeVariant(variant.id));
      request.variants.forEach(variant => {
        const newVariant = {
          id: variant.id || crypto.randomUUID(),
          name: variant.name,
          sku: variant.sku,
          price: Money.create(variant.price.amount, variant.price.currency),
          compareAtPrice: variant.compareAtPrice ? Money.create(
            variant.compareAtPrice.amount,
            variant.compareAtPrice.currency
          ) : undefined,
          costPrice: variant.costPrice ? Money.create(
            variant.costPrice.amount,
            variant.costPrice.currency
          ) : undefined,
          inventory: variant.inventory,
          attributes: variant.attributes,
          isActive: variant.isActive,
        };
        existingProduct.addVariant(newVariant);
      });
    }

    // ========================================================================
    // VALIDATE UPDATED PRODUCT
    // ========================================================================

    if (!existingProduct.validate()) {
      throw new Error('Invalid product data after update');
    }

    // ========================================================================
    // SAVE UPDATED PRODUCT
    // ========================================================================

    const updatedProduct = await this.productRepository.update(existingProduct);

    // ========================================================================
    // RETURN RESPONSE
    // ========================================================================

    return {
      success: true,
      data: {
        product: updatedProduct,
      },
    };
  }
}
