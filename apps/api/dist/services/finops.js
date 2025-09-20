let cfgCache = null;
export function loadFinopsConfig() {
    if (cfgCache)
        return cfgCache;
    try {
        cfgCache = require('../../config/finops.departments.json');
        return cfgCache;
    }
    catch {
        cfgCache = [];
        return [];
    }
}
export async function currentSpendEUR(org_id, department_key) {
    return 0;
}
export async function shouldStopForBudget(org_id, department_key) {
    const cfg = loadFinopsConfig().find(c => c.department_key === department_key);
    if (!cfg)
        return { stop: false, pct: 0 };
    const spent = await currentSpendEUR(org_id, department_key);
    const pct = cfg.monthly_budget_eur > 0 ? (spent / cfg.monthly_budget_eur) * 100 : 0;
    return { stop: pct >= 100, pct };
}
export function estimateCostEUR(agent_key, payload) {
    return '0.002';
}
//# sourceMappingURL=finops.js.map