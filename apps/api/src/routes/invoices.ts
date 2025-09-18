import { Router } from 'express';
import { z } from 'zod';
import { 
  InvoiceSchema, 
  CreateInvoiceSchema, 
  UpdateInvoiceSchema, 
  InvoiceFilterSchema 
} from '@econeura/shared/src/schemas/finance';
import { PaginationRequestSchema } from '@econeura/shared/src/schemas/common';
import { db } from '../lib/database.js';
import { invoices } from '@econeura/db/src/schema';
import { eq, and, ilike, or, gte, lte, count } from 'drizzle-orm';
import { structuredLogger } from '../lib/structured-logger.js';

const router = Router();

// GET /v1/invoices - List invoices with RLS
router.get('/', async (req, res) => {
  try {
    const orgId = req.headers['x-org-id'] as string;
    if (!orgId) {
      return res.status(400).json({ error: 'Missing x-org-id header' });
    }

    // Validate query parameters
    const filters = InvoiceFilterSchema.parse(req.query);
    const pagination = PaginationRequestSchema.parse(req.query);

    // Set RLS context
    await db.execute(`SET LOCAL app.org_id = '${orgId}'`);

    // Build query with filters
    let query = db.select().from(invoices);
    
    const conditions = [];
    
    if (filters.q) {
      conditions.push(
        or(
          ilike(invoices.invoiceNumber, `%${filters.q}%`),
          ilike(invoices.notes, `%${filters.q}%`)
        )
      );
    }
    
    if (filters.entityId) {
      conditions.push(eq(invoices.entityId, filters.entityId));
    }
    
    if (filters.entityType) {
      conditions.push(eq(invoices.entityType, filters.entityType));
    }
    
    if (filters.status) {
      conditions.push(eq(invoices.status, filters.status));
    }
    
    if (filters.type) {
      conditions.push(eq(invoices.type, filters.type));
    }
    
    if (filters.minAmount !== undefined) {
      conditions.push(gte(invoices.totalAmount, filters.minAmount));
    }
    
    if (filters.maxAmount !== undefined) {
      conditions.push(lte(invoices.totalAmount, filters.maxAmount));
    }
    
    if (filters.overdue) {
      conditions.push(
        and(
          eq(invoices.status, 'overdue'),
          lte(invoices.dueDate, new Date().toISOString())
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply pagination
    const offset = (pagination.page - 1) * pagination.limit;
    query = query.limit(pagination.limit).offset(offset);

    const result = await query;

    // Get total count for pagination
    const totalQuery = db.select({ count: count() }).from(invoices);
    if (conditions.length > 0) {
      totalQuery.where(and(...conditions));
    }
    const [{ count: total }] = await totalQuery;

    // Calculate summary statistics
    const totalAmountResult = await db
      .select({ 
        totalAmount: sql<number>`COALESCE(SUM(total_amount), 0)`,
        totalPaid: sql<number>`COALESCE(SUM(paid_amount), 0)`,
        totalOutstanding: sql<number>`COALESCE(SUM(balance_due), 0)`
      })
      .from(invoices)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const summary = totalAmountResult[0];

    structuredLogger.info('Invoices retrieved', {
      orgId,
      count: result.length,
      total,
      filters,
      summary
    });

    res.json({
      success: true,
      data: result,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit)
      },
      summary
    });

  } catch (error) {
    structuredLogger.error('Failed to retrieve invoices', error as Error, {
      orgId: req.headers['x-org-id'],
      query: req.query
    });
    
    res.status(500).json({ 
      error: 'Failed to retrieve invoices',
      message: (error as Error).message 
    });
  }
});

// GET /v1/invoices/:id - Get single invoice
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.headers['x-org-id'] as string;
    
    if (!orgId) {
      return res.status(400).json({ error: 'Missing x-org-id header' });
    }

    // Set RLS context
    await db.execute(`SET LOCAL app.org_id = '${orgId}'`);

    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, id))
      .limit(1);

    if (!invoice) {
      return res.status(404).json({ 
        error: 'Invoice not found',
        message: `Invoice with ID ${id} not found or access denied`
      });
    }

    structuredLogger.info('Invoice retrieved', { orgId, invoiceId: id });

    res.json({
      success: true,
      data: invoice
    });

  } catch (error) {
    structuredLogger.error('Failed to retrieve invoice', error as Error, {
      orgId: req.headers['x-org-id'],
      invoiceId: req.params.id
    });
    
    res.status(500).json({ 
      error: 'Failed to retrieve invoice',
      message: (error as Error).message 
    });
  }
});

