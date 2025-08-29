import { logger } from '../lib/logger';
import { notificationService } from './notification.service';

interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  triggers: string[];
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  enabled: boolean;
  priority: number;
}

interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
}

interface WorkflowAction {
  type: 'create_task' | 'send_email' | 'schedule_call' | 'assign_user' | 'update_status' | 'send_notification';
  params: Record<string, any>;
}

interface WorkflowContext {
  interaction: any;
  organization_id: string;
  user_id: string;
  metadata?: Record<string, any>;
}

export class WorkflowService {
  private workflows: Map<string, WorkflowRule[]> = new Map();

  constructor() {
    this.initializeDefaultWorkflows();
  }

  // Initialize default workflows
  private initializeDefaultWorkflows() {
    const defaultWorkflows: WorkflowRule[] = [
      {
        id: 'urgent-interaction-followup',
        name: 'Seguimiento de Interacciones Urgentes',
        description: 'Crea tareas automáticas para interacciones urgentes',
        triggers: ['interaction_created'],
        conditions: [
          { field: 'priority', operator: 'equals', value: 'urgent' }
        ],
        actions: [
          {
            type: 'create_task',
            params: {
              title: 'Seguimiento Urgente',
              description: 'Seguimiento inmediato requerido para interacción urgente',
              priority: 'high',
              due_date_offset_hours: 2
            }
          },
          {
            type: 'send_notification',
            params: {
              channels: ['push', 'email', 'slack'],
              message: 'Interacción urgente creada - requiere atención inmediata'
            }
          }
        ],
        enabled: true,
        priority: 1
      },
      {
        id: 'lead-followup-sequence',
        name: 'Secuencia de Seguimiento de Leads',
        description: 'Automatiza el seguimiento de nuevos leads',
        triggers: ['interaction_created'],
        conditions: [
          { field: 'type', operator: 'equals', value: 'meeting' },
          { field: 'status', operator: 'equals', value: 'completed' }
        ],
        actions: [
          {
            type: 'create_task',
            params: {
              title: 'Seguimiento Post-Reunión',
              description: 'Enviar propuesta o información adicional después de la reunión',
              priority: 'medium',
              due_date_offset_hours: 24
            }
          },
          {
            type: 'send_email',
            params: {
              template: 'post_meeting_followup',
              subject: 'Seguimiento de nuestra reunión',
              delay_hours: 2
            }
          }
        ],
        enabled: true,
        priority: 2
      },
      {
        id: 'overdue-interaction-alert',
        name: 'Alerta de Interacciones Vencidas',
        description: 'Notifica sobre interacciones que han vencido',
        triggers: ['interaction_overdue'],
        conditions: [
          { field: 'status', operator: 'equals', value: 'pending' }
        ],
        actions: [
          {
            type: 'send_notification',
            params: {
              channels: ['push', 'email', 'slack'],
              message: 'Interacción vencida - requiere atención inmediata'
            }
          },
          {
            type: 'update_status',
            params: {
              status: 'overdue'
            }
          }
        ],
        enabled: true,
        priority: 1
      },
      {
        id: 'high-value-lead-escalation',
        name: 'Escalación de Leads de Alto Valor',
        description: 'Escala automáticamente leads de alto valor',
        triggers: ['interaction_created'],
        conditions: [
          { field: 'metadata.deal_value', operator: 'greater_than', value: 50000 }
        ],
        actions: [
          {
            type: 'assign_user',
            params: {
              role: 'senior_sales',
              reason: 'Lead de alto valor asignado automáticamente'
            }
          },
          {
            type: 'create_task',
            params: {
              title: 'Lead de Alto Valor - Revisión',
              description: 'Revisar y priorizar lead de alto valor',
              priority: 'high',
              due_date_offset_hours: 4
            }
          }
        ],
        enabled: true,
        priority: 1
      }
    ];

    // Register default workflows for all organizations
    defaultWorkflows.forEach(workflow => {
      this.registerWorkflow('default', workflow);
    });
  }

  // Register workflow for organization
  registerWorkflow(orgId: string, workflow: WorkflowRule) {
    if (!this.workflows.has(orgId)) {
      this.workflows.set(orgId, []);
    }
    this.workflows.get(orgId)!.push(workflow);
  }

  // Execute workflows for an event
  async executeWorkflows(trigger: string, context: WorkflowContext) {
    try {
      const orgWorkflows = this.workflows.get(context.organization_id) || [];
      const defaultWorkflows = this.workflows.get('default') || [];
      const allWorkflows = [...orgWorkflows, ...defaultWorkflows];

      // Filter workflows by trigger and enabled status
      const applicableWorkflows = allWorkflows.filter(workflow => 
        workflow.enabled && 
        workflow.triggers.includes(trigger)
      );

      // Sort by priority (lower number = higher priority)
      applicableWorkflows.sort((a, b) => a.priority - b.priority);

      // Execute workflows
      const executionPromises = applicableWorkflows.map(workflow => 
        this.executeWorkflow(workflow, context)
      );

      await Promise.allSettled(executionPromises);

      logger.info('Workflows executed', {
        trigger,
        orgId: context.organization_id,
        workflowsCount: applicableWorkflows.length
      });
    } catch (error) {
      logger.error('Error executing workflows', error, {
        trigger,
        orgId: context.organization_id
      });
    }
  }

