import { z } from 'zod';
declare const CSPViolationSchema: z.ZodObject<{
    'csp-report': z.ZodObject<{
        'document-uri': z.ZodString;
        referrer: z.ZodOptional<z.ZodString>;
        'violated-directive': z.ZodString;
        'effective-directive': z.ZodOptional<z.ZodString>;
        'original-policy': z.ZodString;
        disposition: z.ZodEnum<["enforce", "report"]>;
        'blocked-uri': z.ZodOptional<z.ZodString>;
        'line-number': z.ZodOptional<z.ZodNumber>;
        'column-number': z.ZodOptional<z.ZodNumber>;
        'source-file': z.ZodOptional<z.ZodString>;
        'status-code': z.ZodOptional<z.ZodNumber>;
        'script-sample': z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        referrer?: string;
        'document-uri'?: string;
        'violated-directive'?: string;
        'effective-directive'?: string;
        'original-policy'?: string;
        disposition?: "report" | "enforce";
        'blocked-uri'?: string;
        'line-number'?: number;
        'column-number'?: number;
        'source-file'?: string;
        'status-code'?: number;
        'script-sample'?: string;
    }, {
        referrer?: string;
        'document-uri'?: string;
        'violated-directive'?: string;
        'effective-directive'?: string;
        'original-policy'?: string;
        disposition?: "report" | "enforce";
        'blocked-uri'?: string;
        'line-number'?: number;
        'column-number'?: number;
        'source-file'?: string;
        'status-code'?: number;
        'script-sample'?: string;
    }>;
}, "strip", z.ZodTypeAny, {
    'csp-report'?: {
        referrer?: string;
        'document-uri'?: string;
        'violated-directive'?: string;
        'effective-directive'?: string;
        'original-policy'?: string;
        disposition?: "report" | "enforce";
        'blocked-uri'?: string;
        'line-number'?: number;
        'column-number'?: number;
        'source-file'?: string;
        'status-code'?: number;
        'script-sample'?: string;
    };
}, {
    'csp-report'?: {
        referrer?: string;
        'document-uri'?: string;
        'violated-directive'?: string;
        'effective-directive'?: string;
        'original-policy'?: string;
        disposition?: "report" | "enforce";
        'blocked-uri'?: string;
        'line-number'?: number;
        'column-number'?: number;
        'source-file'?: string;
        'status-code'?: number;
        'script-sample'?: string;
    };
}>;
declare const SRIViolationSchema: z.ZodObject<{
    'sri-report': z.ZodObject<{
        'document-uri': z.ZodString;
        referrer: z.ZodOptional<z.ZodString>;
        'blocked-uri': z.ZodString;
        'violation-type': z.ZodEnum<["integrity-mismatch", "missing-integrity", "invalid-integrity"]>;
        'expected-hash': z.ZodOptional<z.ZodString>;
        'actual-hash': z.ZodOptional<z.ZodString>;
        algorithm: z.ZodOptional<z.ZodEnum<["sha256", "sha384", "sha512"]>>;
    }, "strip", z.ZodTypeAny, {
        algorithm?: "sha256" | "sha512" | "sha384";
        referrer?: string;
        'document-uri'?: string;
        'blocked-uri'?: string;
        'violation-type'?: "integrity-mismatch" | "missing-integrity" | "invalid-integrity";
        'expected-hash'?: string;
        'actual-hash'?: string;
    }, {
        algorithm?: "sha256" | "sha512" | "sha384";
        referrer?: string;
        'document-uri'?: string;
        'blocked-uri'?: string;
        'violation-type'?: "integrity-mismatch" | "missing-integrity" | "invalid-integrity";
        'expected-hash'?: string;
        'actual-hash'?: string;
    }>;
}, "strip", z.ZodTypeAny, {
    'sri-report'?: {
        algorithm?: "sha256" | "sha512" | "sha384";
        referrer?: string;
        'document-uri'?: string;
        'blocked-uri'?: string;
        'violation-type'?: "integrity-mismatch" | "missing-integrity" | "invalid-integrity";
        'expected-hash'?: string;
        'actual-hash'?: string;
    };
}, {
    'sri-report'?: {
        algorithm?: "sha256" | "sha512" | "sha384";
        referrer?: string;
        'document-uri'?: string;
        'blocked-uri'?: string;
        'violation-type'?: "integrity-mismatch" | "missing-integrity" | "invalid-integrity";
        'expected-hash'?: string;
        'actual-hash'?: string;
    };
}>;
export type CSPViolation = z.infer<typeof CSPViolationSchema>;
export type SRIViolation = z.infer<typeof SRIViolationSchema>;
export interface BankingCSPConfig {
    enabled: boolean;
    reportUri: string;
    enforceMode: boolean;
    strictMode: boolean;
    bankingMode: boolean;
    allowedDomains: string[];
    allowedScripts: string[];
    allowedStyles: string[];
    allowedImages: string[];
    allowedFonts: string[];
    allowedConnections: string[];
    customDirectives: Record<string, string[]>;
    reportOnly: boolean;
    maxReportAge: number;
    alertThreshold: number;
}
export interface CSPReport {
    id: string;
    timestamp: Date;
    type: 'csp' | 'sri';
    violation: CSPViolation | SRIViolation;
    severity: 'low' | 'medium' | 'high' | 'critical';
    source: string;
    userAgent: string;
    ipAddress: string;
    organizationId?: string;
    userId?: string;
    resolved: boolean;
    resolution?: string;
    tags: string[];
}
export interface CSPStats {
    totalReports: number;
    reportsByType: Record<string, number>;
    reportsBySeverity: Record<string, number>;
    reportsBySource: Record<string, number>;
    topViolations: Array<{
        directive: string;
        count: number;
        percentage: number;
    }>;
    recentTrends: Array<{
        date: string;
        count: number;
    }>;
    unresolvedCount: number;
    averageResolutionTime: number;
}
export declare class CSPBankingService {
    private config;
    private reports;
    private violationPatterns;
    private alertThresholds;
    constructor(config?: Partial<BankingCSPConfig>);
    private initializeBankingDefaults;
    private initializeViolationPatterns;
    generateCSPHeader(): string;
    generateSRIHashes(resources: Array<{
        url: string;
        content: string;
        algorithm?: 'sha256' | 'sha384' | 'sha512';
    }>): Array<{
        url: string;
        hash: string;
        algorithm: string;
        integrity: string;
    }>;
    processCSPViolation(violationData: unknown, metadata: {
        userAgent: string;
        ipAddress: string;
        organizationId?: string;
        userId?: string;
    }): Promise<CSPReport>;
    processSRIViolation(violationData: unknown, metadata: {
        userAgent: string;
        ipAddress: string;
        organizationId?: string;
        userId?: string;
    }): Promise<CSPReport>;
    private calculateSeverity;
    private calculateSRISeverity;
    private generateTags;
    private generateSRITags;
    private updateViolationPatterns;
    private updateSRIViolationPatterns;
    private checkAlertThresholds;
    private getViolationPattern;
    private generateAlert;
    private generateReportId;
    getStats(): CSPStats;
    getReports(filters?: {
        type?: 'csp' | 'sri';
        severity?: 'low' | 'medium' | 'high' | 'critical';
        resolved?: boolean;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
        offset?: number;
    }): CSPReport[];
    resolveReport(reportId: string, resolution: string): boolean;
    updateConfig(newConfig: Partial<BankingCSPConfig>): void;
    cleanupOldReports(): number;
    getConfig(): BankingCSPConfig;
    reset(): void;
}
export declare const cspBankingService: CSPBankingService;
export {};
//# sourceMappingURL=csp-sri-banking.service.d.ts.map