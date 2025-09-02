import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';

// Middleware mínimo de FinOps: añade headers requeridos por V3 en todas las rutas /v1
export function finopsHeaders(estCostEUR = 0, budgetPct = 0) {
  return (req: Request, res: Response, next: NextFunction) => {
    const cid = (req.headers['x-correlation-id'] as string) || crypto.randomUUID();
    res.setHeader('X-Correlation-Id', cid);
    res.setHeader('X-Est-Cost-EUR', estCostEUR.toFixed(4));
    res.setHeader('X-Budget-Pct', String(Math.round(budgetPct)));
    res.setHeader('X-Route', req.originalUrl);
    next();
  };
}
