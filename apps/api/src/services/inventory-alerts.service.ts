import { db } from '../lib/db';
import { products, suppliers } from '../../../db/src/schema';
import { eq, and, lte, sql } from 'drizzle-orm';
import { notificationService } from './notification.service';
import { logger } from '../lib/logger';

export interface StockAlert {
  id: string;
  product_id: string;
  product_name: string;
  sku: string;
  current_stock: number;
  min_stock_level: number;
  supplier_name?: string;
  alert_type: 'low_stock' | 'out_of_stock' | 'overstock';
  severity: 'low' | 'medium' | 'high' | 'critical';
  days_until_stockout?: number;
  estimated_cost: number;
  created_at: Date;
}

export interface InventoryAlertRule {
  id: string;
  org_id: string;
  name: string;
  type: 'stock_level' | 'value_threshold' | 'movement_rate';
  conditions: {
    field: string;
    operator: 'lt' | 'lte' | 'gt' | 'gte' | 'eq' | 'ne';
    value: number | string;
  }[];
  actions: {
    type: 'notification' | 'email' | 'webhook' | 'task';
    config: Record<string, any>;
  }[];
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export class InventoryAlertsService {
  private alertRules: Map<string, InventoryAlertRule[]> = new Map();

  constructor() {
    this.initializeDefaultRules();
  }

  // Initialize default alert rules
  private initializeDefaultRules() {
    const defaultRules: InventoryAlertRule[] = [
      {
        id: 'low_stock_alert',
        org_id: 'default',
        name: 'Alerta de Stock Bajo',
        type: 'stock_level',
        conditions: [
          { field: 'stock_quantity', operator: 'lte', value: 'min_stock_level' }
        ],
        actions: [
          { type: 'notification', config: { channel: 'email', template: 'low_stock_alert' } },
          { type: 'webhook', config: { endpoint: '/api/webhooks/inventory-alerts' } }
        ],
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'out_of_stock_alert',
        org_id: 'default',
        name: 'Alerta de Stock Agotado',
        type: 'stock_level',
        conditions: [
          { field: 'stock_quantity', operator: 'eq', value: 0 }
        ],
        actions: [
          { type: 'notification', config: { channel: 'email', template: 'out_of_stock_alert' } },
          { type: 'notification', config: { channel: 'slack', template: 'out_of_stock_alert' } }
        ],
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'high_value_alert',
        org_id: 'default',
        name: 'Alerta de Alto Valor',
        type: 'value_threshold',
        conditions: [
          { field: 'inventory_value', operator: 'gt', value: 10000 }
        ],
        actions: [
          { type: 'notification', config: { channel: 'email', template: 'high_value_alert' } }
        ],
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    this.alertRules.set('default', defaultRules);
  }

  // Check for stock alerts
  async checkStockAlerts(orgId: string): Promise<StockAlert[]> {
    try {
      const alerts: StockAlert[] = [];

      // Get products with low stock
      const lowStockProducts = await db
        .select({
          id: products.id,
          name: products.name,
          sku: products.sku,
          stock_quantity: products.stock_quantity,
          min_stock_level: products.min_stock_level,
          unit_price: products.unit_price,
          cost_price: products.cost_price,
          supplier_name: suppliers.name,
          days_until_stockout: sql<number>`CASE 
            WHEN ${products.stock_quantity} > 0 THEN 
              FLOOR(${products.stock_quantity} / GREATEST(1, (
                SELECT COALESCE(AVG(quantity), 1) 
                FROM invoice_items 
                WHERE product_id = ${products.id}
                AND created_at >= NOW() - INTERVAL '30 days'
              )))
            ELSE 0 
          END`
        })
        .from(products)
        .leftJoin(suppliers, eq(products.supplier_id, suppliers.id))
        .where(and(
          eq(products.orgId, orgId),
          eq(products.is_active, true),
          sql`${products.stock_quantity} <= ${products.min_stock_level}`
        ));

      // Process each low stock product
      for (const product of lowStockProducts) {
        const alert = await this.createStockAlert(product);
        if (alert) {
          alerts.push(alert);
        }
      }

      // Get out of stock products
      const outOfStockProducts = await db
        .select({
          id: products.id,
          name: products.name,
          sku: products.sku,
          stock_quantity: products.stock_quantity,
          min_stock_level: products.min_stock_level,
          unit_price: products.unit_price,
          cost_price: products.cost_price,
          supplier_name: suppliers.name,
          days_until_stockout: sql<number>`0`
        })
        .from(products)
        .leftJoin(suppliers, eq(products.supplier_id, suppliers.id))
        .where(and(
          eq(products.orgId, orgId),
          eq(products.is_active, true),
          eq(products.stock_quantity, 0)
        ));

      // Process out of stock products
      for (const product of outOfStockProducts) {
        const alert = await this.createStockAlert(product, 'out_of_stock');
        if (alert) {
          alerts.push(alert);
        }
      }

      return alerts;

    } catch (error) {
      logger.error('Error checking stock alerts:', error);
      return [];
    }
  }

  // Create stock alert
  private async createStockAlert(product: any, alertType?: 'low_stock' | 'out_of_stock'): Promise<StockAlert | null> {
    try {
      const isOutOfStock = product.stock_quantity === 0;
      const type = alertType || (isOutOfStock ? 'out_of_stock' : 'low_stock');
      
      let severity: 'low' | 'medium' | 'high' | 'critical';
      if (isOutOfStock) {
        severity = 'critical';
      } else if (product.days_until_stockout <= 3) {
        severity = 'high';
      } else if (product.days_until_stockout <= 7) {
        severity = 'medium';
      } else {
        severity = 'low';
      }

      const estimatedCost = (product.cost_price || 0) * (product.min_stock_level - product.stock_quantity);

      const alert: StockAlert = {
        id: `alert_${product.id}_${Date.now()}`,
        product_id: product.id,
        product_name: product.name,
        sku: product.sku,
        current_stock: product.stock_quantity,
        min_stock_level: product.min_stock_level,
        supplier_name: product.supplier_name,
        alert_type: type,
        severity,
        days_until_stockout: product.days_until_stockout,
        estimated_cost: estimatedCost,
        created_at: new Date()
      };

      return alert;

    } catch (error) {
      logger.error('Error creating stock alert:', error);
      return null;
    }
  }

  // Send inventory alerts
  async sendInventoryAlerts(orgId: string, alerts: StockAlert[]): Promise<void> {
    try {
      for (const alert of alerts) {
        await this.processAlert(orgId, alert);
      }
    } catch (error) {
      logger.error('Error sending inventory alerts:', error);
    }
  }

  // Process individual alert
  private async processAlert(orgId: string, alert: StockAlert): Promise<void> {
    try {
      const rules = this.alertRules.get(orgId) || this.alertRules.get('default') || [];
      
      for (const rule of rules) {
        if (!rule.is_active) continue;

        const shouldTrigger = this.evaluateRuleConditions(rule, alert);
        if (shouldTrigger) {
          await this.executeRuleActions(rule, alert, orgId);
        }
      }
    } catch (error) {
      logger.error('Error processing alert:', error);
    }
  }

  // Evaluate rule conditions
  private evaluateRuleConditions(rule: InventoryAlertRule, alert: StockAlert): boolean {
    for (const condition of rule.conditions) {
      const fieldValue = this.getFieldValue(alert, condition.field);
      const conditionValue = condition.value;

      const matches = this.compareValues(fieldValue, condition.operator, conditionValue);
      if (!matches) return false;
    }
    return true;
  }

  // Get field value from alert
  private getFieldValue(alert: StockAlert, field: string): any {
    switch (field) {
      case 'stock_quantity':
        return alert.current_stock;
      case 'min_stock_level':
        return alert.min_stock_level;
      case 'inventory_value':
        return alert.estimated_cost;
      case 'days_until_stockout':
        return alert.days_until_stockout;
      case 'alert_type':
        return alert.alert_type;
      case 'severity':
        return alert.severity;
      default:
        return null;
    }
  }

  // Compare values based on operator
  private compareValues(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case 'lt':
        return actual < expected;
      case 'lte':
        return actual <= expected;
      case 'gt':
        return actual > expected;
      case 'gte':
        return actual >= expected;
      case 'eq':
        return actual === expected;
      case 'ne':
        return actual !== expected;
      default:
        return false;
    }
  }

  // Execute rule actions
  private async executeRuleActions(rule: InventoryAlertRule, alert: StockAlert, orgId: string): Promise<void> {
    try {
      for (const action of rule.actions) {
        switch (action.type) {
          case 'notification':
            await this.sendNotification(alert, action.config, orgId);
            break;
          case 'email':
            await this.sendEmail(alert, action.config, orgId);
            break;
          case 'webhook':
            await this.sendWebhook(alert, action.config, orgId);
            break;
          case 'task':
            await this.createTask(alert, action.config, orgId);
            break;
        }
      }
    } catch (error) {
      logger.error('Error executing rule actions:', error);
    }
  }

  // Send notification
  private async sendNotification(alert: StockAlert, config: any, orgId: string): Promise<void> {
    const message = this.formatAlertMessage(alert);
    const priority = this.getPriorityFromSeverity(alert.severity);

    await notificationService.sendNotification({
      title: `Alerta de Inventario: ${alert.product_name}`,
      message,
      priority,
      category: 'inventory',
      data: {
        alert_id: alert.id,
        product_id: alert.product_id,
        alert_type: alert.alert_type,
        severity: alert.severity
      }
    }, orgId);
  }

  // Send email
  private async sendEmail(alert: StockAlert, config: any, orgId: string): Promise<void> {
    const subject = `Alerta de Inventario - ${alert.product_name}`;
    const body = this.formatEmailBody(alert);

    await notificationService.sendNotification({
      title: subject,
      message: body,
      priority: this.getPriorityFromSeverity(alert.severity),
      category: 'inventory_email',
      data: {
        alert_id: alert.id,
        product_id: alert.product_id,
        template: config.template || 'inventory_alert'
      }
    }, orgId);
  }

  // Send webhook
  private async sendWebhook(alert: StockAlert, config: any, orgId: string): Promise<void> {
    const payload = {
      alert_id: alert.id,
      product_id: alert.product_id,
      product_name: alert.product_name,
      sku: alert.sku,
      alert_type: alert.alert_type,
      severity: alert.severity,
      current_stock: alert.current_stock,
      min_stock_level: alert.min_stock_level,
      supplier_name: alert.supplier_name,
      estimated_cost: alert.estimated_cost,
      timestamp: new Date().toISOString()
    };

    await notificationService.sendWebhookNotification(payload, orgId, config.endpoint);
  }

  // Create task
  private async createTask(alert: StockAlert, config: any, orgId: string): Promise<void> {
    // This would integrate with a task management system
    logger.info('Creating task for inventory alert:', {
      alert_id: alert.id,
      product_id: alert.product_id,
      task_type: config.task_type || 'reorder'
    });
  }

  // Format alert message
  private formatAlertMessage(alert: StockAlert): string {
    const severityEmoji = {
      low: '🟡',
      medium: '🟠',
      high: '🔴',
      critical: '🚨'
    };

    const baseMessage = `${severityEmoji[alert.severity]} **${alert.product_name}** (${alert.sku})`;
    
    if (alert.alert_type === 'out_of_stock') {
      return `${baseMessage}\n\n❌ **Stock agotado**\n\n📞 Contactar proveedor: ${alert.supplier_name || 'No asignado'}`;
    } else {
      return `${baseMessage}\n\n⚠️ **Stock bajo**\n\n📊 Stock actual: ${alert.current_stock}\n🎯 Stock mínimo: ${alert.min_stock_level}\n⏰ Días hasta agotarse: ${alert.days_until_stockout || 'N/A'}\n💰 Costo estimado: €${alert.estimated_cost.toLocaleString()}`;
    }
  }

  // Format email body
  private formatEmailBody(alert: StockAlert): string {
    return `
      <h2>Alerta de Inventario</h2>
      <p><strong>Producto:</strong> ${alert.product_name}</p>
      <p><strong>SKU:</strong> ${alert.sku}</p>
      <p><strong>Tipo de alerta:</strong> ${alert.alert_type === 'out_of_stock' ? 'Stock Agotado' : 'Stock Bajo'}</p>
      <p><strong>Severidad:</strong> ${alert.severity}</p>
      <p><strong>Stock actual:</strong> ${alert.current_stock}</p>
      <p><strong>Stock mínimo:</strong> ${alert.min_stock_level}</p>
      ${alert.days_until_stockout ? `<p><strong>Días hasta agotarse:</strong> ${alert.days_until_stockout}</p>` : ''}
      <p><strong>Proveedor:</strong> ${alert.supplier_name || 'No asignado'}</p>
      <p><strong>Costo estimado de reabastecimiento:</strong> €${alert.estimated_cost.toLocaleString()}</p>
    `;
  }

  // Get priority from severity
  private getPriorityFromSeverity(severity: string): 'low' | 'medium' | 'high' | 'urgent' {
    switch (severity) {
      case 'critical':
        return 'urgent';
      case 'high':
        return 'high';
      case 'medium':
        return 'medium';
      case 'low':
        return 'low';
      default:
        return 'medium';
    }
  }

  // Get alert rules for organization
  async getAlertRules(orgId: string): Promise<InventoryAlertRule[]> {
    return this.alertRules.get(orgId) || this.alertRules.get('default') || [];
  }

  // Create or update alert rule
  async createAlertRule(orgId: string, rule: Omit<InventoryAlertRule, 'id' | 'created_at' | 'updated_at'>): Promise<InventoryAlertRule> {
    const newRule: InventoryAlertRule = {
      ...rule,
      id: `rule_${Date.now()}`,
      created_at: new Date(),
      updated_at: new Date()
    };

    const rules = this.alertRules.get(orgId) || [];
    rules.push(newRule);
    this.alertRules.set(orgId, rules);

    return newRule;
  }

  // Delete alert rule
  async deleteAlertRule(orgId: string, ruleId: string): Promise<boolean> {
    const rules = this.alertRules.get(orgId) || [];
    const filteredRules = rules.filter(rule => rule.id !== ruleId);
    
    if (filteredRules.length !== rules.length) {
      this.alertRules.set(orgId, filteredRules);
      return true;
    }
    
    return false;
  }
}

export const inventoryAlertsService = new InventoryAlertsService();
