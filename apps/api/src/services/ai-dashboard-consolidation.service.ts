import { z } from 'zod';
import { logger } from '../lib/logger';
import { db } from '../lib/db';
import { eq, desc, gte, and } from 'drizzle-orm';
import {
  aiCostOptimization,
  aiCostPrediction,
  aiAnalytics,
  aiModelManagement,
  aiTrainingJobs,
  aiSecurityCompliance,
  aiPerformanceOptimization
} from '../lib/schema';

// Schemas de validación
const DashboardMetricsSchema = z.object({
  department: z.enum(['ceo', 'ia', 'cso', 'cto', 'ciso', 'coo', 'chro', 'cgo', 'cfo', 'cdo']),
  timeframe: z.enum(['1h', '24h', '7d', '30d']).default('24h'),
  includePredictions: z.boolean().default(true),
  includeOptimizations: z.boolean().default(true),
  includeSecurity: z.boolean().default(true),
});

const RealTimeMetricsSchema = z.object({
  department: z.enum(['ceo', 'ia', 'cso', 'cto', 'ciso', 'coo', 'chro', 'cgo', 'cfo', 'cdo']),
  agentId: z.string().optional(),
});

const AgentStatusSchema = z.object({
  agentId: z.string(),
  department: z.enum(['ceo', 'ia', 'cso', 'cto', 'ciso', 'coo', 'chro', 'cgo', 'cfo', 'cdo']),
  status: z.enum(['active', 'paused', 'error', 'maintenance']),
  lastActivity: z.date(),
  metrics: z.object({
    tokens: z.number(),
    cost: z.number(),
    latency: z.number(),
    calls: z.number(),
  }),
});

export interface DashboardMetrics {
  department: string;
  timeframe: string;
  includePredictions: boolean;
  includeOptimizations: boolean;
  includeSecurity: boolean;
}

export interface RealTimeMetrics {
  department: string;
  agentId?: string;
}

export interface AgentStatus {
  agentId: string;
  department: string;
  status: 'active' | 'paused' | 'error' | 'maintenance';
  lastActivity: Date;
  metrics: {
    tokens: number;
    cost: number;
    latency: number;
    calls: number;
  };
}

export interface ConsolidatedDashboardData {
  department: string;
  timestamp: Date;
  agents: AgentStatus[];
  kpis: {
    totalCost: number;
    totalTokens: number;
    averageLatency: number;
    successRate: number;
    activeAgents: number;
    errorRate: number;
  };
  predictions?: {
    costForecast: {
      optimistic: number;
      base: number;
      pessimistic: number;
    };
    usageForecast: {
      tokens: number;
      calls: number;
    };
    confidence: number;
  };
  optimizations?: {
    activeRules: number;
    savings: number;
    recommendations: string[];
  };
  security?: {
    complianceScore: number;
    activePolicies: number;
    incidents: number;
    lastAudit: Date;
  };
  performance?: {
    optimizationScore: number;
    activeOptimizations: number;
    performanceGains: number;
  };
  timeline: Array<{
    timestamp: Date;
    type: 'success' | 'warning' | 'error' | 'info';
    message: string;
    agentId?: string;
  }>;
}

export class AIDashboardConsolidationService {
  private static instance: AIDashboardConsolidationService;
  private realTimeConnections: Map<string, Set<WebSocket>> = new Map();
  private metricsCache: Map<string, ConsolidatedDashboardData> = new Map();
  private cacheTimeout = 30000; // 30 segundos

  public static getInstance(): AIDashboardConsolidationService {
    if (!AIDashboardConsolidationService.instance) {
      AIDashboardConsolidationService.instance = new AIDashboardConsolidationService();
    }
    return AIDashboardConsolidationService.instance;
  }

  /**
   * Obtiene métricas consolidadas para un departamento
   */
  async getDashboardMetrics(input: DashboardMetrics): Promise<ConsolidatedDashboardData> {
    try {
      const validatedInput = DashboardMetricsSchema.parse(input);
      const cacheKey = `${validatedInput.department}-${validatedInput.timeframe}`;

      // Verificar cache
      const cached = this.metricsCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp.getTime()) < this.cacheTimeout) {
        return cached;
      }

