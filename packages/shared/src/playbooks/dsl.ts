import { z } from 'zod'
// import { createTracer } from '../otel/index.ts'
import { logger } from '../logging/index.ts'

// Step types
export const StepTypeSchema = z.enum([
  'ai_generate',
  'graph_outlook_draft',
  'graph_teams_notify',
  'graph_planner_task',
  'database_query',
  'webhook_trigger',
  'condition',
  'delay',
  'compensation',
])

export type StepType = z.infer<typeof StepTypeSchema>

// Step status
export const StepStatusSchema = z.enum([
  'pending',
  'running',
  'completed',
  'failed',
  'compensated',
  'skipped',
])

export type StepStatus = z.infer<typeof StepStatusSchema>

// Step result
export interface StepResult {
  success: boolean
  data?: any
  error?: string
  compensationRequired?: boolean
  metadata?: Record<string, any>
}

// Step definition
export interface StepDefinition {
  id: string
  type: StepType
  name: string
  description?: string
  config: Record<string, any>
  conditions?: Condition[]
  compensation?: CompensationStep
  timeout?: number
  retries?: number
  dependsOn?: string[]
}

// Condition definition
export interface Condition {
  field: string
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'exists'
  value: any
}

// Compensation step
export interface CompensationStep {
  type: StepType
  config: Record<string, any>
  description: string
}

// Playbook definition
export interface PlaybookDefinition {
  id: string
  name: string
  description: string
  version: string
  steps: StepDefinition[]
  variables?: Record<string, any>
  timeout?: number
  maxRetries?: number
}

// Playbook execution context
export interface PlaybookContext {
  orgId: string
  userId: string
  requestId: string
  variables: Record<string, any>
  stepResults: Map<string, StepResult>
  auditTrail: AuditEvent[]
}

// Audit event
export interface AuditEvent {
  timestamp: Date
  stepId: string
  action: string
  status: StepStatus
  data?: any
  error?: string
  metadata?: Record<string, any>
}

// Playbook executor
export class PlaybookExecutor {
  private tracer = createTracer('playbook-executor')
  private context: PlaybookContext
  private definition: PlaybookDefinition

  constructor(definition: PlaybookDefinition, context: PlaybookContext) {
    this.definition = definition
    this.context = context
  }

  /**
   * Execute the playbook
   */
  async execute(): Promise<{
    success: boolean
    results: Map<string, StepResult>
    auditTrail: AuditEvent[]
  }> {
    const span = this.tracer.startSpan('playbook_execute')
    
    try {
      span.setAttributes({
        'playbook.id': this.definition.id,
        'playbook.version': this.definition.version,
        'playbook.steps_count': this.definition.steps.length,
        'org_id': this.context.orgId,
        'user_id': this.context.userId,
      })

      logger.info('Starting playbook execution', {
        playbook_id: this.definition.id,
        playbook_name: this.definition.name,
        org_id: this.context.orgId,
        user_id: this.context.userId,
        request_id: this.context.requestId,
      })

      // Execute steps in order
      for (const step of this.definition.steps) {
        await this.executeStep(step)
      }

      // Check if any compensation is needed
      const failedSteps = Array.from(this.context.stepResults.entries())
        .filter(([_, result]) => !result.success && result.compensationRequired)

      if (failedSteps.length > 0) {
        await this.executeCompensations(failedSteps)
      }

      const success = Array.from(this.context.stepResults.values())
        .every(result => result.success)

      logger.info('Playbook execution completed', {
        playbook_id: this.definition.id,
        success,
        total_steps: this.definition.steps.length,
        successful_steps: Array.from(this.context.stepResults.values())
          .filter(result => result.success).length,
        failed_steps: Array.from(this.context.stepResults.values())
          .filter(result => !result.success).length,
      })

      return {
        success,
        results: this.context.stepResults,
        auditTrail: this.context.auditTrail,
      }

    } catch (error) {
      span.recordException(error as Error)
      
      logger.error('Playbook execution failed', {
        playbook_id: this.definition.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      })

      // Execute all compensations
      await this.executeAllCompensations()

      throw error
    } finally {
      span.end()
    }
  }

