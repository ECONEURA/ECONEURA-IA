import { Request, Response } from 'express';
import { db } from '../lib/db';
import { products, suppliers } from '../../../db/src/schema';
import { eq, and, or, like, ilike, sql, desc, asc, count } from 'drizzle-orm';
import { createProblem } from '../lib/problem';
import { logger } from '../lib/logger';

export class SearchController {
  // Advanced search across products and suppliers
  async searchInventory(req: Request, res: Response) {
    try {
      const { 
        q = '', 
        type = 'all', 
        category, 
        supplier_id, 
        min_price, 
        max_price,
        stock_status,
        sort_by = 'name',
        sort_order = 'asc',
        limit = 20,
        offset = 0
      } = req.query;
      
      const orgId = req.headers['x-org-id'] as string;

      if (!orgId) {
        return res.status(400).json(createProblem(
          'MISSING_ORG_ID',
          'Organization ID is required',
          400
        ));
      }

      const results = {
        products: [],
        suppliers: [],
        total_products: 0,
        total_suppliers: 0,
        search_metadata: {
          query: q,
          filters_applied: {},
          execution_time: 0
        }
      };

      const startTime = Date.now();

      // Build base conditions
      const baseConditions = [eq(products.orgId, orgId)];
      const supplierConditions = [eq(suppliers.orgId, orgId)];

      // Add search query
      if (q) {
        const searchTerm = `%${q}%`;
        baseConditions.push(
          or(
            ilike(products.name, searchTerm),
            ilike(products.sku, searchTerm),
            ilike(products.description, searchTerm),
            ilike(products.category, searchTerm)
          )
        );
        supplierConditions.push(
          or(
            ilike(suppliers.name, searchTerm),
            ilike(suppliers.contact_person, searchTerm),
            ilike(suppliers.email, searchTerm)
          )
        );
      }

      // Add filters
      if (category) {
        baseConditions.push(eq(products.category, category as string));
        results.search_metadata.filters_applied.category = category;
      }

      if (supplier_id) {
        baseConditions.push(eq(products.supplier_id, supplier_id as string));
        results.search_metadata.filters_applied.supplier_id = supplier_id;
      }

      if (min_price) {
        baseConditions.push(sql`${products.unit_price} >= ${min_price}`);
        results.search_metadata.filters_applied.min_price = min_price;
      }

      if (max_price) {
        baseConditions.push(sql`${products.unit_price} <= ${max_price}`);
        results.search_metadata.filters_applied.max_price = max_price;
      }

      if (stock_status) {
        switch (stock_status) {
          case 'in_stock':
            baseConditions.push(sql`${products.stock_quantity} > 0`);
            break;
          case 'low_stock':
            baseConditions.push(sql`${products.stock_quantity} <= ${products.min_stock_level} AND ${products.stock_quantity} > 0`);
            break;
          case 'out_of_stock':
            baseConditions.push(sql`${products.stock_quantity} = 0`);
            break;
        }
        results.search_metadata.filters_applied.stock_status = stock_status;
      }

      // Determine sort order
      const sortDirection = sort_order === 'desc' ? desc : asc;
      let sortField;

      switch (sort_by) {
        case 'name':
          sortField = products.name;
          break;
        case 'price':
          sortField = products.unit_price;
          break;
        case 'stock':
          sortField = products.stock_quantity;
          break;
        case 'created_at':
          sortField = products.created_at;
          break;
        default:
          sortField = products.name;
      }

      // Search products if requested
      if (type === 'all' || type === 'products') {
        const [productsData, productsCount] = await Promise.all([
          db
            .select({
              id: products.id,
              name: products.name,
              sku: products.sku,
              description: products.description,
              category: products.category,
              unit_price: products.unit_price,
              cost_price: products.cost_price,
              stock_quantity: products.stock_quantity,
              min_stock_level: products.min_stock_level,
              is_active: products.is_active,
              supplier_name: suppliers.name,
              created_at: products.created_at,
              search_score: sql<number>`CASE 
                WHEN ${products.name} ILIKE ${`%${q}%`} THEN 100
                WHEN ${products.sku} ILIKE ${`%${q}%`} THEN 80
                WHEN ${products.description} ILIKE ${`%${q}%`} THEN 60
                WHEN ${products.category} ILIKE ${`%${q}%`} THEN 40
                ELSE 20
              END`
            })
            .from(products)
            .leftJoin(suppliers, eq(products.supplier_id, suppliers.id))
            .where(and(...baseConditions))
            .orderBy(sortDirection(sortField), desc(sql`search_score`))
            .limit(parseInt(limit as string))
            .offset(parseInt(offset as string)),
          db
            .select({ count: count() })
            .from(products)
            .where(and(...baseConditions))
        ]);

        results.products = productsData;
        results.total_products = productsCount[0].count;
      }

      // Search suppliers if requested
      if (type === 'all' || type === 'suppliers') {
        const [suppliersData, suppliersCount] = await Promise.all([
          db
            .select({
              id: suppliers.id,
              name: suppliers.name,
              contact_person: suppliers.contact_person,
              email: suppliers.email,
              phone: suppliers.phone,
              website: suppliers.website,
              is_active: suppliers.is_active,
              rating: suppliers.rating,
              payment_terms: suppliers.payment_terms,
              created_at: suppliers.created_at,
              search_score: sql<number>`CASE 
                WHEN ${suppliers.name} ILIKE ${`%${q}%`} THEN 100
                WHEN ${suppliers.contact_person} ILIKE ${`%${q}%`} THEN 80
                WHEN ${suppliers.email} ILIKE ${`%${q}%`} THEN 60
                ELSE 20
              END`
            })
            .from(suppliers)
            .where(and(...supplierConditions))
            .orderBy(sortDirection(suppliers.name), desc(sql`search_score`))
            .limit(parseInt(limit as string))
            .offset(parseInt(offset as string)),
          db
            .select({ count: count() })
            .from(suppliers)
            .where(and(...supplierConditions))
        ]);

        results.suppliers = suppliersData;
        results.total_suppliers = suppliersCount[0].count;
      }

      results.search_metadata.execution_time = Date.now() - startTime;

      res.json({
        success: true,
        data: results
      });

    } catch (error) {
      logger.error('Error in inventory search:', error);
      res.status(500).json(createProblem(
        'INTERNAL_ERROR',
        'Failed to perform inventory search',
        500
      ));
    }
  }

