import { Request, Response } from 'express';
import { db } from '../lib/db';
import { products, suppliers, invoice_items } from '../../../db/src/schema';
import { eq, and, gte, lte, sql, desc, asc, count, sum } from 'drizzle-orm';
import { createProblem } from '../lib/problem';
import { logger } from '../lib/logger';

export class InventoryController {
  // Get inventory analytics
  async getAnalytics(req: Request, res: Response) {
    try {
      const { period = '30d', category, supplier_id } = req.query;
      const orgId = req.headers['x-org-id'] as string;

      if (!orgId) {
        return res.status(400).json(createProblem(
          'MISSING_ORG_ID',
          'Organization ID is required',
          400
        ));
      }

      // Calculate date range
      const now = new Date();
      const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
      const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));

      // Build where conditions
      const whereConditions = [eq(products.orgId, orgId)];
      if (category) whereConditions.push(eq(products.category, category as string));
      if (supplier_id) whereConditions.push(eq(products.supplier_id, supplier_id as string));

      // Get overview metrics
      const [totalProducts, activeProducts, lowStockProducts, totalValue] = await Promise.all([
        db.select({ count: count() }).from(products).where(and(...whereConditions)),
        db.select({ count: count() }).from(products).where(and(...whereConditions, eq(products.is_active, true))),
        db.select({ count: count() }).from(products).where(and(...whereConditions, sql`${products.stock_quantity} <= ${products.min_stock_level}`)),
        db.select({ 
          total: sum(sql`${products.stock_quantity} * ${products.cost_price}`) 
        }).from(products).where(and(...whereConditions))
      ]);

      // Get category distribution
      const categoryDistribution = await db
        .select({
          category: products.category,
          count: count(),
          total_value: sum(sql`${products.stock_quantity} * ${products.cost_price}`)
        })
        .from(products)
        .where(and(...whereConditions))
        .groupBy(products.category)
        .orderBy(desc(count()));

      // Get top suppliers by product count
      const topSuppliers = await db
        .select({
          supplier_id: products.supplier_id,
          supplier_name: suppliers.name,
          product_count: count(),
          total_value: sum(sql`${products.stock_quantity} * ${products.cost_price}`)
        })
        .from(products)
        .leftJoin(suppliers, eq(products.supplier_id, suppliers.id))
        .where(and(...whereConditions))
        .groupBy(products.supplier_id, suppliers.name)
        .orderBy(desc(count()))
        .limit(10);

      // Get low stock alerts
      const lowStockAlerts = await db
        .select({
          id: products.id,
          name: products.name,
          sku: products.sku,
          stock_quantity: products.stock_quantity,
          min_stock_level: products.min_stock_level,
          supplier_name: suppliers.name,
          days_until_stockout: sql<number>`CASE 
            WHEN ${products.stock_quantity} > 0 THEN 
              FLOOR(${products.stock_quantity} / GREATEST(1, (
                SELECT COALESCE(AVG(quantity), 1) 
                FROM ${invoice_items} 
                WHERE product_id = ${products.id}
                AND created_at >= ${startDate}
              )))
            ELSE 0 
          END`
        })
        .from(products)
        .leftJoin(suppliers, eq(products.supplier_id, suppliers.id))
        .where(and(...whereConditions, sql`${products.stock_quantity} <= ${products.min_stock_level}`))
        .orderBy(asc(products.stock_quantity))
        .limit(20);

      // Get stock movement trends (mock data for now)
      const stockMovements = await this.generateStockMovementTrends(orgId, startDate, now);

      // Generate insights
      const insights = await this.generateInventoryInsights(
        totalProducts[0].count,
        lowStockProducts[0].count,
        totalValue[0].total || 0,
        categoryDistribution
      );

      // Generate recommendations
      const recommendations = await this.generateInventoryRecommendations(
        lowStockAlerts,
        categoryDistribution,
        topSuppliers
      );

      const analytics = {
        overview: {
          total_products: totalProducts[0].count,
          active_products: activeProducts[0].count,
          low_stock_products: lowStockProducts[0].count,
          total_inventory_value: totalValue[0].total || 0,
          stockout_risk_percentage: Math.round((lowStockProducts[0].count / totalProducts[0].count) * 100)
        },
        category_distribution: categoryDistribution,
        top_suppliers: topSuppliers,
        low_stock_alerts: lowStockAlerts,
        stock_movements: stockMovements,
        insights,
        recommendations
      };

