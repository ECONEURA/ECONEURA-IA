import { structuredLogger } from './structured-logger.js';
class RLSGenerativaService {
    rlsContexts = new Map();
    rlsPolicies = new Map();
    rlsRules = new Map();
    rlsValidations = new Map();
    rlsAuditLogs = new Map();
    rlsReports = new Map();
    constructor() {
        this.init();
    }
    init() {
        this.createDemoData();
        structuredLogger.info('RLS Generativa Service initialized');
    }
    createDemoData() {
        const now = new Date();
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const context1 = {
            userId: 'user_1',
            organizationId: 'demo-org-1',
            role: 'admin',
            permissions: ['read', 'write', 'delete', 'admin'],
            sessionId: 'session_1',
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
            timestamp: now.toISOString()
        };
        const context2 = {
            userId: 'user_2',
            organizationId: 'demo-org-1',
            role: 'user',
            permissions: ['read', 'write'],
            sessionId: 'session_2',
            ipAddress: '192.168.1.101',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            timestamp: now.toISOString()
        };
        this.rlsContexts.set(context1.sessionId, context1);
        this.rlsContexts.set(context2.sessionId, context2);
        const policy1 = {
            id: 'policy_1',
            organizationId: 'demo-org-1',
            tableName: 'invoices',
            policyName: 'invoices_org_access',
            description: 'Los usuarios solo pueden acceder a facturas de su organización',
            configuration: {
                operation: 'ALL',
                isActive: true,
                priority: 10,
                bypassRLS: false
            },
            conditions: {
                type: 'simple',
                expression: 'organization_id = $1',
                parameters: { organizationId: 'demo-org-1' }
            },
            accessRules: {
                roles: ['admin', 'user', 'viewer'],
                timeRestrictions: {
                    startTime: '08:00',
                    endTime: '18:00',
                    daysOfWeek: [1, 2, 3, 4, 5],
                    timezone: 'Europe/Madrid'
                },
                ipRestrictions: {
                    allowedRanges: ['192.168.1.0/24', '10.0.0.0/8']
                }
            },
            metadata: {
                createdBy: 'admin@demo.com',
                lastModifiedBy: 'admin@demo.com',
                version: 1,
                tags: ['multi-tenant', 'invoices', 'organization'],
                documentation: 'Política básica de acceso por organización'
            },
            createdAt: oneMonthAgo.toISOString(),
            updatedAt: oneMonthAgo.toISOString()
        };
        const policy2 = {
            id: 'policy_2',
            organizationId: 'demo-org-1',
            tableName: 'customers',
            policyName: 'customers_role_access',
            description: 'Acceso a clientes basado en roles',
            configuration: {
                operation: 'SELECT',
                isActive: true,
                priority: 8,
                bypassRLS: false
            },
            conditions: {
                type: 'complex',
                expression: 'organization_id = $1 AND (created_by = $2 OR role = $3)',
                parameters: {
                    organizationId: 'demo-org-1',
                    createdBy: 'user_1',
                    role: 'admin'
                }
            },
            accessRules: {
                roles: ['admin', 'user'],
                users: ['user_1', 'user_2']
            },
            metadata: {
                createdBy: 'admin@demo.com',
                lastModifiedBy: 'admin@demo.com',
                version: 1,
                tags: ['customers', 'role-based', 'access-control']
            },
            createdAt: oneMonthAgo.toISOString(),
            updatedAt: oneMonthAgo.toISOString()
        };
        this.rlsPolicies.set(policy1.id, policy1);
        this.rlsPolicies.set(policy2.id, policy2);
        const rule1 = {
            id: 'rule_1',
            organizationId: 'demo-org-1',
            ruleName: 'admin_full_access',
            description: 'Los administradores tienen acceso completo',
            configuration: {
                isActive: true,
                priority: 10,
                evaluationOrder: 1,
                stopOnMatch: true
            },
            conditions: {
                context: {
                    role: 'admin',
                    permissions: ['admin']
                },
                data: {
                    operation: 'ALL'
                }
            },
            actions: {
                type: 'allow',
                parameters: {},
                message: 'Acceso completo para administrador'
            },
            metadata: {
                createdBy: 'admin@demo.com',
                lastModifiedBy: 'admin@demo.com',
                version: 1,
                tags: ['admin', 'full-access']
            },
            createdAt: oneMonthAgo.toISOString(),
            updatedAt: oneMonthAgo.toISOString()
        };
        const rule2 = {
            id: 'rule_2',
            organizationId: 'demo-org-1',
            ruleName: 'user_limited_access',
            description: 'Los usuarios regulares tienen acceso limitado',
            configuration: {
                isActive: true,
                priority: 5,
                evaluationOrder: 2,
                stopOnMatch: false
            },
            conditions: {
                context: {
                    role: 'user',
                    permissions: ['read', 'write']
                },
                data: {
                    operation: 'SELECT'
                }
            },
            actions: {
                type: 'modify',
                parameters: {
                    addCondition: 'created_by = $1',
                    parameters: ['userId']
                },
                message: 'Acceso limitado a registros propios'
            },
            metadata: {
                createdBy: 'admin@demo.com',
                lastModifiedBy: 'admin@demo.com',
                version: 1,
                tags: ['user', 'limited-access']
            },
            createdAt: oneMonthAgo.toISOString(),
            updatedAt: oneMonthAgo.toISOString()
        };
        this.rlsRules.set(rule1.id, rule1);
        this.rlsRules.set(rule2.id, rule2);
        const validation1 = {
            id: 'validation_1',
            organizationId: 'demo-org-1',
            validationName: 'data_integrity_check',
            description: 'Verificar integridad de datos en políticas RLS',
            configuration: {
                isActive: true,
                severity: 'high',
                autoFix: false,
                notificationEnabled: true
            },
            validationRules: [
                {
                    type: 'data_integrity',
                    expression: 'SELECT COUNT(*) FROM invoices WHERE organization_id IS NULL',
                    expectedResult: 0,
                    errorMessage: 'Existen facturas sin organización asignada'
                },
                {
                    type: 'access_control',
                    expression: 'SELECT COUNT(*) FROM rls_policies WHERE is_active = true',
                    expectedResult: { min: 1 },
                    errorMessage: 'Debe existir al menos una política RLS activa'
                }
            ],
            metadata: {
                createdBy: 'admin@demo.com',
                lastModifiedBy: 'admin@demo.com',
                version: 1
            },
            createdAt: oneMonthAgo.toISOString(),
            updatedAt: oneMonthAgo.toISOString()
        };
        this.rlsValidations.set(validation1.id, validation1);
        const auditLog1 = {
            id: 'audit_1',
            organizationId: 'demo-org-1',
            userId: 'user_1',
            sessionId: 'session_1',
            operation: {
                type: 'SELECT',
                tableName: 'invoices',
                columns: ['id', 'amount', 'status']
            },
            securityContext: {
                ipAddress: '192.168.1.100',
                userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
                role: 'admin',
                permissions: ['read', 'write', 'delete', 'admin'],
                policiesApplied: ['policy_1'],
                rulesEvaluated: ['rule_1']
            },
            result: {
                allowed: true,
                dataReturned: 15,
                executionTime: 45,
                policiesMatched: 1,
                rulesMatched: 1
            },
            timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
            requestId: 'req_1'
        };
        const auditLog2 = {
            id: 'audit_2',
            organizationId: 'demo-org-1',
            userId: 'user_2',
            sessionId: 'session_2',
            operation: {
                type: 'SELECT',
                tableName: 'customers',
                columns: ['id', 'name', 'email']
            },
            securityContext: {
                ipAddress: '192.168.1.101',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                role: 'user',
                permissions: ['read', 'write'],
                policiesApplied: ['policy_2'],
                rulesEvaluated: ['rule_2']
            },
            result: {
                allowed: true,
                dataReturned: 8,
                executionTime: 32,
                policiesMatched: 1,
                rulesMatched: 1
            },
            timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
            requestId: 'req_2'
        };
        this.rlsAuditLogs.set(auditLog1.id, auditLog1);
        this.rlsAuditLogs.set(auditLog2.id, auditLog2);
    }
    async createRLSContext(contextData) {
        const now = new Date().toISOString();
        const context = {
            ...contextData,
            timestamp: now
        };
        this.rlsContexts.set(context.sessionId, context);
        structuredLogger.info('RLS context created', {
            sessionId: context.sessionId,
            userId: context.userId,
            organizationId: context.organizationId,
            role: context.role
        });
        return context;
    }
    async getRLSContext(sessionId) {
        return this.rlsContexts.get(sessionId);
    }
    async getRLSPolicies(organizationId, filters = {}) {
        let policies = Array.from(this.rlsPolicies.values())
            .filter(p => p.organizationId === organizationId);
        if (filters.tableName) {
            policies = policies.filter(p => p.tableName === filters.tableName);
        }
        if (filters.operation) {
            policies = policies.filter(p => p.configuration.operation === filters.operation || p.configuration.operation === 'ALL');
        }
        if (filters.isActive !== undefined) {
            policies = policies.filter(p => p.configuration.isActive === filters.isActive);
        }
        if (filters.limit) {
            policies = policies.slice(0, filters.limit);
        }
        return policies.sort((a, b) => b.configuration.priority - a.configuration.priority);
    }
    async createRLSPolicy(policyData) {
        const now = new Date().toISOString();
        const policy = {
            id: `policy_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            ...policyData,
            createdAt: now,
            updatedAt: now
        };
        this.rlsPolicies.set(policy.id, policy);
        structuredLogger.info('RLS policy created', {
            policyId: policy.id,
            organizationId: policy.organizationId,
            tableName: policy.tableName,
            policyName: policy.policyName
        });
        return policy;
    }
    async getRLSRules(organizationId, filters = {}) {
        let rules = Array.from(this.rlsRules.values())
            .filter(r => r.organizationId === organizationId);
        if (filters.isActive !== undefined) {
            rules = rules.filter(r => r.configuration.isActive === filters.isActive);
        }
        if (filters.role) {
            rules = rules.filter(r => r.conditions.context.role === filters.role ||
                r.conditions.context.role === undefined);
        }
        if (filters.limit) {
            rules = rules.slice(0, filters.limit);
        }
        return rules.sort((a, b) => b.configuration.priority - a.configuration.priority);
    }
    async createRLSRule(ruleData) {
        const now = new Date().toISOString();
        const rule = {
            id: `rule_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            ...ruleData,
            createdAt: now,
            updatedAt: now
        };
        this.rlsRules.set(rule.id, rule);
        structuredLogger.info('RLS rule created', {
            ruleId: rule.id,
            organizationId: rule.organizationId,
            ruleName: rule.ruleName
        });
        return rule;
    }
    async evaluateAccess(context, operation) {
        const startTime = Date.now();
        const policiesApplied = [];
        const rulesEvaluated = [];
        const applicablePolicies = await this.getRLSPolicies(context.organizationId, {
            tableName: operation.tableName,
            operation: operation.type,
            isActive: true
        });
        const applicableRules = await this.getRLSRules(context.organizationId, {
            isActive: true,
            role: context.role
        });
        for (const rule of applicableRules) {
            rulesEvaluated.push(rule.id);
            if (this.evaluateRule(rule, context, operation)) {
                if (rule.actions.type === 'allow') {
                    const executionTime = Date.now() - startTime;
                    return {
                        allowed: true,
                        reason: rule.actions.message,
                        policiesApplied,
                        rulesEvaluated,
                        executionTime
                    };
                }
                else if (rule.actions.type === 'deny') {
                    const executionTime = Date.now() - startTime;
                    return {
                        allowed: false,
                        reason: rule.actions.message || 'Acceso denegado por regla',
                        policiesApplied,
                        rulesEvaluated,
                        executionTime
                    };
                }
            }
            if (rule.configuration.stopOnMatch) {
                break;
            }
        }
        for (const policy of applicablePolicies) {
            policiesApplied.push(policy.id);
            if (this.evaluatePolicy(policy, context, operation)) {
                const executionTime = Date.now() - startTime;
                return {
                    allowed: true,
                    reason: `Acceso permitido por política ${policy.policyName}`,
                    policiesApplied,
                    rulesEvaluated,
                    executionTime
                };
            }
        }
        const executionTime = Date.now() - startTime;
        return {
            allowed: false,
            reason: 'No se encontraron políticas o reglas que permitan el acceso',
            policiesApplied,
            rulesEvaluated,
            executionTime
        };
    }
    evaluateRule(rule, context, operation) {
        if (rule.conditions.context.role && rule.conditions.context.role !== context.role) {
            return false;
        }
        if (rule.conditions.context.permissions) {
            const hasRequiredPermissions = rule.conditions.context.permissions.every(perm => context.permissions.includes(perm));
            if (!hasRequiredPermissions) {
                return false;
            }
        }
        if (rule.conditions.data.operation && rule.conditions.data.operation !== operation.type) {
            return false;
        }
        if (rule.conditions.data.tableName && rule.conditions.data.tableName !== operation.tableName) {
            return false;
        }
        return true;
    }
    evaluatePolicy(policy, context, operation) {
        if (policy.accessRules.roles && !policy.accessRules.roles.includes(context.role)) {
            return false;
        }
        if (policy.accessRules.timeRestrictions) {
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const currentDay = now.getDay();
            if (policy.accessRules.timeRestrictions.startTime) {
                const [startHour, startMinute] = policy.accessRules.timeRestrictions.startTime.split(':').map(Number);
                if (currentHour < startHour || (currentHour === startHour && currentMinute < startMinute)) {
                    return false;
                }
            }
            if (policy.accessRules.timeRestrictions.endTime) {
                const [endHour, endMinute] = policy.accessRules.timeRestrictions.endTime.split(':').map(Number);
                if (currentHour > endHour || (currentHour === endHour && currentMinute > endMinute)) {
                    return false;
                }
            }
            if (policy.accessRules.timeRestrictions.daysOfWeek &&
                !policy.accessRules.timeRestrictions.daysOfWeek.includes(currentDay)) {
                return false;
            }
        }
        if (policy.accessRules.ipRestrictions) {
            const userIP = context.ipAddress;
            if (policy.accessRules.ipRestrictions.blockedIPs &&
                policy.accessRules.ipRestrictions.blockedIPs.includes(userIP)) {
                return false;
            }
            if (policy.accessRules.ipRestrictions.allowedIPs &&
                !policy.accessRules.ipRestrictions.allowedIPs.includes(userIP)) {
                return false;
            }
        }
        return true;
    }
    async logRLSAccess(auditData) {
        const now = new Date().toISOString();
        const auditLog = {
            id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            ...auditData,
            timestamp: now
        };
        this.rlsAuditLogs.set(auditLog.id, auditLog);
        structuredLogger.info('RLS access logged', {
            auditId: auditLog.id,
            userId: auditLog.userId,
            operation: auditLog.operation.type,
            tableName: auditLog.operation.tableName,
            allowed: auditLog.result.allowed
        });
        return auditLog;
    }
    async getRLSStats(organizationId) {
        const policies = Array.from(this.rlsPolicies.values()).filter(p => p.organizationId === organizationId);
        const rules = Array.from(this.rlsRules.values()).filter(r => r.organizationId === organizationId);
        const auditLogs = Array.from(this.rlsAuditLogs.values()).filter(a => a.organizationId === organizationId);
        const validations = Array.from(this.rlsValidations.values()).filter(v => v.organizationId === organizationId);
        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return {
            totalPolicies: policies.length,
            activePolicies: policies.filter(p => p.configuration.isActive).length,
            totalRules: rules.length,
            activeRules: rules.filter(r => r.configuration.isActive).length,
            totalValidations: validations.length,
            activeValidations: validations.filter(v => v.configuration.isActive).length,
            accessStats: {
                totalAccessAttempts: auditLogs.length,
                allowedAccess: auditLogs.filter(a => a.result.allowed).length,
                deniedAccess: auditLogs.filter(a => !a.result.allowed).length,
                averageExecutionTime: auditLogs.length > 0 ?
                    auditLogs.reduce((sum, a) => sum + a.result.executionTime, 0) / auditLogs.length : 0
            },
            last24Hours: {
                accessAttempts: auditLogs.filter(a => new Date(a.timestamp) >= last24Hours).length,
                allowedAccess: auditLogs.filter(a => a.result.allowed && new Date(a.timestamp) >= last24Hours).length,
                deniedAccess: auditLogs.filter(a => !a.result.allowed && new Date(a.timestamp) >= last24Hours).length
            },
            last7Days: {
                accessAttempts: auditLogs.filter(a => new Date(a.timestamp) >= last7Days).length,
                allowedAccess: auditLogs.filter(a => a.result.allowed && new Date(a.timestamp) >= last7Days).length,
                deniedAccess: auditLogs.filter(a => !a.result.allowed && new Date(a.timestamp) >= last7Days).length
            },
            byOperation: {
                SELECT: auditLogs.filter(a => a.operation.type === 'SELECT').length,
                INSERT: auditLogs.filter(a => a.operation.type === 'INSERT').length,
                UPDATE: auditLogs.filter(a => a.operation.type === 'UPDATE').length,
                DELETE: auditLogs.filter(a => a.operation.type === 'DELETE').length
            },
            byTable: this.getTableStats(auditLogs),
            byUser: this.getUserStats(auditLogs),
            topPolicies: this.getTopPolicies(auditLogs),
            topRules: this.getTopRules(auditLogs)
        };
    }
    getTableStats(auditLogs) {
        const tableStats = {};
        auditLogs.forEach(log => {
            tableStats[log.operation.tableName] = (tableStats[log.operation.tableName] || 0) + 1;
        });
        return tableStats;
    }
    getUserStats(auditLogs) {
        const userStats = {};
        auditLogs.forEach(log => {
            userStats[log.userId] = (userStats[log.userId] || 0) + 1;
        });
        return userStats;
    }
    getTopPolicies(auditLogs) {
        const policyCounts = {};
        auditLogs.forEach(log => {
            log.securityContext.policiesApplied.forEach(policyId => {
                policyCounts[policyId] = (policyCounts[policyId] || 0) + 1;
            });
        });
        return Object.entries(policyCounts)
            .map(([policyId, count]) => ({ policyId, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
    }
    getTopRules(auditLogs) {
        const ruleCounts = {};
        auditLogs.forEach(log => {
            log.securityContext.rulesEvaluated.forEach(ruleId => {
                ruleCounts[ruleId] = (ruleCounts[ruleId] || 0) + 1;
            });
        });
        return Object.entries(ruleCounts)
            .map(([ruleId, count]) => ({ ruleId, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
    }
    async generateRLSPolicy(organizationId, tableName, requirements) {
        const policyName = `${tableName}_${requirements.accessLevel}_access`;
        const description = `Política generada automáticamente para ${tableName} con nivel de acceso ${requirements.accessLevel}`;
        let expression = '';
        const parameters = {};
        switch (requirements.accessLevel) {
            case 'public':
                expression = 'true';
                break;
            case 'organization':
                expression = 'organization_id = $1';
                parameters.organizationId = organizationId;
                break;
            case 'user':
                expression = 'organization_id = $1 AND created_by = $2';
                parameters.organizationId = organizationId;
                parameters.createdBy = 'current_user_id';
                break;
            case 'admin':
                expression = 'organization_id = $1';
                parameters.organizationId = organizationId;
                break;
        }
        if (requirements.additionalConditions) {
            expression += ` AND (${requirements.additionalConditions})`;
        }
        const policyData = {
            organizationId,
            tableName,
            policyName,
            description,
            configuration: {
                operation: requirements.operations.length === 1 ? requirements.operations[0] : 'ALL',
                isActive: true,
                priority: requirements.accessLevel === 'admin' ? 10 : 5,
                bypassRLS: false
            },
            conditions: {
                type: 'simple',
                expression,
                parameters
            },
            accessRules: {
                roles: requirements.roles
            },
            metadata: {
                createdBy: 'system',
                lastModifiedBy: 'system',
                version: 1,
                tags: ['auto-generated', requirements.accessLevel, tableName]
            }
        };
        return await this.createRLSPolicy(policyData);
    }
}
export const rlsGenerativaService = new RLSGenerativaService();
//# sourceMappingURL=rls-generativa.service.js.map