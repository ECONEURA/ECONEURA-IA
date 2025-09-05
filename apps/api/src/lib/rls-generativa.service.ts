import { structuredLogger } from './structured-logger.js';

// RLS Generativa Service - PR-44
// Sistema de Row-Level Security con generación automática de políticas

interface RLSContext {
  userId: string;
  organizationId: string;
  role: string;
  permissions: string[];
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

interface RLSPolicy {
  id: string;
  organizationId: string;
  tableName: string;
  policyName: string;
  description?: string;
  
  // Configuración de la política
  configuration: {
    operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL';
    isActive: boolean;
    priority: number; // 1-10, mayor = más prioridad
    bypassRLS: boolean; // Para superusuarios
  };
  
  // Condiciones de la política
  conditions: {
    type: 'simple' | 'complex' | 'function' | 'template';
    expression: string; // SQL WHERE clause
    parameters?: Record<string, any>;
    dependencies?: string[]; // IDs de otras políticas
  };
  
  // Reglas de acceso
  accessRules: {
    roles: string[]; // Roles que pueden usar esta política
    users?: string[]; // Usuarios específicos
    groups?: string[]; // Grupos de usuarios
    timeRestrictions?: {
      startTime?: string; // HH:MM
      endTime?: string; // HH:MM
      daysOfWeek?: number[]; // 0-6 (domingo-sábado)
      timezone?: string;
    };
    ipRestrictions?: {
      allowedIPs?: string[];
      blockedIPs?: string[];
      allowedRanges?: string[]; // CIDR notation
    };
  };
  
  // Metadatos
  metadata: {
    createdBy: string;
    lastModifiedBy: string;
    version: number;
    tags?: string[];
    documentation?: string;
  };
  
  createdAt: string;
  updatedAt: string;
}

interface RLSRule {
  id: string;
  organizationId: string;
  ruleName: string;
  description?: string;
  
  // Configuración de la regla
  configuration: {
    isActive: boolean;
    priority: number;
    evaluationOrder: number;
    stopOnMatch: boolean; // Si debe parar al encontrar coincidencia
  };
  
  // Condiciones de activación
  conditions: {
    context: {
      userId?: string;
      organizationId?: string;
      role?: string;
      permissions?: string[];
      sessionAttributes?: Record<string, any>;
    };
    data: {
      tableName?: string;
      columnName?: string;
      operation?: string;
      value?: any;
    };
    time: {
      startDate?: string;
      endDate?: string;
      timeOfDay?: {
        start: string;
        end: string;
      };
    };
  };
  
  // Acciones de la regla
  actions: {
    type: 'allow' | 'deny' | 'modify' | 'log' | 'redirect';
    parameters: Record<string, any>;
    message?: string;
  };
  
  // Metadatos
  metadata: {
    createdBy: string;
    lastModifiedBy: string;
    version: number;
    tags?: string[];
  };
  
  createdAt: string;
  updatedAt: string;
}

interface RLSValidation {
  id: string;
  organizationId: string;
  validationName: string;
  description?: string;
  
  // Configuración de validación
  configuration: {
    isActive: boolean;
    severity: 'low' | 'medium' | 'high' | 'critical';
    autoFix: boolean;
    notificationEnabled: boolean;
  };
  
  // Reglas de validación
  validationRules: {
    type: 'data_integrity' | 'access_control' | 'performance' | 'compliance';
    expression: string; // SQL o expresión lógica
    expectedResult: any;
    errorMessage: string;
  }[];
  
  // Metadatos
  metadata: {
    createdBy: string;
    lastModifiedBy: string;
    version: number;
  };
  
  createdAt: string;
  updatedAt: string;
}

interface RLSAuditLog {
  id: string;
  organizationId: string;
  userId: string;
  sessionId: string;
  
  // Información de la operación
  operation: {
    type: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
    tableName: string;
    recordId?: string;
    columns?: string[];
  };
  
  // Contexto de seguridad
  securityContext: {
    ipAddress: string;
    userAgent: string;
    role: string;
    permissions: string[];
    policiesApplied: string[];
    rulesEvaluated: string[];
  };
  
  // Resultado
  result: {
    allowed: boolean;
    reason?: string;
    dataReturned?: number; // Número de registros
    executionTime: number; // ms
    policiesMatched: number;
    rulesMatched: number;
  };
  
  // Metadatos
  timestamp: string;
  requestId?: string;
}

interface RLSReport {
  id: string;
  organizationId: string;
  reportType: 'security' | 'performance' | 'compliance' | 'usage';
  period: {
    startDate: string;
    endDate: string;
  };
  
