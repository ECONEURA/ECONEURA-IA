export interface SimpleWorkflow {
    id: string;
    name: string;
    description: string;
    isActive: boolean;
    orgId: string;
}
export declare class SimpleWorkflowEngine {
    private workflows;
    constructor();
    createWorkflow(name: string, description: string, orgId: string): string;
    getWorkflows(orgId: string): SimpleWorkflow[];
    private initializeWorkflows;
}
export declare const workflowEngine: SimpleWorkflowEngine;
//# sourceMappingURL=workflows-simple.d.ts.map