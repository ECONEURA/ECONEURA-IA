// packages/shared/src/ai/agents/types.ts
export interface AgentContext {
  id: string;
  name: string;
  role: string;
  capabilities: string[];
  learningHistory: LearningEvent[];
  performance: AgentPerformance;
  lastActive: Date;
  confidence: number;
}

export interface LearningEvent {
  timestamp: Date;
  action: string;
  result: 'success' | 'failure' | 'partial';
  feedback: number; // -1 to 1
  context: Record<string, any>;
  lessons: string[];
}

export interface AgentPerformance {
  totalActions: number;
  successRate: number;
  averageConfidence: number;
  specializationScore: number;
  adaptationRate: number;
}

export interface BusinessAction {
  id: string;
  type: 'sales' | 'finance' | 'operations' | 'customer' | 'compliance' | 'audit' | 'regulatory';
  priority: 'low' | 'medium' | 'high' | 'critical';
  data: Record<string, any>;
  deadline?: Date;
  requiresApproval: boolean;
}

export interface ExecutionResult {
  success: boolean;
  confidence: number;
  actions: string[];
  predictions?: Prediction[];
  requiresApproval?: boolean;
  feedback?: string;
}

export interface Prediction {
  type: string;
  confidence: number;
  value: any;
  reasoning: string;
  timeframe: Date;
}

export interface AgentMessage {
  from: string;
  to: string;
  type: 'command' | 'response' | 'notification' | 'learning';
  payload: any;
  timestamp: Date;
  correlationId: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  triggers: WorkflowTrigger[];
  steps: WorkflowStep[];
  conditions: WorkflowCondition[];
  successRate: number;
  usageCount: number;
}

export interface WorkflowTrigger {
  type: 'event' | 'schedule' | 'condition';
  config: Record<string, any>;
}

export interface WorkflowStep {
  id: string;
  agent: string;
  action: string;
  parameters: Record<string, any>;
  timeout: number;
  retryPolicy: RetryPolicy;
}

export interface WorkflowCondition {
  type: 'and' | 'or' | 'not';
  conditions: WorkflowCondition[];
  field?: string;
  operator?: string;
  value?: any;
}

export interface RetryPolicy {
  maxAttempts: number;
  backoff: 'linear' | 'exponential';
  delay: number;
}

export interface LearningModel {
  train(event: LearningEvent): Promise<void>;
  predict(action: BusinessAction): Promise<Prediction>;
  getConfidence(action: BusinessAction): Promise<number>;
  adapt(context: AgentContext): Promise<AgentContext>;
}

export interface WorkflowEngine {
  createWorkflow(template: WorkflowTemplate): Promise<string>;
  executeWorkflow(workflowId: string, context: Record<string, any>): Promise<ExecutionResult>;
  optimizeWorkflow(workflowId: string, performance: AgentPerformance): Promise<WorkflowTemplate>;
  getWorkflowTemplates(): Promise<WorkflowTemplate[]>;
}