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
const CockpitAgentRequestSchema = z.object({
  agentId: z.string(),
  department: z.enum(['ceo', 'ia', 'cso', 'cto', 'ciso', 'coo', 'chro', 'cgo', 'cfo', 'cdo']),
  action: z.enum(['run', 'pause', 'stop', 'status']),
  parameters: z.record(z.any()).optional(),
});

const CockpitMetricsRequestSchema = z.object({
  department: z.enum(['ceo', 'ia', 'cso', 'cto', 'ciso', 'coo', 'chro', 'cgo', 'cfo', 'cdo']),
  timeframe: z.enum(['1h', '24h', '7d', '30d']).default('24h'),
  includeDetails: z.boolean().default(false),
});

const CockpitChatRequestSchema = z.object({
  department: z.enum(['ceo', 'ia', 'cso', 'cto', 'ciso', 'coo', 'chro', 'cgo', 'cfo', 'cdo']),
  message: z.string().min(1).max(1000),
  context: z.object({
    agentId: z.string().optional(),
    previousMessages: z.array(z.string()).optional(),
    includeMetrics: z.boolean().default(true),
  }).optional(),
});

export interface CockpitAgentRequest {
  agentId: string;
  department: string;
  action: 'run' | 'pause' | 'stop' | 'status';
  parameters?: Record<string, any>;
}

export interface CockpitMetricsRequest {
  department: string;
  timeframe: string;
  includeDetails: boolean;
}

export interface CockpitChatRequest {
  department: string;
  message: string;
  context?: {
    agentId?: string;
    previousMessages?: string[];
    includeMetrics?: boolean;
  };
}

export interface CockpitAgentResponse {
  agentId: string;
  department: string;
  status: 'active' | 'paused' | 'stopped' | 'error';
  message: string;
  metrics: {
    tokens: number;
    cost: number;
    latency: number;
    calls: number;
  };
  timestamp: Date;
}

export interface CockpitMetricsResponse {
  department: string;
  timeframe: string;
  summary: {
    totalCost: number;
    totalTokens: number;
    averageLatency: number;
    successRate: number;
    activeAgents: number;
    errorRate: number;
  };
  details?: {
    costBreakdown: Array<{
      agentId: string;
      cost: number;
      tokens: number;
      calls: number;
    }>;
    performanceMetrics: Array<{
      agentId: string;
      latency: number;
      successRate: number;
      errorRate: number;
    }>;
    predictions: {
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
    optimizations: {
      activeRules: number;
      savings: number;
      recommendations: string[];
    };
    security: {
      complianceScore: number;
      activePolicies: number;
      incidents: number;
      lastAudit: Date;
    };
  };
  timestamp: Date;
}

export interface CockpitChatResponse {
  department: string;
  message: string;
  response: string;
  context: {
    agentId?: string;
    metrics?: {
      tokens: number;
      cost: number;
      latency: number;
    };
    suggestions: string[];
  };
  timestamp: Date;
}

export class CockpitIntegrationService {
  private static instance: CockpitIntegrationService;
  private agentStates: Map<string, CockpitAgentResponse> = new Map();
  private chatHistory: Map<string, Array<{ role: 'user' | 'assistant'; message: string; timestamp: Date }>> = new Map();

  public static getInstance(): CockpitIntegrationService {
    if (!CockpitIntegrationService.instance) {
      CockpitIntegrationService.instance = new CockpitIntegrationService();
    }
    return CockpitIntegrationService.instance;
  }

  /**
   * Ejecuta una acción en un agente del cockpit
   */
  async executeAgentAction(request: CockpitAgentRequest): Promise<CockpitAgentResponse> {
    try {
      const validatedRequest = CockpitAgentRequestSchema.parse(request);
      
      logger.info('Executing cockpit agent action', {
        agentId: validatedRequest.agentId,
        department: validatedRequest.department,
        action: validatedRequest.action,
      });

      const response = await this.processAgentAction(validatedRequest);
      
      // Actualizar estado del agente
      this.agentStates.set(validatedRequest.agentId, response);
      
      return response;
    } catch (error) {
      logger.error('Error executing cockpit agent action', { error, request });
      throw new Error('Failed to execute agent action');
    }
  }

  /**
   * Obtiene métricas consolidadas para el cockpit
   */
  async getCockpitMetrics(request: CockpitMetricsRequest): Promise<CockpitMetricsResponse> {
    try {
      const validatedRequest = CockpitMetricsRequestSchema.parse(request);
      
      logger.info('Getting cockpit metrics', {
        department: validatedRequest.department,
        timeframe: validatedRequest.timeframe,
        includeDetails: validatedRequest.includeDetails,
      });

      return await this.generateCockpitMetrics(validatedRequest);
    } catch (error) {
      logger.error('Error getting cockpit metrics', { error, request });
      throw new Error('Failed to get cockpit metrics');
    }
  }

