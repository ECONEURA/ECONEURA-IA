import { z } from 'zod';
export declare const DocumentTypeSchema: z.ZodEnum<["pdf", "docx", "xlsx", "pptx", "txt", "md", "html", "xml", "json", "csv", "image", "video", "audio", "other"]>;
export declare const DocumentStatusSchema: z.ZodEnum<["draft", "review", "approved", "archived", "deleted"]>;
export declare const DocumentPermissionSchema: z.ZodEnum<["read", "write", "admin", "owner"]>;
export declare const DocumentMetadataSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    category: z.ZodOptional<z.ZodString>;
    author: z.ZodString;
    language: z.ZodDefault<z.ZodString>;
    keywords: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    customFields: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
    extractedText: z.ZodOptional<z.ZodString>;
    summary: z.ZodOptional<z.ZodString>;
    entities: z.ZodDefault<z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        value: z.ZodString;
        confidence: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        value?: string;
        type?: string;
        confidence?: number;
    }, {
        value?: string;
        type?: string;
        confidence?: number;
    }>, "many">>;
    sentiment: z.ZodOptional<z.ZodObject<{
        score: z.ZodNumber;
        magnitude: z.ZodNumber;
        label: z.ZodEnum<["positive", "negative", "neutral"]>;
    }, "strip", z.ZodTypeAny, {
        score?: number;
        label?: "positive" | "negative" | "neutral";
        magnitude?: number;
    }, {
        score?: number;
        label?: "positive" | "negative" | "neutral";
        magnitude?: number;
    }>>;
}, "strip", z.ZodTypeAny, {
    language?: string;
    title?: string;
    tags?: string[];
    description?: string;
    summary?: string;
    category?: string;
    author?: string;
    customFields?: Record<string, any>;
    sentiment?: {
        score?: number;
        label?: "positive" | "negative" | "neutral";
        magnitude?: number;
    };
    keywords?: string[];
    entities?: {
        value?: string;
        type?: string;
        confidence?: number;
    }[];
    extractedText?: string;
}, {
    language?: string;
    title?: string;
    tags?: string[];
    description?: string;
    summary?: string;
    category?: string;
    author?: string;
    customFields?: Record<string, any>;
    sentiment?: {
        score?: number;
        label?: "positive" | "negative" | "neutral";
        magnitude?: number;
    };
    keywords?: string[];
    entities?: {
        value?: string;
        type?: string;
        confidence?: number;
    }[];
    extractedText?: string;
}>;
export declare const DocumentVersionSchema: z.ZodObject<{
    id: z.ZodString;
    documentId: z.ZodString;
    version: z.ZodString;
    content: z.ZodString;
    size: z.ZodNumber;
    checksum: z.ZodString;
    changes: z.ZodOptional<z.ZodString>;
    createdBy: z.ZodString;
    createdAt: z.ZodDate;
    isActive: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    version?: string;
    id?: string;
    size?: number;
    createdAt?: Date;
    content?: string;
    isActive?: boolean;
    changes?: string;
    createdBy?: string;
    checksum?: string;
    documentId?: string;
}, {
    version?: string;
    id?: string;
    size?: number;
    createdAt?: Date;
    content?: string;
    isActive?: boolean;
    changes?: string;
    createdBy?: string;
    checksum?: string;
    documentId?: string;
}>;
export declare const DocumentSchema: z.ZodObject<{
    id: z.ZodString;
    organizationId: z.ZodString;
    name: z.ZodString;
    originalName: z.ZodString;
    type: z.ZodEnum<["pdf", "docx", "xlsx", "pptx", "txt", "md", "html", "xml", "json", "csv", "image", "video", "audio", "other"]>;
    status: z.ZodEnum<["draft", "review", "approved", "archived", "deleted"]>;
    metadata: z.ZodObject<{
        title: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        category: z.ZodOptional<z.ZodString>;
        author: z.ZodString;
        language: z.ZodDefault<z.ZodString>;
        keywords: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        customFields: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
        extractedText: z.ZodOptional<z.ZodString>;
        summary: z.ZodOptional<z.ZodString>;
        entities: z.ZodDefault<z.ZodArray<z.ZodObject<{
            type: z.ZodString;
            value: z.ZodString;
            confidence: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            value?: string;
            type?: string;
            confidence?: number;
        }, {
            value?: string;
            type?: string;
            confidence?: number;
        }>, "many">>;
        sentiment: z.ZodOptional<z.ZodObject<{
            score: z.ZodNumber;
            magnitude: z.ZodNumber;
            label: z.ZodEnum<["positive", "negative", "neutral"]>;
        }, "strip", z.ZodTypeAny, {
            score?: number;
            label?: "positive" | "negative" | "neutral";
            magnitude?: number;
        }, {
            score?: number;
            label?: "positive" | "negative" | "neutral";
            magnitude?: number;
        }>>;
    }, "strip", z.ZodTypeAny, {
        language?: string;
        title?: string;
        tags?: string[];
        description?: string;
        summary?: string;
        category?: string;
        author?: string;
        customFields?: Record<string, any>;
        sentiment?: {
            score?: number;
            label?: "positive" | "negative" | "neutral";
            magnitude?: number;
        };
        keywords?: string[];
        entities?: {
            value?: string;
            type?: string;
            confidence?: number;
        }[];
        extractedText?: string;
    }, {
        language?: string;
        title?: string;
        tags?: string[];
        description?: string;
        summary?: string;
        category?: string;
        author?: string;
        customFields?: Record<string, any>;
        sentiment?: {
            score?: number;
            label?: "positive" | "negative" | "neutral";
            magnitude?: number;
        };
        keywords?: string[];
        entities?: {
            value?: string;
            type?: string;
            confidence?: number;
        }[];
        extractedText?: string;
    }>;
    storagePath: z.ZodString;
    storageProvider: z.ZodEnum<["local", "azure", "aws", "gcp"]>;
    encryptionKey: z.ZodOptional<z.ZodString>;
    permissions: z.ZodDefault<z.ZodArray<z.ZodObject<{
        userId: z.ZodString;
        permission: z.ZodEnum<["read", "write", "admin", "owner"]>;
        grantedBy: z.ZodString;
        grantedAt: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        userId?: string;
        permission?: "admin" | "read" | "write" | "owner";
        grantedBy?: string;
        grantedAt?: Date;
    }, {
        userId?: string;
        permission?: "admin" | "read" | "write" | "owner";
        grantedBy?: string;
        grantedAt?: Date;
    }>, "many">>;
    versions: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        documentId: z.ZodString;
        version: z.ZodString;
        content: z.ZodString;
        size: z.ZodNumber;
        checksum: z.ZodString;
        changes: z.ZodOptional<z.ZodString>;
        createdBy: z.ZodString;
        createdAt: z.ZodDate;
        isActive: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        version?: string;
        id?: string;
        size?: number;
        createdAt?: Date;
        content?: string;
        isActive?: boolean;
        changes?: string;
        createdBy?: string;
        checksum?: string;
        documentId?: string;
    }, {
        version?: string;
        id?: string;
        size?: number;
        createdAt?: Date;
        content?: string;
        isActive?: boolean;
        changes?: string;
        createdBy?: string;
        checksum?: string;
        documentId?: string;
    }>, "many">>;
    currentVersion: z.ZodString;
    size: z.ZodNumber;
    mimeType: z.ZodString;
    checksum: z.ZodString;
    isPublic: z.ZodDefault<z.ZodBoolean>;
    isEncrypted: z.ZodDefault<z.ZodBoolean>;
    retentionPolicy: z.ZodOptional<z.ZodObject<{
        retentionDays: z.ZodOptional<z.ZodNumber>;
        autoDelete: z.ZodDefault<z.ZodBoolean>;
        legalHold: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        retentionDays?: number;
        autoDelete?: boolean;
        legalHold?: boolean;
    }, {
        retentionDays?: number;
        autoDelete?: boolean;
        legalHold?: boolean;
    }>>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    createdBy: z.ZodString;
    updatedBy: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type?: "json" | "csv" | "pdf" | "audio" | "html" | "video" | "image" | "other" | "xml" | "docx" | "xlsx" | "pptx" | "txt" | "md";
    status?: "archived" | "draft" | "approved" | "deleted" | "review";
    organizationId?: string;
    name?: string;
    metadata?: {
        language?: string;
        title?: string;
        tags?: string[];
        description?: string;
        summary?: string;
        category?: string;
        author?: string;
        customFields?: Record<string, any>;
        sentiment?: {
            score?: number;
            label?: "positive" | "negative" | "neutral";
            magnitude?: number;
        };
        keywords?: string[];
        entities?: {
            value?: string;
            type?: string;
            confidence?: number;
        }[];
        extractedText?: string;
    };
    id?: string;
    size?: number;
    createdAt?: Date;
    updatedAt?: Date;
    mimeType?: string;
    createdBy?: string;
    updatedBy?: string;
    permissions?: {
        userId?: string;
        permission?: "admin" | "read" | "write" | "owner";
        grantedBy?: string;
        grantedAt?: Date;
    }[];
    isPublic?: boolean;
    versions?: {
        version?: string;
        id?: string;
        size?: number;
        createdAt?: Date;
        content?: string;
        isActive?: boolean;
        changes?: string;
        createdBy?: string;
        checksum?: string;
        documentId?: string;
    }[];
    currentVersion?: string;
    checksum?: string;
    originalName?: string;
    storagePath?: string;
    storageProvider?: "azure" | "local" | "gcp" | "aws";
    encryptionKey?: string;
    isEncrypted?: boolean;
    retentionPolicy?: {
        retentionDays?: number;
        autoDelete?: boolean;
        legalHold?: boolean;
    };
}, {
    type?: "json" | "csv" | "pdf" | "audio" | "html" | "video" | "image" | "other" | "xml" | "docx" | "xlsx" | "pptx" | "txt" | "md";
    status?: "archived" | "draft" | "approved" | "deleted" | "review";
    organizationId?: string;
    name?: string;
    metadata?: {
        language?: string;
        title?: string;
        tags?: string[];
        description?: string;
        summary?: string;
        category?: string;
        author?: string;
        customFields?: Record<string, any>;
        sentiment?: {
            score?: number;
            label?: "positive" | "negative" | "neutral";
            magnitude?: number;
        };
        keywords?: string[];
        entities?: {
            value?: string;
            type?: string;
            confidence?: number;
        }[];
        extractedText?: string;
    };
    id?: string;
    size?: number;
    createdAt?: Date;
    updatedAt?: Date;
    mimeType?: string;
    createdBy?: string;
    updatedBy?: string;
    permissions?: {
        userId?: string;
        permission?: "admin" | "read" | "write" | "owner";
        grantedBy?: string;
        grantedAt?: Date;
    }[];
    isPublic?: boolean;
    versions?: {
        version?: string;
        id?: string;
        size?: number;
        createdAt?: Date;
        content?: string;
        isActive?: boolean;
        changes?: string;
        createdBy?: string;
        checksum?: string;
        documentId?: string;
    }[];
    currentVersion?: string;
    checksum?: string;
    originalName?: string;
    storagePath?: string;
    storageProvider?: "azure" | "local" | "gcp" | "aws";
    encryptionKey?: string;
    isEncrypted?: boolean;
    retentionPolicy?: {
        retentionDays?: number;
        autoDelete?: boolean;
        legalHold?: boolean;
    };
}>;
export declare const DocumentSearchSchema: z.ZodObject<{
    query: z.ZodOptional<z.ZodString>;
    filters: z.ZodOptional<z.ZodObject<{
        type: z.ZodOptional<z.ZodArray<z.ZodEnum<["pdf", "docx", "xlsx", "pptx", "txt", "md", "html", "xml", "json", "csv", "image", "video", "audio", "other"]>, "many">>;
        status: z.ZodOptional<z.ZodArray<z.ZodEnum<["draft", "review", "approved", "archived", "deleted"]>, "many">>;
        author: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        category: z.ZodOptional<z.ZodString>;
        dateRange: z.ZodOptional<z.ZodObject<{
            from: z.ZodOptional<z.ZodDate>;
            to: z.ZodOptional<z.ZodDate>;
        }, "strip", z.ZodTypeAny, {
            from?: Date;
            to?: Date;
        }, {
            from?: Date;
            to?: Date;
        }>>;
        sizeRange: z.ZodOptional<z.ZodObject<{
            min: z.ZodOptional<z.ZodNumber>;
            max: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            max?: number;
            min?: number;
        }, {
            max?: number;
            min?: number;
        }>>;
    }, "strip", z.ZodTypeAny, {
        type?: ("json" | "csv" | "pdf" | "audio" | "html" | "video" | "image" | "other" | "xml" | "docx" | "xlsx" | "pptx" | "txt" | "md")[];
        status?: ("archived" | "draft" | "approved" | "deleted" | "review")[];
        tags?: string[];
        category?: string;
        author?: string[];
        dateRange?: {
            from?: Date;
            to?: Date;
        };
        sizeRange?: {
            max?: number;
            min?: number;
        };
    }, {
        type?: ("json" | "csv" | "pdf" | "audio" | "html" | "video" | "image" | "other" | "xml" | "docx" | "xlsx" | "pptx" | "txt" | "md")[];
        status?: ("archived" | "draft" | "approved" | "deleted" | "review")[];
        tags?: string[];
        category?: string;
        author?: string[];
        dateRange?: {
            from?: Date;
            to?: Date;
        };
        sizeRange?: {
            max?: number;
            min?: number;
        };
    }>>;
    sort: z.ZodOptional<z.ZodObject<{
        field: z.ZodEnum<["name", "createdAt", "updatedAt", "size", "type"]>;
        direction: z.ZodEnum<["asc", "desc"]>;
    }, "strip", z.ZodTypeAny, {
        field?: "type" | "name" | "size" | "createdAt" | "updatedAt";
        direction?: "asc" | "desc";
    }, {
        field?: "type" | "name" | "size" | "createdAt" | "updatedAt";
        direction?: "asc" | "desc";
    }>>;
    pagination: z.ZodOptional<z.ZodObject<{
        page: z.ZodDefault<z.ZodNumber>;
        limit: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        page?: number;
        limit?: number;
    }, {
        page?: number;
        limit?: number;
    }>>;
}, "strip", z.ZodTypeAny, {
    query?: string;
    sort?: {
        field?: "type" | "name" | "size" | "createdAt" | "updatedAt";
        direction?: "asc" | "desc";
    };
    filters?: {
        type?: ("json" | "csv" | "pdf" | "audio" | "html" | "video" | "image" | "other" | "xml" | "docx" | "xlsx" | "pptx" | "txt" | "md")[];
        status?: ("archived" | "draft" | "approved" | "deleted" | "review")[];
        tags?: string[];
        category?: string;
        author?: string[];
        dateRange?: {
            from?: Date;
            to?: Date;
        };
        sizeRange?: {
            max?: number;
            min?: number;
        };
    };
    pagination?: {
        page?: number;
        limit?: number;
    };
}, {
    query?: string;
    sort?: {
        field?: "type" | "name" | "size" | "createdAt" | "updatedAt";
        direction?: "asc" | "desc";
    };
    filters?: {
        type?: ("json" | "csv" | "pdf" | "audio" | "html" | "video" | "image" | "other" | "xml" | "docx" | "xlsx" | "pptx" | "txt" | "md")[];
        status?: ("archived" | "draft" | "approved" | "deleted" | "review")[];
        tags?: string[];
        category?: string;
        author?: string[];
        dateRange?: {
            from?: Date;
            to?: Date;
        };
        sizeRange?: {
            max?: number;
            min?: number;
        };
    };
    pagination?: {
        page?: number;
        limit?: number;
    };
}>;
export type DocumentType = z.infer<typeof DocumentTypeSchema>;
export type DocumentStatus = z.infer<typeof DocumentStatusSchema>;
export type DocumentPermission = z.infer<typeof DocumentPermissionSchema>;
export type DocumentMetadata = z.infer<typeof DocumentMetadataSchema>;
export type DocumentVersion = z.infer<typeof DocumentVersionSchema>;
export type Document = z.infer<typeof DocumentSchema>;
export type DocumentSearch = z.infer<typeof DocumentSearchSchema>;
export declare class DocumentManagementService {
    private db;
    private documents;
    private documentIndex;
    private searchCache;
    private readonly CACHE_TTL;
    constructor();
    private initializeService;
    private initializeDocumentTables;
    private loadExistingDocuments;
    private startBackgroundProcessing;
    createDocument(organizationId: string, documentData: Omit<Document, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>, createdBy: string): Promise<Document>;
    getDocument(documentId: string, organizationId: string): Promise<Document | null>;
    updateDocument(documentId: string, organizationId: string, updates: Partial<Document>, updatedBy: string): Promise<Document | null>;
    deleteDocument(documentId: string, organizationId: string): Promise<boolean>;
    searchDocuments(organizationId: string, searchParams: DocumentSearch): Promise<{
        documents: Document[];
        total: number;
        page: number;
        limit: number;
    }>;
    createDocumentVersion(documentId: string, organizationId: string, versionData: Omit<DocumentVersion, 'id' | 'createdAt'>): Promise<DocumentVersion>;
    grantDocumentPermission(documentId: string, organizationId: string, userId: string, permission: DocumentPermission, grantedBy: string): Promise<boolean>;
    private indexDocument;
    private removeDocumentFromIndex;
    private processDocumentQueue;
    private cleanupExpiredDocuments;
    private generateId;
    getDocumentStatistics(organizationId: string): Promise<{
        totalDocuments: number;
        documentsByType: Record<string, number>;
        documentsByStatus: Record<string, number>;
        totalSize: number;
        averageSize: number;
        recentDocuments: number;
    }>;
}
export declare const documentManagementService: DocumentManagementService;
//# sourceMappingURL=document-management.service.d.ts.map