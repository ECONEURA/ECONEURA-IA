/**
 * GDPR Export/Erase with HITL Service
 * PR-100: GDPR Export/Erase (api) - endpoints con HITL
 * 
 * Integra GDPR Export/Erase con Human-in-the-Loop para:
 * - Aprobación manual de exportaciones sensibles
 * - Revisión humana de solicitudes de borrado
 * - Workflow de validación para datos críticos
 * - Auditoría completa de decisiones humanas
 */

import { EventEmitter } from 'events';
import { gdprConsolidated } from '../lib/gdpr-consolidated.service.js';
import { hitlV2Service, HITLTask, HITLComment } from '../lib/hitl-v2.service.js';
import { structuredLogger } from '../lib/structured-logger.js';
import { 
  GDPRRequest, 
  DataExport, 
  DataErase, 
  LegalHold,
  DataCategory 
} from '../lib/gdpr-types.js';

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

export class GDPRHITLService extends EventEmitter {
  private hitlRequests: Map<string, GDPRHITLRequest> = new Map();
  private decisions: Map<string, GDPRHITLDecision> = new Map();
  private workflows: Map<string, GDPRHITLWorkflow> = new Map();
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor() {
    super();
    this.initializeWorkflows();
    this.startMonitoring();
  }

  // ============================================================================
  // GDPR HITL REQUEST MANAGEMENT
  // ============================================================================

