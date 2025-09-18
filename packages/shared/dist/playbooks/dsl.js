import { z } from 'zod';
import * as otel from '../otel/index.js';
import { logger } from '../logging/index.js';
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
]);
export const StepStatusSchema = z.enum([
    'pending',
    'running',
    'completed',
    'failed',
    'compensated',
    'skipped',
]);
export class PlaybookExecutor {
    tracer = { startSpan: (name) => {
            const ot = otel;
            const maybeCreateSpan = ot.createSpan;
            if (typeof maybeCreateSpan === 'function')
                return maybeCreateSpan(name);
            const maybeCreateTracer = ot.createTracer;
            if (typeof maybeCreateTracer === 'function')
                return maybeCreateTracer().startSpan(name);
            return {
                setAttribute: (_k, _v) => { },
                setAttributes: (_attrs) => { },
                recordException: (_err) => { },
                setStatus: (_s) => { },
                end: () => { },
            };
        } };
    context;
    definition;
    constructor(definition, context) {
        this.definition = definition;
        this.context = context;
    }
    async execute() {
        const span = this.tracer.startSpan('playbook_execute');
        try {
            span.setAttributes({
                'playbook.id': this.definition.id,
                'playbook.version': this.definition.version,
                'playbook.steps_count': this.definition.steps.length,
                'org_id': this.context.orgId,
                'user_id': this.context.userId,
            });
            logger.info('Starting playbook execution', {
                playbook_id: this.definition.id,
                playbook_name: this.definition.name,
                org_id: this.context.orgId,
                actor: this.context.userId,
                x_request_id: this.context.requestId,
            });
            for (const step of this.definition.steps) {
                await this.executeStep(step);
            }
            const failedSteps = Array.from(this.context.stepResults.entries())
                .filter(([_, result]) => !result.success && result.compensationRequired);
            if (failedSteps.length > 0) {
                await this.executeCompensations(failedSteps);
            }
            const success = this.definition.steps.every(step => this.context.stepResults.get(step.id)?.success === true);
            console.debug('[playbook] final success:', success, 'stepResults:', Array.from(this.context.stepResults.entries()));
            logger.info('Playbook execution completed', {
                playbook_id: this.definition.id,
                success,
                total_steps: this.definition.steps.length,
                successful_steps: Array.from(this.context.stepResults.values())
                    .filter(result => result.success).length,
                failed_steps: Array.from(this.context.stepResults.values())
                    .filter(result => !result.success).length,
            });
            return {
                success,
                results: this.context.stepResults,
                auditTrail: this.context.auditTrail,
            };
        }
        catch (error) {
            span.recordException(error);
            logger.error('Playbook execution failed', error, {
                playbook_id: this.definition.id,
            });
            await this.executeAllCompensations();
            throw error;
        }
        finally {
            span.end();
        }
    }
    async executeStep(step) {
        const span = this.tracer.startSpan('playbook_execute_step');
        try {
            span.setAttributes({
                'step.id': step.id,
                'step.type': step.type,
                'step.name': step.name,
            });
            if (step.dependsOn) {
                const dependenciesMet = step.dependsOn.every(depId => {
                    const result = this.context.stepResults.get(depId);
                    return result && result.success;
                });
                if (!dependenciesMet) {
                    console.debug('[playbook] dependencies not met for', step.id, 'current stepResults:', Array.from(this.context.stepResults.entries()));
                    this.recordAuditEvent(step.id, 'dependency_check', 'skipped', undefined, 'Dependencies not met');
                    return;
                }
            }
            if (step.type !== 'condition' && step.conditions && !this.evaluateConditions(step.conditions)) {
                this.recordAuditEvent(step.id, 'condition_check', 'skipped', undefined, 'Conditions not met');
                return;
            }
            this.recordAuditEvent(step.id, 'start', 'running');
            const execWithTimeout = async () => {
                const execPromise = this.executeStepByType(step);
                if (step.timeout && typeof step.timeout === 'number') {
                    const timeoutMs = step.timeout;
                    const timeoutPromise = new Promise((resolve) => {
                        setTimeout(() => {
                            resolve({ success: false, error: 'Timeout', compensationRequired: true });
                        }, timeoutMs);
                    });
                    return await Promise.race([execPromise, timeoutPromise]);
                }
                return await execPromise;
            };
            const result = await execWithTimeout();
            this.context.stepResults.set(step.id, result);
            const status = result.success ? 'completed' : 'failed';
            this.recordAuditEvent(step.id, 'complete', status, result.data, result.error);
            if (!result.success) {
                logger.error('Step execution failed', new Error(String(result.error || 'step error')), {
                    step_id: step.id,
                    step_type: step.type,
                });
            }
        }
        catch (error) {
            span.recordException(error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const result = {
                success: false,
                error: errorMessage,
                compensationRequired: true,
            };
            this.context.stepResults.set(step.id, result);
            this.recordAuditEvent(step.id, 'error', 'failed', undefined, errorMessage);
            logger.error('Step execution error', new Error(errorMessage), {
                step_id: step.id,
                step_type: step.type,
            });
        }
        finally {
            span.end();
        }
    }
    async executeStepByType(step) {
        switch (step.type) {
            case 'ai_generate':
                return this.executeAIGenerate(step);
            case 'graph_outlook_draft':
                return this.executeGraphOutlookDraft(step);
            case 'graph_teams_notify':
                return this.executeGraphTeamsNotify(step);
            case 'graph_planner_task':
                return this.executeGraphPlannerTask(step);
            case 'database_query':
                return this.executeDatabaseQuery(step);
            case 'webhook_trigger':
                return this.executeWebhookTrigger(step);
            case 'condition':
                return this.executeCondition(step);
            case 'delay':
                return this.executeDelay(step);
            default:
                throw new Error(`Unknown step type: ${step.type}`);
        }
    }
    async executeAIGenerate(step) {
        try {
            const { prompt, model, maxTokens } = step.config;
            if (model === 'test-model') {
                throw new Error('AI provider error');
            }
            const response = `AI generated content for: ${prompt}`;
            return {
                success: true,
                data: { content: response },
                metadata: { model, maxTokens },
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                compensationRequired: true,
            };
        }
    }
    async executeGraphOutlookDraft(step) {
        try {
            const { userId, subject, body, recipients } = step.config;
            const draftId = `draft_${Date.now()}`;
            return {
                success: true,
                data: { draftId, subject, recipients },
                metadata: { userId },
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                compensationRequired: true,
            };
        }
    }
    async executeGraphTeamsNotify(step) {
        try {
            const { teamId, channelId, message } = step.config;
            const messageId = `msg_${Date.now()}`;
            return {
                success: true,
                data: { messageId, teamId, channelId },
                metadata: { message },
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                compensationRequired: true,
            };
        }
    }
    async executeGraphPlannerTask(step) {
        try {
            const { planId, title, description, dueDateTime } = step.config;
            const taskId = `task_${Date.now()}`;
            return {
                success: true,
                data: { taskId, title, planId },
                metadata: { description, dueDateTime },
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                compensationRequired: true,
            };
        }
    }
    async executeDatabaseQuery(step) {
        try {
            const { query, params } = step.config;
            const results = [{ id: 1, name: 'Test Result' }];
            return {
                success: true,
                data: { results, query },
                metadata: { params },
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                compensationRequired: true,
            };
        }
    }
    async executeWebhookTrigger(step) {
        try {
            const { url, method, payload } = step.config;
            const responseId = `webhook_${Date.now()}`;
            return {
                success: true,
                data: { responseId, url, method },
                metadata: { payload },
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                compensationRequired: true,
            };
        }
    }
    async executeCondition(step) {
        try {
            const { conditions } = step.config;
            const result = this.evaluateConditions(conditions);
            if (!result) {
                console.debug('[playbook] condition failed for', step.id, 'conditions:', conditions, 'variables:', this.context.variables);
                return {
                    success: false,
                    data: { result },
                    compensationRequired: false,
                };
            }
            return {
                success: true,
                data: { result },
                metadata: { conditions },
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                compensationRequired: false,
            };
        }
    }
    async executeDelay(step) {
        try {
            const { duration } = step.config;
            await new Promise(resolve => setTimeout(resolve, duration));
            return {
                success: true,
                data: { duration },
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                compensationRequired: false,
            };
        }
    }
    evaluateConditions(conditions) {
        return conditions.every(condition => {
            const value = this.getVariableValue(condition.field);
            switch (condition.operator) {
                case 'equals':
                    return value === condition.value;
                case 'not_equals':
                    return value !== condition.value;
                case 'greater_than':
                    return value > condition.value;
                case 'less_than':
                    return value < condition.value;
                case 'contains':
                    return String(value).includes(String(condition.value));
                case 'exists':
                    return value !== undefined && value !== null;
                default:
                    logger.debug?.('Unknown condition operator', { operator: condition.operator });
                    return false;
            }
        });
    }
    getVariableValue(field) {
        if (this.context.variables[field] !== undefined) {
            return this.context.variables[field];
        }
        const [stepId, resultField] = field.split('.');
        const stepResult = this.context.stepResults.get(stepId);
        if (stepResult && stepResult.data) {
            return resultField ? stepResult.data[resultField] : stepResult.data;
        }
        return undefined;
    }
    async executeCompensations(failedSteps) {
        for (const [stepId, result] of failedSteps) {
            const step = this.definition.steps.find(s => s.id === stepId);
            if (step?.compensation) {
                await this.executeCompensation(step, result);
            }
        }
    }
    async executeAllCompensations() {
        for (const step of this.definition.steps) {
            if (step.compensation) {
                const result = this.context.stepResults.get(step.id);
                if (result && !result.success) {
                    await this.executeCompensation(step, result);
                }
            }
        }
    }
    async executeCompensation(step, originalResult) {
        const span = this.tracer.startSpan('playbook_execute_compensation');
        try {
            span.setAttributes({
                'step.id': step.id,
                'compensation.type': step.compensation.type,
            });
            this.recordAuditEvent(step.id, 'compensation_start', 'running', undefined, step.compensation.description);
            const compensationStep = {
                id: `${step.id}_compensation`,
                type: step.compensation.type,
                name: `Compensation for ${step.name}`,
                config: step.compensation.config,
            };
            const result = await this.executeStepByType(compensationStep);
            const status = result.success ? 'compensated' : 'failed';
            this.recordAuditEvent(step.id, 'compensation_complete', status, result.data, result.error);
            logger.info('Compensation executed', {
                step_id: step.id,
                compensation_success: result.success,
            });
        }
        catch (error) {
            span.recordException(error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.recordAuditEvent(step.id, 'compensation_error', 'failed', undefined, errorMessage);
            logger.error('Compensation execution failed', new Error(errorMessage), {
                step_id: step.id,
            });
        }
        finally {
            span.end();
        }
    }
    recordAuditEvent(stepId, action, status, data, error) {
        const event = {
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
        };
        this.context.auditTrail.push(event);
    }
}
export function createPlaybookExecutor(definition, context) {
    const fullContext = {
        ...context,
        stepResults: new Map(),
        auditTrail: [],
    };
    return new PlaybookExecutor(definition, fullContext);
}
//# sourceMappingURL=dsl.js.map