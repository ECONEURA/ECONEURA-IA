import { logger } from '../lib/logger';
import { db } from '../lib/db';
import { products, suppliers, invoice_items } from '../../../db/src/schema';
import { eq, and, sql, desc, asc, count, sum, avg, min, max } from 'drizzle-orm';

export interface InventoryMetrics {
  total_products: number;
  active_products: number;
  total_inventory_value: number;
  total_inventory_cost: number;
  avg_profit_margin: number;
  stock_turnover_rate: number;
  days_of_inventory: number;
  stockout_rate: number;
  excess_stock_value: number;
  inventory_accuracy: number;
}

export interface SupplierMetrics {
  total_suppliers: number;
  active_suppliers: number;
  avg_supplier_rating: number;
  on_time_delivery_rate: number;
  quality_acceptance_rate: number;
  avg_payment_terms: number;
  supplier_diversity_score: number;
  top_suppliers_by_value: Array<{
    supplier_id: string;
    supplier_name: string;
    total_value: number;
    product_count: number;
  }>;
}

export interface FinancialMetrics {
  total_revenue: number;
  total_cost: number;
  gross_profit: number;
  gross_profit_margin: number;
  operating_expenses: number;
  net_profit: number;
  net_profit_margin: number;
  cash_flow: number;
  working_capital: number;
  return_on_inventory: number;
}

export interface OperationalMetrics {
  order_fulfillment_rate: number;
  avg_order_processing_time: number;
  customer_satisfaction_score: number;
  return_rate: number;
  lead_time_variance: number;
  forecast_accuracy: number;
  capacity_utilization: number;
  quality_metrics: {
    defect_rate: number;
    rework_rate: number;
    scrap_rate: number;
  };
}

export interface KPIScorecard {
  inventory_metrics: InventoryMetrics;
  supplier_metrics: SupplierMetrics;
  financial_metrics: FinancialMetrics;
  operational_metrics: OperationalMetrics;
  overall_score: number;
  trend_analysis: {
    period: string;
    change_percentage: number;
    trend_direction: 'improving' | 'declining' | 'stable';
  };
  alerts: string[];
  recommendations: string[];
}

export class MetricsService {
  // Generate comprehensive KPI scorecard
  async generateKPIScorecard(orgId: string, period: string = '30d'): Promise<KPIScorecard> {
    try {
      const [
        inventoryMetrics,
        supplierMetrics,
        financialMetrics,
        operationalMetrics
      ] = await Promise.all([
        this.calculateInventoryMetrics(orgId, period),
        this.calculateSupplierMetrics(orgId, period),
        this.calculateFinancialMetrics(orgId, period),
        this.calculateOperationalMetrics(orgId, period)
      ]);

      const overallScore = this.calculateOverallScore(
        inventoryMetrics,
        supplierMetrics,
        financialMetrics,
        operationalMetrics
      );

      const trendAnalysis = await this.analyzeTrends(orgId, period);
      const alerts = this.generateAlerts(inventoryMetrics, supplierMetrics, financialMetrics, operationalMetrics);
      const recommendations = this.generateRecommendations(inventoryMetrics, supplierMetrics, financialMetrics, operationalMetrics);

      const scorecard: KPIScorecard = {
        inventory_metrics: inventoryMetrics,
        supplier_metrics: supplierMetrics,
        financial_metrics: financialMetrics,
        operational_metrics: operationalMetrics,
        overall_score: overallScore,
        trend_analysis: trendAnalysis,
        alerts,
        recommendations
      };

      logger.info(`Generated KPI scorecard for org ${orgId} with overall score: ${overallScore}`);
      return scorecard;
    } catch (error) {
      logger.error('Error generating KPI scorecard:', error);
      throw error;
    }
  }

