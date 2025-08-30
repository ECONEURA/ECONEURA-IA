export interface WorkflowDefinition {
  id: string;
  name: string;
  version: string;
  description: string;
  type: 'bpmn' | 'state-machine';
  definition: any;
  metadata: WorkflowMetadata;
  createdAt: string;
  updatedAt: string;
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

export interface WorkflowInstance {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed' | 'paused' | 'cancelled';
  currentState: string;
  context: Record<string, any>;
  history: WorkflowHistoryItem[];
  metadata: WorkflowInstanceMetadata;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface WorkflowHistoryItem {
  id: string;
  timestamp: string;
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

export class WebWorkflowSystem {
  private workflows: Map<string, WorkflowDefinition> = new Map();
  private instances: Map<string, WorkflowInstance> = new Map();

  constructor() {
    this.initializeExampleWorkflows();
    console.log('Web Workflow System initialized');
  }

  createWorkflow(definition: Omit<WorkflowDefinition, 'id' | 'createdAt' | 'updatedAt'>): string {
    const id = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const workflow: WorkflowDefinition = {
      ...definition,
      id,
      createdAt: now,
      updatedAt: now,
    };

    this.workflows.set(id, workflow);

    console.log('Workflow created in web system', {
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
      updatedAt: new Date().toISOString(),
    };

    this.workflows.set(workflowId, updatedWorkflow);

    console.log('Workflow updated in web system', {
      workflowId,
      workflowName: updatedWorkflow.name,
    });

    return true;
  }

  deleteWorkflow(workflowId: string): boolean {
    const deleted = this.workflows.delete(workflowId);
    if (deleted) {
      console.log('Workflow deleted from web system', { workflowId });
    }
    return deleted;
  }

  startWorkflow(workflowId: string, context: Record<string, any>, metadata: WorkflowInstanceMetadata): string {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const instanceId = `instance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    let currentState: string;
    if (workflow.type === 'bpmn') {
      currentState = workflow.definition.startEvent || 'start';
    } else {
      currentState = workflow.definition.initialState || 'initial';
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

    console.log('Workflow instance started in web system', {
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

  getAllInstances(filters?: any): WorkflowInstance[] {
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
    }

    return instances;
  }

  pauseWorkflow(instanceId: string): boolean {
    const instance = this.instances.get(instanceId);
    if (!instance || instance.status !== 'running') {
      return false;
    }

    instance.status = 'paused';
    instance.updatedAt = new Date().toISOString();
    instance.history.push({
      id: `history_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'user_action',
      data: {},
      message: 'Workflow paused by user',
    });

    console.log('Workflow paused in web system', { instanceId });
    return true;
  }

  resumeWorkflow(instanceId: string): boolean {
    const instance = this.instances.get(instanceId);
    if (!instance || instance.status !== 'paused') {
      return false;
    }

    instance.status = 'running';
    instance.updatedAt = new Date().toISOString();
    instance.history.push({
      id: `history_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'user_action',
      data: {},
      message: 'Workflow resumed by user',
    });

    console.log('Workflow resumed in web system', { instanceId });
    return true;
  }

  cancelWorkflow(instanceId: string): boolean {
    const instance = this.instances.get(instanceId);
    if (!instance || instance.status === 'completed' || instance.status === 'cancelled') {
      return false;
    }

    instance.status = 'cancelled';
    instance.updatedAt = new Date().toISOString();
    instance.history.push({
      id: `history_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'user_action',
      data: {},
      message: 'Workflow cancelled by user',
    });

    console.log('Workflow cancelled in web system', { instanceId });
    return true;
  }

  executeAction(instanceId: string, actionName: string, data?: Record<string, any>): boolean {
    const instance = this.instances.get(instanceId);
    if (!instance || instance.status !== 'running') {
      return false;
    }

    try {
      // Simular ejecución de acción
      const result = { actionExecuted: true, actionName, timestamp: new Date().toISOString() };
      
      // Actualizar contexto
      instance.context = { ...instance.context, ...result };
      instance.updatedAt = new Date().toISOString();
      instance.history.push({
        id: `history_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'action_executed',
        action: actionName,
        data: { input: data, output: result },
        message: `Action '${actionName}' executed successfully`,
      });

      console.log('Action executed in web system', {
        instanceId,
        actionName,
        result,
      });

      return true;
    } catch (error) {
      instance.history.push({
        id: `history_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'error',
        action: actionName,
        data: { input: data, error: (error as Error).message },
        message: `Action '${actionName}' failed: ${(error as Error).message}`,
      });

      console.error('Action execution failed in web system', {
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
      return sum + (new Date(instance.completedAt!).getTime() - new Date(instance.startedAt!).getTime());
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

  private initializeExampleWorkflows(): void {
    // Workflow BPMN de ejemplo: Proceso de Onboarding
    const onboardingWorkflowId = this.createWorkflow({
      name: 'User Onboarding Process',
      version: '1.0.0',
      description: 'BPMN workflow for user onboarding',
      type: 'bpmn',
      definition: {
        elements: [
          {
            id: 'start',
            type: 'startEvent',
            name: 'Start Onboarding',
            position: { x: 100, y: 100 },
            properties: {},
            actions: ['sendEmail'],
          },
          {
            id: 'validate',
            type: 'task',
            name: 'Validate User Data',
            position: { x: 300, y: 100 },
            properties: { timeout: 5000 },
            actions: ['httpRequest'],
          },
          {
            id: 'complete',
            type: 'endEvent',
            name: 'Onboarding Complete',
            position: { x: 500, y: 100 },
            properties: {},
            actions: ['sendEmail'],
          },
        ],
        flows: [
          { id: 'flow1', sourceId: 'start', targetId: 'validate', properties: {} },
          { id: 'flow2', sourceId: 'validate', targetId: 'complete', properties: {} },
        ],
        startEvent: 'start',
        endEvents: ['complete'],
      },
      metadata: {
        author: 'System',
        category: 'User Management',
        tags: ['onboarding', 'user', 'bpmn'],
        priority: 'high',
        timeout: 300000,
        retryPolicy: {
          maxRetries: 3,
          backoffStrategy: 'exponential',
          initialDelay: 1000,
          maxDelay: 10000,
        },
        notifications: [
          {
            type: 'email',
            trigger: 'complete',
            config: { template: 'onboarding-complete' },
          },
        ],
      },
    });

    // Workflow State Machine de ejemplo: Order Processing
    const orderWorkflowId = this.createWorkflow({
      name: 'Order Processing State Machine',
      version: '1.0.0',
      description: 'State machine for order processing',
      type: 'state-machine',
      definition: {
        states: [
          {
            id: 'pending',
            name: 'Pending',
            type: 'initial',
            actions: [
              {
                type: 'notification',
                name: 'sendOrderConfirmation',
                config: { template: 'order-confirmation' },
                order: 1,
              },
            ],
            properties: {},
          },
          {
            id: 'processing',
            name: 'Processing',
            type: 'intermediate',
            actions: [
              {
                type: 'http',
                name: 'validatePayment',
                config: { url: '/api/payment/validate' },
                order: 1,
              },
            ],
            timeout: 30000,
            properties: {},
          },
          {
            id: 'completed',
            name: 'Completed',
            type: 'final',
            actions: [
              {
                type: 'notification',
                name: 'sendCompletionNotification',
                config: { template: 'completion-notification' },
                order: 1,
              },
            ],
            properties: {},
          },
        ],
        transitions: [
          {
            id: 'start-processing',
            fromState: 'pending',
            toState: 'processing',
            event: 'start_processing',
            actions: [],
            properties: {},
          },
          {
            id: 'complete-order',
            fromState: 'processing',
            toState: 'completed',
            event: 'complete',
            actions: [],
            properties: {},
          },
        ],
        initialState: 'pending',
        finalStates: ['completed'],
      },
      metadata: {
        author: 'System',
        category: 'Order Management',
        tags: ['order', 'processing', 'state-machine'],
        priority: 'critical',
        timeout: 86400000,
        retryPolicy: {
          maxRetries: 5,
          backoffStrategy: 'linear',
          initialDelay: 2000,
          maxDelay: 30000,
        },
        notifications: [
          {
            type: 'email',
            trigger: 'complete',
            config: { template: 'order-complete' },
          },
        ],
      },
    });

    console.log('Example workflows initialized in web system', {
      onboardingWorkflowId,
      orderWorkflowId,
    });
  }
}

// Instancia global
export const webWorkflowSystem = new WebWorkflowSystem();
