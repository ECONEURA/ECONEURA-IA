/**
 * RLS Tenant Policies Service
 * PR-101: Datos & RLS (api) - políticas por tenantId
 * 
 * Servicio para gestionar políticas de Row-Level Security específicas por tenantId
 * con soporte para multi-tenancy, aislamiento de datos y políticas granulares
 */

import { structuredLogger } from '../lib/structured-logger.js';

// Interfaces para políticas RLS por tenant
export interface TenantRLSPolicy {
  id: string;
  tenantId: string;
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
    enforceTenantIsolation: boolean; // Aislamiento estricto por tenant
  };
  
  // Condiciones de la política
  conditions: {
    type: 'tenant_isolation' | 'role_based' | 'user_based' | 'custom' | 'hybrid';
    expression: string; // SQL WHERE clause
    parameters?: Record<string, any>;
    tenantConditions?: {
      strictIsolation: boolean; // Solo datos del tenant
      crossTenantAccess: boolean; // Acceso a otros tenants
      sharedDataAccess: boolean; // Acceso a datos compartidos
    };
  };
  
  // Reglas de acceso por tenant
  accessRules: {
    roles: string[]; // Roles que pueden usar esta política
    users?: string[]; // Usuarios específicos
    groups?: string[]; // Grupos de usuarios
    tenantRestrictions?: {
      allowedTenants?: string[]; // Tenants permitidos
      blockedTenants?: string[]; // Tenants bloqueados
      crossTenantOperations?: string[]; // Operaciones cross-tenant permitidas
    };
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
    compliance?: {
      gdpr: boolean;
      sox: boolean;
      hipaa: boolean;
      pci: boolean;
    };
  };
  
  createdAt: string;
  updatedAt: string;
}

export interface TenantRLSRule {
  id: string;
  tenantId: string;
  organizationId: string;
  ruleName: string;
  description?: string;
  
  // Configuración de la regla
  configuration: {
    isActive: boolean;
    priority: number;
    evaluationOrder: number;
    stopOnMatch: boolean; // Si debe parar al encontrar coincidencia
    tenantScope: 'single' | 'multi' | 'global'; // Alcance de la regla
  };
  
