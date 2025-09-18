import { z } from 'zod';

// ============================================================================
// TIPOS Y ESQUEMAS (simplificados para Web BFF)
// ============================================================================

export const WorkflowTypeSchema = z.enum(['bpmn', 'state_machine']);
export type WorkflowType = z.infer<typeof WorkflowTypeSchema>;

export const WorkflowStatusSchema = z.enum(['draft', 'active', 'inactive', 'archived']);
export type WorkflowStatus = z.infer<typeof WorkflowStatusSchema>;

export const InstanceStatusSchema = z.enum(['running', 'completed', 'failed', 'paused', 'cancelled']);
export type InstanceStatus = z.infer<typeof InstanceStatusSchema>;

export const ActionTypeSchema = z.enum(['function', 'http', 'delay', 'condition', 'notification']);
export type ActionType = z.infer<typeof ActionTypeSchema>;

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
  timeout: z.number().optional(),
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
    strategy: z.enum(['fixed', 'exponential', 'linear']),
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
  timeout: z.number().optional(),
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
  createdAt: z.string(),
  updatedAt: z.string(),
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
    timestamp: z.string(),
    action: z.string(),
    message: z.string(),
    data: z.record(z.any()).optional(),
  })),
  startedAt: z.string(),
  completedAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// ============================================================================
// TIPOS DERIVADOS
// ============================================================================

export type Workflow = z.infer<typeof WorkflowSchema>;
export type WorkflowInstance = z.infer<typeof WorkflowInstanceSchema>;
export type Action = z.infer<typeof ActionSchema>;
export type BpmnWorkflow = z.infer<typeof BpmnWorkflowSchema>;
export type StateMachineWorkflow = z.infer<typeof StateMachineWorkflowSchema>;

// ============================================================================
// INTERFACES
// ============================================================================

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
  fromDate?: string;
  toDate?: string;
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
    timestamp: string;
  }>;
}

// ============================================================================
// IMPLEMENTACIÓN DEL WEB WORKFLOW SYSTEM
// ============================================================================

