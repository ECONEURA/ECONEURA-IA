import { Router } from 'express';
import { z } from 'zod';
import {
  CompanySchema,
  CreateCompanySchema,
  UpdateCompanySchema,
  CompanyFilterSchema
} from '@econeura/shared/src/schemas/crm';
import { PaginationRequestSchema } from '@econeura/shared/src/schemas/common';
import { db, setRLSContext } from '../lib/database.js';
import { structuredLogger } from '../lib/structured-logger.js';

const router = Router();

// GET /v1/companies - List companies with RLS
router.get('/', async (req, res) => {
  try {
    const orgId = req.headers['x-org-id'] as string;
    if (!orgId) {
      return res.status(400).json({ error: 'Missing x-org-id header' });
    }

    // Validate query parameters
    const filters = CompanyFilterSchema.parse(req.query);
    const pagination = PaginationRequestSchema.parse(req.query);

    // Set RLS context
    await setRLSContext(orgId);

    // Build Prisma query with filters
    const where: any = { deletedAt: null };

    if (filters.q) {
      where.OR = [
        { name: { contains: filters.q, mode: 'insensitive' } },
        { email: { contains: filters.q, mode: 'insensitive' } }
      ];
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.industry) {
      where.industry = filters.industry;
    }

    // Apply pagination
    const skip = (pagination.page - 1) * pagination.limit;

    const [result, total] = await Promise.all([
      db.company.findMany({
        where,
        skip,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' }
      }),
      db.company.count({ where })
    ]);

    structuredLogger.info('Companies retrieved', {
      orgId,
      count: result.length,
      total,
      filters
    });

    res.json({
      success: true,
      data: result,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit)
      }
    });

  } catch (error) {
    structuredLogger.error('Failed to retrieve companies', error as Error, {
      orgId: req.headers['x-org-id'],
      query: req.query
    });

    res.status(500).json({
      error: 'Failed to retrieve companies',
      message: (error as Error).message
    });
  }
});

// GET /v1/companies/:id - Get single company
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.headers['x-org-id'] as string;

    if (!orgId) {
      return res.status(400).json({ error: 'Missing x-org-id header' });
    }

    // Set RLS context
    await db.execute(`SET LOCAL app.org_id = '${orgId}'`);

    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, id))
      .limit(1);

    if (!company) {
      return res.status(404).json({
        error: 'Company not found',
        message: `Company with ID ${id} not found or access denied`
      });
    }

    structuredLogger.info('Company retrieved', { orgId, companyId: id });

    res.json({
      success: true,
      data: company
    });

  } catch (error) {
    structuredLogger.error('Failed to retrieve company', error as Error, {
      orgId: req.headers['x-org-id'],
      companyId: req.params.id
    });

    res.status(500).json({
      error: 'Failed to retrieve company',
      message: (error as Error).message
    });
  }
});

// POST /v1/companies - Create company
router.post('/', async (req, res) => {
  try {
    const orgId = req.headers['x-org-id'] as string;
    const userId = req.headers['x-user-id'] as string;

    if (!orgId) {
      return res.status(400).json({ error: 'Missing x-org-id header' });
    }

    // Validate request body
    const companyData = CreateCompanySchema.parse(req.body);

    // Set RLS context
    await db.execute(`SET LOCAL app.org_id = '${orgId}'`);

    const newCompany = {
      ...companyData,
      orgId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const [company] = await db
      .insert(companies)
      .values(newCompany)
      .returning();

    structuredLogger.info('Company created', {
      orgId,
      userId,
      companyId: company.id,
      name: company.name
    });

    res.status(201).json({
      success: true,
      data: company
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }

    structuredLogger.error('Failed to create company', error as Error, {
      orgId: req.headers['x-org-id'],
      userId: req.headers['x-user-id'],
      body: req.body
    });

    res.status(500).json({
      error: 'Failed to create company',
      message: (error as Error).message
    });
  }
});

// PUT /v1/companies/:id - Update company
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.headers['x-org-id'] as string;
    const userId = req.headers['x-user-id'] as string;

    if (!orgId) {
      return res.status(400).json({ error: 'Missing x-org-id header' });
    }

    // Validate request body
    const updateData = UpdateCompanySchema.parse(req.body);

    // Set RLS context
    await db.execute(`SET LOCAL app.org_id = '${orgId}'`);

    const [updatedCompany] = await db
      .update(companies)
      .set({
        ...updateData,
        updatedAt: new Date().toISOString()
      })
      .where(eq(companies.id, id))
      .returning();

    if (!updatedCompany) {
      return res.status(404).json({
        error: 'Company not found',
        message: `Company with ID ${id} not found or access denied`
      });
    }

    structuredLogger.info('Company updated', {
      orgId,
      userId,
      companyId: id,
      changes: updateData
    });

    res.json({
      success: true,
      data: updatedCompany
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }

    structuredLogger.error('Failed to update company', error as Error, {
      orgId: req.headers['x-org-id'],
      userId: req.headers['x-user-id'],
      companyId: req.params.id,
      body: req.body
    });

    res.status(500).json({
      error: 'Failed to update company',
      message: (error as Error).message
    });
  }
});

// DELETE /v1/companies/:id - Delete company (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.headers['x-org-id'] as string;
    const userId = req.headers['x-user-id'] as string;

    if (!orgId) {
      return res.status(400).json({ error: 'Missing x-org-id header' });
    }

    // Set RLS context
    await db.execute(`SET LOCAL app.org_id = '${orgId}'`);

    const [deletedCompany] = await db
      .update(companies)
      .set({
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .where(eq(companies.id, id))
      .returning();

    if (!deletedCompany) {
      return res.status(404).json({
        error: 'Company not found',
        message: `Company with ID ${id} not found or access denied`
      });
    }

    structuredLogger.info('Company deleted', {
      orgId,
      userId,
      companyId: id,
      name: deletedCompany.name
    });

    res.status(204).send();

  } catch (error) {
    structuredLogger.error('Failed to delete company', error as Error, {
      orgId: req.headers['x-org-id'],
      userId: req.headers['x-user-id'],
      companyId: req.params.id
    });

    res.status(500).json({
      error: 'Failed to delete company',
      message: (error as Error).message
    });
  }
});

export { router as companiesRouter };
