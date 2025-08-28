import { Router } from 'express'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { authenticateJWT, requirePermission } from '../../mw/auth'
import { validateRequest } from '../../mw/validate'
import { CompanySchema, CompanyFilterSchema } from '@econeura/shared/schemas/crm'

const router = Router()
const prisma = new PrismaClient()

// GET /api/v1/crm/companies
router.get(
  '/',
  authenticateJWT,
  requirePermission('crm:companies:read'),
  validateRequest({
    query: z.object({
      page: z.string().regex(/^\d+$/).transform(Number).default('1'),
      limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
      search: z.string().optional(),
      status: z.enum(['PROSPECT', 'LEAD', 'CUSTOMER', 'PARTNER', 'COMPETITOR', 'CHURNED']).optional(),
      industry: z.string().optional(),
      sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'employees']).default('createdAt'),
      sortOrder: z.enum(['asc', 'desc']).default('desc')
    })
  }),
  async (req, res) => {
    try {
      const { page, limit, search, status, industry, sortBy, sortOrder } = req.query as any
      const offset = (page - 1) * limit

      const where: any = {
        orgId: req.user!.organizationId,
        deletedAt: null
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { taxId: { contains: search, mode: 'insensitive' } }
        ]
      }

      if (status) where.status = status
      if (industry) where.industry = industry

      const [companies, total] = await Promise.all([
        prisma.company.findMany({
          where,
          skip: offset,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          include: {
            contacts: { where: { deletedAt: null } },
            deals: { where: { deletedAt: null } }
          }
        }),
        prisma.company.count({ where })
      ])

      res.json({
        data: companies,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      })
    } catch (error) {
      console.error('Error fetching companies:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /api/v1/crm/companies/:id
router.get(
  '/:id',
  authenticateJWT,
  requirePermission('crm:companies:read'),
  async (req, res) => {
    try {
      const company = await prisma.company.findFirst({
        where: {
          id: req.params.id,
          orgId: req.user!.organizationId,
          deletedAt: null
        },
        include: {
          contacts: { where: { deletedAt: null } },
          deals: { where: { deletedAt: null } },
          activities: {
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' },
            take: 10
          },
          invoices: {
            where: { deletedAt: null },
            orderBy: { issueDate: 'desc' },
            take: 10
          }
        }
      })

      if (!company) {
        return res.status(404).json({ error: 'Company not found' })
      }

      res.json(company)
    } catch (error) {
      console.error('Error fetching company:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /api/v1/crm/companies
router.post(
  '/',
  authenticateJWT,
  requirePermission('crm:companies:write'),
  validateRequest({
    body: CompanySchema.omit({ id: true, orgId: true, createdAt: true, updatedAt: true })
  }),
  async (req, res) => {
    try {
      const company = await prisma.company.create({
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
          resource: 'company',
          resourceId: company.id,
          metadata: { company: company.name }
        }
      })

      res.status(201).json(company)
    } catch (error) {
      console.error('Error creating company:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// PUT /api/v1/crm/companies/:id
router.put(
  '/:id',
  authenticateJWT,
  requirePermission('crm:companies:write'),
  validateRequest({
    body: CompanySchema.omit({ id: true, orgId: true, createdAt: true, updatedAt: true }).partial()
  }),
  async (req, res) => {
    try {
      const existing = await prisma.company.findFirst({
        where: {
          id: req.params.id,
          orgId: req.user!.organizationId,
          deletedAt: null
        }
      })

      if (!existing) {
        return res.status(404).json({ error: 'Company not found' })
      }

      const company = await prisma.company.update({
        where: { id: req.params.id },
        data: req.body
      })

      // Audit log
      await prisma.auditLog.create({
        data: {
          orgId: req.user!.organizationId,
          userId: req.user!.id,
          action: 'UPDATE',
          resource: 'company',
          resourceId: company.id,
          metadata: { changes: req.body }
        }
      })

      res.json(company)
    } catch (error) {
      console.error('Error updating company:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// DELETE /api/v1/crm/companies/:id
router.delete(
  '/:id',
  authenticateJWT,
  requirePermission('crm:companies:delete'),
  async (req, res) => {
    try {
      const existing = await prisma.company.findFirst({
        where: {
          id: req.params.id,
          orgId: req.user!.organizationId,
          deletedAt: null
        }
      })

      if (!existing) {
        return res.status(404).json({ error: 'Company not found' })
      }

      // Soft delete
      await prisma.company.update({
        where: { id: req.params.id },
        data: { deletedAt: new Date() }
      })

      // Audit log
      await prisma.auditLog.create({
        data: {
          orgId: req.user!.organizationId,
          userId: req.user!.id,
          action: 'DELETE',
          resource: 'company',
          resourceId: req.params.id,
          metadata: { company: existing.name }
        }
      })

      res.status(204).send()
    } catch (error) {
      console.error('Error deleting company:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /api/v1/crm/companies/:id/tags
router.post(
  '/:id/tags',
  authenticateJWT,
  requirePermission('crm:companies:write'),
  validateRequest({
    body: z.object({
      tags: z.array(z.string())
    })
  }),
  async (req, res) => {
    try {
      const company = await prisma.company.findFirst({
        where: {
          id: req.params.id,
          orgId: req.user!.organizationId,
          deletedAt: null
        }
      })

      if (!company) {
        return res.status(404).json({ error: 'Company not found' })
      }

      const updated = await prisma.company.update({
        where: { id: req.params.id },
        data: {
          tags: {
            set: [...new Set([...company.tags, ...req.body.tags])]
          }
        }
      })

      res.json(updated)
    } catch (error) {
      console.error('Error adding tags:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export { router as companiesRouter }