import { logger } from './logger.js';

export interface WorkflowDefinition {
  id: string;
  name: string;
  version: string;
  description: string;
  type: 'bpmn' | 'state-machine';
  definition: BPMNDefinition | StateMachineDefinition;
  metadata: WorkflowMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowMetadata {
  author: string;
  category: string;
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  timeout: number;
  retryPolicy: RetryPolicy;
  notifications: NotificationConfig[];
}

export interface RetryPolicy {
  maxRetries: number;
  backoffStrategy: 'fixed' | 'exponential' | 'linear';
  initialDelay: number;
  maxDelay: number;
}

export interface NotificationConfig {
  type: 'email' | 'webhook' | 'slack' | 'sms';
  trigger: 'start' | 'complete' | 'error' | 'timeout';
  config: Record<string, any>;
}

export interface BPMNDefinition {
  elements: BPMNElement[];
  flows: BPMNFlow[];
  startEvent: string;
  endEvents: string[];
}

export interface BPMNElement {
  id: string;
  type: 'startEvent' | 'endEvent' | 'task' | 'gateway' | 'subprocess';
  name: string;
  position: { x: number; y: number };
  properties: Record<string, any>;
  conditions?: string;
  actions?: string[];
}

export interface BPMNFlow {
  id: string;
  sourceId: string;
  targetId: string;
  condition?: string;
  properties: Record<string, any>;
}

export interface StateMachineDefinition {
  states: StateDefinition[];
  transitions: StateTransition[];
  initialState: string;
  finalStates: string[];
}

export interface StateDefinition {
  id: string;
  name: string;
  type: 'initial' | 'intermediate' | 'final' | 'error';
  actions: StateAction[];
  timeout?: number;
  properties: Record<string, any>;
}

export interface StateAction {
  type: 'function' | 'http' | 'delay' | 'condition' | 'notification';
  name: string;
  config: Record<string, any>;
  order: number;
}

export interface StateTransition {
  id: string;
  fromState: string;
  toState: string;
  event: string;
  condition?: string;
  actions: StateAction[];
  properties: Record<string, any>;
}

export interface WorkflowInstance {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed' | 'paused' | 'cancelled';
  currentState: string;
  context: Record<string, any>;
  history: WorkflowHistoryItem[];
  metadata: WorkflowInstanceMetadata;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface WorkflowHistoryItem {
  id: string;
  timestamp: Date;
  type: 'state_change' | 'action_executed' | 'error' | 'timeout' | 'user_action';
  state?: string;
  action?: string;
  data: Record<string, any>;
  message: string;
}

export interface WorkflowInstanceMetadata {
  userId: string;
  organizationId: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
  customData: Record<string, any>;
}

export interface WorkflowEngine {
  createWorkflow(definition: Omit<WorkflowDefinition, 'id' | 'createdAt' | 'updatedAt'>): string;
  getWorkflow(workflowId: string): WorkflowDefinition | undefined;
  getAllWorkflows(): WorkflowDefinition[];
  updateWorkflow(workflowId: string, updates: Partial<WorkflowDefinition>): boolean;
  deleteWorkflow(workflowId: string): boolean;
  startWorkflow(workflowId: string, context: Record<string, any>, metadata: WorkflowInstanceMetadata): string;
  getWorkflowInstance(instanceId: string): WorkflowInstance | undefined;
  getAllInstances(filters?: WorkflowInstanceFilters): WorkflowInstance[];
  pauseWorkflow(instanceId: string): boolean;
  resumeWorkflow(instanceId: string): boolean;
  cancelWorkflow(instanceId: string): boolean;
  executeAction(instanceId: string, actionName: string, data?: Record<string, any>): boolean;
  getWorkflowStats(): WorkflowStats;
}

export interface WorkflowInstanceFilters {
  workflowId?: string;
  status?: WorkflowInstance['status'];
  userId?: string;
  organizationId?: string;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface WorkflowStats {
  totalWorkflows: number;
  totalInstances: number;
  runningInstances: number;
  completedInstances: number;
  failedInstances: number;
  averageExecutionTime: number;
  workflowsByType: Record<string, number>;
  instancesByStatus: Record<string, number>;
}

export class WorkflowEngineImpl implements WorkflowEngine {
  private workflows: Map<string, WorkflowDefinition> = new Map();
  private instances: Map<string, WorkflowInstance> = new Map();
  private executionQueue: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    logger.info('Workflow Engine initialized');
  }