  // Execute a single workflow
  private async executeWorkflow(workflow: WorkflowRule, context: WorkflowContext) {
    try {
      // Check conditions
      const conditionsMet = this.evaluateConditions(workflow.conditions, context.interaction);
      
      if (!conditionsMet) {
        logger.debug('Workflow conditions not met', {
          workflowId: workflow.id,
          interactionId: context.interaction.id
        });
        return;
      }

      // Execute actions
      const actionPromises = workflow.actions.map(action => 
        this.executeAction(action, context)
      );

      await Promise.allSettled(actionPromises);

      logger.info('Workflow executed successfully', {
        workflowId: workflow.id,
        workflowName: workflow.name,
        interactionId: context.interaction.id
      });
    } catch (error) {
      logger.error('Error executing workflow', error, {
        workflowId: workflow.id,
        interactionId: context.interaction.id
      });
    }
  }

  // Evaluate workflow conditions
  private evaluateConditions(conditions: WorkflowCondition[], interaction: any): boolean {
    return conditions.every(condition => {
      const fieldValue = this.getNestedValue(interaction, condition.field);
      
      switch (condition.operator) {
        case 'equals':
          return fieldValue === condition.value;
        case 'not_equals':
          return fieldValue !== condition.value;
        case 'contains':
          return String(fieldValue).includes(String(condition.value));
        case 'greater_than':
          return Number(fieldValue) > Number(condition.value);
        case 'less_than':
          return Number(fieldValue) < Number(condition.value);
        case 'in':
          return Array.isArray(condition.value) && condition.value.includes(fieldValue);
        case 'not_in':
          return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
        default:
          return false;
      }
    });
  }

  // Get nested object value
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  // Execute workflow action
  private async executeAction(action: WorkflowAction, context: WorkflowContext) {
    try {
      switch (action.type) {
        case 'create_task':
          await this.createTask(action.params, context);
          break;
        case 'send_email':
          await this.sendEmail(action.params, context);
          break;
        case 'schedule_call':
          await this.scheduleCall(action.params, context);
          break;
        case 'assign_user':
          await this.assignUser(action.params, context);
          break;
        case 'update_status':
          await this.updateStatus(action.params, context);
          break;
        case 'send_notification':
          await this.sendNotification(action.params, context);
          break;
        default:
          logger.warn('Unknown action type', { actionType: action.type });
      }
    } catch (error) {
      logger.error('Error executing action', error, {
        actionType: action.type,
        interactionId: context.interaction.id
      });
    }
  }

  // Action implementations
  private async createTask(params: any, context: WorkflowContext) {
    // Mock implementation - in production would create actual task
    const dueDate = new Date();
    dueDate.setHours(dueDate.getHours() + (params.due_date_offset_hours || 24));

    logger.info('Task created via workflow', {
      title: params.title,
      description: params.description,
      priority: params.priority,
      dueDate: dueDate.toISOString(),
      interactionId: context.interaction.id
    });
  }

  private async sendEmail(params: any, context: WorkflowContext) {
    // Mock implementation - in production would send actual email
    logger.info('Email sent via workflow', {
      template: params.template,
      subject: params.subject,
      delayHours: params.delay_hours,
      interactionId: context.interaction.id
    });
  }

  private async scheduleCall(params: any, context: WorkflowContext) {
    // Mock implementation - in production would schedule actual call
    logger.info('Call scheduled via workflow', {
      params,
      interactionId: context.interaction.id
    });
  }

  private async assignUser(params: any, context: WorkflowContext) {
    // Mock implementation - in production would assign actual user
    logger.info('User assigned via workflow', {
      role: params.role,
      reason: params.reason,
      interactionId: context.interaction.id
    });
  }

  private async updateStatus(params: any, context: WorkflowContext) {
    // Mock implementation - in production would update actual status
    logger.info('Status updated via workflow', {
      newStatus: params.status,
      interactionId: context.interaction.id
    });
  }

  private async sendNotification(params: any, context: WorkflowContext) {
    await notificationService.sendNotification({
      type: 'interaction_updated',
      title: 'Workflow Notification',
      message: params.message,
      channels: params.channels || ['push', 'email'],
      priority: 'normal'
    }, context.organization_id, context.user_id);
  }

  // Get workflows for organization
  getWorkflows(orgId: string): WorkflowRule[] {
    const orgWorkflows = this.workflows.get(orgId) || [];
    const defaultWorkflows = this.workflows.get('default') || [];
    return [...orgWorkflows, ...defaultWorkflows];
  }

  // Enable/disable workflow
  toggleWorkflow(orgId: string, workflowId: string, enabled: boolean) {
    const workflows = this.workflows.get(orgId) || [];
    const workflow = workflows.find(w => w.id === workflowId);
    if (workflow) {
      workflow.enabled = enabled;
    }
  }
}

export const workflowService = new WorkflowService();
