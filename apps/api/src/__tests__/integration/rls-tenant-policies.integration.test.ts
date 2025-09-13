/**
 * RLS Tenant Policies Integration Tests
 * PR-101: Datos & RLS (api) - políticas por tenantId
 * 
 * Tests de integración para políticas de Row-Level Security específicas por tenantId
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { Express } from 'express';
import { tenantRLSPoliciesService } from '../../services/rls-tenant-policies.service.js';

// Mock the service
vi.mock('../../services/rls-tenant-policies.service.js');

// Mock Express app
const mockApp = {
  use: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
  listen: vi.fn()
} as unknown as Express;

describe('RLS Tenant Policies Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('GET /v1/rls-tenant-policies/policies/:tenantId', () => {
    it('should retrieve tenant policies successfully', async () => {
      const mockPolicies = [
        {
          id: 'policy_1',
          tenantId: 'tenant_1',
          organizationId: 'org_1',
          tableName: 'invoices',
          policyName: 'strict_tenant_isolation',
          description: 'Aislamiento estricto de datos por tenant',
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
            compliance: {
              gdpr: true,
              sox: true,
              hipaa: false,
              pci: true
            }
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      vi.mocked(tenantRLSPoliciesService.getTenantPolicies).mockResolvedValue(mockPolicies);

      const result = await tenantRLSPoliciesService.getTenantPolicies('tenant_1', {
        tableName: 'invoices',
        isActive: true
      });

      expect(result).toEqual(mockPolicies);
      expect(tenantRLSPoliciesService.getTenantPolicies).toHaveBeenCalledWith('tenant_1', {
        tableName: 'invoices',
        isActive: true
      });
    });

    it('should handle empty results', async () => {
      vi.mocked(tenantRLSPoliciesService.getTenantPolicies).mockResolvedValue([]);

      const result = await tenantRLSPoliciesService.getTenantPolicies('nonexistent_tenant');

      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });
  });

  describe('POST /v1/rls-tenant-policies/policies', () => {
    it('should create tenant policy successfully', async () => {
      const mockPolicy = {
        id: 'policy_2',
        tenantId: 'tenant_2',
        organizationId: 'org_1',
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
          createdBy: 'user_1',
          lastModifiedBy: 'user_1',
          version: 1,
          tags: ['role-based', 'tenant-isolation', 'customers'],
          compliance: {
            gdpr: true,
            sox: false,
            hipaa: false,
            pci: false
          }
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      vi.mocked(tenantRLSPoliciesService.createTenantPolicy).mockResolvedValue(mockPolicy);

      const policyData = {
        tenantId: 'tenant_2',
        organizationId: 'org_1',
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
          createdBy: 'user_1',
          lastModifiedBy: 'user_1',
          version: 1,
          tags: ['role-based', 'tenant-isolation', 'customers'],
          compliance: {
            gdpr: true,
            sox: false,
            hipaa: false,
            pci: false
          }
        }
      };

      const result = await tenantRLSPoliciesService.createTenantPolicy(policyData);

      expect(result).toEqual(mockPolicy);
      expect(tenantRLSPoliciesService.createTenantPolicy).toHaveBeenCalledWith(policyData);
    });

    it('should handle validation errors', async () => {
      const invalidPolicyData = {
        // Missing required fields
        tableName: 'customers',
        policyName: 'invalid_policy'
      };

      vi.mocked(tenantRLSPoliciesService.createTenantPolicy).mockRejectedValue(
        new Error('Missing required fields: tenantId')
      );

      try {
        await tenantRLSPoliciesService.createTenantPolicy(invalidPolicyData as any);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Missing required fields: tenantId');
      }
    });
  });

  describe('POST /v1/rls-tenant-policies/evaluate-access', () => {
    it('should evaluate tenant access successfully', async () => {
      const mockAccessResult = {
        allowed: true,
        reason: 'Acceso permitido por política de tenant',
        policiesApplied: ['policy_1'],
        rulesEvaluated: ['rule_1'],
        executionTime: 45,
        tenantIsolationEnforced: true
      };

      vi.mocked(tenantRLSPoliciesService.evaluateTenantAccess).mockResolvedValue(mockAccessResult);

      const context = {
        userId: 'user_1',
        organizationId: 'org_1',
        tenantId: 'tenant_1',
        role: 'user',
        permissions: ['read', 'write'],
        sessionId: 'session_1',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date().toISOString()
      };

      const operation = {
        type: 'SELECT' as const,
        tableName: 'invoices',
        targetTenantId: 'tenant_1'
      };

      const result = await tenantRLSPoliciesService.evaluateTenantAccess(context, operation);

      expect(result).toEqual(mockAccessResult);
      expect(tenantRLSPoliciesService.evaluateTenantAccess).toHaveBeenCalledWith(context, operation);
    });

    it('should deny cross-tenant access', async () => {
      const mockAccessResult = {
        allowed: false,
        reason: 'Acceso cross-tenant no permitido',
        policiesApplied: [],
        rulesEvaluated: [],
        executionTime: 25,
        tenantIsolationEnforced: true
      };

      vi.mocked(tenantRLSPoliciesService.evaluateTenantAccess).mockResolvedValue(mockAccessResult);

      const context = {
        userId: 'user_1',
        organizationId: 'org_1',
        tenantId: 'tenant_1',
        role: 'user',
        permissions: ['read'],
        sessionId: 'session_1',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date().toISOString()
      };

      const operation = {
        type: 'SELECT' as const,
        tableName: 'invoices',
        targetTenantId: 'tenant_2' // Different tenant
      };

      const result = await tenantRLSPoliciesService.evaluateTenantAccess(context, operation);

      expect(result).toEqual(mockAccessResult);
      expect(result.allowed).toBe(false);
      expect(result.tenantIsolationEnforced).toBe(true);
    });
  });

  describe('GET /v1/rls-tenant-policies/stats/:tenantId', () => {
    it('should retrieve tenant statistics', async () => {
      const mockStats = {
        totalPolicies: 5,
        activePolicies: 4,
        totalRules: 3,
        activeRules: 3,
        tenantIsolationPolicies: 3,
        crossTenantPolicies: 2,
        accessStats: {
          totalAccessAttempts: 150,
          allowedAccess: 140,
          deniedAccess: 10,
          tenantIsolationViolations: 5,
          averageExecutionTime: 35.5
        },
        byTenant: {
          'tenant_1': {
            policies: 3,
            rules: 2,
            accessAttempts: 100,
            violations: 2
          },
          'tenant_2': {
            policies: 2,
            rules: 1,
            accessAttempts: 50,
            violations: 3
          }
        },
        byOperation: {
          'SELECT': 120,
          'INSERT': 20,
          'UPDATE': 8,
          'DELETE': 2
        },
        byTable: {
          'invoices': 80,
          'customers': 50,
          'products': 20
        },
        complianceStats: {
          gdprCompliant: 4,
          soxCompliant: 2,
          hipaaCompliant: 1,
          pciCompliant: 3
        }
      };

      vi.mocked(tenantRLSPoliciesService.getTenantStats).mockResolvedValue(mockStats);

      const result = await tenantRLSPoliciesService.getTenantStats('tenant_1');

      expect(result).toEqual(mockStats);
      expect(tenantRLSPoliciesService.getTenantStats).toHaveBeenCalledWith('tenant_1');
      expect(result.totalPolicies).toBe(5);
      expect(result.accessStats.tenantIsolationViolations).toBe(5);
    });
  });

  describe('POST /v1/rls-tenant-policies/generate-policy', () => {
    it('should generate tenant policy automatically', async () => {
      const mockGeneratedPolicy = {
        id: 'generated_policy_1',
        tenantId: 'tenant_1',
        organizationId: 'org_1',
        tableName: 'orders',
        policyName: 'orders_tenant_strict_tenant_access',
        description: 'Política generada automáticamente para orders con nivel de acceso tenant_strict en tenant tenant_1',
        configuration: {
          operation: 'ALL',
          isActive: true,
          priority: 5,
          bypassRLS: false,
          enforceTenantIsolation: true
        },
        conditions: {
          type: 'tenant_isolation',
          expression: 'tenant_id = $1',
          parameters: { tenantId: 'tenant_1' },
          tenantConditions: {
            strictIsolation: true,
            crossTenantAccess: false,
            sharedDataAccess: false
          }
        },
        accessRules: {
          roles: ['admin', 'user'],
          tenantRestrictions: {
            allowedTenants: ['tenant_1'],
            crossTenantOperations: []
          }
        },
        metadata: {
          createdBy: 'system',
          lastModifiedBy: 'system',
          version: 1,
          tags: ['auto-generated', 'tenant_strict', 'orders', 'tenant_1'],
          compliance: {
            gdpr: true,
            sox: false,
            hipaa: false,
            pci: true
          }
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      vi.mocked(tenantRLSPoliciesService.generateTenantPolicy).mockResolvedValue(mockGeneratedPolicy);

      const requirements = {
        accessLevel: 'tenant_strict' as const,
        operations: ['SELECT', 'INSERT', 'UPDATE'] as const,
        roles: ['admin', 'user'],
        enforceIsolation: true
      };

      const result = await tenantRLSPoliciesService.generateTenantPolicy(
        'tenant_1',
        'orders',
        requirements
      );

      expect(result).toEqual(mockGeneratedPolicy);
      expect(tenantRLSPoliciesService.generateTenantPolicy).toHaveBeenCalledWith(
        'tenant_1',
        'orders',
        requirements
      );
    });

    it('should generate cross-tenant policy for admins', async () => {
      const mockCrossTenantPolicy = {
        id: 'generated_policy_2',
        tenantId: 'tenant_1',
        organizationId: 'org_1',
        tableName: 'organizations',
        policyName: 'organizations_cross_tenant_tenant_access',
        description: 'Política generada automáticamente para organizations con nivel de acceso cross_tenant en tenant tenant_1',
        configuration: {
          operation: 'SELECT',
          isActive: true,
          priority: 5,
          bypassRLS: false,
          enforceTenantIsolation: false
        },
        conditions: {
          type: 'role_based',
          expression: 'organization_id = $1',
          parameters: { organizationId: 'current_organization' },
          tenantConditions: {
            strictIsolation: false,
            crossTenantAccess: true,
            sharedDataAccess: true
          }
        },
        accessRules: {
          roles: ['admin'],
          tenantRestrictions: {
            crossTenantOperations: ['SELECT']
          }
        },
        metadata: {
          createdBy: 'system',
          lastModifiedBy: 'system',
          version: 1,
          tags: ['auto-generated', 'cross_tenant', 'organizations', 'tenant_1'],
          compliance: {
            gdpr: true,
            sox: true,
            hipaa: false,
            pci: false
          }
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      vi.mocked(tenantRLSPoliciesService.generateTenantPolicy).mockResolvedValue(mockCrossTenantPolicy);

      const requirements = {
        accessLevel: 'cross_tenant' as const,
        operations: ['SELECT'] as const,
        roles: ['admin'],
        enforceIsolation: false
      };

      const result = await tenantRLSPoliciesService.generateTenantPolicy(
        'tenant_1',
        'organizations',
        requirements
      );

      expect(result).toEqual(mockCrossTenantPolicy);
      expect(result.configuration.enforceTenantIsolation).toBe(false);
      expect(result.conditions.tenantConditions.crossTenantAccess).toBe(true);
    });
  });

  describe('Tenant Context Management', () => {
    it('should create tenant context successfully', async () => {
      const mockContext = {
        userId: 'user_1',
        organizationId: 'org_1',
        tenantId: 'tenant_1',
        role: 'admin',
        permissions: ['read', 'write', 'delete', 'admin'],
        sessionId: 'session_1',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        timestamp: new Date().toISOString(),
        tenantMetadata: {
          tenantType: 'enterprise' as const,
          subscriptionLevel: 'premium' as const,
          dataRetentionDays: 2555,
          complianceRequirements: ['gdpr', 'sox']
        }
      };

      vi.mocked(tenantRLSPoliciesService.createTenantContext).mockResolvedValue(mockContext);

      const contextData = {
        userId: 'user_1',
        organizationId: 'org_1',
        tenantId: 'tenant_1',
        role: 'admin',
        permissions: ['read', 'write', 'delete', 'admin'],
        sessionId: 'session_1',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        tenantMetadata: {
          tenantType: 'enterprise' as const,
          subscriptionLevel: 'premium' as const,
          dataRetentionDays: 2555,
          complianceRequirements: ['gdpr', 'sox']
        }
      };

      const result = await tenantRLSPoliciesService.createTenantContext(contextData);

      expect(result).toEqual(mockContext);
      expect(tenantRLSPoliciesService.createTenantContext).toHaveBeenCalledWith(contextData);
    });

    it('should retrieve tenant context', async () => {
      const mockContext = {
        userId: 'user_1',
        organizationId: 'org_1',
        tenantId: 'tenant_1',
        role: 'user',
        permissions: ['read', 'write'],
        sessionId: 'session_1',
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        timestamp: new Date().toISOString()
      };

      vi.mocked(tenantRLSPoliciesService.getTenantContext).mockResolvedValue(mockContext);

      const result = await tenantRLSPoliciesService.getTenantContext('session_1');

      expect(result).toEqual(mockContext);
      expect(tenantRLSPoliciesService.getTenantContext).toHaveBeenCalledWith('session_1');
    });
  });

  describe('Tenant Rules Management', () => {
    it('should retrieve tenant rules', async () => {
      const mockRules = [
        {
          id: 'rule_1',
          tenantId: 'tenant_1',
          organizationId: 'org_1',
          ruleName: 'tenant_isolation_enforcement',
          description: 'Aplicar aislamiento estricto por tenant',
          configuration: {
            isActive: true,
            priority: 10,
            evaluationOrder: 1,
            stopOnMatch: true,
            tenantScope: 'single' as const
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
            type: 'tenant_isolate' as const,
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
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      vi.mocked(tenantRLSPoliciesService.getTenantRules).mockResolvedValue(mockRules);

      const result = await tenantRLSPoliciesService.getTenantRules('tenant_1', {
        isActive: true,
        tenantScope: 'single'
      });

      expect(result).toEqual(mockRules);
      expect(tenantRLSPoliciesService.getTenantRules).toHaveBeenCalledWith('tenant_1', {
        isActive: true,
        tenantScope: 'single'
      });
    });

    it('should create tenant rule', async () => {
      const mockRule = {
        id: 'rule_2',
        tenantId: 'tenant_1',
        organizationId: 'org_1',
        ruleName: 'admin_cross_tenant_access',
        description: 'Permitir acceso cross-tenant para administradores',
        configuration: {
          isActive: true,
          priority: 8,
          evaluationOrder: 2,
          stopOnMatch: false,
          tenantScope: 'multi' as const
        },
        conditions: {
          context: {
            role: 'admin',
            permissions: ['cross_tenant_access']
          },
          data: {
            operation: 'SELECT'
          }
        },
        actions: {
          type: 'allow' as const,
          parameters: {},
          message: 'Acceso cross-tenant permitido para administrador'
        },
        metadata: {
          createdBy: 'admin@tenant.com',
          lastModifiedBy: 'admin@tenant.com',
          version: 1,
          tags: ['admin', 'cross-tenant', 'access']
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      vi.mocked(tenantRLSPoliciesService.createTenantRule).mockResolvedValue(mockRule);

      const ruleData = {
        tenantId: 'tenant_1',
        organizationId: 'org_1',
        ruleName: 'admin_cross_tenant_access',
        description: 'Permitir acceso cross-tenant para administradores',
        configuration: {
          isActive: true,
          priority: 8,
          evaluationOrder: 2,
          stopOnMatch: false,
          tenantScope: 'multi' as const
        },
        conditions: {
          context: {
            role: 'admin',
            permissions: ['cross_tenant_access']
          },
          data: {
            operation: 'SELECT'
          }
        },
        actions: {
          type: 'allow' as const,
          parameters: {},
          message: 'Acceso cross-tenant permitido para administrador'
        },
        metadata: {
          createdBy: 'admin@tenant.com',
          lastModifiedBy: 'admin@tenant.com',
          version: 1,
          tags: ['admin', 'cross-tenant', 'access']
        }
      };

      const result = await tenantRLSPoliciesService.createTenantRule(ruleData);

      expect(result).toEqual(mockRule);
      expect(tenantRLSPoliciesService.createTenantRule).toHaveBeenCalledWith(ruleData);
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      vi.mocked(tenantRLSPoliciesService.getTenantPolicies).mockRejectedValue(
        new Error('Service unavailable')
      );

      try {
        await tenantRLSPoliciesService.getTenantPolicies('tenant_1');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Service unavailable');
      }
    });

    it('should handle missing tenant contexts', async () => {
      vi.mocked(tenantRLSPoliciesService.getTenantContext).mockResolvedValue(undefined);

      const result = await tenantRLSPoliciesService.getTenantContext('nonexistent_session');

      expect(result).toBeUndefined();
    });
  });

  describe('Compliance and Audit', () => {
    it('should log tenant access for audit', async () => {
      const mockAuditLog = {
        id: 'audit_1',
        organizationId: 'org_1',
        tenantId: 'tenant_1',
        userId: 'user_1',
        sessionId: 'session_1',
        operation: {
          type: 'SELECT' as const,
          tableName: 'invoices',
          columns: ['id', 'amount', 'status'],
          tenantId: 'tenant_1'
        },
        securityContext: {
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          role: 'user',
          permissions: ['read'],
          policiesApplied: ['policy_1'],
          rulesEvaluated: ['rule_1'],
          tenantIsolation: true
        },
        result: {
          allowed: true,
          dataReturned: 15,
          executionTime: 45,
          policiesMatched: 1,
          rulesMatched: 1,
          tenantIsolationEnforced: true
        },
        timestamp: new Date().toISOString(),
        requestId: 'req_1'
      };

      vi.mocked(tenantRLSPoliciesService.logTenantAccess).mockResolvedValue(mockAuditLog);

      const auditData = {
        organizationId: 'org_1',
        tenantId: 'tenant_1',
        userId: 'user_1',
        sessionId: 'session_1',
        operation: {
          type: 'SELECT' as const,
          tableName: 'invoices',
          columns: ['id', 'amount', 'status'],
          tenantId: 'tenant_1'
        },
        securityContext: {
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          role: 'user',
          permissions: ['read'],
          policiesApplied: ['policy_1'],
          rulesEvaluated: ['rule_1'],
          tenantIsolation: true
        },
        result: {
          allowed: true,
          dataReturned: 15,
          executionTime: 45,
          policiesMatched: 1,
          rulesMatched: 1,
          tenantIsolationEnforced: true
        },
        requestId: 'req_1'
      };

      const result = await tenantRLSPoliciesService.logTenantAccess(auditData);

      expect(result).toEqual(mockAuditLog);
      expect(tenantRLSPoliciesService.logTenantAccess).toHaveBeenCalledWith(auditData);
    });
  });
});
