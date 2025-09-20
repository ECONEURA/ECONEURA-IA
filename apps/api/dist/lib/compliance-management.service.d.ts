import { ComplianceRequirement, ComplianceEvidence, ComplianceControl, ComplianceTestResult, ComplianceAssessment, CreateComplianceRequirementRequest, ComplianceConfig } from './security-types.js';
export declare class ComplianceManagementService {
    private config;
    private requirements;
    private assessments;
    private findings;
    constructor(config?: Partial<ComplianceConfig>);
    createComplianceRequirement(request: CreateComplianceRequirementRequest, organizationId: string): Promise<ComplianceRequirement>;
    getComplianceRequirement(requirementId: string): Promise<ComplianceRequirement | null>;
    getComplianceRequirements(organizationId: string, filters?: {
        standard?: string;
        status?: string;
        category?: string;
        priority?: string;
    }): Promise<ComplianceRequirement[]>;
    updateComplianceRequirement(requirementId: string, updates: Partial<CreateComplianceRequirementRequest>): Promise<ComplianceRequirement | null>;
    deleteComplianceRequirement(requirementId: string): Promise<boolean>;
    private calculateNextAssessment;
    addComplianceEvidence(requirementId: string, evidence: Omit<ComplianceEvidence, 'id'>): Promise<ComplianceEvidence | null>;
    updateComplianceEvidence(requirementId: string, evidenceId: string, updates: Partial<ComplianceEvidence>): Promise<ComplianceEvidence | null>;
    removeComplianceEvidence(requirementId: string, evidenceId: string): Promise<boolean>;
    addComplianceControl(requirementId: string, control: Omit<ComplianceControl, 'id'>): Promise<ComplianceControl | null>;
    updateComplianceControl(requirementId: string, controlId: string, updates: Partial<ComplianceControl>): Promise<ComplianceControl | null>;
    addControlTestResult(requirementId: string, controlId: string, testResult: Omit<ComplianceTestResult, 'id'>): Promise<ComplianceTestResult | null>;
    performComplianceAssessment(assessment: Omit<ComplianceAssessment, 'id' | 'createdAt' | 'updatedAt'>): Promise<ComplianceAssessment>;
    private executeComplianceAssessment;
    private assessRequirement;
    private determineFindingSeverity;
    private generateFindingDescription;
    private generateFindingImpact;
    private generateFindingRecommendation;
    private calculateFindingDueDate;
    private calculateRequirementScore;
    private generateRecommendations;
    getComplianceAssessment(assessmentId: string): Promise<ComplianceAssessment | null>;
    getComplianceAssessments(organizationId: string): Promise<ComplianceAssessment[]>;
    getComplianceStatus(organizationId: string, standard?: string): Promise<{
        standard: string;
        overallScore: number;
        complianceRate: number;
        requirements: {
            total: number;
            compliant: number;
            partiallyCompliant: number;
            nonCompliant: number;
            notAssessed: number;
        };
        findings: {
            critical: number;
            high: number;
            medium: number;
            low: number;
        };
        lastAssessment?: Date;
        nextAssessment?: Date;
    }>;
    generateComplianceReport(organizationId: string, standard?: string): Promise<{
        reportId: string;
        reportUrl: string;
        summary: any;
        details: any;
    }>;
    private performAutoAssessment;
    private generateId;
    getServiceStats(): Promise<{
        totalRequirements: number;
        totalAssessments: number;
        totalFindings: number;
        config: ComplianceConfig;
    }>;
}
//# sourceMappingURL=compliance-management.service.d.ts.map