  /**
   * Execute a single step
   */
  private async executeStep(step: StepDefinition): Promise<void> {
    const span = this.tracer.startSpan('playbook_execute_step')
    
    try {
      span.setAttributes({
        'step.id': step.id,
        'step.type': step.type,
        'step.name': step.name,
      })

      // Check dependencies
      if (step.dependsOn) {
        const dependenciesMet = step.dependsOn.every(depId => {
          const result = this.context.stepResults.get(depId)
          return result && result.success
        })

        if (!dependenciesMet) {
          this.recordAuditEvent(step.id, 'dependency_check', 'skipped', undefined, 'Dependencies not met')
          return
        }
      }

      // Check conditions
      if (step.conditions && !this.evaluateConditions(step.conditions)) {
        this.recordAuditEvent(step.id, 'condition_check', 'skipped', undefined, 'Conditions not met')
        return
      }

      this.recordAuditEvent(step.id, 'start', 'running')

      // Execute step based on type
      const result = await this.executeStepByType(step)

      this.context.stepResults.set(step.id, result)

      const status = result.success ? 'completed' : 'failed'
      this.recordAuditEvent(step.id, 'complete', status, result.data, result.error)

      if (!result.success) {
        logger.error('Step execution failed', {
          step_id: step.id,
          step_type: step.type,
          error: result.error,
        })
      }

    } catch (error) {
      span.recordException(error as Error)
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const result: StepResult = {
        success: false,
        error: errorMessage,
        compensationRequired: true,
      }

      this.context.stepResults.set(step.id, result)
      this.recordAuditEvent(step.id, 'error', 'failed', undefined, errorMessage)

      logger.error('Step execution error', {
        step_id: step.id,
        step_type: step.type,
        error: errorMessage,
      })
    } finally {
      span.end()
    }
  }

  /**
   * Execute step based on its type
   */
  private async executeStepByType(step: StepDefinition): Promise<StepResult> {
    switch (step.type) {
      case 'ai_generate':
        return this.executeAIGenerate(step)
      case 'graph_outlook_draft':
        return this.executeGraphOutlookDraft(step)
      case 'graph_teams_notify':
        return this.executeGraphTeamsNotify(step)
      case 'graph_planner_task':
        return this.executeGraphPlannerTask(step)
      case 'database_query':
        return this.executeDatabaseQuery(step)
      case 'webhook_trigger':
        return this.executeWebhookTrigger(step)
      case 'condition':
        return this.executeCondition(step)
      case 'delay':
        return this.executeDelay(step)
      default:
        throw new Error(`Unknown step type: ${step.type}`)
    }
  }

  /**
   * Execute AI generation step
   */
  private async executeAIGenerate(step: StepDefinition): Promise<StepResult> {
    try {
      // TODO: Integrate with AI router
      const { prompt, model, maxTokens } = step.config
      
      // Mock AI generation for now
      const response = `AI generated content for: ${prompt}`
      
      return {
        success: true,
        data: { content: response },
        metadata: { model, maxTokens },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        compensationRequired: true,
      }
    }
  }

  /**
   * Execute Graph Outlook draft step
   */
  private async executeGraphOutlookDraft(step: StepDefinition): Promise<StepResult> {
    try {
      // TODO: Integrate with Graph client
      const { userId, subject, body, recipients } = step.config
      
      // Mock draft creation
      const draftId = `draft_${Date.now()}`
      
      return {
        success: true,
        data: { draftId, subject, recipients },
        metadata: { userId },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        compensationRequired: true,
      }
    }
  }

  /**
   * Execute Graph Teams notification step
   */
  private async executeGraphTeamsNotify(step: StepDefinition): Promise<StepResult> {
    try {
      // TODO: Integrate with Graph client
      const { teamId, channelId, message } = step.config
      
      // Mock Teams message
      const messageId = `msg_${Date.now()}`
      
      return {
        success: true,
        data: { messageId, teamId, channelId },
        metadata: { message },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        compensationRequired: true,
      }
    }
  }

  /**
   * Execute Graph Planner task step
   */
  private async executeGraphPlannerTask(step: StepDefinition): Promise<StepResult> {
    try {
      // TODO: Integrate with Graph client
      const { planId, title, description, dueDateTime } = step.config
      
      // Mock task creation
      const taskId = `task_${Date.now()}`
      
      return {
        success: true,
        data: { taskId, title, planId },
        metadata: { description, dueDateTime },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        compensationRequired: true,
      }
    }
  }

  /**
   * Execute database query step
   */
  private async executeDatabaseQuery(step: StepDefinition): Promise<StepResult> {
    try {
      // TODO: Integrate with database
      const { query, params } = step.config
      
      // Mock database query
      const results = [{ id: 1, name: 'Test Result' }]
      
      return {
        success: true,
        data: { results, query },
        metadata: { params },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        compensationRequired: true,
      }
    }
  }

  /**
   * Execute webhook trigger step
   */
  private async executeWebhookTrigger(step: StepDefinition): Promise<StepResult> {
    try {
      // TODO: Integrate with webhook system
      const { url, method, payload } = step.config
      
      // Mock webhook call
      const responseId = `webhook_${Date.now()}`
      
      return {
        success: true,
        data: { responseId, url, method },
        metadata: { payload },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        compensationRequired: true,
      }
    }
  }

