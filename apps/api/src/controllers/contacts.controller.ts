import { Request, Response } from 'express';
import { prisma } from '../services/prisma';
import { AuthRequest } from '../middleware/auth';
import { ApiError, asyncHandler } from '../middleware/error-handler';
import {
  CreateContactSchema,
  UpdateContactSchema,
  ContactQuerySchema,
  ContactParamsSchema
} from '../schemas/crm.schemas';

/**
 * Get all contacts with filtering and pagination
 */
export const getContacts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.user!;
  const pagination = req.pagination!;
  
  const query = ContactQuerySchema.parse(req.query);
  
  const where: any = { organizationId };
  
  // Add search filters
  if (query.search) {
    where.OR = [
      { firstName: { contains: query.search, mode: 'insensitive' } },
      { lastName: { contains: query.search, mode: 'insensitive' } },
      { email: { contains: query.search, mode: 'insensitive' } },
      { phone: { contains: query.search, mode: 'insensitive' } }
    ];
  }
  
  if (query.companyId) {
    where.companyId = query.companyId;
  }
  
  if (query.status) {
    where.status = query.status;
  }
  
  if (query.labels && query.labels.length > 0) {
    where.labels = {
      some: {
        labelId: { in: query.labels }
      }
    };
  }

  // Execute queries
  const [contacts, totalCount] = await Promise.all([
    prisma.contact.findMany({
      where,
      skip: pagination.offset,
      take: pagination.limit,
      orderBy: query.sortBy ? { [query.sortBy]: query.sortDir || 'asc' } : { createdAt: 'desc' },
      include: {
        company: {
          select: { id: true, name: true }
        },
        labels: {
          include: {
            label: {
              select: { id: true, name: true, color: true }
            }
          }
        },
        activities: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            type: true,
            subject: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            activities: true,
            deals: true
          }
        }
      }
    }),
    prisma.contact.count({ where })
  ]);

  const totalPages = Math.ceil(totalCount / pagination.limit);

  res.json({
    data: contacts,
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
 * Get single contact by ID
 */
export const getContact = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.user!;
  const { id } = ContactParamsSchema.parse(req.params);

  const contact = await prisma.contact.findFirst({
    where: { 
      id,
      organizationId
    },
    include: {
      company: {
        select: { id: true, name: true, website: true, industry: true }
      },
      labels: {
        include: {
          label: {
            select: { id: true, name: true, color: true }
          }
        }
      },
      activities: {
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: { id: true, firstName: true, lastName: true }
          }
        }
      },
      deals: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          value: true,
          currency: true,
          stage: true,
          probability: true,
          createdAt: true
        }
      },
      attachments: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fileName: true,
          fileSize: true,
          mimeType: true,
          createdAt: true,
          createdBy: {
            select: { id: true, firstName: true, lastName: true }
          }
        }
      },
      createdBy: {
        select: { id: true, firstName: true, lastName: true }
      },
      updatedBy: {
        select: { id: true, firstName: true, lastName: true }
      }
    }
  });

  if (!contact) {
    throw new ApiError('Contact not found', 404, 'CONTACT_NOT_FOUND');
  }

  res.json({ data: contact });
});

/**
 * Create new contact
 */
export const createContact = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId, id: userId } = req.user!;
  const contactData = CreateContactSchema.parse(req.body);

  // Check if company exists (if provided)
  if (contactData.companyId) {
    const company = await prisma.company.findFirst({
      where: { id: contactData.companyId, organizationId }
    });
    if (!company) {
      throw new ApiError('Company not found', 404, 'COMPANY_NOT_FOUND');
    }
  }

  const contact = await prisma.contact.create({
    data: {
      ...contactData,
      organizationId,
      createdById: userId,
      updatedById: userId
    },
    include: {
      company: {
        select: { id: true, name: true }
      },
      createdBy: {
        select: { id: true, firstName: true, lastName: true }
      }
    }
  });

  res.status(201).json({ 
    data: contact,
    message: 'Contact created successfully' 
  });
});

/**
 * Update existing contact
 */
export const updateContact = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId, id: userId } = req.user!;
  const { id } = ContactParamsSchema.parse(req.params);
  const updateData = UpdateContactSchema.parse(req.body);

  // Check if contact exists
  const existingContact = await prisma.contact.findFirst({
    where: { id, organizationId }
  });

  if (!existingContact) {
    throw new ApiError('Contact not found', 404, 'CONTACT_NOT_FOUND');
  }

  // Check if company exists (if provided)
  if (updateData.companyId) {
    const company = await prisma.company.findFirst({
      where: { id: updateData.companyId, organizationId }
    });
    if (!company) {
      throw new ApiError('Company not found', 404, 'COMPANY_NOT_FOUND');
    }
  }

  const contact = await prisma.contact.update({
    where: { id },
    data: {
      ...updateData,
      updatedById: userId,
      updatedAt: new Date()
    },
    include: {
      company: {
        select: { id: true, name: true }
      },
      updatedBy: {
        select: { id: true, firstName: true, lastName: true }
      }
    }
  });

  res.json({ 
    data: contact,
    message: 'Contact updated successfully' 
  });
});

/**
 * Delete contact
 */
export const deleteContact = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.user!;
  const { id } = ContactParamsSchema.parse(req.params);

  // Check if contact exists
  const contact = await prisma.contact.findFirst({
    where: { id, organizationId }
  });

  if (!contact) {
    throw new ApiError('Contact not found', 404, 'CONTACT_NOT_FOUND');
  }

  await prisma.contact.delete({
    where: { id }
  });

  res.json({ 
    message: 'Contact deleted successfully' 
  });
});

/**
 * Add labels to contact
 */
export const addContactLabels = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.user!;
  const { id } = ContactParamsSchema.parse(req.params);
  const { labelIds } = req.body;

  if (!Array.isArray(labelIds) || labelIds.length === 0) {
    throw new ApiError('Label IDs array is required', 400, 'INVALID_LABEL_IDS');
  }

  // Verify contact exists
  const contact = await prisma.contact.findFirst({
    where: { id, organizationId }
  });

  if (!contact) {
    throw new ApiError('Contact not found', 404, 'CONTACT_NOT_FOUND');
  }

  // Verify all labels exist and belong to organization
  const labels = await prisma.label.findMany({
    where: { 
      id: { in: labelIds },
      organizationId 
    }
  });

  if (labels.length !== labelIds.length) {
    throw new ApiError('One or more labels not found', 404, 'LABELS_NOT_FOUND');
  }

  // Create label associations
  const labelData = labelIds.map((labelId: string) => ({
    contactId: id,
    labelId
  }));

  await prisma.contactLabel.createMany({
    data: labelData,
    skipDuplicates: true
  });

  res.json({ 
    message: 'Labels added successfully' 
  });
});

/**
 * Remove labels from contact
 */
export const removeContactLabels = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.user!;
  const { id } = ContactParamsSchema.parse(req.params);
  const { labelIds } = req.body;

  if (!Array.isArray(labelIds) || labelIds.length === 0) {
    throw new ApiError('Label IDs array is required', 400, 'INVALID_LABEL_IDS');
  }

  // Verify contact exists
  const contact = await prisma.contact.findFirst({
    where: { id, organizationId }
  });

  if (!contact) {
    throw new ApiError('Contact not found', 404, 'CONTACT_NOT_FOUND');
  }

  await prisma.contactLabel.deleteMany({
    where: {
      contactId: id,
      labelId: { in: labelIds }
    }
  });

  res.json({ 
    message: 'Labels removed successfully' 
  });
});