/**
 * Security & Compliance Types
 * 
 * This file defines all TypeScript interfaces and types for the Advanced Security
 * and Compliance system (PR-49).
 */

// ============================================================================
// CORE SECURITY TYPES
// ============================================================================

export interface SecurityEvent {
  id: string;
  type: 'authentication' | 'authorization' | 'data_access' | 'system_change' | 'threat' | 'compliance' | 'audit';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  userId?: string;
  organizationId: string;
  source: string;
  details: Record<string, any>;
  riskScore: number;
  status: 'detected' | 'investigating' | 'resolved' | 'false_positive' | 'escalated';
  category: string;
  subcategory?: string;
  tags: string[];
  metadata: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  resource?: string;
  action?: string;
  result?: 'success' | 'failure' | 'denied' | 'error';
  createdAt: Date;
  updatedAt: Date;
}

export interface ThreatDetection {
  id: string;
  threatType: 'malware' | 'phishing' | 'ddos' | 'insider_threat' | 'data_breach' | 'unauthorized_access' | 'suspicious_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  timestamp: Date;
  source: string;
  target: string;
  organizationId: string;
  description: string;
  indicators: ThreatIndicator[];
  analysis: ThreatAnalysis;
  response: ThreatResponse;
  status: 'detected' | 'analyzing' | 'contained' | 'resolved' | 'false_positive';
  riskScore: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  likelihood: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
  updatedAt: Date;
}

export interface ThreatIndicator {
  type: 'ip_address' | 'domain' | 'url' | 'file_hash' | 'email' | 'user_agent' | 'behavior';
  value: string;
  confidence: number;
  source: string;
  firstSeen: Date;
  lastSeen: Date;
  tags: string[];
}

export interface ThreatAnalysis {
  summary: string;
  technicalDetails: string;
  attackVector: string;
  affectedSystems: string[];
  dataAtRisk: string[];
  potentialImpact: string;
  recommendations: string[];
  references: string[];
}

