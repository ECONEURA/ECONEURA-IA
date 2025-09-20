import { z } from 'zod';
export declare const AgentSchema: z.ZodObject<{
    department: z.ZodString;
    department_key: z.ZodString;
    type: z.ZodUnion<[z.ZodLiteral<"agent">, z.ZodLiteral<"director">]>;
    agent_key: z.ZodString;
    agent_name: z.ZodString;
    hitl: z.ZodDefault<z.ZodBoolean>;
    SLA_minutes: z.ZodDefault<z.ZodNumber>;
    make_scenario_id: z.ZodOptional<z.ZodString>;
    approval_tool: z.ZodOptional<z.ZodString>;
    budget_weight: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    type?: "director" | "agent";
    agent_key?: string;
    department?: string;
    department_key?: string;
    agent_name?: string;
    hitl?: boolean;
    SLA_minutes?: number;
    make_scenario_id?: string;
    approval_tool?: string;
    budget_weight?: number;
}, {
    type?: "director" | "agent";
    agent_key?: string;
    department?: string;
    department_key?: string;
    agent_name?: string;
    hitl?: boolean;
    SLA_minutes?: number;
    make_scenario_id?: string;
    approval_tool?: string;
    budget_weight?: number;
}>;
export declare const AgentsArray: z.ZodArray<z.ZodObject<{
    department: z.ZodString;
    department_key: z.ZodString;
    type: z.ZodUnion<[z.ZodLiteral<"agent">, z.ZodLiteral<"director">]>;
    agent_key: z.ZodString;
    agent_name: z.ZodString;
    hitl: z.ZodDefault<z.ZodBoolean>;
    SLA_minutes: z.ZodDefault<z.ZodNumber>;
    make_scenario_id: z.ZodOptional<z.ZodString>;
    approval_tool: z.ZodOptional<z.ZodString>;
    budget_weight: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    type?: "director" | "agent";
    agent_key?: string;
    department?: string;
    department_key?: string;
    agent_name?: string;
    hitl?: boolean;
    SLA_minutes?: number;
    make_scenario_id?: string;
    approval_tool?: string;
    budget_weight?: number;
}, {
    type?: "director" | "agent";
    agent_key?: string;
    department?: string;
    department_key?: string;
    agent_name?: string;
    hitl?: boolean;
    SLA_minutes?: number;
    make_scenario_id?: string;
    approval_tool?: string;
    budget_weight?: number;
}>, "many">;
export declare function loadAgentsMaster(): {
    type?: "director" | "agent";
    agent_key?: string;
    department?: string;
    department_key?: string;
    agent_name?: string;
    hitl?: boolean;
    SLA_minutes?: number;
    make_scenario_id?: string;
    approval_tool?: string;
    budget_weight?: number;
}[];
export declare const AGENTS_MASTER: {
    type?: "director" | "agent";
    agent_key?: string;
    department?: string;
    department_key?: string;
    agent_name?: string;
    hitl?: boolean;
    SLA_minutes?: number;
    make_scenario_id?: string;
    approval_tool?: string;
    budget_weight?: number;
}[];
//# sourceMappingURL=agents.master.d.ts.map