import { logger } from '../lib/logger';
import { db } from '../lib/db';
import { products, invoice_items } from '../../../db/src/schema';
import { eq, and, sql, desc, asc, count, sum, avg } from 'drizzle-orm';

export interface DemandPrediction {
  product_id: string;
  product_name: string;
  predicted_demand: number;
  confidence_level: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  seasonality_factor: number;
  next_month_forecast: number;
  reorder_point: number;
  safety_stock: number;
}

export interface InventoryOptimization {
  product_id: string;
  current_stock: number;
  optimal_stock: number;
  excess_stock: number;
  stockout_risk: number;
  cost_savings: number;
  recommendations: string[];
}

export interface SeasonalAnalysis {
  product_id: string;
  seasonal_pattern: 'high' | 'low' | 'moderate';
  peak_months: number[];
  low_months: number[];
  seasonal_factor: number;
}

export class PredictiveAIService {
  // Predict demand for products
  async predictDemand(orgId: string, productIds?: string[]): Promise<DemandPrediction[]> {
    try {
      const predictions: DemandPrediction[] = [];
      
      // Get historical sales data
      const historicalData = await this.getHistoricalSalesData(orgId, productIds);
      
      for (const product of historicalData) {
        const prediction = await this.calculateDemandPrediction(product);
        predictions.push(prediction);
      }

      logger.info(`Generated demand predictions for ${predictions.length} products`);
      return predictions;
    } catch (error) {
      logger.error('Error predicting demand:', error);
      throw error;
    }
  }

  // Optimize inventory levels
  async optimizeInventory(orgId: string): Promise<InventoryOptimization[]> {
    try {
      const optimizations: InventoryOptimization[] = [];
      
      // Get current inventory and demand predictions
      const [currentInventory, demandPredictions] = await Promise.all([
        this.getCurrentInventory(orgId),
        this.predictDemand(orgId)
      ]);

      for (const product of currentInventory) {
        const prediction = demandPredictions.find(p => p.product_id === product.id);
        if (prediction) {
          const optimization = this.calculateOptimalInventory(product, prediction);
          optimizations.push(optimization);
        }
      }

      logger.info(`Generated inventory optimizations for ${optimizations.length} products`);
      return optimizations;
    } catch (error) {
      logger.error('Error optimizing inventory:', error);
      throw error;
    }
  }

  // Analyze seasonal patterns
  async analyzeSeasonality(orgId: string): Promise<SeasonalAnalysis[]> {
    try {
      const analysis: SeasonalAnalysis[] = [];
      
      // Get monthly sales data for the last 2 years
      const monthlyData = await this.getMonthlySalesData(orgId);
      
      for (const product of monthlyData) {
        const seasonalPattern = this.calculateSeasonalPattern(product);
        analysis.push(seasonalPattern);
      }

      logger.info(`Generated seasonal analysis for ${analysis.length} products`);
      return analysis;
    } catch (error) {
      logger.error('Error analyzing seasonality:', error);
      throw error;
    }
  }

  // Generate AI-powered recommendations
  async generateRecommendations(orgId: string): Promise<{
    immediate_actions: string[];
    short_term_goals: string[];
    long_term_strategies: string[];
    risk_alerts: string[];
    opportunities: string[];
  }> {
    try {
      const [demandPredictions, inventoryOptimizations, seasonalAnalysis] = await Promise.all([
        this.predictDemand(orgId),
        this.optimizeInventory(orgId),
        this.analyzeSeasonality(orgId)
      ]);

      const recommendations = {
        immediate_actions: this.generateImmediateActions(inventoryOptimizations),
        short_term_goals: this.generateShortTermGoals(demandPredictions),
        long_term_strategies: this.generateLongTermStrategies(seasonalAnalysis),
        risk_alerts: this.generateRiskAlerts(demandPredictions, inventoryOptimizations),
        opportunities: this.generateOpportunities(demandPredictions, seasonalAnalysis)
      };

      logger.info('Generated AI-powered recommendations');
      return recommendations;
    } catch (error) {
      logger.error('Error generating recommendations:', error);
      throw error;
    }
  }

