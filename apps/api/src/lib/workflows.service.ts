import { z } from 'zod';

// Schemas de validación
export const WorkflowElementSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['startEvent', 'endEvent', 'task', 'gateway', 'intermediateEvent']),
  name: z.string().min(1),
  x: z.number().optional(),
  y: z.number().optional(),
  actions: z.array(z.string()).optional()
});

export const WorkflowFlowSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  condition: z.string().optional()
});

export const BPMNDefinitionSchema = z.object({
  elements: z.array(WorkflowElementSchema),
  flows: z.array(WorkflowFlowSchema),
  startElement: z.string().min(1),
  endElements: z.array(z.string())
});

export const StateMachineStateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(['initial', 'intermediate', 'final']),
  actions: z.array(z.string()).optional()
});

export const StateMachineTransitionSchema = z.object({
  id: z.string().min(1),
  from: z.string().min(1),
  to: z.string().min(1),
  event: z.string().min(1),
  condition: z.string().optional()
});

export const StateMachineDefinitionSchema = z.object({
  states: z.array(StateMachineStateSchema),
  transitions: z.array(StateMachineTransitionSchema),
  initialState: z.string().min(1),
  finalStates: z.array(z.string())
});

export const WorkflowActionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(['function', 'http', 'notification', 'delay', 'condition']),
  config: z.record(z.any()),
  order: z.number().min(1)
});

export const WorkflowMetadataSchema = z.object({
  author: z.string().min(1),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  priority: z.number().min(1).max(5).optional(),
  timeout: z.number().min(1).optional(),
  description: z.string().optional()
});

export const WorkflowSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  type: z.enum(['bpmn', 'state_machine']),
  status: z.enum(['active', 'inactive', 'draft']),
  version: z.number().min(1),
  definition: z.union([BPMNDefinitionSchema, StateMachineDefinitionSchema]),
  actions: z.array(WorkflowActionSchema),
  metadata: WorkflowMetadataSchema,
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

export const WorkflowInstanceSchema = z.object({
  id: z.string().uuid().optional(),
  workflowId: z.string().uuid(),
  status: z.enum(['running', 'paused', 'completed', 'failed', 'cancelled']),
  currentElement: z.string().optional(),
  currentState: z.string().optional(),
  context: z.record(z.any()),
  metadata: z.record(z.any()),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
  executionHistory: z.array(z.object({
    timestamp: z.date(),
    action: z.string(),
    status: z.enum(['success', 'failed', 'skipped']),
    details: z.record(z.any()).optional()
  })).optional()
});

// Tipos
export type WorkflowElement = z.infer<typeof WorkflowElementSchema>;
export type WorkflowFlow = z.infer<typeof WorkflowFlowSchema>;
export type BPMNDefinition = z.infer<typeof BPMNDefinitionSchema>;
export type StateMachineState = z.infer<typeof StateMachineStateSchema>;
export type StateMachineTransition = z.infer<typeof StateMachineTransitionSchema>;
export type StateMachineDefinition = z.infer<typeof StateMachineDefinitionSchema>;
export type WorkflowAction = z.infer<typeof WorkflowActionSchema>;
export type WorkflowMetadata = z.infer<typeof WorkflowMetadataSchema>;
export type Workflow = z.infer<typeof WorkflowSchema>;
export type WorkflowInstance = z.infer<typeof WorkflowInstanceSchema>;

// Servicio de workflows
export class WorkflowsService {
  private workflows: Map<string, Workflow> = new Map();
  private instances: Map<string, WorkflowInstance> = new Map();
  private executionQueue: Map<string, WorkflowInstance> = new Map();

  constructor() {
    this.initializeDefaultWorkflows();
  }