      res.json({
        success: true,
        data: analytics
      });

    } catch (error) {
      logger.error('Error getting inventory analytics:', error);
      res.status(500).json(createProblem(
        'INTERNAL_ERROR',
        'Failed to get inventory analytics',
        500
      ));
    }
  }

  // Get stock movements
  async getStockMovements(req: Request, res: Response) {
    try {
      const { product_id, type, start_date, end_date, limit = 50, offset = 0 } = req.query;
      const orgId = req.headers['x-org-id'] as string;

      if (!orgId) {
        return res.status(400).json(createProblem(
          'MISSING_ORG_ID',
          'Organization ID is required',
          400
        ));
      }

      // Build where conditions
      const whereConditions = [eq(products.orgId, orgId)];
      if (product_id) whereConditions.push(eq(products.id, product_id as string));
      if (type) whereConditions.push(eq(products.category, type as string));

      // Get stock movements (mock implementation)
      const movements = await this.getMockStockMovements(orgId, whereConditions, {
        start_date: start_date as string,
        end_date: end_date as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });

      res.json({
        success: true,
        data: movements,
        pagination: {
          total: movements.length,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          hasMore: movements.length === parseInt(limit as string)
        }
      });

    } catch (error) {
      logger.error('Error getting stock movements:', error);
      res.status(500).json(createProblem(
        'INTERNAL_ERROR',
        'Failed to get stock movements',
        500
      ));
    }
  }

  // Get inventory reports
  async getReports(req: Request, res: Response) {
    try {
      const { report_type = 'stock_levels', format = 'json' } = req.query;
      const orgId = req.headers['x-org-id'] as string;

      if (!orgId) {
        return res.status(400).json(createProblem(
          'MISSING_ORG_ID',
          'Organization ID is required',
          400
        ));
      }

      let reportData;
      switch (report_type) {
        case 'stock_levels':
          reportData = await this.generateStockLevelsReport(orgId);
          break;
        case 'supplier_performance':
          reportData = await this.generateSupplierPerformanceReport(orgId);
          break;
        case 'category_analysis':
          reportData = await this.generateCategoryAnalysisReport(orgId);
          break;
        default:
          return res.status(400).json(createProblem(
            'INVALID_REPORT_TYPE',
            'Invalid report type',
            400
          ));
      }

      if (format === 'csv') {
        const csv = this.convertToCSV(reportData);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${report_type}_${new Date().toISOString().split('T')[0]}.csv"`);
        return res.send(csv);
      }

      res.json({
        success: true,
        data: reportData
      });

    } catch (error) {
      logger.error('Error generating inventory report:', error);
      res.status(500).json(createProblem(
        'INTERNAL_ERROR',
        'Failed to generate inventory report',
        500
      ));
    }
  }

  // Private helper methods
  private async generateStockMovementTrends(orgId: string, startDate: Date, endDate: Date) {
    // Mock implementation - in real app, this would query actual movement data
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const trends = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000));
      trends.push({
        date: date.toISOString().split('T')[0],
        in_movements: Math.floor(Math.random() * 50) + 10,
        out_movements: Math.floor(Math.random() * 40) + 15,
        total_value_change: Math.floor(Math.random() * 10000) - 5000
      });
    }

    return trends;
  }

  private async generateInventoryInsights(
    totalProducts: number,
    lowStockProducts: number,
    totalValue: number,
    categoryDistribution: any[]
  ) {
    const insights = [];

    // Stock level insights
    if (lowStockProducts > 0) {
      const riskPercentage = Math.round((lowStockProducts / totalProducts) * 100);
      insights.push({
        type: 'warning',
        title: 'Productos con bajo stock',
        message: `${lowStockProducts} productos (${riskPercentage}%) están por debajo del nivel mínimo de stock`,
        priority: riskPercentage > 20 ? 'high' : 'medium'
      });
    }

    // Category insights
    if (categoryDistribution.length > 0) {
      const topCategory = categoryDistribution[0];
      insights.push({
        type: 'info',
        title: 'Categoría principal',
        message: `${topCategory.category} es la categoría con más productos (${topCategory.count})`,
        priority: 'low'
      });
    }

    // Value insights
    if (totalValue > 100000) {
      insights.push({
        type: 'success',
        title: 'Valor de inventario alto',
        message: `El inventario tiene un valor total de €${totalValue.toLocaleString()}`,
        priority: 'low'
      });
    }

    return insights;
  }

  private async generateInventoryRecommendations(
    lowStockAlerts: any[],
    categoryDistribution: any[],
    topSuppliers: any[]
  ) {
    const recommendations = [];

    // Stock recommendations
    if (lowStockAlerts.length > 0) {
      recommendations.push({
        type: 'stock_replenishment',
        title: 'Reabastecimiento urgente',
        description: `Reabastecer ${lowStockAlerts.length} productos con bajo stock`,
        priority: 'high',
        action: 'review_suppliers'
      });
    }

    // Supplier recommendations
    if (topSuppliers.length > 0) {
      const topSupplier = topSuppliers[0];
      recommendations.push({
        type: 'supplier_optimization',
        title: 'Optimización de proveedores',
        description: `Considerar consolidar compras con ${topSupplier.supplier_name}`,
        priority: 'medium',
        action: 'analyze_supplier_performance'
      });
    }

    // Category recommendations
    if (categoryDistribution.length > 5) {
      recommendations.push({
        type: 'category_optimization',
        title: 'Optimización de categorías',
        description: 'Considerar consolidar categorías similares',
        priority: 'low',
        action: 'review_categories'
      });
    }

    return recommendations;
  }

  private async getMockStockMovements(orgId: string, whereConditions: any[], options: any) {
    // Mock implementation - in real app, this would query actual movement data
    const movements = [];
    const types = ['purchase', 'sale', 'adjustment', 'return', 'transfer'];

    for (let i = 0; i < options.limit; i++) {
      movements.push({
        id: `movement_${i}`,
        product_id: `product_${Math.floor(Math.random() * 100)}`,
        product_name: `Product ${i}`,
        type: types[Math.floor(Math.random() * types.length)],
        quantity: Math.floor(Math.random() * 100) + 1,
        previous_stock: Math.floor(Math.random() * 500),
        new_stock: Math.floor(Math.random() * 500),
        unit_cost: Math.floor(Math.random() * 100) + 10,
        total_value: Math.floor(Math.random() * 10000),
        reference: `REF-${Math.floor(Math.random() * 10000)}`,
        notes: `Movement note ${i}`,
        created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      });
    }

    return movements;
  }

  private async generateStockLevelsReport(orgId: string) {
    const products = await db
      .select({
        id: products.id,
        name: products.name,
        sku: products.sku,
        category: products.category,
        stock_quantity: products.stock_quantity,
        min_stock_level: products.min_stock_level,
        unit_price: products.unit_price,
        cost_price: products.cost_price,
        supplier_name: suppliers.name,
        status: sql<string>`CASE 
          WHEN ${products.stock_quantity} = 0 THEN 'out_of_stock'
          WHEN ${products.stock_quantity} <= ${products.min_stock_level} THEN 'low_stock'
          ELSE 'in_stock'
        END`
      })
      .from(products)
      .leftJoin(suppliers, eq(products.supplier_id, suppliers.id))
      .where(eq(products.orgId, orgId))
      .orderBy(asc(products.stock_quantity));

    return products;
  }

  private async generateSupplierPerformanceReport(orgId: string) {
    // Mock implementation
    return [
      {
        supplier_id: 'supplier_1',
        supplier_name: 'Proveedor A',
        total_products: 25,
        avg_delivery_time: 3.2,
        quality_rating: 4.5,
        total_value: 45000,
        on_time_delivery_rate: 0.95
      }
    ];
  }

  private async generateCategoryAnalysisReport(orgId: string) {
    // Mock implementation
    return [
      {
        category: 'Electrónicos',
        product_count: 15,
        total_value: 25000,
        avg_stock_level: 45,
        turnover_rate: 0.8
      }
    ];
  }

  private convertToCSV(data: any[]) {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  }
}

export const inventoryController = new InventoryController();
