import fs from 'node:fs';
import path from 'node:path';
import type { Request, Response, NextFunction } from 'express';

type Deps = {
  getDeptSpendEUR: (dept: string) => number | Promise<number>;
};

type FinopsKill = { version: number; agents_off: string[] };
type FinopsCfg = { departments?: Record<string, { monthly_budget?: number }> };

function readJSON<T>(p: string, fallback: T): T {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')) as T; } catch { return fallback; }
}

// Usar rutas relativas al archivo para coherencia entre runtime y tests
const defaultCfgPath = path.resolve(__dirname, '..', 'config', 'finops.departments.json');
const defaultKillPath = path.resolve(__dirname, '..', 'config', 'finops.kill.json');

function headerToString(h?: string | string[] | undefined): string | undefined {
  if (!h) return undefined;
  return Array.isArray(h) ? h[0] : h;
}

function safeGetBodyKey<T = unknown>(body: unknown, key: string): T | undefined {
  if (body && typeof body === 'object' && key in (body as Record<string, unknown>)) {
    return (body as Record<string, unknown>)[key] as T;
  }
  return undefined;
}

export function finopsGuard(deps: Deps) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalUrl = (req as Request & { originalUrl?: string }).originalUrl || req.url || '';
    // No aplicar guard a endpoints de administración para evitar bloqueos al desactivar
    if (originalUrl.startsWith('/v1/admin/finops')) return next();

    const orgIdHeader = headerToString(req.headers['x-org-id']);
    const orgId = orgIdHeader ?? safeGetBodyKey<string>(req.body, 'org_id') ?? 'unknown';

    const agentHeader = headerToString(req.headers['x-agent-key']);
    const params = (req.params && typeof req.params === 'object') ? (req.params as Record<string, unknown>) : {};
    const agentParam = typeof params.agent_key === 'string' ? params.agent_key : undefined;
    const agentBody = safeGetBodyKey<string>(req.body, 'agent_key');

    let agent = agentHeader ?? agentParam ?? agentBody ?? 'unknown';
    if (!agent || agent === 'unknown') {
      // Extraer del path si viene como /v1/agents/:agent_key/*
      const m = originalUrl.match(/\/v1\/agents\/([^/]+)/);
      if (m && m[1]) agent = m[1];
    }

    const dept = (typeof agent === 'string' && agent.length > 0) ? (agent.split('_')[0] || 'unknown').toLowerCase() : 'unknown';

    const killFile = process.env.FINOPS_KILL_PATH || defaultKillPath;
    const kill = readJSON<FinopsKill>(killFile, { version: 1, agents_off: [] });
    if (agent && Array.isArray(kill.agents_off) && kill.agents_off.includes(agent)) {
      res.setHeader('X-Budget-Pct', '100');
      return res.status(403).json({ error: 'agent_killed', agent, org_id: orgId });
    }

    const cfgFile = process.env.FINOPS_CFG_PATH || defaultCfgPath;
    const cfg = readJSON<FinopsCfg>(cfgFile, { departments: {} });
    const budget = Number(cfg.departments?.[dept]?.monthly_budget ?? 0);
    if (!budget) return next();

    let spend = 0;
    try {
      // deps.getDeptSpendEUR puede ser sync o async según implementación
      const maybe = deps.getDeptSpendEUR(dept);
      spend = typeof maybe === 'number' ? maybe : await Promise.resolve(maybe);
    } catch (err) {
      // Si hay error al calcular el gasto, dejamos pasar la petición por seguridad
      // y anotamos cabecera que indica fallo en cálculo
      res.setHeader('X-Budget-Calc-Error', '1');
      return next();
    }

    const pct = Math.min(100, Math.round((Number(spend) / budget) * 100));
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
