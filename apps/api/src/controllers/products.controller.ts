import { Request, Response } from 'express';
import { prisma } from '../services/prisma';
import { AuthRequest } from '../middleware/auth';
import { ApiError, asyncHandler } from '../middleware/error-handler';
import {
  CreateProductSchema,
  UpdateProductSchema,
  CreateProductCategorySchema,
  UpdateProductCategorySchema,
  ProductQuerySchema,
  ProductParamsSchema
} from '../schemas/erp.schemas';

// ===== PRODUCT CATEGORIES =====

/**
 * Get all product categories
 */
export const getProductCategories = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.user!;

  const categories = await prisma.productCategory.findMany({
    where: { organizationId },
    include: {
      parent: {
        select: { id: true, name: true }
      },
      children: {
        select: { id: true, name: true }
      },
      _count: {
        select: { products: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  res.json({ data: categories });
});

/**
 * Create new product category
 */
export const createProductCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.user!;
  const categoryData = CreateProductCategorySchema.parse(req.body);

  // Check if category name is unique within organization
  const existingCategory = await prisma.productCategory.findFirst({
    where: {
      name: categoryData.name,
      organizationId
    }
  });

  if (existingCategory) {
    throw new ApiError('Category name already exists', 409, 'CATEGORY_NAME_EXISTS');
  }

  // Check if parent exists (if provided)
  if (categoryData.parentId) {
    const parent = await prisma.productCategory.findFirst({
      where: { id: categoryData.parentId, organizationId }
    });
    if (!parent) {
      throw new ApiError('Parent category not found', 404, 'PARENT_CATEGORY_NOT_FOUND');
    }
  }

  const category = await prisma.productCategory.create({
    data: {
      ...categoryData,
      organizationId
    },
    include: {
      parent: {
        select: { id: true, name: true }
      }
    }
  });

  res.status(201).json({ 
    data: category,
    message: 'Category created successfully' 
  });
});

// ===== PRODUCTS =====

/**
 * Get all products with filtering and pagination
 */
export const getProducts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.user!;
  const pagination = req.pagination!;
  
  const query = ProductQuerySchema.parse(req.query);
  
  const where: any = { organizationId };
  
  // Add search filters
  if (query.search) {
    where.OR = [
      { sku: { contains: query.search, mode: 'insensitive' } },
      { name: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } }
    ];
  }
  
  if (query.categoryId) {
    where.categoryId = query.categoryId;
  }
  
  if (query.isActive !== undefined) {
    where.isActive = query.isActive;
  }
  
  if (query.isService !== undefined) {
    where.isService = query.isService;
  }
  
  if (query.trackInventory !== undefined) {
    where.trackInventory = query.trackInventory;
  }
  
  if (query.supplierId) {
    where.supplierId = query.supplierId;
  }

  // Low stock filter
  if (query.lowStock) {
    where.AND = [
      { trackInventory: true },
      {
        stockQuantity: {
          lte: prisma.product.fields.minStockLevel
        }
      }
    ];
  }

  // Price range filters
  if (query.priceMin !== undefined || query.priceMax !== undefined) {
    where.unitPrice = {};
    if (query.priceMin !== undefined) {
      where.unitPrice.gte = query.priceMin;
    }
    if (query.priceMax !== undefined) {
      where.unitPrice.lte = query.priceMax;
    }
  }

  // Execute queries
  const [products, totalCount] = await Promise.all([
    prisma.product.findMany({
      where,
      skip: pagination.offset,
      take: pagination.limit,
      orderBy: query.sortBy ? { [query.sortBy]: query.sortDir || 'asc' } : { createdAt: 'desc' },
      include: {
        category: {
          select: { id: true, name: true }
        },
        taxRate: {
          select: { id: true, name: true, rate: true }
        },
        supplier: {
          select: { id: true, supplierCode: true, companyName: true }
        },
        _count: {
          select: {
            invoiceItems: true,
            expenseItems: true
          }
        }
      }
    }),
    prisma.product.count({ where })
  ]);

  const totalPages = Math.ceil(totalCount / pagination.limit);

  res.json({
    data: products,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      totalCount,
      totalPages,
      hasNext: pagination.page < totalPages,
      hasPrev: pagination.page > 1
    }
  });
});

/**
 * Get single product by ID
 */