  /**
   * Execute condition step
   */
  private async executeCondition(step: StepDefinition): Promise<StepResult> {
    try {
      const { conditions } = step.config
      const result = this.evaluateConditions(conditions)
      
      return {
        success: true,
        data: { result },
        metadata: { conditions },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        compensationRequired: false, // Conditions don't need compensation
      }
    }
  }

  /**
   * Execute delay step
   */
  private async executeDelay(step: StepDefinition): Promise<StepResult> {
    try {
      const { duration } = step.config
      
      await new Promise(resolve => setTimeout(resolve, duration))
      
      return {
        success: true,
        data: { duration },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        compensationRequired: false, // Delays don't need compensation
      }
    }
  }

  /**
   * Evaluate conditions
   */
  private evaluateConditions(conditions: Condition[]): boolean {
    return conditions.every(condition => {
      const value = this.getVariableValue(condition.field)
      
      switch (condition.operator) {
        case 'equals':
          return value === condition.value
        case 'not_equals':
          return value !== condition.value
        case 'greater_than':
          return value > condition.value
        case 'less_than':
          return value < condition.value
        case 'contains':
          return String(value).includes(String(condition.value))
        case 'exists':
          return value !== undefined && value !== null
        default:
          return false
      }
    })
  }

  /**
   * Get variable value from context
   */
  private getVariableValue(field: string): any {
    // Check context variables first
    if (this.context.variables[field] !== undefined) {
      return this.context.variables[field]
    }

    // Check step results
    const [stepId, resultField] = field.split('.')
    const stepResult = this.context.stepResults.get(stepId)
    
    if (stepResult && stepResult.data) {
      return resultField ? stepResult.data[resultField] : stepResult.data
    }

    return undefined
  }

  /**
   * Execute compensations for failed steps
   */
  private async executeCompensations(failedSteps: [string, StepResult][]): Promise<void> {
    for (const [stepId, result] of failedSteps) {
      const step = this.definition.steps.find(s => s.id === stepId)
      if (step?.compensation) {
        await this.executeCompensation(step, result)
      }
    }
  }

  /**
   * Execute all compensations
   */
  private async executeAllCompensations(): Promise<void> {
    for (const step of this.definition.steps) {
      if (step.compensation) {
        const result = this.context.stepResults.get(step.id)
        if (result && !result.success) {
          await this.executeCompensation(step, result)
        }
      }
    }
  }

  /**
   * Execute compensation for a step
   */
  private async executeCompensation(step: StepDefinition, originalResult: StepResult): Promise<void> {
    const span = this.tracer.startSpan('playbook_execute_compensation')
    
    try {
      span.setAttributes({
        'step.id': step.id,
        'compensation.type': step.compensation!.type,
      })

      this.recordAuditEvent(step.id, 'compensation_start', 'running', undefined, step.compensation!.description)

      // Execute compensation step
      const compensationStep: StepDefinition = {
        id: `${step.id}_compensation`,
        type: step.compensation!.type,
        name: `Compensation for ${step.name}`,
        config: step.compensation!.config,
      }

      const result = await this.executeStepByType(compensationStep)
      
      const status = result.success ? 'compensated' : 'failed'
      this.recordAuditEvent(step.id, 'compensation_complete', status, result.data, result.error)

      logger.info('Compensation executed', {
        step_id: step.id,
        compensation_success: result.success,
        error: result.error,
      })

    } catch (error) {
      span.recordException(error as Error)
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.recordAuditEvent(step.id, 'compensation_error', 'failed', undefined, errorMessage)

      logger.error('Compensation execution failed', {
        step_id: step.id,
        error: errorMessage,
      })
    } finally {
      span.end()
    }
  }

  /**
   * Record audit event
   */
  private recordAuditEvent(
    stepId: string,
    action: string,
    status: StepStatus,
    data?: any,
    error?: string
  ): void {
    const event: AuditEvent = {
      timestamp: new Date(),
      stepId,
      action,
      status,
      data,
      error,
      metadata: {
        org_id: this.context.orgId,
        user_id: this.context.userId,
        request_id: this.context.requestId,
      },
    }

    this.context.auditTrail.push(event)
  }
}

// Factory function to create playbook executor
export function createPlaybookExecutor(
  definition: PlaybookDefinition,
  context: Omit<PlaybookContext, 'stepResults' | 'auditTrail'>
): PlaybookExecutor {
  const fullContext: PlaybookContext = {
    ...context,
    stepResults: new Map(),
    auditTrail: [],
  }

  return new PlaybookExecutor(definition, fullContext)
}