class WebWorkflowSystem {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '/api/workflows';
  }

  // ============================================================================
  // GESTIÓN DE WORKFLOWS
  // ============================================================================

  async createWorkflow(workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>): Promise<Workflow> {
    const response = await fetch(`${this.baseUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-Id': this.generateRequestId(),
      },
      body: JSON.stringify(workflow),
    });

    if (!response.ok) {
      throw new Error(`Failed to create workflow: ${response.statusText}`);
    }

    return response.json();
  }

  async getWorkflow(id: string): Promise<Workflow | null> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      headers: {
        'X-Request-Id': this.generateRequestId(),
      },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Failed to get workflow: ${response.statusText}`);
    }

    return response.json();
  }

  async updateWorkflow(id: string, updates: Partial<Workflow>): Promise<Workflow> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-Id': this.generateRequestId(),
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`Failed to update workflow: ${response.statusText}`);
    }

    return response.json();
  }

  async deleteWorkflow(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
      headers: {
        'X-Request-Id': this.generateRequestId(),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete workflow: ${response.statusText}`);
    }
  }

  async listWorkflows(filters?: WorkflowFilters): Promise<Workflow[]> {
    const params = new URLSearchParams();
    
    if (filters?.type) params.append('type', filters.type);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.tags) {
      filters.tags.forEach(tag => params.append('tags', tag));
    }

    const response = await fetch(`${this.baseUrl}?${params.toString()}`, {
      headers: {
        'X-Request-Id': this.generateRequestId(),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to list workflows: ${response.statusText}`);
    }

    return response.json();
  }

  // ============================================================================
  // GESTIÓN DE INSTANCIAS
  // ============================================================================

  async startWorkflow(workflowId: string, context: Record<string, any> = {}, metadata: Record<string, any> = {}): Promise<WorkflowInstance> {
    const response = await fetch(`${this.baseUrl}/${workflowId}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-Id': this.generateRequestId(),
      },
      body: JSON.stringify({ context, metadata }),
    });

    if (!response.ok) {
      throw new Error(`Failed to start workflow: ${response.statusText}`);
    }

    return response.json();
  }

  async getInstance(instanceId: string): Promise<WorkflowInstance | null> {
    const response = await fetch(`${this.baseUrl}/instances/${instanceId}`, {
      headers: {
        'X-Request-Id': this.generateRequestId(),
      },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Failed to get instance: ${response.statusText}`);
    }

    return response.json();
  }

  async listInstances(filters?: InstanceFilters): Promise<WorkflowInstance[]> {
    const params = new URLSearchParams();
    
    if (filters?.workflowId) params.append('workflowId', filters.workflowId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.orgId) params.append('orgId', filters.orgId);
    if (filters?.fromDate) params.append('fromDate', filters.fromDate);
    if (filters?.toDate) params.append('toDate', filters.toDate);

    const response = await fetch(`${this.baseUrl}/instances?${params.toString()}`, {
      headers: {
        'X-Request-Id': this.generateRequestId(),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to list instances: ${response.statusText}`);
    }

    return response.json();
  }

  async pauseInstance(instanceId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/instances/${instanceId}/pause`, {
      method: 'POST',
      headers: {
        'X-Request-Id': this.generateRequestId(),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to pause instance: ${response.statusText}`);
    }
  }

  async resumeInstance(instanceId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/instances/${instanceId}/resume`, {
      method: 'POST',
      headers: {
        'X-Request-Id': this.generateRequestId(),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to resume instance: ${response.statusText}`);
    }
  }

  async cancelInstance(instanceId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/instances/${instanceId}/cancel`, {
      method: 'POST',
      headers: {
        'X-Request-Id': this.generateRequestId(),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to cancel instance: ${response.statusText}`);
    }
  }

  async executeAction(instanceId: string, actionId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/instances/${instanceId}/actions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-Id': this.generateRequestId(),
      },
      body: JSON.stringify({ actionId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to execute action: ${response.statusText}`);
    }
  }

  // ============================================================================
  // ESTADÍSTICAS
  // ============================================================================

  async getStats(): Promise<WorkflowStats> {
    const response = await fetch(`${this.baseUrl}/stats`, {
      headers: {
        'X-Request-Id': this.generateRequestId(),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get stats: ${response.statusText}`);
    }

    return response.json();
  }

  // ============================================================================
  // UTILIDADES
  // ============================================================================

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ============================================================================
  // WORKFLOWS DE EJEMPLO
  // ============================================================================

  async createSampleWorkflows(): Promise<void> {
    try {
      // Workflow BPMN: User Onboarding Process
      const userOnboardingWorkflow = await this.createWorkflow({
        name: 'User Onboarding Process',
        type: 'bpmn',
        status: 'active',
        version: 1,
        definition: {
          elements: [
            { id: 'start', type: 'startEvent', name: 'Start', x: 100, y: 100 },
            { id: 'validate', type: 'task', name: 'Validate User', x: 300, y: 100, actions: ['validate_user'] },
            { id: 'approve', type: 'task', name: 'Approve', x: 500, y: 100, actions: ['send_approval_email'] },
            { id: 'gateway', type: 'gateway', name: 'User Type', x: 700, y: 100 },
            { id: 'premium', type: 'task', name: 'Premium Setup', x: 900, y: 50, actions: ['setup_premium'] },
            { id: 'standard', type: 'task', name: 'Standard Setup', x: 900, y: 150, actions: ['setup_standard'] },
            { id: 'complete', type: 'endEvent', name: 'Complete', x: 1100, y: 100 },
          ],
          flows: [
            { id: 'f1', source: 'start', target: 'validate' },
            { id: 'f2', source: 'validate', target: 'approve' },
            { id: 'f3', source: 'approve', target: 'gateway' },
            { id: 'f4', source: 'gateway', target: 'premium', condition: 'userType === "premium"' },
            { id: 'f5', source: 'gateway', target: 'standard', condition: 'userType === "standard"' },
            { id: 'f6', source: 'premium', target: 'complete' },
            { id: 'f7', source: 'standard', target: 'complete' },
          ],
          startElement: 'start',
          endElements: ['complete'],
        },
        actions: [
          {
            id: 'validate_user',
            name: 'Validate User',
            type: 'function',
            config: { functionName: 'validateUser', parameters: { userId: '{{userId}}' } },
            order: 1,
          },
          {
            id: 'send_approval_email',
            name: 'Send Approval Email',
            type: 'notification',
            config: { type: 'email', recipient: '{{userEmail}}', message: 'Welcome to our platform!' },
            order: 2,
          },
          {
            id: 'setup_premium',
            name: 'Setup Premium',
            type: 'http',
            config: { url: '/api/premium/setup', method: 'POST', body: { userId: '{{userId}}' } },
            order: 3,
          },
          {
            id: 'setup_standard',
            name: 'Setup Standard',
            type: 'http',
            config: { url: '/api/standard/setup', method: 'POST', body: { userId: '{{userId}}' } },
            order: 3,
          },
        ],
        metadata: {
          author: 'System',
          category: 'User Management',
          tags: ['onboarding', 'user'],
          priority: 1,
          timeout: 300, // 5 minutos
          description: 'Process for onboarding new users with premium/standard differentiation',
        },
      });

      

      // Workflow State Machine: Order Processing
      const orderProcessingWorkflow = await this.createWorkflow({
        name: 'Order Processing',
        type: 'state_machine',
        status: 'active',
        version: 1,
        definition: {
          states: [
            { id: 'pending', name: 'Pending', type: 'initial', actions: ['validate_order'] },
            { id: 'processing', name: 'Processing', type: 'intermediate', actions: ['process_payment', 'update_inventory'], timeout: 3600 },
            { id: 'shipped', name: 'Shipped', type: 'intermediate', actions: ['send_shipping_notification'] },
            { id: 'delivered', name: 'Delivered', type: 'final', actions: ['send_delivery_confirmation'] },
            { id: 'cancelled', name: 'Cancelled', type: 'final', actions: ['send_cancellation_notification'] },
          ],
          transitions: [
            { id: 't1', from: 'pending', to: 'processing', event: 'order_validated' },
            { id: 't2', from: 'processing', to: 'shipped', event: 'payment_processed' },
            { id: 't3', from: 'processing', to: 'cancelled', event: 'payment_failed' },
            { id: 't4', from: 'shipped', to: 'delivered', event: 'delivery_confirmed' },
            { id: 't5', from: 'shipped', to: 'cancelled', event: 'delivery_failed' },
          ],
          initialState: 'pending',
          finalStates: ['delivered', 'cancelled'],
        },
        actions: [
          {
            id: 'validate_order',
            name: 'Validate Order',
            type: 'function',
            config: { functionName: 'validateOrder', parameters: { orderId: '{{orderId}}' } },
            order: 1,
          },
          {
            id: 'process_payment',
            name: 'Process Payment',
            type: 'http',
            config: { url: '/api/payments/process', method: 'POST', body: { orderId: '{{orderId}}' } },
            order: 1,
            retry: { maxAttempts: 3, strategy: 'exponential', delay: 1000 },
          },
          {
            id: 'update_inventory',
            name: 'Update Inventory',
            type: 'http',
            config: { url: '/api/inventory/update', method: 'POST', body: { orderId: '{{orderId}}' } },
            order: 2,
          },
          {
            id: 'send_shipping_notification',
            name: 'Send Shipping Notification',
            type: 'notification',
            config: { type: 'email', recipient: '{{customerEmail}}', message: 'Your order has been shipped!' },
            order: 1,
          },
          {
            id: 'send_delivery_confirmation',
            name: 'Send Delivery Confirmation',
            type: 'notification',
            config: { type: 'email', recipient: '{{customerEmail}}', message: 'Your order has been delivered!' },
            order: 1,
          },
          {
            id: 'send_cancellation_notification',
            name: 'Send Cancellation Notification',
            type: 'notification',
            config: { type: 'email', recipient: '{{customerEmail}}', message: 'Your order has been cancelled.' },
            order: 1,
          },
        ],
        metadata: {
          author: 'System',
          category: 'Order Management',
          tags: ['order', 'processing', 'shipping'],
          priority: 2,
          timeout: 86400, // 24 horas
          description: 'Complete order processing workflow from validation to delivery',
        },
      });

      

    } catch (error) {
      console.error('Error creating sample workflows:', error);
    }
  }
}

// Instancia global
export const webWorkflowSystem = new WebWorkflowSystem();
