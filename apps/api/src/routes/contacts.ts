import { Router } from 'express';
import { z } from 'zod';
import { 
  ContactSchema, 
  CreateContactSchema, 
  UpdateContactSchema, 
  ContactFilterSchema 
} from '@econeura/shared/src/schemas/crm';
import { PaginationRequestSchema } from '@econeura/shared/src/schemas/common';
import { db } from '../lib/database.js';
import { contacts } from '@econeura/db/src/schema';
import { eq, and, ilike, or, count } from 'drizzle-orm';
import { structuredLogger } from '../lib/structured-logger.js';

const router = Router();

// GET /v1/contacts - List contacts with RLS
router.get('/', async (req, res) => {
  try {
    const orgId = req.headers['x-org-id'] as string;
    if (!orgId) {
      return res.status(400).json({ error: 'Missing x-org-id header' });
    }

    // Validate query parameters
    const filters = ContactFilterSchema.parse(req.query);
    const pagination = PaginationRequestSchema.parse(req.query);

    // Set RLS context
    await db.execute(`SET LOCAL app.org_id = '${orgId}'`);

    // Build query with filters
    let query = db.select().from(contacts);
    
    const conditions = [];
    
    if (filters.q) {
      conditions.push(
        or(
          ilike(contacts.firstName, `%${filters.q}%`),
          ilike(contacts.lastName, `%${filters.q}%`),
          ilike(contacts.email, `%${filters.q}%`)
        )
      );
    }
    
    if (filters.companyId) {
      conditions.push(eq(contacts.companyId, filters.companyId));
    }
    
    if (filters.status) {
      conditions.push(eq(contacts.status, filters.status));
    }
    
    if (filters.isPrimary !== undefined) {
      conditions.push(eq(contacts.isPrimary, filters.isPrimary));
    }
    
    if (filters.department) {
      conditions.push(eq(contacts.department, filters.department));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply pagination
    const offset = (pagination.page - 1) * pagination.limit;
    query = query.limit(pagination.limit).offset(offset);

    const result = await query;

    // Get total count for pagination
    const totalQuery = db.select({ count: count() }).from(contacts);
    if (conditions.length > 0) {
      totalQuery.where(and(...conditions));
    }
    const [{ count: total }] = await totalQuery;

    structuredLogger.info('Contacts retrieved', {
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
    structuredLogger.error('Failed to retrieve contacts', error as Error, {
      orgId: req.headers['x-org-id'],
      query: req.query
    });
    
    res.status(500).json({ 
      error: 'Failed to retrieve contacts',
      message: (error as Error).message 
    });
  }
});

// GET /v1/contacts/:id - Get single contact
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.headers['x-org-id'] as string;
    
    if (!orgId) {
      return res.status(400).json({ error: 'Missing x-org-id header' });
    }

    // Set RLS context
    await db.execute(`SET LOCAL app.org_id = '${orgId}'`);

    const [contact] = await db
      .select()
      .from(contacts)
      .where(eq(contacts.id, id))
      .limit(1);

    if (!contact) {
      return res.status(404).json({ 
        error: 'Contact not found',
        message: `Contact with ID ${id} not found or access denied`
      });
    }

    structuredLogger.info('Contact retrieved', { orgId, contactId: id });

    res.json({
      success: true,
      data: contact
    });

  } catch (error) {
    structuredLogger.error('Failed to retrieve contact', error as Error, {
      orgId: req.headers['x-org-id'],
      contactId: req.params.id
    });
    
    res.status(500).json({ 
      error: 'Failed to retrieve contact',
      message: (error as Error).message 
    });
  }
});

// POST /v1/contacts - Create contact
router.post('/', async (req, res) => {
  try {
    const orgId = req.headers['x-org-id'] as string;
    const userId = req.headers['x-user-id'] as string;
    
    if (!orgId) {
      return res.status(400).json({ error: 'Missing x-org-id header' });
    }

    // Validate request body
    const contactData = CreateContactSchema.parse(req.body);

    // Set RLS context
    await db.execute(`SET LOCAL app.org_id = '${orgId}'`);

    const newContact = {
      ...contactData,
      orgId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const [contact] = await db
      .insert(contacts)
      .values(newContact)
      .returning();

    structuredLogger.info('Contact created', {
      orgId,
      userId,
      contactId: contact.id,
      name: `${contact.firstName} ${contact.lastName}`,
      email: contact.email
    });

    res.status(201).json({
      success: true,
      data: contact
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }

    structuredLogger.error('Failed to create contact', error as Error, {
      orgId: req.headers['x-org-id'],
      userId: req.headers['x-user-id'],
      body: req.body
    });
    
    res.status(500).json({ 
      error: 'Failed to create contact',
      message: (error as Error).message 
    });
  }
});

// PUT /v1/contacts/:id - Update contact
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.headers['x-org-id'] as string;
    const userId = req.headers['x-user-id'] as string;
    
    if (!orgId) {
      return res.status(400).json({ error: 'Missing x-org-id header' });
    }

    // Validate request body
    const updateData = UpdateContactSchema.parse(req.body);

    // Set RLS context
    await db.execute(`SET LOCAL app.org_id = '${orgId}'`);

    const [updatedContact] = await db
      .update(contacts)
      .set({
        ...updateData,
        updatedAt: new Date().toISOString()
      })
      .where(eq(contacts.id, id))
      .returning();

    if (!updatedContact) {
      return res.status(404).json({ 
        error: 'Contact not found',
        message: `Contact with ID ${id} not found or access denied`
      });
    }

    structuredLogger.info('Contact updated', {
      orgId,
      userId,
      contactId: id,
      changes: updateData
    });

    res.json({
      success: true,
      data: updatedContact
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }

    structuredLogger.error('Failed to update contact', error as Error, {
      orgId: req.headers['x-org-id'],
      userId: req.headers['x-user-id'],
      contactId: req.params.id,
      body: req.body
    });
    
    res.status(500).json({ 
      error: 'Failed to update contact',
      message: (error as Error).message 
    });
  }
});

// DELETE /v1/contacts/:id - Delete contact (soft delete)
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

    const [deletedContact] = await db
      .update(contacts)
      .set({
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .where(eq(contacts.id, id))
      .returning();

    if (!deletedContact) {
      return res.status(404).json({ 
        error: 'Contact not found',
        message: `Contact with ID ${id} not found or access denied`
      });
    }

    structuredLogger.info('Contact deleted', {
      orgId,
      userId,
      contactId: id,
      name: `${deletedContact.firstName} ${deletedContact.lastName}`
    });

    res.status(204).send();

  } catch (error) {
    structuredLogger.error('Failed to delete contact', error as Error, {
      orgId: req.headers['x-org-id'],
      userId: req.headers['x-user-id'],
      contactId: req.params.id
    });
    
    res.status(500).json({ 
      error: 'Failed to delete contact',
      message: (error as Error).message 
    });
  }
});

export { router as contactsRouter };