// POST /v1/invoices - Create invoice
router.post('/', async (req, res) => {
  try {
    const orgId = req.headers['x-org-id'] as string;
    const userId = req.headers['x-user-id'] as string;
    
    if (!orgId) {
      return res.status(400).json({ error: 'Missing x-org-id header' });
    }

    // Validate request body
    const invoiceData = CreateInvoiceSchema.parse(req.body);

    // Set RLS context
    await db.execute(`SET LOCAL app.org_id = '${orgId}'`);

    // Generate invoice number if not provided
    if (!invoiceData.invoiceNumber) {
      const currentYear = new Date().getFullYear();
      const lastInvoice = await db
        .select({ invoiceNumber: invoices.invoiceNumber })
        .from(invoices)
        .where(ilike(invoices.invoiceNumber, `INV-${currentYear}-%`))
        .orderBy(desc(invoices.createdAt))
        .limit(1);

      let nextNumber = 1;
      if (lastInvoice.length > 0) {
        const lastNumber = parseInt(lastInvoice[0].invoiceNumber.split('-')[2]);
        nextNumber = lastNumber + 1;
      }

      invoiceData.invoiceNumber = `INV-${currentYear}-${nextNumber.toString().padStart(4, '0')}`;
    }

    // Calculate totals
    const subtotal = invoiceData.subtotal || 0;
    const discountAmount = invoiceData.discountAmount || 0;
    const taxAmount = invoiceData.taxAmount || 0;
    const shippingCost = invoiceData.shippingCost || 0;
    const totalAmount = subtotal - discountAmount + taxAmount + shippingCost;
    const balanceDue = totalAmount - (invoiceData.paidAmount || 0);

    const newInvoice = {
      ...invoiceData,
      orgId,
      totalAmount,
      balanceDue,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const [invoice] = await db
      .insert(invoices)
      .values(newInvoice)
      .returning();

    structuredLogger.info('Invoice created', {
      orgId,
      userId,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      totalAmount: invoice.totalAmount,
      entityType: invoice.entityType,
      entityId: invoice.entityId
    });

    res.status(201).json({
      success: true,
      data: invoice
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }

    structuredLogger.error('Failed to create invoice', error as Error, {
      orgId: req.headers['x-org-id'],
      userId: req.headers['x-user-id'],
      body: req.body
    });
    
    res.status(500).json({ 
      error: 'Failed to create invoice',
      message: (error as Error).message 
    });
  }
});

// PUT /v1/invoices/:id - Update invoice
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.headers['x-org-id'] as string;
    const userId = req.headers['x-user-id'] as string;
    
    if (!orgId) {
      return res.status(400).json({ error: 'Missing x-org-id header' });
    }

    // Validate request body
    const updateData = UpdateInvoiceSchema.parse(req.body);

    // Set RLS context
    await db.execute(`SET LOCAL app.org_id = '${orgId}'`);

    // Recalculate totals if amount fields are being updated
    if (updateData.subtotal !== undefined || updateData.discountAmount !== undefined || 
        updateData.taxAmount !== undefined || updateData.shippingCost !== undefined ||
        updateData.paidAmount !== undefined) {
      
      // Get current invoice to calculate from
      const [currentInvoice] = await db
        .select()
        .from(invoices)
        .where(eq(invoices.id, id))
        .limit(1);

      if (currentInvoice) {
        const subtotal = updateData.subtotal ?? currentInvoice.subtotal;
        const discountAmount = updateData.discountAmount ?? currentInvoice.discountAmount;
        const taxAmount = updateData.taxAmount ?? currentInvoice.taxAmount;
        const shippingCost = updateData.shippingCost ?? currentInvoice.shippingCost;
        const paidAmount = updateData.paidAmount ?? currentInvoice.paidAmount;
        
        const totalAmount = subtotal - discountAmount + taxAmount + shippingCost;
        const balanceDue = totalAmount - paidAmount;
        
        updateData.totalAmount = totalAmount;
        updateData.balanceDue = balanceDue;
        
        // Update status based on payment
        if (balanceDue <= 0) {
          updateData.status = 'paid';
          updateData.paidAt = new Date().toISOString();
        } else if (paidAmount > 0) {
          updateData.status = 'partial';
        }
      }
    }

    const [updatedInvoice] = await db
      .update(invoices)
      .set({
        ...updateData,
        updatedAt: new Date().toISOString()
      })
      .where(eq(invoices.id, id))
      .returning();

    if (!updatedInvoice) {
      return res.status(404).json({ 
        error: 'Invoice not found',
        message: `Invoice with ID ${id} not found or access denied`
      });
    }

    structuredLogger.info('Invoice updated', {
      orgId,
      userId,
      invoiceId: id,
      changes: updateData
    });

    res.json({
      success: true,
      data: updatedInvoice
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }

    structuredLogger.error('Failed to update invoice', error as Error, {
      orgId: req.headers['x-org-id'],
      userId: req.headers['x-user-id'],
      invoiceId: req.params.id,
      body: req.body
    });
    
    res.status(500).json({ 
      error: 'Failed to update invoice',
      message: (error as Error).message 
    });
  }
});

