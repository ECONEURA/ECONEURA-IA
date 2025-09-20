import { z } from 'zod';
export declare const WorkflowElementSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodEnum<["startEvent", "endEvent", "task", "gateway", "intermediateEvent"]>;
    name: z.ZodString;
    x: z.ZodOptional<z.ZodNumber>;
    y: z.ZodOptional<z.ZodNumber>;
    actions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    type?: "task" | "startEvent" | "endEvent" | "gateway" | "intermediateEvent";
    name?: string;
    id?: string;
    actions?: string[];
    x?: number;
    y?: number;
}, {
    type?: "task" | "startEvent" | "endEvent" | "gateway" | "intermediateEvent";
    name?: string;
    id?: string;
    actions?: string[];
    x?: number;
    y?: number;
}>;
export declare const WorkflowFlowSchema: z.ZodObject<{
    id: z.ZodString;
    source: z.ZodString;
    target: z.ZodString;
    condition: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id?: string;
    source?: string;
    condition?: string;
    target?: string;
}, {
    id?: string;
    source?: string;
    condition?: string;
    target?: string;
}>;
export declare const BPMNDefinitionSchema: z.ZodObject<{
    elements: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodEnum<["startEvent", "endEvent", "task", "gateway", "intermediateEvent"]>;
        name: z.ZodString;
        x: z.ZodOptional<z.ZodNumber>;
        y: z.ZodOptional<z.ZodNumber>;
        actions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        type?: "task" | "startEvent" | "endEvent" | "gateway" | "intermediateEvent";
        name?: string;
        id?: string;
        actions?: string[];
        x?: number;
        y?: number;
    }, {
        type?: "task" | "startEvent" | "endEvent" | "gateway" | "intermediateEvent";
        name?: string;
        id?: string;
        actions?: string[];
        x?: number;
        y?: number;
    }>, "many">;
    flows: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        source: z.ZodString;
        target: z.ZodString;
        condition: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id?: string;
        source?: string;
        condition?: string;
        target?: string;
    }, {
        id?: string;
        source?: string;
        condition?: string;
        target?: string;
    }>, "many">;
    startElement: z.ZodString;
    endElements: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    elements?: {
        type?: "task" | "startEvent" | "endEvent" | "gateway" | "intermediateEvent";
        name?: string;
        id?: string;
        actions?: string[];
        x?: number;
        y?: number;
    }[];
    flows?: {
        id?: string;
        source?: string;
        condition?: string;
        target?: string;
    }[];
    startElement?: string;
    endElements?: string[];
}, {
    elements?: {
        type?: "task" | "startEvent" | "endEvent" | "gateway" | "intermediateEvent";
        name?: string;
        id?: string;
        actions?: string[];
        x?: number;
        y?: number;
    }[];
    flows?: {
        id?: string;
        source?: string;
        condition?: string;
        target?: string;
    }[];
    startElement?: string;
    endElements?: string[];
}>;
export declare const StateMachineStateSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    type: z.ZodEnum<["initial", "intermediate", "final"]>;
    actions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    type?: "initial" | "intermediate" | "final";
    name?: string;
    id?: string;
    actions?: string[];
}, {
    type?: "initial" | "intermediate" | "final";
    name?: string;
    id?: string;
    actions?: string[];
}>;
export declare const StateMachineTransitionSchema: z.ZodObject<{
    id: z.ZodString;
    from: z.ZodString;
    to: z.ZodString;
    event: z.ZodString;
    condition: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id?: string;
    from?: string;
    event?: string;
    condition?: string;
    to?: string;
}, {
    id?: string;
    from?: string;
    event?: string;
    condition?: string;
    to?: string;
}>;
export declare const StateMachineDefinitionSchema: z.ZodObject<{
    states: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        type: z.ZodEnum<["initial", "intermediate", "final"]>;
        actions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        type?: "initial" | "intermediate" | "final";
        name?: string;
        id?: string;
        actions?: string[];
    }, {
        type?: "initial" | "intermediate" | "final";
        name?: string;
        id?: string;
        actions?: string[];
    }>, "many">;
    transitions: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        from: z.ZodString;
        to: z.ZodString;
        event: z.ZodString;
        condition: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id?: string;
        from?: string;
        event?: string;
        condition?: string;
        to?: string;
    }, {
        id?: string;
        from?: string;
        event?: string;
        condition?: string;
        to?: string;
    }>, "many">;
    initialState: z.ZodString;
    finalStates: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    states?: {
        type?: "initial" | "intermediate" | "final";
        name?: string;
        id?: string;
        actions?: string[];
    }[];
    transitions?: {
        id?: string;
        from?: string;
        event?: string;
        condition?: string;
        to?: string;
    }[];
    initialState?: string;
    finalStates?: string[];
}, {
    states?: {
        type?: "initial" | "intermediate" | "final";
        name?: string;
        id?: string;
        actions?: string[];
    }[];
    transitions?: {
        id?: string;
        from?: string;
        event?: string;
        condition?: string;
        to?: string;
    }[];
    initialState?: string;
    finalStates?: string[];
}>;
export declare const WorkflowActionSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    type: z.ZodEnum<["function", "http", "notification", "delay", "condition"]>;
    config: z.ZodRecord<z.ZodString, z.ZodAny>;
    order: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type?: "function" | "delay" | "http" | "notification" | "condition";
    name?: string;
    order?: number;
    config?: Record<string, any>;
    id?: string;
}, {
    type?: "function" | "delay" | "http" | "notification" | "condition";
    name?: string;
    order?: number;
    config?: Record<string, any>;
    id?: string;
}>;
export declare const WorkflowMetadataSchema: z.ZodObject<{
    author: z.ZodString;
    category: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    priority: z.ZodOptional<z.ZodNumber>;
    timeout: z.ZodOptional<z.ZodNumber>;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    timeout?: number;
    tags?: string[];
    description?: string;
    category?: string;
    priority?: number;
    author?: string;
}, {
    timeout?: number;
    tags?: string[];
    description?: string;
    category?: string;
    priority?: number;
    author?: string;
}>;
export declare const WorkflowSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    type: z.ZodEnum<["bpmn", "state_machine"]>;
    status: z.ZodEnum<["active", "inactive", "draft"]>;
    version: z.ZodNumber;
    definition: z.ZodUnion<[z.ZodObject<{
        elements: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            type: z.ZodEnum<["startEvent", "endEvent", "task", "gateway", "intermediateEvent"]>;
            name: z.ZodString;
            x: z.ZodOptional<z.ZodNumber>;
            y: z.ZodOptional<z.ZodNumber>;
            actions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            type?: "task" | "startEvent" | "endEvent" | "gateway" | "intermediateEvent";
            name?: string;
            id?: string;
            actions?: string[];
            x?: number;
            y?: number;
        }, {
            type?: "task" | "startEvent" | "endEvent" | "gateway" | "intermediateEvent";
            name?: string;
            id?: string;
            actions?: string[];
            x?: number;
            y?: number;
        }>, "many">;
        flows: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            source: z.ZodString;
            target: z.ZodString;
            condition: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id?: string;
            source?: string;
            condition?: string;
            target?: string;
        }, {
            id?: string;
            source?: string;
            condition?: string;
            target?: string;
        }>, "many">;
        startElement: z.ZodString;
        endElements: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        elements?: {
            type?: "task" | "startEvent" | "endEvent" | "gateway" | "intermediateEvent";
            name?: string;
            id?: string;
            actions?: string[];
            x?: number;
            y?: number;
        }[];
        flows?: {
            id?: string;
            source?: string;
            condition?: string;
            target?: string;
        }[];
        startElement?: string;
        endElements?: string[];
    }, {
        elements?: {
            type?: "task" | "startEvent" | "endEvent" | "gateway" | "intermediateEvent";
            name?: string;
            id?: string;
            actions?: string[];
            x?: number;
            y?: number;
        }[];
        flows?: {
            id?: string;
            source?: string;
            condition?: string;
            target?: string;
        }[];
        startElement?: string;
        endElements?: string[];
    }>, z.ZodObject<{
        states: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            type: z.ZodEnum<["initial", "intermediate", "final"]>;
            actions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            type?: "initial" | "intermediate" | "final";
            name?: string;
            id?: string;
            actions?: string[];
        }, {
            type?: "initial" | "intermediate" | "final";
            name?: string;
            id?: string;
            actions?: string[];
        }>, "many">;
        transitions: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            from: z.ZodString;
            to: z.ZodString;
            event: z.ZodString;
            condition: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id?: string;
            from?: string;
            event?: string;
            condition?: string;
            to?: string;
        }, {
            id?: string;
            from?: string;
            event?: string;
            condition?: string;
            to?: string;
        }>, "many">;
        initialState: z.ZodString;
        finalStates: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        states?: {
            type?: "initial" | "intermediate" | "final";
            name?: string;
            id?: string;
            actions?: string[];
        }[];
        transitions?: {
            id?: string;
            from?: string;
            event?: string;
            condition?: string;
            to?: string;
        }[];
        initialState?: string;
        finalStates?: string[];
    }, {
        states?: {
            type?: "initial" | "intermediate" | "final";
            name?: string;
            id?: string;
            actions?: string[];
        }[];
        transitions?: {
            id?: string;
            from?: string;
            event?: string;
            condition?: string;
            to?: string;
        }[];
        initialState?: string;
        finalStates?: string[];
    }>]>;
    actions: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        type: z.ZodEnum<["function", "http", "notification", "delay", "condition"]>;
        config: z.ZodRecord<z.ZodString, z.ZodAny>;
        order: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type?: "function" | "delay" | "http" | "notification" | "condition";
        name?: string;
        order?: number;
        config?: Record<string, any>;
        id?: string;
    }, {
        type?: "function" | "delay" | "http" | "notification" | "condition";
        name?: string;
        order?: number;
        config?: Record<string, any>;
        id?: string;
    }>, "many">;
    metadata: z.ZodObject<{
        author: z.ZodString;
        category: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        priority: z.ZodOptional<z.ZodNumber>;
        timeout: z.ZodOptional<z.ZodNumber>;
        description: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        timeout?: number;
        tags?: string[];
        description?: string;
        category?: string;
        priority?: number;
        author?: string;
    }, {
        timeout?: number;
        tags?: string[];
        description?: string;
        category?: string;
        priority?: number;
        author?: string;
    }>;
    createdAt: z.ZodOptional<z.ZodDate>;
    updatedAt: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    type?: "bpmn" | "state_machine";
    status?: "active" | "inactive" | "draft";
    version?: number;
    name?: string;
    metadata?: {
        timeout?: number;
        tags?: string[];
        description?: string;
        category?: string;
        priority?: number;
        author?: string;
    };
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    actions?: {
        type?: "function" | "delay" | "http" | "notification" | "condition";
        name?: string;
        order?: number;
        config?: Record<string, any>;
        id?: string;
    }[];
    definition?: {
        elements?: {
            type?: "task" | "startEvent" | "endEvent" | "gateway" | "intermediateEvent";
            name?: string;
            id?: string;
            actions?: string[];
            x?: number;
            y?: number;
        }[];
        flows?: {
            id?: string;
            source?: string;
            condition?: string;
            target?: string;
        }[];
        startElement?: string;
        endElements?: string[];
    } | {
        states?: {
            type?: "initial" | "intermediate" | "final";
            name?: string;
            id?: string;
            actions?: string[];
        }[];
        transitions?: {
            id?: string;
            from?: string;
            event?: string;
            condition?: string;
            to?: string;
        }[];
        initialState?: string;
        finalStates?: string[];
    };
}, {
    type?: "bpmn" | "state_machine";
    status?: "active" | "inactive" | "draft";
    version?: number;
    name?: string;
    metadata?: {
        timeout?: number;
        tags?: string[];
        description?: string;
        category?: string;
        priority?: number;
        author?: string;
    };
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    actions?: {
        type?: "function" | "delay" | "http" | "notification" | "condition";
        name?: string;
        order?: number;
        config?: Record<string, any>;
        id?: string;
    }[];
    definition?: {
        elements?: {
            type?: "task" | "startEvent" | "endEvent" | "gateway" | "intermediateEvent";
            name?: string;
            id?: string;
            actions?: string[];
            x?: number;
            y?: number;
        }[];
        flows?: {
            id?: string;
            source?: string;
            condition?: string;
            target?: string;
        }[];
        startElement?: string;
        endElements?: string[];
    } | {
        states?: {
            type?: "initial" | "intermediate" | "final";
            name?: string;
            id?: string;
            actions?: string[];
        }[];
        transitions?: {
            id?: string;
            from?: string;
            event?: string;
            condition?: string;
            to?: string;
        }[];
        initialState?: string;
        finalStates?: string[];
    };
}>;
export declare const WorkflowInstanceSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    workflowId: z.ZodString;
    status: z.ZodEnum<["running", "paused", "completed", "failed", "cancelled"]>;
    currentElement: z.ZodOptional<z.ZodString>;
    currentState: z.ZodOptional<z.ZodString>;
    context: z.ZodRecord<z.ZodString, z.ZodAny>;
    metadata: z.ZodRecord<z.ZodString, z.ZodAny>;
    startedAt: z.ZodOptional<z.ZodDate>;
    completedAt: z.ZodOptional<z.ZodDate>;
    executionHistory: z.ZodOptional<z.ZodArray<z.ZodObject<{
        timestamp: z.ZodDate;
        action: z.ZodString;
        status: z.ZodEnum<["success", "failed", "skipped"]>;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        status?: "success" | "failed" | "skipped";
        timestamp?: Date;
        details?: Record<string, any>;
        action?: string;
    }, {
        status?: "success" | "failed" | "skipped";
        timestamp?: Date;
        details?: Record<string, any>;
        action?: string;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    status?: "completed" | "failed" | "cancelled" | "running" | "paused";
    context?: Record<string, any>;
    metadata?: Record<string, any>;
    id?: string;
    completedAt?: Date;
    workflowId?: string;
    currentElement?: string;
    currentState?: string;
    startedAt?: Date;
    executionHistory?: {
        status?: "success" | "failed" | "skipped";
        timestamp?: Date;
        details?: Record<string, any>;
        action?: string;
    }[];
}, {
    status?: "completed" | "failed" | "cancelled" | "running" | "paused";
    context?: Record<string, any>;
    metadata?: Record<string, any>;
    id?: string;
    completedAt?: Date;
    workflowId?: string;
    currentElement?: string;
    currentState?: string;
    startedAt?: Date;
    executionHistory?: {
        status?: "success" | "failed" | "skipped";
        timestamp?: Date;
        details?: Record<string, any>;
        action?: string;
    }[];
}>;
export type WorkflowElement = z.infer<typeof WorkflowElementSchema>;
export type WorkflowFlow = z.infer<typeof WorkflowFlowSchema>;
export type BPMNDefinition = z.infer<typeof BPMNDefinitionSchema>;
export type StateMachineState = z.infer<typeof StateMachineStateSchema>;
export type StateMachineTransition = z.infer<typeof StateMachineTransitionSchema>;
export type StateMachineDefinition = z.infer<typeof StateMachineDefinitionSchema>;
export type WorkflowAction = z.infer<typeof WorkflowActionSchema>;
export type WorkflowMetadata = z.infer<typeof WorkflowMetadataSchema>;
export type Workflow = z.infer<typeof WorkflowSchema>;
export type WorkflowInstance = z.infer<typeof WorkflowInstanceSchema>;
export declare class WorkflowsService {
    private workflows;
    private instances;
    private executionQueue;
    constructor();
    private initializeDefaultWorkflows;
    getWorkflows(filters?: {
        type?: string;
        status?: string;
    }): Promise<Workflow[]>;
    getWorkflow(id: string): Promise<Workflow | null>;
    createWorkflow(workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>): Promise<Workflow>;
    updateWorkflow(id: string, updates: Partial<Workflow>): Promise<Workflow | null>;
    deleteWorkflow(id: string): Promise<boolean>;
    getInstances(filters?: {
        status?: string;
        workflowId?: string;
    }): Promise<WorkflowInstance[]>;
    getInstance(id: string): Promise<WorkflowInstance | null>;
    startWorkflow(workflowId: string, context: Record<string, any>, metadata: Record<string, any>): Promise<WorkflowInstance>;
    pauseInstance(instanceId: string): Promise<WorkflowInstance | null>;
    resumeInstance(instanceId: string): Promise<WorkflowInstance | null>;
    cancelInstance(instanceId: string): Promise<WorkflowInstance | null>;
    executeAction(instanceId: string, actionId: string): Promise<{
        success: boolean;
        result?: any;
        error?: string;
    }>;
    private executeInitialActions;
    private executeActionLogic;
    private executeFunctionAction;
    private executeHttpAction;
    private executeNotificationAction;
    private executeDelayAction;
    private executeConditionAction;
    private processTemplate;
    private evaluateCondition;
    getStats(): Promise<{
        totalWorkflows: number;
        totalInstances: number;
        workflowsByType: Record<string, number>;
        instancesByStatus: Record<string, number>;
        averageExecutionTime: number;
        successRate: number;
    }>;
    validateWorkflow(workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>): Promise<{
        isValid: boolean;
        errors: string[];
        warnings: string[];
    }>;
}
export declare const workflowsService: WorkflowsService;
//# sourceMappingURL=workflows.service.d.ts.map