export const getProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.user!;
  const { id } = ProductParamsSchema.parse(req.params);

  const product = await prisma.product.findFirst({
    where: { 
      id,
      organizationId
    },
    include: {
      category: {
        select: { id: true, name: true }
      },
      taxRate: {
        select: { id: true, name: true, rate: true }
      },
      supplier: {
        select: { id: true, supplierCode: true, companyName: true, contactName: true }
      },
      invoiceItems: {
        orderBy: { invoice: { invoiceDate: 'desc' } },
        take: 10,
        include: {
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              invoiceDate: true,
              customer: {
                select: { customerCode: true, companyName: true, firstName: true, lastName: true }
              }
            }
          }
        }
      },
      expenseItems: {
        orderBy: { expense: { expenseDate: 'desc' } },
        take: 10,
        include: {
          expense: {
            select: {
              id: true,
              expenseNumber: true,
              expenseDate: true,
              supplier: {
                select: { supplierCode: true, companyName: true }
              }
            }
          }
        }
      },
      _count: {
        select: {
          invoiceItems: true,
          expenseItems: true
        }
      }
    }
  });

  if (!product) {
    throw new ApiError('Product not found', 404, 'PRODUCT_NOT_FOUND');
  }

  res.json({ data: product });
});

/**
 * Create new product
 */
export const createProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId, id: userId } = req.user!;
  const productData = CreateProductSchema.parse(req.body);

  // Check if SKU is unique
  const existingProduct = await prisma.product.findFirst({
    where: {
      sku: productData.sku,
      organizationId
    }
  });

  if (existingProduct) {
    throw new ApiError('SKU already exists', 409, 'SKU_EXISTS');
  }

  // Validate foreign keys
  if (productData.categoryId) {
    const category = await prisma.productCategory.findFirst({
      where: { id: productData.categoryId, organizationId }
    });
    if (!category) {
      throw new ApiError('Category not found', 404, 'CATEGORY_NOT_FOUND');
    }
  }

  if (productData.taxRateId) {
    const taxRate = await prisma.taxRate.findFirst({
      where: { id: productData.taxRateId, organizationId }
    });
    if (!taxRate) {
      throw new ApiError('Tax rate not found', 404, 'TAX_RATE_NOT_FOUND');
    }
  }

  if (productData.supplierId) {
    const supplier = await prisma.supplier.findFirst({
      where: { id: productData.supplierId, organizationId }
    });
    if (!supplier) {
      throw new ApiError('Supplier not found', 404, 'SUPPLIER_NOT_FOUND');
    }
  }

  const product = await prisma.product.create({
    data: {
      ...productData,
      organizationId,
      createdById: userId,
      updatedById: userId
    },
    include: {
      category: {
        select: { id: true, name: true }
      },
      taxRate: {
        select: { id: true, name: true, rate: true }
      },
      supplier: {
        select: { id: true, supplierCode: true, companyName: true }
      }
    }
  });

  res.status(201).json({ 
    data: product,
    message: 'Product created successfully' 
  });
});

/**
 * Update existing product
 */
export const updateProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId, id: userId } = req.user!;
  const { id } = ProductParamsSchema.parse(req.params);
  const updateData = UpdateProductSchema.parse(req.body);

  // Check if product exists
  const existingProduct = await prisma.product.findFirst({
    where: { id, organizationId }
  });

  if (!existingProduct) {
    throw new ApiError('Product not found', 404, 'PRODUCT_NOT_FOUND');
  }

  // Check if new SKU is unique (if being changed)
  if (updateData.sku && updateData.sku !== existingProduct.sku) {
    const conflictingProduct = await prisma.product.findFirst({
      where: {
        sku: updateData.sku,
        organizationId,
        id: { not: id }
      }
    });

    if (conflictingProduct) {
      throw new ApiError('SKU already exists', 409, 'SKU_EXISTS');
    }
  }

  // Validate foreign keys if provided
  if (updateData.categoryId) {
    const category = await prisma.productCategory.findFirst({
      where: { id: updateData.categoryId, organizationId }
    });
    if (!category) {
      throw new ApiError('Category not found', 404, 'CATEGORY_NOT_FOUND');
    }
  }

  if (updateData.taxRateId) {
    const taxRate = await prisma.taxRate.findFirst({
      where: { id: updateData.taxRateId, organizationId }
    });
    if (!taxRate) {
      throw new ApiError('Tax rate not found', 404, 'TAX_RATE_NOT_FOUND');
    }
  }

  if (updateData.supplierId) {
    const supplier = await prisma.supplier.findFirst({
      where: { id: updateData.supplierId, organizationId }
    });
    if (!supplier) {
      throw new ApiError('Supplier not found', 404, 'SUPPLIER_NOT_FOUND');
    }
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...updateData,
      updatedById: userId,
      updatedAt: new Date()
    },
    include: {
      category: {
        select: { id: true, name: true }
      },
      taxRate: {
        select: { id: true, name: true, rate: true }
      },
      supplier: {
        select: { id: true, supplierCode: true, companyName: true }
      }
    }
  });

  res.json({ 
    data: product,
    message: 'Product updated successfully' 
  });
});