  createWorkflow(definition: Omit<WorkflowDefinition, 'id' | 'createdAt' | 'updatedAt'>): string {
    const id = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    
    const workflow: WorkflowDefinition = {
      ...definition,
      id,
      createdAt: now,
      updatedAt: now,
    };

    this.workflows.set(id, workflow);

    logger.info('Workflow created', {
      workflowId: id,
      workflowName: definition.name,
      workflowType: definition.type,
    });

    return id;
  }

  getWorkflow(workflowId: string): WorkflowDefinition | undefined {
    return this.workflows.get(workflowId);
  }

  getAllWorkflows(): WorkflowDefinition[] {
    return Array.from(this.workflows.values());
  }

  updateWorkflow(workflowId: string, updates: Partial<WorkflowDefinition>): boolean {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      return false;
    }

    const updatedWorkflow: WorkflowDefinition = {
      ...workflow,
      ...updates,
      updatedAt: new Date(),
    };

    this.workflows.set(workflowId, updatedWorkflow);

    logger.info('Workflow updated', {
      workflowId,
      workflowName: updatedWorkflow.name,
    });

    return true;
  }

  deleteWorkflow(workflowId: string): boolean {
    const deleted = this.workflows.delete(workflowId);
    if (deleted) {
      logger.info('Workflow deleted', { workflowId });
    }
    return deleted;
  }

