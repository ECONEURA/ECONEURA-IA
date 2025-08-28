import { Router } from 'express'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { authenticateJWT, requirePermission } from '../../mw/auth'
import { validateRequest } from '../../mw/validate'
import { CompanySchema, CompanyFilterSchema } from '@econeura/shared/schemas/crm'

const router = Router()
const prisma = new PrismaClient()

// GET /api/v1/crm/companies - List companies with filters and pagination
router.get(
  '/',
  authenticateJWT,
  requirePermission('crm:companies:read'),
  validateRequest({
    query: z.object({
      page: z.string().optional().transform(v => parseInt(v || '1')),
      limit: z.string().optional().transform(v => parseInt(v || '20')),
      search: z.string().optional(),
      status: z.enum(['PROSPECT', 'LEAD', 'CUSTOMER', 'PARTNER', 'COMPETITOR', 'CHURNED']).optional(),
      industry: z.string().optional(),
      sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'status']).optional(),
      sortOrder: z.enum(['asc', 'desc']).optional()
    })
  }),
  async (req, res) => {
    const { page = 1, limit = 20, search, status, industry, sortBy = 'createdAt', sortOrder = 'desc' } = req.query
    const offset = (page - 1) * limit

    const where = {
      orgId: req.user.organizationId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(status && { status }),
      ...(industry && { industry: { contains: industry, mode: 'insensitive' } })
    }

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          contacts: { take: 5 },
          deals: { 
            where: { status: 'OPEN' },
            take: 5 
          },
          _count: {
            select: {
              contacts: true,
              deals: true,
              activities: true
            }
          }
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
  }
)

// GET /api/v1/crm/companies/:id - Get company by ID
router.get(
  '/:id',
  authenticateJWT,
  requirePermission('crm:companies:read'),
  async (req, res) => {
    const company = await prisma.company.findFirst({
      where: {
        id: req.params.id,
        orgId: req.user.organizationId
      },
      include: {
        contacts: true,
        deals: {
          include: {
            primaryContact: true,
            assignedUser: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    })

    if (!company) {
      return res.status(404).json({
        error: 'Company not found'
      })
    }

    res.json(company)
  }
)

// POST /api/v1/crm/companies - Create new company
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
          orgId: req.user.organizationId
        },
        include: {
          _count: {
            select: {
              contacts: true,
              deals: true
            }
          }
        }
      })

      // Log audit event
      await prisma.auditLog.create({
        data: {
          orgId: req.user.organizationId,
          userId: req.user.id,
          action: 'CREATE',
          resource: 'company',
          resourceId: company.id,
          metadata: { name: company.name }
        }
      })

      res.status(201).json(company)
    } catch (error) {
      console.error('Error creating company:', error)
      res.status(400).json({
        error: 'Failed to create company'
      })
    }
  }
)

// PUT /api/v1/crm/companies/:id - Update company
router.put(
  '/:id',
  authenticateJWT,
  requirePermission('crm:companies:write'),
  validateRequest({
    body: CompanySchema.omit({ id: true, orgId: true, createdAt: true, updatedAt: true }).partial()
  }),
  async (req, res) => {
    try {
      // Check if company exists and belongs to user's org
      const existing = await prisma.company.findFirst({
        where: {
          id: req.params.id,
          orgId: req.user.organizationId
        }
      })

      if (!existing) {
        return res.status(404).json({
          error: 'Company not found'
        })
      }

      const company = await prisma.company.update({
        where: { id: req.params.id },
        data: req.body,
        include: {
          _count: {
            select: {
              contacts: true,
              deals: true,
              activities: true
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
          resource: 'company',
          resourceId: company.id,
          metadata: { changes: req.body }
        }
      })

      res.json(company)
    } catch (error) {
      console.error('Error updating company:', error)
      res.status(400).json({
        error: 'Failed to update company'
      })
    }
  }
)

// DELETE /api/v1/crm/companies/:id - Delete company
router.delete(
  '/:id',
  authenticateJWT,
  requirePermission('crm:companies:delete'),
  async (req, res) => {
    try {
      // Check if company exists and has no dependencies
      const company = await prisma.company.findFirst({
        where: {
          id: req.params.id,
          orgId: req.user.organizationId
        },
        include: {
          _count: {
            select: {
              contacts: true,
              deals: true,
              invoices: true,
              payments: true
            }
          }
        }
      })

      if (!company) {
        return res.status(404).json({
          error: 'Company not found'
        })
      }

      // Check for dependencies
      const hasDependencies = 
        company._count.contacts > 0 ||
        company._count.deals > 0 ||
        company._count.invoices > 0 ||
        company._count.payments > 0

      if (hasDependencies) {
        return res.status(400).json({
          error: 'Cannot delete company with existing relationships',
          dependencies: {
            contacts: company._count.contacts,
            deals: company._count.deals,
            invoices: company._count.invoices,
            payments: company._count.payments
          }
        })
      }

      await prisma.company.delete({
        where: { id: req.params.id }
      })

      // Log audit event
      await prisma.auditLog.create({
        data: {
          orgId: req.user.organizationId,
          userId: req.user.id,
          action: 'DELETE',
          resource: 'company',
          resourceId: company.id,
          metadata: { name: company.name }
        }
      })

      res.status(204).send()
    } catch (error) {
      console.error('Error deleting company:', error)
      res.status(400).json({
        error: 'Failed to delete company'
      })
    }
  }
)

// POST /api/v1/crm/companies/:id/contacts - Add contact to company
router.post(
  '/:id/contacts',
  authenticateJWT,
  requirePermission('crm:contacts:write'),
  validateRequest({
    body: z.object({
      firstName: z.string(),
      lastName: z.string(),
      email: z.string().email(),
      phone: z.string().optional(),
      position: z.string().optional()
    })
  }),
  async (req, res) => {
    try {
      // Check if company exists
      const company = await prisma.company.findFirst({
        where: {
          id: req.params.id,
          orgId: req.user.organizationId
        }
      })

      if (!company) {
        return res.status(404).json({
          error: 'Company not found'
        })
      }

      const contact = await prisma.contact.create({
        data: {
          ...req.body,
          orgId: req.user.organizationId,
          companyId: company.id,
          status: 'ACTIVE'
        }
      })

      res.status(201).json(contact)
    } catch (error) {
      console.error('Error creating contact:', error)
      res.status(400).json({
        error: 'Failed to create contact'
      })
    }
  }
)

// GET /api/v1/crm/companies/:id/activities - Get company activities
router.get(
  '/:id/activities',
  authenticateJWT,
  requirePermission('crm:activities:read'),
  async (req, res) => {
    const activities = await prisma.activity.findMany({
      where: {
        entityType: 'COMPANY',
        entityId: req.params.id,
        orgId: req.user.organizationId
      },
      include: {
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json(activities)
  }
)

export { router as companiesRouter }