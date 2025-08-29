import { Request, Response } from 'express';
import { db } from '../lib/db';
import { products, suppliers, invoice_items } from '../../../db/src/schema';
import { eq, and, sql, desc, asc, count, sum, avg, min, max } from 'drizzle-orm';
import { createProblem } from '../lib/problem';
import { logger } from '../lib/logger';

export class ReportsController {
  // Generate inventory valuation report
  async generateInventoryValuation(req: Request, res: Response) {
    try {
      const { format = 'json', include_suppliers = 'true' } = req.query;
      const orgId = req.headers['x-org-id'] as string;

      if (!orgId) {
        return res.status(400).json(createProblem(
          'MISSING_ORG_ID',
          'Organization ID is required',
          400
        ));
      }

      // Get inventory valuation by category
      const categoryValuation = await db
        .select({
          category: products.category,
          product_count: count(),
          total_quantity: sum(products.stock_quantity),
          avg_unit_price: avg(products.unit_price),
          total_value: sum(sql`${products.stock_quantity} * ${products.unit_price}`),
          avg_cost: avg(products.cost_price),
          total_cost: sum(sql`${products.stock_quantity} * ${products.cost_price}`),
          profit_margin: sql<number>`AVG((${products.unit_price} - ${products.cost_price}) / ${products.unit_price} * 100)`
        })
        .from(products)
        .where(and(
          eq(products.orgId, orgId),
          eq(products.is_active, true)
        ))
        .groupBy(products.category)
        .orderBy(desc(sql`SUM(${products.stock_quantity} * ${products.unit_price})`));

      // Get supplier performance if requested
      let supplierPerformance = null;
      if (include_suppliers === 'true') {
        supplierPerformance = await db
          .select({
            supplier_id: suppliers.id,
            supplier_name: suppliers.name,
            product_count: count(),
            total_value: sum(sql`${products.stock_quantity} * ${products.unit_price}`),
            avg_rating: avg(suppliers.rating),
            payment_terms: suppliers.payment_terms
          })
          .from(suppliers)
          .leftJoin(products, eq(suppliers.id, products.supplier_id))
          .where(and(
            eq(suppliers.orgId, orgId),
            eq(suppliers.is_active, true)
          ))
          .groupBy(suppliers.id, suppliers.name, suppliers.payment_terms)
          .orderBy(desc(sql`SUM(${products.stock_quantity} * ${products.unit_price})`));
      }

      // Calculate summary metrics
      const summary = await db
        .select({
          total_products: count(),
          active_products: count(sql`CASE WHEN ${products.is_active} THEN 1 END`),
          total_inventory_value: sum(sql`${products.stock_quantity} * ${products.unit_price}`),
          total_inventory_cost: sum(sql`${products.stock_quantity} * ${products.cost_price}`),
          avg_profit_margin: sql<number>`AVG((${products.unit_price} - ${products.cost_price}) / ${products.unit_price} * 100)`,
          low_stock_products: count(sql`CASE WHEN ${products.stock_quantity} <= ${products.min_stock_level} THEN 1 END`),
          out_of_stock_products: count(sql`CASE WHEN ${products.stock_quantity} = 0 THEN 1 END`)
        })
        .from(products)
        .where(eq(products.orgId, orgId));

      const report = {
        generated_at: new Date().toISOString(),
        organization_id: orgId,
        summary: summary[0],
        category_valuation: categoryValuation,
        supplier_performance: supplierPerformance,
        metadata: {
          total_categories: categoryValuation.length,
          total_suppliers: supplierPerformance?.length || 0,
          report_type: 'inventory_valuation'
        }
      };

      if (format === 'csv') {
        const csv = this.convertInventoryValuationToCSV(report);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="inventory_valuation_${new Date().toISOString().split('T')[0]}.csv"`);
        return res.send(csv);
      }

      res.json({
        success: true,
        data: report
      });

    } catch (error) {
      logger.error('Error generating inventory valuation report:', error);
      res.status(500).json(createProblem(
        'INTERNAL_ERROR',
        'Failed to generate inventory valuation report',
        500
      ));
    }
  }

  // Generate supplier performance report
  async generateSupplierPerformance(req: Request, res: Response) {
    try {
      const { format = 'json', period = '30d' } = req.query;
      const orgId = req.headers['x-org-id'] as string;

      if (!orgId) {
        return res.status(400).json(createProblem(
          'MISSING_ORG_ID',
          'Organization ID is required',
          400
        ));
      }

      // Calculate date range
      const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
      const startDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));

      // Get supplier performance metrics
      const supplierPerformance = await db
        .select({
          supplier_id: suppliers.id,
          supplier_name: suppliers.name,
          contact_person: suppliers.contact_person,
          email: suppliers.email,
          phone: suppliers.phone,
          rating: suppliers.rating,
          payment_terms: suppliers.payment_terms,
          credit_limit: suppliers.credit_limit,
          product_count: count(),
          total_inventory_value: sum(sql`${products.stock_quantity} * ${products.unit_price}`),
          low_stock_products: count(sql`CASE WHEN ${products.stock_quantity} <= ${products.min_stock_level} THEN 1 END`),
          out_of_stock_products: count(sql`CASE WHEN ${products.stock_quantity} = 0 THEN 1 END`),
          avg_product_price: avg(products.unit_price),
          avg_product_cost: avg(products.cost_price),
          total_purchase_value: sum(sql`${products.stock_quantity} * ${products.cost_price}`),
          is_active: suppliers.is_active,
          created_at: suppliers.created_at
        })
        .from(suppliers)
        .leftJoin(products, eq(suppliers.id, products.supplier_id))
        .where(and(
          eq(suppliers.orgId, orgId),
          sql`${suppliers.created_at} >= ${startDate}`
        ))
        .groupBy(
          suppliers.id, 
          suppliers.name, 
          suppliers.contact_person, 
          suppliers.email, 
          suppliers.phone,
          suppliers.rating,
          suppliers.payment_terms,
          suppliers.credit_limit,
          suppliers.is_active,
          suppliers.created_at
        )
        .orderBy(desc(sql`SUM(${products.stock_quantity} * ${products.unit_price})`));

      // Calculate supplier rankings
      const rankings = supplierPerformance.map((supplier, index) => ({
        ...supplier,
        rank: index + 1,
        performance_score: this.calculateSupplierScore(supplier)
      }));

      const report = {
        generated_at: new Date().toISOString(),
        organization_id: orgId,
        period,
        total_suppliers: rankings.length,
        active_suppliers: rankings.filter(s => s.is_active).length,
        supplier_rankings: rankings,
        top_performers: rankings.slice(0, 5),
        needs_attention: rankings.filter(s => 
          s.low_stock_products > 0 || s.out_of_stock_products > 0
        ),
        metadata: {
          report_type: 'supplier_performance',
          period_days: days
        }
      };

      if (format === 'csv') {
        const csv = this.convertSupplierPerformanceToCSV(report);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="supplier_performance_${new Date().toISOString().split('T')[0]}.csv"`);
        return res.send(csv);
      }

      res.json({
        success: true,
        data: report
      });

    } catch (error) {
      logger.error('Error generating supplier performance report:', error);
      res.status(500).json(createProblem(
        'INTERNAL_ERROR',
        'Failed to generate supplier performance report',
        500
      ));
    }
  }

  // Generate stock movement report
  async generateStockMovement(req: Request, res: Response) {
    try {
      const { format = 'json', start_date, end_date, product_id } = req.query;
      const orgId = req.headers['x-org-id'] as string;

      if (!orgId) {
        return res.status(400).json(createProblem(
          'MISSING_ORG_ID',
          'Organization ID is required',
          400
        ));
      }

      // Build date range
      const start = start_date ? new Date(start_date as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = end_date ? new Date(end_date as string) : new Date();

      // Get stock movements (mock data for now)
      const movements = await this.getMockStockMovements(orgId, start, end, product_id as string);

      // Calculate movement statistics
      const stats = {
        total_movements: movements.length,
        in_movements: movements.filter(m => m.type === 'purchase' || m.type === 'return').length,
        out_movements: movements.filter(m => m.type === 'sale' || m.type === 'adjustment').length,
        total_value_change: movements.reduce((sum, m) => sum + m.total_value, 0),
        avg_movements_per_day: movements.length / Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      };

      const report = {
        generated_at: new Date().toISOString(),
        organization_id: orgId,
        date_range: {
          start: start.toISOString(),
          end: end.toISOString()
        },
        statistics: stats,
        movements: movements,
        top_products: this.getTopProductsByMovement(movements),
        movement_trends: this.calculateMovementTrends(movements, start, end),
        metadata: {
          report_type: 'stock_movement',
          product_filter: product_id || 'all'
        }
      };

      if (format === 'csv') {
        const csv = this.convertStockMovementToCSV(report);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="stock_movement_${new Date().toISOString().split('T')[0]}.csv"`);
        return res.send(csv);
      }

      res.json({
        success: true,
        data: report
      });

    } catch (error) {
      logger.error('Error generating stock movement report:', error);
      res.status(500).json(createProblem(
        'INTERNAL_ERROR',
        'Failed to generate stock movement report',
        500
      ));
    }
  }

  // Generate comprehensive inventory report
  async generateComprehensiveReport(req: Request, res: Response) {
    try {
      const { format = 'json' } = req.query;
      const orgId = req.headers['x-org-id'] as string;

      if (!orgId) {
        return res.status(400).json(createProblem(
          'MISSING_ORG_ID',
          'Organization ID is required',
          400
        ));
      }

      // Get all metrics in parallel
      const [
        inventoryValuation,
        supplierPerformance,
        stockMovements,
        categoryAnalysis,
        alertSummary
      ] = await Promise.all([
        this.getInventoryValuationData(orgId),
        this.getSupplierPerformanceData(orgId),
        this.getStockMovementData(orgId),
        this.getCategoryAnalysisData(orgId),
        this.getAlertSummaryData(orgId)
      ]);

      const report = {
        generated_at: new Date().toISOString(),
        organization_id: orgId,
        executive_summary: {
          total_inventory_value: inventoryValuation.total_value,
          total_products: inventoryValuation.total_products,
          active_suppliers: supplierPerformance.active_suppliers,
          stock_alerts: alertSummary.total_alerts,
          profit_margin: inventoryValuation.avg_profit_margin
        },
        inventory_valuation: inventoryValuation,
        supplier_performance: supplierPerformance,
        stock_movements: stockMovements,
        category_analysis: categoryAnalysis,
        alerts_summary: alertSummary,
        recommendations: this.generateRecommendations(
          inventoryValuation,
          supplierPerformance,
          alertSummary
        ),
        metadata: {
          report_type: 'comprehensive_inventory',
          sections: 6
        }
      };

      if (format === 'csv') {
        const csv = this.convertComprehensiveReportToCSV(report);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="comprehensive_inventory_${new Date().toISOString().split('T')[0]}.csv"`);
        return res.send(csv);
      }

      res.json({
        success: true,
        data: report
      });

    } catch (error) {
      logger.error('Error generating comprehensive report:', error);
      res.status(500).json(createProblem(
        'INTERNAL_ERROR',
        'Failed to generate comprehensive report',
        500
      ));
    }
  }

  // Private helper methods
  private calculateSupplierScore(supplier: any): number {
    let score = 0;
    
    // Rating contribution (0-50 points)
    if (supplier.rating) {
      score += supplier.rating * 10;
    }
    
    // Product count contribution (0-20 points)
    score += Math.min(supplier.product_count * 2, 20);
    
    // Stock health contribution (0-30 points)
    const stockHealth = 30 - (supplier.low_stock_products * 3) - (supplier.out_of_stock_products * 5);
    score += Math.max(stockHealth, 0);
    
    return Math.round(score);
  }

  private async getMockStockMovements(orgId: string, startDate: Date, endDate: Date, productId?: string) {
    // Mock implementation - in real app, this would query actual movement data
    const movements = [];
    const types = ['purchase', 'sale', 'adjustment', 'return', 'transfer'];
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    for (let i = 0; i < Math.min(days * 2, 100); i++) {
      movements.push({
        id: `movement_${i}`,
        product_id: productId || `product_${Math.floor(Math.random() * 100)}`,
        product_name: `Product ${i}`,
        type: types[Math.floor(Math.random() * types.length)],
        quantity: Math.floor(Math.random() * 100) + 1,
        unit_price: Math.floor(Math.random() * 100) + 10,
        total_value: Math.floor(Math.random() * 10000),
        reference: `REF-${Math.floor(Math.random() * 10000)}`,
        notes: `Movement note ${i}`,
        created_at: new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())).toISOString()
      });
    }

    return movements.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  private getTopProductsByMovement(movements: any[]) {
    const productStats = new Map();
    
    movements.forEach(movement => {
      if (!productStats.has(movement.product_id)) {
        productStats.set(movement.product_id, {
          product_id: movement.product_id,
          product_name: movement.product_name,
          total_movements: 0,
          total_quantity: 0,
          total_value: 0
        });
      }
      
      const stats = productStats.get(movement.product_id);
      stats.total_movements++;
      stats.total_quantity += movement.quantity;
      stats.total_value += movement.total_value;
    });

    return Array.from(productStats.values())
      .sort((a, b) => b.total_movements - a.total_movements)
      .slice(0, 10);
  }

  private calculateMovementTrends(movements: any[], startDate: Date, endDate: Date) {
    const trends = [];
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000));
      const dayMovements = movements.filter(m => 
        new Date(m.created_at).toDateString() === date.toDateString()
      );

      trends.push({
        date: date.toISOString().split('T')[0],
        movements_count: dayMovements.length,
        total_quantity: dayMovements.reduce((sum, m) => sum + m.quantity, 0),
        total_value: dayMovements.reduce((sum, m) => sum + m.total_value, 0)
      });
    }

    return trends;
  }

  private async getInventoryValuationData(orgId: string) {
    const result = await db
      .select({
        total_products: count(),
        total_value: sum(sql`${products.stock_quantity} * ${products.unit_price}`),
        total_cost: sum(sql`${products.stock_quantity} * ${products.cost_price}`),
        avg_profit_margin: sql<number>`AVG((${products.unit_price} - ${products.cost_price}) / ${products.unit_price} * 100)`
      })
      .from(products)
      .where(eq(products.orgId, orgId));

    return result[0];
  }

  private async getSupplierPerformanceData(orgId: string) {
    const result = await db
      .select({
        total_suppliers: count(),
        active_suppliers: count(sql`CASE WHEN ${suppliers.is_active} THEN 1 END`),
        avg_rating: avg(suppliers.rating)
      })
      .from(suppliers)
      .where(eq(suppliers.orgId, orgId));

    return result[0];
  }

  private async getStockMovementData(orgId: string) {
    // Mock implementation
    return {
      total_movements: 150,
      avg_movements_per_day: 5,
      total_value_change: 25000
    };
  }

  private async getCategoryAnalysisData(orgId: string) {
    const result = await db
      .select({
        category: products.category,
        product_count: count(),
        total_value: sum(sql`${products.stock_quantity} * ${products.unit_price}`)
      })
      .from(products)
      .where(eq(products.orgId, orgId))
      .groupBy(products.category)
      .orderBy(desc(sql`SUM(${products.stock_quantity} * ${products.unit_price})`));

    return result;
  }

  private async getAlertSummaryData(orgId: string) {
    const result = await db
      .select({
        total_alerts: count(sql`CASE WHEN ${products.stock_quantity} <= ${products.min_stock_level} THEN 1 END`),
        low_stock_alerts: count(sql`CASE WHEN ${products.stock_quantity} <= ${products.min_stock_level} AND ${products.stock_quantity} > 0 THEN 1 END`),
        out_of_stock_alerts: count(sql`CASE WHEN ${products.stock_quantity} = 0 THEN 1 END`)
      })
      .from(products)
      .where(eq(products.orgId, orgId));

    return result[0];
  }

  private generateRecommendations(inventoryValuation: any, supplierPerformance: any, alertSummary: any) {
    const recommendations = [];

    if (alertSummary.total_alerts > 0) {
      recommendations.push({
        type: 'stock_management',
        priority: 'high',
        title: 'Revisar productos con bajo stock',
        description: `${alertSummary.total_alerts} productos requieren atención inmediata`,
        action: 'review_low_stock_products'
      });
    }

    if (inventoryValuation.avg_profit_margin < 20) {
      recommendations.push({
        type: 'pricing',
        priority: 'medium',
        title: 'Optimizar precios',
        description: 'El margen de beneficio promedio está por debajo del objetivo',
        action: 'review_pricing_strategy'
      });
    }

    if (supplierPerformance.active_suppliers < 5) {
      recommendations.push({
        type: 'supplier_diversification',
        priority: 'low',
        title: 'Diversificar proveedores',
        description: 'Considerar agregar más proveedores para reducir riesgos',
        action: 'evaluate_new_suppliers'
      });
    }

    return recommendations;
  }

  // CSV conversion methods
  private convertInventoryValuationToCSV(report: any): string {
    const headers = ['Category', 'Product Count', 'Total Quantity', 'Avg Unit Price', 'Total Value', 'Avg Cost', 'Total Cost', 'Profit Margin %'];
    const rows = [headers.join(',')];

    report.category_valuation.forEach((category: any) => {
      rows.push([
        category.category || 'Uncategorized',
        category.product_count,
        category.total_quantity,
        category.avg_unit_price,
        category.total_value,
        category.avg_cost,
        category.total_cost,
        category.profit_margin
      ].join(','));
    });

    return rows.join('\n');
  }

  private convertSupplierPerformanceToCSV(report: any): string {
    const headers = ['Rank', 'Supplier Name', 'Contact Person', 'Email', 'Rating', 'Product Count', 'Total Value', 'Performance Score'];
    const rows = [headers.join(',')];

    report.supplier_rankings.forEach((supplier: any) => {
      rows.push([
        supplier.rank,
        supplier.supplier_name,
        supplier.contact_person || '',
        supplier.email || '',
        supplier.rating || '',
        supplier.product_count,
        supplier.total_inventory_value,
        supplier.performance_score
      ].join(','));
    });

    return rows.join('\n');
  }

  private convertStockMovementToCSV(report: any): string {
    const headers = ['Date', 'Product Name', 'Type', 'Quantity', 'Unit Price', 'Total Value', 'Reference'];
    const rows = [headers.join(',')];

    report.movements.forEach((movement: any) => {
      rows.push([
        movement.created_at.split('T')[0],
        movement.product_name,
        movement.type,
        movement.quantity,
        movement.unit_price,
        movement.total_value,
        movement.reference
      ].join(','));
    });

    return rows.join('\n');
  }

  private convertComprehensiveReportToCSV(report: any): string {
    // This would be a more complex CSV with multiple sections
    const sections = [
      ['EXECUTIVE SUMMARY'],
      ['Total Inventory Value', report.executive_summary.total_inventory_value],
      ['Total Products', report.executive_summary.total_products],
      ['Active Suppliers', report.executive_summary.active_suppliers],
      ['Stock Alerts', report.executive_summary.stock_alerts],
      ['Profit Margin %', report.executive_summary.profit_margin],
      [''],
      ['RECOMMENDATIONS'],
      ...report.recommendations.map((rec: any) => [rec.title, rec.description, rec.priority])
    ];

    return sections.map(row => row.join(',')).join('\n');
  }
}

export const reportsController = new ReportsController();

