import { structuredLogger } from './structured-logger.js';
export class SimpleWorkflowEngine {
    workflows = new Map();
    constructor() {
        this.initializeWorkflows();
    }
    createWorkflow(name, description, orgId) {
        const id = `workflow_${Date.now()}`;
        const workflow = {
            id,
            name,
            description,
            isActive: true,
            orgId
        };
        this.workflows.set(id, workflow);
        structuredLogger.info('Workflow created', { workflowId: id, name, orgId });
        return id;
    }
    getWorkflows(orgId) {
        return Array.from(this.workflows.values()).filter(w => w.orgId === orgId);
    }
    initializeWorkflows() {
        this.createWorkflow('Invoice Processing', 'Automated invoice processing workflow', 'demo-org');
        this.createWorkflow('Lead Follow-up', 'Automated lead follow-up workflow', 'demo-org');
    }
}
export const workflowEngine = new SimpleWorkflowEngine();
//# sourceMappingURL=workflows-simple.js.map