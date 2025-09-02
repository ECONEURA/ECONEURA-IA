import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { estimateCostEUR } from '../finops/estimator';

// Middleware mínimo de FinOps: añade headers requeridos por V3 en todas las rutas /v1
export function finopsHeaders(defaultEstCost?: number, defaultBudgetPct?: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const cid = (req.headers['x-correlation-id'] as string) || crypto.randomUUID();
    res.setHeader('X-Correlation-Id', cid);
    const agent_key = (req.params?.agent_key as string) || 'unknown';
    const est = typeof defaultEstCost === 'number' ? defaultEstCost : estimateCostEUR({ agent_key });
    res.setHeader('X-Est-Cost-EUR', est.toFixed(4));
    const budgetPct = typeof defaultBudgetPct === 'number' ? defaultBudgetPct : 0;
    res.setHeader('X-Budget-Pct', String(budgetPct));
    res.setHeader('X-Route', req.originalUrl);
    const start = Date.now();
    res.on('finish', () => {
      try { res.setHeader('X-Latency-ms', String(Date.now() - start)); } catch {}
    });
    next();
  };
}