  // Private helper methods
  private async getHistoricalSalesData(orgId: string, productIds?: string[]) {
    // Mock implementation - in real app, this would query actual sales data
    const mockData = [
      {
        id: 'product_1',
        name: 'Producto A',
        monthly_sales: [120, 135, 110, 145, 130, 140, 125, 150, 135, 140, 130, 145],
        avg_monthly_sales: 133.75,
        trend: 0.8,
        seasonality: [0.9, 1.0, 0.8, 1.1, 1.0, 1.05, 0.95, 1.1, 1.0, 1.05, 0.95, 1.1]
      },
      {
        id: 'product_2',
        name: 'Producto B',
        monthly_sales: [80, 85, 90, 95, 100, 105, 110, 115, 120, 125, 130, 135],
        avg_monthly_sales: 105.83,
        trend: 4.5,
        seasonality: [0.75, 0.8, 0.85, 0.9, 0.95, 1.0, 1.05, 1.1, 1.15, 1.2, 1.25, 1.3]
      }
    ];

    return productIds ? mockData.filter(p => productIds.includes(p.id)) : mockData;
  }

  private async calculateDemandPrediction(product: any): Promise<DemandPrediction> {
    const currentMonth = new Date().getMonth();
    const seasonalFactor = product.seasonality[currentMonth];
    const trendAdjustment = product.trend * 0.1;
    
    const predictedDemand = Math.round(
      product.avg_monthly_sales * seasonalFactor * (1 + trendAdjustment)
    );

    const confidenceLevel = this.calculateConfidenceLevel(product);
    const trend = this.determineTrend(product.trend);
    const nextMonthForecast = Math.round(
      product.avg_monthly_sales * product.seasonality[(currentMonth + 1) % 12] * (1 + trendAdjustment)
    );

    return {
      product_id: product.id,
      product_name: product.name,
      predicted_demand: predictedDemand,
      confidence_level: confidenceLevel,
      trend,
      seasonality_factor: seasonalFactor,
      next_month_forecast: nextMonthForecast,
      reorder_point: Math.round(predictedDemand * 0.3),
      safety_stock: Math.round(predictedDemand * 0.2)
    };
  }

  private async getCurrentInventory(orgId: string) {
    // Mock implementation
    return [
      { id: 'product_1', name: 'Producto A', current_stock: 150, unit_cost: 25, unit_price: 40 },
      { id: 'product_2', name: 'Producto B', current_stock: 80, unit_cost: 30, unit_price: 50 }
    ];
  }

  private calculateOptimalInventory(product: any, prediction: DemandPrediction): InventoryOptimization {
    const optimalStock = prediction.predicted_demand + prediction.safety_stock;
    const excessStock = Math.max(0, product.current_stock - optimalStock);
    const stockoutRisk = product.current_stock < prediction.reorder_point ? 1 : 0;
    const costSavings = excessStock * product.unit_cost * 0.1; // 10% holding cost

    const recommendations = [];
    if (product.current_stock < prediction.reorder_point) {
      recommendations.push(`Reabastecer inmediatamente - stock bajo`);
    }
    if (excessStock > 0) {
      recommendations.push(`Reducir pedidos - exceso de stock de ${excessStock} unidades`);
    }
    if (prediction.trend === 'increasing') {
      recommendations.push(`Considerar aumentar stock de seguridad`);
    }

    return {
      product_id: product.id,
      current_stock: product.current_stock,
      optimal_stock: optimalStock,
      excess_stock: excessStock,
      stockout_risk: stockoutRisk,
      cost_savings: costSavings,
      recommendations
    };
  }

  private async getMonthlySalesData(orgId: string) {
    // Mock implementation
    return [
      {
        id: 'product_1',
        name: 'Producto A',
        monthly_sales: [120, 135, 110, 145, 130, 140, 125, 150, 135, 140, 130, 145]
      },
      {
        id: 'product_2',
        name: 'Producto B',
        monthly_sales: [80, 85, 90, 95, 100, 105, 110, 115, 120, 125, 130, 135]
      }
    ];
  }

