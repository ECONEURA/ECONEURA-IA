/**
 * RLS Tenant Middleware
 * PR-101: Datos & RLS (api) - políticas por tenantId
 * 
 * Middleware para aplicar Row-Level Security con aislamiento por tenantId
 */

import { Request, Response, NextFunction } from 'express';
import { tenantRLSPoliciesService, TenantRLSContext } from '../services/rls-tenant-policies.service.js';
import { structuredLogger } from '../lib/structured-logger.js';

export interface TenantRLSRequest extends Request {
  tenantId?: string;
  organizationId?: string;
  userId?: string;
  role?: string;
  permissions?: string[];
  sessionId?: string;
  rlsContext?: TenantRLSContext;
}

/**
 * Middleware para establecer contexto RLS con tenantId
 */
export function tenantRLSMiddleware(req: TenantRLSRequest, res: Response, next: NextFunction): void {
  try {
    // Extraer información de contexto de los headers o tokens
    const organizationId = req.headers['x-organization-id'] as string || 
                          req.headers['x-org-id'] as string || 
                          'default';
    
    const tenantId = req.headers['x-tenant-id'] as string || 
                     req.headers['x-organization-id'] as string || 
                     organizationId;
    
    const userId = req.headers['x-user-id'] as string || 
                   req.headers['x-subject'] as string;
    
    const role = req.headers['x-user-role'] as string || 
                 req.headers['x-role'] as string || 
                 'user';
    
    const permissions = req.headers['x-permissions'] as string ? 
                       (req.headers['x-permissions'] as string).split(',') : 
                       ['read'];
    
    const sessionId = req.headers['x-session-id'] as string || 
                      req.headers['x-request-id'] as string || 
                      `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const requestId = req.headers['x-request-id'] as string || 
                      `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Crear contexto RLS con tenantId
    const rlsContext: TenantRLSContext = {
      userId: userId || 'anonymous',
      organizationId,
      tenantId,
      role,
      permissions,
      sessionId,
      ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      timestamp: new Date().toISOString(),
      tenantMetadata: {
        tenantType: req.headers['x-tenant-type'] as 'enterprise' | 'small_business' | 'individual' || 'individual',
        subscriptionLevel: req.headers['x-subscription-level'] as 'basic' | 'premium' | 'enterprise' || 'basic',
        dataRetentionDays: parseInt(req.headers['x-data-retention-days'] as string) || 365,
        complianceRequirements: req.headers['x-compliance-requirements'] ? 
          (req.headers['x-compliance-requirements'] as string).split(',') : []
      }
    };

    // Establecer contexto en el sistema RLS
    tenantRLSPoliciesService.createTenantContext(rlsContext);
    
    // Agregar contexto a la request para uso posterior
    req.rlsContext = rlsContext;
    req.organizationId = organizationId;
    req.tenantId = tenantId;
    req.userId = userId;
    req.role = role;
    req.permissions = permissions;
    req.sessionId = sessionId;

    // Agregar headers de respuesta para debugging
    res.set({
      'X-Tenant-ID': tenantId,
      'X-Organization-ID': organizationId,
      'X-User-ID': userId || 'anonymous',
      'X-User-Role': role,
      'X-Request-ID': requestId
    });

    structuredLogger.info('Tenant RLS context established', {
      organizationId,
      tenantId,
      userId,
      role,
      requestId,
      path: req.path,
      method: req.method,
      ipAddress: rlsContext.ipAddress
    });

    next();
  } catch (error) {
    structuredLogger.error('Failed to establish tenant RLS context', {
      error: (error as Error).message,
      path: req.path,
      method: req.method,
    });
    next();
  }
}

/**
 * Middleware para control de acceso con aislamiento de tenant
 */
