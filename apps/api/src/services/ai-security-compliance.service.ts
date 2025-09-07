import { z } from 'zod';
import { getDatabaseService } from '../lib/database.service.js';
import { logger } from '../lib/logger.js';

// Schemas de validación
const SecurityPolicySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  type: z.enum(['data_protection', 'access_control', 'content_filter', 'audit', 'compliance']),
  rules: z.array(z.object({
    field: z.string(),
    operator: z.enum(['equals', 'contains', 'regex', 'range', 'exists']),
    value: z.any(),
    action: z.enum(['allow', 'deny', 'log', 'encrypt', 'anonymize'])
  })),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date()
});

const ComplianceCheckSchema = z.object({
  id: z.string().uuid(),
  policyId: z.string().uuid(),
  checkType: z.enum(['data_retention', 'access_audit', 'content_scan', 'encryption_check', 'gdpr_compliance']),
  status: z.enum(['pending', 'running', 'completed', 'failed']),
  result: z.object({
    passed: z.boolean(),
    violations: z.array(z.object({
      rule: z.string(),
      severity: z.enum(['low', 'medium', 'high', 'critical']),
      description: z.string(),
      recommendation: z.string()
    })),
    score: z.number().min(0).max(100),
    details: z.record(z.any())
  }),
  startedAt: z.date(),
  completedAt: z.date().optional(),
  createdAt: z.date()
});

const SecurityIncidentSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['data_breach', 'unauthorized_access', 'content_violation', 'policy_violation', 'system_compromise']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  status: z.enum(['open', 'investigating', 'resolved', 'closed']),
  description: z.string(),
  affectedData: z.array(z.string()),
  affectedUsers: z.array(z.string()),
  detectionMethod: z.string(),
  remediation: z.string().optional(),
  reportedAt: z.date(),
  resolvedAt: z.date().optional(),
  createdAt: z.date()
});

const AuditLogSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  action: z.string(),
  resource: z.string(),
  resourceId: z.string().optional(),
  details: z.record(z.any()),
  ipAddress: z.string().ip(),
  userAgent: z.string(),
  timestamp: z.date(),
  success: z.boolean()
});

// Tipos TypeScript
export type SecurityPolicy = z.infer<typeof SecurityPolicySchema>;
export type ComplianceCheck = z.infer<typeof ComplianceCheckSchema>;
export type SecurityIncident = z.infer<typeof SecurityIncidentSchema>;
export type AuditLog = z.infer<typeof AuditLogSchema>;

export interface AISecurityRequest {
  userId: string;
  organizationId: string;
  action: string;
  data: any;
  context: {
    ipAddress: string;
    userAgent: string;
    sessionId?: string;
  };
}

export interface AISecurityResponse {
  allowed: boolean;
  reason?: string;
  violations: Array<{
    rule: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
  }>;
  recommendations: string[];
  auditId: string;
}

export interface ComplianceReport {
  id: string;
  organizationId: string;
  reportType: string;
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    totalChecks: number;
    passedChecks: number;
    failedChecks: number;
    overallScore: number;
  };
  details: {
    dataProtection: ComplianceCheck['result'];
    accessControl: ComplianceCheck['result'];
    contentFilter: ComplianceCheck['result'];
    auditTrail: ComplianceCheck['result'];
    gdprCompliance: ComplianceCheck['result'];
  };
  recommendations: string[];
  generatedAt: Date;
}

export class AISecurityComplianceService {
  private db: ReturnType<typeof getDatabaseService>;
  private securityCache: Map<string, SecurityPolicy> = new Map();
  private complianceCache: Map<string, ComplianceCheck> = new Map();