  // Datos del reporte
  data: {
    summary: Record<string, any>;
    details: Record<string, any>[];
    charts?: Record<string, any>;
    recommendations?: string[];
  };
  
  // Metadatos
  generatedAt: string;
  generatedBy: string;
  status: 'generating' | 'completed' | 'failed';
}

class RLSGenerativaService {
  private rlsContexts: Map<string, RLSContext> = new Map();
  private rlsPolicies: Map<string, RLSPolicy> = new Map();
  private rlsRules: Map<string, RLSRule> = new Map();
  private rlsValidations: Map<string, RLSValidation> = new Map();
  private rlsAuditLogs: Map<string, RLSAuditLog> = new Map();
  private rlsReports: Map<string, RLSReport> = new Map();

  constructor() {
    this.init();
  }

  init() {
    this.createDemoData();
    structuredLogger.info('RLS Generativa Service initialized');
  }

  private createDemoData() {
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Contextos RLS demo
    const context1: RLSContext = {
      userId: 'user_1',
      organizationId: 'demo-org-1',
      role: 'admin',
      permissions: ['read', 'write', 'delete', 'admin'],
      sessionId: 'session_1',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      timestamp: now.toISOString()
    };

    const context2: RLSContext = {
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

    // Políticas RLS demo
    const policy1: RLSPolicy = {
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
          daysOfWeek: [1, 2, 3, 4, 5], // Lunes a viernes
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

    const policy2: RLSPolicy = {
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

    // Reglas RLS demo
    const rule1: RLSRule = {
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

    const rule2: RLSRule = {
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

    // Validaciones RLS demo
    const validation1: RLSValidation = {
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

    // Logs de auditoría demo
    const auditLog1: RLSAuditLog = {
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
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 horas atrás
      requestId: 'req_1'
    };

    const auditLog2: RLSAuditLog = {
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
      timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(), // 1 hora atrás
      requestId: 'req_2'
    };

    this.rlsAuditLogs.set(auditLog1.id, auditLog1);
    this.rlsAuditLogs.set(auditLog2.id, auditLog2);
  }

  // Gestión de contextos RLS
  async createRLSContext(contextData: Omit<RLSContext, 'timestamp'>): Promise<RLSContext> {
    const now = new Date().toISOString();
    const context: RLSContext = {
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

  async getRLSContext(sessionId: string): Promise<RLSContext | undefined> {
    return this.rlsContexts.get(sessionId);
  }

  // Gestión de políticas RLS
  async getRLSPolicies(organizationId: string, filters: {
    tableName?: string;
    operation?: string;
    isActive?: boolean;
    limit?: number;
  } = {}): Promise<RLSPolicy[]> {
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

  async createRLSPolicy(policyData: Omit<RLSPolicy, 'id' | 'createdAt' | 'updatedAt'>): Promise<RLSPolicy> {
    const now = new Date().toISOString();
    const policy: RLSPolicy = {
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

  // Gestión de reglas RLS
  async getRLSRules(organizationId: string, filters: {
    isActive?: boolean;
    role?: string;
    limit?: number;
  } = {}): Promise<RLSRule[]> {
    let rules = Array.from(this.rlsRules.values())
      .filter(r => r.organizationId === organizationId);

    if (filters.isActive !== undefined) {
      rules = rules.filter(r => r.configuration.isActive === filters.isActive);
    }

    if (filters.role) {
      rules = rules.filter(r => 
        r.conditions.context.role === filters.role ||
        r.conditions.context.role === undefined
      );
    }

    if (filters.limit) {
      rules = rules.slice(0, filters.limit);
    }

    return rules.sort((a, b) => b.configuration.priority - a.configuration.priority);
  }

  async createRLSRule(ruleData: Omit<RLSRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<RLSRule> {
    const now = new Date().toISOString();
    const rule: RLSRule = {
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

  // Evaluación de acceso
  async evaluateAccess(context: RLSContext, operation: {
    type: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
    tableName: string;
    recordId?: string;
    columns?: string[];
  }): Promise<{
    allowed: boolean;
    reason?: string;
    policiesApplied: string[];
    rulesEvaluated: string[];
    executionTime: number;
  }> {
    const startTime = Date.now();
    const policiesApplied: string[] = [];
    const rulesEvaluated: string[] = [];

    // Obtener políticas aplicables
    const applicablePolicies = await this.getRLSPolicies(context.organizationId, {
      tableName: operation.tableName,
      operation: operation.type,
      isActive: true
    });

    // Obtener reglas aplicables
    const applicableRules = await this.getRLSRules(context.organizationId, {
      isActive: true,
      role: context.role
    });

    // Evaluar reglas primero
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
        } else if (rule.actions.type === 'deny') {
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

    // Evaluar políticas
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

  private evaluateRule(rule: RLSRule, context: RLSContext, operation: any): boolean {
    // Evaluar condiciones de contexto
    if (rule.conditions.context.role && rule.conditions.context.role !== context.role) {
      return false;
    }

    if (rule.conditions.context.permissions) {
      const hasRequiredPermissions = rule.conditions.context.permissions.every(
        perm => context.permissions.includes(perm)
      );
      if (!hasRequiredPermissions) {
        return false;
      }
    }

    // Evaluar condiciones de datos
    if (rule.conditions.data.operation && rule.conditions.data.operation !== operation.type) {
      return false;
    }

    if (rule.conditions.data.tableName && rule.conditions.data.tableName !== operation.tableName) {
      return false;
    }

    return true;
  }

  private evaluatePolicy(policy: RLSPolicy, context: RLSContext, operation: any): boolean {
    // Verificar si el usuario tiene el rol requerido
    if (policy.accessRules.roles && !policy.accessRules.roles.includes(context.role)) {
      return false;
    }

    // Verificar restricciones de tiempo
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

    // Verificar restricciones de IP
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

  // Logging de auditoría
  async logRLSAccess(auditData: Omit<RLSAuditLog, 'id' | 'timestamp'>): Promise<RLSAuditLog> {
    const now = new Date().toISOString();
    const auditLog: RLSAuditLog = {
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

  // Estadísticas RLS
  async getRLSStats(organizationId: string) {
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
      
      // Estadísticas de acceso
      accessStats: {
        totalAccessAttempts: auditLogs.length,
        allowedAccess: auditLogs.filter(a => a.result.allowed).length,
        deniedAccess: auditLogs.filter(a => !a.result.allowed).length,
        averageExecutionTime: auditLogs.length > 0 ? 
          auditLogs.reduce((sum, a) => sum + a.result.executionTime, 0) / auditLogs.length : 0
      },
      
      // Estadísticas por período
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
      
      // Estadísticas por operación
      byOperation: {
        SELECT: auditLogs.filter(a => a.operation.type === 'SELECT').length,
        INSERT: auditLogs.filter(a => a.operation.type === 'INSERT').length,
        UPDATE: auditLogs.filter(a => a.operation.type === 'UPDATE').length,
        DELETE: auditLogs.filter(a => a.operation.type === 'DELETE').length
      },
      
      // Estadísticas por tabla
      byTable: this.getTableStats(auditLogs),
      
      // Estadísticas por usuario
      byUser: this.getUserStats(auditLogs),
      
      // Políticas más utilizadas
      topPolicies: this.getTopPolicies(auditLogs),
      
      // Reglas más utilizadas
      topRules: this.getTopRules(auditLogs)
    };
  }

  private getTableStats(auditLogs: RLSAuditLog[]): Record<string, number> {
    const tableStats: Record<string, number> = {};
    auditLogs.forEach(log => {
      tableStats[log.operation.tableName] = (tableStats[log.operation.tableName] || 0) + 1;
    });
    return tableStats;
  }

  private getUserStats(auditLogs: RLSAuditLog[]): Record<string, number> {
    const userStats: Record<string, number> = {};
    auditLogs.forEach(log => {
      userStats[log.userId] = (userStats[log.userId] || 0) + 1;
    });
    return userStats;
  }

  private getTopPolicies(auditLogs: RLSAuditLog[]): Array<{ policyId: string; count: number }> {
    const policyCounts: Record<string, number> = {};
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

  private getTopRules(auditLogs: RLSAuditLog[]): Array<{ ruleId: string; count: number }> {
    const ruleCounts: Record<string, number> = {};
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

  // Generación automática de políticas
  async generateRLSPolicy(organizationId: string, tableName: string, requirements: {
    accessLevel: 'public' | 'organization' | 'user' | 'admin';
    operations: ('SELECT' | 'INSERT' | 'UPDATE' | 'DELETE')[];
    roles: string[];
    additionalConditions?: string;
  }): Promise<RLSPolicy> {
    const policyName = `${tableName}_${requirements.accessLevel}_access`;
    const description = `Política generada automáticamente para ${tableName} con nivel de acceso ${requirements.accessLevel}`;
    
    let expression = '';
    let parameters: Record<string, any> = {};

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

    const policyData: Omit<RLSPolicy, 'id' | 'createdAt' | 'updatedAt'> = {
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