  // Calculate inventory-specific metrics
  private async calculateInventoryMetrics(orgId: string, period: string): Promise<InventoryMetrics> {
    try {
      // Get inventory data
      const inventoryData = await db
        .select({
          total_products: count(),
          active_products: count(sql`CASE WHEN ${products.is_active} THEN 1 END`),
          total_inventory_value: sum(sql`${products.stock_quantity} * ${products.unit_price}`),
          total_inventory_cost: sum(sql`${products.stock_quantity} * ${products.cost_price}`),
          avg_profit_margin: sql<number>`AVG((${products.unit_price} - ${products.cost_price}) / ${products.unit_price} * 100)`,
          stockout_products: count(sql`CASE WHEN ${products.stock_quantity} = 0 THEN 1 END`),
          excess_stock_value: sum(sql`CASE WHEN ${products.stock_quantity} > ${products.min_stock_level} * 2 THEN (${products.stock_quantity} - ${products.min_stock_level} * 2) * ${products.unit_price} ELSE 0 END`)
        })
        .from(products)
        .where(eq(products.orgId, orgId));

      const data = inventoryData[0];
      
      // Calculate derived metrics
      const stockTurnoverRate = this.calculateStockTurnoverRate(orgId, period);
      const daysOfInventory = this.calculateDaysOfInventory(data.total_inventory_value, stockTurnoverRate);
      const stockoutRate = data.total_products > 0 ? (data.stockout_products / data.total_products) * 100 : 0;
      const inventoryAccuracy = this.calculateInventoryAccuracy(orgId);

      return {
        total_products: data.total_products,
        active_products: data.active_products,
        total_inventory_value: parseFloat(data.total_inventory_value || '0'),
        total_inventory_cost: parseFloat(data.total_inventory_cost || '0'),
        avg_profit_margin: parseFloat(data.avg_profit_margin || '0'),
        stock_turnover_rate: stockTurnoverRate,
        days_of_inventory: daysOfInventory,
        stockout_rate: stockoutRate,
        excess_stock_value: parseFloat(data.excess_stock_value || '0'),
        inventory_accuracy: inventoryAccuracy
      };
    } catch (error) {
      logger.error('Error calculating inventory metrics:', error);
      throw error;
    }
  }

  // Calculate supplier-specific metrics
  private async calculateSupplierMetrics(orgId: string, period: string): Promise<SupplierMetrics> {
    try {
      // Get supplier data
      const supplierData = await db
        .select({
          total_suppliers: count(),
          active_suppliers: count(sql`CASE WHEN ${suppliers.is_active} THEN 1 END`),
          avg_rating: avg(suppliers.rating),
          avg_payment_terms: avg(sql`CAST(${suppliers.payment_terms} AS INTEGER)`)
        })
        .from(suppliers)
        .where(eq(suppliers.orgId, orgId));

      const data = supplierData[0];

      // Get top suppliers by value
      const topSuppliers = await db
        .select({
          supplier_id: suppliers.id,
          supplier_name: suppliers.name,
          total_value: sum(sql`${products.stock_quantity} * ${products.unit_price}`),
          product_count: count()
        })
        .from(suppliers)
        .leftJoin(products, eq(suppliers.id, products.supplier_id))
        .where(and(
          eq(suppliers.orgId, orgId),
          eq(suppliers.is_active, true)
        ))
        .groupBy(suppliers.id, suppliers.name)
        .orderBy(desc(sql`SUM(${products.stock_quantity} * ${products.unit_price})`))
        .limit(5);

      // Mock delivery and quality metrics (in real app, these would come from actual data)
      const onTimeDeliveryRate = 85 + Math.random() * 10; // 85-95%
      const qualityAcceptanceRate = 92 + Math.random() * 6; // 92-98%
      const supplierDiversityScore = this.calculateSupplierDiversityScore(orgId);

      return {
        total_suppliers: data.total_suppliers,
        active_suppliers: data.active_suppliers,
        avg_supplier_rating: parseFloat(data.avg_rating || '0'),
        on_time_delivery_rate: onTimeDeliveryRate,
        quality_acceptance_rate: qualityAcceptanceRate,
        avg_payment_terms: parseFloat(data.avg_payment_terms || '30'),
        supplier_diversity_score: supplierDiversityScore,
        top_suppliers_by_value: topSuppliers.map(s => ({
          supplier_id: s.supplier_id,
          supplier_name: s.supplier_name,
          total_value: parseFloat(s.total_value || '0'),
          product_count: s.product_count
        }))
      };
    } catch (error) {
      logger.error('Error calculating supplier metrics:', error);
      throw error;
    }
  }

