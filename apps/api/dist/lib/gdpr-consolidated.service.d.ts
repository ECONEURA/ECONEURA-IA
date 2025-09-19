import { GDPRRequest, DataExport, DataErase, LegalHold, ConsentRecord, DataProcessingActivity, BreachRecord, GDPRComplianceReport, GDPRStats } from './gdpr-types.js';
export declare class GDPRConsolidatedService {
    private gdprRequests;
    private dataExports;
    private dataErasures;
    private legalHolds;
    private dataCategories;
    private consentRecords;
    private dataProcessingActivities;
    private breachRecords;
    private auditEntries;
    constructor();
    createGDPRRequest(userId: string, type: GDPRRequest['type'], requestedBy: string, dataCategories: string[], options?: {
        reason?: string;
        legalBasis?: string;
        scope?: 'user' | 'organization';
        priority?: 'low' | 'medium' | 'high' | 'urgent';
        metadata?: Record<string, unknown>;
    }): Promise<GDPRRequest>;
    getGDPRRequest(requestId: string): Promise<GDPRRequest | null>;
    getGDPRRequests(userId?: string, filters?: {
        type?: GDPRRequest['type'];
        status?: GDPRRequest['status'];
        priority?: GDPRRequest['priority'];
    }): Promise<GDPRRequest[]>;
    updateGDPRRequestStatus(requestId: string, status: GDPRRequest['status'], processedBy: string, details?: Record<string, unknown>): Promise<GDPRRequest | null>;
    private processExportRequest;
    private generateExport;
    getDataExport(exportId: string): Promise<DataExport | null>;
    getUserExports(userId: string): Promise<DataExport[]>;
    downloadExport(exportId: string, userId: string): Promise<DataExport | null>;
    private processEraseRequest;
    private processErase;
    getDataErase(eraseId: string): Promise<DataErase | null>;
    getUserErasures(userId: string): Promise<DataErase[]>;
    createLegalHold(legalHold: Omit<LegalHold, 'id' | 'createdAt' | 'updatedAt'>): Promise<LegalHold>;
    getLegalHold(holdId: string): Promise<LegalHold | null>;
    getLegalHolds(filters?: {
        status?: LegalHold['status'];
        type?: LegalHold['type'];
        userId?: string;
    }): Promise<LegalHold[]>;
    updateLegalHold(holdId: string, updates: Partial<LegalHold>): Promise<LegalHold | null>;
    deleteLegalHold(holdId: string): Promise<boolean>;
    createConsentRecord(consentRecord: Omit<ConsentRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<ConsentRecord>;
    getConsentRecords(userId: string, dataCategory?: string): Promise<ConsentRecord[]>;
    withdrawConsent(consentId: string, userId: string): Promise<ConsentRecord | null>;
    createDataProcessingActivity(activity: Omit<DataProcessingActivity, 'id' | 'createdAt' | 'updatedAt'>): Promise<DataProcessingActivity>;
    getDataProcessingActivities(): Promise<DataProcessingActivity[]>;
    createBreachRecord(breach: Omit<BreachRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<BreachRecord>;
    getBreachRecords(filters?: {
        status?: BreachRecord['status'];
        severity?: BreachRecord['severity'];
        type?: BreachRecord['type'];
    }): Promise<BreachRecord[]>;
    generateComplianceReport(organizationId: string, period: {
        start: Date;
        end: Date;
    }, generatedBy: string): Promise<GDPRComplianceReport>;
    getGDPRStats(): Promise<GDPRStats>;
    private initializeDataCategories;
    private initializeLegalHolds;
    private startMonitoring;
    private cleanupExpiredExports;
    private updateLegalHoldStatuses;
    private generateId;
    private createAuditEntry;
    private generateSignature;
    private collectUserData;
    private getPersonalInfo;
    private getFinancialData;
    private getSEPATransactions;
    private getCRMData;
    private getAuditLogs;
    private generateFile;
    private countRecords;
    private calculateFileSize;
    private generateChecksum;
    private checkLegalHolds;
    private countRecordsToErase;
    private createBackup;
    private performErase;
    private generateVerificationHash;
    private generateRecommendations;
    private calculateComplianceScore;
    private processRectificationRequest;
    private processPortabilityRequest;
    getServiceStats(): Promise<{
        gdpr: GDPRStats;
        exports: {
            totalExports: number;
            pendingExports: number;
            readyExports: number;
            downloadedExports: number;
            expiredExports: number;
            averageFileSize: number;
        };
        erasures: {
            totalErasures: number;
            pendingErasures: number;
            processingErasures: number;
            completedErasures: number;
            failedErasures: number;
            totalRecordsErased: number;
            averageProcessingTime: number;
        };
    }>;
}
export declare const gdprConsolidated: GDPRConsolidatedService;
//# sourceMappingURL=gdpr-consolidated.service.d.ts.map