  /**
   * Procesa un mensaje de chat del cockpit
   */
  async processCockpitChat(request: CockpitChatRequest): Promise<CockpitChatResponse> {
    try {
      const validatedRequest = CockpitChatRequestSchema.parse(request);
      
      logger.info('Processing cockpit chat', {
        department: validatedRequest.department,
        messageLength: validatedRequest.message.length,
        hasContext: !!validatedRequest.context,
      });

      const response = await this.generateChatResponse(validatedRequest);
      
      // Guardar en historial
      const chatKey = `${validatedRequest.department}-${validatedRequest.context?.agentId || 'general'}`;
      if (!this.chatHistory.has(chatKey)) {
        this.chatHistory.set(chatKey, []);
      }
      
      const history = this.chatHistory.get(chatKey)!;
      history.push(
        { role: 'user', message: validatedRequest.message, timestamp: new Date() },
        { role: 'assistant', message: response.response, timestamp: new Date() }
      );
      
      // Mantener solo los últimos 20 mensajes
      if (history.length > 20) {
        history.splice(0, history.length - 20);
      }
      
      return response;
    } catch (error) {
      logger.error('Error processing cockpit chat', { error, request });
      throw new Error('Failed to process chat message');
    }
  }

  /**
   * Obtiene el estado actual de un agente
   */
  async getAgentStatus(agentId: string): Promise<CockpitAgentResponse | null> {
    return this.agentStates.get(agentId) || null;
  }

  /**
   * Obtiene el historial de chat de un departamento/agente
   */
  async getChatHistory(department: string, agentId?: string): Promise<Array<{ role: 'user' | 'assistant'; message: string; timestamp: Date }>> {
    const chatKey = `${department}-${agentId || 'general'}`;
    return this.chatHistory.get(chatKey) || [];
  }

  /**
   * Procesa una acción de agente
   */
  private async processAgentAction(request: CockpitAgentRequest): Promise<CockpitAgentResponse> {
    const now = new Date();
    
    // Simular procesamiento basado en el tipo de agente y acción
    let status: 'active' | 'paused' | 'stopped' | 'error' = 'active';
    let message = '';
    let metrics = {
      tokens: 0,
      cost: 0,
      latency: 0,
      calls: 0,
    };

    switch (request.action) {
      case 'run':
        if (request.agentId.startsWith('NEURA-')) {
          // Agente ejecutivo NEURA
          status = 'active';
          message = `Agente ejecutivo ${request.agentId} iniciado correctamente`;
          metrics = {
            tokens: Math.floor(Math.random() * 1000) + 100,
            cost: Math.random() * 10 + 1,
            latency: Math.floor(Math.random() * 500) + 100,
            calls: Math.floor(Math.random() * 50) + 10,
          };
        } else {
          // Agente automatizado
          status = 'active';
          message = `Agente automatizado ${request.agentId} ejecutándose`;
          metrics = {
            tokens: Math.floor(Math.random() * 800) + 50,
            cost: Math.random() * 8 + 0.5,
            latency: Math.floor(Math.random() * 400) + 80,
            calls: Math.floor(Math.random() * 30) + 5,
          };
        }
        break;
        
      case 'pause':
        status = 'paused';
        message = `Agente ${request.agentId} pausado`;
        break;
        
      case 'stop': {
        status = 'stopped';
        message = `Agente ${request.agentId} detenido`;
        break;
      }
      case 'status': {
        const currentState = this.agentStates.get(request.agentId);
        if (currentState) {
          return currentState;
        }
        status = 'active';
      }
        message = `Estado actual de ${request.agentId}`;
        break;
    }

    return {
      agentId: request.agentId,
      department: request.department,
      status,
      message,
      metrics,
      timestamp: now,
    };
  }

  /**
   * Genera métricas consolidadas para el cockpit
   */
  private async generateCockpitMetrics(request: CockpitMetricsRequest): Promise<CockpitMetricsResponse> {
    const now = new Date();
    const timeframeMs = this.getTimeframeMs(request.timeframe);
    const since = new Date(now.getTime() - timeframeMs);

    // Obtener métricas de la base de datos
    const costData = await this.getCostData(request.department, since);
    const predictionData = await this.getPredictionData(request.department);
    const optimizationData = await this.getOptimizationData(request.department);
    const securityData = await this.getSecurityData(request.department);

    // Calcular resumen
    const summary = {
      totalCost: costData.totalCost,
      totalTokens: costData.totalTokens,
      averageLatency: costData.averageLatency,
      successRate: costData.successRate,
      activeAgents: this.getActiveAgentsCount(request.department),
      errorRate: costData.errorRate,
    };

    let details;
    if (request.includeDetails) {
      details = {
        costBreakdown: this.generateCostBreakdown(request.department),
        performanceMetrics: this.generatePerformanceMetrics(request.department),
        predictions: predictionData,
        optimizations: optimizationData,
        security: securityData,
      };
    }

    return {
      department: request.department,
      timeframe: request.timeframe,
      summary,
      details,
      timestamp: now,
    };
  }

