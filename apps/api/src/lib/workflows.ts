import { z } from 'zod';

// ============================================================================
// TIPOS Y ESQUEMAS
// ============================================================================

export const WorkflowTypeSchema = z.enum(['bpmn', 'state_machine']);
export type WorkflowType = z.infer<typeof WorkflowTypeSchema>;

export const WorkflowStatusSchema = z.enum(['draft', 'active', 'inactive', 'archived']);
export type WorkflowStatus = z.infer<typeof WorkflowStatusSchema>;

export const InstanceStatusSchema = z.enum(['running', 'completed', 'failed', 'paused', 'cancelled']);
export type InstanceStatus = z.infer<typeof InstanceStatusSchema>;

export const ActionTypeSchema = z.enum(['function', 'http', 'delay', 'condition', 'notification']);
export type ActionType = z.infer<typeof ActionTypeSchema>;

export const RetryStrategySchema = z.enum(['fixed', 'exponential', 'linear']);
export type RetryStrategy = z.infer<typeof RetryStrategySchema>;

// ============================================================================
// ESQUEMAS BPMN
// ============================================================================

export const BpmnElementTypeSchema = z.enum(['startEvent', 'endEvent', 'task', 'gateway', 'subprocess']);
export type BpmnElementType = z.infer<typeof BpmnElementTypeSchema>;

export const BpmnElementSchema = z.object({
  id: z.string(),
  type: BpmnElementTypeSchema,
  name: z.string(),
  x: z.number(),
  y: z.number(),
  properties: z.record(z.any()).optional(),
  actions: z.array(z.string()).optional(),
  conditions: z.record(z.string()).optional(),
});

export const BpmnFlowSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  condition: z.string().optional(),
});

export const BpmnWorkflowSchema = z.object({
  elements: z.array(BpmnElementSchema),
  flows: z.array(BpmnFlowSchema),
  startElement: z.string(),
  endElements: z.array(z.string()),
});

// ============================================================================
// ESQUEMAS STATE MACHINE
// ============================================================================

export const StateTypeSchema = z.enum(['initial', 'intermediate', 'final', 'error']);
export type StateType = z.infer<typeof StateTypeSchema>;

export const StateSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: StateTypeSchema,
  actions: z.array(z.string()).optional(),
  timeout: z.number().optional(), // segundos
  properties: z.record(z.any()).optional(),
});

export const TransitionSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  event: z.string().optional(),
  condition: z.string().optional(),
});

export const StateMachineWorkflowSchema = z.object({
  states: z.array(StateSchema),
  transitions: z.array(TransitionSchema),
  initialState: z.string(),
  finalStates: z.array(z.string()),
});

// ============================================================================
// ESQUEMAS DE ACCIONES
// ============================================================================

export const ActionSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: ActionTypeSchema,
  config: z.record(z.any()),
  order: z.number(),
  timeout: z.number().optional(),
  retry: z.object({
    maxAttempts: z.number(),
    strategy: RetryStrategySchema,
    delay: z.number(),
  }).optional(),
});

// ============================================================================
// ESQUEMAS PRINCIPALES
// ============================================================================

export const WorkflowMetadataSchema = z.object({
  author: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  priority: z.number().optional(),
  timeout: z.number().optional(), // segundos
  description: z.string().optional(),
});

