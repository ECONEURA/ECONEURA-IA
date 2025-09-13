// GDPR Types for PR-43
export interface GDPRRequest {
  id: string;
  userId: string;
  type: 'export' | 'erase' | 'rectification' | 'portability';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  requestedAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  requestedBy: string;
  processedBy?: string;
  reason?: string;
  legalBasis: string;
  dataCategories: string[];
  scope: 'user' | 'organization';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  metadata: Record<string, unknown>;
  auditTrail: AuditEntry[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditEntry {
  id: string;
  requestId: string;
  action: 'created' | 'updated' | 'processed' | 'completed' | 'failed';
  actor: string;
  timestamp: Date;
  details: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  signature: string;
}

export interface LegalHold {
  id: string;
  name: string;
  description: string;
  type: 'litigation' | 'regulatory' | 'investigation' | 'custom';
  userId?: string;
  organizationId?: string;
  dataCategories: string[];
  startDate: Date;
  endDate?: Date;
  status: 'active' | 'expired' | 'cancelled';
  createdBy: string;
  approvedBy?: string;
  legalBasis: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface DataExport {
  id: string;
  requestId: string;
  userId: string;
  format: 'zip' | 'json' | 'csv' | 'pdf';
  status: 'generating' | 'ready' | 'downloaded' | 'expired';
  filePath?: string;
  downloadUrl?: string;
  expiresAt: Date;
  dataCategories: string[];
  recordCount: number;
  fileSize: number;
  checksum: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DataErase {
  id: string;
  requestId: string;
  userId: string;
  type: 'soft' | 'hard' | 'anonymize' | 'pseudonymize';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  dataCategories: string[];
  recordCount: number;
  erasedCount: number;
  backupPath?: string;
  verificationHash: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface GDPRStats {
  totalRequests: number;
  pendingRequests: number;
  completedRequests: number;
  failedRequests: number;
  averageProcessingTime: number;
  exportRequests: number;
  eraseRequests: number;
  rectificationRequests: number;
  portabilityRequests: number;
  activeLegalHolds: number;
  expiredLegalHolds: number;
  dataRetentionCompliance: number;
}

export interface DataCategory {
  id: string;
  name: string;
  description: string;
  sensitivity: 'low' | 'medium' | 'high' | 'critical';
  retentionPeriod: number; // days
  legalBasis: string[];
  canExport: boolean;
  canErase: boolean;
  requiresConsent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConsentRecord {
  id: string;
  userId: string;
  dataCategory: string;
  purpose: string;
  consentGiven: boolean;
  consentDate: Date;
  withdrawalDate?: Date;
  legalBasis: string;
  evidence: string; // URL to consent evidence
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DataProcessingActivity {
  id: string;
  name: string;
  description: string;
  purpose: string;
  legalBasis: string;
  dataCategories: string[];
  dataSubjects: string[];
  recipients: string[];
  thirdCountryTransfers: string[];
  retentionPeriod: number;
  securityMeasures: string[];
  dpoContact?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BreachRecord {
  id: string;
  type: 'confidentiality' | 'integrity' | 'availability';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedDataCategories: string[];
  affectedDataSubjects: number;
  discoveredAt: Date;
  reportedAt?: Date;
  containedAt?: Date;
  resolvedAt?: Date;
  dpaNotified: boolean;
  dpaNotificationDate?: Date;
  dataSubjectsNotified: boolean;
  dataSubjectsNotificationDate?: Date;
  measures: string[];
  status: 'investigating' | 'contained' | 'resolved' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

export interface GDPRComplianceReport {
  id: string;
  period: {
    start: Date;
    end: Date;
  };
  organizationId: string;
  stats: GDPRStats;
  dataProcessingActivities: DataProcessingActivity[];
  breaches: BreachRecord[];
  legalHolds: LegalHold[];
  consentRecords: ConsentRecord[];
  recommendations: string[];
  complianceScore: number;
  generatedAt: Date;
  generatedBy: string;
}