  /**
   * Genera respuesta de chat
   */
  private async generateChatResponse(request: CockpitChatRequest): Promise<CockpitChatResponse> {
    const now = new Date();
    
    // Generar respuesta basada en el departamento y contexto
    let response = '';
    let suggestions: string[] = [];
    
    if (request.context?.includeMetrics) {
      const metrics = await this.getCockpitMetrics({
        department: request.department,
        timeframe: '24h',
        includeDetails: false,
      });
      
      response = `Basándome en las métricas actuales del departamento ${request.department.toUpperCase()}:\n\n`;
      response += `• Costo total: €${metrics.summary.totalCost.toFixed(2)}\n`;
      response += `• Tokens utilizados: ${metrics.summary.totalTokens.toLocaleString()}\n`;
      response += `• Latencia promedio: ${metrics.summary.averageLatency.toFixed(0)}ms\n`;
      response += `• Tasa de éxito: ${(metrics.summary.successRate * 100).toFixed(1)}%\n`;
      response += `• Agentes activos: ${metrics.summary.activeAgents}\n\n`;
      
      if (request.message.toLowerCase().includes('optimizar') || request.message.toLowerCase().includes('mejorar')) {
        response += 'Recomendaciones de optimización:\n';
        response += '• Revisar configuración de modelos para reducir costos\n';
        response += '• Implementar cache para reducir latencia\n';
        response += '• Monitorear límites de tokens por agente\n';
      }
    } else {
      response = `Entiendo tu consulta sobre ${request.department.toUpperCase()}. `;
      response += `Como agente NEURA-${request.department.toUpperCase()}, puedo ayudarte con:\n\n`;
      response += '• Análisis de métricas y KPIs\n';
      response += '• Optimización de costos y rendimiento\n';
      response += '• Gestión de agentes automatizados\n';
      response += '• Reportes y análisis predictivos\n\n';
      response += '¿En qué área específica te gustaría que te ayude?';
    }

    // Generar sugerencias basadas en el departamento
    suggestions = this.generateSuggestions(request.department);

    return {
      department: request.department,
      message: request.message,
      response,
      context: {
        agentId: request.context?.agentId,
        metrics: request.context?.includeMetrics ? {
          tokens: Math.floor(Math.random() * 1000) + 100,
          cost: Math.random() * 10 + 1,
          latency: Math.floor(Math.random() * 500) + 100,
        } : undefined,
        suggestions,
      },
      timestamp: now,
    };
  }

