import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../../../index.js';

describe('Workflows API Integration Tests', () => {
  const baseUrl = '/v1/workflows';

  describe('Workflows CRUD', () => {
    it('should get all workflows', async () => {
      const response = await request(app)
        .get(baseUrl)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.total).toBeGreaterThan(0);
    });

    it('should get workflows by type', async () => {
      const response = await request(app)
        .get(`${baseUrl}?type=bpmn`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.every((w: any) => w.type === 'bpmn')).toBe(true);
    });

    it('should get workflows by status', async () => {
      const response = await request(app)
        .get(`${baseUrl}?status=active`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.every((w: any) => w.status === 'active')).toBe(true);
    });

    it('should get specific workflow', async () => {
      // Primero obtener un workflow existente
      const workflowsResponse = await request(app)
        .get(baseUrl)
        .expect(200);

      const workflowId = workflowsResponse.body.data[0].id;

      const response = await request(app)
        .get(`${baseUrl}/${workflowId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(workflowId);
    });

    it('should return 404 for non-existent workflow', async () => {
      const response = await request(app)
        .get(`${baseUrl}/non-existent-id`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Workflow not found');
    });

    it('should create new BPMN workflow', async () => {
      const newWorkflow = {
        name: 'Integration Test BPMN',
        type: 'bpmn',
        status: 'active',
        version: 1,
        definition: {
          elements: [
            { id: 'start', type: 'startEvent', name: 'Start', x: 100, y: 100 },
            { id: 'task', type: 'task', name: 'Test Task', x: 300, y: 100, actions: ['test_action'] },
            { id: 'end', type: 'endEvent', name: 'End', x: 500, y: 100 }
          ],
          flows: [
            { id: 'f1', source: 'start', target: 'task' },
            { id: 'f2', source: 'task', target: 'end' }
          ],
          startElement: 'start',
          endElements: ['end']
        },
        actions: [
          {
            id: 'test_action',
            name: 'Test Action',
            type: 'function',
            config: { functionName: 'testFunction' },
            order: 1
          }
        ],
        metadata: {
          author: 'Integration Test',
          category: 'Testing',
          description: 'Integration test BPMN workflow'
        }
      };

      const response = await request(app)
        .post(baseUrl)
        .send(newWorkflow)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Integration Test BPMN');
      expect(response.body.data.type).toBe('bpmn');
      expect(response.body.data.id).toBeDefined();
    });

    it('should create new state machine workflow', async () => {
      const newWorkflow = {
        name: 'Integration Test State Machine',
        type: 'state_machine',
        status: 'active',
        version: 1,
        definition: {
          states: [
            { id: 'initial', name: 'Initial', type: 'initial', actions: ['init_action'] },
            { id: 'final', name: 'Final', type: 'final', actions: ['final_action'] }
          ],
          transitions: [
            { id: 't1', from: 'initial', to: 'final', event: 'complete' }
          ],
          initialState: 'initial',
          finalStates: ['final']
        },
        actions: [
          {
            id: 'init_action',
            name: 'Initialize',
            type: 'function',
            config: { functionName: 'initialize' },
            order: 1
          },
          {
            id: 'final_action',
            name: 'Finalize',
            type: 'function',
            config: { functionName: 'finalize' },
            order: 1
          }
        ],
        metadata: {
          author: 'Integration Test',
          category: 'Testing',
          description: 'Integration test state machine workflow'
        }
      };

      const response = await request(app)
        .post(baseUrl)
        .send(newWorkflow)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Integration Test State Machine');
      expect(response.body.data.type).toBe('state_machine');
      expect(response.body.data.id).toBeDefined();
    });

    it('should update workflow', async () => {
      // Crear un workflow primero
      const newWorkflow = {
        name: 'Update Test Workflow',
        type: 'bpmn',
        status: 'active',
        version: 1,
        definition: {
          elements: [
            { id: 'start', type: 'startEvent', name: 'Start' },
            { id: 'end', type: 'endEvent', name: 'End' }
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

      const createResponse = await request(app)
        .post(baseUrl)
        .send(newWorkflow)
        .expect(201);

      const workflowId = createResponse.body.data.id;

      // Actualizar el workflow
      const updateResponse = await request(app)
        .put(`${baseUrl}/${workflowId}`)
        .send({ status: 'inactive', version: 2 })
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.status).toBe('inactive');
      expect(updateResponse.body.data.version).toBe(2);
    });

    it('should delete workflow', async () => {
      // Crear un workflow primero
      const newWorkflow = {
        name: 'Delete Test Workflow',
        type: 'bpmn',
        status: 'active',
        version: 1,
        definition: {
          elements: [
            { id: 'start', type: 'startEvent', name: 'Start' },
            { id: 'end', type: 'endEvent', name: 'End' }
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

      const createResponse = await request(app)
        .post(baseUrl)
        .send(newWorkflow)
        .expect(201);

      const workflowId = createResponse.body.data.id;

      // Eliminar el workflow
      const deleteResponse = await request(app)
        .delete(`${baseUrl}/${workflowId}`)
        .expect(200);

      expect(deleteResponse.body.success).toBe(true);

      // Verificar que se eliminó
      await request(app)
        .get(`${baseUrl}/${workflowId}`)
        .expect(404);
    });

    it('should validate workflow data', async () => {
      const invalidWorkflow = {
        name: '', // Nombre vacío
        type: 'invalid_type', // Tipo inválido
        status: 'active',
        version: 1,
        definition: {
          elements: [],
          flows: [],
          startElement: 'start',
          endElements: []
        },
        actions: [],
        metadata: {}
      };

      const response = await request(app)
        .post(baseUrl)
        .send(invalidWorkflow)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid workflow data');
    });
  });

  describe('Workflow Instances', () => {
    let workflowId: string;

    beforeEach(async () => {
      // Crear un workflow para las pruebas de instancias
      const newWorkflow = {
        name: 'Instance Test Workflow',
        type: 'bpmn',
        status: 'active',
        version: 1,
        definition: {
          elements: [
            { id: 'start', type: 'startEvent', name: 'Start' },
            { id: 'task', type: 'task', name: 'Test Task', actions: ['test_action'] },
            { id: 'end', type: 'endEvent', name: 'End' }
          ],
          flows: [
            { id: 'f1', source: 'start', target: 'task' },
            { id: 'f2', source: 'task', target: 'end' }
          ],
          startElement: 'start',
          endElements: ['end']
        },
        actions: [
          {
            id: 'test_action',
            name: 'Test Action',
            type: 'function',
            config: { functionName: 'testFunction' },
            order: 1
          }
        ],
        metadata: {
          author: 'Test',
          description: 'Test workflow for instances'
        }
      };

      const createResponse = await request(app)
        .post(baseUrl)
        .send(newWorkflow)
        .expect(201);

      workflowId = createResponse.body.data.id;
    });

    afterEach(async () => {
      // Limpiar workflow creado
      if (workflowId) {
        await request(app)
          .delete(`${baseUrl}/${workflowId}`)
          .expect(200);
      }
    });

    it('should start workflow instance', async () => {
      const startData = {
        context: {
          userId: 'test-user',
          userEmail: 'test@example.com'
        },
        metadata: {
          source: 'integration-test'
        }
      };

      const response = await request(app)
        .post(`${baseUrl}/${workflowId}/start`)
        .send(startData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.workflowId).toBe(workflowId);
      expect(response.body.data.status).toBe('running');
      expect(response.body.data.context).toEqual(startData.context);
    });

    it('should require context to start workflow', async () => {
      const response = await request(app)
        .post(`${baseUrl}/${workflowId}/start`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Context is required to start workflow');
    });

    it('should list workflow instances', async () => {
      // Crear una instancia primero
      await request(app)
        .post(`${baseUrl}/${workflowId}/start`)
        .send({ context: { test: 'value' } })
        .expect(200);

      const response = await request(app)
        .get(`${baseUrl}/instances`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.total).toBeGreaterThan(0);
    });

    it('should get specific workflow instance', async () => {
      // Crear una instancia primero
      const startResponse = await request(app)
        .post(`${baseUrl}/${workflowId}/start`)
        .send({ context: { test: 'value' } })
        .expect(200);

      const instanceId = startResponse.body.data.id;

      const response = await request(app)
        .get(`${baseUrl}/instances/${instanceId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(instanceId);
    });

    it('should pause workflow instance', async () => {
      // Crear una instancia primero
      const startResponse = await request(app)
        .post(`${baseUrl}/${workflowId}/start`)
        .send({ context: { test: 'value' } })
        .expect(200);

      const instanceId = startResponse.body.data.id;

      const response = await request(app)
        .post(`${baseUrl}/instances/${instanceId}/pause`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('paused');
    });

    it('should resume workflow instance', async () => {
      // Crear una instancia primero
      const startResponse = await request(app)
        .post(`${baseUrl}/${workflowId}/start`)
        .send({ context: { test: 'value' } })
        .expect(200);

      const instanceId = startResponse.body.data.id;

      // Pausar la instancia
      await request(app)
        .post(`${baseUrl}/instances/${instanceId}/pause`)
        .expect(200);

      // Reanudar la instancia
      const response = await request(app)
        .post(`${baseUrl}/instances/${instanceId}/resume`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('running');
    });

    it('should cancel workflow instance', async () => {
      // Crear una instancia primero
      const startResponse = await request(app)
        .post(`${baseUrl}/${workflowId}/start`)
        .send({ context: { test: 'value' } })
        .expect(200);

      const instanceId = startResponse.body.data.id;

      const response = await request(app)
        .post(`${baseUrl}/instances/${instanceId}/cancel`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('cancelled');
    });

    it('should execute workflow action', async () => {
      // Crear una instancia primero
      const startResponse = await request(app)
        .post(`${baseUrl}/${workflowId}/start`)
        .send({ context: { test: 'value' } })
        .expect(200);

      const instanceId = startResponse.body.data.id;

      const response = await request(app)
        .post(`${baseUrl}/instances/${instanceId}/actions`)
        .send({ actionId: 'test_action' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.actionId).toBe('test_action');
      expect(response.body.data.result).toBeDefined();
    });

    it('should require action ID to execute action', async () => {
      // Crear una instancia primero
      const startResponse = await request(app)
        .post(`${baseUrl}/${workflowId}/start`)
        .send({ context: { test: 'value' } })
        .expect(200);

      const instanceId = startResponse.body.data.id;

      const response = await request(app)
        .post(`${baseUrl}/instances/${instanceId}/actions`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Action ID is required');
    });

    it('should return 404 for non-existent instance', async () => {
      const response = await request(app)
        .get(`${baseUrl}/instances/non-existent-id`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Workflow instance not found');
    });
  });

  describe('Statistics', () => {
    it('should get workflow statistics', async () => {
      const response = await request(app)
        .get(`${baseUrl}/stats`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalWorkflows');
      expect(response.body.data).toHaveProperty('totalInstances');
      expect(response.body.data).toHaveProperty('workflowsByType');
      expect(response.body.data).toHaveProperty('instancesByStatus');
      expect(response.body.data).toHaveProperty('averageExecutionTime');
      expect(response.body.data).toHaveProperty('successRate');
    });
  });

  describe('Validation', () => {
    it('should validate workflow', async () => {
      const validWorkflow = {
        name: 'Valid Test Workflow',
        type: 'bpmn',
        status: 'active',
        version: 1,
        definition: {
          elements: [
            { id: 'start', type: 'startEvent', name: 'Start' },
            { id: 'end', type: 'endEvent', name: 'End' }
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
          description: 'Valid test workflow'
        }
      };

      const response = await request(app)
        .post(`${baseUrl}/validate`)
        .send(validWorkflow)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isValid).toBe(true);
      expect(response.body.data.errors).toHaveLength(0);
    });

    it('should detect invalid workflow', async () => {
      const invalidWorkflow = {
        name: 'Invalid Test Workflow',
        type: 'bpmn',
        status: 'active',
        version: 1,
        definition: {
          elements: [
            { id: 'start', type: 'startEvent', name: 'Start' }
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

      const response = await request(app)
        .post(`${baseUrl}/validate`)
        .send(invalidWorkflow)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isValid).toBe(false);
      expect(response.body.data.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get(`${baseUrl}/health`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('timestamp');
      expect(response.body.data).toHaveProperty('stats');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post(baseUrl)
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle missing required fields', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid workflow data');
    });

    it('should handle invalid HTTP methods', async () => {
      const response = await request(app)
        .patch(baseUrl)
        .expect(404);

      expect(response.status).toBe(404);
    });
  });

  describe('Headers', () => {
    it('should include workflow headers', async () => {
      const response = await request(app)
        .get(baseUrl)
        .expect(200);

      // Verificar que se incluyen headers relevantes
      expect(response.headers['content-type']).toContain('application/json');
    });
  });
});
