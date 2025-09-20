export interface ScanResult {
    id: string;
    moduleId: string;
    moduleType: 'file' | 'email' | 'api' | 'database' | 'cache' | 'queue';
    status: 'clean' | 'infected' | 'quarantined' | 'scanning' | 'error';
    threats: Threat[];
    scanTime: number;
    timestamp: string;
    metadata: {
        fileSize?: number;
        fileType?: string;
        checksum?: string;
        source?: string;
        destination?: string;
    };
}
export interface Threat {
    id: string;
    type: 'virus' | 'malware' | 'trojan' | 'spyware' | 'adware' | 'ransomware' | 'phishing' | 'suspicious';
    name: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    signature: string;
    confidence: number;
    action: 'quarantine' | 'delete' | 'clean' | 'ignore';
    metadata: Record<string, any>;
}
export interface QuarantineItem {
    id: string;
    moduleId: string;
    moduleType: string;
    threatId: string;
    originalPath: string;
    quarantinePath: string;
    quarantinedAt: string;
    quarantinedBy: string;
    reason: string;
    status: 'quarantined' | 'restored' | 'deleted' | 'cleaned';
    metadata: Record<string, any>;
}
export interface ScanConfig {
    enabled: boolean;
    realTimeScanning: boolean;
    quarantineEnabled: boolean;
    autoClean: boolean;
    scanInterval: number;
    maxFileSize: number;
    allowedExtensions: string[];
    blockedExtensions: string[];
    quarantineRetentionDays: number;
    modules: {
        file: boolean;
        email: boolean;
        api: boolean;
        database: boolean;
        cache: boolean;
        queue: boolean;
    };
    threatDatabase: {
        enabled: boolean;
        updateInterval: number;
        sources: string[];
    };
}
export interface AVStats {
    totalScans: number;
    cleanScans: number;
    infectedScans: number;
    quarantinedItems: number;
    threatsDetected: number;
    lastScan: string;
    scanSuccessRate: number;
    averageScanTime: number;
    topThreats: Record<string, number>;
    moduleStats: Record<string, {
        scans: number;
        threats: number;
        quarantined: number;
    }>;
}
export declare class AntivirusGlobalService {
    private config;
    private quarantineItems;
    private scanResults;
    private stats;
    private isScanning;
    private scanInterval;
    private threatDatabase;
    constructor(config?: Partial<ScanConfig>);
    private initializeThreatDatabase;
    private startPeriodicScanning;
    performGlobalScan(): Promise<AVStats>;
    private scanModule;
    private generateMockItems;
    scanItem(item: any, moduleType: string): Promise<ScanResult>;
    private detectThreats;
    private generateChecksum;
    private generateSignature;
    quarantineItem(item: any, threat: Threat): Promise<QuarantineItem>;
    getQuarantineItems(): QuarantineItem[];
    getScanResults(): ScanResult[];
    getStats(): AVStats;
    private getTopThreats;
    updateConfig(newConfig: Partial<ScanConfig>): void;
    restoreFromQuarantine(quarantineId: string): Promise<void>;
    deleteFromQuarantine(quarantineId: string): Promise<void>;
    stop(): void;
}
export declare const antivirusGlobalService: AntivirusGlobalService;
//# sourceMappingURL=antivirus-global.service.d.ts.map