  private calculateSeasonalPattern(product: any): SeasonalAnalysis {
    const sales = product.monthly_sales;
    const avgSales = sales.reduce((a: number, b: number) => a + b, 0) / sales.length;
    
    const peakMonths = sales
      .map((sale: number, index: number) => ({ sale, month: index + 1 }))
      .filter((item: any) => item.sale > avgSales * 1.1)
      .map((item: any) => item.month);

    const lowMonths = sales
      .map((sale: number, index: number) => ({ sale, month: index + 1 }))
      .filter((item: any) => item.sale < avgSales * 0.9)
      .map((item: any) => item.month);

    const seasonalFactor = Math.max(...sales) / Math.min(...sales);
    const seasonalPattern = seasonalFactor > 1.5 ? 'high' : seasonalFactor > 1.2 ? 'moderate' : 'low';

    return {
      product_id: product.id,
      seasonal_pattern: seasonalPattern,
      peak_months: peakMonths,
      low_months: lowMonths,
      seasonal_factor: seasonalFactor
    };
  }

  private calculateConfidenceLevel(product: any): number {
    const variance = this.calculateVariance(product.monthly_sales);
    const confidence = Math.max(0.5, 1 - (variance / 100));
    return Math.round(confidence * 100);
  }

  private calculateVariance(data: number[]): number {
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const variance = data.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / data.length;
    return variance;
  }

  private determineTrend(trendValue: number): 'increasing' | 'decreasing' | 'stable' {
    if (trendValue > 1) return 'increasing';
    if (trendValue < -1) return 'decreasing';
    return 'stable';
  }

  private generateImmediateActions(optimizations: InventoryOptimization[]): string[] {
    const actions = [];
    
    const lowStockProducts = optimizations.filter(o => o.stockout_risk > 0);
    if (lowStockProducts.length > 0) {
      actions.push(`Reabastecer ${lowStockProducts.length} productos con stock bajo`);
    }

    const excessStockProducts = optimizations.filter(o => o.excess_stock > 0);
    if (excessStockProducts.length > 0) {
      actions.push(`Revisar ${excessStockProducts.length} productos con exceso de stock`);
    }

    const totalSavings = optimizations.reduce((sum, o) => sum + o.cost_savings, 0);
    if (totalSavings > 0) {
      actions.push(`Optimizar inventario para ahorrar €${totalSavings.toFixed(2)}`);
    }

    return actions;
  }

  private generateShortTermGoals(predictions: DemandPrediction[]): string[] {
    const goals = [];
    
    const increasingTrends = predictions.filter(p => p.trend === 'increasing');
    if (increasingTrends.length > 0) {
      goals.push(`Preparar para aumento de demanda en ${increasingTrends.length} productos`);
    }

    const highConfidence = predictions.filter(p => p.confidence_level > 80);
    if (highConfidence.length > 0) {
      goals.push(`Optimizar pedidos para ${highConfidence.length} productos con alta confianza`);
    }

    return goals;
  }

  private generateLongTermStrategies(seasonalAnalysis: SeasonalAnalysis[]): string[] {
    const strategies = [];
    
    const highSeasonal = seasonalAnalysis.filter(s => s.seasonal_pattern === 'high');
    if (highSeasonal.length > 0) {
      strategies.push(`Desarrollar estrategias estacionales para ${highSeasonal.length} productos`);
    }

    return strategies;
  }

  private generateRiskAlerts(predictions: DemandPrediction[], optimizations: InventoryOptimization[]): string[] {
    const alerts = [];
    
    const lowConfidence = predictions.filter(p => p.confidence_level < 60);
    if (lowConfidence.length > 0) {
      alerts.push(`${lowConfidence.length} productos con predicciones de baja confianza`);
    }

    const highRisk = optimizations.filter(o => o.stockout_risk > 0);
    if (highRisk.length > 0) {
      alerts.push(`Riesgo de stockout en ${highRisk.length} productos`);
    }

    return alerts;
  }

  private generateOpportunities(predictions: DemandPrediction[], seasonalAnalysis: SeasonalAnalysis[]): string[] {
    const opportunities = [];
    
    const increasingDemand = predictions.filter(p => p.trend === 'increasing');
    if (increasingDemand.length > 0) {
      opportunities.push(`Oportunidad de crecimiento en ${increasingDemand.length} productos`);
    }

    const stableProducts = predictions.filter(p => p.trend === 'stable');
    if (stableProducts.length > 0) {
      opportunities.push(`${stableProducts.length} productos con demanda estable`);
    }

    return opportunities;
  }
}

export const predictiveAIService = new PredictiveAIService();

