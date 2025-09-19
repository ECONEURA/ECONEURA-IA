import { Product } from '../../../domain/entities/product.entity.js';
import { Money } from '../../../domain/value-objects/money.vo.js';
export class CreateProductUseCase {
    productRepository;
    constructor(productRepository) {
        this.productRepository = productRepository;
    }
    async execute(request) {
        if (!request.organizationId || request.organizationId.trim().length === 0) {
            throw new Error('Organization ID is required');
        }
        if (!request.name || request.name.trim().length === 0) {
            throw new Error('Product name is required');
        }
        if (!request.sku || request.sku.trim().length === 0) {
            throw new Error('Product SKU is required');
        }
        if (!request.category || request.category.trim().length === 0) {
            throw new Error('Product category is required');
        }
        if (!request.settings || !request.settings.pricing || !request.settings.pricing.sellingPrice) {
            throw new Error('Product selling price is required');
        }
        const existingProductBySku = await this.productRepository.findBySku(request.sku);
        if (existingProductBySku) {
            throw new Error(`Product with SKU '${request.sku}' already exists`);
        }
        if (request.barcode) {
            const existingProductByBarcode = await this.productRepository.findByBarcode(request.barcode);
            if (existingProductByBarcode) {
                throw new Error(`Product with barcode '${request.barcode}' already exists`);
            }
        }
        const product = Product.create({
            organizationId: request.organizationId,
            name: request.name.trim(),
            description: request.description,
            shortDescription: request.shortDescription,
            sku: request.sku.trim(),
            barcode: request.barcode,
            type: request.type,
            status: request.status,
            category: request.category,
            brand: request.brand ? request.brand : undefined,
            supplier: request.supplier ? request.supplier : undefined,
            settings: {
                inventory: request.settings.inventory,
                pricing: {
                    costPrice: request.settings.pricing.costPrice ? Money.create(request.settings.pricing.costPrice.amount, request.settings.pricing.costPrice.currency) : undefined,
                    sellingPrice: Money.create(request.settings.pricing.sellingPrice.amount, request.settings.pricing.sellingPrice.currency),
                    compareAtPrice: request.settings.pricing.compareAtPrice ? Money.create(request.settings.pricing.compareAtPrice.amount, request.settings.pricing.compareAtPrice.currency) : undefined,
                    margin: request.settings.pricing.margin,
                },
                shipping: request.settings.shipping,
                seo: request.settings.seo,
                customFields: request.settings.customFields,
                tags: request.settings.tags,
                notes: request.settings.notes,
            },
            images: request.images,
            documents: request.documents,
            specifications: request.specifications,
            variants: request.variants?.map(variant => ({
                id: crypto.randomUUID(),
                name: variant.name,
                sku: variant.sku,
                price: Money.create(variant.price.amount, variant.price.currency),
                compareAtPrice: variant.compareAtPrice ? Money.create(variant.compareAtPrice.amount, variant.compareAtPrice.currency) : undefined,
                costPrice: variant.costPrice ? Money.create(variant.costPrice.amount, variant.costPrice.currency) : undefined,
                inventory: variant.inventory,
                attributes: variant.attributes,
                isActive: variant.isActive,
            })),
            isActive: true,
        });
        if (!product.validate()) {
            throw new Error('Invalid product data');
        }
        const savedProduct = await this.productRepository.save(product);
        return {
            success: true,
            data: {
                product: savedProduct,
            },
        };
    }
}
//# sourceMappingURL=create-product.use-case.js.map