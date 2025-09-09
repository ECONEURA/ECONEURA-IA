export interface RLSContext {
  organizationId: string;
  userId?: string;
  role?: string;
  permissions?: string[];
  tenantId?: string;
  requestId?: string;
}

export interface RLSRule {
  id: string;
  name: string;
  table: string;
  condition: string;
  organizationId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RLSFilter {
  organizationId: string;
  userId?: string;
  role?: string;
  permissions?: string[];
  tenantId?: string;
}

export class WebRowLevelSecurity {
  private rules: Map<string, RLSRule> = new Map();
  private context: RLSContext | null = null;

  constructor() {
    console.log('Web Row Level Security system initialized');
    this.initializeDefaultRules();
  }

  // Establecer contexto de seguridad para la sesión actual
  setContext(context: RLSContext): void {
    this.context = context;
    console.log('RLS context set', {
      organizationId: context.organizationId,
      userId: context.userId,
      role: context.role,
      requestId: context.requestId,
    });
  }

  // Obtener contexto actual
  getContext(): RLSContext | null {
    return this.context;
  }

  // Limpiar contexto
  clearContext(): void {
    this.context = null;
    console.log('RLS context cleared');
  }

  // Crear regla RLS
  createRule(ruleData: Omit<RLSRule, 'id' | 'createdAt' | 'updatedAt'>): string {
    const id = `rls_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const rule: RLSRule = {
      ...ruleData,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.rules.set(id, rule);
    console.log('RLS rule created', {
      ruleId: id,
      table: ruleData.table,
      organizationId: ruleData.organizationId,
    });

    return id;
  }

  // Actualizar regla RLS
  updateRule(ruleId: string, updates: Partial<RLSRule>): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;

    const updatedRule = {
      ...rule,
      ...updates,
      updatedAt: new Date(),
    };

    this.rules.set(ruleId, updatedRule);
    console.log('RLS rule updated', { ruleId, updates });
    return true;
  }

  // Eliminar regla RLS
  deleteRule(ruleId: string): boolean {
    const deleted = this.rules.delete(ruleId);
    if (deleted) {
      console.log('RLS rule deleted', { ruleId });
    }
    return deleted;
  }

  // Obtener reglas por organización
  getRulesByOrganization(organizationId: string): RLSRule[] {
    return Array.from(this.rules.values()).filter(;
      rule => rule.organizationId === organizationId && rule.isActive
    );
  }

  // Obtener reglas por tabla
  getRulesByTable(table: string): RLSRule[] {
    return Array.from(this.rules.values()).filter(;
      rule => rule.table === table && rule.isActive
    );
  }

  // Aplicar filtros RLS a una consulta
  applyRLSFilters(table: string, baseQuery: any = {}): any {
    if (!this.context) {
      console.warn('No RLS context available, applying default filters');
      return this.applyDefaultFilters(table, baseQuery);
    }

    const rules = this.getRulesByTable(table);
    let filteredQuery = { ...baseQuery };

    // Aplicar reglas específicas de la tabla
    for (const rule of rules) {
      if (this.evaluateRule(rule)) {
        filteredQuery = this.applyRuleCondition(rule, filteredQuery);
      }
    }

    // Aplicar filtros por defecto
    filteredQuery = this.applyDefaultFilters(table, filteredQuery);

    console.log('RLS filters applied', {
      table,
      organizationId: this.context.organizationId,
      userId: this.context.userId,
      originalQuery: baseQuery,
      filteredQuery,
    });

    return filteredQuery;
  }

  // Evaluar si una regla se aplica al contexto actual
  private evaluateRule(rule: RLSRule): boolean {
    if (!this.context) return false;

    // Verificar que la regla pertenece a la organización actual
    if (rule.organizationId !== this.context.organizationId) {
      return false;
    }

    return true;
  }

  // Aplicar condición de regla a la consulta
  private applyRuleCondition(rule: RLSRule, query: any): any {
    const condition = this.parseRuleCondition(rule.condition);

    return {
      ...query,
      ...condition,
    };
  }

  // Parsear condición de regla
  private parseRuleCondition(condition: string): any {
    const conditions: any = {};

    if (condition.includes('organization_id')) {
      conditions.organizationId = this.context?.organizationId;
    }

    if (condition.includes('user_id') && this.context?.userId) {
      conditions.userId = this.context.userId;
    }

    if (condition.includes('tenant_id') && this.context?.tenantId) {
      conditions.tenantId = this.context.tenantId;
    }

    return conditions;
  }

  // Aplicar filtros por defecto
  private applyDefaultFilters(table: string, query: any): any {
    if (!this.context) {
      return query;
    }

    const defaultFilters: any = {
      organizationId: this.context.organizationId,
    };

    switch (table) {
      case 'users':
        if (this.context.userId) {
          defaultFilters.id = this.context.userId;
        }
        break;
      case 'organizations':
        defaultFilters.id = this.context.organizationId;
        break;
      case 'budgets':
      case 'costs':
      case 'alerts':
        defaultFilters.organizationId = this.context.organizationId;
        break;
      default:
        defaultFilters.organizationId = this.context.organizationId;
    }

    return {
      ...query,
      ...defaultFilters,
    };
  }

  // Verificar permisos de acceso
  checkAccess(resource: string, action: string): boolean {
    if (!this.context) {
      console.warn('No RLS context available for access check');
      return false;
    }

    const hasPermission = this.hasPermission(resource, action);

    console.log('Access check', {
      resource,
      action,
      organizationId: this.context.organizationId,
      userId: this.context.userId,
      role: this.context.role,
      hasPermission,
    });

    return hasPermission;
  }

  // Verificar si el usuario tiene un permiso específico
  private hasPermission(resource: string, action: string): boolean {
    if (!this.context) return false;

    const rolePermissions = this.getRolePermissions(this.context.role);
    const requiredPermission = `${resource}:${action}`;

    return rolePermissions.includes(requiredPermission) || ;
           rolePermissions.includes('*:*') ||
           (this.context.permissions ? this.context.permissions.includes(requiredPermission) : false);
  }

  // Obtener permisos por rol
  private getRolePermissions(role?: string): string[] {
    const permissions: Record<string, string[]> = {
      'admin': ['*:*'],
      'manager': [
        'organizations:read',
        'organizations:write',
        'users:read',
        'users:write',
        'budgets:read',
        'budgets:write',
        'costs:read',
        'alerts:read',
        'alerts:write',
      ],
      'user': [
        'organizations:read',
        'users:read',
        'budgets:read',
        'costs:read',
        'alerts:read',
      ],
      'viewer': [
        'organizations:read',
        'budgets:read',
        'costs:read',
      ],
    };

    return permissions[role || 'user'] || permissions['user'];
  }

  // Sanitizar datos de entrada
  sanitizeInput(data: any, table: string): any {
    if (!this.context) {
      console.warn('No RLS context available for input sanitization');
      return data;
    }

    const sanitized = { ...data };
    sanitized.organizationId = this.context.organizationId;

    switch (table) {
      case 'users':
        if (this.context.userId) {
          sanitized.createdBy = this.context.userId;
          sanitized.updatedBy = this.context.userId;
        }
        break;
      case 'budgets':
      case 'costs':
      case 'alerts':
        sanitized.organizationId = this.context.organizationId;
        if (this.context.userId) {
          sanitized.createdBy = this.context.userId;
          sanitized.updatedBy = this.context.userId;
        }
        break;
    }

    console.log('Input sanitized', {
      table,
      organizationId: this.context.organizationId,
      originalData: data,
      sanitizedData: sanitized,
    });

    return sanitized;
  }

  // Validar datos de salida
  validateOutput(data: any, table: string): boolean {
    if (!this.context) {
      console.warn('No RLS context available for output validation');
      return false;
    }

    if (data.organizationId && data.organizationId !== this.context.organizationId) {
      console.warn('Data validation failed: organization mismatch', {
        expected: this.context.organizationId,
        actual: data.organizationId,
        table,
      });
      return false;
    }

    return true;
  }

  // Inicializar reglas por defecto
  private initializeDefaultRules(): void {
    const defaultRules = [
      {
        name: 'Web Organization Isolation',
        table: 'organizations',
        condition: 'organization_id = :org_id',
        organizationId: 'default',
        isActive: true,
      },
      {
        name: 'Web User Organization Access',
        table: 'users',
        condition: 'organization_id = :org_id',
        organizationId: 'default',
        isActive: true,
      },
      {
        name: 'Web Budget Organization Access',
        table: 'budgets',
        condition: 'organization_id = :org_id',
        organizationId: 'default',
        isActive: true,
      },
    ];

    for (const ruleData of defaultRules) {
      this.createRule(ruleData);
    }
  }

  // Métodos de utilidad
  getStats(): any {
    return {
      totalRules: this.rules.size,
      activeRules: Array.from(this.rules.values()).filter(rule => rule.isActive).length,
      contextActive: this.context !== null,
    };
  }
}

export const webRlsSystem = new WebRowLevelSecurity();
