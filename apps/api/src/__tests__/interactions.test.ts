import request from 'supertest';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '../lib/db';
import { interactions } from '@econeura/db/schema';
import { eq } from 'drizzle-orm';
import app from '../app';

describe('Interactions API', () => {
  const testOrgId = 'test-org-123';
  const testUserId = 'test-user-123';
  const testCompanyId = 'test-company-123';
  const testContactId = 'test-contact-123';
  const testDealId = 'test-deal-123';

  const testHeaders = {
    'x-org-id': testOrgId,
    'x-user-id': testUserId,
    'Authorization': 'Bearer test-token'
  };

  const sampleInteraction = {
    type: 'email' as const,
    subject: 'Test Email Subject',
    content: 'This is a test email content',
    status: 'pending' as const,
    priority: 'medium' as const,
    company_id: testCompanyId,
    contact_id: testContactId,
    deal_id: testDealId,
    due_date: new Date().toISOString(),
    assigned_to: testUserId
  };

  beforeEach(async () => {
    // Clean up test data
    await db.delete(interactions).where(eq(interactions.org_id, testOrgId));
  });

  afterEach(async () => {
    // Clean up test data
    await db.delete(interactions).where(eq(interactions.org_id, testOrgId));
  });

  describe('POST /api/interactions', () => {
    it('should create a new interaction', async () => {
      const response = await request(app)
        .post('/api/interactions')
        .set(testHeaders)
        .send(sampleInteraction)
        .expect(201);

      expect(response.body.data).toMatchObject({
        ...sampleInteraction,
        org_id: testOrgId,
        created_by: testUserId,
        id: expect.any(String)
      });
      expect(response.body.data.created_at).toBeDefined();
      expect(response.body.data.updated_at).toBeDefined();
    });

    it('should require org_id header', async () => {
      const { 'x-org-id': _, ...headersWithoutOrg } = testHeaders;
      
      const response = await request(app)
        .post('/api/interactions')
        .set(headersWithoutOrg)
        .send(sampleInteraction)
        .expect(400);

      expect(response.body.title).toBe('Missing Required Headers');
    });

    it('should require user_id header', async () => {
      const { 'x-user-id': _, ...headersWithoutUser } = testHeaders;
      
      const response = await request(app)
        .post('/api/interactions')
        .set(headersWithoutUser)
        .send(sampleInteraction)
        .expect(400);

      expect(response.body.title).toBe('Missing Required Headers');
    });

    it('should validate required fields', async () => {
      const invalidInteraction = {
        subject: 'Missing type field'
      };

      const response = await request(app)
        .post('/api/interactions')
        .set(testHeaders)
        .send(invalidInteraction)
        .expect(400);

      expect(response.body.title).toBe('Validation Error');
      expect(response.body.errors).toBeDefined();
    });

    it('should validate enum values', async () => {
      const invalidInteraction = {
        ...sampleInteraction,
        type: 'invalid_type'
      };

      const response = await request(app)
        .post('/api/interactions')
        .set(testHeaders)
        .send(invalidInteraction)
        .expect(400);

      expect(response.body.title).toBe('Validation Error');
    });
  });

  describe('GET /api/interactions', () => {
    beforeEach(async () => {
      // Create test interactions
      await db.insert(interactions).values([
        {
          ...sampleInteraction,
          org_id: testOrgId,
          created_by: testUserId,
          type: 'email',
          subject: 'Email 1'
        },
        {
          ...sampleInteraction,
          org_id: testOrgId,
          created_by: testUserId,
          type: 'call',
          subject: 'Call 1'
        },
        {
          ...sampleInteraction,
          org_id: testOrgId,
          created_by: testUserId,
          type: 'meeting',
          subject: 'Meeting 1'
        }
      ]);
    });

    it('should return all interactions for organization', async () => {
      const response = await request(app)
        .get('/api/interactions')
        .set(testHeaders)
        .expect(200);

      expect(response.body.data).toHaveLength(3);
      expect(response.body.pagination).toMatchObject({
        total: 3,
        limit: 50,
        offset: 0,
        hasMore: false
      });
    });

    it('should filter by type', async () => {
      const response = await request(app)
        .get('/api/interactions?type=email')
        .set(testHeaders)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].type).toBe('email');
    });

    it('should filter by company_id', async () => {
      const response = await request(app)
        .get(`/api/interactions?company_id=${testCompanyId}`)
        .set(testHeaders)
        .expect(200);

      expect(response.body.data).toHaveLength(3);
      expect(response.body.data.every((i: any) => i.company_id === testCompanyId)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/interactions?limit=2&offset=0')
        .set(testHeaders)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination).toMatchObject({
        total: 3,
        limit: 2,
        offset: 0,
        hasMore: true
      });
    });

    it('should require org_id header', async () => {
      const { 'x-org-id': _, ...headersWithoutOrg } = testHeaders;
      
      const response = await request(app)
        .get('/api/interactions')
        .set(headersWithoutOrg)
        .expect(400);

      expect(response.body.title).toBe('Missing Organization ID');
    });
  });

  describe('GET /api/interactions/:id', () => {
    let interactionId: string;

    beforeEach(async () => {
      const result = await db.insert(interactions).values({
        ...sampleInteraction,
        org_id: testOrgId,
        created_by: testUserId
      }).returning();
      interactionId = result[0].id;
    });

    it('should return a single interaction', async () => {
      const response = await request(app)
        .get(`/api/interactions/${interactionId}`)
        .set(testHeaders)
        .expect(200);

      expect(response.body.data).toMatchObject({
        id: interactionId,
        ...sampleInteraction,
        org_id: testOrgId,
        created_by: testUserId
      });
    });

    it('should return 404 for non-existent interaction', async () => {
      const response = await request(app)
        .get('/api/interactions/non-existent-id')
        .set(testHeaders)
        .expect(404);

      expect(response.body.title).toBe('Interaction Not Found');
    });

    it('should not return interactions from other organizations', async () => {
      // Create interaction in different org
      const otherOrgId = 'other-org-123';
      const otherResult = await db.insert(interactions).values({
        ...sampleInteraction,
        org_id: otherOrgId,
        created_by: testUserId
      }).returning();

      const response = await request(app)
        .get(`/api/interactions/${otherResult[0].id}`)
        .set(testHeaders)
        .expect(404);

      expect(response.body.title).toBe('Interaction Not Found');
    });
  });

  describe('PUT /api/interactions/:id', () => {
    let interactionId: string;

    beforeEach(async () => {
      const result = await db.insert(interactions).values({
        ...sampleInteraction,
        org_id: testOrgId,
        created_by: testUserId
      }).returning();
      interactionId = result[0].id;
    });

    it('should update an interaction', async () => {
      const updateData = {
        subject: 'Updated Subject',
        status: 'completed' as const,
        completed_at: new Date().toISOString()
      };

      const response = await request(app)
        .put(`/api/interactions/${interactionId}`)
        .set(testHeaders)
        .send(updateData)
        .expect(200);

      expect(response.body.data).toMatchObject({
        id: interactionId,
        ...sampleInteraction,
        ...updateData,
        org_id: testOrgId,
        created_by: testUserId
      });
    });

    it('should return 404 for non-existent interaction', async () => {
      const response = await request(app)
        .put('/api/interactions/non-existent-id')
        .set(testHeaders)
        .send({ subject: 'Updated' })
        .expect(404);

      expect(response.body.title).toBe('Interaction Not Found');
    });

    it('should validate update data', async () => {
      const response = await request(app)
        .put(`/api/interactions/${interactionId}`)
        .set(testHeaders)
        .send({ type: 'invalid_type' })
        .expect(400);

      expect(response.body.title).toBe('Validation Error');
    });
  });

  describe('DELETE /api/interactions/:id', () => {
    let interactionId: string;

    beforeEach(async () => {
      const result = await db.insert(interactions).values({
        ...sampleInteraction,
        org_id: testOrgId,
        created_by: testUserId
      }).returning();
      interactionId = result[0].id;
    });

    it('should delete an interaction', async () => {
      await request(app)
        .delete(`/api/interactions/${interactionId}`)
        .set(testHeaders)
        .expect(204);

      // Verify it's deleted
      const response = await request(app)
        .get(`/api/interactions/${interactionId}`)
        .set(testHeaders)
        .expect(404);
    });

    it('should return 404 for non-existent interaction', async () => {
      const response = await request(app)
        .delete('/api/interactions/non-existent-id')
        .set(testHeaders)
        .expect(404);

      expect(response.body.title).toBe('Interaction Not Found');
    });
  });

  describe('GET /api/interactions/summary', () => {
    beforeEach(async () => {
      // Create test interactions for summary
      await db.insert(interactions).values([
        {
          ...sampleInteraction,
          org_id: testOrgId,
          created_by: testUserId,
          type: 'email',
          subject: 'Follow-up email',
          content: 'Following up on our previous conversation',
          status: 'completed'
        },
        {
          ...sampleInteraction,
          org_id: testOrgId,
          created_by: testUserId,
          type: 'call',
          subject: 'Sales call',
          content: 'Discussed pricing and next steps',
          status: 'completed'
        },
        {
          ...sampleInteraction,
          org_id: testOrgId,
          created_by: testUserId,
          type: 'meeting',
          subject: 'Product demo',
          content: 'Demonstrated new features to client',
          status: 'pending'
        }
      ]);
    });

    it('should return AI summary of interactions', async () => {
      const response = await request(app)
        .get('/api/interactions/summary')
        .set(testHeaders)
        .expect(200);

      expect(response.body.data).toMatchObject({
        summary: expect.any(String),
        insights: expect.any(Array),
        recommendations: expect.any(Array)
      });
    });

    it('should filter summary by company_id', async () => {
      const response = await request(app)
        .get(`/api/interactions/summary?company_id=${testCompanyId}`)
        .set(testHeaders)
        .expect(200);

      expect(response.body.data).toBeDefined();
    });

    it('should filter summary by days', async () => {
      const response = await request(app)
        .get('/api/interactions/summary?days=7')
        .set(testHeaders)
        .expect(200);

      expect(response.body.data).toBeDefined();
    });

    it('should return empty summary for no interactions', async () => {
      // Delete all interactions
      await db.delete(interactions).where(eq(interactions.org_id, testOrgId));

      const response = await request(app)
        .get('/api/interactions/summary')
        .set(testHeaders)
        .expect(200);

      expect(response.body.data).toMatchObject({
        summary: 'No interactions found for the specified period.',
        insights: [],
        recommendations: []
      });
    });
  });
});
