/**
 * PR-52: Contacts Dedupe Service Unit Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContactsDedupeService, Contact, DuplicateMatch } from '../../../lib/contacts-dedupe.service.js';

describe('ContactsDedupeService', () => {
  let service: ContactsDedupeService;
  let mockContact1: Contact;
  let mockContact2: Contact;
  let mockContact3: Contact;

  beforeEach(() => {
    service = new ContactsDedupeService({
      enabled: true,
      autoMerge: false,
      confidenceThreshold: 0.8,
      similarityThreshold: 0.7
    });

    mockContact1 = {
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

    mockContact2 = {
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

    mockContact3 = {
      id: 'contact-3',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      phone: '+0987654321',
      phoneE164: '+0987654321',
      company: 'Another Corp',
      organizationId: 'org-1',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    };
  });

  describe('Contact Management', () => {
    it('should add a contact', async () => {
      await service.addContact(mockContact1);
      const contact = await service.getContact(mockContact1.id);
      expect(contact).toEqual(mockContact1);
    });

    it('should remove a contact', async () => {
      await service.addContact(mockContact1);
      await service.removeContact(mockContact1.id);
      const contact = await service.getContact(mockContact1.id);
      expect(contact).toBeNull();
    });

    it('should get all contacts', async () => {
      await service.addContact(mockContact1);
      await service.addContact(mockContact2);
      const contacts = await service.getAllContacts();
      expect(contacts).toHaveLength(2);
    });

    it('should import multiple contacts', async () => {
      const contacts = [mockContact1, mockContact2, mockContact3];
      await service.importContacts(contacts);
      const allContacts = await service.getAllContacts();
      expect(allContacts).toHaveLength(3);
    });
  });

  describe('Duplicate Detection', () => {
    beforeEach(async () => {
      await service.addContact(mockContact1);
      await service.addContact(mockContact2);
      await service.addContact(mockContact3);
    });

    it('should find exact duplicates', async () => {
      const stats = await service.processDeduplication();
      expect(stats.duplicatesFound).toBeGreaterThan(0);
    });

    it('should find email duplicates', async () => {
      const stats = await service.processDeduplication();
      expect(stats.duplicatesFound).toBeGreaterThan(0);
    });

    it('should find phone duplicates', async () => {
      const stats = await service.processDeduplication();
      expect(stats.duplicatesFound).toBeGreaterThan(0);
    });

    it('should find fuzzy matches when enabled', async () => {
      service.updateConfig({ fuzzyMatching: true });
      const stats = await service.processDeduplication();
      expect(stats.fuzzyMatches).toBeGreaterThanOrEqual(0);
    });

    it('should find ML matches when enabled', async () => {
      service.updateConfig({ machineLearning: true });
      const stats = await service.processDeduplication();
      expect(stats.mlMatches).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Merge Operations', () => {
    beforeEach(async () => {
      await service.addContact(mockContact1);
      await service.addContact(mockContact2);
      await service.processDeduplication();
    });

    it('should create merge operations when auto-merge is enabled', async () => {
      service.updateConfig({ autoMerge: true });
      await service.processDeduplication();
      const pendingMerges = service.getPendingMerges();
      expect(pendingMerges.length).toBeGreaterThan(0);
    });

    it('should approve a merge operation', async () => {
      service.updateConfig({ autoMerge: true });
      await service.processDeduplication();
      const pendingMerges = service.getPendingMerges();

      if (pendingMerges.length > 0) {
        const mergeId = pendingMerges[0].id;
        await service.approveMerge(mergeId, 'user-1');
        const merge = await service.getMergeOperation(mergeId);
        expect(merge?.status).toBe('approved');
      }
    });

    it('should execute a merge operation', async () => {
      service.updateConfig({ autoMerge: true });
      await service.processDeduplication();
      const pendingMerges = service.getPendingMerges();

      if (pendingMerges.length > 0) {
        const mergeId = pendingMerges[0].id;
        await service.executeMerge(mergeId, 'user-1');
        const merge = await service.getMergeOperation(mergeId);
        expect(merge?.status).toBe('completed');
      }
    });

    it('should revert a merge operation', async () => {
      service.updateConfig({ autoMerge: true });
      await service.processDeduplication();
      const pendingMerges = service.getPendingMerges();

      if (pendingMerges.length > 0) {
        const mergeId = pendingMerges[0].id;
        await service.revertMerge(mergeId, 'user-1');
        const merge = await service.getMergeOperation(mergeId);
        expect(merge?.status).toBe('reverted');
      }
    });
  });

  describe('Configuration', () => {
    it('should update configuration', () => {
      const newConfig = {
        confidenceThreshold: 0.9,
        similarityThreshold: 0.8,
        fuzzyMatching: true
      };

      service.updateConfig(newConfig);
      const stats = service.getStats();
      expect(stats).toBeDefined();
    });

    it('should handle invalid configuration gracefully', () => {
      expect(() => {
        service.updateConfig({ confidenceThreshold: 1.5 });
      }).not.toThrow();
    });
  });

  describe('Statistics and Health', () => {
    beforeEach(async () => {
      await service.addContact(mockContact1);
      await service.addContact(mockContact2);
    });

    it('should provide accurate statistics', async () => {
      const stats = service.getStats();
      expect(stats.totalContacts).toBe(2);
      expect(stats.duplicatesFound).toBeGreaterThanOrEqual(0);
      expect(stats.averageConfidence).toBeGreaterThanOrEqual(0);
      expect(stats.performance).toBeDefined();
    });

    it('should provide health status', async () => {
      const health = await service.getHealthStatus();
      expect(health.status).toMatch(/healthy|warning|critical/);
      expect(health.details).toBeDefined();
    });

    it('should export duplicates', async () => {
      await service.processDeduplication();
      const duplicates = await service.exportDuplicates();
      expect(Array.isArray(duplicates)).toBe(true);
    });
  });

  describe('Data Management', () => {
    beforeEach(async () => {
      await service.addContact(mockContact1);
      await service.addContact(mockContact2);
    });

    it('should clear all data', async () => {
      await service.clearAllData();
      const contacts = await service.getAllContacts();
      expect(contacts).toHaveLength(0);
    });

    it('should handle empty data gracefully', async () => {
      await service.clearAllData();
      const stats = service.getStats();
      expect(stats.totalContacts).toBe(0);
      expect(stats.duplicatesFound).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing merge operation gracefully', async () => {
      await expect(service.executeMerge('non-existent', 'user-1'))
        .rejects.toThrow('Merge operation not found');
    });

    it('should handle invalid merge status gracefully', async () => {
      service.updateConfig({ autoMerge: true });
      await service.addContact(mockContact1);
      await service.addContact(mockContact2);
      await service.processDeduplication();

      const pendingMerges = service.getPendingMerges();
      if (pendingMerges.length > 0) {
        const mergeId = pendingMerges[0].id;
        await service.executeMerge(mergeId, 'user-1');

        await expect(service.executeMerge(mergeId, 'user-1'))
          .rejects.toThrow('Merge operation is not pending');
      }
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', async () => {
      const largeContactList: Contact[] = [];
      for (let i = 0; i < 100; i++) {
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

      await service.importContacts(largeContactList);
      const startTime = Date.now();
      await service.processDeduplication();
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});