// POST /v1/invoices/:id/send - Send invoice to customer
router.post('/:id/send', async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.headers['x-org-id'] as string;
    const userId = req.headers['x-user-id'] as string;
    
    if (!orgId) {
      return res.status(400).json({ error: 'Missing x-org-id header' });
    }

    // Set RLS context
    await db.execute(`SET LOCAL app.org_id = '${orgId}'`);

    const [updatedInvoice] = await db
      .update(invoices)
      .set({
        status: 'sent',
        sentAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .where(eq(invoices.id, id))
      .returning();

    if (!updatedInvoice) {
      return res.status(404).json({ 
        error: 'Invoice not found',
        message: `Invoice with ID ${id} not found or access denied`
      });
    }

    structuredLogger.info('Invoice sent', {
      orgId,
      userId,
      invoiceId: id,
      invoiceNumber: updatedInvoice.invoiceNumber
    });

    res.json({
      success: true,
      data: updatedInvoice,
      message: 'Invoice sent successfully'
    });

  } catch (error) {
    structuredLogger.error('Failed to send invoice', error as Error, {
      orgId: req.headers['x-org-id'],
      userId: req.headers['x-user-id'],
      invoiceId: req.params.id
    });
    
    res.status(500).json({ 
      error: 'Failed to send invoice',
      message: (error as Error).message 
    });
  }
});

// DELETE /v1/invoices/:id - Delete invoice (soft delete)
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

    const [deletedInvoice] = await db
      .update(invoices)
      .set({
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .where(eq(invoices.id, id))
      .returning();

    if (!deletedInvoice) {
      return res.status(404).json({ 
        error: 'Invoice not found',
        message: `Invoice with ID ${id} not found or access denied`
      });
    }

    structuredLogger.info('Invoice deleted', {
      orgId,
      userId,
      invoiceId: id,
      invoiceNumber: deletedInvoice.invoiceNumber
    });

    res.status(204).send();

  } catch (error) {
    structuredLogger.error('Failed to delete invoice', error as Error, {
      orgId: req.headers['x-org-id'],
      userId: req.headers['x-user-id'],
      invoiceId: req.params.id
    });
    
    res.status(500).json({ 
      error: 'Failed to delete invoice',
      message: (error as Error).message 
    });
  }
});

export { router as invoicesRouter };
