import { EventEmitter } from 'events';
import { GDPRRequest } from '../lib/gdpr-types.js';
export interface GDPRHITLRequest {
    id: string;
    gdprRequestId: string;
    hitlTaskId: string;
    type: 'export_approval' | 'erase_approval' | 'data_review' | 'legal_hold_review';
    status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'escalated';
    priority: 'low' | 'normal' | 'high' | 'urgent';
    title: string;
    description: string;
    dataCategories: string[];
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    requiresLegalReview: boolean;
    assignedTo?: string;
    assignedBy: string;
    organizationId: string;
    metadata: {
        originalRequest: GDPRRequest;
        dataSummary: Record<string, any>;
        legalBasis: string;
        retentionPeriod?: number;
        affectedRecords?: number;
        businessImpact?: string;
        complianceNotes?: string;
    };
    reviewCriteria: {
        dataSensitivity: string[];
        legalRequirements: string[];
        businessJustification: string;
        technicalFeasibility: string;
        riskAssessment: string;
    };
    decisions: GDPRHITLDecision[];
    createdAt: string;
    updatedAt: string;
    dueDate?: string;
    completedAt?: string;
    slaHours: number;
}
export interface GDPRHITLDecision {
    id: string;
    requestId: string;
    decision: 'approved' | 'rejected' | 'conditional_approval' | 'escalated';
    decisionBy: string;
    decisionAt: string;
    reasoning: string;
    conditions?: string[];
    riskMitigation?: string[];
    legalBasis: string;
    complianceNotes: string;
    attachments?: string[];
    requiresFollowUp: boolean;
    followUpDate?: string;
    metadata: Record<string, any>;
}
export interface GDPRHITLWorkflow {
    id: string;
    name: string;
    description: string;
    type: 'export' | 'erase' | 'data_review';
    steps: GDPRHITLWorkflowStep[];
    autoApprovalThreshold: number;
    escalationRules: GDPRHITLEscalationRule[];
    slaHours: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}
export interface GDPRHITLWorkflowStep {
    id: string;
    name: string;
    type: 'data_review' | 'legal_review' | 'technical_review' | 'business_approval' | 'final_approval';
    assignedRole: string;
    isRequired: boolean;
    order: number;
    criteria: string[];
    autoApprovalConditions?: string[];
    escalationConditions?: string[];
    slaHours: number;
}
export interface GDPRHITLEscalationRule {
    id: string;
    condition: string;
    escalationLevel: number;
    assignedRole: string;
    slaHours: number;
    notificationChannels: string[];
}
export interface GDPRHITLStats {
    totalRequests: number;
    pendingRequests: number;
    approvedRequests: number;
    rejectedRequests: number;
    escalatedRequests: number;
    averageProcessingTime: number;
    slaCompliance: number;
    requestsByType: Record<string, number>;
    requestsByRiskLevel: Record<string, number>;
    requestsByAssignee: Record<string, number>;
    decisionsByType: Record<string, number>;
}
export declare class GDPRHITLService extends EventEmitter {
    private hitlRequests;
    private decisions;
    private workflows;
    private readonly CACHE_TTL;
    constructor();
    createGDPRHITLRequest(gdprRequestId: string, type: GDPRHITLRequest['type'], organizationId: string, assignedBy: string, options?: {
        priority?: GDPRHITLRequest['priority'];
        assignedTo?: string;
        dueDate?: string;
        slaHours?: number;
        metadata?: Record<string, any>;
    }): Promise<GDPRHITLRequest>;
    getGDPRHITLRequest(requestId: string): Promise<GDPRHITLRequest | null>;
    getGDPRHITLRequests(organizationId: string, filters?: {
        type?: GDPRHITLRequest['type'];
        status?: GDPRHITLRequest['status'];
        priority?: GDPRHITLRequest['priority'];
        riskLevel?: GDPRHITLRequest['riskLevel'];
        assignedTo?: string;
    }): Promise<GDPRHITLRequest[]>;
    makeDecision(requestId: string, decision: GDPRHITLDecision['decision'], decisionBy: string, reasoning: string, options?: {
        conditions?: string[];
        riskMitigation?: string[];
        legalBasis?: string;
        complianceNotes?: string;
        attachments?: string[];
        requiresFollowUp?: boolean;
        followUpDate?: string;
        metadata?: Record<string, any>;
    }): Promise<GDPRHITLDecision>;
    getDecisions(requestId: string): Promise<GDPRHITLDecision[]>;
    createWorkflow(workflowData: Omit<GDPRHITLWorkflow, 'id' | 'createdAt' | 'updatedAt'>): Promise<GDPRHITLWorkflow>;
    getWorkflow(workflowId: string): Promise<GDPRHITLWorkflow | null>;
    getWorkflows(type?: GDPRHITLWorkflow['type']): Promise<GDPRHITLWorkflow[]>;
    getStats(organizationId: string): Promise<GDPRHITLStats>;
    private initializeWorkflows;
    private startMonitoring;
    private checkSLACompliance;
    private assessRiskLevel;
    private requiresLegalReview;
    private mapGDPRTypeToHITLType;
    private mapRiskToPriority;
    private generateTitle;
    private generateDescription;
    private generateContent;
    private generateTags;
    private generateDataSummary;
    private getRetentionPeriod;
    private estimateAffectedRecords;
    private assessBusinessImpact;
    private generateComplianceNotes;
    private generateReviewCriteria;
    private getLegalRequirements;
    private getDataCategoryInfo;
    private getDefaultSLA;
    private getWorkflowForType;
    private setupWorkflow;
    private processDecision;
    private generateId;
}
export declare const gdprHITLService: GDPRHITLService;
//# sourceMappingURL=gdpr-hitl.service.d.ts.map