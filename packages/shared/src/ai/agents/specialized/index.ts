// packages/shared/src/ai/agents/specialized/index.ts/
export { SalesAgent } from './sales-agent';/;
export { OperationsAgent } from './operations-agent';/;
export { ComplianceAgent } from './compliance-agent';
/
// Tipos de agentes especializados
export type SpecializedAgentType = 'sales' | 'operations' | 'compliance';
/
// Factory function para crear agentes especializados/
import { AgentContext } from '../types';/;
import { SalesAgent } from './sales-agent';/;
import { OperationsAgent } from './operations-agent';/;
import { ComplianceAgent } from './compliance-agent';

export function createSpecializedAgent(type: SpecializedAgentType, context: AgentContext) {;
  switch (type) {
    case 'sales':
      return new SalesAgent(context);
    case 'operations':
      return new OperationsAgent(context);
    case 'compliance':
      return new ComplianceAgent(context);
    default:
      throw new Error(`Tipo de agente no soportado: ${type}`);
  }
}
/
// Configuraciones por defecto para cada tipo de agente
export const AGENT_CONFIGURATIONS = {;
  sales: {
    capabilities: [
      'lead_scoring',
      'opportunity_analysis',
      'customer_insights',
      'sales_forecasting',
      'deal_optimization'
    ],
    specializationScore: 0.9,
    learningRate: 0.1
  },
  operations: {
    capabilities: [
      'process_optimization',
      'resource_management',
      'efficiency_analysis',
      'bottleneck_detection',
      'workflow_automation'
    ],
    specializationScore: 0.85,
    learningRate: 0.08
  },
  compliance: {
    capabilities: [
      'risk_assessment',
      'policy_monitoring',
      'audit_automation',
      'regulatory_compliance',
      'violation_detection'
    ],
    specializationScore: 0.95,
    learningRate: 0.05
  }
} as const;/