export function tenantRLSAccessControlMiddleware(resource: string, action: string) {
  return async (req: TenantRLSRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.rlsContext) {
        structuredLogger.warn('No tenant RLS context available for access control', {
          resource,
          action,
          path: req.path,
          method: req.method,
        });

        res.status(403).json({
          error: 'Access denied',
          message: 'No security context available',
          code: 'TENANT_RLS_NO_CONTEXT',
        });
        return;
      }

      // Evaluar acceso usando el sistema RLS de tenant
      const operation = {
        type: action.toUpperCase() as 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE',
        tableName: resource,
        targetTenantId: req.tenantId
      };

      const accessResult = await tenantRLSPoliciesService.evaluateTenantAccess(
        req.rlsContext, 
        operation
      );
      
      if (!accessResult.allowed) {
        structuredLogger.warn('Access denied by tenant RLS', {
          resource,
          action,
          tenantId: req.tenantId,
          organizationId: req.organizationId,
          userId: req.userId,
          role: req.role,
          reason: accessResult.reason,
          path: req.path,
          method: req.method,
        });

        res.status(403).json({
          error: 'Access denied',
          message: accessResult.reason || `Insufficient permissions for ${action} on ${resource}`,
          code: 'TENANT_RLS_ACCESS_DENIED',
          details: {
            tenantId: req.tenantId,
            resource,
            action,
            policiesApplied: accessResult.policiesApplied,
            rulesEvaluated: accessResult.rulesEvaluated,
            tenantIsolationEnforced: accessResult.tenantIsolationEnforced
          }
        });
        return;
      }

      // Log de acceso exitoso
      structuredLogger.info('Tenant RLS access granted', {
        resource,
        action,
        tenantId: req.tenantId,
        organizationId: req.organizationId,
        userId: req.userId,
        role: req.role,
        executionTime: accessResult.executionTime,
        policiesApplied: accessResult.policiesApplied.length,
        rulesEvaluated: accessResult.rulesEvaluated.length
      });

      // Agregar información de acceso a la respuesta
      res.set({
        'X-RLS-Policies-Applied': accessResult.policiesApplied.join(','),
        'X-RLS-Rules-Evaluated': accessResult.rulesEvaluated.join(','),
        'X-RLS-Execution-Time': accessResult.executionTime.toString(),
        'X-RLS-Tenant-Isolation': accessResult.tenantIsolationEnforced.toString()
      });

      next();
    } catch (error) {
      structuredLogger.error('Tenant RLS access control failed', {
        error: (error as Error).message,
        resource,
        action,
        tenantId: req.tenantId,
        path: req.path,
        method: req.method,
      });
      
      res.status(500).json({
        error: 'Internal server error',
        message: 'Tenant access control system error',
        code: 'TENANT_RLS_SYSTEM_ERROR'
      });
    }
  };
}

/**
 * Middleware para sanitización de datos con aislamiento de tenant
 */
export function tenantRLSDataSanitizationMiddleware(table: string) {
  return (req: TenantRLSRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.rlsContext) {
        structuredLogger.warn('No tenant RLS context available for data sanitization', {
          table,
          path: req.path,
          method: req.method,
        });
        next();
        return;
      }

      // Sanitizar datos de entrada
      if (req.body && Object.keys(req.body).length > 0) {
        const sanitizedData = sanitizeTenantData(req.body, req.rlsContext, table);
        req.body = sanitizedData;
        
        structuredLogger.debug('Tenant input data sanitized', {
          table,
          tenantId: req.tenantId,
          organizationId: req.organizationId,
          originalData: req.body,
          sanitizedData,
        });
      }

      // Sanitizar parámetros de consulta
      if (req.query && Object.keys(req.query).length > 0) {
        const sanitizedQuery = sanitizeTenantData(req.query, req.rlsContext, table);
        req.query = sanitizedQuery;
      }

      next();
    } catch (error) {
      structuredLogger.error('Tenant RLS data sanitization failed', {
        error: (error as Error).message,
        table,
        tenantId: req.tenantId,
        path: req.path,
        method: req.method,
      });
      
      res.status(400).json({
        error: 'Bad request',
        message: 'Tenant data sanitization failed',
        code: 'TENANT_RLS_SANITIZATION_ERROR'
      });
    }
  };
}

/**
 * Middleware para validación de respuestas con aislamiento de tenant
 */
export function tenantRLSResponseValidationMiddleware(table: string) {
  return (req: TenantRLSRequest, res: Response, next: NextFunction): void => {
    const originalSend = res.send;

    res.send = function(data: any): Response {
      try {
        if (!req.rlsContext) {
          return originalSend.call(this, data);
        }

        // Validar datos de salida
        if (data && typeof data === 'object') {
          const isValid = validateTenantData(data, req.rlsContext, table);
          
          if (!isValid) {
            structuredLogger.warn('Tenant RLS output validation failed', {
              table,
              tenantId: req.tenantId,
              organizationId: req.organizationId,
              userId: req.userId,
              path: req.path,
              method: req.method,
            });

            // Filtrar los datos no autorizados
            const filteredData = filterUnauthorizedTenantData(data, req.rlsContext);
            return originalSend.call(this, filteredData);
          }
        }

        return originalSend.call(this, data);
      } catch (error) {
        structuredLogger.error('Tenant RLS response validation failed', {
          error: (error as Error).message,
          table,
          tenantId: req.tenantId,
          path: req.path,
          method: req.method,
        });
        
        return originalSend.call(this, data);
      }
    };

    next();
  };
}

/**
 * Middleware para limpieza de contexto RLS de tenant
 */