export const WorkflowSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: WorkflowTypeSchema,
  status: WorkflowStatusSchema,
  version: z.number(),
  definition: z.union([BpmnWorkflowSchema, StateMachineWorkflowSchema]),
  actions: z.array(ActionSchema),
  metadata: WorkflowMetadataSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const WorkflowInstanceSchema = z.object({
  id: z.string(),
  workflowId: z.string(),
  status: InstanceStatusSchema,
  context: z.record(z.any()),
  metadata: z.record(z.any()),
  currentElement: z.string().optional(),
  currentState: z.string().optional(),
  history: z.array(z.object({
    timestamp: z.date(),
    action: z.string(),
    message: z.string(),
    data: z.record(z.any()).optional(),
  })),
  startedAt: z.date(),
  completedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// ============================================================================
// INTERFACES
// ============================================================================

export interface IWorkflowEngine {
  createWorkflow(workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>): Promise<Workflow>;
  getWorkflow(id: string): Promise<Workflow | null>;
  updateWorkflow(id: string, updates: Partial<Workflow>): Promise<Workflow>;
  deleteWorkflow(id: string): Promise<void>;
  listWorkflows(filters?: WorkflowFilters): Promise<Workflow[]>;
  
  startWorkflow(workflowId: string, context?: Record<string, any>, metadata?: Record<string, any>): Promise<WorkflowInstance>;
  getInstance(instanceId: string): Promise<WorkflowInstance | null>;
  listInstances(filters?: InstanceFilters): Promise<WorkflowInstance[]>;
  
  pauseInstance(instanceId: string): Promise<void>;
  resumeInstance(instanceId: string): Promise<void>;
  cancelInstance(instanceId: string): Promise<void>;
  executeAction(instanceId: string, actionId: string): Promise<void>;
  
  getStats(): Promise<WorkflowStats>;
}

export interface WorkflowFilters {
  type?: WorkflowType;
  status?: WorkflowStatus;
  category?: string;
  tags?: string[];
}

export interface InstanceFilters {
  workflowId?: string;
  status?: InstanceStatus;
  userId?: string;
  orgId?: string;
  fromDate?: Date;
  toDate?: Date;
}

export interface WorkflowStats {
  totalWorkflows: number;
  totalInstances: number;
  workflowsByType: Record<WorkflowType, number>;
  instancesByStatus: Record<InstanceStatus, number>;
  averageExecutionTime: number;
  successRate: number;
  recentActivity: Array<{
    workflowId: string;
    workflowName: string;
    instanceId: string;
    action: string;
    timestamp: Date;
  }>;
}

// ============================================================================
// TIPOS DERIVADOS
// ============================================================================

export type Workflow = z.infer<typeof WorkflowSchema>;
export type WorkflowInstance = z.infer<typeof WorkflowInstanceSchema>;
export type Action = z.infer<typeof ActionSchema>;
export type BpmnWorkflow = z.infer<typeof BpmnWorkflowSchema>;
export type StateMachineWorkflow = z.infer<typeof StateMachineWorkflowSchema>;

// ============================================================================
// IMPLEMENTACIÓN DEL WORKFLOW ENGINE
// ============================================================================

class WorkflowEngineImpl implements IWorkflowEngine {
  private workflows: Map<string, Workflow> = new Map();
  private instances: Map<string, WorkflowInstance> = new Map();
  private executionQueue: Array<{ instanceId: string; actionId: string }> = [];

  constructor() {
    this.startExecutionLoop();
  }

  // ============================================================================
  // GESTIÓN DE WORKFLOWS
  // ============================================================================

  async createWorkflow(workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>): Promise<Workflow> {
    const id = `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    
    const newWorkflow: Workflow = {
      ...workflow,
      id,
      createdAt: now,
      updatedAt: now,
    };

    this.workflows.set(id, newWorkflow);
    return newWorkflow;
  }

  async getWorkflow(id: string): Promise<Workflow | null> {
    return this.workflows.get(id) || null;
  }

  async updateWorkflow(id: string, updates: Partial<Workflow>): Promise<Workflow> {
    const workflow = this.workflows.get(id);
    if (!workflow) {
      throw new Error(`Workflow ${id} not found`);
    }

    const updatedWorkflow: Workflow = {
      ...workflow,
      ...updates,
      updatedAt: new Date(),
    };

    this.workflows.set(id, updatedWorkflow);
    return updatedWorkflow;
  }

  async deleteWorkflow(id: string): Promise<void> {
    const workflow = this.workflows.get(id);
    if (!workflow) {
      throw new Error(`Workflow ${id} not found`);
    }

    // Verificar que no hay instancias activas
    const activeInstances = Array.from(this.instances.values()).filter(
      instance => instance.workflowId === id && instance.status === 'running'
    );

    if (activeInstances.length > 0) {
      throw new Error(`Cannot delete workflow with ${activeInstances.length} active instances`);
    }

    this.workflows.delete(id);
  }

  async listWorkflows(filters?: WorkflowFilters): Promise<Workflow[]> {
    let workflows = Array.from(this.workflows.values());

    if (filters?.type) {
      workflows = workflows.filter(w => w.type === filters.type);
    }

    if (filters?.status) {
      workflows = workflows.filter(w => w.status === filters.status);
    }

    if (filters?.category) {
      workflows = workflows.filter(w => w.metadata.category === filters.category);
    }

    if (filters?.tags && filters.tags.length > 0) {
      workflows = workflows.filter(w => 
        w.metadata.tags?.some(tag => filters.tags!.includes(tag))
      );
    }

    return workflows.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  // ============================================================================
  // GESTIÓN DE INSTANCIAS
  // ============================================================================

  async startWorkflow(workflowId: string, context: Record<string, any> = {}, metadata: Record<string, any> = {}): Promise<WorkflowInstance> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    if (workflow.status !== 'active') {
      throw new Error(`Workflow ${workflowId} is not active`);
    }

    const instanceId = `inst_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const instance: WorkflowInstance = {
      id: instanceId,
      workflowId,
      status: 'running',
      context,
      metadata,
      history: [{
        timestamp: now,
        action: 'workflow_started',
        message: `Workflow ${workflow.name} started`,
        data: { workflowId, context, metadata }
      }],
      startedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    // Determinar elemento inicial
    if (workflow.type === 'bpmn') {
      const bpmnDef = workflow.definition as BpmnWorkflow;
      instance.currentElement = bpmnDef.startElement;
    } else {
      const stateDef = workflow.definition as StateMachineWorkflow;
      instance.currentState = stateDef.initialState;
    }

    this.instances.set(instanceId, instance);

    // Ejecutar primera acción
    await this.executeNextAction(instanceId);

    return instance;
  }

  async getInstance(instanceId: string): Promise<WorkflowInstance | null> {
    return this.instances.get(instanceId) || null;
  }

  async listInstances(filters?: InstanceFilters): Promise<WorkflowInstance[]> {
    let instances = Array.from(this.instances.values());

    if (filters?.workflowId) {
      instances = instances.filter(i => i.workflowId === filters.workflowId);
    }

    if (filters?.status) {
      instances = instances.filter(i => i.status === filters.status);
    }

    if (filters?.userId) {
      instances = instances.filter(i => i.metadata.userId === filters.userId);
    }

    if (filters?.orgId) {
      instances = instances.filter(i => i.metadata.orgId === filters.orgId);
    }

    if (filters?.fromDate) {
      instances = instances.filter(i => i.createdAt >= filters.fromDate!);
    }

    if (filters?.toDate) {
      instances = instances.filter(i => i.createdAt <= filters.toDate!);
    }

    return instances.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async pauseInstance(instanceId: string): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`Instance ${instanceId} not found`);
    }

    if (instance.status !== 'running') {
      throw new Error(`Instance ${instanceId} is not running`);
    }

    instance.status = 'paused';
    instance.updatedAt = new Date();
    instance.history.push({
      timestamp: new Date(),
      action: 'instance_paused',
      message: 'Instance paused by user',
    });
  }

  async resumeInstance(instanceId: string): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`Instance ${instanceId} not found`);
    }

    if (instance.status !== 'paused') {
      throw new Error(`Instance ${instanceId} is not paused`);
    }

    instance.status = 'running';
    instance.updatedAt = new Date();
    instance.history.push({
      timestamp: new Date(),
      action: 'instance_resumed',
      message: 'Instance resumed by user',
    });

    // Continuar ejecución
    await this.executeNextAction(instanceId);
  }

  async cancelInstance(instanceId: string): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`Instance ${instanceId} not found`);
    }

    if (instance.status === 'completed' || instance.status === 'failed') {
      throw new Error(`Instance ${instanceId} is already finished`);
    }

    instance.status = 'cancelled';
    instance.updatedAt = new Date();
    instance.history.push({
      timestamp: new Date(),
      action: 'instance_cancelled',
      message: 'Instance cancelled by user',
    });
  }

  async executeAction(instanceId: string, actionId: string): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`Instance ${instanceId} not found`);
    }

    const workflow = this.workflows.get(instance.workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${instance.workflowId} not found`);
    }

    const action = workflow.actions.find(a => a.id === actionId);
    if (!action) {
      throw new Error(`Action ${actionId} not found in workflow ${instance.workflowId}`);
    }

    await this.executeActionInternal(instance, action);
  }

  // ============================================================================
  // EJECUCIÓN INTERNA
  // ============================================================================

  private async executeNextAction(instanceId: string): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (!instance || instance.status !== 'running') {
      return;
    }

    const workflow = this.workflows.get(instance.workflowId);
    if (!workflow) {
      return;
    }

    // Encontrar acciones del elemento/estado actual
    let currentActions: string[] = [];

    if (workflow.type === 'bpmn') {
      const bpmnDef = workflow.definition as BpmnWorkflow;
      const currentElement = bpmnDef.elements.find(e => e.id === instance.currentElement);
      if (currentElement?.actions) {
        currentActions = currentElement.actions;
      }
    } else {
      const stateDef = workflow.definition as StateMachineWorkflow;
      const currentState = stateDef.states.find(s => s.id === instance.currentState);
      if (currentState?.actions) {
        currentActions = currentState.actions;
      }
    }

    // Ejecutar acciones en orden
    for (const actionId of currentActions) {
      const action = workflow.actions.find(a => a.id === actionId);
      if (action) {
        await this.executeActionInternal(instance, action);
      }
    }

    // Determinar siguiente elemento/estado
    await this.advanceWorkflow(instance, workflow);
  }

  private async executeActionInternal(instance: WorkflowInstance, action: Action): Promise<void> {
    try {
      instance.history.push({
        timestamp: new Date(),
        action: 'action_started',
        message: `Executing action: ${action.name}`,
        data: { actionId: action.id, actionType: action.type }
      });

      let result: any;

      switch (action.type) {
        case 'function':
          result = await this.executeFunctionAction(action, instance.context);
          break;
        case 'http':
          result = await this.executeHttpAction(action, instance.context);
          break;
        case 'delay':
          result = await this.executeDelayAction(action);
          break;
        case 'condition':
          result = await this.executeConditionAction(action, instance.context);
          break;
        case 'notification':
          result = await this.executeNotificationAction(action, instance.context);
          break;
        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }

      instance.history.push({
        timestamp: new Date(),
        action: 'action_completed',
        message: `Action ${action.name} completed successfully`,
        data: { actionId: action.id, result }
      });

      // Actualizar contexto con resultado
      if (result) {
        instance.context[`action_${action.id}_result`] = result;
      }

    } catch (error) {
      instance.history.push({
        timestamp: new Date(),
        action: 'action_failed',
        message: `Action ${action.name} failed: ${error instanceof Error ? error.message : String(error)}`,
        data: { actionId: action.id, error: error instanceof Error ? error.message : String(error) }
      });

      // Manejar retry si está configurado
      if (action.retry) {
        await this.handleRetry(instance, action);
      } else {
        instance.status = 'failed';
        instance.updatedAt = new Date();
      }
    }
  }

  private async executeFunctionAction(action: Action, context: Record<string, any>): Promise<any> {
    const { functionName, parameters } = action.config;
    
    // Simular ejecución de función
    console.log(`Executing function: ${functionName} with parameters:`, parameters);
    
    // Aquí se ejecutaría la función real
    return { success: true, functionName, parameters };
  }

  private async executeHttpAction(action: Action, context: Record<string, any>): Promise<any> {
    const { url, method, headers, body } = action.config;
    
    // Simular llamada HTTP
    console.log(`Making HTTP ${method} request to: ${url}`);
    
    // Aquí se haría la llamada HTTP real
    return { success: true, status: 200, url, method };
  }

  private async executeDelayAction(action: Action): Promise<any> {
    const { duration } = action.config;
    
    console.log(`Delaying for ${duration}ms`);
    await new Promise(resolve => setTimeout(resolve, duration));
    
    return { success: true, duration };
  }

  private async executeConditionAction(action: Action, context: Record<string, any>): Promise<any> {
    const { expression } = action.config;
    
    // Evaluar condición
    const result = this.evaluateCondition(expression, context);
    
    return { success: true, condition: expression, result };
  }

  private async executeNotificationAction(action: Action, context: Record<string, any>): Promise<any> {
    const { type, recipient, message, template } = action.config;
    
    console.log(`Sending ${type} notification to: ${recipient}`);
    
    // Aquí se enviaría la notificación real
    return { success: true, type, recipient, message };
  }

  private evaluateCondition(expression: string, context: Record<string, any>): boolean {
    try {
      // Evaluación simple de condiciones
      // En producción usar una librería como jsonata o similar
      const safeExpression = expression
        .replace(/[^a-zA-Z0-9_$.\s()=!<>]/g, '')
        .replace(/\b\w+\b/g, (match) => {
          return context[match] !== undefined ? JSON.stringify(context[match]) : 'false';
        });
      
      return eval(safeExpression) === true;
    } catch (error) {
      console.error('Error evaluating condition:', expression, error);
      return false;
    }
  }

  private async handleRetry(instance: WorkflowInstance, action: Action): Promise<void> {
    const retryCount = instance.context[`retry_${action.id}`] || 0;
    
    if (retryCount < action.retry!.maxAttempts) {
      instance.context[`retry_${action.id}`] = retryCount + 1;
      
      const delay = this.calculateRetryDelay(action.retry!, retryCount);
      
      instance.history.push({
        timestamp: new Date(),
        action: 'action_retry',
        message: `Retrying action ${action.name} (attempt ${retryCount + 1}/${action.retry!.maxAttempts})`,
        data: { actionId: action.id, retryCount: retryCount + 1, delay }
      });

      setTimeout(async () => {
        await this.executeActionInternal(instance, action);
      }, delay);
    } else {
      instance.status = 'failed';
      instance.updatedAt = new Date();
      instance.history.push({
        timestamp: new Date(),
        action: 'action_failed',
        message: `Action ${action.name} failed after ${action.retry!.maxAttempts} retries`,
        data: { actionId: action.id, maxAttempts: action.retry!.maxAttempts }
      });
    }
  }

  private calculateRetryDelay(retry: NonNullable<Action['retry']>, attempt: number): number {
    switch (retry.strategy) {
      case 'fixed':
        return retry.delay;
      case 'exponential':
        return retry.delay * Math.pow(2, attempt);
      case 'linear':
        return retry.delay * (attempt + 1);
      default:
        return retry.delay;
    }
  }

  private async advanceWorkflow(instance: WorkflowInstance, workflow: Workflow): Promise<void> {
    if (workflow.type === 'bpmn') {
      await this.advanceBpmnWorkflow(instance, workflow);
    } else {
      await this.advanceStateMachineWorkflow(instance, workflow);
    }
  }

  private async advanceBpmnWorkflow(instance: WorkflowInstance, workflow: Workflow): Promise<void> {
    const bpmnDef = workflow.definition as BpmnWorkflow;
    const currentElement = bpmnDef.elements.find(e => e.id === instance.currentElement);
    
    if (!currentElement) {
      instance.status = 'failed';
      instance.updatedAt = new Date();
      return;
    }

    // Si es un endEvent, terminar
    if (currentElement.type === 'endEvent') {
      instance.status = 'completed';
      instance.completedAt = new Date();
      instance.updatedAt = new Date();
      instance.history.push({
        timestamp: new Date(),
        action: 'workflow_completed',
        message: 'Workflow completed successfully',
      });
      return;
    }

    // Encontrar siguiente elemento
    const outgoingFlows = bpmnDef.flows.filter(f => f.source === instance.currentElement);
    
    if (outgoingFlows.length === 0) {
      instance.status = 'failed';
      instance.updatedAt = new Date();
      instance.history.push({
        timestamp: new Date(),
        action: 'workflow_failed',
        message: 'No outgoing flows found',
      });
      return;
    }

    // Si hay múltiples flujos, evaluar condiciones
    let nextFlow = outgoingFlows[0];
    if (outgoingFlows.length > 1) {
      for (const flow of outgoingFlows) {
        if (flow.condition && this.evaluateCondition(flow.condition, instance.context)) {
          nextFlow = flow;
          break;
        }
      }
    }

    instance.currentElement = nextFlow.target;
    instance.updatedAt = new Date();

    // Continuar ejecución
    await this.executeNextAction(instance.id);
  }

  private async advanceStateMachineWorkflow(instance: WorkflowInstance, workflow: Workflow): Promise<void> {
    const stateDef = workflow.definition as StateMachineWorkflow;
    const currentState = stateDef.states.find(s => s.id === instance.currentState);
    
    if (!currentState) {
      instance.status = 'failed';
      instance.updatedAt = new Date();
      return;
    }

    // Si es un estado final, terminar
    if (currentState.type === 'final') {
      instance.status = 'completed';
      instance.completedAt = new Date();
      instance.updatedAt = new Date();
      instance.history.push({
        timestamp: new Date(),
        action: 'workflow_completed',
        message: 'Workflow completed successfully',
      });
      return;
    }

    // Encontrar transiciones disponibles
    const availableTransitions = stateDef.transitions.filter(t => t.from === instance.currentState);
    
    if (availableTransitions.length === 0) {
      // Si no hay transiciones, verificar timeout
      if (currentState.timeout) {
        const timeInState = Date.now() - instance.updatedAt.getTime();
        if (timeInState > currentState.timeout * 1000) {
          instance.status = 'failed';
          instance.updatedAt = new Date();
          instance.history.push({
            timestamp: new Date(),
            action: 'state_timeout',
            message: `State ${currentState.name} timed out after ${currentState.timeout}s`,
          });
          return;
        }
      }
      return; // Esperar evento o timeout
    }

    // Evaluar transiciones
    for (const transition of availableTransitions) {
      if (!transition.condition || this.evaluateCondition(transition.condition, instance.context)) {
        instance.currentState = transition.to;
        instance.updatedAt = new Date();
        instance.history.push({
          timestamp: new Date(),
          action: 'state_transition',
          message: `Transitioned from ${currentState.name} to ${transition.to}`,
          data: { from: currentState.id, to: transition.to, transitionId: transition.id }
        });

        // Continuar ejecución
        await this.executeNextAction(instance.id);
        return;
      }
    }
  }

  // ============================================================================
  // LOOP DE EJECUCIÓN
  // ============================================================================

  private startExecutionLoop(): void {
    setInterval(() => {
      this.processExecutionQueue();
    }, 1000); // Procesar cada segundo
  }

  private async processExecutionQueue(): Promise<void> {
    const queue = [...this.executionQueue];
    this.executionQueue = [];

    for (const item of queue) {
      try {
        await this.executeAction(item.instanceId, item.actionId);
      } catch (error) {
        console.error('Error processing execution queue item:', error);
      }
    }
  }

  // ============================================================================
  // ESTADÍSTICAS
  // ============================================================================

  async getStats(): Promise<WorkflowStats> {
    const workflows = Array.from(this.workflows.values());
    const instances = Array.from(this.instances.values());

    const workflowsByType: Record<WorkflowType, number> = {
      bpmn: 0,
      state_machine: 0,
    };

    const instancesByStatus: Record<InstanceStatus, number> = {
      running: 0,
      completed: 0,
      failed: 0,
      paused: 0,
      cancelled: 0,
    };

    let totalExecutionTime = 0;
    let completedCount = 0;

    // Contar workflows por tipo
    for (const workflow of workflows) {
      workflowsByType[workflow.type]++;
    }

    // Contar instancias por status y calcular tiempos
    for (const instance of instances) {
      instancesByStatus[instance.status]++;

      if (instance.status === 'completed' && instance.completedAt) {
        const executionTime = instance.completedAt.getTime() - instance.startedAt.getTime();
        totalExecutionTime += executionTime;
        completedCount++;
      }
    }

    // Obtener actividad reciente
    const recentActivity = instances
      .flatMap(instance => 
        instance.history
          .filter(h => h.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000)) // Últimas 24h
          .map(h => ({
            workflowId: instance.workflowId,
            workflowName: workflows.find(w => w.id === instance.workflowId)?.name || 'Unknown',
            instanceId: instance.id,
            action: h.action,
            timestamp: h.timestamp,
          }))
      )
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);

    return {
      totalWorkflows: workflows.length,
      totalInstances: instances.length,
      workflowsByType,
      instancesByStatus,
      averageExecutionTime: completedCount > 0 ? totalExecutionTime / completedCount : 0,
      successRate: instances.length > 0 ? (instancesByStatus.completed / instances.length) * 100 : 0,
      recentActivity,
    };
  }
}

// Instancia global
export const workflowEngine = new WorkflowEngineImpl();
