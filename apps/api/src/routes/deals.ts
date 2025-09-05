import { Router } from 'express';
import { z } from 'zod';
import { 
  DealSchema, 
  CreateDealSchema, 
  UpdateDealSchema, 
  DealFilterSchema,
  MoveDealStageSchema
} from '@econeura/shared/src/schemas/crm';
import { PaginationRequestSchema } from '@econeura/shared/src/schemas/common';
import { db } from '../lib/database.js';
import { deals } from '@econeura/db/src/schema';
import { eq, and, ilike, or, gte, lte, count } from 'drizzle-orm';
import { structuredLogger } from '../lib/structured-logger.js';

const router = Router();

// GET /v1/deals - List deals with RLS
router.get('/', async (req, res) => {
  try {
    const orgId = req.headers['x-org-id'] as string;
    if (!orgId) {
      return res.status(400).json({ error: 'Missing x-org-id header' });
    }

    // Validate query parameters
    const filters = DealFilterSchema.parse(req.query);
    const pagination = PaginationRequestSchema.parse(req.query);

    // Set RLS context
    await db.execute(`SET LOCAL app.org_id = '${orgId}'`);

    // Build query with filters
    let query = db.select().from(deals);
    
    const conditions = [];
    
    if (filters.q) {
      conditions.push(
        or(
          ilike(deals.name, `%${filters.q}%`),
          ilike(deals.description, `%${filters.q}%`)
        )
      );
    }
    
    if (filters.companyId) {
      conditions.push(eq(deals.companyId, filters.companyId));
    }
    
    if (filters.contactId) {
      conditions.push(eq(deals.contactId, filters.contactId));
    }
    
    if (filters.stage) {
      conditions.push(eq(deals.stage, filters.stage));
    }
    
    if (filters.status) {
      conditions.push(eq(deals.status, filters.status));
    }
    
    if (filters.minAmount !== undefined) {
      conditions.push(gte(deals.amount, filters.minAmount));
    }
    
    if (filters.maxAmount !== undefined) {
      conditions.push(lte(deals.amount, filters.maxAmount));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply pagination
    const offset = (pagination.page - 1) * pagination.limit;
    query = query.limit(pagination.limit).offset(offset);

    const result = await query;

    // Get total count for pagination
    const totalQuery = db.select({ count: count() }).from(deals);
    if (conditions.length > 0) {
      totalQuery.where(and(...conditions));
    }
    const [{ count: total }] = await totalQuery;

    structuredLogger.info('Deals retrieved', {
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
    structuredLogger.error('Failed to retrieve deals', error as Error, {
      orgId: req.headers['x-org-id'],
      query: req.query
    });
    
    res.status(500).json({ 
      error: 'Failed to retrieve deals',
      message: (error as Error).message 
    });
  }
});

// GET /v1/deals/:id - Get single deal
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.headers['x-org-id'] as string;
    
    if (!orgId) {
      return res.status(400).json({ error: 'Missing x-org-id header' });
    }

    // Set RLS context
    await db.execute(`SET LOCAL app.org_id = '${orgId}'`);

    const [deal] = await db
      .select()
      .from(deals)
      .where(eq(deals.id, id))
      .limit(1);

    if (!deal) {
      return res.status(404).json({ 
        error: 'Deal not found',
        message: `Deal with ID ${id} not found or access denied`
      });
    }

    structuredLogger.info('Deal retrieved', { orgId, dealId: id });

    res.json({
      success: true,
      data: deal
    });

  } catch (error) {
    structuredLogger.error('Failed to retrieve deal', error as Error, {
      orgId: req.headers['x-org-id'],
      dealId: req.params.id
    });
    
    res.status(500).json({ 
      error: 'Failed to retrieve deal',
      message: (error as Error).message 
    });
  }
});

