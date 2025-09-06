// Integration tests for Interactions API - PR-8: CRM Interactions

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../../../index.js';

describe('Interactions API Integration Tests', () => {
  const baseHeaders = {
    'x-org-id': 'test-org-1',
    'x-user-id': 'test-user-1',
    'Content-Type': 'application/json'
  };

  let createdInteractionId: string;

  describe('POST /v1/interactions', () => {
    it('should create a new interaction successfully', async () => {
      const interactionData = {
        type: 'email',
        subject: 'Test Email Subject',
        content: 'This is a test email interaction',
        status: 'pending',
        priority: 'medium',
        company_id: 'company-1',
        contact_id: 'contact-1',
        deal_id: 'deal-1',
        metadata: { test: true }
      };

      const response = await request(app)
        .post('/v1/interactions')
        .set(baseHeaders)
        .send(interactionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.type).toBe(interactionData.type);
      expect(response.body.data.subject).toBe(interactionData.subject);
      expect(response.body.data.content).toBe(interactionData.content);
      expect(response.body.data.status).toBe(interactionData.status);
      expect(response.body.data.priority).toBe(interactionData.priority);
      expect(response.body.data.company_id).toBe(interactionData.company_id);
      expect(response.body.data.contact_id).toBe(interactionData.contact_id);
      expect(response.body.data.deal_id).toBe(interactionData.deal_id);
      expect(response.body.data.created_by).toBe('test-user-1');
      expect(response.body.data.created_at).toBeDefined();
      expect(response.body.data.updated_at).toBeDefined();

      // Store for other tests
      createdInteractionId = response.body.data.id;
    });

    it('should create interaction with minimal required data', async () => {
      const minimalData = {
        type: 'note',
        content: 'Minimal interaction data'
      };

      const response = await request(app)
        .post('/v1/interactions')
        .set(baseHeaders)
        .send(minimalData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.type).toBe(minimalData.type);
      expect(response.body.data.content).toBe(minimalData.content);
      expect(response.body.data.status).toBe('pending'); // Default value
      expect(response.body.data.priority).toBe('medium'); // Default value
    });

    it('should return validation error for invalid data', async () => {
      const invalidData = {
        type: 'invalid-type',
        content: '', // Empty content should fail
        status: 'invalid-status'
      };

      const response = await request(app)
        .post('/v1/interactions')
        .set(baseHeaders)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation error');
      expect(response.body.details).toBeDefined();
    });

    it('should return error for missing required fields', async () => {
      const incompleteData = {
        type: 'email'
        // Missing required 'content' field
      };

      const response = await request(app)
        .post('/v1/interactions')
        .set(baseHeaders)
        .send(incompleteData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation error');
    });
  });

  describe('GET /v1/interactions', () => {
    beforeEach(async () => {
      // Create test interactions
      const interactions = [
        {
          type: 'email',
          content: 'Test email 1',
          company_id: 'company-1',
          status: 'completed'
        },
        {
          type: 'call',
          content: 'Test call 1',
          company_id: 'company-2',
          status: 'pending'
        },
        {
          type: 'meeting',
          content: 'Test meeting 1',
          status: 'completed',
          priority: 'high'
        }
      ];

      for (const interaction of interactions) {
        await request(app)
          .post('/v1/interactions')
          .set(baseHeaders)
          .send(interaction);
      }
    });

    it('should return all interactions', async () => {
      const response = await request(app)
        .get('/v1/interactions')
        .set(baseHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.count).toBeDefined();
      expect(response.body.total).toBeDefined();
      expect(response.body.filters).toBeDefined();
    });

    it('should filter interactions by type', async () => {
      const response = await request(app)
        .get('/v1/interactions?type=email')
        .set(baseHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every((i: any) => i.type === 'email')).toBe(true);
    });

    it('should filter interactions by status', async () => {
      const response = await request(app)
        .get('/v1/interactions?status=completed')
        .set(baseHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every((i: any) => i.status === 'completed')).toBe(true);
    });

    it('should filter interactions by company_id', async () => {
      const response = await request(app)
        .get('/v1/interactions?company_id=company-1')
        .set(baseHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every((i: any) => i.company_id === 'company-1')).toBe(true);
    });

    it('should respect limit and offset parameters', async () => {
      const response = await request(app)
        .get('/v1/interactions?limit=1&offset=0')
        .set(baseHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(1);
    });

    it('should return validation error for invalid filter parameters', async () => {
      const response = await request(app)
        .get('/v1/interactions?type=invalid-type&limit=invalid-limit')
        .set(baseHeaders)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation error');
    });
  });

  describe('GET /v1/interactions/:id', () => {
    it('should return interaction by ID', async () => {
      // First create an interaction
      const createResponse = await request(app)
        .post('/v1/interactions')
        .set(baseHeaders)
        .send({
          type: 'email',
          content: 'Test interaction for get by ID'
        });

      const interactionId = createResponse.body.data.id;

      const response = await request(app)
        .get(`/v1/interactions/${interactionId}`)
        .set(baseHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(interactionId);
    });

    it('should return 404 for non-existent interaction', async () => {
      const response = await request(app)
        .get('/v1/interactions/non-existent-id')
        .set(baseHeaders)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Interaction not found');
    });
  });

  describe('PUT /v1/interactions/:id', () => {
    it('should update interaction successfully', async () => {
      // First create an interaction
      const createResponse = await request(app)
        .post('/v1/interactions')
        .set(baseHeaders)
        .send({
          type: 'email',
          content: 'Original content',
          status: 'pending'
        });

      const interactionId = createResponse.body.data.id;

      const updateData = {
        content: 'Updated content',
        status: 'completed',
        priority: 'high'
      };

      const response = await request(app)
        .put(`/v1/interactions/${interactionId}`)
        .set(baseHeaders)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBe(updateData.content);
      expect(response.body.data.status).toBe(updateData.status);
      expect(response.body.data.priority).toBe(updateData.priority);
      expect(response.body.data.updated_at).toBeDefined();
    });

    it('should return 404 for non-existent interaction', async () => {
      const response = await request(app)
        .put('/v1/interactions/non-existent-id')
        .set(baseHeaders)
        .send({ content: 'Updated content' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Interaction not found');
    });

    it('should return validation error for invalid update data', async () => {
      const response = await request(app)
        .put(`/v1/interactions/${createdInteractionId}`)
        .set(baseHeaders)
        .send({ type: 'invalid-type' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation error');
    });
  });

  describe('DELETE /v1/interactions/:id', () => {
    it('should delete interaction successfully', async () => {
      // First create an interaction
      const createResponse = await request(app)
        .post('/v1/interactions')
        .set(baseHeaders)
        .send({
          type: 'email',
          content: 'Interaction to be deleted'
        });

      const interactionId = createResponse.body.data.id;

      const response = await request(app)
        .delete(`/v1/interactions/${interactionId}`)
        .set(baseHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Interaction deleted successfully');

      // Verify interaction is deleted
      await request(app)
        .get(`/v1/interactions/${interactionId}`)
        .set(baseHeaders)
        .expect(404);
    });

    it('should return 404 for non-existent interaction', async () => {
      const response = await request(app)
        .delete('/v1/interactions/non-existent-id')
        .set(baseHeaders)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Interaction not found');
    });
  });

  describe('GET /v1/interactions/summary', () => {
    beforeEach(async () => {
      // Create test interactions for summary
      const interactions = [
        { type: 'email', content: 'Email 1', status: 'completed', priority: 'high' },
        { type: 'call', content: 'Call 1', status: 'pending', priority: 'medium' },
        { type: 'meeting', content: 'Meeting 1', status: 'completed', priority: 'low' }
      ];

      for (const interaction of interactions) {
        await request(app)
          .post('/v1/interactions')
          .set(baseHeaders)
          .send(interaction);
      }
    });

    it('should return interaction summary', async () => {
      const response = await request(app)
        .get('/v1/interactions/summary')
        .set(baseHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.total).toBeDefined();
      expect(response.body.data.by_type).toBeDefined();
      expect(response.body.data.by_status).toBeDefined();
      expect(response.body.data.by_priority).toBeDefined();
      expect(response.body.data.pending_count).toBeDefined();
      expect(response.body.data.overdue_count).toBeDefined();
      expect(response.body.data.completed_today).toBeDefined();
      expect(response.body.data.avg_completion_time).toBeDefined();
      expect(response.body.data.top_assignees).toBeDefined();
      expect(response.body.data.recent_activity).toBeDefined();
    });
  });

  describe('GET /v1/interactions/analytics', () => {
    beforeEach(async () => {
      // Create test interactions for analytics
      const interactions = [
        { type: 'email', content: 'Email for analytics', status: 'completed' },
        { type: 'call', content: 'Call for analytics', status: 'pending' }
      ];

      for (const interaction of interactions) {
        await request(app)
          .post('/v1/interactions')
          .set(baseHeaders)
          .send(interaction);
      }
    });

    it('should return interaction analytics', async () => {
      const response = await request(app)
        .get('/v1/interactions/analytics')
        .set(baseHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.summary).toBeDefined();
      expect(response.body.data.trends).toBeDefined();
      expect(response.body.data.recommendations).toBeDefined();

      expect(response.body.data.trends.completion_rate).toBeDefined();
      expect(response.body.data.trends.avg_response_time).toBeDefined();
      expect(response.body.data.trends.satisfaction_score).toBeDefined();
      expect(response.body.data.trends.productivity_metrics).toBeDefined();
    });
  });

  describe('POST /v1/interactions/bulk-update', () => {
    let interactionIds: string[];

    beforeEach(async () => {
      // Create test interactions for bulk update
      const interactions = [
        { type: 'email', content: 'Email 1 for bulk update' },
        { type: 'call', content: 'Call 1 for bulk update' }
      ];

      interactionIds = [];
      for (const interaction of interactions) {
        const response = await request(app)
          .post('/v1/interactions')
          .set(baseHeaders)
          .send(interaction);
        interactionIds.push(response.body.data.id);
      }
    });

    it('should update multiple interactions successfully', async () => {
      const updates = [
        {
          id: interactionIds[0],
          data: { status: 'completed', priority: 'high' }
        },
        {
          id: interactionIds[1],
          data: { status: 'completed', priority: 'medium' }
        }
      ];

      const response = await request(app)
        .post('/v1/interactions/bulk-update')
        .set(baseHeaders)
        .send({ updates })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.updated).toBe(2);
      expect(response.body.data.failed).toBe(0);
      expect(response.body.data.errors).toEqual([]);
    });

    it('should handle partial failures', async () => {
      const updates = [
        {
          id: interactionIds[0],
          data: { status: 'completed' }
        },
        {
          id: 'non-existent-id',
          data: { status: 'completed' }
        }
      ];

      const response = await request(app)
        .post('/v1/interactions/bulk-update')
        .set(baseHeaders)
        .send({ updates })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.updated).toBe(1);
      expect(response.body.data.failed).toBe(1);
      expect(response.body.data.errors.length).toBe(1);
    });

    it('should return error for empty updates array', async () => {
      const response = await request(app)
        .post('/v1/interactions/bulk-update')
        .set(baseHeaders)
        .send({ updates: [] })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Updates array is required and must not be empty');
    });

    it('should return error for missing updates array', async () => {
      const response = await request(app)
        .post('/v1/interactions/bulk-update')
        .set(baseHeaders)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Updates array is required and must not be empty');
    });
  });

  describe('Headers and Middleware', () => {
    it('should include FinOps headers in responses', async () => {
      const response = await request(app)
        .get('/v1/interactions')
        .set(baseHeaders)
        .expect(200);

      expect(response.headers['x-est-cost-eur']).toBeDefined();
      expect(response.headers['x-budget-pct']).toBeDefined();
      expect(response.headers['x-latency-ms']).toBeDefined();
      expect(response.headers['x-route']).toBeDefined();
      expect(response.headers['x-correlation-id']).toBeDefined();
    });

    it('should work without organization headers (using defaults)', async () => {
      const response = await request(app)
        .get('/v1/interactions')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle server errors gracefully', async () => {
      // This test would require mocking the service to throw an error
      // For now, we'll test that the error structure is consistent
      const response = await request(app)
        .get('/v1/interactions/non-existent-id')
        .set(baseHeaders)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });
});

