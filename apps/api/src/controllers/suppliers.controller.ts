import { Request, Response } from 'express';
import { db } from '../lib/db';
import { suppliers } from '@econeura/db/schema';
import { eq, and, desc, asc, sql, like } from 'drizzle-orm';
import { CreateSupplierSchema, UpdateSupplierSchema } from '@econeura/shared/schemas/inventory';
import { createProblem } from '../lib/problem';
import { logger } from '../lib/logger';

export class SuppliersController {
  // Get all suppliers with filters and pagination
  async getSuppliers(req: Request, res: Response) {
    try {
      const { 
        limit = 20, 
        offset = 0, 
        is_active,
        search,
        sort_by = 'created_at',
        sort_order = 'desc'
      } = req.query;
      
      const orgId = req.headers['x-org-id'] as string;

      if (!orgId) {
        return res.status(400).json(createProblem({
          title: 'Missing Organization ID',
          detail: 'Organization ID is required in headers',
          status: 400
        }));
      }

      // Build where conditions
      const whereConditions = [eq(suppliers.orgId, orgId)];
      
      if (is_active !== undefined) whereConditions.push(eq(suppliers.isActive, is_active === 'true'));
      if (search) whereConditions.push(like(suppliers.name, `%${search}%`));

      // Build order by
      const orderBy = sort_order === 'asc' ? asc(suppliers[sort_by as keyof typeof suppliers]) : desc(suppliers[sort_by as keyof typeof suppliers]);

      const results = await db
        .select()
        .from(suppliers)
        .where(and(...whereConditions))
        .orderBy(orderBy)
        .limit(Number(limit))
        .offset(Number(offset));

      const total = await db
        .select({ count: sql<number>`count(*)` })
        .from(suppliers)
        .where(and(...whereConditions));

      res.json({
        data: results,
        pagination: {
          total: total[0].count,
          limit: Number(limit),
          offset: Number(offset),
          hasMore: Number(offset) + Number(limit) < total[0].count
        }
      });
    } catch (error) {
      logger.error('Error fetching suppliers:', error);
      res.status(500).json(createProblem({
        title: 'Internal Server Error',
        detail: 'Failed to fetch suppliers',
        status: 500
      }));
    }
  }

  // Get single supplier by ID
  async getSupplier(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const orgId = req.headers['x-org-id'] as string;

      if (!orgId) {
        return res.status(400).json(createProblem({
          title: 'Missing Organization ID',
          detail: 'Organization ID is required in headers',
          status: 400
        }));
      }

      const result = await db
        .select()
        .from(suppliers)
        .where(and(eq(suppliers.id, id), eq(suppliers.orgId, orgId)))
        .limit(1);

      if (result.length === 0) {
        return res.status(404).json(createProblem({
          title: 'Supplier Not Found',
          detail: 'Supplier not found or does not belong to your organization',
          status: 404
        }));
      }

      res.json({ data: result[0] });
    } catch (error) {
      logger.error('Error fetching supplier:', error);
      res.status(500).json(createProblem({
        title: 'Internal Server Error',
        detail: 'Failed to fetch supplier',
        status: 500
      }));
    }
  }

  // Create new supplier
  async createSupplier(req: Request, res: Response) {
    try {
      const orgId = req.headers['x-org-id'] as string;
      const userId = req.headers['x-user-id'] as string;

      if (!orgId) {
        return res.status(400).json(createProblem({
          title: 'Missing Organization ID',
          detail: 'Organization ID is required in headers',
          status: 400
        }));
      }

      const validation = CreateSupplierSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json(createProblem({
          title: 'Validation Error',
          detail: 'Invalid supplier data',
          status: 400,
          errors: validation.error.issues
        }));
      }

      const supplierData = {
        ...validation.data,
        orgId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await db
        .insert(suppliers)
        .values(supplierData)
        .returning();

      logger.info('Supplier created successfully', { 
        supplierId: result[0].id, 
        orgId, 
        userId 
      });

      res.status(201).json({ data: result[0] });
    } catch (error) {
      logger.error('Error creating supplier:', error);
      res.status(500).json(createProblem({
        title: 'Internal Server Error',
        detail: 'Failed to create supplier',
        status: 500
      }));
    }
  }

  // Update supplier
  async updateSupplier(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const orgId = req.headers['x-org-id'] as string;

      if (!orgId) {
        return res.status(400).json(createProblem({
          title: 'Missing Organization ID',
          detail: 'Organization ID is required in headers',
          status: 400
        }));
      }

      const validation = UpdateSupplierSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json(createProblem({
          title: 'Validation Error',
          detail: 'Invalid supplier data',
          status: 400,
          errors: validation.error.issues
        }));
      }

      const updateData = {
        ...validation.data,
        updatedAt: new Date()
      };

      const result = await db
        .update(suppliers)
        .set(updateData)
        .where(and(eq(suppliers.id, id), eq(suppliers.orgId, orgId)))
        .returning();

      if (result.length === 0) {
        return res.status(404).json(createProblem({
          title: 'Supplier Not Found',
          detail: 'Supplier not found or does not belong to your organization',
          status: 404
        }));
      }

      logger.info('Supplier updated successfully', { 
        supplierId: id, 
        orgId 
      });

      res.json({ data: result[0] });
    } catch (error) {
      logger.error('Error updating supplier:', error);
      res.status(500).json(createProblem({
        title: 'Internal Server Error',
        detail: 'Failed to update supplier',
        status: 500
      }));
    }
  }

  // Delete supplier
  async deleteSupplier(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const orgId = req.headers['x-org-id'] as string;

      if (!orgId) {
        return res.status(400).json(createProblem({
          title: 'Missing Organization ID',
          detail: 'Organization ID is required in headers',
          status: 400
        }));
      }

      const result = await db
        .delete(suppliers)
        .where(and(eq(suppliers.id, id), eq(suppliers.orgId, orgId)))
        .returning();

      if (result.length === 0) {
        return res.status(404).json(createProblem({
          title: 'Supplier Not Found',
          detail: 'Supplier not found or does not belong to your organization',
          status: 404
        }));
      }

      logger.info('Supplier deleted successfully', { 
        supplierId: id, 
        orgId 
      });

      res.status(204).send();
    } catch (error) {
      logger.error('Error deleting supplier:', error);
      res.status(500).json(createProblem({
        title: 'Internal Server Error',
        detail: 'Failed to delete supplier',
        status: 500
      }));
    }
  }

  // Get supplier statistics
  async getSupplierStats(req: Request, res: Response) {
    try {
      const orgId = req.headers['x-org-id'] as string;

      if (!orgId) {
        return res.status(400).json(createProblem({
          title: 'Missing Organization ID',
          detail: 'Organization ID is required in headers',
          status: 400
        }));
      }

      const stats = await db
        .select({
          total_suppliers: sql<number>`count(*)`,
          active_suppliers: sql<number>`count(*) filter (where is_active = true)`,
          avg_rating: sql<number>`avg(rating)`,
          total_credit_limit: sql<number>`sum(credit_limit)`
        })
        .from(suppliers)
        .where(eq(suppliers.orgId, orgId));

      res.json({ data: stats[0] });
    } catch (error) {
      logger.error('Error fetching supplier stats:', error);
      res.status(500).json(createProblem({
        title: 'Internal Server Error',
        detail: 'Failed to fetch supplier statistics',
        status: 500
      }));
    }
  }
}
