import { z } from 'zod';

import { structuredLogger } from '../lib/structured-logger.js';
import { getDatabaseService } from '../lib/database.service.js';
export const DocumentTypeSchema = z.enum([
    'pdf', 'docx', 'xlsx', 'pptx', 'txt', 'md', 'html', 'xml', 'json', 'csv', 'image', 'video', 'audio', 'other'
]);
export const DocumentStatusSchema = z.enum(['draft', 'review', 'approved', 'archived', 'deleted']);
export const DocumentPermissionSchema = z.enum(['read', 'write', 'admin', 'owner']);
export const DocumentMetadataSchema = z.object({
    title: z.string().min(1).max(255),
    description: z.string().optional(),
    tags: z.array(z.string()).default([]),
    category: z.string().optional(),
    author: z.string().min(1),
    language: z.string().default('es'),
    keywords: z.array(z.string()).default([]),
    customFields: z.record(z.any()).default({}),
    extractedText: z.string().optional(),
    summary: z.string().optional(),
    entities: z.array(z.object({
        type: z.string(),
        value: z.string(),
        confidence: z.number().min(0).max(1)
    })).default([]),
    sentiment: z.object({
        score: z.number().min(-1).max(1),
        magnitude: z.number().min(0).max(1),
        label: z.enum(['positive', 'negative', 'neutral'])
    }).optional()
});
export const DocumentVersionSchema = z.object({
    id: z.string().uuid(),
    documentId: z.string().uuid(),
    version: z.string(),
    content: z.string(),
    size: z.number().positive(),
    checksum: z.string(),
    changes: z.string().optional(),
    createdBy: z.string().uuid(),
    createdAt: z.date(),
    isActive: z.boolean().default(true)
});
export const DocumentSchema = z.object({
    id: z.string().uuid(),
    organizationId: z.string().uuid(),
    name: z.string().min(1).max(255),
    originalName: z.string().min(1).max(255),
    type: DocumentTypeSchema,
    status: DocumentStatusSchema,
    metadata: DocumentMetadataSchema,
    storagePath: z.string(),
    storageProvider: z.enum(['local', 'azure', 'aws', 'gcp']),
    encryptionKey: z.string().optional(),
    permissions: z.array(z.object({
        userId: z.string().uuid(),
        permission: DocumentPermissionSchema,
        grantedBy: z.string().uuid(),
        grantedAt: z.date()
    })).default([]),
    versions: z.array(DocumentVersionSchema).default([]),
    currentVersion: z.string(),
    size: z.number().positive(),
    mimeType: z.string(),
    checksum: z.string(),
    isPublic: z.boolean().default(false),
    isEncrypted: z.boolean().default(false),
    retentionPolicy: z.object({
        retentionDays: z.number().positive().optional(),
        autoDelete: z.boolean().default(false),
        legalHold: z.boolean().default(false)
    }).optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
    createdBy: z.string().uuid(),
    updatedBy: z.string().uuid()
});
export const DocumentSearchSchema = z.object({
    query: z.string().optional(),
    filters: z.object({
        type: z.array(DocumentTypeSchema).optional(),
        status: z.array(DocumentStatusSchema).optional(),
        author: z.array(z.string()).optional(),
        tags: z.array(z.string()).optional(),
        category: z.string().optional(),
        dateRange: z.object({
            from: z.date().optional(),
            to: z.date().optional()
        }).optional(),
        sizeRange: z.object({
            min: z.number().optional(),
            max: z.number().optional()
        }).optional()
    }).optional(),
    sort: z.object({
        field: z.enum(['name', 'createdAt', 'updatedAt', 'size', 'type']),
        direction: z.enum(['asc', 'desc'])
    }).optional(),
    pagination: z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20)
    }).optional()
});
export class DocumentManagementService {
    db;
    documents = new Map();
    documentIndex = new Map();
    searchCache = new Map();
    CACHE_TTL = 5 * 60 * 1000;
    constructor() {
        this.db = getDatabaseService();
        this.initializeService();
    }
    async initializeService() {
        try {
            structuredLogger.info('Initializing Document Management Service', {
                service: 'document-management',
                timestamp: new Date().toISOString()
            });
            await this.initializeDocumentTables();
            await this.loadExistingDocuments();
            this.startBackgroundProcessing();
            structuredLogger.info('Document Management Service initialized successfully', {
                service: 'document-management',
                documentsCount: this.documents.size
            });
        }
        catch (error) {
            structuredLogger.error('Failed to initialize Document Management Service', {
                service: 'document-management',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    async initializeDocumentTables() {
        await this.db.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'draft',
        metadata JSONB NOT NULL DEFAULT '{}',
        storage_path TEXT NOT NULL,
        storage_provider VARCHAR(50) NOT NULL DEFAULT 'local',
        encryption_key TEXT,
        permissions JSONB DEFAULT '[]',
        versions JSONB DEFAULT '[]',
        current_version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
        size BIGINT NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        checksum VARCHAR(64) NOT NULL,
        is_public BOOLEAN DEFAULT FALSE,
        is_encrypted BOOLEAN DEFAULT FALSE,
        retention_policy JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        created_by UUID NOT NULL,
        updated_by UUID NOT NULL
      )
    `);
        await this.db.query(`
      CREATE TABLE IF NOT EXISTS document_versions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        version VARCHAR(50) NOT NULL,
        content TEXT,
        size BIGINT NOT NULL,
        checksum VARCHAR(64) NOT NULL,
        changes TEXT,
        created_by UUID NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        is_active BOOLEAN DEFAULT TRUE
      )
    `);
        await this.db.query(`
      CREATE TABLE IF NOT EXISTS document_permissions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        user_id UUID NOT NULL,
        permission VARCHAR(50) NOT NULL,
        granted_by UUID NOT NULL,
        granted_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
        await this.db.query(`
      CREATE INDEX IF NOT EXISTS idx_documents_org_id ON documents(organization_id);
      CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
      CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
      CREATE INDEX IF NOT EXISTS idx_documents_created_by ON documents(created_by);
      CREATE INDEX IF NOT EXISTS idx_documents_metadata_gin ON documents USING GIN(metadata);
      CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON document_versions(document_id);
      CREATE INDEX IF NOT EXISTS idx_document_permissions_document_id ON document_permissions(document_id);
    `);
    }
    async loadExistingDocuments() {
        try {
            const result = await this.db.query(`
        SELECT * FROM documents WHERE organization_id = $1
      `, ['demo-org']);
            for (const row of result.rows) {
                const document = {
                    id: row.id,
                    organizationId: row.organization_id,
                    name: row.name,
                    originalName: row.original_name,
                    type: row.type,
                    status: row.status,
                    metadata: row.metadata,
                    storagePath: row.storage_path,
                    storageProvider: row.storage_provider,
                    encryptionKey: row.encryption_key,
                    permissions: row.permissions || [],
                    versions: row.versions || [],
                    currentVersion: row.current_version,
                    size: parseInt(row.size),
                    mimeType: row.mime_type,
                    checksum: row.checksum,
                    isPublic: row.is_public,
                    isEncrypted: row.is_encrypted,
                    retentionPolicy: row.retention_policy,
                    createdAt: new Date(row.created_at),
                    updatedAt: new Date(row.updated_at),
                    createdBy: row.created_by,
                    updatedBy: row.updated_by
                };
                this.documents.set(document.id, document);
                this.indexDocument(document);
            }
            structuredLogger.info('Loaded existing documents', {
                count: this.documents.size
            });
        }
        catch (error) {
            structuredLogger.error('Failed to load existing documents', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    startBackgroundProcessing() {
        setInterval(() => {
            this.processDocumentQueue();
        }, 30000);
        setInterval(() => {
            this.cleanupExpiredDocuments();
        }, 3600000);
    }
    async createDocument(organizationId, documentData, createdBy) {
        try {
            const documentId = this.generateId();
            const now = new Date();
            const document = {
                ...documentData,
                id: documentId,
                organizationId,
                createdAt: now,
                updatedAt: now,
                createdBy,
                updatedBy: createdBy
            };
            await this.db.query(`
        INSERT INTO documents (
          id, organization_id, name, original_name, type, status, metadata,
          storage_path, storage_provider, encryption_key, permissions, versions,
          current_version, size, mime_type, checksum, is_public, is_encrypted,
          retention_policy, created_at, updated_at, created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
      `, [
                document.id, document.organizationId, document.name, document.originalName,
                document.type, document.status, JSON.stringify(document.metadata),
                document.storagePath, document.storageProvider, document.encryptionKey,
                JSON.stringify(document.permissions), JSON.stringify(document.versions),
                document.currentVersion, document.size, document.mimeType, document.checksum,
                document.isPublic, document.isEncrypted, JSON.stringify(document.retentionPolicy),
                document.createdAt, document.updatedAt, document.createdBy, document.updatedBy
            ]);
            this.documents.set(document.id, document);
            this.indexDocument(document);
            structuredLogger.info('Document created successfully', {
                documentId: document.id,
                name: document.name,
                type: document.type,
                organizationId
            });
            return document;
        }
        catch (error) {
            structuredLogger.error('Failed to create document', {
                error: error instanceof Error ? error.message : 'Unknown error',
                organizationId
            });
            throw error;
        }
    }
    async getDocument(documentId, organizationId) {
        try {
            const document = this.documents.get(documentId);
            if (!document || document.organizationId !== organizationId) {
                return null;
            }
            return document;
        }
        catch (error) {
            structuredLogger.error('Failed to get document', {
                error: error instanceof Error ? error.message : 'Unknown error',
                documentId,
                organizationId
            });
            throw error;
        }
    }
    async updateDocument(documentId, organizationId, updates, updatedBy) {
        try {
            const document = this.documents.get(documentId);
            if (!document || document.organizationId !== organizationId) {
                return null;
            }
            const updatedDocument = {
                ...document,
                ...updates,
                updatedAt: new Date(),
                updatedBy
            };
            await this.db.query(`
        UPDATE documents SET
          name = $1, status = $2, metadata = $3, permissions = $4,
          versions = $5, current_version = $6, size = $7, mime_type = $8,
          checksum = $9, is_public = $10, is_encrypted = $11,
          retention_policy = $12, updated_at = $13, updated_by = $14
        WHERE id = $15 AND organization_id = $16
      `, [
                updatedDocument.name, updatedDocument.status, JSON.stringify(updatedDocument.metadata),
                JSON.stringify(updatedDocument.permissions), JSON.stringify(updatedDocument.versions),
                updatedDocument.currentVersion, updatedDocument.size, updatedDocument.mimeType,
                updatedDocument.checksum, updatedDocument.isPublic, updatedDocument.isEncrypted,
                JSON.stringify(updatedDocument.retentionPolicy), updatedDocument.updatedAt,
                updatedDocument.updatedBy, documentId, organizationId
            ]);
            this.documents.set(documentId, updatedDocument);
            this.indexDocument(updatedDocument);
            structuredLogger.info('Document updated successfully', {
                documentId,
                organizationId
            });
            return updatedDocument;
        }
        catch (error) {
            structuredLogger.error('Failed to update document', {
                error: error instanceof Error ? error.message : 'Unknown error',
                documentId,
                organizationId
            });
            throw error;
        }
    }
    async deleteDocument(documentId, organizationId) {
        try {
            const document = this.documents.get(documentId);
            if (!document || document.organizationId !== organizationId) {
                return false;
            }
            await this.updateDocument(documentId, organizationId, { status: 'deleted' }, 'system');
            this.documents.delete(documentId);
            this.removeDocumentFromIndex(documentId);
            structuredLogger.info('Document deleted successfully', {
                documentId,
                organizationId
            });
            return true;
        }
        catch (error) {
            structuredLogger.error('Failed to delete document', {
                error: error instanceof Error ? error.message : 'Unknown error',
                documentId,
                organizationId
            });
            throw error;
        }
    }
    async searchDocuments(organizationId, searchParams) {
        try {
            const cacheKey = `search:${organizationId}:${JSON.stringify(searchParams)}`;
            const cached = this.searchCache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
                return cached.result;
            }
            let documents = Array.from(this.documents.values())
                .filter(doc => doc.organizationId === organizationId && doc.status !== 'deleted');
            if (searchParams.filters) {
                if (searchParams.filters.type) {
                    documents = documents.filter(doc => searchParams.filters.type.includes(doc.type));
                }
                if (searchParams.filters.status) {
                    documents = documents.filter(doc => searchParams.filters.status.includes(doc.status));
                }
                if (searchParams.filters.author) {
                    documents = documents.filter(doc => searchParams.filters.author.includes(doc.metadata.author));
                }
                if (searchParams.filters.tags) {
                    documents = documents.filter(doc => searchParams.filters.tags.some(tag => doc.metadata.tags.includes(tag)));
                }
                if (searchParams.filters.category) {
                    documents = documents.filter(doc => doc.metadata.category === searchParams.filters.category);
                }
                if (searchParams.filters.dateRange) {
                    const { from, to } = searchParams.filters.dateRange;
                    if (from) {
                        documents = documents.filter(doc => doc.createdAt >= from);
                    }
                    if (to) {
                        documents = documents.filter(doc => doc.createdAt <= to);
                    }
                }
                if (searchParams.filters.sizeRange) {
                    const { min, max } = searchParams.filters.sizeRange;
                    if (min) {
                        documents = documents.filter(doc => doc.size >= min);
                    }
                    if (max) {
                        documents = documents.filter(doc => doc.size <= max);
                    }
                }
            }
            if (searchParams.query) {
                const query = searchParams.query.toLowerCase();
                documents = documents.filter(doc => doc.name.toLowerCase().includes(query) ||
                    doc.metadata.title.toLowerCase().includes(query) ||
                    doc.metadata.description?.toLowerCase().includes(query) ||
                    doc.metadata.tags.some(tag => tag.toLowerCase().includes(query)) ||
                    doc.metadata.extractedText?.toLowerCase().includes(query));
            }
            if (searchParams.sort) {
                const { field, direction } = searchParams.sort;
                documents.sort((a, b) => {
                    let aValue, bValue;
                    switch (field) {
                        case 'name':
                            aValue = a.name;
                            bValue = b.name;
                            break;
                        case 'createdAt':
                            aValue = a.createdAt;
                            bValue = b.createdAt;
                            break;
                        case 'updatedAt':
                            aValue = a.updatedAt;
                            bValue = b.updatedAt;
                            break;
                        case 'size':
                            aValue = a.size;
                            bValue = b.size;
                            break;
                        case 'type':
                            aValue = a.type;
                            bValue = b.type;
                            break;
                        default:
                            return 0;
                    }
                    if (direction === 'asc') {
                        return aValue > bValue ? 1 : -1;
                    }
                    else {
                        return aValue < bValue ? 1 : -1;
                    }
                });
            }
            const total = documents.length;
            const page = searchParams.pagination?.page || 1;
            const limit = searchParams.pagination?.limit || 20;
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            const result = {
                documents: documents.slice(startIndex, endIndex),
                total,
                page,
                limit
            };
            this.searchCache.set(cacheKey, {
                result,
                timestamp: Date.now()
            });
            return result;
        }
        catch (error) {
            structuredLogger.error('Failed to search documents', {
                error: error instanceof Error ? error.message : 'Unknown error',
                organizationId
            });
            throw error;
        }
    }
    async createDocumentVersion(documentId, organizationId, versionData) {
        try {
            const document = this.documents.get(documentId);
            if (!document || document.organizationId !== organizationId) {
                throw new Error('Document not found');
            }
            const version = {
                ...versionData,
                id: this.generateId(),
                createdAt: new Date()
            };
            await this.db.query(`
        INSERT INTO document_versions (
          id, document_id, version, content, size, checksum, changes, created_by, created_at, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
                version.id, documentId, version.version, version.content,
                version.size, version.checksum, version.changes,
                version.createdBy, version.createdAt, version.isActive
            ]);
            const updatedVersions = [...document.versions, version];
            await this.updateDocument(documentId, organizationId, {
                versions: updatedVersions,
                currentVersion: version.version
            }, version.createdBy);
            structuredLogger.info('Document version created successfully', {
                documentId,
                versionId: version.id,
                version: version.version
            });
            return version;
        }
        catch (error) {
            structuredLogger.error('Failed to create document version', {
                error: error instanceof Error ? error.message : 'Unknown error',
                documentId,
                organizationId
            });
            throw error;
        }
    }
    async grantDocumentPermission(documentId, organizationId, userId, permission, grantedBy) {
        try {
            const document = this.documents.get(documentId);
            if (!document || document.organizationId !== organizationId) {
                return false;
            }
            const newPermission = {
                userId,
                permission,
                grantedBy,
                grantedAt: new Date()
            };
            const updatedPermissions = [...document.permissions, newPermission];
            await this.updateDocument(documentId, organizationId, {
                permissions: updatedPermissions
            }, grantedBy);
            structuredLogger.info('Document permission granted', {
                documentId,
                userId,
                permission
            });
            return true;
        }
        catch (error) {
            structuredLogger.error('Failed to grant document permission', {
                error: error instanceof Error ? error.message : 'Unknown error',
                documentId,
                organizationId,
                userId
            });
            throw error;
        }
    }
    indexDocument(document) {
        if (!this.documentIndex.has(`type:${document.type}`)) {
            this.documentIndex.set(`type:${document.type}`, new Set());
        }
        this.documentIndex.get(`type:${document.type}`).add(document.id);
        if (!this.documentIndex.has(`status:${document.status}`)) {
            this.documentIndex.set(`status:${document.status}`, new Set());
        }
        this.documentIndex.get(`status:${document.status}`).add(document.id);
        if (!this.documentIndex.has(`author:${document.metadata.author}`)) {
            this.documentIndex.set(`author:${document.metadata.author}`, new Set());
        }
        this.documentIndex.get(`author:${document.metadata.author}`).add(document.id);
        document.metadata.tags.forEach(tag => {
            if (!this.documentIndex.has(`tag:${tag}`)) {
                this.documentIndex.set(`tag:${tag}`, new Set());
            }
            this.documentIndex.get(`tag:${tag}`).add(document.id);
        });
    }
    removeDocumentFromIndex(documentId) {
        for (const [key, documentIds] of this.documentIndex.entries()) {
            documentIds.delete(documentId);
            if (documentIds.size === 0) {
                this.documentIndex.delete(key);
            }
        }
    }
    async processDocumentQueue() {
        try {
            structuredLogger.debug('Processing document queue', {
                queueSize: 0
            });
        }
        catch (error) {
            structuredLogger.error('Failed to process document queue', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async cleanupExpiredDocuments() {
        try {
            const now = new Date();
            const expiredDocuments = [];
            for (const [id, document] of this.documents.entries()) {
                if (document.retentionPolicy?.autoDelete && document.retentionPolicy.retentionDays) {
                    const expirationDate = new Date(document.createdAt);
                    expirationDate.setDate(expirationDate.getDate() + document.retentionPolicy.retentionDays);
                    if (now > expirationDate) {
                        expiredDocuments.push(id);
                    }
                }
            }
            for (const documentId of expiredDocuments) {
                const document = this.documents.get(documentId);
                if (document) {
                    await this.deleteDocument(documentId, document.organizationId);
                }
            }
            if (expiredDocuments.length > 0) {
                structuredLogger.info('Cleaned up expired documents', {
                    count: expiredDocuments.length
                });
            }
        }
        catch (error) {
            structuredLogger.error('Failed to cleanup expired documents', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    generateId() {
        return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    async getDocumentStatistics(organizationId) {
        try {
            const documents = Array.from(this.documents.values())
                .filter(doc => doc.organizationId === organizationId && doc.status !== 'deleted');
            const totalDocuments = documents.length;
            const documentsByType = {};
            const documentsByStatus = {};
            let totalSize = 0;
            let recentDocuments = 0;
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            documents.forEach(doc => {
                documentsByType[doc.type] = (documentsByType[doc.type] || 0) + 1;
                documentsByStatus[doc.status] = (documentsByStatus[doc.status] || 0) + 1;
                totalSize += doc.size;
                if (doc.createdAt > oneWeekAgo) {
                    recentDocuments++;
                }
            });
            return {
                totalDocuments,
                documentsByType,
                documentsByStatus,
                totalSize,
                averageSize: totalDocuments > 0 ? totalSize / totalDocuments : 0,
                recentDocuments
            };
        }
        catch (error) {
            structuredLogger.error('Failed to get document statistics', {
                error: error instanceof Error ? error.message : 'Unknown error',
                organizationId
            });
            throw error;
        }
    }
}
export const documentManagementService = new DocumentManagementService();
//# sourceMappingURL=document-management.service.js.map