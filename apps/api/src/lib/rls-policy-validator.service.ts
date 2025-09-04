// RLS Policy Validator Service for PR-44
import { 
  RLSPolicy, 
  PolicyValidationResult, 
  ValidationIssue,
  ValidationConfig 
} from './rls-types';
import { logger } from './logger.js';

export class RLSPolicyValidatorService {
  private validationResults: PolicyValidationResult[] = [];
  private validationConfigs: ValidationConfig[] = [];

  constructor() {
    this.initializeValidationConfigs();
  }

  private initializeValidationConfigs(): void {
    this.validationConfigs = [
      {
        id: 'syntax_validation',
        name: 'Syntax Validation',
        type: 'syntax',
        enabled: true,
        parameters: {
          strictMode: true,
          allowDeprecated: false
        },
        timeout: 5000,
        retries: 3
      },
      {
        id: 'semantic_validation',
        name: 'Semantic Validation',
        type: 'semantic',
        enabled: true,
        parameters: {
          checkReferences: true,
          checkPermissions: true
        },
        timeout: 10000,
        retries: 2
      },
      {
        id: 'performance_validation',
        name: 'Performance Validation',
        type: 'performance',
        enabled: true,
        parameters: {
          maxExecutionTime: 1000,
          checkIndexes: true
        },
        timeout: 15000,
        retries: 1
      },
      {
        id: 'security_validation',
        name: 'Security Validation',
        type: 'security',
        enabled: true,
        parameters: {
          checkInjection: true,
          checkPrivileges: true
        },
        timeout: 8000,
        retries: 2
      },
      {
        id: 'compliance_validation',
        name: 'Compliance Validation',
        type: 'compliance',
        enabled: true,
        parameters: {
          gdprCompliance: true,
          auditTrail: true
        },
        timeout: 12000,
        retries: 1
      }
    ];
  }

  async validatePolicy(
    policy: RLSPolicy,
    validationTypes: string[] = ['syntax', 'semantic', 'performance', 'security', 'compliance'],
    executedBy: string
  ): Promise<PolicyValidationResult[]> {
    try {
      const results: PolicyValidationResult[] = [];

      for (const validationType of validationTypes) {
        const config = this.validationConfigs.find(c => c.type === validationType);
        if (!config || !config.enabled) continue;

        const result = await this.performValidation(policy, config, executedBy);
        results.push(result);
      }

      // Store results
      this.validationResults.push(...results);

      logger.info('Policy validation completed', {
        policyId: policy.id,
        validationTypes,
        results: results.map(r => ({ type: r.validationType, status: r.status, score: r.score }))
      });

      return results;
    } catch (error) {
      logger.error('Policy validation failed', { 
        policyId: policy.id, 
        error: (error as Error).message 
      });
      throw error;
    }
  }