  constructor() {
    this.db = getDatabaseService();
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      await this.createTables();
      await this.loadSecurityPolicies();
      await this.initializeDefaultPolicies();
      logger.info('AI Security & Compliance Service initialized successfully');
    } catch (error: any) {
      logger.error('Failed to initialize AI Security & Compliance Service', { error: error.message });
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    const queries = [
      // Tabla de políticas de seguridad
      `CREATE TABLE IF NOT EXISTS ai_security_policies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        type VARCHAR(50) NOT NULL CHECK (type IN ('data_protection', 'access_control', 'content_filter', 'audit', 'compliance')),
        rules JSONB NOT NULL DEFAULT '[]',
        severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
      
      // Tabla de verificaciones de cumplimiento
      `CREATE TABLE IF NOT EXISTS ai_compliance_checks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        policy_id UUID NOT NULL REFERENCES ai_security_policies(id) ON DELETE CASCADE,
        check_type VARCHAR(50) NOT NULL CHECK (check_type IN ('data_retention', 'access_audit', 'content_scan', 'encryption_check', 'gdpr_compliance')),
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
        result JSONB NOT NULL DEFAULT '{"passed": false, "violations": [], "score": 0, "details": {}}',
        started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        completed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
      
      // Tabla de incidentes de seguridad
      `CREATE TABLE IF NOT EXISTS ai_security_incidents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type VARCHAR(50) NOT NULL CHECK (type IN ('data_breach', 'unauthorized_access', 'content_violation', 'policy_violation', 'system_compromise')),
        severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
        status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
        description TEXT NOT NULL,
        affected_data JSONB NOT NULL DEFAULT '[]',
        affected_users JSONB NOT NULL DEFAULT '[]',
        detection_method VARCHAR(100) NOT NULL,
        remediation TEXT,
        reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        resolved_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
      
      // Tabla de logs de auditoría
      `CREATE TABLE IF NOT EXISTS ai_audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        action VARCHAR(100) NOT NULL,
        resource VARCHAR(100) NOT NULL,
        resource_id VARCHAR(100),
        details JSONB NOT NULL DEFAULT '{}',
        ip_address INET NOT NULL,
        user_agent TEXT NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        success BOOLEAN NOT NULL DEFAULT true
      )`
    ];

    for (const query of queries) {
      await this.db.query(query);
    }
  }

  private async loadSecurityPolicies(): Promise<void> {
    try {
      const result = await this.db.query('SELECT * FROM ai_security_policies WHERE is_active = true');
      this.securityCache.clear();
      
      for (const row of result.rows) {
        this.securityCache.set(row.id, {
          id: row.id,
          name: row.name,
          description: row.description,
          type: row.type,
          rules: row.rules,
          severity: row.severity,
          isActive: row.is_active,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        });
      }
      
      logger.info(`Loaded ${this.securityCache.size} security policies`);
    } catch (error: any) {
      logger.error('Failed to load security policies', { error: error.message });
    }
  }

  private async initializeDefaultPolicies(): Promise<void> {
    const defaultPolicies = [
      {
        name: 'Data Protection Policy',
        description: 'Ensures personal data is protected according to GDPR standards',
        type: 'data_protection',
        rules: [
          { field: 'data_type', operator: 'equals', value: 'personal', action: 'encrypt' },
          { field: 'retention_period', operator: 'range', value: [0, 2555], action: 'allow' }
        ],
        severity: 'high'
      },
      {
        name: 'Content Filter Policy',
        description: 'Filters inappropriate or harmful content',
        type: 'content_filter',
        rules: [
          { field: 'content', operator: 'contains', value: 'inappropriate', action: 'deny' },
          { field: 'content', operator: 'contains', value: 'harmful', action: 'deny' }
        ],
        severity: 'medium'
      },
      {
        name: 'Access Control Policy',
        description: 'Controls access to AI resources and data',
        type: 'access_control',
        rules: [
          { field: 'user_role', operator: 'equals', value: 'admin', action: 'allow' },
          { field: 'resource_sensitivity', operator: 'equals', value: 'high', action: 'log' }
        ],
        severity: 'high'
      }
    ];

    for (const policy of defaultPolicies) {
      const existing = await this.db.query(
        'SELECT id FROM ai_security_policies WHERE name = $1',
        [policy.name]
      );

      if (existing.rows.length === 0) {
        await this.db.query(
          `INSERT INTO ai_security_policies (name, description, type, rules, severity)
           VALUES ($1, $2, $3, $4, $5)`,
          [policy.name, policy.description, policy.type, JSON.stringify(policy.rules), policy.severity]
        );
      }
    }
  }

  // Gestión de políticas de seguridad
  async createSecurityPolicy(policy: Omit<SecurityPolicy, 'id' | 'createdAt' | 'updatedAt'>): Promise<SecurityPolicy> {
    try {
      const result = await this.db.query(
        `INSERT INTO ai_security_policies (name, description, type, rules, severity, is_active)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [policy.name, policy.description, policy.type, JSON.stringify(policy.rules), policy.severity, policy.isActive]
      );

