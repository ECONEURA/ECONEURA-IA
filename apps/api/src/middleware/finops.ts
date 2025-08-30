import { Request, Response, NextFunction } from 'express';
import { finOpsSystem } from '../lib/finops.js';
import { logger } from '../lib/logger.js';

export interface FinOpsRequest extends Request {
  organizationId?: string;
  finOpsHeaders?: Record<string, string>;
}

export function finOpsMiddleware(req: FinOpsRequest, res: Response, next: NextFunction): void {
  const organizationId = req.organizationId || 'default';
  const operation = req.path.split('/').pop() || 'unknown';
  
  try {
    // Generar headers FinOps
    const finOpsHeaders = finOpsSystem.generateFinOpsHeaders(organizationId, operation);
    req.finOpsHeaders = finOpsHeaders;
    
    // Agregar headers a la respuesta
    Object.entries(finOpsHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    // Log de headers FinOps
    logger.debug('FinOps headers generated', {
      organizationId,
      operation,
      headers: finOpsHeaders,
    });

    next();
  } catch (error) {
    logger.error('Failed to generate FinOps headers', {
      organizationId,
      operation,
      error: (error as Error).message,
    });
    next();
  }
}

export function finOpsCostTrackingMiddleware(req: FinOpsRequest, res: Response, next: NextFunction): void {
  const originalSend = res.send;
  const organizationId = req.organizationId || 'default';
  const operation = req.path.split('/').pop() || 'unknown';
  const service = req.path.split('/')[1] || 'api';

  // Interceptar la respuesta para trackear costos
  res.send = function(data: any): Response {
    try {
      // Determinar el costo basado en la operación y respuesta
      const cost = calculateOperationCost(operation, service, data);
      
      if (cost > 0) {
        finOpsSystem.trackCost({
          service,
          operation,
          resource: req.path,
          amount: cost,
          currency: 'USD',
          organizationId,
          userId: req.headers['x-user-id'] as string,
          requestId: req.headers['x-request-id'] as string,
          metadata: {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            responseSize: typeof data === 'string' ? data.length : JSON.stringify(data).length,
            userAgent: req.headers['user-agent'],
            ip: req.ip,
          },
        });
      }
    } catch (error) {
      logger.error('Failed to track cost', {
        organizationId,
        operation,
        error: (error as Error).message,
      });
    }

    return originalSend.call(this, data);
  };

  next();
}

function calculateOperationCost(operation: string, service: string, responseData: any): number {
  // Lógica para calcular costos basada en la operación
  const baseCosts: Record<string, number> = {
    // AI Operations
    'ai': 0.01, // $0.01 per AI request
    'chat': 0.02, // $0.02 per chat request
    'image': 0.05, // $0.05 per image generation
    'tts': 0.01, // $0.01 per TTS request
    
    // Search Operations
    'search': 0.005, // $0.005 per search request
    
    // API Operations
    'health': 0, // Free
    'metrics': 0, // Free
    'stats': 0, // Free
    
    // Default
    'unknown': 0.001, // $0.001 per unknown operation
  };

  let baseCost = baseCosts[operation] || baseCosts['unknown'];

  // Ajustar costo basado en el tamaño de la respuesta
  const responseSize = typeof responseData === 'string' ? responseData.length : JSON.stringify(responseData).length;
  const sizeMultiplier = Math.max(1, responseSize / 1000); // $0.001 per KB

  // Ajustar costo basado en la complejidad de la operación
  let complexityMultiplier = 1;
  if (operation === 'ai' || operation === 'chat') {
    complexityMultiplier = 1.5; // AI operations are more expensive
  } else if (operation === 'search') {
    complexityMultiplier = 0.8; // Search operations are cheaper
  }

  return baseCost * sizeMultiplier * complexityMultiplier;
}

export function finOpsBudgetCheckMiddleware(req: FinOpsRequest, res: Response, next: NextFunction): void {
  const organizationId = req.organizationId || 'default';
  const operation = req.path.split('/').pop() || 'unknown';
  
  try {
    // Verificar si hay alertas de presupuesto activas
    const activeAlerts = finOpsSystem.getActiveAlerts(organizationId);
    const criticalAlerts = activeAlerts.filter(alert => alert.type === 'critical' || alert.type === 'exceeded');
    
    if (criticalAlerts.length > 0) {
      // Si hay alertas críticas, agregar header de advertencia
      res.setHeader('X-FinOps-Budget-Warning', JSON.stringify({
        alerts: criticalAlerts.map(alert => ({
          budgetId: alert.budgetId,
          type: alert.type,
          percentage: alert.percentage,
          message: alert.message,
        })),
      }));
      
      logger.warn('Budget warning for operation', {
        organizationId,
        operation,
        criticalAlerts: criticalAlerts.length,
      });
    }
  } catch (error) {
    logger.error('Failed to check budget', {
      organizationId,
      operation,
      error: (error as Error).message,
    });
  }

  next();
}
