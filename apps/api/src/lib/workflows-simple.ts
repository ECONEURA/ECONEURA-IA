import { structuredLogger } from './structured-logger.js';

export interface SimpleWorkflow {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  orgId: string;
}

export class SimpleWorkflowEngine {
  private workflows: Map<string, SimpleWorkflow> = new Map();

  constructor() {
    this.initializeWorkflows();
  }

  createWorkflow(name: string, description: string, orgId: string): string {
    const id = `workflow_${Date.now()}`;
    const workflow: SimpleWorkflow = {
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

  getWorkflows(orgId: string): SimpleWorkflow[] {
    return Array.from(this.workflows.values()).filter(w => w.orgId === orgId);
  }

  private initializeWorkflows(): void {
    this.createWorkflow('Invoice Processing', 'Automated invoice processing workflow', 'demo-org');
    this.createWorkflow('Lead Follow-up', 'Automated lead follow-up workflow', 'demo-org');
  }
}

export const workflowEngine = new SimpleWorkflowEngine();
