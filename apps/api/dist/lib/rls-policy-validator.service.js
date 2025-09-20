import { logger } from './logger.js';
export class RLSPolicyValidatorService {
    validationResults = [];
    validationConfigs = [];
    constructor() {
        this.initializeValidationConfigs();
    }
    initializeValidationConfigs() {
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
    async validatePolicy(policy, validationTypes = ['syntax', 'semantic', 'performance', 'security', 'compliance'], executedBy) {
        try {
            const results = [];
            for (const validationType of validationTypes) {
                const config = this.validationConfigs.find(c => c.type === validationType);
                if (!config || !config.enabled)
                    continue;
                const result = await this.performValidation(policy, config, executedBy);
                results.push(result);
            }
            this.validationResults.push(...results);
            logger.info('Policy validation completed', {
                policyId: policy.id,
                validationTypes,
                results: results.map(r => ({ type: r.validationType, status: r.status, score: r.score }))
            });
            return results;
        }
        catch (error) {
            logger.error('Policy validation failed', {
                policyId: policy.id,
                error: error.message
            });
            throw error;
        }
    }
    async performValidation(policy, config, executedBy) {
        const startTime = Date.now();
        let issues = [];
        let status = 'passed';
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
            const criticalIssues = issues.filter(i => i.severity === 'critical').length;
            const highIssues = issues.filter(i => i.severity === 'high').length;
            const mediumIssues = issues.filter(i => i.severity === 'medium').length;
            const lowIssues = issues.filter(i => i.severity === 'low').length;
            score = Math.max(0, 100 - (criticalIssues * 25) - (highIssues * 15) - (mediumIssues * 10) - (lowIssues * 5));
            if (criticalIssues > 0 || highIssues > 2) {
                status = 'failed';
            }
            else if (highIssues > 0 || mediumIssues > 3) {
                status = 'warning';
            }
            else {
                status = 'passed';
            }
        }
        catch (error) {
            issues.push({
                id: `error_${Date.now()}`,
                type: 'error',
                severity: 'critical',
                message: `Validation error: ${error.message}`,
                metadata: {}
            });
            status = 'failed';
            score = 0;
        }
        const executionTime = Date.now() - startTime;
        const result = {
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
    async validateSyntax(policy, config) {
        const issues = [];
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
    async validateSemantic(policy, config) {
        const issues = [];
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
    async validatePerformance(policy, config) {
        const issues = [];
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
    async validateSecurity(policy, config) {
        const issues = [];
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
    async validateCompliance(policy, config) {
        const issues = [];
        if (config.parameters.gdprCompliance) {
            const gdprIssues = this.validateGDPRCompliance(policy);
            issues.push(...gdprIssues);
        }
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
    validateGDPRCompliance(policy) {
        const issues = [];
        const personalDataPatterns = [
            /user_id/i,
            /email/i,
            /phone/i,
            /address/i,
            /personal/i
        ];
        const hasPersonalData = personalDataPatterns.some(pattern => pattern.test(policy.condition) || pattern.test(policy.tableName));
        if (hasPersonalData) {
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
    calculateConditionComplexity(condition) {
        const operators = ['AND', 'OR', 'NOT', '=', '!=', '<', '>', '<=', '>='];
        const functions = ['COUNT', 'SUM', 'AVG', 'MAX', 'MIN', 'SUBSTRING', 'LENGTH'];
        let complexity = 0;
        operators.forEach(op => {
            const matches = condition.match(new RegExp(`\\b${op}\\b`, 'gi'));
            if (matches)
                complexity += matches.length;
        });
        functions.forEach(func => {
            const matches = condition.match(new RegExp(`\\b${func}\\b`, 'gi'));
            if (matches)
                complexity += matches.length * 2;
        });
        return complexity;
    }
    requiresIndex(condition) {
        const indexablePatterns = [
            /user_id\s*=/i,
            /organization_id\s*=/i,
            /created_at\s*>/i,
            /updated_at\s*>/i
        ];
        return indexablePatterns.some(pattern => pattern.test(condition));
    }
    analyzeConditionPerformance(condition) {
        let score = 100;
        if (/like\s+'.*%.*'/i.test(condition))
            score -= 20;
        if (/regexp/i.test(condition))
            score -= 30;
        if (/substring/i.test(condition))
            score -= 15;
        if (/^\w+\s*=\s*\w+$/i.test(condition))
            score += 10;
        return Math.max(0, Math.min(100, score));
    }
    detectNPlusOneQueries(condition) {
        return /EXISTS\s*\(/i.test(condition) || /IN\s*\(/i.test(condition);
    }
    detectPrivilegeEscalation(policy) {
        return policy.roles.includes('admin') && policy.condition.includes('true');
    }
    detectDataLeakage(policy) {
        return policy.condition === 'true' || policy.condition === '1=1';
    }
    detectBypassVulnerabilities(policy) {
        const bypassPatterns = [
            /or\s+1\s*=\s*1/i,
            /or\s+true/i,
            /union\s+select/i
        ];
        return bypassPatterns.some(pattern => pattern.test(policy.condition));
    }
    detectSensitiveDataExposure(policy) {
        const sensitivePatterns = [
            /password/i,
            /ssn/i,
            /credit_card/i,
            /bank_account/i
        ];
        return sensitivePatterns.some(pattern => pattern.test(policy.condition) || pattern.test(policy.tableName));
    }
    checkDataRetentionCompliance(policy) {
        return policy.dataCategories.length > 0 && policy.roles.length > 0;
    }
    generateRecommendations(issues) {
        const recommendations = [];
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
    getValidationResults(policyId) {
        if (policyId) {
            return this.validationResults.filter(r => r.policyId === policyId);
        }
        return [...this.validationResults];
    }
    getValidationResult(resultId) {
        return this.validationResults.find(r => r.id === resultId) || null;
    }
    getValidationConfigs() {
        return [...this.validationConfigs];
    }
    getValidationConfig(configId) {
        return this.validationConfigs.find(c => c.id === configId) || null;
    }
    updateValidationConfig(configId, updates) {
        const configIndex = this.validationConfigs.findIndex(c => c.id === configId);
        if (configIndex === -1)
            return null;
        this.validationConfigs[configIndex] = {
            ...this.validationConfigs[configIndex],
            ...updates
        };
        return this.validationConfigs[configIndex];
    }
    getValidationStats() {
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
        }, {});
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
//# sourceMappingURL=rls-policy-validator.service.js.map