import { Money } from '../../../domain/value-objects/money.vo.js';
export class UpdateProductUseCase {
    productRepository;
    constructor(productRepository) {
        this.productRepository = productRepository;
    }
    async execute(request) {
        if (!request.id || request.id.trim().length === 0) {
            throw new Error('Product ID is required');
        }
        const existingProduct = await this.productRepository.findById(request.id);
        if (!existingProduct) {
            throw new Error(`Product with ID '${request.id}' not found`);
        }
        if (request.sku && request.sku !== existingProduct.sku) {
            const existingProductBySku = await this.productRepository.findBySku(request.sku);
            if (existingProductBySku && existingProductBySku.id.value !== request.id) {
                throw new Error(`Product with SKU '${request.sku}' already exists`);
            }
        }
        if (request.barcode && request.barcode !== existingProduct.barcode) {
            const existingProductByBarcode = await this.productRepository.findByBarcode(request.barcode);
            if (existingProductByBarcode && existingProductByBarcode.id.value !== request.id) {
                throw new Error(`Product with barcode '${request.barcode}' already exists`);
            }
        }
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
            existingProduct.updateType(request.type);
        }
        if (request.status !== undefined) {
            existingProduct.updateStatus(request.status);
        }
        if (request.category !== undefined) {
            existingProduct.updateCategory(request.category);
        }
        if (request.brand !== undefined) {
            existingProduct.updateBrand(request.brand);
        }
        if (request.supplier !== undefined) {
            existingProduct.updateSupplier(request.supplier);
        }
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
                    costPrice: request.settings.pricing?.costPrice ? Money.create(request.settings.pricing.costPrice.amount, request.settings.pricing.costPrice.currency) : currentSettings.pricing.costPrice,
                    sellingPrice: request.settings.pricing?.sellingPrice ? Money.create(request.settings.pricing.sellingPrice.amount, request.settings.pricing.sellingPrice.currency) : currentSettings.pricing.sellingPrice,
                    compareAtPrice: request.settings.pricing?.compareAtPrice ? Money.create(request.settings.pricing.compareAtPrice.amount, request.settings.pricing.compareAtPrice.currency) : currentSettings.pricing.compareAtPrice,
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
        if (request.images !== undefined) {
            const currentImages = existingProduct.images || [];
            currentImages.forEach(image => existingProduct.removeImage(image));
            request.images.forEach(image => existingProduct.addImage(image));
        }
        if (request.documents !== undefined) {
            const currentDocuments = existingProduct.documents || [];
            currentDocuments.forEach(doc => existingProduct.removeDocument(doc));
            request.documents.forEach(doc => existingProduct.addDocument(doc));
        }
        if (request.specifications !== undefined) {
            existingProduct.updateSpecifications(request.specifications);
        }
        if (request.variants !== undefined) {
            const currentVariants = existingProduct.variants || [];
            currentVariants.forEach(variant => existingProduct.removeVariant(variant.id));
            request.variants.forEach(variant => {
                const newVariant = {
                    id: variant.id || crypto.randomUUID(),
                    name: variant.name,
                    sku: variant.sku,
                    price: Money.create(variant.price.amount, variant.price.currency),
                    compareAtPrice: variant.compareAtPrice ? Money.create(variant.compareAtPrice.amount, variant.compareAtPrice.currency) : undefined,
                    costPrice: variant.costPrice ? Money.create(variant.costPrice.amount, variant.costPrice.currency) : undefined,
                    inventory: variant.inventory,
                    attributes: variant.attributes,
                    isActive: variant.isActive,
                };
                existingProduct.addVariant(newVariant);
            });
        }
        if (!existingProduct.validate()) {
            throw new Error('Invalid product data after update');
        }
        const updatedProduct = await this.productRepository.update(existingProduct);
        return {
            success: true,
            data: {
                product: updatedProduct,
            },
        };
    }
}
//# sourceMappingURL=update-product.use-case.js.map