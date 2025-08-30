import { Request, Response, NextFunction } from 'express';
import { rlsSystem, RLSContext } from '../lib/rls.js';
import { logger } from '../lib/logger.js';

export interface RLSRequest extends Request {
  organizationId?: string;
  userId?: string;
  role?: string;
  permissions?: string[];
  tenantId?: string;
  rlsContext?: RLSContext;
}

export function rlsMiddleware(req: RLSRequest, res: Response, next: NextFunction): void {
  try {
    // Extraer información de contexto de los headers o tokens
    const organizationId = req.headers['x-organization-id'] as string || 
                          req.headers['x-tenant-id'] as string || 
                          'default';
    
    const userId = req.headers['x-user-id'] as string || 
                   req.headers['x-subject'] as string;
    
    const role = req.headers['x-user-role'] as string || 
                 req.headers['x-role'] as string || 
                 'user';
    
    const permissions = req.headers['x-permissions'] as string ? 
                       (req.headers['x-permissions'] as string).split(',') : 
                       undefined;
    
    const tenantId = req.headers['x-tenant-id'] as string || 
                     organizationId;
    
    const requestId = req.headers['x-request-id'] as string || 
                      `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Crear contexto RLS
    const rlsContext: RLSContext = {
      organizationId,
      userId,
      role,
      permissions,
      tenantId,
      requestId,
    };

    // Establecer contexto en el sistema RLS
    rlsSystem.setContext(rlsContext);
    
    // Agregar contexto a la request para uso posterior
    req.rlsContext = rlsContext;
    req.organizationId = organizationId;
    req.userId = userId;
    req.role = role;
    req.permissions = permissions;
    req.tenantId = tenantId;

    logger.debug('RLS context established', {
      organizationId,
      userId,
      role,
      requestId,
      path: req.path,
      method: req.method,
    });

    next();
  } catch (error) {
    logger.error('Failed to establish RLS context', {
      error: (error as Error).message,
      path: req.path,
      method: req.method,
    });
    next();
  }
}

export function rlsAccessControlMiddleware(resource: string, action: string) {
  return (req: RLSRequest, res: Response, next: NextFunction): void => {
    try {
      // Verificar acceso usando el sistema RLS
      const hasAccess = rlsSystem.checkAccess(resource, action);
      
      if (!hasAccess) {
        logger.warn('Access denied by RLS', {
          resource,
          action,
          organizationId: req.organizationId,
          userId: req.userId,
          role: req.role,
          path: req.path,
          method: req.method,
        });

        return res.status(403).json({
          error: 'Access denied',
          message: `Insufficient permissions for ${action} on ${resource}`,
          code: 'RLS_ACCESS_DENIED',
        });
      }

      logger.debug('RLS access granted', {
        resource,
        action,
        organizationId: req.organizationId,
        userId: req.userId,
        role: req.role,
      });

      next();
    } catch (error) {
      logger.error('RLS access control failed', {
        error: (error as Error).message,
        resource,
        action,
        path: req.path,
        method: req.method,
      });
      
      res.status(500).json({
        error: 'Internal server error',
        message: 'Access control system error',
      });
    }
  };
}

export function rlsDataSanitizationMiddleware(table: string) {
  return (req: RLSRequest, res: Response, next: NextFunction): void => {
    try {
      // Sanitizar datos de entrada
      if (req.body && Object.keys(req.body).length > 0) {
        const sanitizedData = rlsSystem.sanitizeInput(req.body, table);
        req.body = sanitizedData;
        
        logger.debug('Input data sanitized', {
          table,
          organizationId: req.organizationId,
          originalData: req.body,
          sanitizedData,
        });
      }

      // Sanitizar parámetros de consulta
      if (req.query && Object.keys(req.query).length > 0) {
        const sanitizedQuery = rlsSystem.sanitizeInput(req.query, table);
        req.query = sanitizedQuery;
      }

      next();
    } catch (error) {
      logger.error('RLS data sanitization failed', {
        error: (error as Error).message,
        table,
        path: req.path,
        method: req.method,
      });
      
      res.status(400).json({
        error: 'Bad request',
        message: 'Data sanitization failed',
      });
    }
  };
}

export function rlsResponseValidationMiddleware(table: string) {
  return (req: RLSRequest, res: Response, next: NextFunction): void => {
    const originalSend = res.send;

    res.send = function(data: any): Response {
      try {
        // Validar datos de salida
        if (data && typeof data === 'object') {
          const isValid = rlsSystem.validateOutput(data, table);
          
          if (!isValid) {
            logger.warn('RLS output validation failed', {
              table,
              organizationId: req.organizationId,
              userId: req.userId,
              path: req.path,
              method: req.method,
            });

            // En lugar de fallar, filtrar los datos no autorizados
            const filteredData = filterUnauthorizedData(data, req.organizationId || 'default');
            return originalSend.call(this, filteredData);
          }
        }

        return originalSend.call(this, data);
      } catch (error) {
        logger.error('RLS response validation failed', {
          error: (error as Error).message,
          table,
          path: req.path,
          method: req.method,
        });
        
        return originalSend.call(this, data);
      }
    };

    next();
  };
}

// Función para filtrar datos no autorizados
function filterUnauthorizedData(data: any, organizationId: string): any {
  if (Array.isArray(data)) {
    return data.filter(item => {
      if (item && typeof item === 'object') {
        return item.organizationId === organizationId;
      }
      return true;
    });
  }

  if (data && typeof data === 'object') {
    if (data.organizationId && data.organizationId !== organizationId) {
      return { error: 'Access denied', message: 'Data not accessible' };
    }
  }

  return data;
}

export function rlsCleanupMiddleware(req: RLSRequest, res: Response, next: NextFunction): void {
  // Limpiar contexto RLS al final de la request
  res.on('finish', () => {
    rlsSystem.clearContext();
    logger.debug('RLS context cleared', {
      organizationId: req.organizationId,
      userId: req.userId,
      path: req.path,
      method: req.method,
      statusCode: res.statusCode,
    });
  });

  next();
}