  private async performValidation(
    policy: RLSPolicy,
    config: ValidationConfig,
    executedBy: string
  ): Promise<PolicyValidationResult> {
    const startTime = Date.now();
    let issues: ValidationIssue[] = [];
    let status: 'passed' | 'failed' | 'warning' = 'passed';
    let score = 100;

    try {
      switch (config.type) {
        case 'syntax':
          issues = await this.validateSyntax(policy, config);
          break;
        case 'semantic':
          issues = await this.validateSemantic(policy, config);
          break;
        case 'performance':
          issues = await this.validatePerformance(policy, config);
          break;
        case 'security':
          issues = await this.validateSecurity(policy, config);
          break;
        case 'compliance':
          issues = await this.validateCompliance(policy, config);
          break;
      }

      // Calculate score and status
      const criticalIssues = issues.filter(i => i.severity === 'critical').length;
      const highIssues = issues.filter(i => i.severity === 'high').length;
      const mediumIssues = issues.filter(i => i.severity === 'medium').length;
      const lowIssues = issues.filter(i => i.severity === 'low').length;

      score = Math.max(0, 100 - (criticalIssues * 25) - (highIssues * 15) - (mediumIssues * 10) - (lowIssues * 5));

      if (criticalIssues > 0 || highIssues > 2) {
        status = 'failed';
      } else if (highIssues > 0 || mediumIssues > 3) {
        status = 'warning';
      } else {
        status = 'passed';
      }

    } catch (error) {
      issues.push({
        id: `error_${Date.now()}`,
        type: 'error',
        severity: 'critical',
        message: `Validation error: ${(error as Error).message}`,
        metadata: {}
      });
      status = 'failed';
      score = 0;
    }

    const executionTime = Date.now() - startTime;

    const result: PolicyValidationResult = {
      id: `validation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      policyId: policy.id,
      validationType: config.type,
      status,
      score,
      issues,
      recommendations: this.generateRecommendations(issues),
      executedAt: new Date(),
      executedBy
    };

    return result;
  }

  private async validateSyntax(policy: RLSPolicy, config: ValidationConfig): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];

    // Check if condition is valid SQL
    if (!policy.condition || policy.condition.trim() === '') {
      issues.push({
        id: 'empty_condition',
        type: 'error',
        severity: 'critical',
        message: 'Policy condition cannot be empty',
        suggestion: 'Provide a valid SQL condition for the policy',
        metadata: {}
      });
    }

    // Check for SQL injection patterns
    const sqlInjectionPatterns = [
      /;\s*drop\s+table/i,
      /;\s*delete\s+from/i,
      /;\s*update\s+.*\s+set/i,
      /union\s+select/i,
      /or\s+1\s*=\s*1/i
    ];

    for (const pattern of sqlInjectionPatterns) {
      if (pattern.test(policy.condition)) {
        issues.push({
          id: 'sql_injection_pattern',
          type: 'error',
          severity: 'critical',
          message: 'Potential SQL injection pattern detected',
          suggestion: 'Review and sanitize the policy condition',
          metadata: { pattern: pattern.source }
        });
      }
    }

    // Check for valid policy type
    const validPolicyTypes = ['select', 'insert', 'update', 'delete', 'all'];
    if (!validPolicyTypes.includes(policy.policyType)) {
      issues.push({
        id: 'invalid_policy_type',
        type: 'error',
        severity: 'high',
        message: `Invalid policy type: ${policy.policyType}`,
        suggestion: `Use one of: ${validPolicyTypes.join(', ')}`,
        metadata: {}
      });
    }

    // Check for valid table and schema names
    if (!policy.tableName || policy.tableName.trim() === '') {
      issues.push({
        id: 'empty_table_name',
        type: 'error',
        severity: 'critical',
        message: 'Table name cannot be empty',
        suggestion: 'Provide a valid table name',
        metadata: {}
      });
    }

    if (!policy.schemaName || policy.schemaName.trim() === '') {
      issues.push({
        id: 'empty_schema_name',
        type: 'error',
        severity: 'critical',
        message: 'Schema name cannot be empty',
        suggestion: 'Provide a valid schema name',
        metadata: {}
      });
    }

    return issues;
  }

  private async validateSemantic(policy: RLSPolicy, config: ValidationConfig): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];

    // Check if roles exist
    if (policy.roles.length === 0) {
      issues.push({
        id: 'no_roles',
        type: 'warning',
        severity: 'medium',
        message: 'No roles specified for the policy',
        suggestion: 'Consider specifying roles for better security',
        metadata: {}
      });
    }

    // Check for conflicting roles
    const conflictingRoles = ['admin', 'user'];
    const hasConflictingRoles = policy.roles.some(role => conflictingRoles.includes(role));
    if (hasConflictingRoles) {
      issues.push({
        id: 'conflicting_roles',
        type: 'warning',
        severity: 'medium',
        message: 'Conflicting roles detected (admin and user)',
        suggestion: 'Review role assignments for potential conflicts',
        metadata: {}
      });
    }

    // Check condition complexity
    const conditionComplexity = this.calculateConditionComplexity(policy.condition);
    if (conditionComplexity > 10) {
      issues.push({
        id: 'complex_condition',
        type: 'warning',
        severity: 'medium',
        message: 'Policy condition is very complex',
        suggestion: 'Consider simplifying the condition for better performance',
        metadata: { complexity: conditionComplexity }
      });
    }

    // Check for missing indexes
    if (this.requiresIndex(policy.condition)) {
      issues.push({
        id: 'missing_index',
        type: 'info',
        severity: 'low',
        message: 'Policy condition may benefit from an index',
        suggestion: 'Consider adding an index on the columns used in the condition',
        metadata: {}
      });
    }

    return issues;
  }

  private async validatePerformance(policy: RLSPolicy, config: ValidationConfig): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];

    // Check condition performance
    const performanceScore = this.analyzeConditionPerformance(policy.condition);
    if (performanceScore < 70) {
      issues.push({
        id: 'poor_performance',
        type: 'warning',
        severity: 'high',
        message: 'Policy condition may have poor performance',
        suggestion: 'Optimize the condition or add appropriate indexes',
        metadata: { performanceScore }
      });
    }

    // Check for expensive operations
    const expensiveOperations = [
      /like\s+'.*%.*'/i,
      /regexp/i,
      /similar\s+to/i,
      /substring/i,
      /length\s*\(/i
    ];

    for (const pattern of expensiveOperations) {
      if (pattern.test(policy.condition)) {
        issues.push({
          id: 'expensive_operation',
          type: 'warning',
          severity: 'medium',
          message: 'Policy condition contains expensive operations',
          suggestion: 'Consider optimizing or caching the result',
          metadata: { operation: pattern.source }
        });
      }
    }

    // Check for potential N+1 queries
    if (this.detectNPlusOneQueries(policy.condition)) {
      issues.push({
        id: 'n_plus_one_queries',
        type: 'warning',
        severity: 'medium',
        message: 'Policy condition may cause N+1 queries',
        suggestion: 'Consider using joins or subqueries to optimize',
        metadata: {}
      });
    }

    return issues;
  }

  private async validateSecurity(policy: RLSPolicy, config: ValidationConfig): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];

    // Check for privilege escalation
    if (this.detectPrivilegeEscalation(policy)) {
      issues.push({
        id: 'privilege_escalation',
        type: 'error',
        severity: 'critical',
        message: 'Potential privilege escalation detected',
        suggestion: 'Review policy to ensure proper access control',
        metadata: {}
      });
    }

    // Check for data leakage
    if (this.detectDataLeakage(policy)) {
      issues.push({
        id: 'data_leakage',
        type: 'error',
        severity: 'high',
        message: 'Potential data leakage detected',
        suggestion: 'Review policy to ensure data isolation',
        metadata: {}
      });
    }

    // Check for bypass vulnerabilities
    if (this.detectBypassVulnerabilities(policy)) {
      issues.push({
        id: 'bypass_vulnerability',
        type: 'error',
        severity: 'high',
        message: 'Potential bypass vulnerability detected',
        suggestion: 'Review policy condition for security gaps',
        metadata: {}
      });
    }

    // Check for sensitive data exposure
    if (this.detectSensitiveDataExposure(policy)) {
      issues.push({
        id: 'sensitive_data_exposure',
        type: 'warning',
        severity: 'medium',
        message: 'Policy may expose sensitive data',
        suggestion: 'Review data categories and access patterns',
        metadata: {}
      });
    }

    return issues;
  }

  private async validateCompliance(policy: RLSPolicy, config: ValidationConfig): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];

    // Check GDPR compliance
    if (config.parameters.gdprCompliance) {
      const gdprIssues = this.validateGDPRCompliance(policy);
      issues.push(...gdprIssues);
    }

    // Check audit trail
    if (config.parameters.auditTrail) {
      if (policy.auditTrail.length === 0) {
        issues.push({
          id: 'no_audit_trail',
          type: 'warning',
          severity: 'medium',
          message: 'No audit trail for policy changes',
          suggestion: 'Enable audit trail for compliance',
          metadata: {}
        });
      }
    }

    // Check data retention
    if (this.checkDataRetentionCompliance(policy)) {
      issues.push({
        id: 'data_retention_compliance',
        type: 'info',
        severity: 'low',
        message: 'Policy complies with data retention requirements',
        metadata: {}
      });
    }

    return issues;
  }

  private validateGDPRCompliance(policy: RLSPolicy): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Check for personal data handling
    const personalDataPatterns = [
      /user_id/i,
      /email/i,
      /phone/i,
      /address/i,
      /personal/i
    ];

    const hasPersonalData = personalDataPatterns.some(pattern => 
      pattern.test(policy.condition) || pattern.test(policy.tableName)
    );

    if (hasPersonalData) {
      // Check if data categories are properly defined
      if (policy.dataCategories.length === 0) {
        issues.push({
          id: 'missing_data_categories',
          type: 'warning',
          severity: 'medium',
          message: 'Personal data detected but no data categories defined',
          suggestion: 'Define data categories for GDPR compliance',
          metadata: {}
        });
      }

      // Check for proper access controls
      if (policy.roles.length === 0 && policy.users.length === 0) {
        issues.push({
          id: 'no_access_controls',
          type: 'error',
          severity: 'high',
          message: 'Personal data policy has no access controls',
          suggestion: 'Define proper access controls for personal data',
          metadata: {}
        });
      }
    }

    return issues;
  }

  private calculateConditionComplexity(condition: string): number {
    // Simple complexity calculation based on operators and functions
    const operators = ['AND', 'OR', 'NOT', '=', '!=', '<', '>', '<=', '>='];
    const functions = ['COUNT', 'SUM', 'AVG', 'MAX', 'MIN', 'SUBSTRING', 'LENGTH'];
    
    let complexity = 0;
    
    operators.forEach(op => {
      const matches = condition.match(new RegExp(`\\b${op}\\b`, 'gi'));
      if (matches) complexity += matches.length;
    });
    
    functions.forEach(func => {
      const matches = condition.match(new RegExp(`\\b${func}\\b`, 'gi'));
      if (matches) complexity += matches.length * 2;
    });
    
    return complexity;
  }

  private requiresIndex(condition: string): boolean {
    // Check if condition uses columns that would benefit from an index
    const indexablePatterns = [
      /user_id\s*=/i,
      /organization_id\s*=/i,
      /created_at\s*>/i,
      /updated_at\s*>/i
    ];
    
    return indexablePatterns.some(pattern => pattern.test(condition));
  }

  private analyzeConditionPerformance(condition: string): number {
    // Simple performance analysis
    let score = 100;
    
    // Penalize expensive operations
    if (/like\s+'.*%.*'/i.test(condition)) score -= 20;
    if (/regexp/i.test(condition)) score -= 30;
    if (/substring/i.test(condition)) score -= 15;
    
    // Reward simple conditions
    if (/^\w+\s*=\s*\w+$/i.test(condition)) score += 10;
    
    return Math.max(0, Math.min(100, score));
  }

  private detectNPlusOneQueries(condition: string): boolean {
    // Simple detection of potential N+1 queries
    return /EXISTS\s*\(/i.test(condition) || /IN\s*\(/i.test(condition);
  }

  private detectPrivilegeEscalation(policy: RLSPolicy): boolean {
    // Check for potential privilege escalation
    return policy.roles.includes('admin') && policy.condition.includes('true');
  }

  private detectDataLeakage(policy: RLSPolicy): boolean {
    // Check for potential data leakage
    return policy.condition === 'true' || policy.condition === '1=1';
  }

  private detectBypassVulnerabilities(policy: RLSPolicy): boolean {
    // Check for bypass vulnerabilities
    const bypassPatterns = [
      /or\s+1\s*=\s*1/i,
      /or\s+true/i,
      /union\s+select/i
    ];
    
    return bypassPatterns.some(pattern => pattern.test(policy.condition));
  }

  private detectSensitiveDataExposure(policy: RLSPolicy): boolean {
    // Check for sensitive data exposure
    const sensitivePatterns = [
      /password/i,
      /ssn/i,
      /credit_card/i,
      /bank_account/i
    ];
    
    return sensitivePatterns.some(pattern => 
      pattern.test(policy.condition) || pattern.test(policy.tableName)
    );
  }

  private checkDataRetentionCompliance(policy: RLSPolicy): boolean {
    // Check if policy complies with data retention requirements
    return policy.dataCategories.length > 0 && policy.roles.length > 0;
  }

  private generateRecommendations(issues: ValidationIssue[]): string[] {
    const recommendations: string[] = [];
    
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    const highIssues = issues.filter(i => i.severity === 'high');
    
    if (criticalIssues.length > 0) {
      recommendations.push('Fix all critical issues before deploying the policy');
    }
    
    if (highIssues.length > 0) {
      recommendations.push('Address high-severity issues for better security');
    }
    
    if (issues.some(i => i.type === 'warning')) {
      recommendations.push('Consider addressing warnings for optimal performance');
    }
    
    return recommendations;
  }

  getValidationResults(policyId?: string): PolicyValidationResult[] {
    if (policyId) {
      return this.validationResults.filter(r => r.policyId === policyId);
    }
    return [...this.validationResults];
  }

  getValidationResult(resultId: string): PolicyValidationResult | null {
    return this.validationResults.find(r => r.id === resultId) || null;
  }

  getValidationConfigs(): ValidationConfig[] {
    return [...this.validationConfigs];
  }

  getValidationConfig(configId: string): ValidationConfig | null {
    return this.validationConfigs.find(c => c.id === configId) || null;
  }

  updateValidationConfig(configId: string, updates: Partial<ValidationConfig>): ValidationConfig | null {
    const configIndex = this.validationConfigs.findIndex(c => c.id === configId);
    if (configIndex === -1) return null;

    this.validationConfigs[configIndex] = {
      ...this.validationConfigs[configIndex],
      ...updates
    };

    return this.validationConfigs[configIndex];
  }

  getValidationStats(): {
    totalValidations: number;
    passedValidations: number;
    failedValidations: number;
    warningValidations: number;
    averageScore: number;
    validationsByType: Record<string, number>;
  } {
    const total = this.validationResults.length;
    const passed = this.validationResults.filter(r => r.status === 'passed').length;
    const failed = this.validationResults.filter(r => r.status === 'failed').length;
    const warning = this.validationResults.filter(r => r.status === 'warning').length;
    const averageScore = total > 0 
      ? this.validationResults.reduce((sum, r) => sum + r.score, 0) / total 
      : 0;

    const validationsByType = this.validationResults.reduce((acc, result) => {
      acc[result.validationType] = (acc[result.validationType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalValidations: total,
      passedValidations: passed,
      failedValidations: failed,
      warningValidations: warning,
      averageScore,
      validationsByType
    };
  }
}