  /**
   * Obtiene datos de costos
   */
  private async getCostData(department: string, since: Date) {
    try {
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
      logger.error('Error getting cost data', { error, department });
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
   * Obtiene datos de predicción
   */
  private async getPredictionData(department: string) {
    try {
      const predictionData = await db.select()
        .from(aiCostPrediction)
        .where(eq(aiCostPrediction.department, department))
        .orderBy(desc(aiCostPrediction.createdAt))
        .limit(1);

      if (predictionData.length === 0) {
        return {
          costForecast: { optimistic: 0, base: 0, pessimistic: 0 },
          usageForecast: { tokens: 0, calls: 0 },
          confidence: 0,
        };
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
      logger.error('Error getting prediction data', { error, department });
      return {
        costForecast: { optimistic: 0, base: 0, pessimistic: 0 },
        usageForecast: { tokens: 0, calls: 0 },
        confidence: 0,
      };
    }
  }

  /**
   * Obtiene datos de optimización
   */
  private async getOptimizationData(department: string) {
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
      logger.error('Error getting optimization data', { error, department });
      return {
        activeRules: 0,
        savings: 0,
        recommendations: [],
      };
    }
  }

  /**
   * Obtiene datos de seguridad
   */
  private async getSecurityData(department: string) {
    try {
      const securityData = await db.select()
        .from(aiSecurityCompliance)
        .where(eq(aiSecurityCompliance.department, department))
        .orderBy(desc(aiSecurityCompliance.createdAt))
        .limit(1);

      if (securityData.length === 0) {
        return {
          complianceScore: 0,
          activePolicies: 0,
          incidents: 0,
          lastAudit: new Date(),
        };
      }

      const latest = securityData[0];
      return {
        complianceScore: latest.complianceScore || 0,
        activePolicies: latest.activePolicies || 0,
        incidents: latest.securityIncidents || 0,
        lastAudit: latest.lastAuditDate || new Date(),
      };
    } catch (error) {
      logger.error('Error getting security data', { error, department });
      return {
        complianceScore: 0,
        activePolicies: 0,
        incidents: 0,
        lastAudit: new Date(),
      };
    }
  }

  /**
   * Genera desglose de costos
   */
  private generateCostBreakdown(department: string) {
    // Simular desglose de costos por agente
    const agents = this.getDepartmentAgents(department);
    return agents.map(agent => ({
      agentId: agent,
      cost: Math.random() * 10 + 1,
      tokens: Math.floor(Math.random() * 1000) + 100,
      calls: Math.floor(Math.random() * 50) + 10,
    }));
  }

  /**
   * Genera métricas de rendimiento
   */
  private generatePerformanceMetrics(department: string) {
    const agents = this.getDepartmentAgents(department);
    return agents.map(agent => ({
      agentId: agent,
      latency: Math.floor(Math.random() * 500) + 100,
      successRate: Math.random() * 0.3 + 0.7, // 70-100%
      errorRate: Math.random() * 0.1, // 0-10%
    }));
  }

  /**
   * Genera sugerencias basadas en el departamento
   */
  private generateSuggestions(department: string): string[] {
    const suggestionsByDept: Record<string, string[]> = {
      ceo: [
        'Revisar OKRs del trimestre',
        'Analizar métricas de rendimiento general',
        'Preparar reporte ejecutivo',
      ],
      ia: [
        'Optimizar costos de modelos IA',
        'Revisar cuotas de tokens',
        'Analizar rendimiento de workers',
      ],
      cso: [
        'Evaluar riesgos estratégicos',
        'Actualizar scorecards',
        'Revisar tendencias del mercado',
      ],
      cto: [
        'Monitorear SLOs',
        'Revisar optimizaciones cloud',
        'Analizar incidencias técnicas',
      ],
      ciso: [
        'Verificar políticas de seguridad',
        'Revisar CVEs pendientes',
        'Auditar accesos',
      ],
      coo: [
        'Monitorear SLAs',
        'Analizar atascos operacionales',
        'Revisar feedback de clientes',
      ],
      chro: [
        'Evaluar clima laboral',
        'Revisar procesos de onboarding',
        'Analizar pipeline de contratación',
      ],
      cgo: [
        'Optimizar campañas de marketing',
        'Analizar scoring de leads',
        'Revisar calendario editorial',
      ],
      cfo: [
        'Monitorear flujo de caja',
        'Analizar cobros pendientes',
        'Revisar proyecciones financieras',
      ],
      cdo: [
        'Verificar calidad de datos',
        'Revisar cumplimiento GDPR',
        'Auditar catálogo de datos',
      ],
    };

    return suggestionsByDept[department] || [
      'Revisar métricas generales',
      'Analizar rendimiento',
      'Optimizar procesos',
    ];
  }

  /**
   * Obtiene agentes de un departamento
   */
  private getDepartmentAgents(department: string): string[] {
    const agentsByDept: Record<string, string[]> = {
      ceo: ['NEURA-CEO', 'AGENTE-Preparador-Consejo', 'AGENTE-Comunicador-Semanal'],
      ia: ['NEURA-IA', 'AGENTE-Supervisor-Workers', 'AGENTE-Analista-Costes'],
      cso: ['NEURA-CSO', 'AGENTE-Gestor-Riesgos', 'AGENTE-Detector-Tendencias'],
      cto: ['NEURA-CTO', 'AGENTE-Optimizador-Cloud', 'AGENTE-Monitor-SLOs'],
      ciso: ['NEURA-CISO', 'AGENTE-Gestor-CVEs', 'AGENTE-Analista-Phishing'],
      coo: ['NEURA-COO', 'AGENTE-Detector-Atascos', 'AGENTE-Analista-Feedback'],
      chro: ['NEURA-CHRO', 'AGENTE-Encuestador-Clima', 'AGENTE-Gestor-Offboarding'],
      cgo: ['NEURA-CGO', 'AGENTE-Editor-Calendario', 'AGENTE-Automatizador-Campanas'],
      cfo: ['NEURA-CFO', 'AGENTE-Gestor-Cobros', 'AGENTE-Detector-Anormalidades'],
      cdo: ['NEURA-CDO', 'AGENTE-Verificador-Calidad', 'AGENTE-Gestor-Cumplimiento'],
    };

    return agentsByDept[department] || [];
  }

  /**
   * Obtiene conteo de agentes activos
   */
  private getActiveAgentsCount(department: string): number {
    const agents = this.getDepartmentAgents(department);
    return agents.length; // Simular que todos están activos
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
}

export const cockpitIntegrationService = CockpitIntegrationService.getInstance();
