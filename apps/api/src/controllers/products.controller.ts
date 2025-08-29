import { Request, Response } from 'express';
import { db } from '../lib/db';
import { products } from '@econeura/db/schema';
import { eq, and, desc, asc, sql, like } from 'drizzle-orm';
import { CreateProductSchema, UpdateProductSchema } from '@econeura/shared/schemas/inventory';
import { createProblem } from '../lib/problem';
import { logger } from '../lib/logger';

export class ProductsController {
  // Get all products with filters and pagination
  async getProducts(req: Request, res: Response) {
    try {
      const { 
        limit = 20, 
        offset = 0, 
        category, 
        supplier_id, 
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
      const whereConditions = [eq(products.orgId, orgId)];
      
      if (category) whereConditions.push(eq(products.category, category as string));
      if (supplier_id) whereConditions.push(eq(products.supplierId, supplier_id as string));
      if (is_active !== undefined) whereConditions.push(eq(products.isActive, is_active === 'true'));
      if (search) whereConditions.push(like(products.name, `%${search}%`));

      // Build order by
      const orderBy = sort_order === 'asc' ? asc(products[sort_by as keyof typeof products]) : desc(products[sort_by as keyof typeof products]);

      const results = await db
        .select()
        .from(products)
        .where(and(...whereConditions))
        .orderBy(orderBy)
        .limit(Number(limit))
        .offset(Number(offset));

      const total = await db
        .select({ count: sql<number>`count(*)` })
        .from(products)
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
      logger.error('Error fetching products:', error);
      res.status(500).json(createProblem({
        title: 'Internal Server Error',
        detail: 'Failed to fetch products',
        status: 500
      }));
    }
  }

  // Get single product by ID
  async getProduct(req: Request, res: Response) {
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
        .from(products)
        .where(and(eq(products.id, id), eq(products.orgId, orgId)))
        .limit(1);

      if (result.length === 0) {
        return res.status(404).json(createProblem({
          title: 'Product Not Found',
          detail: 'Product not found or does not belong to your organization',
          status: 404
        }));
      }

      res.json({ data: result[0] });
    } catch (error) {
      logger.error('Error fetching product:', error);
      res.status(500).json(createProblem({
        title: 'Internal Server Error',
        detail: 'Failed to fetch product',
        status: 500
      }));
    }
  }

  // Create new product
  async createProduct(req: Request, res: Response) {
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

      const validation = CreateProductSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json(createProblem({
          title: 'Validation Error',
          detail: 'Invalid product data',
          status: 400,
          errors: validation.error.issues
        }));
      }

      const productData = {
        ...validation.data,
        orgId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await db
        .insert(products)
        .values(productData)
        .returning();

      logger.info('Product created successfully', { 
        productId: result[0].id, 
        orgId, 
        userId 
      });

      res.status(201).json({ data: result[0] });
    } catch (error) {
      logger.error('Error creating product:', error);
      res.status(500).json(createProblem({
        title: 'Internal Server Error',
        detail: 'Failed to create product',
        status: 500
      }));
    }
  }

  // Update product
  async updateProduct(req: Request, res: Response) {
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

      const validation = UpdateProductSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json(createProblem({
          title: 'Validation Error',
          detail: 'Invalid product data',
          status: 400,
          errors: validation.error.issues
        }));
      }

      const updateData = {
        ...validation.data,
        updatedAt: new Date()
      };

      const result = await db
        .update(products)
        .set(updateData)
        .where(and(eq(products.id, id), eq(products.orgId, orgId)))
        .returning();

      if (result.length === 0) {
        return res.status(404).json(createProblem({
          title: 'Product Not Found',
          detail: 'Product not found or does not belong to your organization',
          status: 404
        }));
      }

      logger.info('Product updated successfully', { 
        productId: id, 
        orgId 
      });

      res.json({ data: result[0] });
    } catch (error) {
      logger.error('Error updating product:', error);
      res.status(500).json(createProblem({
        title: 'Internal Server Error',
        detail: 'Failed to update product',
        status: 500
      }));
    }
  }

  // Delete product
  async deleteProduct(req: Request, res: Response) {
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
        .delete(products)
        .where(and(eq(products.id, id), eq(products.orgId, orgId)))
        .returning();

      if (result.length === 0) {
        return res.status(404).json(createProblem({
          title: 'Product Not Found',
          detail: 'Product not found or does not belong to your organization',
          status: 404
        }));
      }

      logger.info('Product deleted successfully', { 
        productId: id, 
        orgId 
      });

      res.status(204).send();
    } catch (error) {
      logger.error('Error deleting product:', error);
      res.status(500).json(createProblem({
        title: 'Internal Server Error',
        detail: 'Failed to delete product',
        status: 500
      }));
    }
  }

  // Get product categories
  async getProductCategories(req: Request, res: Response) {
    try {
      const orgId = req.headers['x-org-id'] as string;

      if (!orgId) {
        return res.status(400).json(createProblem({
          title: 'Missing Organization ID',
          detail: 'Organization ID is required in headers',
          status: 400
        }));
      }

      const categories = await db
        .selectDistinct({ category: products.category })
        .from(products)
        .where(and(eq(products.orgId, orgId), sql`${products.category} IS NOT NULL`));

      const categoryList = categories
        .map(c => c.category)
        .filter(Boolean)
        .sort();

      res.json({ data: categoryList });
    } catch (error) {
      logger.error('Error fetching product categories:', error);
      res.status(500).json(createProblem({
        title: 'Internal Server Error',
        detail: 'Failed to fetch product categories',
        status: 500
      }));
    }
  }

  // Get low stock products
  async getLowStockProducts(req: Request, res: Response) {
    try {
      const orgId = req.headers['x-org-id'] as string;

      if (!orgId) {
        return res.status(400).json(createProblem({
          title: 'Missing Organization ID',
          detail: 'Organization ID is required in headers',
          status: 400
        }));
      }

      const lowStockProducts = await db
        .select()
        .from(products)
        .where(
          and(
            eq(products.orgId, orgId),
            eq(products.isActive, true),
            sql`${products.quantity} <= ${products.minStockLevel}`
          )
        )
        .orderBy(asc(products.quantity));

      res.json({ data: lowStockProducts });
    } catch (error) {
      logger.error('Error fetching low stock products:', error);
      res.status(500).json(createProblem({
        title: 'Internal Server Error',
        detail: 'Failed to fetch low stock products',
        status: 500
      }));
    }
  }
}
