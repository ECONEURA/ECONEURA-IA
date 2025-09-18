type DeptCfg = { department_key: string; monthly_budget_eur: number };
let cfgCache: DeptCfg[] | null = null;

export function loadFinopsConfig(): DeptCfg[] {
  if (cfgCache) return cfgCache;
  try {
     
    cfgCache = require('../../config/finops.departments.json') as DeptCfg[];
    return cfgCache!;
  } catch {
    cfgCache = [];
    return [];
  }
}

export async function currentSpendEUR(org_id: string, department_key: string): Promise<number> {
  return 0;
}

export async function shouldStopForBudget(org_id: string, department_key: string): Promise<{ stop: boolean; pct: number }> {
  const cfg = loadFinopsConfig().find(c => c.department_key === department_key);
  if (!cfg) return { stop: false, pct: 0 };
  const spent = await currentSpendEUR(org_id, department_key);
  const pct = cfg.monthly_budget_eur > 0 ? (spent / cfg.monthly_budget_eur) * 100 : 0;
  return { stop: pct >= 100, pct };
}

export function estimateCostEUR(agent_key: string, payload: unknown): string {
  return '0.002';
}