      logger.info('Generating consolidated dashboard metrics', {
        department: validatedInput.department,
        timeframe: validatedInput.timeframe,
      });

      const data = await this.generateConsolidatedData(validatedInput);

      // Actualizar cache
      this.metricsCache.set(cacheKey, data);

      return data;
    } catch (error) {
      logger.error('Error getting dashboard metrics', { error, input });
      throw new Error('Failed to get dashboard metrics');
    }
  }

  /**
   * Obtiene métricas en tiempo real para un departamento
   */
  async getRealTimeMetrics(input: RealTimeMetrics): Promise<ConsolidatedDashboardData> {
    try {
      const validatedInput = RealTimeMetricsSchema.parse(input);

      logger.info('Getting real-time metrics', {
        department: validatedInput.department,
        agentId: validatedInput.agentId,
      });

      return await this.generateRealTimeData(validatedInput);
    } catch (error) {
      logger.error('Error getting real-time metrics', { error, input });
      throw new Error('Failed to get real-time metrics');
    }
  }

  /**
   * Actualiza el estado de un agente
   */
  async updateAgentStatus(agentStatus: AgentStatus): Promise<void> {
    try {
      logger.info('Updating agent status', {
        agentId: agentStatus.agentId,
        department: agentStatus.department,
        status: agentStatus.status,
      });

      // Aquí se actualizaría la base de datos con el estado del agente
      // Por ahora simulamos la actualización

      // Notificar a conexiones WebSocket en tiempo real
      this.notifyRealTimeConnections(agentStatus.department, {
        type: 'agent_status_update',
        data: agentStatus,
      });

    } catch (error) {
      logger.error('Error updating agent status', { error, agentStatus });
      throw new Error('Failed to update agent status');
    }
  }

  /**
   * Registra una conexión WebSocket para métricas en tiempo real
   */
  registerRealTimeConnection(department: string, ws: WebSocket): void {
    if (!this.realTimeConnections.has(department)) {
      this.realTimeConnections.set(department, new Set());
    }
    this.realTimeConnections.get(department)!.add(ws);

    ws.on('close', () => {
      this.realTimeConnections.get(department)?.delete(ws);
    });

    logger.info('Registered real-time connection', { department });
  }

  /**
   * Genera datos consolidados para el dashboard
   */
  private async generateConsolidatedData(input: DashboardMetrics): Promise<ConsolidatedDashboardData> {
    const now = new Date();
    const timeframeMs = this.getTimeframeMs(input.timeframe);
    const since = new Date(now.getTime() - timeframeMs);

    // Obtener métricas de costos
    const costMetrics = await this.getCostMetrics(input.department, since);

    // Obtener métricas de predicción si está habilitado
    const predictions = input.includePredictions ?
      await this.getPredictionMetrics(input.department) : undefined;

    // Obtener métricas de optimización si está habilitado
    const optimizations = input.includeOptimizations ?
      await this.getOptimizationMetrics(input.department) : undefined;

    // Obtener métricas de seguridad si está habilitado
    const security = input.includeSecurity ?
      await this.getSecurityMetrics(input.department) : undefined;

    // Obtener métricas de rendimiento
    const performance = await this.getPerformanceMetrics(input.department);

    // Obtener timeline de eventos
    const timeline = await this.getTimelineEvents(input.department, since);

    // Obtener estado de agentes
    const agents = await this.getAgentStatuses(input.department);

    return {
      department: input.department,
      timestamp: now,
      agents,
      kpis: {
        totalCost: costMetrics.totalCost,
        totalTokens: costMetrics.totalTokens,
        averageLatency: costMetrics.averageLatency,
        successRate: costMetrics.successRate,
        activeAgents: agents.filter(a => a.status === 'active').length,
        errorRate: costMetrics.errorRate,
      },
      predictions,
      optimizations,
      security,
      performance,
      timeline,
    };
  }

  /**
   * Genera datos en tiempo real
   */
  private async generateRealTimeData(input: RealTimeMetrics): Promise<ConsolidatedDashboardData> {
    // Para tiempo real, obtenemos datos de los últimos 5 minutos
    const now = new Date();
    const since = new Date(now.getTime() - 5 * 60 * 1000);

    const costMetrics = await this.getCostMetrics(input.department, since);
    const agents = await this.getAgentStatuses(input.department, input.agentId);
    const timeline = await this.getTimelineEvents(input.department, since);

    return {
      department: input.department,
      timestamp: now,
      agents,
      kpis: {
        totalCost: costMetrics.totalCost,
        totalTokens: costMetrics.totalTokens,
        averageLatency: costMetrics.averageLatency,
        successRate: costMetrics.successRate,
        activeAgents: agents.filter(a => a.status === 'active').length,
        errorRate: costMetrics.errorRate,
      },
      timeline,
    };
  }

  /**
   * Obtiene métricas de costos
   */
  private async getCostMetrics(department: string, since: Date) {
    try {
      // Simular métricas de costos basadas en datos reales
      const costData = await db.select()
        .from(aiCostOptimization)
        .where(and(
          eq(aiCostOptimization.department, department),
          gte(aiCostOptimization.createdAt, since)
        ))
        .orderBy(desc(aiCostOptimization.createdAt))
        .limit(100);

      const totalCost = costData.reduce((sum, record) => sum + (record.costSavings || 0), 0);
      const totalTokens = costData.reduce((sum, record) => sum + (record.tokensUsed || 0), 0);
      const averageLatency = costData.reduce((sum, record) => sum + (record.latencyMs || 0), 0) / costData.length || 0;
      const successRate = costData.filter(r => r.status === 'success').length / costData.length || 0;
      const errorRate = costData.filter(r => r.status === 'error').length / costData.length || 0;

      return {
        totalCost,
        totalTokens,
        averageLatency,
        successRate,
        errorRate,
      };
    } catch (error) {
      logger.error('Error getting cost metrics', { error, department });
      return {
        totalCost: 0,
        totalTokens: 0,
        averageLatency: 0,
        successRate: 0,
        errorRate: 0,
      };
    }
  }

  /**
   * Obtiene métricas de predicción
   */
  private async getPredictionMetrics(department: string) {
    try {
      const predictionData = await db.select()
        .from(aiCostPrediction)
        .where(eq(aiCostPrediction.department, department))
        .orderBy(desc(aiCostPrediction.createdAt))
        .limit(1);

      if (predictionData.length === 0) {
        return undefined;
      }

      const latest = predictionData[0];
      return {
        costForecast: {
          optimistic: latest.optimisticForecast || 0,
          base: latest.baseForecast || 0,
          pessimistic: latest.pessimisticForecast || 0,
        },
        usageForecast: {
          tokens: latest.predictedTokens || 0,
          calls: latest.predictedCalls || 0,
        },
        confidence: latest.confidenceScore || 0,
      };
    } catch (error) {
      logger.error('Error getting prediction metrics', { error, department });
      return undefined;
    }
  }

  /**
   * Obtiene métricas de optimización
   */
  private async getOptimizationMetrics(department: string) {
    try {
      const optimizationData = await db.select()
        .from(aiCostOptimization)
        .where(eq(aiCostOptimization.department, department))
        .orderBy(desc(aiCostOptimization.createdAt))
        .limit(10);

      const activeRules = optimizationData.filter(r => r.status === 'active').length;
      const savings = optimizationData.reduce((sum, r) => sum + (r.costSavings || 0), 0);
      const recommendations = optimizationData
        .filter(r => r.recommendations)
        .map(r => r.recommendations)
        .slice(0, 5);

      return {
        activeRules,
        savings,
        recommendations: recommendations as string[],
      };
    } catch (error) {
      logger.error('Error getting optimization metrics', { error, department });
      return undefined;
    }
  }

  /**
   * Obtiene métricas de seguridad
   */
  private async getSecurityMetrics(department: string) {
    try {
      const securityData = await db.select()
        .from(aiSecurityCompliance)
        .where(eq(aiSecurityCompliance.department, department))
        .orderBy(desc(aiSecurityCompliance.createdAt))
        .limit(1);

      if (securityData.length === 0) {
        return undefined;
      }

      const latest = securityData[0];
      return {
        complianceScore: latest.complianceScore || 0,
        activePolicies: latest.activePolicies || 0,
        incidents: latest.securityIncidents || 0,
        lastAudit: latest.lastAuditDate || new Date(),
      };
    } catch (error) {
      logger.error('Error getting security metrics', { error, department });
      return undefined;
    }
  }

  /**
   * Obtiene métricas de rendimiento
   */
  private async getPerformanceMetrics(department: string) {
    try {
      const performanceData = await db.select()
        .from(aiPerformanceOptimization)
        .where(eq(aiPerformanceOptimization.department, department))
        .orderBy(desc(aiPerformanceOptimization.createdAt))
        .limit(1);

      if (performanceData.length === 0) {
        return undefined;
      }

      const latest = performanceData[0];
      return {
        optimizationScore: latest.optimizationScore || 0,
        activeOptimizations: latest.activeOptimizations || 0,
        performanceGains: latest.performanceGains || 0,
      };
    } catch (error) {
      logger.error('Error getting performance metrics', { error, department });
      return undefined;
    }
  }

  /**
   * Obtiene eventos del timeline
   */
  private async getTimelineEvents(department: string, since: Date) {
    // Simular eventos del timeline basados en datos reales
    const events = [
      {
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        type: 'success' as const,
        message: `Agente NEURA-${department.toUpperCase()} completó tarea`,
        agentId: `NEURA-${department.toUpperCase()}`,
      },
      {
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
        type: 'info' as const,
        message: 'Optimización de costos aplicada',
      },
      {
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        type: 'warning' as const,
        message: 'Límite de tokens alcanzado',
        agentId: `AGENTE-${department.toUpperCase()}-1`,
      },
    ];

    return events.filter(e => e.timestamp >= since);
  }

  /**
   * Obtiene estados de agentes
   */
  private async getAgentStatuses(department: string, agentId?: string): Promise<AgentStatus[]> {
    // Simular estados de agentes basados en la estructura del cockpit
    const agents: AgentStatus[] = [
      {
        agentId: `NEURA-${department.toUpperCase()}`,
        department,
        status: 'active',
        lastActivity: new Date(Date.now() - 2 * 60 * 1000),
        metrics: {
          tokens: Math.floor(Math.random() * 1000) + 100,
          cost: Math.random() * 10 + 1,
          latency: Math.floor(Math.random() * 500) + 100,
          calls: Math.floor(Math.random() * 50) + 10,
        },
      },
      {
        agentId: `AGENTE-${department.toUpperCase()}-1`,
        department,
        status: 'active',
        lastActivity: new Date(Date.now() - 5 * 60 * 1000),
        metrics: {
          tokens: Math.floor(Math.random() * 800) + 50,
          cost: Math.random() * 8 + 0.5,
          latency: Math.floor(Math.random() * 400) + 80,
          calls: Math.floor(Math.random() * 30) + 5,
        },
      },
    ];

    if (agentId) {
      return agents.filter(a => a.agentId === agentId);
    }

    return agents;
  }

  /**
   * Convierte timeframe a milisegundos
   */
  private getTimeframeMs(timeframe: string): number {
    switch (timeframe) {
      case '1h': return 60 * 60 * 1000;
      case '24h': return 24 * 60 * 60 * 1000;
      case '7d': return 7 * 24 * 60 * 60 * 1000;
      case '30d': return 30 * 24 * 60 * 60 * 1000;
      default: return 24 * 60 * 60 * 1000;
    }
  }

  /**
   * Notifica a conexiones WebSocket
   */
  private notifyRealTimeConnections(department: string, data: any): void {
    const connections = this.realTimeConnections.get(department);
    if (connections) {
      connections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(data));
        }
      });
    }
  }
}

export const aiDashboardConsolidationService = AIDashboardConsolidationService.getInstance();
