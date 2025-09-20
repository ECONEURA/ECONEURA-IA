import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
function readJSON(p, fallback) {
    try {
        return JSON.parse(fs.readFileSync(p, 'utf8'));
    }
    catch {
        return fallback;
    }
}
const defaultCfgPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'config', 'finops.departments.json');
const defaultKillPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'config', 'finops.kill.json');
function headerToString(h) {
    if (!h)
        return undefined;
    return Array.isArray(h) ? h[0] : h;
}
function safeGetBodyKey(body, key) {
    if (body && typeof body === 'object' && key in body) {
        return body[key];
    }
    return undefined;
}
export function finopsGuard(deps) {
    return async (req, res, next) => {
        const originalUrl = req.originalUrl || req.url || '';
        if (originalUrl.startsWith('/v1/admin/finops'))
            return next();
        const orgIdHeader = headerToString(req.headers['x-org-id']);
        const orgId = orgIdHeader ?? safeGetBodyKey(req.body, 'org_id') ?? 'unknown';
        const agentHeader = headerToString(req.headers['x-agent-key']);
        const params = (req.params && typeof req.params === 'object') ? req.params : {};
        const agentParam = typeof params.agent_key === 'string' ? params.agent_key : undefined;
        const agentBody = safeGetBodyKey(req.body, 'agent_key');
        let agent = agentHeader ?? agentParam ?? agentBody ?? 'unknown';
        if (!agent || agent === 'unknown') {
            const m = originalUrl.match(/\/v1\/agents\/([^/]+)/);
            if (m && m[1])
                agent = m[1];
        }
        const dept = (typeof agent === 'string' && agent.length > 0) ? (agent.split('_')[0] || 'unknown').toLowerCase() : 'unknown';
        const killFile = process.env.FINOPS_KILL_PATH || defaultKillPath;
        const kill = readJSON(killFile, { version: 1, agents_off: [] });
        if (agent && Array.isArray(kill.agents_off) && kill.agents_off.includes(agent)) {
            res.setHeader('X-Budget-Pct', '100');
            return res.status(403).json({ error: 'agent_killed', agent, org_id: orgId });
        }
        const cfgFile = process.env.FINOPS_CFG_PATH || defaultCfgPath;
        const cfg = readJSON(cfgFile, { departments: {} });
        const budget = Number(cfg.departments?.[dept]?.monthly_budget ?? 0);
        if (!budget)
            return next();
        let spend = 0;
        try {
            const maybe = deps.getDeptSpendEUR(dept);
            spend = typeof maybe === 'number' ? maybe : await Promise.resolve(maybe);
        }
        catch (err) {
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
    getDeptSpendEUR: (_dept) => 0,
});
//# sourceMappingURL=finops.guard.js.map