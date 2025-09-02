import fs from 'node:fs';
import path from 'node:path';
import type { Request, Response, NextFunction } from 'express';

type Deps = {
  getDeptSpendEUR: (dept: string) => number;
};

function readJSON<T>(p: string, fallback: T): T {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')) as T; } catch { return fallback; }
}

const defaultCfgPath = path.join(process.cwd(), 'apps/api/src/config/finops.departments.json');
const defaultKillPath = path.join(process.cwd(), 'apps/api/src/config/finops.kill.json');

export function finopsGuard(deps: Deps) {
  return (req: Request, res: Response, next: NextFunction) => {
  const url = (req as any).originalUrl || req.url || '';
  // No aplicar guard a endpoints de administración para evitar bloqueos al desactivar
  if (url.startsWith('/v1/admin/finops')) return next();
    const orgId = (req.headers['x-org-id'] as string) || (req.body as any)?.org_id || 'unknown';
  let agent = (req.headers['x-agent-key'] as string) || (req.params as any)?.agent_key || (req.body as any)?.agent_key || 'unknown';
    if (!agent || agent === 'unknown') {
      // Extraer del path si viene como /v1/agents/:agent_key/*
      const p = (req as any).originalUrl || req.url || '';
      const m = p.match(/\/v1\/agents\/([^/]+)/);
      if (m && m[1]) agent = m[1];
    }
    const dept = (agent.split('_')[0] || 'unknown').toLowerCase();

  const killFile = process.env.FINOPS_KILL_PATH || defaultKillPath;
  const kill = readJSON<{ version: number; agents_off: string[] }>(killFile, { version: 1, agents_off: [] });
  if (agent && kill.agents_off.includes(agent)) {
      res.setHeader('X-Budget-Pct', '100');
      return res.status(403).json({ error: 'agent_killed', agent, org_id: orgId });
    }

  const cfgFile = process.env.FINOPS_CFG_PATH || defaultCfgPath;
  const cfg = readJSON<any>(cfgFile, { departments: {} });
    const budget = Number(cfg.departments?.[dept]?.monthly_budget ?? 0);
    if (!budget) return next();

    const spend = Number(deps.getDeptSpendEUR(dept) || 0);
    const pct = Math.min(100, Math.round((spend / budget) * 100));
    res.setHeader('X-Budget-Pct', String(pct));

    if (pct >= 100) {
      return res.status(429).json({ error: 'budget_exhausted', dept, budget_eur: budget, spend_eur: spend });
    }
    return next();
  };
}

export const finopsGuardDefault = finopsGuard({
  getDeptSpendEUR: (_dept: string) => 0,
});
