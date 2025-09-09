/**
 * PR-52: Contacts Dedupe Integration Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { contactsDedupeRoutes } from '../../../routes/contacts-dedupe.js';

const app = express();
app.use(express.json());
app.use('/api/contacts-dedupe', contactsDedupeRoutes);

describe('Contacts Dedupe API Integration Tests', () => {
  const mockContact1 = {
    id: 'contact-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    phoneE164: '+1234567890',
    company: 'Example Corp',
    organizationId: 'org-1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  const mockContact2 = {
    id: 'contact-2',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    phoneE164: '+1234567890',
    company: 'Example Corp',
    organizationId: 'org-1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  beforeEach(async () => {
    // Clear all data before each test
    await request(app)
      .delete('/api/contacts-dedupe/clear')
      .expect(200);
  });

  afterEach(async () => {
    // Clean up after each test
    await request(app)
      .delete('/api/contacts-dedupe/clear')
      .expect(200);
  });

  describe('Contact Management Endpoints', () => {
    it('should add a contact', async () => {
      const response = await request(app)
        .post('/api/contacts-dedupe/contacts')
        .send(mockContact1)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Contact added successfully');
    });

    it('should get all contacts', async () => {
      await request(app)
        .post('/api/contacts-dedupe/contacts')
        .send(mockContact1);

      const response = await request(app)
        .get('/api/contacts-dedupe/contacts')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].id).toBe(mockContact1.id);
    });

    it('should get a specific contact', async () => {
      await request(app)
        .post('/api/contacts-dedupe/contacts')
        .send(mockContact1);

      const response = await request(app)
        .get(`/api/contacts-dedupe/contacts/${mockContact1.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(mockContact1.id);
    });

    it('should return 404 for non-existent contact', async () => {
      const response = await request(app)
        .get('/api/contacts-dedupe/contacts/non-existent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Contact not found');
    });

    it('should remove a contact', async () => {
      await request(app)
        .post('/api/contacts-dedupe/contacts')
        .send(mockContact1);

      const response = await request(app)
        .delete(`/api/contacts-dedupe/contacts/${mockContact1.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Contact removed successfully');
    });
  });

  describe('Deduplication Process', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/contacts-dedupe/contacts')
        .send(mockContact1);

      await request(app)
        .post('/api/contacts-dedupe/contacts')
        .send(mockContact2);
    });

    it('should process deduplication', async () => {
      const response = await request(app)
        .post('/api/contacts-dedupe/process')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.totalContacts).toBe(2);
      expect(response.body.data.duplicatesFound).toBeGreaterThan(0);
    });

    it('should get deduplication stats', async () => {
      await request(app)
        .post('/api/contacts-dedupe/process');

      const response = await request(app)
        .get('/api/contacts-dedupe/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalContacts).toBe(2);
      expect(response.body.data.duplicatesFound).toBeGreaterThan(0);
    });

    it('should get duplicates for a specific contact', async () => {
      await request(app)
        .post('/api/contacts-dedupe/process');

      const response = await request(app)
        .get(`/api/contacts-dedupe/duplicates/${mockContact1.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Merge Operations', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/contacts-dedupe/contacts')
        .send(mockContact1);

      await request(app)
        .post('/api/contacts-dedupe/contacts')
        .send(mockContact2);

      // Enable auto-merge and process
      await request(app)
        .put('/api/contacts-dedupe/config')
        .send({ autoMerge: true });

      await request(app)
        .post('/api/contacts-dedupe/process');
    });

    it('should get all merge operations', async () => {
      const response = await request(app)
        .get('/api/contacts-dedupe/merges')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should get pending merge operations', async () => {
      const response = await request(app)
        .get('/api/contacts-dedupe/merges/pending')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should approve a merge operation', async () => {
      const pendingResponse = await request(app)
        .get('/api/contacts-dedupe/merges/pending');

      if (pendingResponse.body.data.length > 0) {
        const mergeId = pendingResponse.body.data[0].id;

        const response = await request(app)
          .post(`/api/contacts-dedupe/merges/${mergeId}/approve`)
          .send({ approvedBy: 'user-1' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Merge operation approved');
      }
    });

    it('should execute a merge operation', async () => {
      const pendingResponse = await request(app)
        .get('/api/contacts-dedupe/merges/pending');

      if (pendingResponse.body.data.length > 0) {
        const mergeId = pendingResponse.body.data[0].id;

        const response = await request(app)
          .post(`/api/contacts-dedupe/merges/${mergeId}/execute`)
          .send({ approvedBy: 'user-1' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Merge operation executed');
      }
    });

    it('should revert a merge operation', async () => {
      const pendingResponse = await request(app)
        .get('/api/contacts-dedupe/merges/pending');

      if (pendingResponse.body.data.length > 0) {
        const mergeId = pendingResponse.body.data[0].id;

        const response = await request(app)
          .post(`/api/contacts-dedupe/merges/${mergeId}/revert`)
          .send({ approvedBy: 'user-1' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Merge operation reverted');
      }
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration', async () => {
      const config = {
        confidenceThreshold: 0.9,
        similarityThreshold: 0.8,
        fuzzyMatching: true,
        machineLearning: true
      };

      const response = await request(app)
        .put('/api/contacts-dedupe/config')
        .send(config)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Configuration updated successfully');
    });

    it('should handle invalid configuration', async () => {
      const invalidConfig = {
        confidenceThreshold: 1.5, // Invalid: should be between 0 and 1
        similarityThreshold: -0.1 // Invalid: should be between 0 and 1
      };

      const response = await request(app)
        .put('/api/contacts-dedupe/config')
        .send(invalidConfig)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid configuration data');
    });
  });

  describe('Health and Monitoring', () => {
    it('should get health status', async () => {
      const response = await request(app)
        .get('/api/contacts-dedupe/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toMatch(/healthy|warning|critical/);
      expect(response.body.data.details).toBeDefined();
    });
  });

  describe('Data Import/Export', () => {
    it('should import multiple contacts', async () => {
      const contacts = [mockContact1, mockContact2];

      const response = await request(app)
        .post('/api/contacts-dedupe/import')
        .send(contacts)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('2 contacts imported successfully');
    });

    it('should export duplicates', async () => {
      await request(app)
        .post('/api/contacts-dedupe/contacts')
        .send(mockContact1);

      await request(app)
        .post('/api/contacts-dedupe/contacts')
        .send(mockContact2);

      await request(app)
        .post('/api/contacts-dedupe/process');

      const response = await request(app)
        .get('/api/contacts-dedupe/export')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should clear all data', async () => {
      await request(app)
        .post('/api/contacts-dedupe/contacts')
        .send(mockContact1);

      const response = await request(app)
        .delete('/api/contacts-dedupe/clear')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('All data cleared successfully');

      // Verify data is cleared
      const contactsResponse = await request(app)
        .get('/api/contacts-dedupe/contacts')
        .expect(200);

      expect(contactsResponse.body.data).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid contact data', async () => {
      const invalidContact = {
        id: 'contact-1',
        // Missing required fields
        firstName: 'John'
      };

      const response = await request(app)
        .post('/api/contacts-dedupe/contacts')
        .send(invalidContact)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid contact data');
    });

    it('should handle non-existent merge operations', async () => {
      const response = await request(app)
        .post('/api/contacts-dedupe/merges/non-existent/approve')
        .send({ approvedBy: 'user-1' })
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Performance Tests', () => {
    it('should handle large contact imports efficiently', async () => {
      const largeContactList = [];
      for (let i = 0; i < 50; i++) {
        largeContactList.push({
          id: `contact-${i}`,
          firstName: `User${i}`,
          lastName: 'Test',
          email: `user${i}@example.com`,
          organizationId: 'org-1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        });
      }

      const startTime = Date.now();
      const response = await request(app)
        .post('/api/contacts-dedupe/import')
        .send(largeContactList)
        .expect(200);
      const endTime = Date.now();

      expect(response.body.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});
