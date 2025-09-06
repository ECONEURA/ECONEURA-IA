import { Request, Response, NextFunction } from 'express';
import { finOpsConsolidatedService } from '../lib/finops-consolidated.service.js';
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
    const finOpsHeaders = finOpsConsolidatedService.generateFinOpsHeaders(organizationId, operation);
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
      
      // Validar presupuesto antes de proceder (solo para operaciones costosas)
      if (cost > 0.01) { // Solo validar para operaciones que cuesten más de $0.01
        const budgetValidation = validateBudgetForOperation(organizationId, operation, cost);
        if (!budgetValidation.allowed) {
          // Agregar header de advertencia de presupuesto
          res.setHeader('X-FinOps-Budget-Exceeded', JSON.stringify(budgetValidation.budgetInfo));
          logger.warn('Budget exceeded for operation', {
            organizationId,
            operation,
            cost,
            reason: budgetValidation.reason,
          });
        }
      }
      
      if (cost > 0) {
        finOpsConsolidatedService.trackCost({
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
            timestamp: new Date().toISOString(),
            peakHours: new Date().getHours() >= 9 && new Date().getHours() <= 17,
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

  // Ajustar costo basado en el tiempo de respuesta (si está disponible)
  let timeMultiplier = 1;
  if (responseData && responseData.duration) {
    timeMultiplier = Math.max(1, responseData.duration / 1000); // $0.001 per second
  }

  // Ajustar costo basado en la hora del día (peak hours)
  const hour = new Date().getHours();
  let peakMultiplier = 1;
  if (hour >= 9 && hour <= 17) {
    peakMultiplier = 1.2; // 20% more expensive during business hours
  }

  return baseCost * sizeMultiplier * complexityMultiplier * timeMultiplier * peakMultiplier;
}

// Función para validar si una operación puede proceder basada en presupuestos
function validateBudgetForOperation(organizationId: string, operation: string, estimatedCost: number): { allowed: boolean; reason?: string; budgetInfo?: any } {
  const budgets = finOpsConsolidatedService.getBudgetsByOrganization(organizationId);
  const relevantBudgets = budgets.filter(budget => 
    budget.categories.includes(operation) || budget.categories.includes('all')
  );

  if (relevantBudgets.length === 0) {
    return { allowed: true }; // No budget restrictions
  }

  for (const budget of relevantBudgets) {
    const currentSpend = finOpsConsolidatedService.getCurrentBudgetSpend(budget.id);
    const remainingBudget = budget.amount - currentSpend;
    
    if (estimatedCost > remainingBudget) {
      return {
        allowed: false,
        reason: `Operation would exceed budget '${budget.name}'. Remaining: $${remainingBudget.toFixed(4)}, Required: $${estimatedCost.toFixed(4)}`,
        budgetInfo: {
          budgetId: budget.id,
          budgetName: budget.name,
          remaining: remainingBudget,
          required: estimatedCost
        }
      };
    }
  }

  return { allowed: true };
}

export function finOpsBudgetCheckMiddleware(req: FinOpsRequest, res: Response, next: NextFunction): void {
  const organizationId = req.organizationId || 'default';
  const operation = req.path.split('/').pop() || 'unknown';
  
  try {
    // Verificar si hay alertas de presupuesto activas
    const activeAlerts = finOpsConsolidatedService.getActiveAlerts(organizationId);
    const criticalAlerts = activeAlerts.filter(alert => alert.severity === 'critical' || alert.type === 'exceeded');
    
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
