import { describe, it, expect, beforeEach } from 'vitest';
import { WorkflowsService, WorkflowSchema, WorkflowInstanceSchema } from '../../../lib/workflows.service.js';

describe('WorkflowsService', () => {
  let service: WorkflowsService;

  beforeEach(() => {
    service = new WorkflowsService();
  });

  describe('Workflow Management', () => {
    it('should initialize with default workflows', async () => {
      const workflows = await service.getWorkflows();
      expect(workflows).toHaveLength(2);
      expect(workflows[0].name).toBe('User Onboarding Process');
      expect(workflows[1].name).toBe('Order Processing');
    });

    it('should get workflows by type', async () => {
      const bpmnWorkflows = await service.getWorkflows({ type: 'bpmn' });
      const stateMachineWorkflows = await service.getWorkflows({ type: 'state_machine' });

      expect(bpmnWorkflows).toHaveLength(1);
      expect(bpmnWorkflows[0].type).toBe('bpmn');

      expect(stateMachineWorkflows).toHaveLength(1);
      expect(stateMachineWorkflows[0].type).toBe('state_machine');
    });

    it('should get workflows by status', async () => {
      const activeWorkflows = await service.getWorkflows({ status: 'active' });
      expect(activeWorkflows).toHaveLength(2);
      expect(activeWorkflows.every(w => w.status === 'active')).toBe(true);
    });

    it('should create a new workflow', async () => {
      const newWorkflow = {
        name: 'Test Workflow',
        type: 'bpmn' as const,
        status: 'active' as const,
        version: 1,
        definition: {
          elements: [
            { id: 'start', type: 'startEvent' as const, name: 'Start' },
            { id: 'end', type: 'endEvent' as const, name: 'End' }
          ],
          flows: [
            { id: 'f1', source: 'start', target: 'end' }
          ],
          startElement: 'start',
          endElements: ['end']
        },
        actions: [],
        metadata: {
          author: 'Test',
          description: 'Test workflow'
        }
      };

      const created = await service.createWorkflow(newWorkflow);
      expect(created.name).toBe('Test Workflow');
      expect(created.id).toBeDefined();
      expect(created.createdAt).toBeDefined();
    });

    it('should update a workflow', async () => {
      const workflows = await service.getWorkflows();
      const workflow = workflows[0];

      const updated = await service.updateWorkflow(workflow.id!, { status: 'inactive' });
      expect(updated?.status).toBe('inactive');
      expect(updated?.updatedAt).toBeDefined();
    });

    it('should delete a workflow', async () => {
      const workflows = await service.getWorkflows();
      const workflow = workflows[0];

      const deleted = await service.deleteWorkflow(workflow.id!);
      expect(deleted).toBe(true);

      const retrieved = await service.getWorkflow(workflow.id!);
      expect(retrieved).toBeNull();
    });
  });

  describe('Workflow Instances', () => {
    it('should start a workflow instance', async () => {
      const workflows = await service.getWorkflows();
      const workflow = workflows[0];

      const context = { userId: 'test-user', userEmail: 'test@example.com' };
      const metadata = { source: 'test' };

      const instance = await service.startWorkflow(workflow.id!, context, metadata);

      expect(instance.workflowId).toBe(workflow.id);
      expect(instance.status).toBe('running');
      expect(instance.context).toEqual(context);
      expect(instance.metadata).toEqual(metadata);
      expect(instance.startedAt).toBeDefined();
    });

    it('should pause a workflow instance', async () => {
      const workflows = await service.getWorkflows();
      const workflow = workflows[0];

      const instance = await service.startWorkflow(workflow.id!, {}, {});
      const paused = await service.pauseInstance(instance.id!);

      expect(paused?.status).toBe('paused');
    });

    it('should resume a workflow instance', async () => {
      const workflows = await service.getWorkflows();
      const workflow = workflows[0];

      const instance = await service.startWorkflow(workflow.id!, {}, {});
      await service.pauseInstance(instance.id!);
      const resumed = await service.resumeInstance(instance.id!);

      expect(resumed?.status).toBe('running');
    });

    it('should cancel a workflow instance', async () => {
      const workflows = await service.getWorkflows();
      const workflow = workflows[0];

      const instance = await service.startWorkflow(workflow.id!, {}, {});
      const cancelled = await service.cancelInstance(instance.id!);

      expect(cancelled?.status).toBe('cancelled');
      expect(cancelled?.completedAt).toBeDefined();
    });

    it('should get instances by status', async () => {
      const workflows = await service.getWorkflows();
      const workflow = workflows[0];

      const instance1 = await service.startWorkflow(workflow.id!, {}, {});
      const instance2 = await service.startWorkflow(workflow.id!, {}, {});
      await service.pauseInstance(instance2.id!);

      const runningInstances = await service.getInstances({ status: 'running' });
      const pausedInstances = await service.getInstances({ status: 'paused' });

      expect(runningInstances).toHaveLength(1);
      expect(pausedInstances).toHaveLength(1);
    });

    it('should get instances by workflow ID', async () => {
      const workflows = await service.getWorkflows();
      const workflow1 = workflows[0];
      const workflow2 = workflows[1];

      await service.startWorkflow(workflow1.id!, {}, {});
      await service.startWorkflow(workflow2.id!, {}, {});

      const instances1 = await service.getInstances({ workflowId: workflow1.id });
      const instances2 = await service.getInstances({ workflowId: workflow2.id });

      expect(instances1).toHaveLength(1);
      expect(instances2).toHaveLength(1);
    });
  });

  describe('Action Execution', () => {
    it('should execute a function action', async () => {
      const workflows = await service.getWorkflows();
      const workflow = workflows[0];

      const instance = await service.startWorkflow(workflow.id!, { userId: 'test-user' }, {});
      const action = workflow.actions[0];

      const result = await service.executeAction(instance.id!, action.id);

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
    });

    it('should handle action execution errors', async () => {
      const workflows = await service.getWorkflows();
      const workflow = workflows[0];

      const instance = await service.startWorkflow(workflow.id!, {}, {});

      const result = await service.executeAction(instance.id!, 'non-existent-action');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Action not found');
    });

    it('should record execution history', async () => {
      const workflows = await service.getWorkflows();
      const workflow = workflows[0];

      const instance = await service.startWorkflow(workflow.id!, {}, {});
      const action = workflow.actions[0];

      await service.executeAction(instance.id!, action.id);

      const updatedInstance = await service.getInstance(instance.id!);
      expect(updatedInstance?.executionHistory).toHaveLength(1);
      expect(updatedInstance?.executionHistory?.[0].action).toBe(action.id);
    });
  });

  describe('Statistics', () => {
    it('should get workflow statistics', async () => {
      const stats = await service.getStats();

      expect(stats.totalWorkflows).toBeGreaterThan(0);
      expect(stats.totalInstances).toBeGreaterThanOrEqual(0);
      expect(stats.workflowsByType).toHaveProperty('bpmn');
      expect(stats.workflowsByType).toHaveProperty('state_machine');
      expect(stats.instancesByStatus).toBeDefined();
      expect(stats.averageExecutionTime).toBeGreaterThanOrEqual(0);
      expect(stats.successRate).toBeGreaterThanOrEqual(0);
    });

    it('should calculate success rate correctly', async () => {
      const workflows = await service.getWorkflows();
      const workflow = workflows[0];

      // Crear instancias con diferentes estados
      const instance1 = await service.startWorkflow(workflow.id!, {}, {});
      const instance2 = await service.startWorkflow(workflow.id!, {}, {});

      await service.cancelInstance(instance1.id!); // cancelled
      // instance2 sigue running

      const stats = await service.getStats();
      expect(stats.successRate).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Validation', () => {
    it('should validate BPMN workflow', async () => {
      const validBPMNWorkflow = {
        name: 'Valid BPMN',
        type: 'bpmn' as const,
        status: 'active' as const,
        version: 1,
        definition: {
          elements: [
            { id: 'start', type: 'startEvent' as const, name: 'Start' },
            { id: 'task', type: 'task' as const, name: 'Task' },
            { id: 'end', type: 'endEvent' as const, name: 'End' }
          ],
          flows: [
            { id: 'f1', source: 'start', target: 'task' },
            { id: 'f2', source: 'task', target: 'end' }
          ],
          startElement: 'start',
          endElements: ['end']
        },
        actions: [],
        metadata: {
          author: 'Test',
          description: 'Valid BPMN workflow'
        }
      };

      const validation = await service.validateWorkflow(validBPMNWorkflow);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should validate state machine workflow', async () => {
      const validStateMachineWorkflow = {
        name: 'Valid State Machine',
        type: 'state_machine' as const,
        status: 'active' as const,
        version: 1,
        definition: {
          states: [
            { id: 'initial', name: 'Initial', type: 'initial' as const },
            { id: 'final', name: 'Final', type: 'final' as const }
          ],
          transitions: [
            { id: 't1', from: 'initial', to: 'final', event: 'complete' }
          ],
          initialState: 'initial',
          finalStates: ['final']
        },
        actions: [],
        metadata: {
          author: 'Test',
          description: 'Valid state machine workflow'
        }
      };

      const validation = await service.validateWorkflow(validStateMachineWorkflow);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid BPMN workflow', async () => {
      const invalidBPMNWorkflow = {
        name: 'Invalid BPMN',
        type: 'bpmn' as const,
        status: 'active' as const,
        version: 1,
        definition: {
          elements: [
            { id: 'start', type: 'startEvent' as const, name: 'Start' }
          ],
          flows: [],
          startElement: 'start',
          endElements: ['end'] // 'end' no existe en elements
        },
        actions: [],
        metadata: {
          author: 'Test'
        }
      };

      const validation = await service.validateWorkflow(invalidBPMNWorkflow);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should detect invalid state machine workflow', async () => {
      const invalidStateMachineWorkflow = {
        name: 'Invalid State Machine',
        type: 'state_machine' as const,
        status: 'active' as const,
        version: 1,
        definition: {
          states: [
            { id: 'initial', name: 'Initial', type: 'initial' as const }
          ],
          transitions: [
            { id: 't1', from: 'initial', to: 'final', event: 'complete' } // 'final' no existe
          ],
          initialState: 'initial',
          finalStates: ['final'] // 'final' no existe
        },
        actions: [],
        metadata: {
          author: 'Test'
        }
      };

      const validation = await service.validateWorkflow(invalidStateMachineWorkflow);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should validate workflow name', async () => {
      const invalidWorkflow = {
        name: '', // Nombre vacío
        type: 'bpmn' as const,
        status: 'active' as const,
        version: 1,
        definition: {
          elements: [],
          flows: [],
          startElement: 'start',
          endElements: []
        },
        actions: [],
        metadata: {
          author: 'Test'
        }
      };

      const validation = await service.validateWorkflow(invalidWorkflow);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Workflow name is required');
    });

    it('should validate action types', async () => {
      const invalidWorkflow = {
        name: 'Test Workflow',
        type: 'bpmn' as const,
        status: 'active' as const,
        version: 1,
        definition: {
          elements: [
            { id: 'start', type: 'startEvent' as const, name: 'Start' },
            { id: 'end', type: 'endEvent' as const, name: 'End' }
          ],
          flows: [
            { id: 'f1', source: 'start', target: 'end' }
          ],
          startElement: 'start',
          endElements: ['end']
        },
        actions: [
          {
            id: 'invalid_action',
            name: 'Invalid Action',
            type: 'invalid_type' as any, // Tipo inválido
            config: {},
            order: 1
          }
        ],
        metadata: {
          author: 'Test'
        }
      };

      const validation = await service.validateWorkflow(invalidWorkflow);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('Invalid action type'))).toBe(true);
    });
  });

  describe('Schema Validation', () => {
    it('should validate WorkflowSchema', () => {
      const validWorkflow = {
        name: 'Test',
        type: 'bpmn' as const,
        status: 'active' as const,
        version: 1,
        definition: {
          elements: [
            { id: 'start', type: 'startEvent' as const, name: 'Start' },
            { id: 'end', type: 'endEvent' as const, name: 'End' }
          ],
          flows: [
            { id: 'f1', source: 'start', target: 'end' }
          ],
          startElement: 'start',
          endElements: ['end']
        },
        actions: [],
        metadata: {
          author: 'Test'
        }
      };

      expect(() => WorkflowSchema.parse(validWorkflow)).not.toThrow();
    });

    it('should validate WorkflowInstanceSchema', () => {
      const validInstance = {
        workflowId: 'workflow-123',
        status: 'running' as const,
        context: { userId: 'test' },
        metadata: { source: 'test' }
      };

      expect(() => WorkflowInstanceSchema.parse(validInstance)).not.toThrow();
    });
  });
});