      const newPolicy = result.rows[0];
      this.securityCache.set(newPolicy.id, newPolicy);
      
      logger.info('Security policy created', { policyId: newPolicy.id, name: newPolicy.name });
      return newPolicy;
    } catch (error: any) {
      logger.error('Failed to create security policy', { error: error.message });
      throw error;
    }
  }

  async getSecurityPolicies(): Promise<SecurityPolicy[]> {
    try {
      const result = await this.db.query('SELECT * FROM ai_security_policies ORDER BY created_at DESC');
      return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        type: row.type,
        rules: row.rules,
        severity: row.severity,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch (error: any) {
      logger.error('Failed to get security policies', { error: error.message });
      throw error;
    }
  }

  async updateSecurityPolicy(id: string, updates: Partial<SecurityPolicy>): Promise<SecurityPolicy> {
    try {
      const setClause = [];
      const values = [];
      let paramCount = 1;

      if (updates.name) {
        setClause.push(`name = $${paramCount++}`);
        values.push(updates.name);
      }
      if (updates.description) {
        setClause.push(`description = $${paramCount++}`);
        values.push(updates.description);
      }
      if (updates.rules) {
        setClause.push(`rules = $${paramCount++}`);
        values.push(JSON.stringify(updates.rules));
      }
      if (updates.severity) {
        setClause.push(`severity = $${paramCount++}`);
        values.push(updates.severity);
      }
      if (updates.isActive !== undefined) {
        setClause.push(`is_active = $${paramCount++}`);
        values.push(updates.isActive);
      }

      setClause.push(`updated_at = NOW()`);
      values.push(id);

      const result = await this.db.query(
        `UPDATE ai_security_policies SET ${setClause.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        throw new Error('Security policy not found');
      }

      const updatedPolicy = result.rows[0];
      this.securityCache.set(id, updatedPolicy);
      
      logger.info('Security policy updated', { policyId: id });
      return updatedPolicy;
    } catch (error: any) {
      logger.error('Failed to update security policy', { error: error.message, policyId: id });
      throw error;
    }
  }

  // Verificaciones de cumplimiento
  async runComplianceCheck(policyId: string, checkType: ComplianceCheck['checkType']): Promise<ComplianceCheck> {
    try {
      const result = await this.db.query(
        `INSERT INTO ai_compliance_checks (policy_id, check_type, status)
         VALUES ($1, $2, 'running')
         RETURNING *`,
        [policyId, checkType]
      );

      const check = result.rows[0];
      
      // Simular verificación de cumplimiento
      const checkResult = await this.performComplianceCheck(checkType, policyId);
      
      await this.db.query(
        `UPDATE ai_compliance_checks 
         SET status = 'completed', result = $1, completed_at = NOW()
         WHERE id = $2`,
        [JSON.stringify(checkResult), check.id]
      );

      const completedCheck = {
        id: check.id,
        policyId: check.policy_id,
        checkType: check.check_type,
        status: 'completed' as const,
        result: checkResult,
        startedAt: check.started_at,
        completedAt: new Date(),
        createdAt: check.created_at
      };

      this.complianceCache.set(check.id, completedCheck);
      
      logger.info('Compliance check completed', { checkId: check.id, checkType });
      return completedCheck;
    } catch (error: any) {
      logger.error('Failed to run compliance check', { error: error.message, policyId, checkType });
      throw error;
    }
  }

  private async performComplianceCheck(checkType: ComplianceCheck['checkType'], policyId: string): Promise<ComplianceCheck['result']> {
    // Simular diferentes tipos de verificaciones
    switch (checkType) {
      case 'data_retention':
        return {
          passed: Math.random() > 0.2,
          violations: Math.random() > 0.8 ? [
            {
              rule: 'data_retention_period',
              severity: 'medium' as const,
              description: 'Some data exceeds retention period',
              recommendation: 'Implement automatic data deletion'
            }
          ] : [],
          score: Math.floor(Math.random() * 40) + 60,
          details: {
            totalRecords: 1000,
            expiredRecords: Math.floor(Math.random() * 50),
            retentionPeriod: '2 years'
          }
        };

      case 'access_audit':
        return {
          passed: Math.random() > 0.1,
          violations: Math.random() > 0.9 ? [
            {
              rule: 'unauthorized_access',
              severity: 'high' as const,
              description: 'Detected unauthorized access attempts',
              recommendation: 'Review access logs and strengthen authentication'
            }
          ] : [],
          score: Math.floor(Math.random() * 30) + 70,
          details: {
            totalAccessAttempts: 500,
            unauthorizedAttempts: Math.floor(Math.random() * 10),
            lastAuditDate: new Date().toISOString()
          }
        };

      case 'content_scan':
        return {
          passed: Math.random() > 0.15,
          violations: Math.random() > 0.85 ? [
            {
              rule: 'inappropriate_content',
              severity: 'medium' as const,
              description: 'Found inappropriate content in AI responses',
              recommendation: 'Improve content filtering algorithms'
            }
          ] : [],
          score: Math.floor(Math.random() * 35) + 65,
          details: {
            totalContentScanned: 2000,
            flaggedContent: Math.floor(Math.random() * 20),
            scanAccuracy: 0.95
          }
        };

      case 'encryption_check':
        return {
          passed: Math.random() > 0.05,
          violations: Math.random() > 0.95 ? [
            {
              rule: 'unencrypted_data',
              severity: 'critical' as const,
              description: 'Found unencrypted sensitive data',
              recommendation: 'Implement encryption for all sensitive data'
            }
          ] : [],
          score: Math.floor(Math.random() * 20) + 80,
          details: {
            totalDataItems: 5000,
            encryptedItems: Math.floor(Math.random() * 100) + 4900,
            encryptionAlgorithm: 'AES-256'
          }
        };

      case 'gdpr_compliance':
        return {
          passed: Math.random() > 0.1,
          violations: Math.random() > 0.9 ? [
            {
              rule: 'data_subject_rights',
              severity: 'high' as const,
              description: 'Some data subject rights requests not processed',
              recommendation: 'Implement automated data subject rights processing'
            }
          ] : [],
          score: Math.floor(Math.random() * 25) + 75,
          details: {
            dataSubjectRequests: 50,
            processedRequests: Math.floor(Math.random() * 10) + 40,
            averageProcessingTime: '5 days'
          }
        };

      default:
        return {
          passed: true,
          violations: [],
          score: 100,
          details: {}
        };
    }
  }

  // Gestión de incidentes de seguridad
  async createSecurityIncident(incident: Omit<SecurityIncident, 'id' | 'reportedAt' | 'createdAt'>): Promise<SecurityIncident> {
    try {
      const result = await this.db.query(
        `INSERT INTO ai_security_incidents (type, severity, status, description, affected_data, affected_users, detection_method, remediation)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          incident.type,
          incident.severity,
          incident.status,
          incident.description,
          JSON.stringify(incident.affectedData),
          JSON.stringify(incident.affectedUsers),
          incident.detectionMethod,
          incident.remediation
        ]
      );

      const newIncident = result.rows[0];
      
      logger.warn('Security incident created', { 
        incidentId: newIncident.id, 
        type: newIncident.type, 
        severity: newIncident.severity 
      });
      
      return {
        id: newIncident.id,
        type: newIncident.type,
        severity: newIncident.severity,
        status: newIncident.status,
        description: newIncident.description,
        affectedData: newIncident.affected_data,
        affectedUsers: newIncident.affected_users,
        detectionMethod: newIncident.detection_method,
        remediation: newIncident.remediation,
        reportedAt: newIncident.reported_at,
        resolvedAt: newIncident.resolved_at,
        createdAt: newIncident.created_at
      };
    } catch (error: any) {
      logger.error('Failed to create security incident', { error: error.message });
      throw error;
    }
  }

  async getSecurityIncidents(): Promise<SecurityIncident[]> {
    try {
      const result = await this.db.query(
        'SELECT * FROM ai_security_incidents ORDER BY reported_at DESC'
      );
      
      return result.rows.map(row => ({
        id: row.id,
        type: row.type,
        severity: row.severity,
        status: row.status,
        description: row.description,
        affectedData: row.affected_data,
        affectedUsers: row.affected_users,
        detectionMethod: row.detection_method,
        remediation: row.remediation,
        reportedAt: row.reported_at,
        resolvedAt: row.resolved_at,
        createdAt: row.created_at
      }));
    } catch (error: any) {
      logger.error('Failed to get security incidents', { error: error.message });
      throw error;
    }
  }

  // Logs de auditoría
  async logAuditEvent(auditLog: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> {
    try {
      const result = await this.db.query(
        `INSERT INTO ai_audit_logs (user_id, action, resource, resource_id, details, ip_address, user_agent, success)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          auditLog.userId,
          auditLog.action,
          auditLog.resource,
          auditLog.resourceId,
          JSON.stringify(auditLog.details),
          auditLog.ipAddress,
          auditLog.userAgent,
          auditLog.success
        ]
      );

      const newLog = result.rows[0];
      
      logger.info('Audit event logged', { 
        auditId: newLog.id, 
        action: newLog.action, 
        resource: newLog.resource 
      });
      
      return {
        id: newLog.id,
        userId: newLog.user_id,
        action: newLog.action,
        resource: newLog.resource,
        resourceId: newLog.resource_id,
        details: newLog.details,
        ipAddress: newLog.ip_address,
        userAgent: newLog.user_agent,
        timestamp: newLog.timestamp,
        success: newLog.success
      };
    } catch (error: any) {
      logger.error('Failed to log audit event', { error: error.message });
      throw error;
    }
  }

  // Evaluación de seguridad para requests de AI
  async evaluateAISecurity(request: AISecurityRequest): Promise<AISecurityResponse> {
    try {
      const violations: AISecurityResponse['violations'] = [];
      const recommendations: string[] = [];
      let allowed = true;

      // Aplicar políticas de seguridad
      for (const [policyId, policy] of this.securityCache) {
        if (!policy.isActive) continue;

        for (const rule of policy.rules) {
          const violation = this.evaluateRule(rule, request, policy);
          if (violation) {
            violations.push(violation);
            
            if (rule.action === 'deny') {
              allowed = false;
            }
            
            if (rule.action === 'log') {
              await this.logAuditEvent({
                userId: request.userId,
                action: 'security_violation',
                resource: 'ai_request',
                details: {
                  policyId,
                  rule: rule.field,
                  violation: violation.description,
                  requestData: request.data
                },
                ipAddress: request.context.ipAddress,
                userAgent: request.context.userAgent,
                success: false
              });
            }
          }
        }
      }

      // Generar recomendaciones
      if (violations.length > 0) {
        recommendations.push('Review and address security violations');
        recommendations.push('Consider updating security policies');
        recommendations.push('Implement additional monitoring');
      }

      // Log de auditoría
      const auditLog = await this.logAuditEvent({
        userId: request.userId,
        action: request.action,
        resource: 'ai_security_evaluation',
        details: {
          allowed,
          violations: violations.length,
          policies: this.securityCache.size
        },
        ipAddress: request.context.ipAddress,
        userAgent: request.context.userAgent,
        success: allowed
      });

      return {
        allowed,
        reason: !allowed ? 'Security policy violation' : undefined,
        violations,
        recommendations,
        auditId: auditLog.id
      };
    } catch (error: any) {
      logger.error('Failed to evaluate AI security', { error: error.message });
      throw error;
    }
  }

  private evaluateRule(rule: any, request: AISecurityRequest, policy: SecurityPolicy): AISecurityResponse['violations'][0] | null {
    // Lógica simplificada de evaluación de reglas
    const fieldValue = this.getFieldValue(rule.field, request);
    
    if (!fieldValue) {
      if (rule.operator === 'exists') {
        return {
          rule: rule.field,
          severity: policy.severity,
          description: `Field ${rule.field} does not exist`
        };
      }
      return null;
    }

    switch (rule.operator) {
      case 'equals':
        if (fieldValue !== rule.value) return null;
        break;
      case 'contains':
        if (!String(fieldValue).includes(String(rule.value))) return null;
        break;
      case 'regex':
        if (!new RegExp(rule.value).test(String(fieldValue))) return null;
        break;
      case 'range':
        if (typeof fieldValue === 'number' && fieldValue >= rule.value[0] && fieldValue <= rule.value[1]) return null;
        break;
      default:
        return null;
    }

    return {
      rule: rule.field,
      severity: policy.severity,
      description: `Rule violation: ${rule.field} ${rule.operator} ${rule.value}`
    };
  }

  private getFieldValue(field: string, request: AISecurityRequest): any {
    const fieldMap: Record<string, any> = {
      'user_id': request.userId,
      'organization_id': request.organizationId,
      'action': request.action,
      'data_type': typeof request.data,
      'data_size': JSON.stringify(request.data).length,
      'ip_address': request.context.ipAddress,
      'user_agent': request.context.userAgent
    };

    return fieldMap[field];
  }

  // Generación de reportes de cumplimiento
  async generateComplianceReport(organizationId: string, reportType: string, period: { start: Date; end: Date }): Promise<ComplianceReport> {
    try {
      const checks = await this.db.query(
        `SELECT * FROM ai_compliance_checks 
         WHERE created_at BETWEEN $1 AND $2
         ORDER BY created_at DESC`,
        [period.start, period.end]
      );

      const totalChecks = checks.rows.length;
      const passedChecks = checks.rows.filter(row => row.result.passed).length;
      const failedChecks = totalChecks - passedChecks;
      const overallScore = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 100;

      const report: ComplianceReport = {
        id: `report_${Date.now()}`,
        organizationId,
        reportType,
        period,
        summary: {
          totalChecks,
          passedChecks,
          failedChecks,
          overallScore
        },
        details: {
          dataProtection: this.aggregateCheckResults(checks.rows, 'data_retention'),
          accessControl: this.aggregateCheckResults(checks.rows, 'access_audit'),
          contentFilter: this.aggregateCheckResults(checks.rows, 'content_scan'),
          auditTrail: this.aggregateCheckResults(checks.rows, 'encryption_check'),
          gdprCompliance: this.aggregateCheckResults(checks.rows, 'gdpr_compliance')
        },
        recommendations: this.generateRecommendations(checks.rows),
        generatedAt: new Date()
      };

      logger.info('Compliance report generated', { 
        reportId: report.id, 
        organizationId, 
        overallScore 
      });

      return report;
    } catch (error: any) {
      logger.error('Failed to generate compliance report', { error: error.message });
      throw error;
    }
  }

  private aggregateCheckResults(checks: any[], checkType: string): ComplianceCheck['result'] {
    const typeChecks = checks.filter(check => check.check_type === checkType);
    
    if (typeChecks.length === 0) {
      return {
        passed: true,
        violations: [],
        score: 100,
        details: {}
      };
    }

    const totalScore = typeChecks.reduce((sum, check) => sum + check.result.score, 0);
    const averageScore = Math.round(totalScore / typeChecks.length);
    const allPassed = typeChecks.every(check => check.result.passed);
    
    const allViolations = typeChecks.flatMap(check => check.result.violations);

    return {
      passed: allPassed,
      violations: allViolations,
      score: averageScore,
      details: {
        totalChecks: typeChecks.length,
        averageScore,
        totalViolations: allViolations.length
      }
    };
  }

  private generateRecommendations(checks: any[]): string[] {
    const recommendations: string[] = [];
    
    const failedChecks = checks.filter(check => !check.result.passed);
    if (failedChecks.length > 0) {
      recommendations.push('Address failed compliance checks immediately');
    }

    const lowScoreChecks = checks.filter(check => check.result.score < 70);
    if (lowScoreChecks.length > 0) {
      recommendations.push('Improve compliance scores for low-performing areas');
    }

    const criticalViolations = checks.flatMap(check => 
      check.result.violations.filter((v: any) => v.severity === 'critical')
    );
    if (criticalViolations.length > 0) {
      recommendations.push('Resolve critical security violations immediately');
    }

    if (recommendations.length === 0) {
      recommendations.push('Maintain current compliance standards');
      recommendations.push('Continue regular compliance monitoring');
    }

    return recommendations;
  }

  // Health check
  async getHealthStatus(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; services: Record<string, boolean>; lastCheck: Date }> {
    try {
      const services = {
        database: await this.checkDatabaseHealth(),
        policies: this.securityCache.size > 0,
        compliance: this.complianceCache.size >= 0
      };

      const healthyServices = Object.values(services).filter(Boolean).length;
      const totalServices = Object.keys(services).length;
      
      let status: 'healthy' | 'degraded' | 'unhealthy';
      if (healthyServices === totalServices) {
        status = 'healthy';
      } else if (healthyServices >= totalServices * 0.5) {
        status = 'degraded';
      } else {
        status = 'unhealthy';
      }

      return {
        status,
        services,
        lastCheck: new Date()
      };
    } catch (error: any) {
      logger.error('Health check failed', { error: error.message });
      return {
        status: 'unhealthy',
        services: { database: false, policies: false, compliance: false },
        lastCheck: new Date()
      };
    }
  }

  private async checkDatabaseHealth(): Promise<boolean> {
    try {
      await this.db.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}

export const aiSecurityComplianceService = new AISecurityComplianceService();