/**
 * Delete product
 */
export const deleteProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.user!;
  const { id } = ProductParamsSchema.parse(req.params);

  // Check if product exists
  const product = await prisma.product.findFirst({
    where: { id, organizationId },
    include: {
      _count: {
        select: {
          invoiceItems: true,
          expenseItems: true
        }
      }
    }
  });

  if (!product) {
    throw new ApiError('Product not found', 404, 'PRODUCT_NOT_FOUND');
  }

  // Check if product has related records
  if (product._count.invoiceItems > 0 || product._count.expenseItems > 0) {
    throw new ApiError(
      'Cannot delete product with associated invoice or expense items',
      400,
      'PRODUCT_HAS_DEPENDENCIES'
    );
  }

  await prisma.product.delete({
    where: { id }
  });

  res.json({ 
    message: 'Product deleted successfully' 
  });
});

/**
 * Update product stock
 */
export const updateProductStock = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId, id: userId } = req.user!;
  const { id } = ProductParamsSchema.parse(req.params);
  const { adjustment, reason } = req.body;

  if (!adjustment || typeof adjustment !== 'number') {
    throw new ApiError('Stock adjustment amount is required', 400, 'ADJUSTMENT_REQUIRED');
  }

  // Check if product exists and tracks inventory
  const product = await prisma.product.findFirst({
    where: { id, organizationId }
  });

  if (!product) {
    throw new ApiError('Product not found', 404, 'PRODUCT_NOT_FOUND');
  }

  if (!product.trackInventory) {
    throw new ApiError('Product does not track inventory', 400, 'INVENTORY_NOT_TRACKED');
  }

  const newQuantity = product.stockQuantity + adjustment;
  
  if (newQuantity < 0) {
    throw new ApiError('Insufficient stock for adjustment', 400, 'INSUFFICIENT_STOCK');
  }

  const updatedProduct = await prisma.product.update({
    where: { id },
    data: {
      stockQuantity: newQuantity,
      updatedById: userId,
      updatedAt: new Date()
    }
  });

  res.json({
    data: updatedProduct,
    message: `Stock ${adjustment > 0 ? 'increased' : 'decreased'} by ${Math.abs(adjustment)} units`
  });
});

/**
 * Get inventory report
 */
export const getInventoryReport = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.user!;
  const { categoryId, lowStock, zeroStock, includeInactive } = req.query;

  const where: any = { 
    organizationId,
    trackInventory: true
  };

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (!includeInactive) {
    where.isActive = true;
  }

  if (lowStock === 'true') {
    where.stockQuantity = {
      lte: prisma.product.fields.minStockLevel
    };
  }

  if (zeroStock === 'true') {
    where.stockQuantity = 0;
  }

  const products = await prisma.product.findMany({
    where,
    include: {
      category: {
        select: { id: true, name: true }
      }
    },
    orderBy: { stockQuantity: 'asc' }
  });

  // Calculate totals
  const totalProducts = products.length;
  const totalValue = products.reduce((sum, product) => 
    sum + (Number(product.unitPrice) * product.stockQuantity), 0
  );
  const lowStockCount = products.filter(p => p.stockQuantity <= p.minStockLevel).length;
  const zeroStockCount = products.filter(p => p.stockQuantity === 0).length;

  res.json({
    data: {
      summary: {
        totalProducts,
        totalValue,
        lowStockCount,
        zeroStockCount
      },
      products
    }
  });
});