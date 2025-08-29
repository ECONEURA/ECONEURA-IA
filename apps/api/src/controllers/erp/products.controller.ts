import { Request, Response } from 'express'
// import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import {
  ApiResponse,
  asyncHandler,
  parsePagination,
  parseFilters,
  handlePrismaError,
  TenantQueryBuilder,
  createAuditLog
} from '../../utils/controller'

const prisma = new PrismaClient()

// Validation schemas
const createProductSchema = z.object({
  sku: z.string().min(1).max(50),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  category: z.string().optional(),
  unit: z.string().default('unit'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'DISCONTINUED']).default('ACTIVE'),
  barcode: z.string().optional(),
  weight: z.number().min(0).optional(),
  dimensions: z.object({
    length: z.number(),
    width: z.number(),
    height: z.number(),
    unit: z.string()
  }).optional(),
  costPrice: z.number().min(0),
  sellingPrice: z.number().min(0),
  currency: z.string().default('EUR'),
  taxRate: z.number().min(0).max(100).default(21),
  minStockLevel: z.number().int().min(0).default(0),
  maxStockLevel: z.number().int().min(0).optional(),
  reorderPoint: z.number().int().min(0).default(0),
  reorderQuantity: z.number().int().min(1).default(1),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional()
})

const updateProductSchema = createProductSchema.partial()

