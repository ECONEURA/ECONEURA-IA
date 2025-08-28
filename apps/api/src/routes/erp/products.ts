import { Router } from 'express'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { authenticateJWT, requirePermission } from '../../mw/auth'
import { validateRequest } from '../../mw/validate'
import { ProductSchema } from '@econeura/shared/schemas/erp'

const router = Router()
const prisma = new PrismaClient()

// GET /api/v1/erp/products - List products
router.get(
  '/',
  authenticateJWT,
  requirePermission('erp:products:read'),
  validateRequest({
    query: z.object({
      page: z.string().optional().transform(v => parseInt(v || '1')),
      limit: z.string().optional().transform(v => parseInt(v || '20')),
      search: z.string().optional(),
      category: z.string().optional(),
      status: z.enum(['ACTIVE', 'INACTIVE', 'DISCONTINUED']).optional(),
      minStock: z.string().optional().transform(v => v ? parseInt(v) : undefined),
      maxStock: z.string().optional().transform(v => v ? parseInt(v) : undefined),
      sortBy: z.enum(['name', 'sku', 'costPrice', 'sellingPrice', 'createdAt']).optional(),
      sortOrder: z.enum(['asc', 'desc']).optional()
    })
  }),
  async (req, res) => {
    const { 
      page = 1, 
      limit = 20, 
      search,
      category,
      status,
      minStock,
      maxStock,
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query
    
    const offset = (page - 1) * limit

    const where = {
      orgId: req.user.organizationId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
          { barcode: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(category && { category }),
      ...(status && { status })
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          inventories: {
            include: {
              warehouse: {
                select: {
                  id: true,
                  name: true,
                  code: true
                }
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
        }
      }),
      prisma.product.count({ where })
    ])

    // Filter by stock levels if requested
    let filteredProducts = products
    if (minStock !== undefined || maxStock !== undefined) {
      filteredProducts = products.filter(product => {
        const totalStock = product.inventories.reduce((sum, inv) => sum + inv.quantity, 0)
        if (minStock !== undefined && totalStock < minStock) return false
        if (maxStock !== undefined && totalStock > maxStock) return false
        return true
      })
    }

    // Calculate inventory metrics
    const productsWithMetrics = filteredProducts.map(product => {
      const totalStock = product.inventories.reduce((sum, inv) => sum + inv.quantity, 0)
      const totalReserved = product.inventories.reduce((sum, inv) => sum + inv.reservedQuantity, 0)
      const availableStock = totalStock - totalReserved
      
      return {
        ...product,
        metrics: {
          totalStock,
          totalReserved,
          availableStock,
          stockValue: totalStock * product.costPrice,
          needsReorder: availableStock <= product.reorderPoint
        }
      }
    })

    res.json({
      data: productsWithMetrics,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  }
)

// GET /api/v1/erp/products/:id
router.get(
  '/:id',
  authenticateJWT,
  requirePermission('erp:products:read'),
  async (req, res) => {
    const product = await prisma.product.findFirst({
      where: {
        id: req.params.id,
        orgId: req.user.organizationId
      },
      include: {
        inventories: {
          include: {
            warehouse: true,
            adjustments: {
              orderBy: { createdAt: 'desc' },
              take: 10
            }
          }
        },
        purchaseOrderItems: {
          include: {
            purchaseOrder: {
              include: {
                supplier: {
                  select: {
                    id: true,
                    name: true,
                    code: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        invoiceItems: {
          include: {
            invoice: {
              select: {
                id: true,
                invoiceNumber: true,
                status: true,
                issueDate: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    })

    if (!product) {
      return res.status(404).json({
        error: 'Product not found'
      })
    }

    // Calculate metrics
    const totalStock = product.inventories.reduce((sum, inv) => sum + inv.quantity, 0)
    const totalReserved = product.inventories.reduce((sum, inv) => sum + inv.reservedQuantity, 0)
    const availableStock = totalStock - totalReserved
    
    res.json({
      ...product,
      metrics: {
        totalStock,
        totalReserved,
        availableStock,
        stockValue: totalStock * product.costPrice,
        needsReorder: availableStock <= product.reorderPoint,
        warehouseDistribution: product.inventories.map(inv => ({
          warehouseId: inv.warehouseId,
          warehouseName: inv.warehouse.name,
          quantity: inv.quantity,
          reserved: inv.reservedQuantity,
          available: inv.quantity - inv.reservedQuantity,
          location: inv.location,
          lastStockCheck: inv.lastStockCheck
        }))
      }
    })
  }
)

// POST /api/v1/erp/products
router.post(
  '/',
  authenticateJWT,
  requirePermission('erp:products:write'),
  validateRequest({
    body: ProductSchema.omit({ id: true, orgId: true, createdAt: true, updatedAt: true })
  }),
  async (req, res) => {
    try {
      // Check if SKU already exists
      const existing = await prisma.product.findFirst({
        where: {
          orgId: req.user.organizationId,
          sku: req.body.sku
        }
      })

      if (existing) {
        return res.status(400).json({
          error: 'Product with this SKU already exists'
        })
      }

      const product = await prisma.product.create({
        data: {
          ...req.body,
          orgId: req.user.organizationId
        }
      })

      // Create initial inventory entries for all warehouses if requested
      if (req.body.createInventory) {
        const warehouses = await prisma.warehouse.findMany({
          where: {
            orgId: req.user.organizationId,
            status: 'ACTIVE'
          }
        })

        for (const warehouse of warehouses) {
          await prisma.inventory.create({
            data: {
              orgId: req.user.organizationId,
              productId: product.id,
              warehouseId: warehouse.id,
              quantity: 0,
              reservedQuantity: 0,
              location: 'UNASSIGNED'
            }
          })
        }
      }

      // Log audit event
      await prisma.auditLog.create({
        data: {
          orgId: req.user.organizationId,
          userId: req.user.id,
          action: 'CREATE',
          resource: 'product',
          resourceId: product.id,
          metadata: { 
            sku: product.sku,
            name: product.name
          }
        }
      })

      res.status(201).json(product)
    } catch (error) {
      console.error('Error creating product:', error)
      res.status(400).json({
        error: 'Failed to create product'
      })
    }
  }
)

// PUT /api/v1/erp/products/:id
router.put(
  '/:id',
  authenticateJWT,
  requirePermission('erp:products:write'),
  validateRequest({
    body: ProductSchema.omit({ id: true, orgId: true, createdAt: true, updatedAt: true }).partial()
  }),
  async (req, res) => {
    try {
      const existing = await prisma.product.findFirst({
        where: {
          id: req.params.id,
          orgId: req.user.organizationId
        }
      })

      if (!existing) {
        return res.status(404).json({
          error: 'Product not found'
        })
      }

      // Check SKU uniqueness if changing
      if (req.body.sku && req.body.sku !== existing.sku) {
        const skuExists = await prisma.product.findFirst({
          where: {
            orgId: req.user.organizationId,
            sku: req.body.sku,
            id: { not: req.params.id }
          }
        })

        if (skuExists) {
          return res.status(400).json({
            error: 'Product with this SKU already exists'
          })
        }
      }

      const product = await prisma.product.update({
        where: { id: req.params.id },
        data: req.body,
        include: {
          inventories: {
            include: {
              warehouse: {
                select: {
                  id: true,
                  name: true,
                  code: true
                }
              }
            }
          }
        }
      })

      // Log audit event
      await prisma.auditLog.create({
        data: {
          orgId: req.user.organizationId,
          userId: req.user.id,
          action: 'UPDATE',
          resource: 'product',
          resourceId: product.id,
          metadata: { changes: req.body }
        }
      })

      res.json(product)
    } catch (error) {
      console.error('Error updating product:', error)
      res.status(400).json({
        error: 'Failed to update product'
      })
    }
  }
)

// DELETE /api/v1/erp/products/:id
router.delete(
  '/:id',
  authenticateJWT,
  requirePermission('erp:products:delete'),
  async (req, res) => {
    try {
      const product = await prisma.product.findFirst({
        where: {
          id: req.params.id,
          orgId: req.user.organizationId
        },
        include: {
          _count: {
            select: {
              inventories: true,
              invoiceItems: true,
              purchaseOrderItems: true
            }
          }
        }
      })

      if (!product) {
        return res.status(404).json({
          error: 'Product not found'
        })
      }

      // Check for dependencies
      const hasDependencies = 
        product._count.inventories > 0 ||
        product._count.invoiceItems > 0 ||
        product._count.purchaseOrderItems > 0

      if (hasDependencies) {
        return res.status(400).json({
          error: 'Cannot delete product with existing relationships',
          dependencies: {
            inventories: product._count.inventories,
            invoiceItems: product._count.invoiceItems,
            purchaseOrderItems: product._count.purchaseOrderItems
          }
        })
      }

      await prisma.product.delete({
        where: { id: req.params.id }
      })

      // Log audit event
      await prisma.auditLog.create({
        data: {
          orgId: req.user.organizationId,
          userId: req.user.id,
          action: 'DELETE',
          resource: 'product',
          resourceId: product.id,
          metadata: { 
            sku: product.sku,
            name: product.name
          }
        }
      })

      res.status(204).send()
    } catch (error) {
      console.error('Error deleting product:', error)
      res.status(400).json({
        error: 'Failed to delete product'
      })
    }
  }
)

// POST /api/v1/erp/products/:id/adjust-stock
router.post(
  '/:id/adjust-stock',
  authenticateJWT,
  requirePermission('erp:inventory:write'),
  validateRequest({
    body: z.object({
      warehouseId: z.string(),
      adjustmentType: z.enum(['IN', 'OUT', 'CORRECTION', 'DAMAGE', 'RETURN']),
      quantity: z.number().positive(),
      reason: z.string(),
      reference: z.string().optional()
    })
  }),
  async (req, res) => {
    try {
      const product = await prisma.product.findFirst({
        where: {
          id: req.params.id,
          orgId: req.user.organizationId
        }
      })

      if (!product) {
        return res.status(404).json({
          error: 'Product not found'
        })
      }

      // Find or create inventory record
      let inventory = await prisma.inventory.findFirst({
        where: {
          productId: product.id,
          warehouseId: req.body.warehouseId,
          orgId: req.user.organizationId
        }
      })

      if (!inventory) {
        inventory = await prisma.inventory.create({
          data: {
            orgId: req.user.organizationId,
            productId: product.id,
            warehouseId: req.body.warehouseId,
            quantity: 0,
            reservedQuantity: 0,
            location: 'UNASSIGNED'
          }
        })
      }

      // Calculate new quantity
      let newQuantity = inventory.quantity
      if (req.body.adjustmentType === 'IN' || req.body.adjustmentType === 'RETURN') {
        newQuantity += req.body.quantity
      } else if (req.body.adjustmentType === 'OUT' || req.body.adjustmentType === 'DAMAGE') {
        newQuantity -= req.body.quantity
      } else if (req.body.adjustmentType === 'CORRECTION') {
        newQuantity = req.body.quantity
      }

      if (newQuantity < 0) {
        return res.status(400).json({
          error: 'Insufficient stock for this adjustment'
        })
      }

      // Update inventory
      const updatedInventory = await prisma.inventory.update({
        where: { id: inventory.id },
        data: {
          quantity: newQuantity,
          lastStockCheck: new Date()
        }
      })

      // Create adjustment record
      const adjustment = await prisma.inventoryAdjustment.create({
        data: {
          orgId: req.user.organizationId,
          inventoryId: inventory.id,
          adjustmentType: req.body.adjustmentType,
          quantity: req.body.quantity,
          previousQuantity: inventory.quantity,
          newQuantity,
          reason: req.body.reason,
          reference: req.body.reference,
          performedByUserId: req.user.id
        }
      })

      res.json({
        inventory: updatedInventory,
        adjustment
      })
    } catch (error) {
      console.error('Error adjusting stock:', error)
      res.status(400).json({
        error: 'Failed to adjust stock'
      })
    }
  }
)

export { router as productsRouter }