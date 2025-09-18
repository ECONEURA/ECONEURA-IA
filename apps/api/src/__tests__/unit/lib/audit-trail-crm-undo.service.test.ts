import { describe, it, expect, beforeEach } from 'vitest';
import { AuditTrailCRMUndoService, type AuditTrailEntry, type UndoOperation } from '../../../lib/audit-trail-crm-undo.service.js';

describe('AuditTrailCRMUndoService', () => {
  let service: AuditTrailCRMUndoService;
  let mockBefore: Record<string, any>;
  let mockAfter: Record<string, any>;

  beforeEach(() => {
    service = new AuditTrailCRMUndoService();
    mockBefore = {
      name: 'Old Company Name',
      email: 'old@company.com',
      status: 'active'
    };
    mockAfter = {
      name: 'New Company Name',
      email: 'new@company.com',
      status: 'inactive',
      phone: '+1234567890'
    };
  });

  describe('logAuditEntry', () => {
    it('should log an audit entry successfully', async () => {
      const auditEntry = await service.logAuditEntry(
        'org-123',
        'user-123',
        'user@econeura.com',
        'update',
        'company',
        'company-123',
        'Test Company',
        mockBefore,
        mockAfter
      );

      expect(auditEntry).toBeDefined();
      expect(auditEntry).toHaveProperty('id');
      expect(auditEntry).toHaveProperty('organizationId');
      expect(auditEntry).toHaveProperty('userId');
      expect(auditEntry).toHaveProperty('userEmail');
      expect(auditEntry).toHaveProperty('action');
      expect(auditEntry).toHaveProperty('resource');
      expect(auditEntry).toHaveProperty('resourceId');
      expect(auditEntry).toHaveProperty('resourceName');
      expect(auditEntry).toHaveProperty('changes');
      expect(auditEntry).toHaveProperty('metadata');
      expect(auditEntry).toHaveProperty('timestamp');
      expect(auditEntry).toHaveProperty('isReversible');
      expect(auditEntry).toHaveProperty('expiresAt');
      expect(auditEntry).toHaveProperty('status');

      expect(auditEntry.organizationId).toBe('org-123');
      expect(auditEntry.userId).toBe('user-123');
      expect(auditEntry.action).toBe('update');
      expect(auditEntry.resource).toBe('company');
      expect(auditEntry.resourceId).toBe('company-123');
      expect(auditEntry.status).toBe('active');
    });

    it('should generate proper diff for changes', async () => {
      const auditEntry = await service.logAuditEntry(
        'org-123',
        'user-123',
        'user@econeura.com',
        'update',
        'company',
        'company-123',
        'Test Company',
        mockBefore,
        mockAfter
      );

      expect(auditEntry.changes.diff).toBeDefined();
      expect(auditEntry.changes.diff.name).toBeDefined();
      expect(auditEntry.changes.diff.name.changeType).toBe('modified');
      expect(auditEntry.changes.diff.name.oldValue).toBe('Old Company Name');
      expect(auditEntry.changes.diff.name.newValue).toBe('New Company Name');

      expect(auditEntry.changes.diff.phone).toBeDefined();
      expect(auditEntry.changes.diff.phone.changeType).toBe('added');
      expect(auditEntry.changes.diff.phone.oldValue).toBeNull();
      expect(auditEntry.changes.diff.phone.newValue).toBe('+1234567890');
    });

    it('should determine if change is reversible', async () => {
      const auditEntry = await service.logAuditEntry(
        'org-123',
        'user-123',
        'user@econeura.com',
        'update',
        'company',
        'company-123',
        'Test Company',
        mockBefore,
        mockAfter
      );

      expect(auditEntry.isReversible).toBe(true);
    });

    it('should mark non-reversible actions correctly', async () => {
      const auditEntry = await service.logAuditEntry(
        'org-123',
        'user-123',
        'user@econeura.com',
        'delete',
        'company',
        'company-123',
        'Test Company',
        mockBefore,
        {}
      );

      expect(auditEntry.isReversible).toBe(false);
    });

    it('should include metadata in audit entry', async () => {
      const metadata = {
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        source: 'web' as const,
        reason: 'User requested update'
      };

      const auditEntry = await service.logAuditEntry(
        'org-123',
        'user-123',
        'user@econeura.com',
        'update',
        'company',
        'company-123',
        'Test Company',
        mockBefore,
        mockAfter,
        metadata
      );

      expect(auditEntry.metadata.ipAddress).toBe('192.168.1.1');
      expect(auditEntry.metadata.userAgent).toBe('Mozilla/5.0');
      expect(auditEntry.metadata.source).toBe('web');
      expect(auditEntry.metadata.reason).toBe('User requested update');
    });
  });

  describe('undoChange', () => {
    it('should undo a reversible change successfully', async () => {
      const auditEntry = await service.logAuditEntry(
        'org-123',
        'user-123',
        'user@econeura.com',
        'update',
        'company',
        'company-123',
        'Test Company',
        mockBefore,
        mockAfter
      );

      const undoOperation = await service.undoChange(
        auditEntry.id,
        'user-456',
        'User requested undo'
      );

      expect(undoOperation).toBeDefined();
      expect(undoOperation).toHaveProperty('id');
      expect(undoOperation).toHaveProperty('auditTrailId');
      expect(undoOperation).toHaveProperty('organizationId');
      expect(undoOperation).toHaveProperty('userId');
      expect(undoOperation).toHaveProperty('resource');
      expect(undoOperation).toHaveProperty('resourceId');
      expect(undoOperation).toHaveProperty('operation');
      expect(undoOperation).toHaveProperty('changes');
      expect(undoOperation).toHaveProperty('reason');
      expect(undoOperation).toHaveProperty('timestamp');
      expect(undoOperation).toHaveProperty('status');
      expect(undoOperation).toHaveProperty('metadata');

      expect(undoOperation.auditTrailId).toBe(auditEntry.id);
      expect(undoOperation.userId).toBe('user-456');
      expect(undoOperation.operation).toBe('undo');
      expect(undoOperation.reason).toBe('User requested undo');
      expect(undoOperation.status).toBe('completed');
    });

    it('should mark audit entry as reverted after undo', async () => {
      const auditEntry = await service.logAuditEntry(
        'org-123',
        'user-123',
        'user@econeura.com',
        'update',
        'company',
        'company-123',
        'Test Company',
        mockBefore,
        mockAfter
      );

      await service.undoChange(
        auditEntry.id,
        'user-456',
        'User requested undo'
      );

      const updatedEntry = await service.getAuditEntry(auditEntry.id);
      expect(updatedEntry?.status).toBe('reverted');
      expect(updatedEntry?.revertedAt).toBeDefined();
      expect(updatedEntry?.revertedBy).toBe('user-456');
      expect(updatedEntry?.revertReason).toBe('User requested undo');
    });

    it('should throw error for non-existent audit entry', async () => {
      await expect(
        service.undoChange('non-existent-id', 'user-456', 'Test undo')
      ).rejects.toThrow('Audit entry not found');
    });

    it('should throw error for non-reversible change', async () => {
      const auditEntry = await service.logAuditEntry(
        'org-123',
        'user-123',
        'user@econeura.com',
        'delete',
        'company',
        'company-123',
        'Test Company',
        mockBefore,
        {}
      );

      await expect(
        service.undoChange(auditEntry.id, 'user-456', 'Test undo')
      ).rejects.toThrow('This change is not reversible');
    });

    it('should throw error for already reverted entry', async () => {
      const auditEntry = await service.logAuditEntry(
        'org-123',
        'user-123',
        'user@econeura.com',
        'update',
        'company',
        'company-123',
        'Test Company',
        mockBefore,
        mockAfter
      );

      await service.undoChange(auditEntry.id, 'user-456', 'First undo');

      await expect(
        service.undoChange(auditEntry.id, 'user-456', 'Second undo')
      ).rejects.toThrow('Audit entry is not active');
    });
  });

  describe('getAuditTrail', () => {
    it('should return audit trail with pagination', async () => {
      // Crear algunas entradas de prueba
      await service.logAuditEntry(
        'org-123',
        'user-123',
        'user@econeura.com',
        'create',
        'company',
        'company-1',
        'Company 1',
        {},
        { name: 'Company 1' }
      );

      await service.logAuditEntry(
        'org-123',
        'user-456',
        'user2@econeura.com',
        'update',
        'contact',
        'contact-1',
        'Contact 1',
        { name: 'Old Contact' },
        { name: 'New Contact' }
      );

      const result = await service.getAuditTrail('org-123', {
        limit: 10,
        offset: 0
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('entries');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('pagination');

      expect(Array.isArray(result.entries)).toBe(true);
      expect(result.entries.length).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThan(0);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.offset).toBe(0);
    });

    it('should filter audit trail by resource', async () => {
      await service.logAuditEntry(
        'org-123',
        'user-123',
        'user@econeura.com',
        'create',
        'company',
        'company-1',
        'Company 1',
        {},
        { name: 'Company 1' }
      );

      await service.logAuditEntry(
        'org-123',
        'user-456',
        'user2@econeura.com',
        'update',
        'contact',
        'contact-1',
        'Contact 1',
        { name: 'Old Contact' },
        { name: 'New Contact' }
      );

      const result = await service.getAuditTrail('org-123', {
        resource: 'company',
        limit: 10,
        offset: 0
      });

      expect(result.entries.every(entry => entry.resource === 'company')).toBe(true);
    });

    it('should filter audit trail by action', async () => {
      await service.logAuditEntry(
        'org-123',
        'user-123',
        'user@econeura.com',
        'create',
        'company',
        'company-1',
        'Company 1',
        {},
        { name: 'Company 1' }
      );

      await service.logAuditEntry(
        'org-123',
        'user-456',
        'user2@econeura.com',
        'update',
        'company',
        'company-1',
        'Company 1',
        { name: 'Company 1' },
        { name: 'Updated Company 1' }
      );

      const result = await service.getAuditTrail('org-123', {
        action: 'create',
        limit: 10,
        offset: 0
      });

      expect(result.entries.every(entry => entry.action === 'create')).toBe(true);
    });

    it('should filter audit trail by user', async () => {
      await service.logAuditEntry(
        'org-123',
        'user-123',
        'user@econeura.com',
        'create',
        'company',
        'company-1',
        'Company 1',
        {},
        { name: 'Company 1' }
      );

      await service.logAuditEntry(
        'org-123',
        'user-456',
        'user2@econeura.com',
        'update',
        'company',
        'company-1',
        'Company 1',
        { name: 'Company 1' },
        { name: 'Updated Company 1' }
      );

      const result = await service.getAuditTrail('org-123', {
        userId: 'user-123',
        limit: 10,
        offset: 0
      });

      expect(result.entries.every(entry => entry.userId === 'user-123')).toBe(true);
    });
  });

  describe('getAuditEntry', () => {
    it('should return specific audit entry', async () => {
      const auditEntry = await service.logAuditEntry(
        'org-123',
        'user-123',
        'user@econeura.com',
        'update',
        'company',
        'company-123',
        'Test Company',
        mockBefore,
        mockAfter
      );

      const retrievedEntry = await service.getAuditEntry(auditEntry.id);

      expect(retrievedEntry).toBeDefined();
      expect(retrievedEntry?.id).toBe(auditEntry.id);
      expect(retrievedEntry?.organizationId).toBe('org-123');
      expect(retrievedEntry?.userId).toBe('user-123');
    });

    it('should return null for non-existent entry', async () => {
      const retrievedEntry = await service.getAuditEntry('non-existent-id');
      expect(retrievedEntry).toBeNull();
    });
  });

  describe('getUndoOperations', () => {
    it('should return undo operations with pagination', async () => {
      const auditEntry = await service.logAuditEntry(
        'org-123',
        'user-123',
        'user@econeura.com',
        'update',
        'company',
        'company-123',
        'Test Company',
        mockBefore,
        mockAfter
      );

      await service.undoChange(auditEntry.id, 'user-456', 'Test undo');

      const result = await service.getUndoOperations('org-123', {
        limit: 10,
        offset: 0
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('operations');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('pagination');

      expect(Array.isArray(result.operations)).toBe(true);
      expect(result.operations.length).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThan(0);
    });

    it('should filter undo operations by status', async () => {
      const auditEntry = await service.logAuditEntry(
        'org-123',
        'user-123',
        'user@econeura.com',
        'update',
        'company',
        'company-123',
        'Test Company',
        mockBefore,
        mockAfter
      );

      await service.undoChange(auditEntry.id, 'user-456', 'Test undo');

      const result = await service.getUndoOperations('org-123', {
        status: 'completed',
        limit: 10,
        offset: 0
      });

      expect(result.operations.every(op => op.status === 'completed')).toBe(true);
    });
  });

  describe('getStats', () => {
    it('should return audit trail statistics', async () => {
      await service.logAuditEntry(
        'org-123',
        'user-123',
        'user@econeura.com',
        'create',
        'company',
        'company-1',
        'Company 1',
        {},
        { name: 'Company 1' }
      );

      await service.logAuditEntry(
        'org-123',
        'user-456',
        'user2@econeura.com',
        'update',
        'contact',
        'contact-1',
        'Contact 1',
        { name: 'Old Contact' },
        { name: 'New Contact' }
      );

      const stats = service.getStats();

      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('totalEntries');
      expect(stats).toHaveProperty('entriesByResource');
      expect(stats).toHaveProperty('entriesByAction');
      expect(stats).toHaveProperty('entriesByUser');
      expect(stats).toHaveProperty('reversibleEntries');
      expect(stats).toHaveProperty('revertedEntries');
      expect(stats).toHaveProperty('expiredEntries');
      expect(stats).toHaveProperty('last24Hours');
      expect(stats).toHaveProperty('last7Days');
      expect(stats).toHaveProperty('last30Days');

      expect(stats.totalEntries).toBeGreaterThan(0);
      expect(stats.entriesByResource.company).toBeGreaterThan(0);
      expect(stats.entriesByResource.contact).toBeGreaterThan(0);
    });
  });

  describe('updateConfig', () => {
    it('should update configuration', () => {
      const newConfig = {
        enabled: false,
        retentionDays: 30,
        undoWindowHours: 12
      };

      expect(() => service.updateConfig(newConfig)).not.toThrow();
    });
  });

  describe('stop', () => {
    it('should stop service without errors', () => {
      expect(() => service.stop()).not.toThrow();
    });
  });
});
