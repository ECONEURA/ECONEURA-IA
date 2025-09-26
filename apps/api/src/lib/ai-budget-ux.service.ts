import { z } from 'zod';

import { logger } from './logger.js';

// Schemas de validación
const BudgetConfigSchema = z.object({
  organizationId: z.string(),
  monthlyLimit: z.number().min(0),
  dailyLimit: z.number().min(0).optional(),
  warningThreshold: z.number().min(0).max(1), // 0-1 (0% - 100%)
  criticalThreshold: z.number().min(0).max(1), // 0-1 (0% - 100%)
  readOnlyThreshold: z.number().min(0).max(1), // 0-1 (0% - 100%)
  currency: z.enum(['EUR', 'USD', 'GBP']).default('EUR'),
  timezone: z.string().default('Europe/Madrid'),
  alertChannels: z.array(z.enum(['email', 'slack', 'webhook', 'in_app'])).default(['in_app']),
  autoReadOnly: z.boolean().default(true),
  gracePeriod: z.number().min(0).default(24), // horas
});

const BudgetUsageSchema = z.object({
  organizationId: z.string(),
  currentUsage: z.number().min(0),
  dailyUsage: z.number().min(0),
  monthlyUsage: z.number().min(0),
  lastResetDate: z.string().datetime(),
  projectedMonthlyUsage: z.number().min(0),
  averageDailyUsage: z.number().min(0),
  peakUsage: z.number().min(0),
  usageByModel: z.record(z.string(), z.number()),
  usageByUser: z.record(z.string(), z.number()),
  usageByFeature: z.record(z.string(), z.number()),
});

const BudgetAlertSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  type: z.enum(['warning', 'critical', 'limit_reached', 'read_only_activated']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  message: z.string(),
  threshold: z.number(),
  currentUsage: z.number(),
  percentage: z.number(),
  timestamp: z.string().datetime(),
  acknowledged: z.boolean().default(false),
  acknowledgedBy: z.string().optional(),
  acknowledgedAt: z.string().datetime().optional(),
  channels: z.array(z.string()),
  metadata: z.record(z.any()).optional(),
});

export type BudgetConfig = z.infer<typeof BudgetConfigSchema>;
export type BudgetUsage = z.infer<typeof BudgetUsageSchema>;
export type BudgetAlert = z.infer<typeof BudgetAlertSchema>;

export interface BudgetProgress {
  organizationId: string;
  currentUsage: number;
  limit: number;
  percentage: number;
  status: 'safe' | 'warning' | 'critical' | 'limit_reached' | 'read_only';
  daysRemaining: number;
  projectedOverage: number;
  canMakeRequests: boolean;
  readOnlyMode: boolean;
  gracePeriodActive: boolean;
  gracePeriodEndsAt?: string;
}

export interface BudgetInsights {
  organizationId: string;
  trends: {
    dailyGrowth: number; // porcentaje
    weeklyGrowth: number; // porcentaje
    monthlyGrowth: number; // porcentaje
  };
  predictions: {
    projectedEndOfMonth: number;
    projectedOverage: number;
    confidence: number; // 0-1
  };
  recommendations: Array<{
    type: 'optimization' | 'limit_increase' | 'usage_reduction' | 'feature_restriction';
    priority: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    impact: string;
    action: string;
  }>;
  topUsers: Array<{
    userId: string;
    usage: number;
    percentage: number;
  }>;
  topModels: Array<{
    model: string;
    usage: number;
    percentage: number;
    costPerToken: number;
  }>;
  topFeatures: Array<{
    feature: string;
    usage: number;
    percentage: number;
  }>;
}

export class AIBudgetUXService {
  private configs: Map<string, BudgetConfig> = new Map();
  private usage: Map<string, BudgetUsage> = new Map();
  private alerts: Map<string, BudgetAlert[]> = new Map();
  private readOnlyMode: Map<string, boolean> = new Map();
  private gracePeriods: Map<string, { active: boolean; endsAt: Date }> = new Map();

  constructor() {
    this.initializeDefaultConfigs();
    this.startPeriodicTasks();
  }