  // Get search suggestions
  async getSearchSuggestions(req: Request, res: Response) {
    try {
      const { q = '', type = 'all' } = req.query;
      const orgId = req.headers['x-org-id'] as string;

      if (!orgId) {
        return res.status(400).json(createProblem(
          'MISSING_ORG_ID',
          'Organization ID is required',
          400
        ));
      }

      const suggestions = {
        products: [],
        suppliers: [],
        categories: [],
        skus: []
      };

      if (q.length < 2) {
        return res.json({
          success: true,
          data: suggestions
        });
      }

      const searchTerm = `%${q}%`;

      // Get product suggestions
      if (type === 'all' || type === 'products') {
        const productSuggestions = await db
          .select({
            name: products.name,
            sku: products.sku,
            category: products.category
          })
          .from(products)
          .where(and(
            eq(products.orgId, orgId),
            or(
              ilike(products.name, searchTerm),
              ilike(products.sku, searchTerm),
              ilike(products.category, searchTerm)
            )
          ))
          .limit(10);

        suggestions.products = productSuggestions.map(p => p.name);
        suggestions.skus = productSuggestions.map(p => p.sku);
        suggestions.categories = [...new Set(productSuggestions.map(p => p.category))];
      }

      // Get supplier suggestions
      if (type === 'all' || type === 'suppliers') {
        const supplierSuggestions = await db
          .select({
            name: suppliers.name,
            contact_person: suppliers.contact_person
          })
          .from(suppliers)
          .where(and(
            eq(suppliers.orgId, orgId),
            or(
              ilike(suppliers.name, searchTerm),
              ilike(suppliers.contact_person, searchTerm)
            )
          ))
          .limit(10);

        suggestions.suppliers = supplierSuggestions.map(s => s.name);
      }

      res.json({
        success: true,
        data: suggestions
      });

    } catch (error) {
      logger.error('Error getting search suggestions:', error);
      res.status(500).json(createProblem(
        'INTERNAL_ERROR',
        'Failed to get search suggestions',
        500
      ));
    }
  }

  // Get search filters
  async getSearchFilters(req: Request, res: Response) {
    try {
      const orgId = req.headers['x-org-id'] as string;

      if (!orgId) {
        return res.status(400).json(createProblem(
          'MISSING_ORG_ID',
          'Organization ID is required',
          400
        ));
      }

      // Get categories
      const categories = await db
        .select({
          category: products.category,
          count: count()
        })
        .from(products)
        .where(eq(products.orgId, orgId))
        .groupBy(products.category)
        .orderBy(desc(count()));

      // Get price ranges
      const priceRanges = await db
        .select({
          min_price: sql`MIN(${products.unit_price})`,
          max_price: sql`MAX(${products.unit_price})`
        })
        .from(products)
        .where(eq(products.orgId, orgId));

      // Get suppliers for filter
      const suppliersList = await db
        .select({
          id: suppliers.id,
          name: suppliers.name,
          product_count: count()
        })
        .from(suppliers)
        .leftJoin(products, eq(suppliers.id, products.supplier_id))
        .where(eq(suppliers.orgId, orgId))
        .groupBy(suppliers.id, suppliers.name)
        .orderBy(desc(count()));

      const filters = {
        categories: categories.map(c => ({
          value: c.category,
          label: c.category,
          count: c.count
        })),
        price_range: {
          min: priceRanges[0]?.min_price || 0,
          max: priceRanges[0]?.max_price || 0
        },
        suppliers: suppliersList.map(s => ({
          value: s.id,
          label: s.name,
          count: s.product_count
        })),
        stock_statuses: [
          { value: 'in_stock', label: 'En Stock', count: 0 },
          { value: 'low_stock', label: 'Stock Bajo', count: 0 },
          { value: 'out_of_stock', label: 'Sin Stock', count: 0 }
        ]
      };

      res.json({
        success: true,
        data: filters
      });

    } catch (error) {
      logger.error('Error getting search filters:', error);
      res.status(500).json(createProblem(
        'INTERNAL_ERROR',
        'Failed to get search filters',
        500
      ));
    }
  }
}

export const searchController = new SearchController();