  // Condiciones de activación
  conditions: {
    context: {
      userId?: string;
      organizationId?: string;
      tenantId?: string;
      role?: string;
      permissions?: string[];
      sessionAttributes?: Record<string, any>;
    };
    data: {
      tableName?: string;
      columnName?: string;
      operation?: string;
      value?: any;
      tenantId?: string;
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
    type: 'allow' | 'deny' | 'modify' | 'log' | 'redirect' | 'tenant_isolate';
    parameters: Record<string, any>;
    message?: string;
    tenantIsolation?: {
      enforce: boolean;
      allowedTenants?: string[];
      blockedTenants?: string[];
    };
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

export interface TenantRLSContext {
  userId: string;
  organizationId: string;
  tenantId: string;
  role: string;
  permissions: string[];
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  tenantMetadata?: {
    tenantType: 'enterprise' | 'small_business' | 'individual';
    subscriptionLevel: 'basic' | 'premium' | 'enterprise';
    dataRetentionDays: number;
    complianceRequirements: string[];
  };
}

export interface TenantRLSAuditLog {
  id: string;
  organizationId: string;
  tenantId: string;
  userId: string;
  sessionId: string;
  
  // Información de la operación
  operation: {
    type: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
    tableName: string;
    recordId?: string;
    columns?: string[];
    tenantId?: string;
  };
  
  // Contexto de seguridad
  securityContext: {
    ipAddress: string;
    userAgent: string;
    role: string;
    permissions: string[];
    policiesApplied: string[];
    rulesEvaluated: string[];
    tenantIsolation: boolean;
  };
  
  // Resultado
  result: {
    allowed: boolean;
    reason?: string;
    dataReturned?: number; // Número de registros
    executionTime: number; // ms
    policiesMatched: number;
    rulesMatched: number;
    tenantIsolationEnforced: boolean;
  };
  
  // Metadatos
  timestamp: string;
  requestId?: string;
}

export interface TenantRLSStats {
  totalPolicies: number;
  activePolicies: number;
  totalRules: number;
  activeRules: number;
  tenantIsolationPolicies: number;
  crossTenantPolicies: number;
  accessStats: {
    totalAccessAttempts: number;
    allowedAccess: number;
    deniedAccess: number;
    tenantIsolationViolations: number;
    averageExecutionTime: number;
  };
  byTenant: Record<string, {
    policies: number;
    rules: number;
    accessAttempts: number;
    violations: number;
  }>;
  byOperation: Record<string, number>;
  byTable: Record<string, number>;
  complianceStats: {
    gdprCompliant: number;
    soxCompliant: number;
    hipaaCompliant: number;
    pciCompliant: number;
  };
}

class TenantRLSPoliciesService {
  private tenantPolicies: Map<string, TenantRLSPolicy> = new Map();
  private tenantRules: Map<string, TenantRLSRule> = new Map();
  private tenantContexts: Map<string, TenantRLSContext> = new Map();
  private tenantAuditLogs: Map<string, TenantRLSAuditLog> = new Map();

  constructor() {
    this.init();
  }

  init() {
    this.createDefaultTenantPolicies();
    structuredLogger.info('Tenant RLS Policies Service initialized');
  }

  private createDefaultTenantPolicies() {
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Política de aislamiento estricto por tenant
    const strictTenantPolicy: TenantRLSPolicy = {
      id: 'tenant_policy_1',
      tenantId: 'default',
      organizationId: 'demo-org-1',
      tableName: 'invoices',
      policyName: 'strict_tenant_isolation',
      description: 'Aislamiento estricto de datos por tenant - solo acceso a datos del tenant actual',
      configuration: {
        operation: 'ALL',
        isActive: true,
        priority: 10,
        bypassRLS: false,
        enforceTenantIsolation: true
      },
      conditions: {
        type: 'tenant_isolation',
        expression: 'tenant_id = $1',
        parameters: { tenantId: 'current_tenant' },
        tenantConditions: {
          strictIsolation: true,
          crossTenantAccess: false,
          sharedDataAccess: false
        }
      },
      accessRules: {
        roles: ['admin', 'user', 'viewer'],
        tenantRestrictions: {
          allowedTenants: ['current_tenant'],
          blockedTenants: [],
          crossTenantOperations: []
        }
      },
      metadata: {
        createdBy: 'system',
        lastModifiedBy: 'system',
        version: 1,
        tags: ['tenant-isolation', 'strict', 'invoices'],
        documentation: 'Política de aislamiento estricto por tenant',
        compliance: {
          gdpr: true,
          sox: true,
          hipaa: false,
          pci: true
        }
      },
      createdAt: oneMonthAgo.toISOString(),
      updatedAt: oneMonthAgo.toISOString()
    };

    // Política de acceso basado en roles con tenant
    const roleBasedTenantPolicy: TenantRLSPolicy = {
      id: 'tenant_policy_2',
      tenantId: 'default',
      organizationId: 'demo-org-1',
      tableName: 'customers',
      policyName: 'role_based_tenant_access',
      description: 'Acceso a clientes basado en roles dentro del tenant',
      configuration: {
        operation: 'SELECT',
        isActive: true,
        priority: 8,
        bypassRLS: false,
        enforceTenantIsolation: true
      },
      conditions: {
        type: 'role_based',
        expression: 'tenant_id = $1 AND (created_by = $2 OR role = $3)',
        parameters: { 
          tenantId: 'current_tenant',
          createdBy: 'current_user_id',
          role: 'admin'
        },
        tenantConditions: {
          strictIsolation: true,
          crossTenantAccess: false,
          sharedDataAccess: false
        }
      },
      accessRules: {
        roles: ['admin', 'user'],
        tenantRestrictions: {
          allowedTenants: ['current_tenant'],
          crossTenantOperations: []
        }
      },
      metadata: {
        createdBy: 'system',
        lastModifiedBy: 'system',
        version: 1,
        tags: ['role-based', 'tenant-isolation', 'customers'],
        compliance: {
          gdpr: true,
          sox: false,
          hipaa: false,
          pci: false
        }
      },
      createdAt: oneMonthAgo.toISOString(),
      updatedAt: oneMonthAgo.toISOString()
    };

    // Política de acceso cross-tenant para administradores
    const crossTenantPolicy: TenantRLSPolicy = {
      id: 'tenant_policy_3',
      tenantId: 'default',
      organizationId: 'demo-org-1',
      tableName: 'organizations',
      policyName: 'cross_tenant_admin_access',
      description: 'Acceso cross-tenant para administradores de organización',
      configuration: {
        operation: 'SELECT',
        isActive: true,
        priority: 5,
        bypassRLS: false,
        enforceTenantIsolation: false
      },
      conditions: {
        type: 'role_based',
        expression: 'organization_id = $1 AND role = $2',
        parameters: { 
          organizationId: 'current_organization',
          role: 'admin'
        },
        tenantConditions: {
          strictIsolation: false,
          crossTenantAccess: true,
          sharedDataAccess: true
        }
      },
      accessRules: {
        roles: ['admin'],
        tenantRestrictions: {
          crossTenantOperations: ['SELECT', 'READ']
        }
      },
      metadata: {
        createdBy: 'system',
        lastModifiedBy: 'system',
        version: 1,
        tags: ['cross-tenant', 'admin', 'organizations'],
        compliance: {
          gdpr: true,
          sox: true,
          hipaa: false,
          pci: false
        }
      },
      createdAt: oneMonthAgo.toISOString(),
      updatedAt: oneMonthAgo.toISOString()
    };

    this.tenantPolicies.set(strictTenantPolicy.id, strictTenantPolicy);
    this.tenantPolicies.set(roleBasedTenantPolicy.id, roleBasedTenantPolicy);
    this.tenantPolicies.set(crossTenantPolicy.id, crossTenantPolicy);

    // Regla de aislamiento de tenant
    const tenantIsolationRule: TenantRLSRule = {
      id: 'tenant_rule_1',
      tenantId: 'default',
      organizationId: 'demo-org-1',
      ruleName: 'tenant_isolation_enforcement',
      description: 'Aplicar aislamiento estricto por tenant',
      configuration: {
        isActive: true,
        priority: 10,
        evaluationOrder: 1,
        stopOnMatch: true,
        tenantScope: 'single'
      },
      conditions: {
        context: {
          tenantId: 'current_tenant'
        },
        data: {
          operation: 'ALL'
        }
      },
      actions: {
        type: 'tenant_isolate',
        parameters: {
          enforceIsolation: true,
          allowedTenants: ['current_tenant']
        },
        message: 'Aislamiento de tenant aplicado',
        tenantIsolation: {
          enforce: true,
          allowedTenants: ['current_tenant']
        }
      },
      metadata: {
        createdBy: 'system',
        lastModifiedBy: 'system',
        version: 1,
        tags: ['tenant-isolation', 'enforcement']
      },
      createdAt: oneMonthAgo.toISOString(),
      updatedAt: oneMonthAgo.toISOString()
    };

    this.tenantRules.set(tenantIsolationRule.id, tenantIsolationRule);
  }

  // Gestión de contextos de tenant
  async createTenantContext(contextData: Omit<TenantRLSContext, 'timestamp'>): Promise<TenantRLSContext> {
    const now = new Date().toISOString();
    const context: TenantRLSContext = {
      ...contextData,
      timestamp: now
    };

    this.tenantContexts.set(context.sessionId, context);
    
    structuredLogger.info('Tenant RLS context created', { 
      sessionId: context.sessionId, 
      userId: context.userId,
      organizationId: context.organizationId,
      tenantId: context.tenantId,
      role: context.role
    });

    return context;
  }

  async getTenantContext(sessionId: string): Promise<TenantRLSContext | undefined> {
    return this.tenantContexts.get(sessionId);
  }

  // Gestión de políticas por tenant
  async getTenantPolicies(tenantId: string, filters: {
    tableName?: string;
    operation?: string;
    isActive?: boolean;
    enforceTenantIsolation?: boolean;
    limit?: number;
  } = {}): Promise<TenantRLSPolicy[]> {
    let policies = Array.from(this.tenantPolicies.values())
      .filter(p => p.tenantId === tenantId);

    if (filters.tableName) {
      policies = policies.filter(p => p.tableName === filters.tableName);
    }

    if (filters.operation) {
      policies = policies.filter(p => p.configuration.operation === filters.operation || p.configuration.operation === 'ALL');
    }

    if (filters.isActive !== undefined) {
      policies = policies.filter(p => p.configuration.isActive === filters.isActive);
    }

    if (filters.enforceTenantIsolation !== undefined) {
      policies = policies.filter(p => p.configuration.enforceTenantIsolation === filters.enforceTenantIsolation);
    }

    if (filters.limit) {
      policies = policies.slice(0, filters.limit);
    }

    return policies.sort((a, b) => b.configuration.priority - a.configuration.priority);
  }

  async createTenantPolicy(policyData: Omit<TenantRLSPolicy, 'id' | 'createdAt' | 'updatedAt'>): Promise<TenantRLSPolicy> {
    const now = new Date().toISOString();
    const policy: TenantRLSPolicy = {
      id: `tenant_policy_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      ...policyData,
      createdAt: now,
      updatedAt: now
    };

    this.tenantPolicies.set(policy.id, policy);
    
    structuredLogger.info('Tenant RLS policy created', { 
      policyId: policy.id, 
      tenantId: policy.tenantId,
      organizationId: policy.organizationId,
      tableName: policy.tableName,
      policyName: policy.policyName
    });

    return policy;
  }

  // Gestión de reglas por tenant
  async getTenantRules(tenantId: string, filters: {
    isActive?: boolean;
    role?: string;
    tenantScope?: 'single' | 'multi' | 'global';
    limit?: number;
  } = {}): Promise<TenantRLSRule[]> {
    let rules = Array.from(this.tenantRules.values())
      .filter(r => r.tenantId === tenantId);

    if (filters.isActive !== undefined) {
      rules = rules.filter(r => r.configuration.isActive === filters.isActive);
    }

    if (filters.role) {
      rules = rules.filter(r => 
        r.conditions.context.role === filters.role ||
        r.conditions.context.role === undefined
      );
    }

    if (filters.tenantScope) {
      rules = rules.filter(r => r.configuration.tenantScope === filters.tenantScope);
    }

    if (filters.limit) {
      rules = rules.slice(0, filters.limit);
    }

    return rules.sort((a, b) => b.configuration.priority - a.configuration.priority);
  }

  async createTenantRule(ruleData: Omit<TenantRLSRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<TenantRLSRule> {
    const now = new Date().toISOString();
    const rule: TenantRLSRule = {
      id: `tenant_rule_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      ...ruleData,
      createdAt: now,
      updatedAt: now
    };

    this.tenantRules.set(rule.id, rule);
    
    structuredLogger.info('Tenant RLS rule created', { 
      ruleId: rule.id, 
      tenantId: rule.tenantId,
      organizationId: rule.organizationId,
      ruleName: rule.ruleName
    });

    return rule;
  }

  // Evaluación de acceso con aislamiento de tenant
  async evaluateTenantAccess(context: TenantRLSContext, operation: {
    type: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
    tableName: string;
    recordId?: string;
    columns?: string[];
    targetTenantId?: string;
  }): Promise<{
    allowed: boolean;
    reason?: string;
    policiesApplied: string[];
    rulesEvaluated: string[];
    executionTime: number;
    tenantIsolationEnforced: boolean;
  }> {
    const startTime = Date.now();
    const policiesApplied: string[] = [];
    const rulesEvaluated: string[] = [];
    let tenantIsolationEnforced = false;

    // Verificar aislamiento de tenant
    if (operation.targetTenantId && operation.targetTenantId !== context.tenantId) {
      // Intentando acceso cross-tenant
      const crossTenantAllowed = await this.checkCrossTenantAccess(context, operation);
      if (!crossTenantAllowed) {
        const executionTime = Date.now() - startTime;
        return {
          allowed: false,
          reason: 'Acceso cross-tenant no permitido',
          policiesApplied,
          rulesEvaluated,
          executionTime,
          tenantIsolationEnforced: true
        };
      }
    }

    // Obtener políticas aplicables
    const applicablePolicies = await this.getTenantPolicies(context.tenantId, {
      tableName: operation.tableName,
      operation: operation.type,
      isActive: true
    });

    // Obtener reglas aplicables
    const applicableRules = await this.getTenantRules(context.tenantId, {
      isActive: true,
      role: context.role
    });

    // Evaluar reglas primero
    for (const rule of applicableRules) {
      rulesEvaluated.push(rule.id);
      
      if (this.evaluateTenantRule(rule, context, operation)) {
        if (rule.actions.type === 'allow') {
          const executionTime = Date.now() - startTime;
          return {
            allowed: true,
            reason: rule.actions.message,
            policiesApplied,
            rulesEvaluated,
            executionTime,
            tenantIsolationEnforced
          };
        } else if (rule.actions.type === 'deny') {
          const executionTime = Date.now() - startTime;
          return {
            allowed: false,
            reason: rule.actions.message || 'Acceso denegado por regla de tenant',
            policiesApplied,
            rulesEvaluated,
            executionTime,
            tenantIsolationEnforced
          };
        } else if (rule.actions.type === 'tenant_isolate') {
          tenantIsolationEnforced = true;
        }
      }

      if (rule.configuration.stopOnMatch) {
        break;
      }
    }

    // Evaluar políticas
    for (const policy of applicablePolicies) {
      policiesApplied.push(policy.id);
      
      if (this.evaluateTenantPolicy(policy, context, operation)) {
        const executionTime = Date.now() - startTime;
        return {
          allowed: true,
          reason: `Acceso permitido por política de tenant ${policy.policyName}`,
          policiesApplied,
          rulesEvaluated,
          executionTime,
          tenantIsolationEnforced: policy.configuration.enforceTenantIsolation
        };
      }
    }

    const executionTime = Date.now() - startTime;
    return {
      allowed: false,
      reason: 'No se encontraron políticas o reglas de tenant que permitan el acceso',
      policiesApplied,
      rulesEvaluated,
      executionTime,
      tenantIsolationEnforced
    };
  }

  private async checkCrossTenantAccess(context: TenantRLSContext, operation: any): Promise<boolean> {
    // Verificar si el usuario tiene permisos para acceso cross-tenant
    if (context.role === 'admin' && context.permissions.includes('cross_tenant_access')) {
      return true;
    }

    // Verificar políticas específicas de cross-tenant
    const crossTenantPolicies = await this.getTenantPolicies(context.tenantId, {
      enforceTenantIsolation: false,
      isActive: true
    });

    for (const policy of crossTenantPolicies) {
      if (policy.accessRules.tenantRestrictions?.crossTenantOperations?.includes(operation.type)) {
        return true;
      }
    }

    return false;
  }

  private evaluateTenantRule(rule: TenantRLSRule, context: TenantRLSContext, operation: any): boolean {
    // Evaluar condiciones de contexto
    if (rule.conditions.context.tenantId && rule.conditions.context.tenantId !== context.tenantId) {
      return false;
    }

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

    if (rule.conditions.data.tenantId && rule.conditions.data.tenantId !== context.tenantId) {
      return false;
    }

    return true;
  }

  private evaluateTenantPolicy(policy: TenantRLSPolicy, context: TenantRLSContext, operation: any): boolean {
    // Verificar si el usuario tiene el rol requerido
    if (policy.accessRules.roles && !policy.accessRules.roles.includes(context.role)) {
      return false;
    }

    // Verificar restricciones de tenant
    if (policy.accessRules.tenantRestrictions) {
      if (policy.accessRules.tenantRestrictions.blockedTenants?.includes(context.tenantId)) {
        return false;
      }

      if (policy.accessRules.tenantRestrictions.allowedTenants && 
          !policy.accessRules.tenantRestrictions.allowedTenants.includes(context.tenantId)) {
        return false;
      }
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

  // Logging de auditoría con información de tenant
  async logTenantAccess(auditData: Omit<TenantRLSAuditLog, 'id' | 'timestamp'>): Promise<TenantRLSAuditLog> {
    const now = new Date().toISOString();
    const auditLog: TenantRLSAuditLog = {
      id: `tenant_audit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      ...auditData,
      timestamp: now
    };

    this.tenantAuditLogs.set(auditLog.id, auditLog);
    
    structuredLogger.info('Tenant RLS access logged', { 
      auditId: auditLog.id, 
      userId: auditLog.userId,
      tenantId: auditLog.tenantId,
      operation: auditLog.operation.type,
      tableName: auditLog.operation.tableName,
      allowed: auditLog.result.allowed,
      tenantIsolationEnforced: auditLog.result.tenantIsolationEnforced
    });

    return auditLog;
  }

  // Estadísticas por tenant
  async getTenantStats(tenantId: string): Promise<TenantRLSStats> {
    const policies = Array.from(this.tenantPolicies.values()).filter(p => p.tenantId === tenantId);
    const rules = Array.from(this.tenantRules.values()).filter(r => r.tenantId === tenantId);
    const auditLogs = Array.from(this.tenantAuditLogs.values()).filter(a => a.tenantId === tenantId);

    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    return {
      totalPolicies: policies.length,
      activePolicies: policies.filter(p => p.configuration.isActive).length,
      totalRules: rules.length,
      activeRules: rules.filter(r => r.configuration.isActive).length,
      tenantIsolationPolicies: policies.filter(p => p.configuration.enforceTenantIsolation).length,
      crossTenantPolicies: policies.filter(p => !p.configuration.enforceTenantIsolation).length,
      accessStats: {
        totalAccessAttempts: auditLogs.length,
        allowedAccess: auditLogs.filter(a => a.result.allowed).length,
        deniedAccess: auditLogs.filter(a => !a.result.allowed).length,
        tenantIsolationViolations: auditLogs.filter(a => a.result.tenantIsolationEnforced && !a.result.allowed).length,
        averageExecutionTime: auditLogs.length > 0 ? 
          auditLogs.reduce((sum, a) => sum + a.result.executionTime, 0) / auditLogs.length : 0
      },
      byTenant: this.getTenantBreakdown(auditLogs),
      byOperation: this.getOperationStats(auditLogs),
      byTable: this.getTableStats(auditLogs),
      complianceStats: this.getComplianceStats(policies)
    };
  }

  private getTenantBreakdown(auditLogs: TenantRLSAuditLog[]): Record<string, any> {
    const breakdown: Record<string, any> = {};
    auditLogs.forEach(log => {
      if (!breakdown[log.tenantId]) {
        breakdown[log.tenantId] = {
          policies: 0,
          rules: 0,
          accessAttempts: 0,
          violations: 0
        };
      }
      breakdown[log.tenantId].accessAttempts++;
      if (log.result.tenantIsolationEnforced && !log.result.allowed) {
        breakdown[log.tenantId].violations++;
      }
    });
    return breakdown;
  }

  private getOperationStats(auditLogs: TenantRLSAuditLog[]): Record<string, number> {
    const stats: Record<string, number> = {};
    auditLogs.forEach(log => {
      stats[log.operation.type] = (stats[log.operation.type] || 0) + 1;
    });
    return stats;
  }

  private getTableStats(auditLogs: TenantRLSAuditLog[]): Record<string, number> {
    const stats: Record<string, number> = {};
    auditLogs.forEach(log => {
      stats[log.operation.tableName] = (stats[log.operation.tableName] || 0) + 1;
    });
    return stats;
  }

  private getComplianceStats(policies: TenantRLSPolicy[]): Record<string, number> {
    return {
      gdprCompliant: policies.filter(p => p.metadata.compliance?.gdpr).length,
      soxCompliant: policies.filter(p => p.metadata.compliance?.sox).length,
      hipaaCompliant: policies.filter(p => p.metadata.compliance?.hipaa).length,
      pciCompliant: policies.filter(p => p.metadata.compliance?.pci).length
    };
  }

  // Generación automática de políticas por tenant
  async generateTenantPolicy(tenantId: string, tableName: string, requirements: {
    accessLevel: 'tenant_strict' | 'tenant_shared' | 'cross_tenant' | 'admin_only';
    operations: ('SELECT' | 'INSERT' | 'UPDATE' | 'DELETE')[];
    roles: string[];
    enforceIsolation: boolean;
    additionalConditions?: string;
  }): Promise<TenantRLSPolicy> {
    const policyName = `${tableName}_${requirements.accessLevel}_tenant_access`;
    const description = `Política generada automáticamente para ${tableName} con nivel de acceso ${requirements.accessLevel} en tenant ${tenantId}`;
    
    let expression = '';
    const parameters: Record<string, any> = {};

    switch (requirements.accessLevel) {
      case 'tenant_strict':
        expression = 'tenant_id = $1';
        parameters.tenantId = tenantId;
        break;
      case 'tenant_shared':
        expression = 'tenant_id = $1 OR tenant_id IS NULL';
        parameters.tenantId = tenantId;
        break;
      case 'cross_tenant':
        expression = 'organization_id = $1';
        parameters.organizationId = 'current_organization';
        break;
      case 'admin_only':
        expression = 'tenant_id = $1 AND role = $2';
        parameters.tenantId = tenantId;
        parameters.role = 'admin';
        break;
    }

    if (requirements.additionalConditions) {
      expression += ` AND (${requirements.additionalConditions})`;
    }

    const policyData: Omit<TenantRLSPolicy, 'id' | 'createdAt' | 'updatedAt'> = {
      tenantId,
      organizationId: 'current_organization',
      tableName,
      policyName,
      description,
      configuration: {
        operation: requirements.operations.length === 1 ? requirements.operations[0] : 'ALL',
        isActive: true,
        priority: requirements.accessLevel === 'admin_only' ? 10 : 5,
        bypassRLS: false,
        enforceTenantIsolation: requirements.enforceIsolation
      },
      conditions: {
        type: requirements.enforceIsolation ? 'tenant_isolation' : 'role_based',
        expression,
        parameters,
        tenantConditions: {
          strictIsolation: requirements.enforceIsolation,
          crossTenantAccess: requirements.accessLevel === 'cross_tenant',
          sharedDataAccess: requirements.accessLevel === 'tenant_shared'
        }
      },
      accessRules: {
        roles: requirements.roles,
        tenantRestrictions: {
          allowedTenants: requirements.enforceIsolation ? [tenantId] : undefined,
          crossTenantOperations: requirements.accessLevel === 'cross_tenant' ? requirements.operations : []
        }
      },
      metadata: {
        createdBy: 'system',
        lastModifiedBy: 'system',
        version: 1,
        tags: ['auto-generated', requirements.accessLevel, tableName, tenantId],
        compliance: {
          gdpr: true,
          sox: requirements.accessLevel === 'admin_only',
          hipaa: false,
          pci: requirements.enforceIsolation
        }
      }
    };

    return await this.createTenantPolicy(policyData);
  }
}

export const tenantRLSPoliciesService = new TenantRLSPoliciesService();
