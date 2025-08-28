import { Router } from 'express'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { authenticateJWT, requirePermission } from '../../mw/auth'
import { validateRequest } from '../../mw/validate'
import { ProductSchema } from '@econeura/shared/schemas/erp'

const router = Router()
const prisma = new PrismaClient()

// GET /api/v1/erp/products
router.get(
  '/',
  authenticateJWT,
  requirePermission('erp:products:read'),
  validateRequest({
    query: z.object({
      page: z.string().regex(/^\d+$/).transform(Number).default('1'),
      limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
      search: z.string().optional(),
      category: z.string().optional(),
      status: z.enum(['ACTIVE', 'INACTIVE', 'DISCONTINUED']).optional(),
      lowStock: z.string().transform(val => val === 'true').optional(),
      sortBy: z.enum(['name', 'sku', 'sellingPrice', 'createdAt']).default('name'),
      sortOrder: z.enum(['asc', 'desc']).default('asc')
    })
  }),
  async (req, res) => {
    try {
      const { page, limit, search, category, status, lowStock, sortBy, sortOrder } = req.query as any
      const offset = (page - 1) * limit

      const where: any = {
        orgId: req.user!.organizationId,
        deletedAt: null
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
          { barcode: { contains: search, mode: 'insensitive' } }
        ]
      }

      if (category) where.category = category
      if (status) where.status = status

      let products = await prisma.product.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          inventories: {
            include: {
              warehouse: true
            }
          }
        }
      })

      // Calculate total stock for each product
      products = products.map(product => {
        const totalStock = product.inventories.reduce((sum, inv) => sum + inv.quantity, 0)
        const availableStock = product.inventories.reduce((sum, inv) => sum + (inv.quantity - inv.reservedQuantity), 0)
        return {
          ...product,
          totalStock,
          availableStock,
          isLowStock: totalStock <= product.minStockLevel
        }
      })

      // Filter by low stock if requested
      if (lowStock === true) {
        products = products.filter(p => p.isLowStock)
      }

      const total = await prisma.product.count({ where })

      res.json({
        data: products,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      })
    } catch (error) {
      console.error('Error fetching products:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /api/v1/erp/products/low-stock
router.get(
  '/low-stock',
  authenticateJWT,
  requirePermission('erp:products:read'),
  async (req, res) => {
    try {
      const products = await prisma.product.findMany({
        where: {
          orgId: req.user!.organizationId,
          status: 'ACTIVE',
          deletedAt: null
        },
        include: {
          inventories: true
        }
      })

      const lowStockProducts = products
        .map(product => {
          const totalStock = product.inventories.reduce((sum, inv) => sum + inv.quantity, 0)
          return {
            id: product.id,
            sku: product.sku,
            name: product.name,
            totalStock,
            minStockLevel: product.minStockLevel,
            reorderPoint: product.reorderPoint,
            reorderQuantity: product.reorderQuantity,
            shortage: product.minStockLevel - totalStock
          }
        })
        .filter(p => p.totalStock <= p.minStockLevel)
        .sort((a, b) => b.shortage - a.shortage)

      res.json(lowStockProducts)
    } catch (error) {
      console.error('Error fetching low stock products:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /api/v1/erp/products/:id
router.get(
  '/:id',
  authenticateJWT,
  requirePermission('erp:products:read'),
  async (req, res) => {
    try {
      const product = await prisma.product.findFirst({
        where: {
          id: req.params.id,
          orgId: req.user!.organizationId,
          deletedAt: null
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
                  supplier: true
                }
              }
            },
            where: {
              purchaseOrder: {
                deletedAt: null
              }
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 10
          }
        }
      })

      if (!product) {
        return res.status(404).json({ error: 'Product not found' })
      }

      // Calculate stock metrics
      const totalStock = product.inventories.reduce((sum, inv) => sum + inv.quantity, 0)
      const availableStock = product.inventories.reduce((sum, inv) => sum + (inv.quantity - inv.reservedQuantity), 0)
      const reservedStock = product.inventories.reduce((sum, inv) => sum + inv.reservedQuantity, 0)

      res.json({
        ...product,
        stockMetrics: {
          totalStock,
          availableStock,
          reservedStock,
          isLowStock: totalStock <= product.minStockLevel,
          needsReorder: totalStock <= product.reorderPoint
        }
      })
    } catch (error) {
      console.error('Error fetching product:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
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
      // Check for duplicate SKU
      const existing = await prisma.product.findFirst({
        where: {
          orgId: req.user!.organizationId,
          sku: req.body.sku
        }
      })

      if (existing) {
        return res.status(409).json({ error: 'Product with this SKU already exists' })
      }

      const product = await prisma.product.create({
        data: {
          ...req.body,
          orgId: req.user!.organizationId
        }
      })

      // Audit log
      await prisma.auditLog.create({
        data: {
          orgId: req.user!.organizationId,
          userId: req.user!.id,
          action: 'CREATE',
          resource: 'product',
          resourceId: product.id,
          metadata: { product: product.name, sku: product.sku }
        }
      })

      res.status(201).json(product)
    } catch (error) {
      console.error('Error creating product:', error)
      res.status(500).json({ error: 'Internal server error' })
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
          orgId: req.user!.organizationId,
          deletedAt: null
        }
      })

      if (!existing) {
        return res.status(404).json({ error: 'Product not found' })
      }

      // Check for duplicate SKU if SKU is being changed
      if (req.body.sku && req.body.sku !== existing.sku) {
        const duplicate = await prisma.product.findFirst({
          where: {
            orgId: req.user!.organizationId,
            sku: req.body.sku,
            id: { not: req.params.id }
          }
        })

        if (duplicate) {
          return res.status(409).json({ error: 'Product with this SKU already exists' })
        }
      }

      const product = await prisma.product.update({
        where: { id: req.params.id },
        data: req.body
      })

      // Audit log
      await prisma.auditLog.create({
        data: {
          orgId: req.user!.organizationId,
          userId: req.user!.id,
          action: 'UPDATE',
          resource: 'product',
          resourceId: product.id,
          metadata: { changes: req.body }
        }
      })

      res.json(product)
    } catch (error) {
      console.error('Error updating product:', error)
      res.status(500).json({ error: 'Internal server error' })
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
      const existing = await prisma.product.findFirst({
        where: {
          id: req.params.id,
          orgId: req.user!.organizationId,
          deletedAt: null
        },
        include: {
          inventories: true
        }
      })

      if (!existing) {
        return res.status(404).json({ error: 'Product not found' })
      }

      // Check if product has stock
      const hasStock = existing.inventories.some(inv => inv.quantity > 0)
      if (hasStock) {
        return res.status(400).json({ error: 'Cannot delete product with existing stock' })
      }

      // Soft delete
      await prisma.product.update({
        where: { id: req.params.id },
        data: { deletedAt: new Date() }
      })

      // Audit log
      await prisma.auditLog.create({
        data: {
          orgId: req.user!.organizationId,
          userId: req.user!.id,
          action: 'DELETE',
          resource: 'product',
          resourceId: req.params.id,
          metadata: { product: existing.name, sku: existing.sku }
        }
      })

      res.status(204).send()
    } catch (error) {
      console.error('Error deleting product:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export { router as productsRouter }