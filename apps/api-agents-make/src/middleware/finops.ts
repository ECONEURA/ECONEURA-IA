/**
 * FinOps middleware for Agents API
 */

import { Request, Response, NextFunction } from 'express';

interface FinOpsHeaders {
  'X-Est-Cost-EUR'?: string;
  'X-Budget-Pct'?: string;
  'X-Latency-ms'?: string;
  'X-Route'?: string;
  'X-Correlation-Id'?: string;
}

export interface FinOpsRequest extends Request {
  startTime?: number;
  correlationId?: string;
  estimatedCost?: number;
  budgetPct?: number;
}

/**
 * Initialize FinOps tracking
 */
export const initFinOps = (req: FinOpsRequest, res: Response, next: NextFunction) => {
  req.startTime = Date.now();
  req.correlationId = req.header('x-correlation-id') || `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  req.estimatedCost = 0;
  req.budgetPct = 0;
  
  next();
};

/**
 * Finalize FinOps headers
 */
export const finalizeFinOps = (req: FinOpsRequest, res: Response, next: NextFunction) => {
  const latency = req.startTime ? Date.now() - req.startTime : 0;
  
  const headers: FinOpsHeaders = {
    'X-Est-Cost-EUR': (req.estimatedCost || 0).toFixed(4),
    'X-Budget-Pct': (req.budgetPct || 0).toFixed(2),
    'X-Latency-ms': latency.toString(),
    'X-Route': req.path,
    'X-Correlation-Id': req.correlationId || 'unknown'
  };
  
  // Set headers
  Object.entries(headers).forEach(([key, value]) => {
    if (value) res.setHeader(key, value);
  });
  
  next();
};

/**
 * Calculate cost for Make.com webhook
 */
export const calculateMakeCost = (operations: number = 1): number => {
  // Make.com pricing (estimated)
  const COST_PER_OPERATION = 0.001; // $0.001 per operation
  
  return operations * COST_PER_OPERATION;
};

/**
 * Budget guard middleware
 */
export const budgetGuard = (req: FinOpsRequest, res: Response, next: NextFunction) => {
  const budgetPct = req.budgetPct || 0;
  
  if (budgetPct >= 90) {
    return res.status(402).json({
      error: 'Budget limit exceeded',
      budgetPct,
      message: 'Agent execution blocked due to budget constraints'
    });
  }
  
  next();
};