export interface ThreatResponse {
  actions: ThreatResponseAction[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  assignedTo?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedResolution?: Date;
  actualResolution?: Date;
}

export interface ThreatResponseAction {
  id: string;
  type: 'block' | 'isolate' | 'investigate' | 'notify' | 'escalate' | 'contain' | 'remediate';
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  assignedTo?: string;
  dueDate?: Date;
  completedAt?: Date;
  result?: string;
}

// ============================================================================
// COMPLIANCE TYPES
// ============================================================================

export interface ComplianceRequirement {
  id: string;
  standard: 'GDPR' | 'SOX' | 'HIPAA' | 'PCI-DSS' | 'ISO27001' | 'SOC2' | 'NIST' | 'CIS';
  requirement: string;
  description: string;
  category: string;
  subcategory?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'compliant' | 'non_compliant' | 'partially_compliant' | 'not_assessed' | 'in_progress';
  evidence: ComplianceEvidence[];
  controls: ComplianceControl[];
  lastAssessed: Date;
  nextAssessment: Date;
  assessor?: string;
  organizationId: string;
  tags: string[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ComplianceEvidence {
  id: string;
  type: 'document' | 'screenshot' | 'log' | 'test_result' | 'policy' | 'procedure';
  title: string;
  description: string;
  fileUrl?: string;
  content?: string;
  collectedBy: string;
  collectedAt: Date;
  verifiedBy?: string;
  verifiedAt?: Date;
  status: 'pending' | 'verified' | 'rejected';
}

export interface ComplianceControl {
  id: string;
  name: string;
  description: string;
  type: 'preventive' | 'detective' | 'corrective' | 'compensating';
  implementation: 'automated' | 'manual' | 'hybrid';
  status: 'implemented' | 'partially_implemented' | 'not_implemented' | 'not_applicable';
  effectiveness: 'high' | 'medium' | 'low' | 'unknown';
  owner: string;
  lastTested?: Date;
  nextTest?: Date;
  testResults?: ComplianceTestResult[];
}

export interface ComplianceTestResult {
  id: string;
  testType: 'automated' | 'manual' | 'interview' | 'observation';
  result: 'pass' | 'fail' | 'partial' | 'not_applicable';
  details: string;
  tester: string;
  testDate: Date;
  evidence: string[];
}

export interface ComplianceAssessment {
  id: string;
  standard: string;
  organizationId: string;
  assessor: string;
  startDate: Date;
  endDate?: Date;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  scope: string[];
  findings: ComplianceFinding[];
  overallScore: number;
  complianceRate: number;
  recommendations: string[];
  reportUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ComplianceFinding {
  id: string;
  requirementId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'accepted_risk';
  description: string;
  impact: string;
  recommendation: string;
  assignedTo?: string;
  dueDate?: Date;
  resolvedAt?: Date;
  evidence: string[];
}

// ============================================================================
// AUDIT TYPES
// ============================================================================

export interface AuditLog {
  id: string;
  eventType: string;
  timestamp: Date;
  userId?: string;
  organizationId: string;
  resource: string;
  action: string;
  result: 'success' | 'failure' | 'denied' | 'error';
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  requestId?: string;
  duration?: number;
  metadata: Record<string, any>;
  tags: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  subcategory?: string;
  createdAt: Date;
}

export interface AuditReport {
  id: string;
  name: string;
  description: string;
  type: 'compliance' | 'security' | 'operational' | 'financial' | 'custom';
  scope: string[];
  period: {
    start: Date;
    end: Date;
  };
  organizationId: string;
  auditor: string;
  status: 'draft' | 'in_progress' | 'completed' | 'approved' | 'rejected';
  findings: AuditFinding[];
  recommendations: AuditRecommendation[];
  overallScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  reportUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;
}

export interface AuditFinding {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  title: string;
  description: string;
  impact: string;
  recommendation: string;
  evidence: string[];
  status: 'open' | 'in_progress' | 'resolved' | 'accepted_risk';
  assignedTo?: string;
  dueDate?: Date;
  resolvedAt?: Date;
  resolution?: string;
}

export interface AuditRecommendation {
  id: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  title: string;
  description: string;
  implementation: string;
  estimatedEffort: string;
  estimatedCost?: number;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  assignedTo?: string;
  dueDate?: Date;
  completedAt?: Date;
}

export interface AuditTrail {
  id: string;
  entityType: string;
  entityId: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'export' | 'import';
  userId?: string;
  organizationId: string;
  timestamp: Date;
  changes: AuditChange[];
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  reason?: string;
  metadata: Record<string, any>;
}

export interface AuditChange {
  field: string;
  oldValue: any;
  newValue: any;
  type: 'added' | 'modified' | 'removed';
}

// ============================================================================
// ACCESS CONTROL TYPES
// ============================================================================

export interface AccessControl {
  id: string;
  userId: string;
  organizationId: string;
  resource: string;
  permissions: Permission[];
  roles: Role[];
  conditions: AccessCondition[];
  status: 'active' | 'inactive' | 'suspended' | 'expired';
  grantedBy: string;
  grantedAt: Date;
  expiresAt?: Date;
  lastUsed?: Date;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  actions: string[];
  conditions?: AccessCondition[];
  metadata: Record<string, any>;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  organizationId: string;
  isSystem: boolean;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccessCondition {
  type: 'time' | 'location' | 'device' | 'ip' | 'mfa' | 'risk';
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'between';
  value: any;
  metadata?: Record<string, any>;
}

export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  type: 'access' | 'data' | 'network' | 'application' | 'incident';
  rules: SecurityPolicyRule[];
  organizationId: string;
  status: 'active' | 'inactive' | 'draft';
  priority: number;
  effectiveDate: Date;
  expirationDate?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SecurityPolicyRule {
  id: string;
  name: string;
  description: string;
  condition: string;
  action: 'allow' | 'deny' | 'log' | 'alert' | 'quarantine';
  priority: number;
  enabled: boolean;
  metadata: Record<string, any>;
}

// ============================================================================
// INCIDENT RESPONSE TYPES
// ============================================================================

export interface SecurityIncident {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'new' | 'assigned' | 'in_progress' | 'resolved' | 'closed';
  category: 'malware' | 'phishing' | 'ddos' | 'data_breach' | 'insider_threat' | 'system_compromise' | 'other';
  subcategory?: string;
  organizationId: string;
  reportedBy: string;
  assignedTo?: string;
  reportedAt: Date;
  detectedAt?: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  affectedSystems: string[];
  affectedUsers: string[];
  dataAtRisk: string[];
  impact: string;
  rootCause?: string;
  resolution?: string;
  lessonsLearned?: string;
  actions: IncidentAction[];
  timeline: IncidentTimelineEvent[];
  evidence: IncidentEvidence[];
  tags: string[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IncidentAction {
  id: string;
  type: 'contain' | 'investigate' | 'remediate' | 'communicate' | 'escalate' | 'document';
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo?: string;
  dueDate?: Date;
  completedAt?: Date;
  result?: string;
  evidence: string[];
}

export interface IncidentTimelineEvent {
  id: string;
  timestamp: Date;
  event: string;
  description: string;
  actor: string;
  type: 'detection' | 'response' | 'investigation' | 'resolution' | 'communication';
  metadata: Record<string, any>;
}

export interface IncidentEvidence {
  id: string;
  type: 'log' | 'screenshot' | 'file' | 'network_capture' | 'memory_dump' | 'other';
  title: string;
  description: string;
  fileUrl?: string;
  content?: string;
  collectedBy: string;
  collectedAt: Date;
  verifiedBy?: string;
  verifiedAt?: Date;
  chainOfCustody: string[];
}

// ============================================================================
// VULNERABILITY MANAGEMENT TYPES
// ============================================================================

export interface Vulnerability {
  id: string;
  cveId?: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  cvssScore?: number;
  cvssVector?: string;
  affectedSystems: string[];
  organizationId: string;
  discoveredAt: Date;
  reportedBy: string;
  status: 'new' | 'confirmed' | 'in_progress' | 'resolved' | 'accepted_risk';
  assignedTo?: string;
  dueDate?: Date;
  resolvedAt?: Date;
  resolution?: string;
  references: string[];
  tags: string[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface VulnerabilityScan {
  id: string;
  name: string;
  description: string;
  targetSystems: string[];
  scanType: 'network' | 'web' | 'database' | 'application' | 'comprehensive';
  status: 'scheduled' | 'running' | 'completed' | 'failed' | 'cancelled';
  organizationId: string;
  initiatedBy: string;
  scheduledAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  vulnerabilities: string[];
  summary: VulnerabilityScanSummary;
  reportUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VulnerabilityScanSummary {
  totalVulnerabilities: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  systemsScanned: number;
  systemsWithVulnerabilities: number;
  riskScore: number;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateSecurityEventRequest {
  type: SecurityEvent['type'];
  severity: SecurityEvent['severity'];
  source: string;
  details: Record<string, any>;
  category: string;
  subcategory?: string;
  tags: string[];
  metadata: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  resource?: string;
  action?: string;
  result?: SecurityEvent['result'];
}

export interface CreateComplianceRequirementRequest {
  standard: ComplianceRequirement['standard'];
  requirement: string;
  description: string;
  category: string;
  subcategory?: string;
  priority: ComplianceRequirement['priority'];
  tags: string[];
  metadata: Record<string, any>;
}

export interface CreateAuditLogRequest {
  eventType: string;
  resource: string;
  action: string;
  result: AuditLog['result'];
  details: Record<string, any>;
  category: string;
  subcategory?: string;
  tags: string[];
  metadata: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  requestId?: string;
  duration?: number;
}

export interface CreateSecurityIncidentRequest {
  title: string;
  description: string;
  severity: SecurityIncident['severity'];
  category: SecurityIncident['category'];
  subcategory?: string;
  affectedSystems: string[];
  affectedUsers: string[];
  dataAtRisk: string[];
  impact: string;
  tags: string[];
  metadata: Record<string, any>;
}

export interface SecurityResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  metadata?: {
    timestamp: Date;
    executionTime: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  };
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

export interface SecurityConfig {
  threatDetection: boolean;
  realTimeMonitoring: boolean;
  autoIncidentResponse: boolean;
  vulnerabilityScanning: boolean;
  accessControl: boolean;
  auditLogging: boolean;
  encryption: boolean;
  mfa: boolean;
  sessionManagement: boolean;
  rateLimiting: boolean;
}

export interface ComplianceConfig {
  gdpr: boolean;
  sox: boolean;
  hipaa: boolean;
  pciDss: boolean;
  iso27001: boolean;
  soc2: boolean;
  nist: boolean;
  cis: boolean;
  autoAssessment: boolean;
  reporting: boolean;
}

export interface AuditConfig {
  comprehensiveLogging: boolean;
  realTimeAuditing: boolean;
  auditReporting: boolean;
  forensicAnalysis: boolean;
  dataRetention: number;
  logRetention: number;
  encryption: boolean;
  integrity: boolean;
}

export interface ThreatDetectionConfig {
  aiDetection: boolean;
  behavioralAnalysis: boolean;
  anomalyDetection: boolean;
  threatIntelligence: boolean;
  incidentResponse: boolean;
  threatHunting: boolean;
  realTimeAnalysis: boolean;
  machineLearning: boolean;
}

// ============================================================================
// EXPORT TYPES
// ============================================================================

export type {
  SecurityEvent,
  ThreatDetection,
  ThreatIndicator,
  ThreatAnalysis,
  ThreatResponse,
  ThreatResponseAction,
  ComplianceRequirement,
  ComplianceEvidence,
  ComplianceControl,
  ComplianceTestResult,
  ComplianceAssessment,
  ComplianceFinding,
  AuditLog,
  AuditReport,
  AuditFinding,
  AuditRecommendation,
  AuditTrail,
  AuditChange,
  AccessControl,
  Permission,
  Role,
  AccessCondition,
  SecurityPolicy,
  SecurityPolicyRule,
  SecurityIncident,
  IncidentAction,
  IncidentTimelineEvent,
  IncidentEvidence,
  Vulnerability,
  VulnerabilityScan,
  VulnerabilityScanSummary,
  CreateSecurityEventRequest,
  CreateComplianceRequirementRequest,
  CreateAuditLogRequest,
  CreateSecurityIncidentRequest,
  SecurityResponse,
  SecurityConfig,
  ComplianceConfig,
  AuditConfig,
  ThreatDetectionConfig
};
