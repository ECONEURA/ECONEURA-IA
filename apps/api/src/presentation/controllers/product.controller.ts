import { Request, Response, NextFunction } from 'express';
import { ProductRepository } from '../../domain/repositories/product.repository.js';
import { CreateProductUseCase } from '../../application/use-cases/product/create-product.use-case.js';
import { UpdateProductUseCase } from '../../application/use-cases/product/update-product.use-case.js';
import {
  CreateProductRequestSchema,
  UpdateProductRequestSchema,
  ProductIdParamSchema,
  ProductOrganizationIdParamSchema,
  ProductSearchQuerySchema,
  ProductBulkUpdateSchema,
  ProductBulkDeleteSchema,
  ProductResponseSchema,
  ProductListResponseSchema,
  ProductStatsResponseSchema,
  type CreateProductRequest,
  type UpdateProductRequest,
  type ProductIdParam,
  type ProductOrganizationIdParam,
  type ProductSearchQuery,
  type ProductBulkUpdate,
  type ProductBulkDelete,
  type ProductResponse,
  type ProductListResponse,
  type ProductStatsResponse
} from '../dto/product.dto.js';

// ============================================================================
// PRODUCT CONTROLLER
// ============================================================================

export class ProductController {
  private createProductUseCase: CreateProductUseCase;
  private updateProductUseCase: UpdateProductUseCase;

  constructor(private productRepository: ProductRepository) {
    this.createProductUseCase = new CreateProductUseCase(productRepository);
    this.updateProductUseCase = new UpdateProductUseCase(productRepository);
  }

  // ========================================================================
  // PRODUCT MANAGEMENT
  // ========================================================================

  async createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requestData = CreateProductRequestSchema.parse(req.body);
      const createdBy = req.user?.id || req.headers['x-user-id'] as string;

      const result = await this.createProductUseCase.execute({
        ...requestData,
        createdBy
      });

      const response: ProductResponse = {
        id: result.data.product.id.value,
        organizationId: result.data.product.organizationId.value,
        name: result.data.product.name,
        description: result.data.product.description,
        shortDescription: result.data.product.shortDescription,
        sku: result.data.product.sku,
        barcode: result.data.product.barcode,
        type: result.data.product.type.value,
        status: result.data.product.status.value,
        category: result.data.product.category.value,
        brand: result.data.product.brand?.value,
        supplier: result.data.product.supplier?.value,
        settings: {
          inventory: result.data.product.settings.inventory,
          pricing: {
            costPrice: result.data.product.settings.pricing.costPrice ? {
              amount: result.data.product.settings.pricing.costPrice.amount,
              currency: result.data.product.settings.pricing.costPrice.currency
            } : undefined,
            sellingPrice: {
              amount: result.data.product.settings.pricing.sellingPrice.amount,
              currency: result.data.product.settings.pricing.sellingPrice.currency
            },
            compareAtPrice: result.data.product.settings.pricing.compareAtPrice ? {
              amount: result.data.product.settings.pricing.compareAtPrice.amount,
              currency: result.data.product.settings.pricing.compareAtPrice.currency
            } : undefined,
            margin: result.data.product.settings.pricing.margin
          },
          shipping: result.data.product.settings.shipping,
          seo: result.data.product.settings.seo,
          customFields: result.data.product.settings.customFields,
          tags: result.data.product.settings.tags,
          notes: result.data.product.settings.notes
        },
        images: result.data.product.images,
        documents: result.data.product.documents,
        specifications: result.data.product.specifications,
        variants: result.data.product.variants?.map(variant => ({
          id: variant.id,
          name: variant.name,
          sku: variant.sku,
          price: {
            amount: variant.price.amount,
            currency: variant.price.currency
          },
          compareAtPrice: variant.compareAtPrice ? {
            amount: variant.compareAtPrice.amount,
            currency: variant.compareAtPrice.currency
          } : undefined,
          costPrice: variant.costPrice ? {
            amount: variant.costPrice.amount,
            currency: variant.costPrice.currency
          } : undefined,
          inventory: variant.inventory,
          attributes: variant.attributes,
          isActive: variant.isActive
        })),
        isActive: result.data.product.isActive,
        createdAt: result.data.product.createdAt,
        updatedAt: result.data.product.updatedAt
      };

