/**
 * Compliance Management Service
 * 
 * This service provides comprehensive compliance management capabilities including
 * multi-standard compliance tracking, policy management, risk assessment, and
 * automated compliance reporting.
 */

import {
  ComplianceRequirement,
  ComplianceEvidence,
  ComplianceControl,
  ComplianceTestResult,
  ComplianceAssessment,
  ComplianceFinding,
  CreateComplianceRequirementRequest,
  ComplianceConfig
} from './security-types.js';

export class ComplianceManagementService {
  private config: ComplianceConfig;
  private requirements: Map<string, ComplianceRequirement> = new Map();
  private assessments: Map<string, ComplianceAssessment> = new Map();
  private findings: Map<string, ComplianceFinding> = new Map();

  constructor(config: Partial<ComplianceConfig> = {}) {
    this.config = {
      gdpr: true,
      sox: true,
      hipaa: true,
      pciDss: true,
      iso27001: true,
      soc2: true,
      nist: true,
      cis: true,
      autoAssessment: true,
      reporting: true,
      ...config
    };
  }

  // ============================================================================
  // COMPLIANCE REQUIREMENT MANAGEMENT
  // ============================================================================

  async createComplianceRequirement(request: CreateComplianceRequirementRequest, organizationId: string): Promise<ComplianceRequirement> {
    const requirement: ComplianceRequirement = {
      id: this.generateId(),
      standard: request.standard,
      requirement: request.requirement,
      description: request.description,
      category: request.category,
      subcategory: request.subcategory,
      priority: request.priority,
      status: 'not_assessed',
      evidence: [],
      controls: [],
      lastAssessed: new Date(),
      nextAssessment: this.calculateNextAssessment(request.standard),
      organizationId,
      tags: request.tags,
      metadata: request.metadata,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.requirements.set(requirement.id, requirement);

    // Auto-assessment if enabled
    if (this.config.autoAssessment) {
      await this.performAutoAssessment(requirement);
    }

    return requirement;
  }

  async getComplianceRequirement(requirementId: string): Promise<ComplianceRequirement | null> {
    return this.requirements.get(requirementId) || null;
  }

  async getComplianceRequirements(organizationId: string, filters?: {
    standard?: string;
    status?: string;
    category?: string;
    priority?: string;
  }): Promise<ComplianceRequirement[]> {
    let requirements = Array.from(this.requirements.values())
      .filter(r => r.organizationId === organizationId);

    if (filters) {
      if (filters.standard) {
        requirements = requirements.filter(r => r.standard === filters.standard);
      }
      if (filters.status) {
        requirements = requirements.filter(r => r.status === filters.status);
      }
      if (filters.category) {
        requirements = requirements.filter(r => r.category === filters.category);
      }
      if (filters.priority) {
        requirements = requirements.filter(r => r.priority === filters.priority);
      }
    }

    return requirements.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateComplianceRequirement(requirementId: string, updates: Partial<CreateComplianceRequirementRequest>): Promise<ComplianceRequirement | null> {
    const requirement = this.requirements.get(requirementId);
    if (!requirement) return null;

    const updatedRequirement: ComplianceRequirement = {
      ...requirement,
      ...updates,
      updatedAt: new Date()
    };

    this.requirements.set(requirementId, updatedRequirement);
    return updatedRequirement;
  }

  async deleteComplianceRequirement(requirementId: string): Promise<boolean> {
    return this.requirements.delete(requirementId);
  }

  private calculateNextAssessment(standard: ComplianceRequirement['standard']): Date {
    const now = new Date();
    const nextAssessment = new Date(now);

    // Different standards have different assessment frequencies
    switch (standard) {
      case 'GDPR':
        nextAssessment.setMonth(nextAssessment.getMonth() + 6); // Every 6 months
        break;
      case 'SOX':
        nextAssessment.setMonth(nextAssessment.getMonth() + 3); // Every 3 months
        break;
      case 'HIPAA':
        nextAssessment.setMonth(nextAssessment.getMonth() + 12); // Annually
        break;
      case 'PCI-DSS':
        nextAssessment.setMonth(nextAssessment.getMonth() + 3); // Every 3 months
        break;
      case 'ISO27001':
        nextAssessment.setMonth(nextAssessment.getMonth() + 12); // Annually
        break;
      default:
        nextAssessment.setMonth(nextAssessment.getMonth() + 6); // Default 6 months
    }

    return nextAssessment;
  }

  // ============================================================================
  // COMPLIANCE EVIDENCE MANAGEMENT
  // ============================================================================

  async addComplianceEvidence(requirementId: string, evidence: Omit<ComplianceEvidence, 'id'>): Promise<ComplianceEvidence | null> {
    const requirement = this.requirements.get(requirementId);
    if (!requirement) return null;

    const newEvidence: ComplianceEvidence = {
      id: this.generateId(),
      ...evidence
    };

    requirement.evidence.push(newEvidence);
    requirement.updatedAt = new Date();

    this.requirements.set(requirementId, requirement);
    return newEvidence;
  }

  async updateComplianceEvidence(requirementId: string, evidenceId: string, updates: Partial<ComplianceEvidence>): Promise<ComplianceEvidence | null> {
    const requirement = this.requirements.get(requirementId);
    if (!requirement) return null;

    const evidenceIndex = requirement.evidence.findIndex(e => e.id === evidenceId);
    if (evidenceIndex === -1) return null;

    const updatedEvidence: ComplianceEvidence = {
      ...requirement.evidence[evidenceIndex],
      ...updates
    };

    requirement.evidence[evidenceIndex] = updatedEvidence;
    requirement.updatedAt = new Date();

    this.requirements.set(requirementId, requirement);
    return updatedEvidence;
  }

  async removeComplianceEvidence(requirementId: string, evidenceId: string): Promise<boolean> {
    const requirement = this.requirements.get(requirementId);
    if (!requirement) return false;

    const evidenceIndex = requirement.evidence.findIndex(e => e.id === evidenceId);
    if (evidenceIndex === -1) return false;

    requirement.evidence.splice(evidenceIndex, 1);
    requirement.updatedAt = new Date();

    this.requirements.set(requirementId, requirement);
    return true;
  }

  // ============================================================================
  // COMPLIANCE CONTROL MANAGEMENT
  // ============================================================================

  async addComplianceControl(requirementId: string, control: Omit<ComplianceControl, 'id'>): Promise<ComplianceControl | null> {
    const requirement = this.requirements.get(requirementId);
    if (!requirement) return null;

    const newControl: ComplianceControl = {
      id: this.generateId(),
      ...control
    };

    requirement.controls.push(newControl);
    requirement.updatedAt = new Date();

    this.requirements.set(requirementId, requirement);
    return newControl;
  }

  async updateComplianceControl(requirementId: string, controlId: string, updates: Partial<ComplianceControl>): Promise<ComplianceControl | null> {
    const requirement = this.requirements.get(requirementId);
    if (!requirement) return null;

    const controlIndex = requirement.controls.findIndex(c => c.id === controlId);
    if (controlIndex === -1) return null;

    const updatedControl: ComplianceControl = {
      ...requirement.controls[controlIndex],
      ...updates
    };

    requirement.controls[controlIndex] = updatedControl;
    requirement.updatedAt = new Date();

    this.requirements.set(requirementId, requirement);
    return updatedControl;
  }

  async addControlTestResult(requirementId: string, controlId: string, testResult: Omit<ComplianceTestResult, 'id'>): Promise<ComplianceTestResult | null> {
    const requirement = this.requirements.get(requirementId);
    if (!requirement) return null;

    const controlIndex = requirement.controls.findIndex(c => c.id === controlId);
    if (controlIndex === -1) return null;

    const newTestResult: ComplianceTestResult = {
      id: this.generateId(),
      ...testResult
    };

    if (!requirement.controls[controlIndex].testResults) {
      requirement.controls[controlIndex].testResults = [];
    }

    requirement.controls[controlIndex].testResults!.push(newTestResult);
    requirement.controls[controlIndex].lastTested = testResult.testDate;
    requirement.updatedAt = new Date();

    this.requirements.set(requirementId, requirement);
    return newTestResult;
  }

  // ============================================================================
  // COMPLIANCE ASSESSMENT
  // ============================================================================

  async performComplianceAssessment(assessment: Omit<ComplianceAssessment, 'id' | 'createdAt' | 'updatedAt'>): Promise<ComplianceAssessment> {
    const newAssessment: ComplianceAssessment = {
      id: this.generateId(),
      ...assessment,
      status: 'in_progress',
      findings: [],
      overallScore: 0,
      complianceRate: 0,
      recommendations: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.assessments.set(newAssessment.id, newAssessment);

    // Perform assessment
    await this.executeComplianceAssessment(newAssessment);

    return newAssessment;
  }

  private async executeComplianceAssessment(assessment: ComplianceAssessment): Promise<void> {
    const requirements = await this.getComplianceRequirements(assessment.organizationId, {
      standard: assessment.standard
    });

    const findings: ComplianceFinding[] = [];
    let totalScore = 0;
    let compliantCount = 0;

    for (const requirement of requirements) {
      const finding = await this.assessRequirement(requirement, assessment.assessor);
      findings.push(finding);
      
      totalScore += this.calculateRequirementScore(requirement);
      if (requirement.status === 'compliant') {
        compliantCount++;
      }
    }

    const overallScore = requirements.length > 0 ? totalScore / requirements.length : 0;
    const complianceRate = requirements.length > 0 ? (compliantCount / requirements.length) * 100 : 0;

    const recommendations = this.generateRecommendations(findings);

    const updatedAssessment: ComplianceAssessment = {
      ...assessment,
      status: 'completed',
      endDate: new Date(),
      findings,
      overallScore,
      complianceRate,
      recommendations,
      updatedAt: new Date()
    };

    this.assessments.set(assessment.id, updatedAssessment);
  }

  private async assessRequirement(requirement: ComplianceRequirement, assessor: string): Promise<ComplianceFinding> {
    // Simulate requirement assessment
    const severity = this.determineFindingSeverity(requirement);
    const status = severity === 'low' ? 'open' : 'in_progress';

    const finding: ComplianceFinding = {
      id: this.generateId(),
      requirementId: requirement.id,
      severity,
      status,
      description: this.generateFindingDescription(requirement),
      impact: this.generateFindingImpact(requirement),
      recommendation: this.generateFindingRecommendation(requirement),
      assignedTo: severity === 'critical' || severity === 'high' ? 'security_team' : undefined,
      dueDate: this.calculateFindingDueDate(severity),
      evidence: requirement.evidence.map(e => e.id)
    };

    this.findings.set(finding.id, finding);
    return finding;
  }

  private determineFindingSeverity(requirement: ComplianceRequirement): ComplianceFinding['severity'] {
    if (requirement.status === 'non_compliant') {
      return requirement.priority === 'critical' ? 'critical' : 'high';
    } else if (requirement.status === 'partially_compliant') {
      return requirement.priority === 'critical' ? 'high' : 'medium';
    } else if (requirement.status === 'not_assessed') {
      return 'medium';
    }
    return 'low';
  }

  private generateFindingDescription(requirement: ComplianceRequirement): string {
    return `Compliance requirement "${requirement.requirement}" for ${requirement.standard} is ${requirement.status}. ${requirement.description}`;
  }

  private generateFindingImpact(requirement: ComplianceRequirement): string {
    switch (requirement.status) {
      case 'non_compliant':
        return `Non-compliance with ${requirement.standard} may result in regulatory penalties, legal action, and reputational damage.`;
      case 'partially_compliant':
        return `Partial compliance with ${requirement.standard} creates gaps that may be exploited and could lead to compliance violations.`;
      case 'not_assessed':
        return `Unassessed compliance requirement creates uncertainty and potential risk exposure.`;
      default:
        return 'No significant impact identified.';
    }
  }

  private generateFindingRecommendation(requirement: ComplianceRequirement): string {
    switch (requirement.status) {
      case 'non_compliant':
        return `Implement comprehensive controls and evidence collection to achieve full compliance with ${requirement.standard}.`;
      case 'partially_compliant':
        return `Address identified gaps and strengthen existing controls to achieve full compliance.`;
      case 'not_assessed':
        return `Conduct thorough assessment of compliance requirements and implement necessary controls.`;
      default:
        return 'Maintain current compliance status and continue monitoring.';
    }
  }

  private calculateFindingDueDate(severity: ComplianceFinding['severity']): Date {
    const dueDate = new Date();
    
    switch (severity) {
      case 'critical':
        dueDate.setDate(dueDate.getDate() + 7); // 1 week
        break;
      case 'high':
        dueDate.setDate(dueDate.getDate() + 14); // 2 weeks
        break;
      case 'medium':
        dueDate.setMonth(dueDate.getMonth() + 1); // 1 month
        break;
      case 'low':
        dueDate.setMonth(dueDate.getMonth() + 3); // 3 months
        break;
    }
    
    return dueDate;
  }

  private calculateRequirementScore(requirement: ComplianceRequirement): number {
    switch (requirement.status) {
      case 'compliant': return 100;
      case 'partially_compliant': return 60;
      case 'non_compliant': return 0;
      case 'not_assessed': return 25;
      default: return 0;
    }
  }

  private generateRecommendations(findings: ComplianceFinding[]): string[] {
    const recommendations: string[] = [];
    
    const criticalFindings = findings.filter(f => f.severity === 'critical');
    const highFindings = findings.filter(f => f.severity === 'high');
    
    if (criticalFindings.length > 0) {
      recommendations.push(`Address ${criticalFindings.length} critical compliance findings immediately to prevent regulatory violations.`);
    }
    
    if (highFindings.length > 0) {
      recommendations.push(`Prioritize resolution of ${highFindings.length} high-priority compliance findings within the next 30 days.`);
    }
    
    recommendations.push('Implement continuous compliance monitoring to maintain regulatory compliance.');
    recommendations.push('Establish regular compliance training programs for all staff.');
    recommendations.push('Review and update compliance policies and procedures quarterly.');
    
    return recommendations;
  }

  async getComplianceAssessment(assessmentId: string): Promise<ComplianceAssessment | null> {
    return this.assessments.get(assessmentId) || null;
  }

  async getComplianceAssessments(organizationId: string): Promise<ComplianceAssessment[]> {
    return Array.from(this.assessments.values())
      .filter(a => a.organizationId === organizationId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // ============================================================================
  // COMPLIANCE STATUS AND REPORTING
  // ============================================================================

  async getComplianceStatus(organizationId: string, standard?: string): Promise<{
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
  }> {
    const requirements = await this.getComplianceRequirements(organizationId, {
      standard
    });

    const totalRequirements = requirements.length;
    const compliant = requirements.filter(r => r.status === 'compliant').length;
    const partiallyCompliant = requirements.filter(r => r.status === 'partially_compliant').length;
    const nonCompliant = requirements.filter(r => r.status === 'non_compliant').length;
    const notAssessed = requirements.filter(r => r.status === 'not_assessed').length;

    const overallScore = totalRequirements > 0 
      ? requirements.reduce((sum, r) => sum + this.calculateRequirementScore(r), 0) / totalRequirements
      : 0;

    const complianceRate = totalRequirements > 0 ? (compliant / totalRequirements) * 100 : 0;

    // Get findings for this standard
    const findings = Array.from(this.findings.values())
      .filter(f => {
        const req = requirements.find(r => r.id === f.requirementId);
        return req && (!standard || req.standard === standard);
      });

    const criticalFindings = findings.filter(f => f.severity === 'critical').length;
    const highFindings = findings.filter(f => f.severity === 'high').length;
    const mediumFindings = findings.filter(f => f.severity === 'medium').length;
    const lowFindings = findings.filter(f => f.severity === 'low').length;

    // Get last and next assessment dates
    const assessments = await this.getComplianceAssessments(organizationId);
    const standardAssessments = standard 
      ? assessments.filter(a => a.standard === standard)
      : assessments;

    const lastAssessment = standardAssessments.length > 0 
      ? standardAssessments[0].completedAt || standardAssessments[0].createdAt
      : undefined;

    const nextAssessment = requirements.length > 0 
      ? new Date(Math.min(...requirements.map(r => r.nextAssessment.getTime())))
      : undefined;

    return {
      standard: standard || 'All Standards',
      overallScore: Math.round(overallScore),
      complianceRate: Math.round(complianceRate),
      requirements: {
        total: totalRequirements,
        compliant,
        partiallyCompliant,
        nonCompliant,
        notAssessed
      },
      findings: {
        critical: criticalFindings,
        high: highFindings,
        medium: mediumFindings,
        low: lowFindings
      },
      lastAssessment,
      nextAssessment
    };
  }

  async generateComplianceReport(organizationId: string, standard?: string): Promise<{
    reportId: string;
    reportUrl: string;
    summary: any;
    details: any;
  }> {
    const status = await this.getComplianceStatus(organizationId, standard);
    const requirements = await this.getComplianceRequirements(organizationId, { standard });
    const assessments = await this.getComplianceAssessments(organizationId);

    const reportId = this.generateId();
    const reportUrl = `/compliance/reports/${reportId}.pdf`;

    const summary = {
      organizationId,
      standard: standard || 'All Standards',
      generatedAt: new Date(),
      overallScore: status.overallScore,
      complianceRate: status.complianceRate,
      totalRequirements: status.requirements.total,
      criticalFindings: status.findings.critical,
      lastAssessment: status.lastAssessment
    };

    const details = {
      requirements: requirements.map(r => ({
        id: r.id,
        requirement: r.requirement,
        status: r.status,
        priority: r.priority,
        lastAssessed: r.lastAssessed,
        nextAssessment: r.nextAssessment
      })),
      assessments: assessments.map(a => ({
        id: a.id,
        standard: a.standard,
        status: a.status,
        overallScore: a.overallScore,
        complianceRate: a.complianceRate,
        createdAt: a.createdAt,
        completedAt: a.completedAt
      }))
    };

    return {
      reportId,
      reportUrl,
      summary,
      details
    };
  }

  // ============================================================================
  // AUTO-ASSESSMENT
  // ============================================================================

  private async performAutoAssessment(requirement: ComplianceRequirement): Promise<void> {
    // Simulate auto-assessment based on available evidence and controls
    let status: ComplianceRequirement['status'] = 'not_assessed';

    if (requirement.evidence.length > 0 && requirement.controls.length > 0) {
      const implementedControls = requirement.controls.filter(c => c.status === 'implemented').length;
      const totalControls = requirement.controls.length;
      
      if (implementedControls === totalControls) {
        status = 'compliant';
      } else if (implementedControls > totalControls * 0.5) {
        status = 'partially_compliant';
      } else {
        status = 'non_compliant';
      }
    }

    const updatedRequirement: ComplianceRequirement = {
      ...requirement,
      status,
      lastAssessed: new Date(),
      updatedAt: new Date()
    };

    this.requirements.set(requirement.id, updatedRequirement);
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private generateId(): string {
    return `compliance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async getServiceStats(): Promise<{
    totalRequirements: number;
    totalAssessments: number;
    totalFindings: number;
    config: ComplianceConfig;
  }> {
    return {
      totalRequirements: this.requirements.size,
      totalAssessments: this.assessments.size,
      totalFindings: this.findings.size,
      config: this.config
    };
  }
}