  // Inicializar workflows por defecto
  private initializeDefaultWorkflows() {
    // Workflow BPMN por defecto
    const defaultBPMNWorkflow: Workflow = {
      id: 'workflow_bpmn_1',
      name: 'User Onboarding Process',
      type: 'bpmn',
      status: 'active',
      version: 1,
      definition: {
        elements: [
          { id: 'start', type: 'startEvent', name: 'Start', x: 100, y: 100 },
          { id: 'validate', type: 'task', name: 'Validate User', x: 300, y: 100, actions: ['validate_user'] },
          { id: 'approve', type: 'task', name: 'Approve', x: 500, y: 100, actions: ['send_approval_email'] },
          { id: 'complete', type: 'endEvent', name: 'Complete', x: 700, y: 100 }
        ],
        flows: [
          { id: 'f1', source: 'start', target: 'validate' },
          { id: 'f2', source: 'validate', target: 'approve' },
          { id: 'f3', source: 'approve', target: 'complete' }
        ],
        startElement: 'start',
        endElements: ['complete']
      },
      actions: [
        {
          id: 'validate_user',
          name: 'Validate User',
          type: 'function',
          config: { functionName: 'validateUser', parameters: { userId: '{{userId}}' } },
          order: 1
        },
        {
          id: 'send_approval_email',
          name: 'Send Approval Email',
          type: 'notification',
          config: { type: 'email', recipient: '{{userEmail}}', message: 'Welcome!' },
          order: 2
        }
      ],
      metadata: {
        author: 'System',
        category: 'User Management',
        tags: ['onboarding', 'user'],
        priority: 1,
        timeout: 300,
        description: 'User onboarding process'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Workflow State Machine por defecto
    const defaultStateMachineWorkflow: Workflow = {
      id: 'workflow_state_1',
      name: 'Order Processing',
      type: 'state_machine',
      status: 'active',
      version: 1,
      definition: {
        states: [
          { id: 'pending', name: 'Pending', type: 'initial', actions: ['validate_order'] },
          { id: 'processing', name: 'Processing', type: 'intermediate', actions: ['process_payment'] },
          { id: 'completed', name: 'Completed', type: 'final', actions: ['send_confirmation'] }
        ],
        transitions: [
          { id: 't1', from: 'pending', to: 'processing', event: 'order_validated' },
          { id: 't2', from: 'processing', to: 'completed', event: 'payment_processed' }
        ],
        initialState: 'pending',
        finalStates: ['completed']
      },
      actions: [
        {
          id: 'validate_order',
          name: 'Validate Order',
          type: 'function',
          config: { functionName: 'validateOrder', parameters: { orderId: '{{orderId}}' } },
          order: 1
        },
        {
          id: 'process_payment',
          name: 'Process Payment',
          type: 'http',
          config: { url: '/api/payments/process', method: 'POST', body: { orderId: '{{orderId}}' } },
          order: 1
        },
        {
          id: 'send_confirmation',
          name: 'Send Confirmation',
          type: 'notification',
          config: { type: 'email', recipient: '{{customerEmail}}', message: 'Order confirmed!' },
          order: 1
        }
      ],
      metadata: {
        author: 'System',
        category: 'Order Management',
        tags: ['order', 'processing'],
        priority: 2,
        timeout: 3600,
        description: 'Order processing workflow'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.workflows.set(defaultBPMNWorkflow.id!, defaultBPMNWorkflow);
    this.workflows.set(defaultStateMachineWorkflow.id!, defaultStateMachineWorkflow);
  }

  // Gestión de workflows
  async getWorkflows(filters?: { type?: string; status?: string }): Promise<Workflow[]> {
    let workflows = Array.from(this.workflows.values());

    if (filters?.type) {
      workflows = workflows.filter(w => w.type === filters.type);
    }

    if (filters?.status) {
      workflows = workflows.filter(w => w.status === filters.status);
    }

    return workflows;
  }

  async getWorkflow(id: string): Promise<Workflow | null> {
    return this.workflows.get(id) || null;
  }

  async createWorkflow(workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>): Promise<Workflow> {
    const newWorkflow: Workflow = {
      ...workflow,
      id: `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.workflows.set(newWorkflow.id!, newWorkflow);
    return newWorkflow;
  }

  async updateWorkflow(id: string, updates: Partial<Workflow>): Promise<Workflow | null> {
    const existing = this.workflows.get(id);
    if (!existing) return null;

    const updated: Workflow = {
      ...existing,
      ...updates,
      updatedAt: new Date()
    };

    this.workflows.set(id, updated);
    return updated;
  }

  async deleteWorkflow(id: string): Promise<boolean> {
    return this.workflows.delete(id);
  }

  // Gestión de instancias
  async getInstances(filters?: { status?: string; workflowId?: string }): Promise<WorkflowInstance[]> {
    let instances = Array.from(this.instances.values());

    if (filters?.status) {
      instances = instances.filter(i => i.status === filters.status);
    }

    if (filters?.workflowId) {
      instances = instances.filter(i => i.workflowId === filters.workflowId);
    }

    return instances;
  }

  async getInstance(id: string): Promise<WorkflowInstance | null> {
    return this.instances.get(id) || null;
  }

  async startWorkflow(workflowId: string, context: Record<string, any>, metadata: Record<string, any>): Promise<WorkflowInstance> {
    const workflow = await this.getWorkflow(workflowId);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    const instance: WorkflowInstance = {
      id: `instance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      workflowId,
      status: 'running',
      context,
      metadata,
      startedAt: new Date(),
      executionHistory: []
    };

    // Establecer elemento/estado inicial
    if (workflow.type === 'bpmn') {
      const bpmnDef = workflow.definition as BPMNDefinition;
      instance.currentElement = bpmnDef.startElement;
    } else if (workflow.type === 'state_machine') {
      const stateDef = workflow.definition as StateMachineDefinition;
      instance.currentState = stateDef.initialState;
    }

    this.instances.set(instance.id!, instance);
    this.executionQueue.set(instance.id!, instance);

    // Ejecutar acciones iniciales
    await this.executeInitialActions(instance, workflow);

    return instance;
  }

  async pauseInstance(instanceId: string): Promise<WorkflowInstance | null> {
    const instance = this.instances.get(instanceId);
    if (!instance) return null;

    instance.status = 'paused';
    this.executionQueue.delete(instanceId);

    return instance;
  }

  async resumeInstance(instanceId: string): Promise<WorkflowInstance | null> {
    const instance = this.instances.get(instanceId);
    if (!instance) return null;

    instance.status = 'running';
    this.executionQueue.set(instanceId, instance);

    return instance;
  }

  async cancelInstance(instanceId: string): Promise<WorkflowInstance | null> {
    const instance = this.instances.get(instanceId);
    if (!instance) return null;

    instance.status = 'cancelled';
    instance.completedAt = new Date();
    this.executionQueue.delete(instanceId);

    return instance;
  }

  async executeAction(instanceId: string, actionId: string): Promise<{ success: boolean; result?: any; error?: string }> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      return { success: false, error: 'Instance not found' };
    }

    const workflow = await this.getWorkflow(instance.workflowId);
    if (!workflow) {
      return { success: false, error: 'Workflow not found' };
    }

    const action = workflow.actions.find(a => a.id === actionId);
    if (!action) {
      return { success: false, error: 'Action not found' };
    }

    try {
      const result = await this.executeActionLogic(action, instance.context);

      // Registrar en historial
      instance.executionHistory = instance.executionHistory || [];
      instance.executionHistory.push({
        timestamp: new Date(),
        action: actionId,
        status: 'success',
        details: { result }
      });

      return { success: true, result };
    } catch (error) {
      // Registrar error en historial
      instance.executionHistory = instance.executionHistory || [];
      instance.executionHistory.push({
        timestamp: new Date(),
        action: actionId,
        status: 'failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });

      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Ejecutar acciones iniciales
  private async executeInitialActions(instance: WorkflowInstance, workflow: Workflow): Promise<void> {
    const currentElement = instance.currentElement;
    const currentState = instance.currentState;

    if (workflow.type === 'bpmn' && currentElement) {
      const bpmnDef = workflow.definition as BPMNDefinition;
      const element = bpmnDef.elements.find(e => e.id === currentElement);

      if (element?.actions) {
        for (const actionId of element.actions) {
          await this.executeAction(instance.id!, actionId);
        }
      }
    } else if (workflow.type === 'state_machine' && currentState) {
      const stateDef = workflow.definition as StateMachineDefinition;
      const state = stateDef.states.find(s => s.id === currentState);

      if (state?.actions) {
        for (const actionId of state.actions) {
          await this.executeAction(instance.id!, actionId);
        }
      }
    }
  }

  // Lógica de ejecución de acciones
  private async executeActionLogic(action: WorkflowAction, context: Record<string, any>): Promise<any> {
    switch (action.type) {
      case 'function':
        return await this.executeFunctionAction(action, context);
      case 'http':
        return await this.executeHttpAction(action, context);
      case 'notification':
        return await this.executeNotificationAction(action, context);
      case 'delay':
        return await this.executeDelayAction(action, context);
      case 'condition':
        return await this.executeConditionAction(action, context);
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  private async executeFunctionAction(action: WorkflowAction, context: Record<string, any>): Promise<any> {
    const { functionName, parameters } = action.config;

    // Simular ejecución de función
    const processedParams = this.processTemplate(parameters, context);

    return {
      functionName,
      parameters: processedParams,
      result: 'Function executed successfully'
    };
  }

  private async executeHttpAction(action: WorkflowAction, context: Record<string, any>): Promise<any> {
    const { url, method, body, headers } = action.config;

    // Simular llamada HTTP
    const processedBody = this.processTemplate(body, context);
    const processedHeaders = this.processTemplate(headers, context);

    return {
      url,
      method,
      body: processedBody,
      headers: processedHeaders,
      result: 'HTTP request executed successfully'
    };
  }

  private async executeNotificationAction(action: WorkflowAction, context: Record<string, any>): Promise<any> {
    const { type, recipient, message, subject } = action.config;

    const processedRecipient = this.processTemplate(recipient, context);
    const processedMessage = this.processTemplate(message, context);
    const processedSubject = this.processTemplate(subject, context);

    return {
      type,
      recipient: processedRecipient,
      message: processedMessage,
      subject: processedSubject,
      result: 'Notification sent successfully'
    };
  }

  private async executeDelayAction(action: WorkflowAction, context: Record<string, any>): Promise<any> {
    const { duration } = action.config;

    // Simular delay
    await new Promise(resolve => setTimeout(resolve, duration || 1000));

    return {
      duration,
      result: 'Delay completed'
    };
  }

  private async executeConditionAction(action: WorkflowAction, context: Record<string, any>): Promise<any> {
    const { condition, trueAction, falseAction } = action.config;

    const processedCondition = this.processTemplate(condition, context);
    const result = this.evaluateCondition(processedCondition, context);

    return {
      condition: processedCondition,
      result,
      nextAction: result ? trueAction : falseAction
    };
  }

  // Procesar templates con variables
  private processTemplate(template: any, context: Record<string, any>): any {
    if (typeof template === 'string') {
      return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return context[key] || match;
      });
    } else if (typeof template === 'object' && template !== null) {
      const processed: any = {};
      for (const [key, value] of Object.entries(template)) {
        processed[key] = this.processTemplate(value, context);
      }
      return processed;
    }
    return template;
  }

  // Evaluar condiciones
  private evaluateCondition(condition: string, context: Record<string, any>): boolean {
    try {
      // Evaluación simple de condiciones
      const processedCondition = condition.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        const value = context[key];
        return typeof value === 'string' ? `"${value}"` : value;
      });

      // Evaluación segura (solo operaciones básicas)
      return eval(processedCondition);
    } catch {
      return false;
    }
  }

  // Estadísticas
  async getStats(): Promise<{
    totalWorkflows: number;
    totalInstances: number;
    workflowsByType: Record<string, number>;
    instancesByStatus: Record<string, number>;
    averageExecutionTime: number;
    successRate: number;
  }> {
    const workflows = Array.from(this.workflows.values());
    const instances = Array.from(this.instances.values());

    const workflowsByType: Record<string, number> = {};
    const instancesByStatus: Record<string, number> = {};

    // Contar workflows por tipo
    for (const workflow of workflows) {
      workflowsByType[workflow.type] = (workflowsByType[workflow.type] || 0) + 1;
    }

    // Contar instancias por estado
    for (const instance of instances) {
      instancesByStatus[instance.status] = (instancesByStatus[instance.status] || 0) + 1;
    }

    // Calcular tiempo promedio de ejecución
    const completedInstances = instances.filter(i => i.completedAt && i.startedAt);
    const averageExecutionTime = completedInstances.length > 0
      ? completedInstances.reduce((sum, i) => {
          const duration = i.completedAt!.getTime() - i.startedAt!.getTime();
          return sum + duration;
        }, 0) / completedInstances.length
      : 0;

    // Calcular tasa de éxito
    const successfulInstances = instances.filter(i => i.status === 'completed').length;
    const successRate = instances.length > 0 ? (successfulInstances / instances.length) * 100 : 0;

    return {
      totalWorkflows: workflows.length,
      totalInstances: instances.length,
      workflowsByType,
      instancesByStatus,
      averageExecutionTime,
      successRate
    };
  }

  // Validación
  async validateWorkflow(workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validar nombre
    if (!workflow.name || workflow.name.length === 0) {
      errors.push('Workflow name is required');
    }

    // Validar tipo
    if (!['bpmn', 'state_machine'].includes(workflow.type)) {
      errors.push('Invalid workflow type');
    }

    // Validar definición según tipo
    if (workflow.type === 'bpmn') {
      const bpmnDef = workflow.definition as BPMNDefinition;

      if (!bpmnDef.startElement) {
        errors.push('BPMN workflow must have a start element');
      }

      if (!bpmnDef.endElements || bpmnDef.endElements.length === 0) {
        errors.push('BPMN workflow must have at least one end element');
      }

      // Validar que todos los elementos referenciados existen
      const elementIds = bpmnDef.elements.map(e => e.id);
      const referencedElements = [
        bpmnDef.startElement,
        ...bpmnDef.endElements,
        ...bpmnDef.flows.map(f => f.source),
        ...bpmnDef.flows.map(f => f.target)
      ];

      for (const ref of referencedElements) {
        if (!elementIds.includes(ref)) {
          errors.push(`Referenced element '${ref}' not found in elements`);
        }
      }
    } else if (workflow.type === 'state_machine') {
      const stateDef = workflow.definition as StateMachineDefinition;

      if (!stateDef.initialState) {
        errors.push('State machine must have an initial state');
      }

      if (!stateDef.finalStates || stateDef.finalStates.length === 0) {
        errors.push('State machine must have at least one final state');
      }

      // Validar que todos los estados referenciados existen
      const stateIds = stateDef.states.map(s => s.id);
      const referencedStates = [
        stateDef.initialState,
        ...stateDef.finalStates,
        ...stateDef.transitions.map(t => t.from),
        ...stateDef.transitions.map(t => t.to)
      ];

      for (const ref of referencedStates) {
        if (!stateIds.includes(ref)) {
          errors.push(`Referenced state '${ref}' not found in states`);
        }
      }
    }

    // Validar acciones
    for (const action of workflow.actions) {
      if (!action.id || action.id.length === 0) {
        errors.push('Action ID is required');
      }

      if (!['function', 'http', 'notification', 'delay', 'condition'].includes(action.type)) {
        errors.push(`Invalid action type: ${action.type}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// Instancia singleton
export const workflowsService = new WorkflowsService();