  // Calculate financial metrics
  private async calculateFinancialMetrics(orgId: string, period: string): Promise<FinancialMetrics> {
    try {
      // Mock financial data (in real app, this would come from actual financial records)
      const totalRevenue = 150000 + Math.random() * 50000; // €150k-200k
      const totalCost = totalRevenue * (0.6 + Math.random() * 0.2); // 60-80% of revenue
      const grossProfit = totalRevenue - totalCost;
      const grossProfitMargin = (grossProfit / totalRevenue) * 100;
      
      const operatingExpenses = totalRevenue * (0.15 + Math.random() * 0.1); // 15-25% of revenue
      const netProfit = grossProfit - operatingExpenses;
      const netProfitMargin = (netProfit / totalRevenue) * 100;
      
      const cashFlow = netProfit * (0.8 + Math.random() * 0.3); // 80-110% of net profit
      const workingCapital = totalRevenue * (0.2 + Math.random() * 0.1); // 20-30% of revenue
      const returnOnInventory = (netProfit / (totalCost * 0.3)) * 100; // Assuming 30% of cost is inventory

      return {
        total_revenue: totalRevenue,
        total_cost: totalCost,
        gross_profit: grossProfit,
        gross_profit_margin: grossProfitMargin,
        operating_expenses: operatingExpenses,
        net_profit: netProfit,
        net_profit_margin: netProfitMargin,
        cash_flow: cashFlow,
        working_capital: workingCapital,
        return_on_inventory: returnOnInventory
      };
    } catch (error) {
      logger.error('Error calculating financial metrics:', error);
      throw error;
    }
  }

  // Calculate operational metrics
  private async calculateOperationalMetrics(orgId: string, period: string): Promise<OperationalMetrics> {
    try {
      // Mock operational data (in real app, this would come from actual operational records)
      const orderFulfillmentRate = 88 + Math.random() * 10; // 88-98%
      const avgOrderProcessingTime = 2 + Math.random() * 3; // 2-5 days
      const customerSatisfactionScore = 4.2 + Math.random() * 0.6; // 4.2-4.8
      const returnRate = 2 + Math.random() * 3; // 2-5%
      const leadTimeVariance = 15 + Math.random() * 20; // 15-35%
      const forecastAccuracy = 75 + Math.random() * 20; // 75-95%
      const capacityUtilization = 70 + Math.random() * 25; // 70-95%

      const qualityMetrics = {
        defect_rate: 1 + Math.random() * 2, // 1-3%
        rework_rate: 3 + Math.random() * 4, // 3-7%
        scrap_rate: 0.5 + Math.random() * 1.5 // 0.5-2%
      };

      return {
        order_fulfillment_rate: orderFulfillmentRate,
        avg_order_processing_time: avgOrderProcessingTime,
        customer_satisfaction_score: customerSatisfactionScore,
        return_rate: returnRate,
        lead_time_variance: leadTimeVariance,
        forecast_accuracy: forecastAccuracy,
        capacity_utilization: capacityUtilization,
        quality_metrics: qualityMetrics
      };
    } catch (error) {
      logger.error('Error calculating operational metrics:', error);
      throw error;
    }
  }

  // Calculate overall performance score
  private calculateOverallScore(
    inventory: InventoryMetrics,
    supplier: SupplierMetrics,
    financial: FinancialMetrics,
    operational: OperationalMetrics
  ): number {
    const weights = {
      inventory: 0.25,
      supplier: 0.20,
      financial: 0.30,
      operational: 0.25
    };

    const inventoryScore = this.calculateInventoryScore(inventory);
    const supplierScore = this.calculateSupplierScore(supplier);
    const financialScore = this.calculateFinancialScore(financial);
    const operationalScore = this.calculateOperationalScore(operational);

    const overallScore = (
      inventoryScore * weights.inventory +
      supplierScore * weights.supplier +
      financialScore * weights.financial +
      operationalScore * weights.operational
    );

    return Math.round(overallScore * 100) / 100;
  }

  // Calculate individual category scores
  private calculateInventoryScore(metrics: InventoryMetrics): number {
    const scores = {
      stockout_rate: Math.max(0, 100 - metrics.stockout_rate * 10),
      inventory_accuracy: metrics.inventory_accuracy,
      stock_turnover_rate: Math.min(100, metrics.stock_turnover_rate * 10),
      profit_margin: Math.min(100, metrics.avg_profit_margin * 2)
    };

    return Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.keys(scores).length;
  }

