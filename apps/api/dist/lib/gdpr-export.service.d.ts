import { DataExport, DataCategory } from './gdpr-types.js';
export declare class GDPRExportService {
    private exports;
    private dataCategories;
    constructor();
    private initializeDataCategories;
    createExportRequest(userId: string, requestedBy: string, dataCategories: string[], format?: 'zip' | 'json' | 'csv' | 'pdf', scope?: 'user' | 'organization'): Promise<DataExport>;
    private generateExport;
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
    private validateDataCategories;
    getExport(exportId: string): DataExport | null;
    getUserExports(userId: string): DataExport[];
    getAllExports(): DataExport[];
    deleteExport(exportId: string): boolean;
    getDataCategories(): DataCategory[];
    getExportStats(): {
        totalExports: number;
        pendingExports: number;
        readyExports: number;
        downloadedExports: number;
        expiredExports: number;
        averageFileSize: number;
    };
}
//# sourceMappingURL=gdpr-export.service.d.ts.map