// POST /v1/deals - Create deal
router.post('/', async (req, res) => {
  try {
    const orgId = req.headers['x-org-id'] as string;
    const userId = req.headers['x-user-id'] as string;
    
    if (!orgId) {
      return res.status(400).json({ error: 'Missing x-org-id header' });
    }

    // Validate request body
    const dealData = CreateDealSchema.parse(req.body);

    // Set RLS context
    await db.execute(`SET LOCAL app.org_id = '${orgId}'`);

    const newDeal = {
      ...dealData,
      orgId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const [deal] = await db
      .insert(deals)
      .values(newDeal)
      .returning();

    structuredLogger.info('Deal created', {
      orgId,
      userId,
      dealId: deal.id,
      name: deal.name,
      amount: deal.amount,
      stage: deal.stage
    });

    res.status(201).json({
      success: true,
      data: deal
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }

    structuredLogger.error('Failed to create deal', error as Error, {
      orgId: req.headers['x-org-id'],
      userId: req.headers['x-user-id'],
      body: req.body
    });
    
    res.status(500).json({ 
      error: 'Failed to create deal',
      message: (error as Error).message 
    });
  }
});

// PUT /v1/deals/:id - Update deal
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.headers['x-org-id'] as string;
    const userId = req.headers['x-user-id'] as string;
    
    if (!orgId) {
      return res.status(400).json({ error: 'Missing x-org-id header' });
    }

    // Validate request body
    const updateData = UpdateDealSchema.parse(req.body);

    // Set RLS context
    await db.execute(`SET LOCAL app.org_id = '${orgId}'`);

    const [updatedDeal] = await db
      .update(deals)
      .set({
        ...updateData,
        updatedAt: new Date().toISOString()
      })
      .where(eq(deals.id, id))
      .returning();

    if (!updatedDeal) {
      return res.status(404).json({ 
        error: 'Deal not found',
        message: `Deal with ID ${id} not found or access denied`
      });
    }

    structuredLogger.info('Deal updated', {
      orgId,
      userId,
      dealId: id,
      changes: updateData
    });

    res.json({
      success: true,
      data: updatedDeal
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }

    structuredLogger.error('Failed to update deal', error as Error, {
      orgId: req.headers['x-org-id'],
      userId: req.headers['x-user-id'],
      dealId: req.params.id,
      body: req.body
    });
    
    res.status(500).json({ 
      error: 'Failed to update deal',
      message: (error as Error).message 
    });
  }
});

// POST /v1/deals/:id/move-stage - Move deal to different stage
router.post('/:id/move-stage', async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.headers['x-org-id'] as string;
    const userId = req.headers['x-user-id'] as string;
    
    if (!orgId) {
      return res.status(400).json({ error: 'Missing x-org-id header' });
    }

    // Validate request body
    const { stage, reason } = MoveDealStageSchema.parse(req.body);

    // Set RLS context
    await db.execute(`SET LOCAL app.org_id = '${orgId}'`);

    // Update deal stage with audit trail
    const updateData: any = {
      stage,
      updatedAt: new Date().toISOString()
    };

    // Add stage-specific timestamps
    if (stage === 'closed_won') {
      updateData.closedAt = new Date().toISOString();
      updateData.status = 'won';
    } else if (stage === 'closed_lost') {
      updateData.closedAt = new Date().toISOString();
      updateData.status = 'lost';
      if (reason) {
        updateData.lostReason = reason;
      }
    }

    const [updatedDeal] = await db
      .update(deals)
      .set(updateData)
      .where(eq(deals.id, id))
      .returning();

    if (!updatedDeal) {
      return res.status(404).json({ 
        error: 'Deal not found',
        message: `Deal with ID ${id} not found or access denied`
      });
    }

    structuredLogger.info('Deal stage moved', {
      orgId,
      userId,
      dealId: id,
      newStage: stage,
      previousStage: updatedDeal.stage,
      reason
    });

    res.json({
      success: true,
      data: updatedDeal
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }

    structuredLogger.error('Failed to move deal stage', error as Error, {
      orgId: req.headers['x-org-id'],
      userId: req.headers['x-user-id'],
      dealId: req.params.id,
      body: req.body
    });
    
    res.status(500).json({ 
      error: 'Failed to move deal stage',
      message: (error as Error).message 
    });
  }
});

// DELETE /v1/deals/:id - Delete deal (soft delete)
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

    const [deletedDeal] = await db
      .update(deals)
      .set({
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .where(eq(deals.id, id))
      .returning();

    if (!deletedDeal) {
      return res.status(404).json({ 
        error: 'Deal not found',
        message: `Deal with ID ${id} not found or access denied`
      });
    }

    structuredLogger.info('Deal deleted', {
      orgId,
      userId,
      dealId: id,
      name: deletedDeal.name
    });

    res.status(204).send();

  } catch (error) {
    structuredLogger.error('Failed to delete deal', error as Error, {
      orgId: req.headers['x-org-id'],
      userId: req.headers['x-user-id'],
      dealId: req.params.id
    });
    
    res.status(500).json({ 
      error: 'Failed to delete deal',
      message: (error as Error).message 
    });
  }
});

export { router as dealsRouter };