      res.status(201).json({
        success: true,
        data: response,
        message: 'Product created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = ProductIdParamSchema.parse(req.params);
      const requestData = UpdateProductRequestSchema.parse(req.body);
      const updatedBy = req.user?.id || req.headers['x-user-id'] as string;

      const result = await this.updateProductUseCase.execute({
        id,
        ...requestData,
        updatedBy
      });

      const response: ProductResponse = {
        id: result.data.product.id.value,
        organizationId: result.data.product.organizationId.value,
        name: result.data.product.name,
        description: result.data.product.description,
        shortDescription: result.data.product.shortDescription,
        sku: result.data.product.sku,
        barcode: result.data.product.barcode,
        type: result.data.product.type.value,
        status: result.data.product.status.value,
        category: result.data.product.category.value,
        brand: result.data.product.brand?.value,
        supplier: result.data.product.supplier?.value,
        settings: {
          inventory: result.data.product.settings.inventory,
          pricing: {
            costPrice: result.data.product.settings.pricing.costPrice ? {
              amount: result.data.product.settings.pricing.costPrice.amount,
              currency: result.data.product.settings.pricing.costPrice.currency
            } : undefined,
            sellingPrice: {
              amount: result.data.product.settings.pricing.sellingPrice.amount,
              currency: result.data.product.settings.pricing.sellingPrice.currency
            },
            compareAtPrice: result.data.product.settings.pricing.compareAtPrice ? {
              amount: result.data.product.settings.pricing.compareAtPrice.amount,
              currency: result.data.product.settings.pricing.compareAtPrice.currency
            } : undefined,
            margin: result.data.product.settings.pricing.margin
          },
          shipping: result.data.product.settings.shipping,
          seo: result.data.product.settings.seo,
          customFields: result.data.product.settings.customFields,
          tags: result.data.product.settings.tags,
          notes: result.data.product.settings.notes
        },
        images: result.data.product.images,
        documents: result.data.product.documents,
        specifications: result.data.product.specifications,
        variants: result.data.product.variants?.map(variant => ({
          id: variant.id,
          name: variant.name,
          sku: variant.sku,
          price: {
            amount: variant.price.amount,
            currency: variant.price.currency
          },
          compareAtPrice: variant.compareAtPrice ? {
            amount: variant.compareAtPrice.amount,
            currency: variant.compareAtPrice.currency
          } : undefined,
          costPrice: variant.costPrice ? {
            amount: variant.costPrice.amount,
            currency: variant.costPrice.currency
          } : undefined,
          inventory: variant.inventory,
          attributes: variant.attributes,
          isActive: variant.isActive
        })),
        isActive: result.data.product.isActive,
        createdAt: result.data.product.createdAt,
        updatedAt: result.data.product.updatedAt
      };

      res.status(200).json({
        success: true,
        data: response,
        message: 'Product updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = ProductIdParamSchema.parse(req.params);
      const deletedBy = req.user?.id || req.headers['x-user-id'] as string;

      await this.productRepository.delete(id);

      res.status(200).json({
        success: true,
        message: 'Product deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async getProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = ProductIdParamSchema.parse(req.params);

      const product = await this.productRepository.findById(id);
      if (!product) {
        res.status(404).json({
          success: false,
          message: 'Product not found'
        });
        return;
      }

      const response: ProductResponse = {
        id: product.id.value,
        organizationId: product.organizationId.value,
        name: product.name,
        description: product.description,
        shortDescription: product.shortDescription,
        sku: product.sku,
        barcode: product.barcode,
        type: product.type.value,
        status: product.status.value,
        category: product.category.value,
        brand: product.brand?.value,
        supplier: product.supplier?.value,
        settings: {
          inventory: product.settings.inventory,
          pricing: {
            costPrice: product.settings.pricing.costPrice ? {
              amount: product.settings.pricing.costPrice.amount,
              currency: product.settings.pricing.costPrice.currency
            } : undefined,
            sellingPrice: {
              amount: product.settings.pricing.sellingPrice.amount,
              currency: product.settings.pricing.sellingPrice.currency
            },
            compareAtPrice: product.settings.pricing.compareAtPrice ? {
              amount: product.settings.pricing.compareAtPrice.amount,
              currency: product.settings.pricing.compareAtPrice.currency
            } : undefined,
            margin: product.settings.pricing.margin
          },
          shipping: product.settings.shipping,
          seo: product.settings.seo,
          customFields: product.settings.customFields,
          tags: product.settings.tags,
          notes: product.settings.notes
        },
        images: product.images,
        documents: product.documents,
        specifications: product.specifications,
        variants: product.variants?.map(variant => ({
          id: variant.id,
          name: variant.name,
          sku: variant.sku,
          price: {
            amount: variant.price.amount,
            currency: variant.price.currency
          },
          compareAtPrice: variant.compareAtPrice ? {
            amount: variant.compareAtPrice.amount,
            currency: variant.compareAtPrice.currency
          } : undefined,
          costPrice: variant.costPrice ? {
            amount: variant.costPrice.amount,
            currency: variant.costPrice.currency
          } : undefined,
          inventory: variant.inventory,
          attributes: variant.attributes,
          isActive: variant.isActive
        })),
        isActive: product.isActive,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      };

      res.status(200).json({
        success: true,
        data: response
      });
    } catch (error) {
      next(error);
    }
  }

  async getProductsByOrganization(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { organizationId } = ProductOrganizationIdParamSchema.parse(req.params);
      const query = ProductSearchQuerySchema.parse(req.query);

      const products = await this.productRepository.findByOrganizationId(organizationId);
      
      // Apply filtering and sorting
      let filteredProducts = products;
      
      if (query.search) {
        filteredProducts = filteredProducts.filter(product => 
          product.name.toLowerCase().includes(query.search!.toLowerCase()) ||
          product.sku.toLowerCase().includes(query.search!.toLowerCase()) ||
          product.description?.toLowerCase().includes(query.search!.toLowerCase())
        );
      }

      if (query.type) {
        filteredProducts = filteredProducts.filter(product => product.type.value === query.type);
      }

      if (query.status) {
        filteredProducts = filteredProducts.filter(product => product.status.value === query.status);
      }

      if (query.category) {
        filteredProducts = filteredProducts.filter(product => product.category.value === query.category);
      }

      if (query.brand) {
        filteredProducts = filteredProducts.filter(product => product.brand?.value === query.brand);
      }

      if (query.supplier) {
        filteredProducts = filteredProducts.filter(product => product.supplier?.value === query.supplier);
      }

      // Sort products
      filteredProducts.sort((a, b) => {
        const aValue = a[query.sortBy as keyof typeof a];
        const bValue = b[query.sortBy as keyof typeof b];
        
        if (query.sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });

      // Pagination
      const total = filteredProducts.length;
      const totalPages = Math.ceil(total / query.limit);
      const startIndex = (query.page - 1) * query.limit;
      const endIndex = startIndex + query.limit;
      const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

      const response: ProductListResponse = {
        data: paginatedProducts.map(product => ({
          id: product.id.value,
          organizationId: product.organizationId.value,
          name: product.name,
          description: product.description,
          shortDescription: product.shortDescription,
          sku: product.sku,
          barcode: product.barcode,
          type: product.type.value,
          status: product.status.value,
          category: product.category.value,
          brand: product.brand?.value,
          supplier: product.supplier?.value,
          settings: {
            inventory: product.settings.inventory,
            pricing: {
              costPrice: product.settings.pricing.costPrice ? {
                amount: product.settings.pricing.costPrice.amount,
                currency: product.settings.pricing.costPrice.currency
              } : undefined,
              sellingPrice: {
                amount: product.settings.pricing.sellingPrice.amount,
                currency: product.settings.pricing.sellingPrice.currency
              },
              compareAtPrice: product.settings.pricing.compareAtPrice ? {
                amount: product.settings.pricing.compareAtPrice.amount,
                currency: product.settings.pricing.compareAtPrice.currency
              } : undefined,
              margin: product.settings.pricing.margin
            },
            shipping: product.settings.shipping,
            seo: product.settings.seo,
            customFields: product.settings.customFields,
            tags: product.settings.tags,
            notes: product.settings.notes
          },
          images: product.images,
          documents: product.documents,
          specifications: product.specifications,
          variants: product.variants?.map(variant => ({
            id: variant.id,
            name: variant.name,
            sku: variant.sku,
            price: {
              amount: variant.price.amount,
              currency: variant.price.currency
            },
            compareAtPrice: variant.compareAtPrice ? {
              amount: variant.compareAtPrice.amount,
              currency: variant.compareAtPrice.currency
            } : undefined,
            costPrice: variant.costPrice ? {
              amount: variant.costPrice.amount,
              currency: variant.costPrice.currency
            } : undefined,
            inventory: variant.inventory,
            attributes: variant.attributes,
            isActive: variant.isActive
          })),
          isActive: product.isActive,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt
        })),
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages,
          hasNext: query.page < totalPages,
          hasPrev: query.page > 1
        }
      };

      res.status(200).json({
        success: true,
        data: response
      });
    } catch (error) {
      next(error);
    }
  }

  async searchProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { organizationId } = ProductOrganizationIdParamSchema.parse(req.params);
      const query = ProductSearchQuerySchema.parse(req.query);

      const products = await this.productRepository.search(query.search || '', organizationId);

      const response: ProductListResponse = {
        data: products.map(product => ({
          id: product.id.value,
          organizationId: product.organizationId.value,
          name: product.name,
          description: product.description,
          shortDescription: product.shortDescription,
          sku: product.sku,
          barcode: product.barcode,
          type: product.type.value,
          status: product.status.value,
          category: product.category.value,
          brand: product.brand?.value,
          supplier: product.supplier?.value,
          settings: {
            inventory: product.settings.inventory,
            pricing: {
              costPrice: product.settings.pricing.costPrice ? {
                amount: product.settings.pricing.costPrice.amount,
                currency: product.settings.pricing.costPrice.currency
              } : undefined,
              sellingPrice: {
                amount: product.settings.pricing.sellingPrice.amount,
                currency: product.settings.pricing.sellingPrice.currency
              },
              compareAtPrice: product.settings.pricing.compareAtPrice ? {
                amount: product.settings.pricing.compareAtPrice.amount,
                currency: product.settings.pricing.compareAtPrice.currency
              } : undefined,
              margin: product.settings.pricing.margin
            },
            shipping: product.settings.shipping,
            seo: product.settings.seo,
            customFields: product.settings.customFields,
            tags: product.settings.tags,
            notes: product.settings.notes
          },
          images: product.images,
          documents: product.documents,
          specifications: product.specifications,
          variants: product.variants?.map(variant => ({
            id: variant.id,
            name: variant.name,
            sku: variant.sku,
            price: {
              amount: variant.price.amount,
              currency: variant.price.currency
            },
            compareAtPrice: variant.compareAtPrice ? {
              amount: variant.compareAtPrice.amount,
              currency: variant.compareAtPrice.currency
            } : undefined,
            costPrice: variant.costPrice ? {
              amount: variant.costPrice.amount,
              currency: variant.costPrice.currency
            } : undefined,
            inventory: variant.inventory,
            attributes: variant.attributes,
            isActive: variant.isActive
          })),
          isActive: product.isActive,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt
        })),
        pagination: {
          page: query.page,
          limit: query.limit,
          total: products.length,
          totalPages: Math.ceil(products.length / query.limit),
          hasNext: query.page < Math.ceil(products.length / query.limit),
          hasPrev: query.page > 1
        }
      };

      res.status(200).json({
        success: true,
        data: response
      });
    } catch (error) {
      next(error);
    }
  }

  async getProductStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { organizationId } = ProductOrganizationIdParamSchema.parse(req.params);

      const stats = await this.productRepository.getStats(organizationId);

      const response: ProductStatsResponse = {
        total: stats.total,
        active: stats.active,
        inactive: stats.inactive,
        draft: stats.draft,
        discontinued: stats.discontinued,
        archived: stats.archived,
        byType: stats.byType,
        byCategory: stats.byCategory,
        byBrand: stats.byBrand,
        bySupplier: stats.bySupplier,
        lowStock: stats.lowStock,
        outOfStock: stats.outOfStock,
        totalValue: stats.totalValue,
        averagePrice: stats.averagePrice,
        averageMargin: stats.averageMargin
      };

      res.status(200).json({
        success: true,
        data: response
      });
    } catch (error) {
      next(error);
    }
  }

  // ========================================================================
  // BULK OPERATIONS
  // ========================================================================

  async bulkUpdateProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requestData = ProductBulkUpdateSchema.parse(req.body);
      const updatedBy = req.user?.id || req.headers['x-user-id'] as string;

      // Get all products to update
      const products = await Promise.all(
        requestData.ids.map(id => this.productRepository.findById(id))
      );

      const validProducts = products.filter(product => product !== null);
      
      if (validProducts.length !== requestData.ids.length) {
        res.status(400).json({
          success: false,
          message: 'Some products not found'
        });
        return;
      }

      // Update products
      const updatedProducts = await Promise.all(
        validProducts.map(product => {
          if (requestData.updates.status) {
            product!.updateStatus({ value: requestData.updates.status });
          }
          if (requestData.updates.category) {
            product!.updateCategory({ value: requestData.updates.category });
          }
          if (requestData.updates.brand) {
            product!.updateBrand({ value: requestData.updates.brand });
          }
          if (requestData.updates.supplier) {
            product!.updateSupplier({ value: requestData.updates.supplier });
          }
          if (requestData.updates.tags) {
            const currentSettings = product!.settings;
            product!.updateSettings({
              ...currentSettings,
              tags: requestData.updates.tags
            });
          }
          return this.productRepository.update(product!);
        })
      );

      res.status(200).json({
        success: true,
        data: {
          updated: updatedProducts.length,
          products: updatedProducts.map(product => product.id.value)
        },
        message: `${updatedProducts.length} products updated successfully`
      });
    } catch (error) {
      next(error);
    }
  }

  async bulkDeleteProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requestData = ProductBulkDeleteSchema.parse(req.body);
      const deletedBy = req.user?.id || req.headers['x-user-id'] as string;

      await this.productRepository.deleteMany(requestData.ids);

      res.status(200).json({
        success: true,
        data: {
          deleted: requestData.ids.length,
          ids: requestData.ids
        },
        message: `${requestData.ids.length} products deleted successfully`
      });
    } catch (error) {
      next(error);
    }
  }
}
