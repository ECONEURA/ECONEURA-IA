import { Router } from 'express'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { authenticateJWT, requirePermission } from '../../mw/auth'
import { validateRequest } from '../../mw/validate'
import { ContactSchema } from '@econeura/shared/schemas/crm'

const router = Router()
const prisma = new PrismaClient()

// GET /api/v1/crm/contacts - List contacts
router.get(
  '/',
  authenticateJWT,
  requirePermission('crm:contacts:read'),
  validateRequest({
    query: z.object({
      page: z.string().optional().transform(v => parseInt(v || '1')),
      limit: z.string().optional().transform(v => parseInt(v || '20')),
      search: z.string().optional(),
      companyId: z.string().optional(),
      status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
      sortBy: z.enum(['firstName', 'lastName', 'createdAt', 'email']).optional(),
      sortOrder: z.enum(['asc', 'desc']).optional()
    })
  }),
  async (req, res) => {
    const { page = 1, limit = 20, search, companyId, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query
    const offset = (page - 1) * limit

    const where = {
      orgId: req.user.organizationId,
      ...(companyId && { companyId }),
      ...(status && { status }),
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } }
        ]
      })
    }

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          company: {
            select: {
              id: true,
              name: true
            }
          },
          deals: {
            where: { status: 'OPEN' },
            select: {
              id: true,
              title: true,
              value: true,
              stage: true
            }
          },
          _count: {
            select: {
              deals: true,
              activities: true
            }
          }
        }
      }),
      prisma.contact.count({ where })
    ])

    res.json({
      data: contacts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  }
)

// GET /api/v1/crm/contacts/:id
router.get(
  '/:id',
  authenticateJWT,
  requirePermission('crm:contacts:read'),
  async (req, res) => {
    const contact = await prisma.contact.findFirst({
      where: {
        id: req.params.id,
        orgId: req.user.organizationId
      },
      include: {
        company: true,
        deals: {
          include: {
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
          take: 10,
          include: {
            assignedUser: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    if (!contact) {
      return res.status(404).json({
        error: 'Contact not found'
      })
    }

    res.json(contact)
  }
)

// POST /api/v1/crm/contacts
router.post(
  '/',
  authenticateJWT,
  requirePermission('crm:contacts:write'),
  validateRequest({
    body: ContactSchema.omit({ id: true, orgId: true, createdAt: true, updatedAt: true })
  }),
  async (req, res) => {
    try {
      // Check if company exists if companyId provided
      if (req.body.companyId) {
        const company = await prisma.company.findFirst({
          where: {
            id: req.body.companyId,
            orgId: req.user.organizationId
          }
        })

        if (!company) {
          return res.status(400).json({
            error: 'Company not found'
          })
        }
      }

      const contact = await prisma.contact.create({
        data: {
          ...req.body,
          orgId: req.user.organizationId
        },
        include: {
          company: {
            select: {
              id: true,
              name: true
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
          resource: 'contact',
          resourceId: contact.id,
          metadata: { 
            name: `${contact.firstName} ${contact.lastName}`,
            email: contact.email
          }
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

// PUT /api/v1/crm/contacts/:id
router.put(
  '/:id',
  authenticateJWT,
  requirePermission('crm:contacts:write'),
  validateRequest({
    body: ContactSchema.omit({ id: true, orgId: true, createdAt: true, updatedAt: true }).partial()
  }),
  async (req, res) => {
    try {
      const existing = await prisma.contact.findFirst({
        where: {
          id: req.params.id,
          orgId: req.user.organizationId
        }
      })

      if (!existing) {
        return res.status(404).json({
          error: 'Contact not found'
        })
      }

      const contact = await prisma.contact.update({
        where: { id: req.params.id },
        data: req.body,
        include: {
          company: {
            select: {
              id: true,
              name: true
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
          resource: 'contact',
          resourceId: contact.id,
          metadata: { changes: req.body }
        }
      })

      res.json(contact)
    } catch (error) {
      console.error('Error updating contact:', error)
      res.status(400).json({
        error: 'Failed to update contact'
      })
    }
  }
)

// DELETE /api/v1/crm/contacts/:id
router.delete(
  '/:id',
  authenticateJWT,
  requirePermission('crm:contacts:delete'),
  async (req, res) => {
    try {
      const contact = await prisma.contact.findFirst({
        where: {
          id: req.params.id,
          orgId: req.user.organizationId
        },
        include: {
          _count: {
            select: {
              deals: true,
              activities: true
            }
          }
        }
      })

      if (!contact) {
        return res.status(404).json({
          error: 'Contact not found'
        })
      }

      // Check for dependencies
      if (contact._count.deals > 0 || contact._count.activities > 0) {
        return res.status(400).json({
          error: 'Cannot delete contact with existing relationships',
          dependencies: {
            deals: contact._count.deals,
            activities: contact._count.activities
          }
        })
      }

      await prisma.contact.delete({
        where: { id: req.params.id }
      })

      // Log audit event
      await prisma.auditLog.create({
        data: {
          orgId: req.user.organizationId,
          userId: req.user.id,
          action: 'DELETE',
          resource: 'contact',
          resourceId: contact.id,
          metadata: { 
            name: `${contact.firstName} ${contact.lastName}`,
            email: contact.email
          }
        }
      })

      res.status(204).send()
    } catch (error) {
      console.error('Error deleting contact:', error)
      res.status(400).json({
        error: 'Failed to delete contact'
      })
    }
  }
)

export { router as contactsRouter }