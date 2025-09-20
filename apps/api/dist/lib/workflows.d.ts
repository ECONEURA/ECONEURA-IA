import { z } from 'zod';
export declare const WorkflowTypeSchema: z.ZodEnum<["bpmn", "state_machine"]>;
export type WorkflowType = z.infer<typeof WorkflowTypeSchema>;
export declare const WorkflowStatusSchema: z.ZodEnum<["draft", "active", "inactive", "archived"]>;
export type WorkflowStatus = z.infer<typeof WorkflowStatusSchema>;
export declare const InstanceStatusSchema: z.ZodEnum<["running", "completed", "failed", "paused", "cancelled"]>;
export type InstanceStatus = z.infer<typeof InstanceStatusSchema>;
export declare const ActionTypeSchema: z.ZodEnum<["function", "http", "delay", "condition", "notification"]>;
export type ActionType = z.infer<typeof ActionTypeSchema>;
export declare const RetryStrategySchema: z.ZodEnum<["fixed", "exponential", "linear"]>;
export type RetryStrategy = z.infer<typeof RetryStrategySchema>;
export declare const BpmnElementTypeSchema: z.ZodEnum<["startEvent", "endEvent", "task", "gateway", "subprocess"]>;
export type BpmnElementType = z.infer<typeof BpmnElementTypeSchema>;
export declare const BpmnElementSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodEnum<["startEvent", "endEvent", "task", "gateway", "subprocess"]>;
    name: z.ZodString;
    x: z.ZodNumber;
    y: z.ZodNumber;
    properties: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    actions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    conditions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    type?: "task" | "startEvent" | "endEvent" | "gateway" | "subprocess";
    name?: string;
    id?: string;
    actions?: string[];
    conditions?: Record<string, string>;
    x?: number;
    y?: number;
    properties?: Record<string, any>;
}, {
    type?: "task" | "startEvent" | "endEvent" | "gateway" | "subprocess";
    name?: string;
    id?: string;
    actions?: string[];
    conditions?: Record<string, string>;
    x?: number;
    y?: number;
    properties?: Record<string, any>;
}>;
export declare const BpmnFlowSchema: z.ZodObject<{
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
export declare const BpmnWorkflowSchema: z.ZodObject<{
    elements: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodEnum<["startEvent", "endEvent", "task", "gateway", "subprocess"]>;
        name: z.ZodString;
        x: z.ZodNumber;
        y: z.ZodNumber;
        properties: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        actions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        conditions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        type?: "task" | "startEvent" | "endEvent" | "gateway" | "subprocess";
        name?: string;
        id?: string;
        actions?: string[];
        conditions?: Record<string, string>;
        x?: number;
        y?: number;
        properties?: Record<string, any>;
    }, {
        type?: "task" | "startEvent" | "endEvent" | "gateway" | "subprocess";
        name?: string;
        id?: string;
        actions?: string[];
        conditions?: Record<string, string>;
        x?: number;
        y?: number;
        properties?: Record<string, any>;
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
        type?: "task" | "startEvent" | "endEvent" | "gateway" | "subprocess";
        name?: string;
        id?: string;
        actions?: string[];
        conditions?: Record<string, string>;
        x?: number;
        y?: number;
        properties?: Record<string, any>;
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
        type?: "task" | "startEvent" | "endEvent" | "gateway" | "subprocess";
        name?: string;
        id?: string;
        actions?: string[];
        conditions?: Record<string, string>;
        x?: number;
        y?: number;
        properties?: Record<string, any>;
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
export declare const StateTypeSchema: z.ZodEnum<["initial", "intermediate", "final", "error"]>;
export type StateType = z.infer<typeof StateTypeSchema>;
export declare const StateSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    type: z.ZodEnum<["initial", "intermediate", "final", "error"]>;
    actions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    timeout: z.ZodOptional<z.ZodNumber>;
    properties: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    type?: "error" | "initial" | "intermediate" | "final";
    timeout?: number;
    name?: string;
    id?: string;
    actions?: string[];
    properties?: Record<string, any>;
}, {
    type?: "error" | "initial" | "intermediate" | "final";
    timeout?: number;
    name?: string;
    id?: string;
    actions?: string[];
    properties?: Record<string, any>;
}>;
export declare const TransitionSchema: z.ZodObject<{
    id: z.ZodString;
    from: z.ZodString;
    to: z.ZodString;
    event: z.ZodOptional<z.ZodString>;
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
export declare const StateMachineWorkflowSchema: z.ZodObject<{
    states: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        type: z.ZodEnum<["initial", "intermediate", "final", "error"]>;
        actions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        timeout: z.ZodOptional<z.ZodNumber>;
        properties: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        type?: "error" | "initial" | "intermediate" | "final";
        timeout?: number;
        name?: string;
        id?: string;
        actions?: string[];
        properties?: Record<string, any>;
    }, {
        type?: "error" | "initial" | "intermediate" | "final";
        timeout?: number;
        name?: string;
        id?: string;
        actions?: string[];
        properties?: Record<string, any>;
    }>, "many">;
    transitions: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        from: z.ZodString;
        to: z.ZodString;
        event: z.ZodOptional<z.ZodString>;
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
        type?: "error" | "initial" | "intermediate" | "final";
        timeout?: number;
        name?: string;
        id?: string;
        actions?: string[];
        properties?: Record<string, any>;
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
        type?: "error" | "initial" | "intermediate" | "final";
        timeout?: number;
        name?: string;
        id?: string;
        actions?: string[];
        properties?: Record<string, any>;
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
export declare const ActionSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    type: z.ZodEnum<["function", "http", "delay", "condition", "notification"]>;
    config: z.ZodRecord<z.ZodString, z.ZodAny>;
    order: z.ZodNumber;
    timeout: z.ZodOptional<z.ZodNumber>;
    retry: z.ZodOptional<z.ZodObject<{
        maxAttempts: z.ZodNumber;
        strategy: z.ZodEnum<["fixed", "exponential", "linear"]>;
        delay: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        delay?: number;
        strategy?: "fixed" | "linear" | "exponential";
        maxAttempts?: number;
    }, {
        delay?: number;
        strategy?: "fixed" | "linear" | "exponential";
        maxAttempts?: number;
    }>>;
}, "strip", z.ZodTypeAny, {
    type?: "function" | "delay" | "http" | "notification" | "condition";
    timeout?: number;
    name?: string;
    order?: number;
    config?: Record<string, any>;
    id?: string;
    retry?: {
        delay?: number;
        strategy?: "fixed" | "linear" | "exponential";
        maxAttempts?: number;
    };
}, {
    type?: "function" | "delay" | "http" | "notification" | "condition";
    timeout?: number;
    name?: string;
    order?: number;
    config?: Record<string, any>;
    id?: string;
    retry?: {
        delay?: number;
        strategy?: "fixed" | "linear" | "exponential";
        maxAttempts?: number;
    };
}>;
export declare const WorkflowMetadataSchema: z.ZodObject<{
    author: z.ZodOptional<z.ZodString>;
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
    id: z.ZodString;
    name: z.ZodString;
    type: z.ZodEnum<["bpmn", "state_machine"]>;
    status: z.ZodEnum<["draft", "active", "inactive", "archived"]>;
    version: z.ZodNumber;
    definition: z.ZodUnion<[z.ZodObject<{
        elements: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            type: z.ZodEnum<["startEvent", "endEvent", "task", "gateway", "subprocess"]>;
            name: z.ZodString;
            x: z.ZodNumber;
            y: z.ZodNumber;
            properties: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            actions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            conditions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            type?: "task" | "startEvent" | "endEvent" | "gateway" | "subprocess";
            name?: string;
            id?: string;
            actions?: string[];
            conditions?: Record<string, string>;
            x?: number;
            y?: number;
            properties?: Record<string, any>;
        }, {
            type?: "task" | "startEvent" | "endEvent" | "gateway" | "subprocess";
            name?: string;
            id?: string;
            actions?: string[];
            conditions?: Record<string, string>;
            x?: number;
            y?: number;
            properties?: Record<string, any>;
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
            type?: "task" | "startEvent" | "endEvent" | "gateway" | "subprocess";
            name?: string;
            id?: string;
            actions?: string[];
            conditions?: Record<string, string>;
            x?: number;
            y?: number;
            properties?: Record<string, any>;
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
            type?: "task" | "startEvent" | "endEvent" | "gateway" | "subprocess";
            name?: string;
            id?: string;
            actions?: string[];
            conditions?: Record<string, string>;
            x?: number;
            y?: number;
            properties?: Record<string, any>;
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
            type: z.ZodEnum<["initial", "intermediate", "final", "error"]>;
            actions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            timeout: z.ZodOptional<z.ZodNumber>;
            properties: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            type?: "error" | "initial" | "intermediate" | "final";
            timeout?: number;
            name?: string;
            id?: string;
            actions?: string[];
            properties?: Record<string, any>;
        }, {
            type?: "error" | "initial" | "intermediate" | "final";
            timeout?: number;
            name?: string;
            id?: string;
            actions?: string[];
            properties?: Record<string, any>;
        }>, "many">;
        transitions: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            from: z.ZodString;
            to: z.ZodString;
            event: z.ZodOptional<z.ZodString>;
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
            type?: "error" | "initial" | "intermediate" | "final";
            timeout?: number;
            name?: string;
            id?: string;
            actions?: string[];
            properties?: Record<string, any>;
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
            type?: "error" | "initial" | "intermediate" | "final";
            timeout?: number;
            name?: string;
            id?: string;
            actions?: string[];
            properties?: Record<string, any>;
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
        type: z.ZodEnum<["function", "http", "delay", "condition", "notification"]>;
        config: z.ZodRecord<z.ZodString, z.ZodAny>;
        order: z.ZodNumber;
        timeout: z.ZodOptional<z.ZodNumber>;
        retry: z.ZodOptional<z.ZodObject<{
            maxAttempts: z.ZodNumber;
            strategy: z.ZodEnum<["fixed", "exponential", "linear"]>;
            delay: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            delay?: number;
            strategy?: "fixed" | "linear" | "exponential";
            maxAttempts?: number;
        }, {
            delay?: number;
            strategy?: "fixed" | "linear" | "exponential";
            maxAttempts?: number;
        }>>;
    }, "strip", z.ZodTypeAny, {
        type?: "function" | "delay" | "http" | "notification" | "condition";
        timeout?: number;
        name?: string;
        order?: number;
        config?: Record<string, any>;
        id?: string;
        retry?: {
            delay?: number;
            strategy?: "fixed" | "linear" | "exponential";
            maxAttempts?: number;
        };
    }, {
        type?: "function" | "delay" | "http" | "notification" | "condition";
        timeout?: number;
        name?: string;
        order?: number;
        config?: Record<string, any>;
        id?: string;
        retry?: {
            delay?: number;
            strategy?: "fixed" | "linear" | "exponential";
            maxAttempts?: number;
        };
    }>, "many">;
    metadata: z.ZodObject<{
        author: z.ZodOptional<z.ZodString>;
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
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    type?: "bpmn" | "state_machine";
    status?: "active" | "inactive" | "archived" | "draft";
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
        timeout?: number;
        name?: string;
        order?: number;
        config?: Record<string, any>;
        id?: string;
        retry?: {
            delay?: number;
            strategy?: "fixed" | "linear" | "exponential";
            maxAttempts?: number;
        };
    }[];
    definition?: {
        elements?: {
            type?: "task" | "startEvent" | "endEvent" | "gateway" | "subprocess";
            name?: string;
            id?: string;
            actions?: string[];
            conditions?: Record<string, string>;
            x?: number;
            y?: number;
            properties?: Record<string, any>;
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
            type?: "error" | "initial" | "intermediate" | "final";
            timeout?: number;
            name?: string;
            id?: string;
            actions?: string[];
            properties?: Record<string, any>;
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
    status?: "active" | "inactive" | "archived" | "draft";
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
        timeout?: number;
        name?: string;
        order?: number;
        config?: Record<string, any>;
        id?: string;
        retry?: {
            delay?: number;
            strategy?: "fixed" | "linear" | "exponential";
            maxAttempts?: number;
        };
    }[];
    definition?: {
        elements?: {
            type?: "task" | "startEvent" | "endEvent" | "gateway" | "subprocess";
            name?: string;
            id?: string;
            actions?: string[];
            conditions?: Record<string, string>;
            x?: number;
            y?: number;
            properties?: Record<string, any>;
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
            type?: "error" | "initial" | "intermediate" | "final";
            timeout?: number;
            name?: string;
            id?: string;
            actions?: string[];
            properties?: Record<string, any>;
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
    id: z.ZodString;
    workflowId: z.ZodString;
    status: z.ZodEnum<["running", "completed", "failed", "paused", "cancelled"]>;
    context: z.ZodRecord<z.ZodString, z.ZodAny>;
    metadata: z.ZodRecord<z.ZodString, z.ZodAny>;
    currentElement: z.ZodOptional<z.ZodString>;
    currentState: z.ZodOptional<z.ZodString>;
    history: z.ZodArray<z.ZodObject<{
        timestamp: z.ZodDate;
        action: z.ZodString;
        message: z.ZodString;
        data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        message?: string;
        timestamp?: Date;
        data?: Record<string, any>;
        action?: string;
    }, {
        message?: string;
        timestamp?: Date;
        data?: Record<string, any>;
        action?: string;
    }>, "many">;
    startedAt: z.ZodDate;
    completedAt: z.ZodOptional<z.ZodDate>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    status?: "completed" | "failed" | "cancelled" | "running" | "paused";
    context?: Record<string, any>;
    history?: {
        message?: string;
        timestamp?: Date;
        data?: Record<string, any>;
        action?: string;
    }[];
    metadata?: Record<string, any>;
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    completedAt?: Date;
    workflowId?: string;
    currentElement?: string;
    currentState?: string;
    startedAt?: Date;
}, {
    status?: "completed" | "failed" | "cancelled" | "running" | "paused";
    context?: Record<string, any>;
    history?: {
        message?: string;
        timestamp?: Date;
        data?: Record<string, any>;
        action?: string;
    }[];
    metadata?: Record<string, any>;
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    completedAt?: Date;
    workflowId?: string;
    currentElement?: string;
    currentState?: string;
    startedAt?: Date;
}>;
export interface IWorkflowEngine {
    createWorkflow(workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>): Promise<Workflow>;
    getWorkflow(id: string): Promise<Workflow | null>;
    updateWorkflow(id: string, updates: Partial<Workflow>): Promise<Workflow>;
    deleteWorkflow(id: string): Promise<void>;
    listWorkflows(filters?: WorkflowFilters): Promise<Workflow[]>;
    startWorkflow(workflowId: string, context?: Record<string, any>, metadata?: Record<string, any>): Promise<WorkflowInstance>;
    getInstance(instanceId: string): Promise<WorkflowInstance | null>;
    listInstances(filters?: InstanceFilters): Promise<WorkflowInstance[]>;
    pauseInstance(instanceId: string): Promise<void>;
    resumeInstance(instanceId: string): Promise<void>;
    cancelInstance(instanceId: string): Promise<void>;
    executeAction(instanceId: string, actionId: string): Promise<void>;
    getStats(): Promise<WorkflowStats>;
}
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
    fromDate?: Date;
    toDate?: Date;
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
        timestamp: Date;
    }>;
}
export type Workflow = z.infer<typeof WorkflowSchema>;
export type WorkflowInstance = z.infer<typeof WorkflowInstanceSchema>;
export type Action = z.infer<typeof ActionSchema>;
export type BpmnWorkflow = z.infer<typeof BpmnWorkflowSchema>;
export type StateMachineWorkflow = z.infer<typeof StateMachineWorkflowSchema>;
declare class WorkflowEngineImpl implements IWorkflowEngine {
    private workflows;
    private instances;
    private executionQueue;
    constructor();
    createWorkflow(workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>): Promise<Workflow>;
    getWorkflow(id: string): Promise<Workflow | null>;
    updateWorkflow(id: string, updates: Partial<Workflow>): Promise<Workflow>;
    deleteWorkflow(id: string): Promise<void>;
    listWorkflows(filters?: WorkflowFilters): Promise<Workflow[]>;
    startWorkflow(workflowId: string, context?: Record<string, any>, metadata?: Record<string, any>): Promise<WorkflowInstance>;
    getInstance(instanceId: string): Promise<WorkflowInstance | null>;
    listInstances(filters?: InstanceFilters): Promise<WorkflowInstance[]>;
    pauseInstance(instanceId: string): Promise<void>;
    resumeInstance(instanceId: string): Promise<void>;
    cancelInstance(instanceId: string): Promise<void>;
    executeAction(instanceId: string, actionId: string): Promise<void>;
    private executeNextAction;
    private executeActionInternal;
    private executeFunctionAction;
    private executeHttpAction;
    private executeDelayAction;
    private executeConditionAction;
    private executeNotificationAction;
    private evaluateCondition;
    private handleRetry;
    private calculateRetryDelay;
    private advanceWorkflow;
    private advanceBpmnWorkflow;
    private advanceStateMachineWorkflow;
    private startExecutionLoop;
    private processExecutionQueue;
    getStats(): Promise<WorkflowStats>;
}
export declare const workflowEngine: WorkflowEngineImpl;
export {};
//# sourceMappingURL=workflows.d.ts.map