export interface Contact {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    phoneE164?: string;
    company?: string;
    organizationId: string;
    createdAt: string;
    updatedAt: string;
}
export interface DuplicateMatch {
    contactId: string;
    duplicateId: string;
    confidence: number;
    matchType: 'exact' | 'email' | 'phone' | 'similarity';
    similarity: number;
    reasons: string[];
    createdAt: string;
}
export interface MergeOperation {
    id: string;
    primaryContactId: string;
    duplicateContactIds: string[];
    status: 'pending' | 'approved' | 'completed' | 'reverted';
    approvedBy?: string;
    createdAt: string;
}
export interface DedupeConfig {
    enabled: boolean;
    autoMerge: boolean;
    confidenceThreshold: number;
    similarityThreshold: number;
    fuzzyMatching: boolean;
    machineLearning: boolean;
    batchSize: number;
    maxProcessingTime: number;
    notificationChannels: string[];
}
export interface DedupeStats {
    totalContacts: number;
    duplicatesFound: number;
    duplicatesResolved: number;
    mergeOperations: number;
    averageConfidence: number;
    lastRun: string;
    processingTime: number;
    fuzzyMatches: number;
    mlMatches: number;
    accuracy: number;
    performance: {
        contactsPerSecond: number;
        memoryUsage: number;
        cpuUsage: number;
    };
}
export declare class ContactsDedupeService {
    private config;
    private contacts;
    private duplicates;
    private mergeOperations;
    private isProcessing;
    constructor(config?: Partial<DedupeConfig>);
    processDeduplication(): Promise<DedupeStats>;
    private findExactDuplicates;
    private findEmailDuplicates;
    private findPhoneDuplicates;
    private createMergeOperations;
    executeMerge(mergeId: string, approvedBy: string): Promise<void>;
    private isExactDuplicate;
    private findFuzzyDuplicates;
    private findMLDuplicates;
    private calculateSimilarity;
    private stringSimilarity;
    private calculateMLScore;
    private calculateStats;
    getStats(): DedupeStats;
    getPendingMerges(): MergeOperation[];
    updateConfig(newConfig: Partial<DedupeConfig>): void;
    addContact(contact: Contact): Promise<void>;
    removeContact(contactId: string): Promise<void>;
    getContact(contactId: string): Promise<Contact | null>;
    getAllContacts(): Promise<Contact[]>;
    getDuplicatesForContact(contactId: string): Promise<DuplicateMatch[]>;
    approveMerge(mergeId: string, approvedBy: string): Promise<void>;
    revertMerge(mergeId: string, revertedBy: string): Promise<void>;
    getMergeOperation(mergeId: string): Promise<MergeOperation | null>;
    getAllMergeOperations(): Promise<MergeOperation[]>;
    getHealthStatus(): Promise<{
        status: string;
        details: any;
    }>;
    exportDuplicates(): Promise<DuplicateMatch[]>;
    importContacts(contacts: Contact[]): Promise<void>;
    clearAllData(): Promise<void>;
}
export declare const contactsDedupeService: ContactsDedupeService;
//# sourceMappingURL=contacts-dedupe.service.d.ts.map