  private calculateSupplierScore(metrics: SupplierMetrics): number {
    const scores = {
      delivery_rate: metrics.on_time_delivery_rate,
      quality_rate: metrics.quality_acceptance_rate,
      avg_rating: metrics.avg_supplier_rating * 20, // Convert 0-5 to 0-100
      diversity_score: metrics.supplier_diversity_score
    };

    return Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.keys(scores).length;
  }

  private calculateFinancialScore(metrics: FinancialMetrics): number {
    const scores = {
      profit_margin: Math.min(100, metrics.net_profit_margin * 5),
      return_on_inventory: Math.min(100, metrics.return_on_inventory),
      cash_flow: Math.min(100, (metrics.cash_flow / metrics.total_revenue) * 100)
    };

    return Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.keys(scores).length;
  }

  private calculateOperationalScore(metrics: OperationalMetrics): number {
    const scores = {
      fulfillment_rate: metrics.order_fulfillment_rate,
      customer_satisfaction: metrics.customer_satisfaction_score * 20, // Convert 0-5 to 0-100
      forecast_accuracy: metrics.forecast_accuracy,
      quality_score: 100 - (metrics.quality_metrics.defect_rate * 20)
    };

    return Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.keys(scores).length;
  }

  // Helper methods
  private async calculateStockTurnoverRate(orgId: string, period: string): Promise<number> {
    // Mock calculation - in real app, this would use actual sales data
    return 4 + Math.random() * 6; // 4-10 times per year
  }

  private calculateDaysOfInventory(totalValue: number, turnoverRate: number): number {
    return turnoverRate > 0 ? 365 / turnoverRate : 0;
  }

  private async calculateInventoryAccuracy(orgId: string): Promise<number> {
    // Mock calculation - in real app, this would compare physical vs system counts
    return 92 + Math.random() * 6; // 92-98%
  }

  private async calculateSupplierDiversityScore(orgId: string): Promise<number> {
    // Mock calculation - in real app, this would analyze supplier concentration
    return 75 + Math.random() * 20; // 75-95%
  }

  private async analyzeTrends(orgId: string, period: string): Promise<{
    period: string;
    change_percentage: number;
    trend_direction: 'improving' | 'declining' | 'stable';
  }> {
    // Mock trend analysis
    const changePercentage = -5 + Math.random() * 20; // -5% to +15%
    const trendDirection = changePercentage > 5 ? 'improving' : changePercentage < -5 ? 'declining' : 'stable';

    return {
      period,
      change_percentage: Math.round(changePercentage * 100) / 100,
      trend_direction: trendDirection
    };
  }

  private generateAlerts(
    inventory: InventoryMetrics,
    supplier: SupplierMetrics,
    financial: FinancialMetrics,
    operational: OperationalMetrics
  ): string[] {
    const alerts = [];

    if (inventory.stockout_rate > 5) {
      alerts.push(`Alto índice de productos sin stock: ${inventory.stockout_rate.toFixed(1)}%`);
    }

    if (supplier.on_time_delivery_rate < 90) {
      alerts.push(`Baja tasa de entrega a tiempo: ${supplier.on_time_delivery_rate.toFixed(1)}%`);
    }

    if (financial.net_profit_margin < 10) {
      alerts.push(`Margen de beneficio bajo: ${financial.net_profit_margin.toFixed(1)}%`);
    }

    if (operational.order_fulfillment_rate < 95) {
      alerts.push(`Tasa de cumplimiento de pedidos baja: ${operational.order_fulfillment_rate.toFixed(1)}%`);
    }

    return alerts;
  }

  private generateRecommendations(
    inventory: InventoryMetrics,
    supplier: SupplierMetrics,
    financial: FinancialMetrics,
    operational: OperationalMetrics
  ): string[] {
    const recommendations = [];

    if (inventory.stockout_rate > 5) {
      recommendations.push('Implementar sistema de reabastecimiento automático');
    }

    if (inventory.excess_stock_value > 10000) {
      recommendations.push('Optimizar niveles de inventario para reducir costos de almacenamiento');
    }

    if (supplier.avg_supplier_rating < 4) {
      recommendations.push('Mejorar relaciones con proveedores y evaluar nuevos proveedores');
    }

    if (financial.net_profit_margin < 10) {
      recommendations.push('Revisar estrategia de precios y optimizar costos operativos');
    }

    if (operational.forecast_accuracy < 80) {
      recommendations.push('Mejorar precisión de pronósticos de demanda');
    }

    return recommendations;
  }
}

export const metricsService = new MetricsService();