export const productsController = {
  // GET /api/v1/erp/products
  list: asyncHandler(async (req: Request, res: Response) => {
    const { orgId } = req.user!
    const { page, limit, sortBy, sortOrder } = parsePagination(req.query)
    const filters = parseFilters(req.query, [
      'sku', 'name', 'category', 'status', 'tags'
    ])

    const queryBuilder = new TenantQueryBuilder(orgId, prisma.product)
      .filter(filters)
      .search(req.query.search as string, ['sku', 'name', 'description', 'barcode'])
      .includeRelations({
        _count: {
          select: {
            inventories: true,
            invoiceItems: true,
            purchaseOrderItems: true
          }
        }
      })
      .sort(sortBy!, sortOrder!)
      .paginate(page!, limit!)

    try {
      const { data, total } = await queryBuilder.execute()
      return ApiResponse.paginated(res, data, total, page!, limit!)
    } catch (error) {
      return handlePrismaError(error, res)
    }
  }),

  // GET /api/v1/erp/products/:id
  get: asyncHandler(async (req: Request, res: Response) => {
    const { orgId } = req.user!
    const { id } = req.params

    const queryBuilder = new TenantQueryBuilder(orgId, prisma.product)
      .includeRelations({
        inventories: {
          include: {
            warehouse: {
              select: { id: true, name: true, code: true }
            }
          }
        },
        _count: {
          select: {
            inventories: true,
            invoiceItems: true,
            purchaseOrderItems: true
          }
        }
      })

    try {
      const product = await queryBuilder.findOne(id)
      
      if (!product) {
        return ApiResponse.error(res, 'Product not found', 404)
      }

      // Calculate total stock across warehouses
      const totalStock = product.inventories.reduce(
        (sum: number, inv: any) => sum + inv.quantity - inv.reservedQuantity,
        0
      )

      return ApiResponse.success(res, {
        ...product,
        totalStock,
        availableStock: totalStock
      })
    } catch (error) {
      return handlePrismaError(error, res)
    }
  }),

  // POST /api/v1/erp/products
  create: asyncHandler(async (req: Request, res: Response) => {
    const { orgId, userId } = req.user!
    const data = createProductSchema.parse(req.body)

    try {
      // Check for duplicate SKU in org
      const existing = await prisma.product.findFirst({
        where: {
          orgId,
          sku: data.sku,
          deletedAt: null
        }
      })

      if (existing) {
        return ApiResponse.error(res, 'Product with this SKU already exists', 409)
      }

      const product = await prisma.product.create({
        data: {
          ...data,
          orgId,
          createdByUserId: userId
        }
      })

      // Create initial inventory records for each warehouse
      const warehouses = await prisma.warehouse.findMany({
        where: { orgId, status: 'ACTIVE', deletedAt: null }
      })

      if (warehouses.length > 0) {
        await prisma.inventory.createMany({
          data: warehouses.map(warehouse => ({
            orgId,
            productId: product.id,
            warehouseId: warehouse.id,
            quantity: 0,
            reservedQuantity: 0,
            location: 'UNASSIGNED',
            lastStockCheck: new Date()
          }))
        })
      }

      // Create audit log
      await createAuditLog(prisma, {
        orgId,
        userId,
        action: 'CREATE',
        resource: 'product',
        resourceId: product.id,
        metadata: {
          sku: product.sku,
          name: product.name
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      })

      return ApiResponse.success(res, product, 201)
    } catch (error) {
      return handlePrismaError(error, res)
    }
  }),

  // PUT /api/v1/erp/products/:id
  update: asyncHandler(async (req: Request, res: Response) => {
    const { orgId, userId } = req.user!
    const { id } = req.params
    const data = updateProductSchema.parse(req.body)

    try {
      // Check if product exists
      const existing = await prisma.product.findFirst({
        where: { id, orgId, deletedAt: null }
      })

      if (!existing) {
        return ApiResponse.error(res, 'Product not found', 404)
      }

      // Check for duplicate SKU if SKU is being changed
      if (data.sku && data.sku !== existing.sku) {
        const duplicate = await prisma.product.findFirst({
          where: {
            orgId,
            sku: data.sku,
            deletedAt: null,
            NOT: { id }
          }
        })

        if (duplicate) {
          return ApiResponse.error(res, 'Product with this SKU already exists', 409)
        }
      }

      const product = await prisma.product.update({
        where: { id },
        data: {
          ...data,
          updatedByUserId: userId
        }
      })

      // Create audit log
      await createAuditLog(prisma, {
        orgId,
        userId,
        action: 'UPDATE',
        resource: 'product',
        resourceId: product.id,
        metadata: { changes: data },
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      })

      return ApiResponse.success(res, product)
    } catch (error) {
      return handlePrismaError(error, res)
    }
  }),

  // DELETE /api/v1/erp/products/:id
  delete: asyncHandler(async (req: Request, res: Response) => {
    const { orgId, userId } = req.user!
    const { id } = req.params

    try {
      // Check if product exists
      const existing = await prisma.product.findFirst({
        where: { id, orgId, deletedAt: null }
      })

      if (!existing) {
        return ApiResponse.error(res, 'Product not found', 404)
      }

      // Check if product has inventory
      const hasInventory = await prisma.inventory.count({
        where: {
          productId: id,
          quantity: { gt: 0 }
        }
      })

      if (hasInventory > 0) {
        return ApiResponse.error(
          res,
          'Cannot delete product with existing inventory',
          400,
          { warehouses: hasInventory }
        )
      }

      // Check for active purchase orders
      const activePOs = await prisma.purchaseOrderItem.count({
        where: {
          productId: id,
          status: { in: ['PENDING', 'PARTIAL'] },
          purchaseOrder: {
            deletedAt: null
          }
        }
      })

      if (activePOs > 0) {
        return ApiResponse.error(
          res,
          'Cannot delete product with active purchase orders',
          400,
          { activePurchaseOrders: activePOs }
        )
      }

      // Soft delete
      await prisma.product.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          status: 'DISCONTINUED',
          updatedByUserId: userId
        }
      })

      // Create audit log
      await createAuditLog(prisma, {
        orgId,
        userId,
        action: 'DELETE',
        resource: 'product',
        resourceId: id,
        metadata: {
          sku: existing.sku,
          name: existing.name
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      })

      return ApiResponse.success(res, { message: 'Product deleted successfully' })
    } catch (error) {
      return handlePrismaError(error, res)
    }
  }),

  // GET /api/v1/erp/products/:id/inventory
  getInventory: asyncHandler(async (req: Request, res: Response) => {
    const { orgId } = req.user!
    const { id } = req.params

    try {
      // Check if product exists
      const product = await prisma.product.findFirst({
        where: { id, orgId, deletedAt: null }
      })

      if (!product) {
        return ApiResponse.error(res, 'Product not found', 404)
      }

      const inventory = await prisma.inventory.findMany({
        where: {
          productId: id,
          orgId
        },
        include: {
          warehouse: {
            select: {
              id: true,
              name: true,
              code: true,
              type: true,
              status: true
            }
          },
          inventoryAdjustments: {
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
              id: true,
              type: true,
              quantity: true,
              reason: true,
              createdAt: true
            }
          }
        }
      })

      const summary = {
        totalStock: inventory.reduce((sum, inv) => sum + inv.quantity, 0),
        totalReserved: inventory.reduce((sum, inv) => sum + inv.reservedQuantity, 0),
        totalAvailable: inventory.reduce((sum, inv) => sum + (inv.quantity - inv.reservedQuantity), 0),
        warehouses: inventory.length,
        lowStock: product.minStockLevel > 0 && 
          inventory.reduce((sum, inv) => sum + inv.quantity, 0) < product.minStockLevel,
        needsReorder: product.reorderPoint > 0 &&
          inventory.reduce((sum, inv) => sum + inv.quantity, 0) <= product.reorderPoint
      }

      return ApiResponse.success(res, {
        product: {
          id: product.id,
          sku: product.sku,
          name: product.name,
          minStockLevel: product.minStockLevel,
          reorderPoint: product.reorderPoint,
          reorderQuantity: product.reorderQuantity
        },
        inventory,
        summary
      })
    } catch (error) {
      return handlePrismaError(error, res)
    }
  }),

  // POST /api/v1/erp/products/:id/adjust-inventory
  adjustInventory: asyncHandler(async (req: Request, res: Response) => {
    const { orgId, userId } = req.user!
    const { id } = req.params
    const { warehouseId, type, quantity, reason } = req.body

    const adjustmentSchema = z.object({
      warehouseId: z.string().uuid(),
      type: z.enum(['IN', 'OUT', 'ADJUSTMENT', 'DAMAGE', 'RETURN']),
      quantity: z.number().int().min(1),
      reason: z.string()
    })

    try {
      const data = adjustmentSchema.parse({ warehouseId, type, quantity, reason })

      // Check if product exists
      const product = await prisma.product.findFirst({
        where: { id, orgId, deletedAt: null }
      })

      if (!product) {
        return ApiResponse.error(res, 'Product not found', 404)
      }

      // Check if warehouse exists
      const warehouse = await prisma.warehouse.findFirst({
        where: { id: data.warehouseId, orgId, deletedAt: null }
      })

      if (!warehouse) {
        return ApiResponse.error(res, 'Warehouse not found', 404)
      }

      // Get or create inventory record
      let inventory = await prisma.inventory.findFirst({
        where: {
          productId: id,
          warehouseId: data.warehouseId,
          orgId
        }
      })

      if (!inventory) {
        inventory = await prisma.inventory.create({
          data: {
            orgId,
            productId: id,
            warehouseId: data.warehouseId,
            quantity: 0,
            reservedQuantity: 0,
            location: 'UNASSIGNED',
            lastStockCheck: new Date()
          }
        })
      }

      // Calculate new quantity
      const newQuantity = data.type === 'IN' || data.type === 'RETURN'
        ? inventory.quantity + data.quantity
        : inventory.quantity - data.quantity

      if (newQuantity < 0) {
        return ApiResponse.error(
          res,
          'Insufficient inventory for adjustment',
          400,
          { 
            current: inventory.quantity,
            requested: data.quantity,
            available: inventory.quantity - inventory.reservedQuantity
          }
        )
      }

      // Create adjustment record and update inventory in transaction
      const [adjustment, updatedInventory] = await prisma.$transaction([
        prisma.inventoryAdjustment.create({
          data: {
            orgId,
            inventoryId: inventory.id,
            type: data.type,
            quantity: data.quantity,
            previousQuantity: inventory.quantity,
            newQuantity,
            reason: data.reason,
            adjustedByUserId: userId
          }
        }),
        prisma.inventory.update({
          where: { id: inventory.id },
          data: {
            quantity: newQuantity,
            lastStockCheck: new Date()
          }
        })
      ])

      // Create audit log
      await createAuditLog(prisma, {
        orgId,
        userId,
        action: 'INVENTORY_ADJUSTMENT',
        resource: 'product',
        resourceId: id,
        metadata: {
          warehouseId: data.warehouseId,
          type: data.type,
          quantity: data.quantity,
          reason: data.reason,
          previousQuantity: inventory.quantity,
          newQuantity
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      })

      return ApiResponse.success(res, {
        adjustment,
        inventory: updatedInventory
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return ApiResponse.error(res, 'Validation error', 400, error.errors)
      }
      return handlePrismaError(error, res)
    }
  }),

  // GET /api/v1/erp/products/low-stock
  getLowStock: asyncHandler(async (req: Request, res: Response) => {
    const { orgId } = req.user!

    try {
      // Get products with inventory below minimum stock level
      const products = await prisma.product.findMany({
        where: {
          orgId,
          status: 'ACTIVE',
          deletedAt: null,
          minStockLevel: { gt: 0 }
        },
        include: {
          inventories: {
            select: {
              quantity: true,
              reservedQuantity: true,
              warehouse: {
                select: { id: true, name: true }
              }
            }
          }
        }
      })

      const lowStockProducts = products
        .map(product => {
          const totalStock = product.inventories.reduce(
            (sum, inv) => sum + inv.quantity,
            0
          )
          const availableStock = product.inventories.reduce(
            (sum, inv) => sum + (inv.quantity - inv.reservedQuantity),
            0
          )

          return {
            ...product,
            totalStock,
            availableStock,
            stockLevel: totalStock / product.minStockLevel,
            needsReorder: totalStock <= product.reorderPoint
          }
        })
        .filter(product => product.totalStock < product.minStockLevel)
        .sort((a, b) => a.stockLevel - b.stockLevel)

      return ApiResponse.success(res, {
        products: lowStockProducts,
        summary: {
          total: lowStockProducts.length,
          critical: lowStockProducts.filter(p => p.stockLevel < 0.25).length,
          warning: lowStockProducts.filter(p => p.stockLevel >= 0.25 && p.stockLevel < 0.5).length,
          needsReorder: lowStockProducts.filter(p => p.needsReorder).length
        }
      })
    } catch (error) {
      return handlePrismaError(error, res)
    }
  })
}