  startWorkflow(workflowId: string, context: Record<string, any>, metadata: WorkflowInstanceMetadata): string {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const instanceId = `instance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    let currentState: string;
    if (workflow.type === 'bpmn') {
      const bpmnDef = workflow.definition as BPMNDefinition;
      currentState = bpmnDef.startEvent;
    } else {
      const stateDef = workflow.definition as StateMachineDefinition;
      currentState = stateDef.initialState;
    }

    const instance: WorkflowInstance = {
      id: instanceId,
      workflowId,
      status: 'running',
      currentState,
      context,
      history: [{
        id: `history_${Date.now()}`,
        timestamp: now,
        type: 'state_change',
        state: currentState,
        data: { context },
        message: 'Workflow started',
      }],
      metadata,
      createdAt: now,
      updatedAt: now,
      startedAt: now,
    };

    this.instances.set(instanceId, instance);

    // Iniciar ejecución
    this.executeWorkflow(instanceId);

    logger.info('Workflow instance started', {
      instanceId,
      workflowId,
      workflowName: workflow.name,
      currentState,
    });

    return instanceId;
  }

  getWorkflowInstance(instanceId: string): WorkflowInstance | undefined {
    return this.instances.get(instanceId);
  }

  getAllInstances(filters?: WorkflowInstanceFilters): WorkflowInstance[] {
    let instances = Array.from(this.instances.values());

    if (filters) {
      if (filters.workflowId) {
        instances = instances.filter(i => i.workflowId === filters.workflowId);
      }
      if (filters.status) {
        instances = instances.filter(i => i.status === filters.status);
      }
      if (filters.userId) {
        instances = instances.filter(i => i.metadata.userId === filters.userId);
      }
      if (filters.organizationId) {
        instances = instances.filter(i => i.metadata.organizationId === filters.organizationId);
      }
      if (filters.createdAfter) {
        instances = instances.filter(i => i.createdAt >= filters.createdAfter!);
      }
      if (filters.createdBefore) {
        instances = instances.filter(i => i.createdAt <= filters.createdBefore!);
      }
    }

    return instances;
  }

  pauseWorkflow(instanceId: string): boolean {
    const instance = this.instances.get(instanceId);
    if (!instance || instance.status !== 'running') {
      return false;
    }

    instance.status = 'paused';
    instance.updatedAt = new Date();
    instance.history.push({
      id: `history_${Date.now()}`,
      timestamp: new Date(),
      type: 'user_action',
      data: {},
      message: 'Workflow paused by user',
    });

    // Cancelar ejecución programada
    const timeout = this.executionQueue.get(instanceId);
    if (timeout) {
      clearTimeout(timeout);
      this.executionQueue.delete(instanceId);
    }

    logger.info('Workflow paused', { instanceId });
    return true;
  }

  resumeWorkflow(instanceId: string): boolean {
    const instance = this.instances.get(instanceId);
    if (!instance || instance.status !== 'paused') {
      return false;
    }

    instance.status = 'running';
    instance.updatedAt = new Date();
    instance.history.push({
      id: `history_${Date.now()}`,
      timestamp: new Date(),
      type: 'user_action',
      data: {},
      message: 'Workflow resumed by user',
    });

    // Reanudar ejecución
    this.executeWorkflow(instanceId);

    logger.info('Workflow resumed', { instanceId });
    return true;
  }

  cancelWorkflow(instanceId: string): boolean {
    const instance = this.instances.get(instanceId);
    if (!instance || instance.status === 'completed' || instance.status === 'cancelled') {
      return false;
    }

    instance.status = 'cancelled';
    instance.updatedAt = new Date();
    instance.history.push({
      id: `history_${Date.now()}`,
      timestamp: new Date(),
      type: 'user_action',
      data: {},
      message: 'Workflow cancelled by user',
    });

    // Cancelar ejecución programada
    const timeout = this.executionQueue.get(instanceId);
    if (timeout) {
      clearTimeout(timeout);
      this.executionQueue.delete(instanceId);
    }

    logger.info('Workflow cancelled', { instanceId });
    return true;
  }

  executeAction(instanceId: string, actionName: string, data?: Record<string, any>): boolean {
    const instance = this.instances.get(instanceId);
    if (!instance || instance.status !== 'running') {
      return false;
    }

    const workflow = this.workflows.get(instance.workflowId);
    if (!workflow) {
      return false;
    }

    try {
      // Ejecutar acción
      const result = this.executeActionByName(actionName, data || {}, instance.context);
      
      // Actualizar contexto
      instance.context = { ...instance.context, ...result };
      instance.updatedAt = new Date();
      instance.history.push({
        id: `history_${Date.now()}`,
        timestamp: new Date(),
        type: 'action_executed',
        action: actionName,
        data: { input: data, output: result },
        message: `Action '${actionName}' executed successfully`,
      });

      logger.info('Action executed', {
        instanceId,
        actionName,
        result,
      });

      return true;
    } catch (error) {
      instance.history.push({
        id: `history_${Date.now()}`,
        timestamp: new Date(),
        type: 'error',
        action: actionName,
        data: { input: data, error: (error as Error).message },
        message: `Action '${actionName}' failed: ${(error as Error).message}`,
      });

      logger.error('Action execution failed', {
        instanceId,
        actionName,
        error: (error as Error).message,
      });

      return false;
    }
  }

  getWorkflowStats(): WorkflowStats {
    const instances = Array.from(this.instances.values());
    const workflows = Array.from(this.workflows.values());

    const workflowsByType: Record<string, number> = {};
    const instancesByStatus: Record<string, number> = {};

    // Contar workflows por tipo
    for (const workflow of workflows) {
      workflowsByType[workflow.type] = (workflowsByType[workflow.type] || 0) + 1;
    }

    // Contar instancias por status
    for (const instance of instances) {
      instancesByStatus[instance.status] = (instancesByStatus[instance.status] || 0) + 1;
    }

    // Calcular tiempo promedio de ejecución
    const completedInstances = instances.filter(i => i.status === 'completed' && i.completedAt);
    const totalExecutionTime = completedInstances.reduce((sum, instance) => {
      return sum + (instance.completedAt!.getTime() - instance.startedAt!.getTime());
    }, 0);
    const averageExecutionTime = completedInstances.length > 0 ? totalExecutionTime / completedInstances.length : 0;

    return {
      totalWorkflows: workflows.length,
      totalInstances: instances.length,
      runningInstances: instancesByStatus['running'] || 0,
      completedInstances: instancesByStatus['completed'] || 0,
      failedInstances: instancesByStatus['failed'] || 0,
      averageExecutionTime,
      workflowsByType,
      instancesByStatus,
    };
  }

  private executeWorkflow(instanceId: string): void {
    const instance = this.instances.get(instanceId);
    if (!instance || instance.status !== 'running') {
      return;
    }

    const workflow = this.workflows.get(instance.workflowId);
    if (!workflow) {
      return;
    }

    try {
      if (workflow.type === 'bpmn') {
        this.executeBPMNWorkflow(instance, workflow);
      } else {
        this.executeStateMachineWorkflow(instance, workflow);
      }
    } catch (error) {
      instance.status = 'failed';
      instance.updatedAt = new Date();
      instance.history.push({
        id: `history_${Date.now()}`,
        timestamp: new Date(),
        type: 'error',
        data: { error: (error as Error).message },
        message: `Workflow execution failed: ${(error as Error).message}`,
      });

      logger.error('Workflow execution failed', {
        instanceId,
        error: (error as Error).message,
      });
    }
  }

  private executeBPMNWorkflow(instance: WorkflowInstance, workflow: WorkflowDefinition): void {
    const bpmnDef = workflow.definition as BPMNDefinition;
    const currentElement = bpmnDef.elements.find(e => e.id === instance.currentState);
    
    if (!currentElement) {
      throw new Error(`BPMN element not found: ${instance.currentState}`);
    }

    switch (currentElement.type) {
      case 'startEvent':
        this.executeStartEvent(instance, currentElement);
        break;
      case 'task':
        this.executeTask(instance, currentElement);
        break;
      case 'gateway':
        this.executeGateway(instance, currentElement, bpmnDef);
        break;
      case 'endEvent':
        this.executeEndEvent(instance, currentElement);
        break;
      case 'subprocess':
        this.executeSubprocess(instance, currentElement);
        break;
    }
  }

  private executeStateMachineWorkflow(instance: WorkflowInstance, workflow: WorkflowDefinition): void {
    const stateDef = workflow.definition as StateMachineDefinition;
    const currentState = stateDef.states.find(s => s.id === instance.currentState);
    
    if (!currentState) {
      throw new Error(`State not found: ${instance.currentState}`);
    }

    // Ejecutar acciones del estado
    for (const action of currentState.actions) {
      try {
        const result = this.executeActionByName(action.name, action.config, instance.context);
        instance.context = { ...instance.context, ...result };
      } catch (error) {
        logger.error('State action failed', {
          instanceId: instance.id,
          stateId: currentState.id,
          actionName: action.name,
          error: (error as Error).message,
        });
      }
    }

    // Programar siguiente ejecución si hay timeout
    if (currentState.timeout) {
      const timeout = setTimeout(() => {
        this.executeWorkflow(instance.id);
      }, currentState.timeout);
      this.executionQueue.set(instance.id, timeout);
    }
  }

  private executeStartEvent(instance: WorkflowInstance, element: BPMNElement): void {
    // Ejecutar acciones del start event
    if (element.actions) {
      for (const action of element.actions) {
        this.executeActionByName(action, {}, instance.context);
      }
    }

    // Encontrar siguiente elemento
    const bpmnDef = (this.workflows.get(instance.workflowId)!.definition as BPMNDefinition);
    const outgoingFlows = bpmnDef.flows.filter(f => f.sourceId === element.id);
    
    if (outgoingFlows.length > 0) {
      const nextFlow = outgoingFlows[0]; // Tomar el primer flujo por defecto
      instance.currentState = nextFlow.targetId;
      instance.updatedAt = new Date();
      
      // Continuar ejecución
      setTimeout(() => this.executeWorkflow(instance.id), 100);
    }
  }

  private executeTask(instance: WorkflowInstance, element: BPMNElement): void {
    // Ejecutar acciones de la tarea
    if (element.actions) {
      for (const action of element.actions) {
        this.executeActionByName(action, element.properties, instance.context);
      }
    }

    // Encontrar siguiente elemento
    const bpmnDef = (this.workflows.get(instance.workflowId)!.definition as BPMNDefinition);
    const outgoingFlows = bpmnDef.flows.filter(f => f.sourceId === element.id);
    
    if (outgoingFlows.length > 0) {
      const nextFlow = outgoingFlows[0];
      instance.currentState = nextFlow.targetId;
      instance.updatedAt = new Date();
      
      // Continuar ejecución
      setTimeout(() => this.executeWorkflow(instance.id), 100);
    }
  }

  private executeGateway(instance: WorkflowInstance, element: BPMNElement, bpmnDef: BPMNDefinition): void {
    const outgoingFlows = bpmnDef.flows.filter(f => f.sourceId === element.id);
    
    // Evaluar condiciones para encontrar el flujo correcto
    let selectedFlow = outgoingFlows[0]; // Por defecto, el primero
    
    for (const flow of outgoingFlows) {
      if (flow.condition) {
        try {
          const conditionResult = this.evaluateCondition(flow.condition, instance.context);
          if (conditionResult) {
            selectedFlow = flow;
            break;
          }
        } catch (error) {
          logger.warn('Condition evaluation failed', {
            instanceId: instance.id,
            flowId: flow.id,
            condition: flow.condition,
            error: (error as Error).message,
          });
        }
      }
    }

    instance.currentState = selectedFlow.targetId;
    instance.updatedAt = new Date();
    
    // Continuar ejecución
    setTimeout(() => this.executeWorkflow(instance.id), 100);
  }

  private executeEndEvent(instance: WorkflowInstance, element: BPMNElement): void {
    // Ejecutar acciones del end event
    if (element.actions) {
      for (const action of element.actions) {
        this.executeActionByName(action, {}, instance.context);
      }
    }

    instance.status = 'completed';
    instance.updatedAt = new Date();
    instance.completedAt = new Date();
    instance.history.push({
      id: `history_${Date.now()}`,
      timestamp: new Date(),
      type: 'state_change',
      state: instance.currentState,
      data: {},
      message: 'Workflow completed successfully',
    });

    logger.info('Workflow completed', { instanceId: instance.id });
  }

  private executeSubprocess(instance: WorkflowInstance, element: BPMNElement): void {
    // Implementación simplificada de subprocess
    // En una implementación real, esto crearía una nueva instancia de workflow
    
    logger.info('Subprocess executed', {
      instanceId: instance.id,
      subprocessId: element.id,
    });

    // Continuar con el flujo normal
    const bpmnDef = (this.workflows.get(instance.workflowId)!.definition as BPMNDefinition);
    const outgoingFlows = bpmnDef.flows.filter(f => f.sourceId === element.id);
    
    if (outgoingFlows.length > 0) {
      const nextFlow = outgoingFlows[0];
      instance.currentState = nextFlow.targetId;
      instance.updatedAt = new Date();
      
      setTimeout(() => this.executeWorkflow(instance.id), 100);
    }
  }

  private executeActionByName(actionName: string, config: Record<string, any>, context: Record<string, any>): Record<string, any> {
    // Implementación simplificada de acciones
    // En una implementación real, esto ejecutaría funciones reales
    
    switch (actionName) {
      case 'sendEmail':
        logger.info('Email action executed', { config, context });
        return { emailSent: true, timestamp: new Date().toISOString() };
      
      case 'httpRequest':
        logger.info('HTTP request action executed', { config, context });
        return { httpResponse: { status: 200, data: 'success' } };
      
      case 'delay':
        const delayMs = config.delay || 1000;
        logger.info('Delay action executed', { delayMs });
        return { delayed: true, delayMs };
      
      case 'condition':
        const condition = config.condition || 'true';
        const result = this.evaluateCondition(condition, context);
        return { conditionResult: result };
      
      case 'notification':
        logger.info('Notification action executed', { config, context });
        return { notificationSent: true };
      
      default:
        logger.warn('Unknown action', { actionName, config });
        return { actionExecuted: true, actionName };
    }
  }

  private evaluateCondition(condition: string, context: Record<string, any>): boolean {
    // Implementación simplificada de evaluación de condiciones
    // En una implementación real, usaría un motor de expresiones más robusto
    
    try {
      // Reemplazar variables del contexto
      let evaluatedCondition = condition;
      for (const [key, value] of Object.entries(context)) {
        const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
        evaluatedCondition = evaluatedCondition.replace(regex, JSON.stringify(value));
      }
      
      // Evaluar la condición
      return eval(evaluatedCondition);
    } catch (error) {
      logger.error('Condition evaluation failed', {
        condition,
        context,
        error: (error as Error).message,
      });
      return false;
    }
  }
}

// Instancia global
export const workflowEngine = new WorkflowEngineImpl();