  async createGDPRHITLRequest(
    gdprRequestId: string,
    type: GDPRHITLRequest['type'],
    organizationId: string,
    assignedBy: string,
    options: {
      priority?: GDPRHITLRequest['priority'];
      assignedTo?: string;
      dueDate?: string;
      slaHours?: number;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<GDPRHITLRequest> {
    try {
      // Get original GDPR request
      const gdprRequest = await gdprConsolidated.getGDPRRequest(gdprRequestId);
      if (!gdprRequest) {
        throw new Error(`GDPR request ${gdprRequestId} not found`);
      }

      // Determine risk level based on data categories and type
      const riskLevel = this.assessRiskLevel(gdprRequest);
      
      // Check if legal review is required
      const requiresLegalReview = this.requiresLegalReview(gdprRequest, riskLevel);

      // Create HITL task
      const hitlTask = await hitlV2Service.createTask({
        organizationId,
        type: this.mapGDPRTypeToHITLType(type),
        status: 'pending',
        priority: options.priority || this.mapRiskToPriority(riskLevel),
        title: this.generateTitle(gdprRequest, type),
        description: this.generateDescription(gdprRequest, type, riskLevel),
        content: this.generateContent(gdprRequest, type),
        metadata: {
          gdprRequestId,
          type,
          riskLevel,
          requiresLegalReview,
          dataCategories: gdprRequest.dataCategories,
          ...options.metadata
        },
        assignedTo: options.assignedTo,
        assignedBy,
        slaHours: options.slaHours || this.getDefaultSLA(type, riskLevel),
        tags: this.generateTags(gdprRequest, type, riskLevel)
      });

      // Create GDPR HITL request
      const id = this.generateId();
      const now = new Date().toISOString();
      
      const hitlRequest: GDPRHITLRequest = {
        id,
        gdprRequestId,
        hitlTaskId: hitlTask.id,
        type,
        status: 'pending',
        priority: options.priority || this.mapRiskToPriority(riskLevel),
        title: hitlTask.title,
        description: hitlTask.description,
        dataCategories: gdprRequest.dataCategories,
        riskLevel,
        requiresLegalReview,
        assignedTo: options.assignedTo,
        assignedBy,
        organizationId,
        metadata: {
          originalRequest: gdprRequest,
          dataSummary: await this.generateDataSummary(gdprRequest),
          legalBasis: gdprRequest.legalBasis || 'consent',
          retentionPeriod: this.getRetentionPeriod(gdprRequest.dataCategories),
          affectedRecords: await this.estimateAffectedRecords(gdprRequest),
          businessImpact: this.assessBusinessImpact(gdprRequest),
          complianceNotes: this.generateComplianceNotes(gdprRequest),
          ...options.metadata
        },
        reviewCriteria: this.generateReviewCriteria(gdprRequest, type, riskLevel),
        decisions: [],
        createdAt: now,
        updatedAt: now,
        dueDate: options.dueDate,
        slaHours: options.slaHours || this.getDefaultSLA(type, riskLevel)
      };

      this.hitlRequests.set(id, hitlRequest);

      // Set up workflow if available
      const workflow = this.getWorkflowForType(type);
      if (workflow) {
        await this.setupWorkflow(hitlRequest, workflow);
      }

      structuredLogger.info('GDPR HITL request created', {
        hitlRequestId: id,
        gdprRequestId,
        hitlTaskId: hitlTask.id,
        type,
        riskLevel,
        requiresLegalReview,
        organizationId,
        requestId: ''
      });

      this.emit('hitlRequestCreated', hitlRequest);
      return hitlRequest;

    } catch (error) {
      structuredLogger.error('Failed to create GDPR HITL request', error as Error, {
        gdprRequestId,
        type,
        organizationId,
        requestId: ''
      });
      throw error;
    }
  }

  async getGDPRHITLRequest(requestId: string): Promise<GDPRHITLRequest | null> {
    return this.hitlRequests.get(requestId) || null;
  }

  async getGDPRHITLRequests(organizationId: string, filters?: {
    type?: GDPRHITLRequest['type'];
    status?: GDPRHITLRequest['status'];
    priority?: GDPRHITLRequest['priority'];
    riskLevel?: GDPRHITLRequest['riskLevel'];
    assignedTo?: string;
  }): Promise<GDPRHITLRequest[]> {
    let requests = Array.from(this.hitlRequests.values())
      .filter(req => req.organizationId === organizationId);

    if (filters) {
      if (filters.type) {
        requests = requests.filter(req => req.type === filters.type);
      }
      if (filters.status) {
        requests = requests.filter(req => req.status === filters.status);
      }
      if (filters.priority) {
        requests = requests.filter(req => req.priority === filters.priority);
      }
      if (filters.riskLevel) {
        requests = requests.filter(req => req.riskLevel === filters.riskLevel);
      }
      if (filters.assignedTo) {
        requests = requests.filter(req => req.assignedTo === filters.assignedTo);
      }
    }

    return requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // ============================================================================
  // DECISION MANAGEMENT
  // ============================================================================

  async makeDecision(
    requestId: string,
    decision: GDPRHITLDecision['decision'],
    decisionBy: string,
    reasoning: string,
    options: {
      conditions?: string[];
      riskMitigation?: string[];
      legalBasis?: string;
      complianceNotes?: string;
      attachments?: string[];
      requiresFollowUp?: boolean;
      followUpDate?: string;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<GDPRHITLDecision> {
    try {
      const hitlRequest = this.hitlRequests.get(requestId);
      if (!hitlRequest) {
        throw new Error(`GDPR HITL request ${requestId} not found`);
      }

      // Create decision record
      const decisionId = this.generateId();
      const now = new Date().toISOString();
      
      const decisionRecord: GDPRHITLDecision = {
        id: decisionId,
        requestId,
        decision,
        decisionBy,
        decisionAt: now,
        reasoning,
        conditions: options.conditions,
        riskMitigation: options.riskMitigation,
        legalBasis: options.legalBasis || hitlRequest.metadata.legalBasis,
        complianceNotes: options.complianceNotes || '',
        attachments: options.attachments,
        requiresFollowUp: options.requiresFollowUp || false,
        followUpDate: options.followUpDate,
        metadata: options.metadata || {}
      };

      this.decisions.set(decisionId, decisionRecord);
      hitlRequest.decisions.push(decisionRecord);

      // Update request status
      hitlRequest.status = decision === 'approved' ? 'approved' : 
                          decision === 'rejected' ? 'rejected' : 
                          decision === 'escalated' ? 'escalated' : 'in_progress';
      
      hitlRequest.updatedAt = now;
      
      if (decision === 'approved' || decision === 'rejected') {
        hitlRequest.completedAt = now;
      }

      // Update HITL task
      await hitlV2Service.updateTask(hitlRequest.hitlTaskId, {
        status: hitlRequest.status === 'approved' ? 'approved' : 
                hitlRequest.status === 'rejected' ? 'rejected' : 'in_progress'
      });

      // Add comment to HITL task
      await hitlV2Service.addComment(hitlRequest.hitlTaskId, {
        userId: decisionBy,
        userName: `User ${decisionBy}`,
        content: `Decision: ${decision}\nReasoning: ${reasoning}`,
        type: decision === 'approved' ? 'approval' : 'rejection'
      });

      // Process decision
      await this.processDecision(hitlRequest, decisionRecord);

      structuredLogger.info('GDPR HITL decision made', {
        requestId,
        decisionId,
        decision,
        decisionBy,
        reasoning: reasoning.substring(0, 100),
        requestId: ''
      });

      this.emit('decisionMade', { hitlRequest, decision: decisionRecord });
      return decisionRecord;

    } catch (error) {
      structuredLogger.error('Failed to make GDPR HITL decision', error as Error, {
        requestId,
        decision,
        decisionBy,
        requestId: ''
      });
      throw error;
    }
  }

  async getDecisions(requestId: string): Promise<GDPRHITLDecision[]> {
    const hitlRequest = this.hitlRequests.get(requestId);
    return hitlRequest ? hitlRequest.decisions : [];
  }

  // ============================================================================
  // WORKFLOW MANAGEMENT
  // ============================================================================

  async createWorkflow(workflowData: Omit<GDPRHITLWorkflow, 'id' | 'createdAt' | 'updatedAt'>): Promise<GDPRHITLWorkflow> {
    const id = this.generateId();
    const now = new Date().toISOString();
    
    const workflow: GDPRHITLWorkflow = {
      ...workflowData,
      id,
      createdAt: now,
      updatedAt: now
    };

    this.workflows.set(id, workflow);

    structuredLogger.info('GDPR HITL workflow created', {
      workflowId: id,
      name: workflow.name,
      type: workflow.type,
      steps: workflow.steps.length,
      requestId: ''
    });

    return workflow;
  }

  async getWorkflow(workflowId: string): Promise<GDPRHITLWorkflow | null> {
    return this.workflows.get(workflowId) || null;
  }

  async getWorkflows(type?: GDPRHITLWorkflow['type']): Promise<GDPRHITLWorkflow[]> {
    let workflows = Array.from(this.workflows.values());
    
    if (type) {
      workflows = workflows.filter(w => w.type === type);
    }

    return workflows.filter(w => w.isActive)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // ============================================================================
  // STATISTICS AND ANALYTICS
  // ============================================================================

  async getStats(organizationId: string): Promise<GDPRHITLStats> {
    const requests = Array.from(this.hitlRequests.values())
      .filter(req => req.organizationId === organizationId);
    
    const now = new Date();
    const overdueRequests = requests.filter(req => {
      if (req.status === 'approved' || req.status === 'rejected') return false;
      const createdAt = new Date(req.createdAt);
      const hoursElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      return hoursElapsed > req.slaHours;
    }).length;

    const completedRequests = requests.filter(req => 
      req.status === 'approved' || req.status === 'rejected'
    );
    
    const averageProcessingTime = completedRequests.length > 0 
      ? completedRequests.reduce((sum, req) => {
          const createdAt = new Date(req.createdAt);
          const completedAt = new Date(req.completedAt!);
          return sum + (completedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        }, 0) / completedRequests.length
      : 0;

    const slaCompliance = requests.length > 0 
      ? ((requests.length - overdueRequests) / requests.length) * 100 
      : 100;

    const requestsByType = requests.reduce((acc, req) => {
      acc[req.type] = (acc[req.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const requestsByRiskLevel = requests.reduce((acc, req) => {
      acc[req.riskLevel] = (acc[req.riskLevel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const requestsByAssignee = requests.reduce((acc, req) => {
      if (req.assignedTo) {
        acc[req.assignedTo] = (acc[req.assignedTo] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const decisionsByType = Array.from(this.decisions.values()).reduce((acc, decision) => {
      acc[decision.decision] = (acc[decision.decision] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalRequests: requests.length,
      pendingRequests: requests.filter(r => r.status === 'pending').length,
      approvedRequests: requests.filter(r => r.status === 'approved').length,
      rejectedRequests: requests.filter(r => r.status === 'rejected').length,
      escalatedRequests: requests.filter(r => r.status === 'escalated').length,
      averageProcessingTime: Math.round(averageProcessingTime * 100) / 100,
      slaCompliance: Math.round(slaCompliance * 100) / 100,
      requestsByType,
      requestsByRiskLevel,
      requestsByAssignee,
      decisionsByType
    };
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private initializeWorkflows(): void {
    // Default export workflow
    const exportWorkflow: GDPRHITLWorkflow = {
      id: 'default-export-workflow',
      name: 'Default Export Workflow',
      description: 'Standard workflow for GDPR data export requests',
      type: 'export',
      steps: [
        {
          id: 'data-review',
          name: 'Data Review',
          type: 'data_review',
          assignedRole: 'data_analyst',
          isRequired: true,
          order: 1,
          criteria: ['Verify data categories', 'Check data completeness', 'Assess data quality'],
          slaHours: 24
        },
        {
          id: 'legal-review',
          name: 'Legal Review',
          type: 'legal_review',
          assignedRole: 'legal_counsel',
          isRequired: true,
          order: 2,
          criteria: ['Verify legal basis', 'Check retention requirements', 'Assess privacy impact'],
          escalationConditions: ['High risk data', 'Legal basis unclear'],
          slaHours: 48
        },
        {
          id: 'final-approval',
          name: 'Final Approval',
          type: 'final_approval',
          assignedRole: 'data_protection_officer',
          isRequired: true,
          order: 3,
          criteria: ['Overall compliance check', 'Risk assessment', 'Business justification'],
          slaHours: 12
        }
      ],
      autoApprovalThreshold: 0.7,
      escalationRules: [
        {
          id: 'high-risk-escalation',
          condition: 'riskLevel === "high" || riskLevel === "critical"',
          escalationLevel: 1,
          assignedRole: 'senior_legal_counsel',
          slaHours: 24,
          notificationChannels: ['email', 'slack']
        }
      ],
      slaHours: 72,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Default erase workflow
    const eraseWorkflow: GDPRHITLWorkflow = {
      id: 'default-erase-workflow',
      name: 'Default Erase Workflow',
      description: 'Standard workflow for GDPR data erase requests',
      type: 'erase',
      steps: [
        {
          id: 'data-identification',
          name: 'Data Identification',
          type: 'data_review',
          assignedRole: 'data_analyst',
          isRequired: true,
          order: 1,
          criteria: ['Identify all data locations', 'Check for backups', 'Verify data dependencies'],
          slaHours: 24
        },
        {
          id: 'legal-hold-check',
          name: 'Legal Hold Check',
          type: 'legal_review',
          assignedRole: 'legal_counsel',
          isRequired: true,
          order: 2,
          criteria: ['Check active legal holds', 'Verify retention requirements', 'Assess legal obligations'],
          escalationConditions: ['Active legal holds found', 'Retention requirements conflict'],
          slaHours: 48
        },
        {
          id: 'business-impact',
          name: 'Business Impact Assessment',
          type: 'business_approval',
          assignedRole: 'business_owner',
          isRequired: true,
          order: 3,
          criteria: ['Assess business impact', 'Check system dependencies', 'Plan mitigation'],
          slaHours: 24
        },
        {
          id: 'final-approval',
          name: 'Final Approval',
          type: 'final_approval',
          assignedRole: 'data_protection_officer',
          isRequired: true,
          order: 4,
          criteria: ['Final compliance check', 'Risk mitigation review', 'Approval decision'],
          slaHours: 12
        }
      ],
      autoApprovalThreshold: 0.8,
      escalationRules: [
        {
          id: 'legal-hold-escalation',
          condition: 'activeLegalHolds.length > 0',
          escalationLevel: 1,
          assignedRole: 'senior_legal_counsel',
          slaHours: 12,
          notificationChannels: ['email', 'phone']
        }
      ],
      slaHours: 96,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.workflows.set(exportWorkflow.id, exportWorkflow);
    this.workflows.set(eraseWorkflow.id, eraseWorkflow);
  }

  private startMonitoring(): void {
    // Check SLA compliance every hour
    setInterval(() => {
      this.checkSLACompliance();
    }, 60 * 60 * 1000);
  }

  private checkSLACompliance(): void {
    const now = new Date();
    let overdueCount = 0;

    for (const request of this.hitlRequests.values()) {
      if (request.status === 'pending' || request.status === 'in_progress') {
        const createdAt = new Date(request.createdAt);
        const hoursElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        
        if (hoursElapsed > request.slaHours) {
          overdueCount++;
          this.emit('slaOverdue', request);
          
          structuredLogger.warn('GDPR HITL request SLA overdue', {
            requestId: request.id,
            gdprRequestId: request.gdprRequestId,
            title: request.title,
            slaHours: request.slaHours,
            hoursElapsed: Math.round(hoursElapsed),
            requestId: ''
          });
        }
      }
    }

    if (overdueCount > 0) {
      structuredLogger.warn('GDPR HITL SLA compliance check', {
        overdueRequests: overdueCount,
        totalRequests: this.hitlRequests.size,
        requestId: ''
      });
    }
  }

  private assessRiskLevel(gdprRequest: GDPRRequest): GDPRHITLRequest['riskLevel'] {
    const highRiskCategories = ['financial_data', 'sepa_transactions', 'audit_logs'];
    const mediumRiskCategories = ['personal_info', 'crm_data'];
    
    const hasHighRisk = gdprRequest.dataCategories.some(cat => highRiskCategories.includes(cat));
    const hasMediumRisk = gdprRequest.dataCategories.some(cat => mediumRiskCategories.includes(cat));
    
    if (hasHighRisk) return 'high';
    if (hasMediumRisk) return 'medium';
    return 'low';
  }

  private requiresLegalReview(gdprRequest: GDPRRequest, riskLevel: GDPRHITLRequest['riskLevel']): boolean {
    return riskLevel === 'high' || 
           riskLevel === 'critical' || 
           gdprRequest.type === 'erase' ||
           gdprRequest.dataCategories.includes('financial_data') ||
           gdprRequest.dataCategories.includes('sepa_transactions');
  }

  private mapGDPRTypeToHITLType(type: GDPRHITLRequest['type']): HITLTask['type'] {
    switch (type) {
      case 'export_approval':
      case 'erase_approval':
        return 'approval';
      case 'data_review':
        return 'review';
      case 'legal_hold_review':
        return 'review';
      default:
        return 'review';
    }
  }

  private mapRiskToPriority(riskLevel: GDPRHITLRequest['riskLevel']): GDPRHITLRequest['priority'] {
    switch (riskLevel) {
      case 'critical': return 'urgent';
      case 'high': return 'high';
      case 'medium': return 'normal';
      case 'low': return 'low';
      default: return 'normal';
    }
  }

  private generateTitle(gdprRequest: GDPRRequest, type: GDPRHITLRequest['type']): string {
    const typeMap = {
      'export_approval': 'Export Approval',
      'erase_approval': 'Erase Approval',
      'data_review': 'Data Review',
      'legal_hold_review': 'Legal Hold Review'
    };
    
    return `${typeMap[type]} - ${gdprRequest.type.toUpperCase()} Request for User ${gdprRequest.userId}`;
  }

  private generateDescription(gdprRequest: GDPRRequest, type: GDPRHITLRequest['type'], riskLevel: GDPRHITLRequest['riskLevel']): string {
    return `GDPR ${type.replace('_', ' ')} request for user ${gdprRequest.userId}. ` +
           `Data categories: ${gdprRequest.dataCategories.join(', ')}. ` +
           `Risk level: ${riskLevel}. ` +
           `Legal basis: ${gdprRequest.legalBasis || 'consent'}. ` +
           `Reason: ${gdprRequest.reason || 'Not specified'}.`;
  }

  private generateContent(gdprRequest: GDPRRequest, type: GDPRHITLRequest['type']): string {
    return JSON.stringify({
      gdprRequest: {
        id: gdprRequest.id,
        type: gdprRequest.type,
        userId: gdprRequest.userId,
        dataCategories: gdprRequest.dataCategories,
        legalBasis: gdprRequest.legalBasis,
        reason: gdprRequest.reason,
        priority: gdprRequest.priority,
        scope: gdprRequest.scope
      },
      requestType: type,
      timestamp: new Date().toISOString()
    }, null, 2);
  }

  private generateTags(gdprRequest: GDPRRequest, type: GDPRHITLRequest['type'], riskLevel: GDPRHITLRequest['riskLevel']): string[] {
    return [
      'gdpr',
      gdprRequest.type,
      type,
      riskLevel,
      ...gdprRequest.dataCategories
    ];
  }

  private async generateDataSummary(gdprRequest: GDPRRequest): Promise<Record<string, any>> {
    return {
      userId: gdprRequest.userId,
      dataCategories: gdprRequest.dataCategories,
      estimatedRecords: await this.estimateAffectedRecords(gdprRequest),
      dataTypes: gdprRequest.dataCategories.map(cat => this.getDataCategoryInfo(cat)),
      lastUpdated: new Date().toISOString()
    };
  }

  private getRetentionPeriod(dataCategories: string[]): number {
    // Simplified retention period calculation
    const maxRetention = Math.max(...dataCategories.map(cat => {
      switch (cat) {
        case 'financial_data':
        case 'sepa_transactions':
          return 3650; // 10 years
        case 'audit_logs':
          return 2555; // 7 years
        case 'personal_info':
        case 'crm_data':
          return 1095; // 3 years
        default:
          return 365; // 1 year
      }
    }));
    
    return maxRetention;
  }

  private async estimateAffectedRecords(gdprRequest: GDPRRequest): Promise<number> {
    // Simplified estimation
    let totalRecords = 0;
    
    for (const category of gdprRequest.dataCategories) {
      switch (category) {
        case 'personal_info':
          totalRecords += Math.floor(Math.random() * 10) + 1;
          break;
        case 'financial_data':
          totalRecords += Math.floor(Math.random() * 50) + 1;
          break;
        case 'sepa_transactions':
          totalRecords += Math.floor(Math.random() * 100) + 1;
          break;
        case 'crm_data':
          totalRecords += Math.floor(Math.random() * 20) + 1;
          break;
        case 'audit_logs':
          totalRecords += Math.floor(Math.random() * 200) + 1;
          break;
        default:
          totalRecords += Math.floor(Math.random() * 5) + 1;
      }
    }
    
    return totalRecords;
  }

  private assessBusinessImpact(gdprRequest: GDPRRequest): string {
    if (gdprRequest.type === 'erase') {
      return 'High - Data erasure may affect business operations and analytics';
    } else if (gdprRequest.dataCategories.includes('financial_data')) {
      return 'Medium - Financial data export may contain sensitive information';
    } else {
      return 'Low - Standard data export with minimal business impact';
    }
  }

  private generateComplianceNotes(gdprRequest: GDPRRequest): string {
    const notes = [];
    
    if (gdprRequest.dataCategories.includes('financial_data')) {
      notes.push('Financial data subject to banking regulations');
    }
    
    if (gdprRequest.dataCategories.includes('sepa_transactions')) {
      notes.push('SEPA transactions subject to EU payment regulations');
    }
    
    if (gdprRequest.type === 'erase') {
      notes.push('Verify no active legal holds before erasure');
    }
    
    return notes.join('; ') || 'Standard GDPR compliance requirements apply';
  }

  private generateReviewCriteria(gdprRequest: GDPRRequest, type: GDPRHITLRequest['type'], riskLevel: GDPRHITLRequest['riskLevel']): GDPRHITLRequest['reviewCriteria'] {
    return {
      dataSensitivity: gdprRequest.dataCategories,
      legalRequirements: this.getLegalRequirements(gdprRequest),
      businessJustification: gdprRequest.reason || 'Not provided',
      technicalFeasibility: 'To be assessed by technical team',
      riskAssessment: `Risk level: ${riskLevel}`
    };
  }

  private getLegalRequirements(gdprRequest: GDPRRequest): string[] {
    const requirements = ['GDPR Article 15 (Right of access)', 'GDPR Article 17 (Right to erasure)'];
    
    if (gdprRequest.dataCategories.includes('financial_data')) {
      requirements.push('EU Banking Regulation', 'PCI DSS compliance');
    }
    
    if (gdprRequest.dataCategories.includes('sepa_transactions')) {
      requirements.push('SEPA Regulation', 'PSD2 compliance');
    }
    
    return requirements;
  }

  private getDataCategoryInfo(category: string): string {
    const categoryMap: Record<string, string> = {
      'personal_info': 'Basic personal information',
      'financial_data': 'Financial account and transaction data',
      'sepa_transactions': 'SEPA payment transactions',
      'crm_data': 'Customer relationship management data',
      'audit_logs': 'System access and operation logs'
    };
    
    return categoryMap[category] || 'Unknown data category';
  }

  private getDefaultSLA(type: GDPRHITLRequest['type'], riskLevel: GDPRHITLRequest['riskLevel']): number {
    const baseSLA = {
      'export_approval': 48,
      'erase_approval': 72,
      'data_review': 24,
      'legal_hold_review': 12
    };
    
    const riskMultiplier = {
      'low': 1,
      'medium': 1.2,
      'high': 1.5,
      'critical': 2
    };
    
    return Math.round(baseSLA[type] * riskMultiplier[riskLevel]);
  }

  private getWorkflowForType(type: GDPRHITLRequest['type']): GDPRHITLWorkflow | null {
    const workflowType = type.includes('export') ? 'export' : 
                        type.includes('erase') ? 'erase' : 'data_review';
    
    return Array.from(this.workflows.values())
      .find(w => w.type === workflowType && w.isActive) || null;
  }

  private async setupWorkflow(hitlRequest: GDPRHITLRequest, workflow: GDPRHITLWorkflow): Promise<void> {
    // Set up workflow steps in HITL task
    const workflowSteps = workflow.steps.map(step => ({
      id: step.id,
      name: step.name,
      type: step.type as any,
      assignedTo: undefined, // Will be assigned based on role
      assignedBy: hitlRequest.assignedBy,
      status: 'pending' as const,
      order: step.order,
      comments: '',
      dueDate: new Date(Date.now() + step.slaHours * 60 * 60 * 1000).toISOString()
    }));

    await hitlV2Service.updateTask(hitlRequest.hitlTaskId, {
      workflow: workflowSteps,
      currentStep: 0
    });
  }

  private async processDecision(hitlRequest: GDPRHITLRequest, decision: GDPRHITLDecision): Promise<void> {
    try {
      if (decision.decision === 'approved') {
        // Process the original GDPR request
        const gdprRequest = hitlRequest.metadata.originalRequest;
        
        if (gdprRequest.type === 'export') {
          // The export should already be processed by the original service
          structuredLogger.info('GDPR export approved via HITL', {
            gdprRequestId: gdprRequest.id,
            hitlRequestId: hitlRequest.id,
            requestId: ''
          });
        } else if (gdprRequest.type === 'erase') {
          // The erase should already be processed by the original service
          structuredLogger.info('GDPR erase approved via HITL', {
            gdprRequestId: gdprRequest.id,
            hitlRequestId: hitlRequest.id,
            requestId: ''
          });
        }
      } else if (decision.decision === 'rejected') {
        // Update the original GDPR request status
        await gdprConsolidated.updateGDPRRequestStatus(
          hitlRequest.gdprRequestId,
          'failed',
          decision.decisionBy,
          {
            reason: 'Rejected by HITL review',
            hitlRequestId: hitlRequest.id,
            decisionReasoning: decision.reasoning
          }
        );
        
        structuredLogger.info('GDPR request rejected via HITL', {
          gdprRequestId: hitlRequest.gdprRequestId,
          hitlRequestId: hitlRequest.id,
          reason: decision.reasoning,
          requestId: ''
        });
      }
    } catch (error) {
      structuredLogger.error('Failed to process HITL decision', error as Error, {
        hitlRequestId: hitlRequest.id,
        decision: decision.decision,
        requestId: ''
      });
    }
  }

  private generateId(): string {
    return `gdpr_hitl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const gdprHITLService = new GDPRHITLService();
