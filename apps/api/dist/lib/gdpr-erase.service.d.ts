import { DataErase, LegalHold } from './gdpr-types.js';
export declare class GDPREraseService {
    private erasures;
    private legalHolds;
    constructor();
    private initializeLegalHolds;
    createEraseRequest(userId: string, requestedBy: string, dataCategories: string[], type?: 'soft' | 'hard' | 'anonymize' | 'pseudonymize', reason?: string): Promise<DataErase>;
    private processErase;
    private countRecordsToErase;
    private countPersonalInfoRecords;
    private countFinancialRecords;
    private countSEPARecords;
    private countCRMRecords;
    private countAuditRecords;
    private createBackup;
    private performErase;
    private erasePersonalInfo;
    private eraseFinancialData;
    private eraseSEPAData;
    private eraseCRMData;
    private eraseAuditLogs;
    private generateVerificationHash;
    private checkLegalHolds;
    private validateEraseCategories;
    getErase(eraseId: string): DataErase | null;
    getUserErasures(userId: string): DataErase[];
    getAllErasures(): DataErase[];
    addLegalHold(legalHold: Omit<LegalHold, 'id' | 'createdAt' | 'updatedAt'>): LegalHold;
    getLegalHolds(): LegalHold[];
    getActiveLegalHolds(): LegalHold[];
    updateLegalHold(holdId: string, updates: Partial<LegalHold>): LegalHold | null;
    deleteLegalHold(holdId: string): boolean;
    getEraseStats(): {
        totalErasures: number;
        pendingErasures: number;
        processingErasures: number;
        completedErasures: number;
        failedErasures: number;
        totalRecordsErased: number;
        averageProcessingTime: number;
    };
}
//# sourceMappingURL=gdpr-erase.service.d.ts.map