/**
 * DOCUMENT MANAGEMENT SERVICE TESTS
 *
 * PR-54: Tests unitarios para el servicio de gestión de documentos
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DocumentManagementService } from '../../../services/document-management.service.js';

// Mock del servicio de base de datos
const mockDb = {
  query: vi.fn(),
};

// Mock del structured logger
vi.mock('../../../lib/structured-logger.js', () => ({
  structuredLogger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock del servicio de base de datos
vi.mock('../../../lib/database.service.js', () => ({
  getDatabaseService: () => mockDb,
}));

describe('DocumentManagementService', () => {
  let service: DocumentManagementService;
  const mockOrganizationId = 'test-org';
  const mockUserId = 'test-user';

  beforeEach(() => {
    vi.clearAllMocks();
    service = new DocumentManagementService();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('createDocument', () => {
    it('should create a document successfully', async () => {
      const documentData = {
        name: 'Test Document',
        originalName: 'test-document.pdf',
        type: 'pdf' as const,
        status: 'draft' as const,
        metadata: {
          title: 'Test Document',
          description: 'A test document',
          tags: ['test', 'document'],
          category: 'test',
          author: 'Test Author',
          language: 'es',
          keywords: ['test'],
          customFields: {},
        },
        storagePath: '/storage/test-document.pdf',
        storageProvider: 'local' as const,
        size: 1024,
        mimeType: 'application/pdf',
        checksum: 'abc123',
        isPublic: false,
        isEncrypted: false,
        retentionPolicy: {
          retentionDays: 365,
          autoDelete: false,
          legalHold: false,
        },
      };

      mockDb.query.mockResolvedValue({ rows: [] });

      const result = await service.createDocument(
        mockOrganizationId,
        documentData,
        mockUserId
      );

      expect(result).toBeDefined();
      expect(result.name).toBe(documentData.name);
      expect(result.type).toBe(documentData.type);
      expect(result.organizationId).toBe(mockOrganizationId);
      expect(result.createdBy).toBe(mockUserId);
      expect(mockDb.query).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      const documentData = {
        name: 'Test Document',
        originalName: 'test-document.pdf',
        type: 'pdf' as const,
        status: 'draft' as const,
        metadata: {
          title: 'Test Document',
          description: 'A test document',
          tags: ['test'],
          category: 'test',
          author: 'Test Author',
          language: 'es',
          keywords: ['test'],
          customFields: {},
        },
        storagePath: '/storage/test-document.pdf',
        storageProvider: 'local' as const,
        size: 1024,
        mimeType: 'application/pdf',
        checksum: 'abc123',
        isPublic: false,
        isEncrypted: false,
      };

      mockDb.query.mockRejectedValue(new Error('Database error'));

      await expect(
        service.createDocument(mockOrganizationId, documentData, mockUserId);
      ).rejects.toThrow('Database error');
    });
  });

  describe('getDocument', () => {
    it('should return a document if found', async () => {
      const documentId = 'test-doc-id';
      const mockDocument = {
        id: documentId,
        organizationId: mockOrganizationId,
        name: 'Test Document',
        originalName: 'test-document.pdf',
        type: 'pdf',
        status: 'draft',
        metadata: {
          title: 'Test Document',
          description: 'A test document',
          tags: ['test'],
          category: 'test',
          author: 'Test Author',
          language: 'es',
          keywords: ['test'],
          customFields: {},
        },
        storagePath: '/storage/test-document.pdf',
        storageProvider: 'local',
        size: 1024,
        mimeType: 'application/pdf',
        checksum: 'abc123',
        isPublic: false,
        isEncrypted: false,
        permissions: [],
        versions: [],
        currentVersion: '1.0.0',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: mockUserId,
        updatedBy: mockUserId,
      };

      // Simular que el documento existe en memoria
      (service as any).documents.set(documentId, mockDocument);

      const result = await service.getDocument(documentId, mockOrganizationId);

      expect(result).toBeDefined();
      expect(result?.id).toBe(documentId);
      expect(result?.name).toBe('Test Document');
    });

    it('should return null if document not found', async () => {
      const documentId = 'non-existent-doc';

      const result = await service.getDocument(documentId, mockOrganizationId);

      expect(result).toBeNull();
    });

    it('should return null if document belongs to different organization', async () => {
      const documentId = 'test-doc-id';
      const differentOrgId = 'different-org';
      const mockDocument = {
        id: documentId,
        organizationId: mockOrganizationId,
        name: 'Test Document',
        originalName: 'test-document.pdf',
        type: 'pdf',
        status: 'draft',
        metadata: {
          title: 'Test Document',
          description: 'A test document',
          tags: ['test'],
          category: 'test',
          author: 'Test Author',
          language: 'es',
          keywords: ['test'],
          customFields: {},
        },
        storagePath: '/storage/test-document.pdf',
        storageProvider: 'local',
        size: 1024,
        mimeType: 'application/pdf',
        checksum: 'abc123',
        isPublic: false,
        isEncrypted: false,
        permissions: [],
        versions: [],
        currentVersion: '1.0.0',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: mockUserId,
        updatedBy: mockUserId,
      };

      (service as any).documents.set(documentId, mockDocument);

      const result = await service.getDocument(documentId, differentOrgId);

      expect(result).toBeNull();
    });
  });

  describe('updateDocument', () => {
    it('should update a document successfully', async () => {
      const documentId = 'test-doc-id';
      const mockDocument = {
        id: documentId,
        organizationId: mockOrganizationId,
        name: 'Test Document',
        originalName: 'test-document.pdf',
        type: 'pdf',
        status: 'draft',
        metadata: {
          title: 'Test Document',
          description: 'A test document',
          tags: ['test'],
          category: 'test',
          author: 'Test Author',
          language: 'es',
          keywords: ['test'],
          customFields: {},
        },
        storagePath: '/storage/test-document.pdf',
        storageProvider: 'local',
        size: 1024,
        mimeType: 'application/pdf',
        checksum: 'abc123',
        isPublic: false,
        isEncrypted: false,
        permissions: [],
        versions: [],
        currentVersion: '1.0.0',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: mockUserId,
        updatedBy: mockUserId,
      };

      (service as any).documents.set(documentId, mockDocument);
      mockDb.query.mockResolvedValue({ rows: [] });

      const updates = {
        name: 'Updated Document',
        status: 'approved' as const,
      };

      const result = await service.updateDocument(
        documentId,
        mockOrganizationId,
        updates,
        mockUserId
      );

      expect(result).toBeDefined();
      expect(result?.name).toBe('Updated Document');
      expect(result?.status).toBe('approved');
      expect(result?.updatedBy).toBe(mockUserId);
      expect(mockDb.query).toHaveBeenCalled();
    });

    it('should return null if document not found', async () => {
      const documentId = 'non-existent-doc';
      const updates = { name: 'Updated Document' };

      const result = await service.updateDocument(
        documentId,
        mockOrganizationId,
        updates,
        mockUserId
      );

      expect(result).toBeNull();
    });
  });

  describe('deleteDocument', () => {
    it('should delete a document successfully', async () => {
      const documentId = 'test-doc-id';
      const mockDocument = {
        id: documentId,
        organizationId: mockOrganizationId,
        name: 'Test Document',
        originalName: 'test-document.pdf',
        type: 'pdf',
        status: 'draft',
        metadata: {
          title: 'Test Document',
          description: 'A test document',
          tags: ['test'],
          category: 'test',
          author: 'Test Author',
          language: 'es',
          keywords: ['test'],
          customFields: {},
        },
        storagePath: '/storage/test-document.pdf',
        storageProvider: 'local',
        size: 1024,
        mimeType: 'application/pdf',
        checksum: 'abc123',
        isPublic: false,
        isEncrypted: false,
        permissions: [],
        versions: [],
        currentVersion: '1.0.0',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: mockUserId,
        updatedBy: mockUserId,
      };

      (service as any).documents.set(documentId, mockDocument);
      mockDb.query.mockResolvedValue({ rows: [] });

      const result = await service.deleteDocument(documentId, mockOrganizationId);

      expect(result).toBe(true);
      expect(mockDb.query).toHaveBeenCalled();
    });

    it('should return false if document not found', async () => {
      const documentId = 'non-existent-doc';

      const result = await service.deleteDocument(documentId, mockOrganizationId);

      expect(result).toBe(false);
    });
  });

  describe('searchDocuments', () => {
    it('should search documents with filters', async () => {
      const mockDocuments = [
        {
          id: 'doc1',
          organizationId: mockOrganizationId,
          name: 'Document 1',
          originalName: 'doc1.pdf',
          type: 'pdf',
          status: 'draft',
          metadata: {
            title: 'Document 1',
            description: 'First document',
            tags: ['test'],
            category: 'test',
            author: 'Author 1',
            language: 'es',
            keywords: ['test'],
            customFields: {},
          },
          storagePath: '/storage/doc1.pdf',
          storageProvider: 'local',
          size: 1024,
          mimeType: 'application/pdf',
          checksum: 'abc123',
          isPublic: false,
          isEncrypted: false,
          permissions: [],
          versions: [],
          currentVersion: '1.0.0',
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: mockUserId,
          updatedBy: mockUserId,
        },
        {
          id: 'doc2',
          organizationId: mockOrganizationId,
          name: 'Document 2',
          originalName: 'doc2.docx',
          type: 'docx',
          status: 'approved',
          metadata: {
            title: 'Document 2',
            description: 'Second document',
            tags: ['test', 'approved'],
            category: 'test',
            author: 'Author 2',
            language: 'es',
            keywords: ['test'],
            customFields: {},
          },
          storagePath: '/storage/doc2.docx',
          storageProvider: 'local',
          size: 2048,
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          checksum: 'def456',
          isPublic: false,
          isEncrypted: false,
          permissions: [],
          versions: [],
          currentVersion: '1.0.0',
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: mockUserId,
          updatedBy: mockUserId,
        },
      ];

      (service as any).documents.set('doc1', mockDocuments[0]);
      (service as any).documents.set('doc2', mockDocuments[1]);

      const searchParams = {
        filters: {
          type: ['pdf'],
          status: ['draft'],
        },
        pagination: {
          page: 1,
          limit: 10,
        },
      };

      const result = await service.searchDocuments(mockOrganizationId, searchParams);

      expect(result).toBeDefined();
      expect(result.documents).toHaveLength(1);
      expect(result.documents[0].type).toBe('pdf');
      expect(result.documents[0].status).toBe('draft');
      expect(result.total).toBe(1);
    });

    it('should search documents by text query', async () => {
      const mockDocuments = [
        {
          id: 'doc1',
          organizationId: mockOrganizationId,
          name: 'Test Document',
          originalName: 'test-doc.pdf',
          type: 'pdf',
          status: 'draft',
          metadata: {
            title: 'Test Document',
            description: 'A test document',
            tags: ['test'],
            category: 'test',
            author: 'Test Author',
            language: 'es',
            keywords: ['test'],
            customFields: {},
            extractedText: 'This is a test document content',
          },
          storagePath: '/storage/test-doc.pdf',
          storageProvider: 'local',
          size: 1024,
          mimeType: 'application/pdf',
          checksum: 'abc123',
          isPublic: false,
          isEncrypted: false,
          permissions: [],
          versions: [],
          currentVersion: '1.0.0',
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: mockUserId,
          updatedBy: mockUserId,
        },
      ];

      (service as any).documents.set('doc1', mockDocuments[0]);

      const searchParams = {
        query: 'test',
        pagination: {
          page: 1,
          limit: 10,
        },
      };

      const result = await service.searchDocuments(mockOrganizationId, searchParams);

      expect(result).toBeDefined();
      expect(result.documents).toHaveLength(1);
      expect(result.documents[0].name).toBe('Test Document');
    });
  });

  describe('createDocumentVersion', () => {
    it('should create a document version successfully', async () => {
      const documentId = 'test-doc-id';
      const mockDocument = {
        id: documentId,
        organizationId: mockOrganizationId,
        name: 'Test Document',
        originalName: 'test-document.pdf',
        type: 'pdf',
        status: 'draft',
        metadata: {
          title: 'Test Document',
          description: 'A test document',
          tags: ['test'],
          category: 'test',
          author: 'Test Author',
          language: 'es',
          keywords: ['test'],
          customFields: {},
        },
        storagePath: '/storage/test-document.pdf',
        storageProvider: 'local',
        size: 1024,
        mimeType: 'application/pdf',
        checksum: 'abc123',
        isPublic: false,
        isEncrypted: false,
        permissions: [],
        versions: [],
        currentVersion: '1.0.0',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: mockUserId,
        updatedBy: mockUserId,
      };

      (service as any).documents.set(documentId, mockDocument);
      mockDb.query.mockResolvedValue({ rows: [] });

      const versionData = {
        documentId,
        version: '2.0.0',
        content: 'Updated content',
        size: 2048,
        checksum: 'def456',
        changes: 'Updated document content',
        createdBy: mockUserId,
      };

      const result = await service.createDocumentVersion(
        documentId,
        mockOrganizationId,
        versionData
      );

      expect(result).toBeDefined();
      expect(result.version).toBe('2.0.0');
      expect(result.documentId).toBe(documentId);
      expect(mockDb.query).toHaveBeenCalled();
    });

    it('should throw error if document not found', async () => {
      const documentId = 'non-existent-doc';
      const versionData = {
        documentId,
        version: '2.0.0',
        content: 'Updated content',
        size: 2048,
        checksum: 'def456',
        changes: 'Updated document content',
        createdBy: mockUserId,
      };

      await expect(
        service.createDocumentVersion(documentId, mockOrganizationId, versionData);
      ).rejects.toThrow('Document not found');
    });
  });

  describe('grantDocumentPermission', () => {
    it('should grant document permission successfully', async () => {
      const documentId = 'test-doc-id';
      const mockDocument = {
        id: documentId,
        organizationId: mockOrganizationId,
        name: 'Test Document',
        originalName: 'test-document.pdf',
        type: 'pdf',
        status: 'draft',
        metadata: {
          title: 'Test Document',
          description: 'A test document',
          tags: ['test'],
          category: 'test',
          author: 'Test Author',
          language: 'es',
          keywords: ['test'],
          customFields: {},
        },
        storagePath: '/storage/test-document.pdf',
        storageProvider: 'local',
        size: 1024,
        mimeType: 'application/pdf',
        checksum: 'abc123',
        isPublic: false,
        isEncrypted: false,
        permissions: [],
        versions: [],
        currentVersion: '1.0.0',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: mockUserId,
        updatedBy: mockUserId,
      };

      (service as any).documents.set(documentId, mockDocument);
      mockDb.query.mockResolvedValue({ rows: [] });

      const result = await service.grantDocumentPermission(
        documentId,
        mockOrganizationId,
        'other-user',
        'read',
        mockUserId
      );

      expect(result).toBe(true);
      expect(mockDb.query).toHaveBeenCalled();
    });

    it('should return false if document not found', async () => {
      const documentId = 'non-existent-doc';

      const result = await service.grantDocumentPermission(
        documentId,
        mockOrganizationId,
        'other-user',
        'read',
        mockUserId
      );

      expect(result).toBe(false);
    });
  });

  describe('getDocumentStatistics', () => {
    it('should return document statistics', async () => {
      const mockDocuments = [
        {
          id: 'doc1',
          organizationId: mockOrganizationId,
          name: 'Document 1',
          originalName: 'doc1.pdf',
          type: 'pdf',
          status: 'draft',
          metadata: {
            title: 'Document 1',
            description: 'First document',
            tags: ['test'],
            category: 'test',
            author: 'Author 1',
            language: 'es',
            keywords: ['test'],
            customFields: {},
          },
          storagePath: '/storage/doc1.pdf',
          storageProvider: 'local',
          size: 1024,
          mimeType: 'application/pdf',
          checksum: 'abc123',
          isPublic: false,
          isEncrypted: false,
          permissions: [],
          versions: [],
          currentVersion: '1.0.0',
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: mockUserId,
          updatedBy: mockUserId,
        },
        {
          id: 'doc2',
          organizationId: mockOrganizationId,
          name: 'Document 2',
          originalName: 'doc2.docx',
          type: 'docx',
          status: 'approved',
          metadata: {
            title: 'Document 2',
            description: 'Second document',
            tags: ['test'],
            category: 'test',
            author: 'Author 2',
            language: 'es',
            keywords: ['test'],
            customFields: {},
          },
          storagePath: '/storage/doc2.docx',
          storageProvider: 'local',
          size: 2048,
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          checksum: 'def456',
          isPublic: false,
          isEncrypted: false,
          permissions: [],
          versions: [],
          currentVersion: '1.0.0',
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: mockUserId,
          updatedBy: mockUserId,
        },
      ];

      (service as any).documents.set('doc1', mockDocuments[0]);
      (service as any).documents.set('doc2', mockDocuments[1]);

      const result = await service.getDocumentStatistics(mockOrganizationId);

      expect(result).toBeDefined();
      expect(result.totalDocuments).toBe(2);
      expect(result.documentsByType.pdf).toBe(1);
      expect(result.documentsByType.docx).toBe(1);
      expect(result.documentsByStatus.draft).toBe(1);
      expect(result.documentsByStatus.approved).toBe(1);
      expect(result.totalSize).toBe(3072);
      expect(result.averageSize).toBe(1536);
    });
  });
});