  private initializeDefaultConfigs(): void {
    // Configuración por defecto para organizaciones
    const defaultConfig: BudgetConfig = {
      organizationId: 'default',
      monthlyLimit: 1000, // €1000 por defecto
      dailyLimit: 50, // €50 por día
      warningThreshold: 0.7, // 70%
      criticalThreshold: 0.9, // 90%
      readOnlyThreshold: 0.95, // 95%
      currency: 'EUR',
      timezone: 'Europe/Madrid',
      alertChannels: ['in_app', 'email'],
      autoReadOnly: true,
      gracePeriod: 24, // 24 horas
    };

    this.configs.set('default', defaultConfig);
  }

  private startPeriodicTasks(): void {
    // Verificar presupuestos cada 5 minutos
    setInterval(() => {
      this.checkAllBudgets();
    }, 5 * 60 * 1000);

    // Limpiar alertas antiguas cada hora
    setInterval(() => {
      this.cleanupOldAlerts();
    }, 60 * 60 * 1000);

    // Reset diario de uso
    setInterval(() => {
      this.resetDailyUsage();
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * Configura el presupuesto para una organización
   */
  async setBudgetConfig(config: Partial<BudgetConfig> & { organizationId: string }): Promise<BudgetConfig> {
    try {
      const validatedConfig = BudgetConfigSchema.parse({
        organizationId: config.organizationId,
        monthlyLimit: config.monthlyLimit || 1000,
        dailyLimit: config.dailyLimit,
        warningThreshold: config.warningThreshold || 0.7,
        criticalThreshold: config.criticalThreshold || 0.9,
        readOnlyThreshold: config.readOnlyThreshold || 0.95,
        currency: config.currency || 'EUR',
        timezone: config.timezone || 'Europe/Madrid',
        alertChannels: config.alertChannels || ['in_app'],
        autoReadOnly: config.autoReadOnly !== undefined ? config.autoReadOnly : true,
        gracePeriod: config.gracePeriod || 24,
      });

      this.configs.set(config.organizationId, validatedConfig);

      logger.info('Budget configuration updated', {
        organizationId: config.organizationId,
        monthlyLimit: validatedConfig.monthlyLimit,
        warningThreshold: validatedConfig.warningThreshold,
        criticalThreshold: validatedConfig.criticalThreshold,
        readOnlyThreshold: validatedConfig.readOnlyThreshold,
        requestId: ''
      });

      return validatedConfig;
    } catch (error) {
      logger.error('Failed to set budget config', {
        error: error instanceof Error ? error.message : 'Unknown error',
        organizationId: config.organizationId,
        requestId: ''
      });
      throw error;
    }
  }

  /**
   * Obtiene la configuración de presupuesto
   */
  getBudgetConfig(organizationId: string): BudgetConfig | null {
    return this.configs.get(organizationId) || null;
  }

  /**
   * Actualiza el uso del presupuesto
   */
  async updateUsage(organizationId: string, usage: Partial<BudgetUsage>): Promise<BudgetUsage> {
    try {
      const currentUsage = this.usage.get(organizationId) || this.createEmptyUsage(organizationId);
    const config = this.getBudgetConfig(organizationId) || this.configs.get('default');
    
    if (!config) {
      throw new Error(`No budget config found for organization ${organizationId}`);
    }

      // Validar que el uso no sea negativo
      if (usage.monthlyUsage !== undefined && usage.monthlyUsage < 0) {
        throw new Error('Monthly usage cannot be negative');
      }
      if (usage.dailyUsage !== undefined && usage.dailyUsage < 0) {
        throw new Error('Daily usage cannot be negative');
      }
      if (usage.currentUsage !== undefined && usage.currentUsage < 0) {
        throw new Error('Current usage cannot be negative');
      }

      const updatedUsage: BudgetUsage = {
        ...currentUsage,
        ...usage,
        organizationId,
        lastResetDate: currentUsage.lastResetDate,
      };

      // Calcular proyecciones
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const daysPassed = Math.floor((now.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      updatedUsage.projectedMonthlyUsage = (updatedUsage.monthlyUsage / daysPassed) * daysInMonth;
      updatedUsage.averageDailyUsage = updatedUsage.monthlyUsage / daysPassed;

      this.usage.set(organizationId, updatedUsage);

      // Verificar umbrales y generar alertas
      await this.checkBudgetThresholds(organizationId, updatedUsage, config);

      logger.info('Budget usage updated', {
        organizationId,
        currentUsage: updatedUsage.currentUsage,
        monthlyUsage: updatedUsage.monthlyUsage,
        projectedMonthlyUsage: updatedUsage.projectedMonthlyUsage,
        requestId: ''
      });

      return updatedUsage;
    } catch (error) {
      logger.error('Failed to update budget usage', {
        error: error instanceof Error ? error.message : 'Unknown error',
        organizationId,
        requestId: ''
      });
      throw error;
    }
  }

  /**
   * Obtiene el progreso del presupuesto
   */
  getBudgetProgress(organizationId: string): BudgetProgress | null {
    const config = this.getBudgetConfig(organizationId) || this.configs.get('default');
    const usage = this.usage.get(organizationId);
    
    if (!config) {
      return null;
    }
    
    // Si no hay uso, crear uno vacío
    const actualUsage = usage || this.createEmptyUsage(organizationId);

    const percentage = config.monthlyLimit === 0 ? 0 : (actualUsage.monthlyUsage / config.monthlyLimit) * 100;
    const daysRemaining = this.getDaysRemainingInMonth();
    const projectedOverage = Math.max(0, actualUsage.projectedMonthlyUsage - config.monthlyLimit);
    
    let status: BudgetProgress['status'] = 'safe';
    if (percentage >= config.readOnlyThreshold * 100) {
      status = 'read_only';
    } else if (percentage >= config.criticalThreshold * 100) {
      status = 'critical';
    } else if (percentage >= config.warningThreshold * 100) {
      status = 'warning';
    }

    const readOnlyMode = this.readOnlyMode.get(organizationId) || false;
    const gracePeriod = this.gracePeriods.get(organizationId);
    const gracePeriodActive = gracePeriod?.active || false;
    const canMakeRequests = !readOnlyMode || gracePeriodActive;

    return {
      organizationId,
      currentUsage: actualUsage.monthlyUsage,
      limit: config.monthlyLimit,
      percentage,
      status,
      daysRemaining,
      projectedOverage,
      canMakeRequests,
      readOnlyMode,
      gracePeriodActive,
      gracePeriodEndsAt: gracePeriod?.endsAt.toISOString(),
    };
  }

  /**
   * Obtiene insights del presupuesto
   */
  getBudgetInsights(organizationId: string): BudgetInsights | null {
    const config = this.getBudgetConfig(organizationId) || this.configs.get('default');
    const usage = this.usage.get(organizationId);
    
    if (!config || !usage) {
      return null;
    }

    // Calcular tendencias (simuladas para demo)
    const trends = {
      dailyGrowth: this.calculateDailyGrowth(usage),
      weeklyGrowth: this.calculateWeeklyGrowth(usage),
      monthlyGrowth: this.calculateMonthlyGrowth(usage),
    };

    // Predicciones
    const predictions = {
      projectedEndOfMonth: usage.projectedMonthlyUsage,
      projectedOverage: Math.max(0, usage.projectedMonthlyUsage - config.monthlyLimit),
      confidence: this.calculatePredictionConfidence(usage),
    };

    // Recomendaciones
    const recommendations = this.generateRecommendations(usage, config);

    // Top usuarios, modelos y features
    const topUsers = this.getTopUsers(usage);
    const topModels = this.getTopModels(usage);
    const topFeatures = this.getTopFeatures(usage);

    return {
      organizationId,
      trends,
      predictions,
      recommendations,
      topUsers,
      topModels,
      topFeatures,
    };
  }

  /**
   * Activa el modo de solo lectura
   */
  async activateReadOnlyMode(organizationId: string, reason: string): Promise<void> {
    const config = this.getBudgetConfig(organizationId) || this.configs.get('default');
    if (!config) {
      throw new Error(`No budget config found for organization ${organizationId}`);
    }

    // Asegurar que existe un registro de uso
    if (!this.usage.has(organizationId)) {
      this.usage.set(organizationId, this.createEmptyUsage(organizationId));
    }

    this.readOnlyMode.set(organizationId, true);

    // Crear alerta
    await this.createAlert({
      id: this.generateAlertId(),
      organizationId,
      type: 'read_only_activated',
      severity: 'critical',
      message: `Read-only mode activated: ${reason}`,
      threshold: config.readOnlyThreshold,
      currentUsage: this.usage.get(organizationId)?.monthlyUsage || 0,
      percentage: config.monthlyLimit === 0 ? 0 : ((this.usage.get(organizationId)?.monthlyUsage || 0) / config.monthlyLimit) * 100,
      timestamp: new Date().toISOString(),
      channels: config.alertChannels,
      metadata: { reason },
    });

    logger.warn('Read-only mode activated', {
      organizationId,
      reason,
      requestId: ''
    });
  }

  /**
   * Desactiva el modo de solo lectura
   */
  async deactivateReadOnlyMode(organizationId: string, reason: string): Promise<void> {
    this.readOnlyMode.set(organizationId, false);
    this.gracePeriods.delete(organizationId);

    logger.info('Read-only mode deactivated', {
      organizationId,
      reason,
      requestId: ''
    });
  }

  /**
   * Activa el período de gracia
   */
  async activateGracePeriod(organizationId: string, hours: number = 24): Promise<void> {
    const config = this.getBudgetConfig(organizationId) || this.configs.get('default');
    if (!config) {
      throw new Error(`No budget config found for organization ${organizationId}`);
    }

    const endsAt = new Date(Date.now() + (hours * 60 * 60 * 1000));
    this.gracePeriods.set(organizationId, { active: true, endsAt });

    logger.info('Grace period activated', {
      organizationId,
      hours,
      endsAt: endsAt.toISOString(),
      requestId: ''
    });
  }

  /**
   * Verifica si se puede hacer una solicitud
   */
  canMakeRequest(organizationId: string, estimatedCost: number): { allowed: boolean; reason?: string } {
    const progress = this.getBudgetProgress(organizationId);
    if (!progress) {
      return { allowed: false, reason: 'No budget configuration found' };
    }

    if (!progress.canMakeRequests) {
      return { allowed: false, reason: 'Read-only mode active' };
    }

    if (progress.currentUsage + estimatedCost > progress.limit) {
      return { allowed: false, reason: 'Request would exceed monthly limit' };
    }

    return { allowed: true };
  }

  /**
   * Obtiene alertas activas
   */
  getActiveAlerts(organizationId: string): BudgetAlert[] {
    const alerts = this.alerts.get(organizationId) || [];
    return alerts.filter(alert => !alert.acknowledged);
  }

  /**
   * Reconoce una alerta
   */
  async acknowledgeAlert(organizationId: string, alertId: string, acknowledgedBy: string): Promise<boolean> {
    const alerts = this.alerts.get(organizationId) || [];
    const alert = alerts.find(a => a.id === alertId);
    
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedBy = acknowledgedBy;
      alert.acknowledgedAt = new Date().toISOString();
      
      logger.info('Alert acknowledged', {
        organizationId,
        alertId,
        acknowledgedBy,
        requestId: ''
      });
      
      return true;
    }
    
    return false;
  }

  private createEmptyUsage(organizationId: string): BudgetUsage {
    return {
      organizationId,
      currentUsage: 0,
      dailyUsage: 0,
      monthlyUsage: 0,
      lastResetDate: new Date().toISOString(),
      projectedMonthlyUsage: 0,
      averageDailyUsage: 0,
      peakUsage: 0,
      usageByModel: {},
      usageByUser: {},
      usageByFeature: {},
    };
  }

  private async checkBudgetThresholds(organizationId: string, usage: BudgetUsage, config: BudgetConfig): Promise<void> {
    const percentage = config.monthlyLimit === 0 ? 0 : (usage.monthlyUsage / config.monthlyLimit) * 100;

    // Verificar umbral de advertencia
    if (percentage >= config.warningThreshold * 100 && percentage < config.criticalThreshold * 100) {
      await this.createAlert({
        id: this.generateAlertId(),
        organizationId,
        type: 'warning',
        severity: 'medium',
        message: `Budget usage reached ${percentage.toFixed(1)}% of monthly limit`,
        threshold: config.warningThreshold,
        currentUsage: usage.monthlyUsage,
        percentage,
        timestamp: new Date().toISOString(),
        channels: config.alertChannels,
      });
    }

    // Verificar umbral crítico
    if (percentage >= config.criticalThreshold * 100 && percentage < config.readOnlyThreshold * 100) {
      await this.createAlert({
        id: this.generateAlertId(),
        organizationId,
        type: 'critical',
        severity: 'high',
        message: `Budget usage reached ${percentage.toFixed(1)}% of monthly limit`,
        threshold: config.criticalThreshold,
        currentUsage: usage.monthlyUsage,
        percentage,
        timestamp: new Date().toISOString(),
        channels: config.alertChannels,
      });
    }

    // Verificar umbral de solo lectura
    if (percentage >= config.readOnlyThreshold * 100 && config.autoReadOnly) {
      await this.activateReadOnlyMode(organizationId, `Budget usage reached ${percentage.toFixed(1)}% of monthly limit`);
    }
  }

  private async createAlert(alert: BudgetAlert): Promise<void> {
    const alerts = this.alerts.get(alert.organizationId) || [];
    alerts.push(alert);
    this.alerts.set(alert.organizationId, alerts);

    logger.warn('Budget alert created', {
      organizationId: alert.organizationId,
      type: alert.type,
      severity: alert.severity,
      percentage: alert.percentage,
      requestId: ''
    });
  }

  private checkAllBudgets(): void {
    for (const [organizationId, config] of this.configs) {
      const usage = this.usage.get(organizationId);
      if (usage) {
        this.checkBudgetThresholds(organizationId, usage, config);
      }
    }
  }

  private cleanupOldAlerts(): void {
    const cutoffDate = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)); // 7 días
    
    for (const [organizationId, alerts] of this.alerts) {
      const filteredAlerts = alerts.filter(alert => 
        new Date(alert.timestamp) > cutoffDate
      );
      this.alerts.set(organizationId, filteredAlerts);
    }
  }

  private resetDailyUsage(): void {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    for (const [organizationId, usage] of this.usage) {
      if (new Date(usage.lastResetDate) < startOfDay) {
        usage.dailyUsage = 0;
        usage.lastResetDate = now.toISOString();
        this.usage.set(organizationId, usage);
      }
    }
  }

  private getDaysRemainingInMonth(): number {
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return Math.max(0, endOfMonth.getDate() - now.getDate());
  }

  private calculateDailyGrowth(usage: BudgetUsage): number {
    // Simulación de crecimiento diario
    return Math.random() * 10 - 5; // -5% a +5%
  }

  private calculateWeeklyGrowth(usage: BudgetUsage): number {
    // Simulación de crecimiento semanal
    return Math.random() * 20 - 10; // -10% a +10%
  }

  private calculateMonthlyGrowth(usage: BudgetUsage): number {
    // Simulación de crecimiento mensual
    return Math.random() * 30 - 15; // -15% a +15%
  }

  private calculatePredictionConfidence(usage: BudgetUsage): number {
    // Simulación de confianza en predicción
    return 0.7 + Math.random() * 0.3; // 70% a 100%
  }

  private generateRecommendations(usage: BudgetUsage, config: BudgetConfig): Array<BudgetInsights['recommendations'][0]> {
    const recommendations: Array<BudgetInsights['recommendations'][0]> = [];
    const percentage = (usage.monthlyUsage / config.monthlyLimit) * 100;

    if (percentage > 80) {
      recommendations.push({
        type: 'limit_increase',
        priority: 'high',
        title: 'Consider increasing monthly limit',
        description: 'Current usage is approaching the limit. Consider increasing the monthly budget.',
        impact: 'Prevents service interruption',
        action: 'Contact administrator to increase limit',
      });
    }

    if (usage.averageDailyUsage > (config.dailyLimit || config.monthlyLimit / 30)) {
      recommendations.push({
        type: 'usage_reduction',
        priority: 'medium',
        title: 'Optimize daily usage',
        description: 'Daily usage is above recommended levels. Consider optimizing requests.',
        impact: 'Reduces costs and improves efficiency',
        action: 'Review and optimize AI request patterns',
      });
    }

    return recommendations;
  }

  private getTopUsers(usage: BudgetUsage): Array<BudgetInsights['topUsers'][0]> {
    return Object.entries(usage.usageByUser)
      .map(([userId, usageAmount]) => ({
        userId,
        usage: usageAmount,
        percentage: (usageAmount / usage.monthlyUsage) * 100,
      }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 5);
  }

  private getTopModels(usage: BudgetUsage): Array<BudgetInsights['topModels'][0]> {
    return Object.entries(usage.usageByModel)
      .map(([model, usageAmount]) => ({
        model,
        usage: usageAmount,
        percentage: (usageAmount / usage.monthlyUsage) * 100,
        costPerToken: Math.random() * 0.01, // Simulación
      }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 5);
  }

  private getTopFeatures(usage: BudgetUsage): Array<BudgetInsights['topFeatures'][0]> {
    return Object.entries(usage.usageByFeature)
      .map(([feature, usageAmount]) => ({
        feature,
        usage: usageAmount,
        percentage: (usageAmount / usage.monthlyUsage) * 100,
      }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 5);
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Instancia singleton
export const aiBudgetUXService = new AIBudgetUXService();
