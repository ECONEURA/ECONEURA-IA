// packages/shared/src/ai/agents/index.ts
// Core components
export { AutonomousAgent } from './core/autonomous-agent';
export { LearningEngine } from './learning/learning-engine';
export { WorkflowEngine } from './orchestrator/workflow-engine';

// Specialized agents
export * from './specialized';

// Types
export * from './types';

// Factory functions
import { AgentContext, BusinessAction } from './types';
import { createSpecializedAgent, AGENT_CONFIGURATIONS, SpecializedAgentType } from './specialized';
import { AutonomousAgent } from './core/autonomous-agent';

/**
 * Crea un agente autónomo con configuración optimizada para su especialización
 */
export function createOptimizedAgent(type: SpecializedAgentType, baseContext: Partial<AgentContext>): AutonomousAgent {
  const config = AGENT_CONFIGURATIONS[type];

  const context: AgentContext = {
    id: baseContext.id || `agent-${type}-${Date.now()}`,
    name: baseContext.name || `${type.charAt(0).toUpperCase() + type.slice(1)} Agent`,
    role: type,
    capabilities: [...config.capabilities],
    learningHistory: baseContext.learningHistory || [],
    performance: baseContext.performance || {
      totalActions: 0,
      successRate: 0,
      averageConfidence: 0,
      specializationScore: config.specializationScore,
      adaptationRate: config.learningRate
    },
    lastActive: baseContext.lastActive || new Date(),
    confidence: baseContext.confidence || 0.5
  };

  return createSpecializedAgent(type, context);
}

/**
 * Sistema de agentes para ECONEURA-IA
 * Proporciona una interfaz unificada para gestionar múltiples agentes especializados
 */
export class AgentSystem {
  private agents: Map<string, AutonomousAgent> = new Map();

  /**
   * Registra un nuevo agente en el sistema
   */
  registerAgent(type: SpecializedAgentType, context: Partial<AgentContext>): string {
    const agent = createOptimizedAgent(type, context);
    const agentId = agent.getContext().id;
    this.agents.set(agentId, agent);
    return agentId;
  }

  /**
   * Obtiene un agente por su ID
   */
  getAgent(id: string): AutonomousAgent | undefined {
    return this.agents.get(id);
  }

  /**
   * Lista todos los agentes registrados
   */
  listAgents(): Array<{ id: string; type: string; status: string }> {
    return Array.from(this.agents.entries()).map(([id, agent]) => ({
      id,
      type: agent.getContext().role,
      status: agent.isAgentActive() ? 'active' : 'inactive'
    }));
  }

  /**
   * Ejecuta una acción usando el agente más apropiado
   */
  async executeAction(action: BusinessAction): Promise<any> {
    // Encontrar el agente más apropiado para esta acción
    const suitableAgent = this.findSuitableAgent(action);

    if (!suitableAgent) {
      throw new Error(`No hay agente disponible para el tipo de acción: ${action.type}`);
    }

    return await suitableAgent.predictAndExecute(action);
  }

  /**
   * Encuentra el agente más apropiado para una acción
   */
  private findSuitableAgent(action: BusinessAction): AutonomousAgent | undefined {
    let bestAgent: AutonomousAgent | undefined;
    let bestScore = 0;

    for (const agent of this.agents.values()) {
      const context = agent.getContext();
      const performance = context.performance;

      // Calcular puntuación de adecuación
      let score = performance.specializationScore;

      // Bonus por capacidades relevantes
      if (context.capabilities.some(cap => cap.includes(action.type))) {
        score += 0.2;
      }

      // Bonus por experiencia reciente
      const recentActions = context.learningHistory.filter(
        event => Date.now() - event.timestamp.getTime() < 30 * 24 * 60 * 60 * 1000 // Últimos 30 días
      );
      score += Math.min(recentActions.length * 0.05, 0.3);

      if (score > bestScore) {
        bestScore = score;
        bestAgent = agent;
      }
    }

    return bestAgent;
  }

  /**
   * Obtiene métricas del sistema de agentes
   */
  getSystemMetrics(): {
    totalAgents: number;
    activeAgents: number;
    averagePerformance: number;
    specializationCoverage: number;
  } {
    const agents = Array.from(this.agents.values());
    const activeAgents = agents.filter(agent => agent.isAgentActive());

    const averagePerformance = agents.reduce((sum, agent) => {
      return sum + agent.getContext().performance.successRate;
    }, 0) / agents.length;

    const specializationCoverage = new Set(
      agents.flatMap(agent => agent.getContext().capabilities)
    ).size / Object.values(AGENT_CONFIGURATIONS).flatMap(config => config.capabilities).length;

    return {
      totalAgents: agents.length,
      activeAgents: activeAgents.length,
      averagePerformance: averagePerformance || 0,
      specializationCoverage
    };
  }
}

// Instancia global del sistema de agentes
export const agentSystem = new AgentSystem();
