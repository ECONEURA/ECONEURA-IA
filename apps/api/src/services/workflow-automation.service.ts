import { aiRouter } from '@econeura/shared';
import { customMetrics, createSpan, recordAIRequest } from '@econeura/shared/otel';

export interface WorkflowTrigger {
  type: 'event' | 'schedule' | 'condition' | 'webhook';
  event?: string;
  schedule?: string; // cron expression
  condition?: string;
  webhookUrl?: string;
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
  logicalOperator?: 'and' | 'or';
}

export interface WorkflowAction {
  type: 'notification' | 'email' | 'api_call' | 'data_update' | 'ai_analysis' | 'report_generation';
  config: Record<string, any>;
  delay?: number; // milliseconds
  retryCount?: number;
  retryDelay?: number;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  executionCount: number;
  lastExecuted?: Date;
  successRate: number;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  triggerData: any;
  executionLog: Array<{
    timestamp: Date;
    level: 'info' | 'warning' | 'error';
    message: string;
    data?: any;
  }>;
  results: Record<string, any>;
}

class WorkflowAutomationService {
  private workflows: Map<string, Workflow> = new Map();
  private executions: Map<string, WorkflowExecution> = new Map();
  private eventListeners: Map<string, Array<(data: any) => void>> = new Map();
  private scheduledJobs: Map<string, NodeJS.Timeout> = new Map();

  async createWorkflow(workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt' | 'executionCount' | 'successRate'>): Promise<Workflow> {
    const span = createSpan('workflow.create', {
      name: workflow.name,
      trigger_type: workflow.trigger.type,
      actions_count: workflow.actions.length
    });

    try {
      const id = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();
      
      const newWorkflow: Workflow = {
        ...workflow,
        id,
        createdAt: now,
        updatedAt: now,
        executionCount: 0,
        successRate: 100
      };

      this.workflows.set(id, newWorkflow);
      
      // Configurar trigger
      await this.setupTrigger(newWorkflow);

      span.setAttributes({ workflow_id: id });
      return newWorkflow;
    } catch (error) {
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  }

  async executeWorkflow(workflowId: string, triggerData?: any): Promise<WorkflowExecution> {
    const span = createSpan('workflow.execute', { workflow_id: workflowId });
    
    try {
      const workflow = this.workflows.get(workflowId);
      if (!workflow) {
        throw new Error(`Workflow ${workflowId} not found`);
      }

      if (!workflow.enabled) {
        throw new Error(`Workflow ${workflowId} is disabled`);
      }

      const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const startTime = new Date();

      const execution: WorkflowExecution = {
        id: executionId,
        workflowId,
        status: 'running',
        startTime,
        triggerData: triggerData || {},
        executionLog: [],
        results: {}
      };

      this.executions.set(executionId, execution);
      this.logExecution(execution, 'info', 'Workflow execution started', { triggerData });

      try {
        // Verificar condiciones
        const conditionsMet = await this.evaluateConditions(workflow.conditions, triggerData);
        if (!conditionsMet) {
          this.logExecution(execution, 'info', 'Workflow conditions not met, skipping execution');
          execution.status = 'completed';
          execution.endTime = new Date();
          return execution;
        }

        // Ejecutar acciones
        for (const action of workflow.actions) {
          await this.executeAction(action, execution, triggerData);
        }

        execution.status = 'completed';
        execution.endTime = new Date();
        
        // Actualizar estadísticas del workflow
        workflow.executionCount++;
        workflow.lastExecuted = startTime;
        workflow.successRate = this.calculateSuccessRate(workflowId);

        this.logExecution(execution, 'info', 'Workflow execution completed successfully');
        
        return execution;
      } catch (error) {
        execution.status = 'failed';
        execution.endTime = new Date();
        this.logExecution(execution, 'error', `Workflow execution failed: ${error.message}`, { error });
        throw error;
      }
    } catch (error) {
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  }

  async getWorkflow(workflowId: string): Promise<Workflow | null> {
    return this.workflows.get(workflowId) || null;
  }

  async listWorkflows(): Promise<Workflow[]> {
    return Array.from(this.workflows.values());
  }

  async updateWorkflow(workflowId: string, updates: Partial<Workflow>): Promise<Workflow> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const updatedWorkflow = {
      ...workflow,
      ...updates,
      updatedAt: new Date()
    };

    this.workflows.set(workflowId, updatedWorkflow);
    
    // Reconfigurar trigger si cambió
    if (updates.trigger || updates.enabled !== undefined) {
      await this.setupTrigger(updatedWorkflow);
    }

    return updatedWorkflow;
  }

  async deleteWorkflow(workflowId: string): Promise<void> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    // Limpiar trigger
    await this.cleanupTrigger(workflow);
    
    this.workflows.delete(workflowId);
  }