export function tenantRLSCleanupMiddleware(req: TenantRLSRequest, res: Response, next: NextFunction): void {
  // Limpiar contexto RLS al final de la request
  res.on('finish', () => {
    if (req.rlsContext) {
      structuredLogger.debug('Tenant RLS context cleanup', {
        tenantId: req.tenantId,
        organizationId: req.organizationId,
        userId: req.userId,
        sessionId: req.sessionId,
        path: req.path,
        method: req.method,
        statusCode: res.statusCode,
      });
    }
  });

  next();
}

// =============================================================================
// FUNCIONES AUXILIARES
// =============================================================================

/**
 * Sanitizar datos con información de tenant
 */
function sanitizeTenantData(data: any, context: TenantRLSContext, table: string): any {
  const sanitized = { ...data };

  // Asegurar que los datos pertenecen al tenant correcto
  sanitized.tenantId = context.tenantId;
  sanitized.organizationId = context.organizationId;

  // Sanitizar campos específicos por tabla
  switch (table) {
    case 'users':
      if (context.userId) {
        sanitized.createdBy = context.userId;
        sanitized.updatedBy = context.userId;
      }
      break;
    case 'invoices':
    case 'customers':
    case 'products':
      sanitized.tenantId = context.tenantId;
      sanitized.organizationId = context.organizationId;
      if (context.userId) {
        sanitized.createdBy = context.userId;
        sanitized.updatedBy = context.userId;
      }
      break;
    case 'organizations':
      sanitized.id = context.organizationId;
      break;
    default:
      // Para tablas desconocidas, aplicar filtros básicos de tenant
      sanitized.tenantId = context.tenantId;
      sanitized.organizationId = context.organizationId;
  }

  return sanitized;
}

/**
 * Validar datos con información de tenant
 */
function validateTenantData(data: any, context: TenantRLSContext, table: string): boolean {
  // Verificar que los datos pertenecen al tenant correcto
  if (data.tenantId && data.tenantId !== context.tenantId) {
    structuredLogger.warn('Tenant data validation failed: tenant mismatch', {
      expected: context.tenantId,
      actual: data.tenantId,
      table,
    });
    return false;
  }

  if (data.organizationId && data.organizationId !== context.organizationId) {
    structuredLogger.warn('Tenant data validation failed: organization mismatch', {
      expected: context.organizationId,
      actual: data.organizationId,
      table,
    });
    return false;
  }

  return true;
}

/**
 * Filtrar datos no autorizados por tenant
 */
function filterUnauthorizedTenantData(data: any, context: TenantRLSContext): any {
  if (Array.isArray(data)) {
    return data.filter(item => {
      if (item && typeof item === 'object') {
        return item.tenantId === context.tenantId && 
               item.organizationId === context.organizationId;
      }
      return true;
    });
  }

  if (data && typeof data === 'object') {
    if (data.tenantId && data.tenantId !== context.tenantId) {
      return { 
        error: 'Access denied', 
        message: 'Data not accessible from current tenant',
        code: 'TENANT_ACCESS_DENIED'
      };
    }
    
    if (data.organizationId && data.organizationId !== context.organizationId) {
      return { 
        error: 'Access denied', 
        message: 'Data not accessible from current organization',
        code: 'ORGANIZATION_ACCESS_DENIED'
      };
    }
  }

  return data;
}

/**
 * Middleware para verificar aislamiento de tenant en consultas
 */
export function tenantIsolationMiddleware(req: TenantRLSRequest, res: Response, next: NextFunction): void {
  try {
    if (!req.rlsContext) {
      next();
      return;
    }

    // Verificar que no se esté intentando acceso cross-tenant sin permisos
    const targetTenantId = req.headers['x-target-tenant-id'] as string;
    
    if (targetTenantId && targetTenantId !== req.tenantId) {
      // Verificar si el usuario tiene permisos para acceso cross-tenant
      if (!req.permissions?.includes('cross_tenant_access') && req.role !== 'admin') {
        structuredLogger.warn('Cross-tenant access denied', {
          currentTenant: req.tenantId,
          targetTenant: targetTenantId,
          userId: req.userId,
          role: req.role,
          path: req.path,
          method: req.method,
        });

        res.status(403).json({
          error: 'Access denied',
          message: 'Cross-tenant access not permitted',
          code: 'CROSS_TENANT_ACCESS_DENIED',
          details: {
            currentTenant: req.tenantId,
            targetTenant: targetTenantId
          }
        });
        return;
      }
    }

    next();
  } catch (error) {
    structuredLogger.error('Tenant isolation middleware failed', {
      error: (error as Error).message,
      tenantId: req.tenantId,
      path: req.path,
      method: req.method,
    });
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'Tenant isolation check failed',
      code: 'TENANT_ISOLATION_ERROR'
    });
  }
}
