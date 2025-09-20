import { z } from 'zod';
export declare const AgentDefinitionSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    category: z.ZodEnum<["ventas", "marketing", "operaciones", "finanzas", "soporte_qa", "ejecutivo"]>;
    description: z.ZodString;
    costHint: z.ZodEnum<["low", "medium", "high"]>;
    inputs: z.ZodRecord<z.ZodString, z.ZodString>;
    outputs: z.ZodRecord<z.ZodString, z.ZodString>;
    dependencies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    timeoutMs: z.ZodDefault<z.ZodNumber>;
    retryCount: z.ZodDefault<z.ZodNumber>;
    priority: z.ZodDefault<z.ZodEnum<["low", "medium", "high", "critical"]>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    version: z.ZodDefault<z.ZodString>;
    enabled: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    version?: string;
    name?: string;
    id?: string;
    tags?: string[];
    description?: string;
    category?: "ventas" | "finanzas" | "marketing" | "operaciones" | "soporte_qa" | "ejecutivo";
    priority?: "critical" | "low" | "medium" | "high";
    enabled?: boolean;
    retryCount?: number;
    dependencies?: string[];
    timeoutMs?: number;
    costHint?: "low" | "medium" | "high";
    inputs?: Record<string, string>;
    outputs?: Record<string, string>;
}, {
    version?: string;
    name?: string;
    id?: string;
    tags?: string[];
    description?: string;
    category?: "ventas" | "finanzas" | "marketing" | "operaciones" | "soporte_qa" | "ejecutivo";
    priority?: "critical" | "low" | "medium" | "high";
    enabled?: boolean;
    retryCount?: number;
    dependencies?: string[];
    timeoutMs?: number;
    costHint?: "low" | "medium" | "high";
    inputs?: Record<string, string>;
    outputs?: Record<string, string>;
}>;
export type AgentDefinition = z.infer<typeof AgentDefinitionSchema>;
export declare const AgentExecutionContextSchema: z.ZodObject<{
    orgId: z.ZodString;
    userId: z.ZodString;
    correlationId: z.ZodString;
    idempotencyKey: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    budget: z.ZodOptional<z.ZodNumber>;
    priority: z.ZodOptional<z.ZodEnum<["low", "medium", "high", "critical"]>>;
}, "strip", z.ZodTypeAny, {
    userId?: string;
    metadata?: Record<string, any>;
    orgId?: string;
    correlationId?: string;
    idempotencyKey?: string;
    priority?: "critical" | "low" | "medium" | "high";
    budget?: number;
}, {
    userId?: string;
    metadata?: Record<string, any>;
    orgId?: string;
    correlationId?: string;
    idempotencyKey?: string;
    priority?: "critical" | "low" | "medium" | "high";
    budget?: number;
}>;
export type AgentExecutionContext = z.infer<typeof AgentExecutionContextSchema>;
export declare const AgentExecutionRequestSchema: z.ZodObject<{
    agentId: z.ZodString;
    inputs: z.ZodRecord<z.ZodString, z.ZodAny>;
    context: z.ZodObject<{
        orgId: z.ZodString;
        userId: z.ZodString;
        correlationId: z.ZodString;
        idempotencyKey: z.ZodOptional<z.ZodString>;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        budget: z.ZodOptional<z.ZodNumber>;
        priority: z.ZodOptional<z.ZodEnum<["low", "medium", "high", "critical"]>>;
    }, "strip", z.ZodTypeAny, {
        userId?: string;
        metadata?: Record<string, any>;
        orgId?: string;
        correlationId?: string;
        idempotencyKey?: string;
        priority?: "critical" | "low" | "medium" | "high";
        budget?: number;
    }, {
        userId?: string;
        metadata?: Record<string, any>;
        orgId?: string;
        correlationId?: string;
        idempotencyKey?: string;
        priority?: "critical" | "low" | "medium" | "high";
        budget?: number;
    }>;
}, "strip", z.ZodTypeAny, {
    context?: {
        userId?: string;
        metadata?: Record<string, any>;
        orgId?: string;
        correlationId?: string;
        idempotencyKey?: string;
        priority?: "critical" | "low" | "medium" | "high";
        budget?: number;
    };
    agentId?: string;
    inputs?: Record<string, any>;
}, {
    context?: {
        userId?: string;
        metadata?: Record<string, any>;
        orgId?: string;
        correlationId?: string;
        idempotencyKey?: string;
        priority?: "critical" | "low" | "medium" | "high";
        budget?: number;
    };
    agentId?: string;
    inputs?: Record<string, any>;
}>;
export type AgentExecutionRequest = z.infer<typeof AgentExecutionRequestSchema>;
export declare const AgentExecutionResultSchema: z.ZodObject<{
    id: z.ZodString;
    agentId: z.ZodString;
    status: z.ZodEnum<["pending", "running", "completed", "failed", "cancelled"]>;
    inputs: z.ZodRecord<z.ZodString, z.ZodAny>;
    outputs: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    context: z.ZodObject<{
        orgId: z.ZodString;
        userId: z.ZodString;
        correlationId: z.ZodString;
        idempotencyKey: z.ZodOptional<z.ZodString>;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        budget: z.ZodOptional<z.ZodNumber>;
        priority: z.ZodOptional<z.ZodEnum<["low", "medium", "high", "critical"]>>;
    }, "strip", z.ZodTypeAny, {
        userId?: string;
        metadata?: Record<string, any>;
        orgId?: string;
        correlationId?: string;
        idempotencyKey?: string;
        priority?: "critical" | "low" | "medium" | "high";
        budget?: number;
    }, {
        userId?: string;
        metadata?: Record<string, any>;
        orgId?: string;
        correlationId?: string;
        idempotencyKey?: string;
        priority?: "critical" | "low" | "medium" | "high";
        budget?: number;
    }>;
    startedAt: z.ZodString;
    completedAt: z.ZodOptional<z.ZodString>;
    costEur: z.ZodOptional<z.ZodNumber>;
    executionTimeMs: z.ZodOptional<z.ZodNumber>;
    error: z.ZodOptional<z.ZodString>;
    retryCount: z.ZodDefault<z.ZodNumber>;
    version: z.ZodString;
}, "strip", z.ZodTypeAny, {
    error?: string;
    status?: "pending" | "completed" | "failed" | "cancelled" | "running";
    context?: {
        userId?: string;
        metadata?: Record<string, any>;
        orgId?: string;
        correlationId?: string;
        idempotencyKey?: string;
        priority?: "critical" | "low" | "medium" | "high";
        budget?: number;
    };
    version?: string;
    id?: string;
    completedAt?: string;
    costEur?: number;
    startedAt?: string;
    retryCount?: number;
    agentId?: string;
    inputs?: Record<string, any>;
    outputs?: Record<string, any>;
    executionTimeMs?: number;
}, {
    error?: string;
    status?: "pending" | "completed" | "failed" | "cancelled" | "running";
    context?: {
        userId?: string;
        metadata?: Record<string, any>;
        orgId?: string;
        correlationId?: string;
        idempotencyKey?: string;
        priority?: "critical" | "low" | "medium" | "high";
        budget?: number;
    };
    version?: string;
    id?: string;
    completedAt?: string;
    costEur?: number;
    startedAt?: string;
    retryCount?: number;
    agentId?: string;
    inputs?: Record<string, any>;
    outputs?: Record<string, any>;
    executionTimeMs?: number;
}>;
export type AgentExecutionResult = z.infer<typeof AgentExecutionResultSchema>;
export declare const AgentHealthStatusSchema: z.ZodObject<{
    agentId: z.ZodString;
    status: z.ZodEnum<["healthy", "degraded", "unhealthy"]>;
    lastExecution: z.ZodOptional<z.ZodString>;
    successRate: z.ZodNumber;
    avgExecutionTime: z.ZodNumber;
    avgCost: z.ZodNumber;
    errorRate: z.ZodNumber;
    lastError: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status?: "healthy" | "unhealthy" | "degraded";
    updatedAt?: string;
    errorRate?: number;
    successRate?: number;
    agentId?: string;
    lastExecution?: string;
    avgExecutionTime?: number;
    avgCost?: number;
    lastError?: string;
}, {
    status?: "healthy" | "unhealthy" | "degraded";
    updatedAt?: string;
    errorRate?: number;
    successRate?: number;
    agentId?: string;
    lastExecution?: string;
    avgExecutionTime?: number;
    avgCost?: number;
    lastError?: string;
}>;
export type AgentHealthStatus = z.infer<typeof AgentHealthStatusSchema>;
export declare class AIAgentsRegistryService {
    private agents;
    private healthStatus;
    private executionHistory;
    private aiRouter;
    private activeExecutions;
    constructor();
    private initializeAgents;
    getAgents(): AgentDefinition[];
    getAgentsByCategory(category: string): AgentDefinition[];
    getAgent(agentId: string): AgentDefinition | undefined;
    executeAgent(request: AgentExecutionRequest): Promise<AgentExecutionResult>;
    getAgentHealth(agentId: string): AgentHealthStatus | undefined;
    getAllHealthStatuses(): AgentHealthStatus[];
    getExecutionHistory(agentId: string, limit?: number): AgentExecutionResult[];
    getActiveExecutions(): AgentExecutionResult[];
    private startHealthMonitoring;
    private updateAllHealthStatuses;
    private updateHealthStatus;
    private buildAgentPrompt;
    private processAgentOutputs;
    private estimateTokens;
    private generateExecutionId;
}
export declare const aiAgentsRegistry: AIAgentsRegistryService;
//# sourceMappingURL=ai-agents-registry.service.d.ts.map