  async getWorkflowExecutions(workflowId: string, limit: number = 50): Promise<WorkflowExecution[]> {
    return Array.from(this.executions.values())
      .filter(exec => exec.workflowId === workflowId)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, limit);
  }

  async triggerEvent(eventName: string, data: any): Promise<void> {
    const span = createSpan('workflow.trigger_event', { event_name: eventName });
    
    try {
      const listeners = this.eventListeners.get(eventName) || [];
      
      for (const listener of listeners) {
        try {
          await listener(data);
        } catch (error) {
          span.recordException(error as Error);
        }
      }

      // Buscar workflows que se activen con este evento
      const eventWorkflows = Array.from(this.workflows.values())
        .filter(w => w.enabled && w.trigger.type === 'event' && w.trigger.event === eventName);

      for (const workflow of eventWorkflows) {
        await this.executeWorkflow(workflow.id, data);
      }
    } catch (error) {
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  }

  async getWorkflowAnalytics(workflowId: string): Promise<any> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const executions = await this.getWorkflowExecutions(workflowId, 1000);
    
    const totalExecutions = executions.length;
    const successfulExecutions = executions.filter(e => e.status === 'completed').length;
    const failedExecutions = executions.filter(e => e.status === 'failed').length;
    
    const avgExecutionTime = executions.length > 0 
      ? executions.reduce((sum, e) => {
          if (e.endTime) {
            return sum + (e.endTime.getTime() - e.startTime.getTime());
          }
          return sum;
        }, 0) / executions.length
      : 0;

    const recentExecutions = executions.slice(0, 10);
    const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;

    return {
      workflowId,
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      successRate,
      avgExecutionTime,
      recentExecutions,
      lastExecuted: workflow.lastExecuted,
      createdAt: workflow.createdAt
    };
  }

  private async setupTrigger(workflow: Workflow): Promise<void> {
    // Limpiar trigger anterior si existe
    await this.cleanupTrigger(workflow);

    if (!workflow.enabled) return;

    switch (workflow.trigger.type) {
      case 'event':
        await this.setupEventTrigger(workflow);
        break;
      case 'schedule':
        await this.setupScheduleTrigger(workflow);
        break;
      case 'webhook':
        await this.setupWebhookTrigger(workflow);
        break;
    }
  }

  private async setupEventTrigger(workflow: Workflow): Promise<void> {
    if (!workflow.trigger.event) return;

    const eventName = workflow.trigger.event;
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, []);
    }

    const listener = async (data: any) => {
      await this.executeWorkflow(workflow.id, data);
    };

    this.eventListeners.get(eventName)!.push(listener);
  }

  private async setupScheduleTrigger(workflow: Workflow): Promise<void> {
    if (!workflow.trigger.schedule) return;

    // Simulación de cron job
    const interval = this.parseCronExpression(workflow.trigger.schedule);
    const job = setInterval(async () => {
      await this.executeWorkflow(workflow.id);
    }, interval);

    this.scheduledJobs.set(workflow.id, job);
  }

  private async setupWebhookTrigger(workflow: Workflow): Promise<void> {
    // Los webhooks se manejan externamente
    // Aquí solo registramos que el workflow está listo para webhooks
  }

  private async cleanupTrigger(workflow: Workflow): Promise<void> {
    // Limpiar scheduled jobs
    const existingJob = this.scheduledJobs.get(workflow.id);
    if (existingJob) {
      clearInterval(existingJob);
      this.scheduledJobs.delete(workflow.id);
    }

    // Limpiar event listeners
    if (workflow.trigger.type === 'event' && workflow.trigger.event) {
      const listeners = this.eventListeners.get(workflow.trigger.event) || [];
      // En una implementación real, necesitaríamos una forma de identificar y remover listeners específicos
    }
  }

  private async evaluateConditions(conditions: WorkflowCondition[], data: any): Promise<boolean> {
    if (conditions.length === 0) return true;

    let result = true;
    let logicalOperator: 'and' | 'or' = 'and';

    for (const condition of conditions) {
      const conditionResult = this.evaluateCondition(condition, data);
      
      if (logicalOperator === 'and') {
        result = result && conditionResult;
      } else {
        result = result || conditionResult;
      }

      logicalOperator = condition.logicalOperator || 'and';
    }

    return result;
  }

  private evaluateCondition(condition: WorkflowCondition, data: any): boolean {
    const fieldValue = this.getNestedValue(data, condition.field);
    
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
  }

  private async executeAction(action: WorkflowAction, execution: WorkflowExecution, triggerData: any): Promise<void> {
    this.logExecution(execution, 'info', `Executing action: ${action.type}`, { action });

    try {
      switch (action.type) {
        case 'notification':
          await this.executeNotificationAction(action, execution, triggerData);
          break;
        case 'email':
          await this.executeEmailAction(action, execution, triggerData);
          break;
        case 'api_call':
          await this.executeApiCallAction(action, execution, triggerData);
          break;
        case 'data_update':
          await this.executeDataUpdateAction(action, execution, triggerData);
          break;
        case 'ai_analysis':
          await this.executeAIAnalysisAction(action, execution, triggerData);
          break;
        case 'report_generation':
          await this.executeReportGenerationAction(action, execution, triggerData);
          break;
        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }

      this.logExecution(execution, 'info', `Action ${action.type} completed successfully`);
    } catch (error) {
      this.logExecution(execution, 'error', `Action ${action.type} failed: ${error.message}`, { error });
      throw error;
    }
  }

  private async executeNotificationAction(action: WorkflowAction, execution: WorkflowExecution, triggerData: any): Promise<void> {
    // Simulación de envío de notificación
    await new Promise(resolve => setTimeout(resolve, 100));
    execution.results.notification = {
      sent: true,
      timestamp: new Date(),
      recipients: action.config.recipients || []
    };
  }

  private async executeEmailAction(action: WorkflowAction, execution: WorkflowExecution, triggerData: any): Promise<void> {
    // Simulación de envío de email
    await new Promise(resolve => setTimeout(resolve, 200));
    execution.results.email = {
      sent: true,
      timestamp: new Date(),
      to: action.config.to || [],
      subject: action.config.subject || 'Workflow Notification'
    };
  }

  private async executeApiCallAction(action: WorkflowAction, execution: WorkflowExecution, triggerData: any): Promise<void> {
    // Simulación de llamada API
    await new Promise(resolve => setTimeout(resolve, 300));
    execution.results.apiCall = {
      success: true,
      timestamp: new Date(),
      url: action.config.url || '',
      method: action.config.method || 'POST',
      response: { status: 200, data: 'Success' }
    };
  }

  private async executeDataUpdateAction(action: WorkflowAction, execution: WorkflowExecution, triggerData: any): Promise<void> {
    // Simulación de actualización de datos
    await new Promise(resolve => setTimeout(resolve, 150));
    execution.results.dataUpdate = {
      success: true,
      timestamp: new Date(),
      table: action.config.table || '',
      records: action.config.records || 0
    };
  }

  private async executeAIAnalysisAction(action: WorkflowAction, execution: WorkflowExecution, triggerData: any): Promise<void> {
    const aiResponse = await aiRouter.route({
      prompt: action.config.prompt || 'Analyze the provided data',
      model: action.config.model || 'mistral-7b',
      maxTokens: action.config.maxTokens || 500
    });

    execution.results.aiAnalysis = {
      success: true,
      timestamp: new Date(),
      model: action.config.model || 'mistral-7b',
      analysis: aiResponse.content
    };
  }

  private async executeReportGenerationAction(action: WorkflowAction, execution: WorkflowExecution, triggerData: any): Promise<void> {
    // Simulación de generación de reporte
    await new Promise(resolve => setTimeout(resolve, 500));
    execution.results.reportGeneration = {
      success: true,
      timestamp: new Date(),
      reportType: action.config.reportType || 'summary',
      reportUrl: `/reports/${Date.now()}.pdf`
    };
  }

  private logExecution(execution: WorkflowExecution, level: string, message: string, data?: any): void {
    execution.executionLog.push({
      timestamp: new Date(),
      level: level as 'info' | 'warning' | 'error',
      message,
      data
    });
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private parseCronExpression(expression: string): number {
    // Simulación de parsing de cron - en producción usar una librería como node-cron
    // Por ahora, asumimos que es un intervalo en milisegundos
    return parseInt(expression) || 60000; // default 1 minuto
  }

  private calculateSuccessRate(workflowId: string): number {
    const executions = Array.from(this.executions.values())
      .filter(e => e.workflowId === workflowId);
    
    if (executions.length === 0) return 100;
    
    const successful = executions.filter(e => e.status === 'completed').length;
    return (successful / executions.length) * 100;
  }
}

export const workflowAutomationService = new WorkflowAutomationService();
