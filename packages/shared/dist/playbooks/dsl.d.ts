import { z } from 'zod';
export declare const StepTypeSchema: z.ZodEnum<["ai_generate", "graph_outlook_draft", "graph_teams_notify", "graph_planner_task", "database_query", "webhook_trigger", "condition", "delay", "compensation"]>;
export type StepType = z.infer<typeof StepTypeSchema>;
export declare const StepStatusSchema: z.ZodEnum<["pending", "running", "completed", "failed", "compensated", "skipped"]>;
export type StepStatus = z.infer<typeof StepStatusSchema>;
export interface StepResult {
    success: boolean;
    data?: any;
    error?: string;
    compensationRequired?: boolean;
    metadata?: Record<string, any>;
}
export interface StepDefinition {
    id: string;
    type: StepType;
    name: string;
    description?: string;
    config: Record<string, any>;
    conditions?: Condition[];
    compensation?: CompensationStep;
    timeout?: number;
    retries?: number;
    dependsOn?: string[];
}
export interface Condition {
    field: string;
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'exists';
    value: any;
}
export interface CompensationStep {
    type: StepType;
    config: Record<string, any>;
    description: string;
}
export interface PlaybookDefinition {
    id: string;
    name: string;
    description: string;
    version: string;
    steps: StepDefinition[];
    variables?: Record<string, any>;
    timeout?: number;
    maxRetries?: number;
}
export interface PlaybookContext {
    orgId: string;
    userId: string;
    requestId: string;
    variables: Record<string, any>;
    stepResults: Map<string, StepResult>;
    auditTrail: AuditEvent[];
}
export interface AuditEvent {
    timestamp: Date;
    stepId: string;
    action: string;
    status: StepStatus;
    data?: any;
    error?: string;
    metadata?: Record<string, any>;
}
export declare class PlaybookExecutor {
    private tracer;
    private context;
    private definition;
    constructor(definition: PlaybookDefinition, context: PlaybookContext);
    execute(): Promise<{
        success: boolean;
        results: Map<string, StepResult>;
        auditTrail: AuditEvent[];
    }>;
    private executeStep;
    private executeStepByType;
    private executeAIGenerate;
    private executeGraphOutlookDraft;
    private executeGraphTeamsNotify;
    private executeGraphPlannerTask;
    private executeDatabaseQuery;
    private executeWebhookTrigger;
    private executeCondition;
    private executeDelay;
    private evaluateConditions;
    private getVariableValue;
    private executeCompensations;
    private executeAllCompensations;
    private executeCompensation;
    private recordAuditEvent;
}
export declare function createPlaybookExecutor(definition: PlaybookDefinition, context: Omit<PlaybookContext, 'stepResults' | 'auditTrail'>): PlaybookExecutor;
//# sourceMappingURL=dsl.d.ts.map