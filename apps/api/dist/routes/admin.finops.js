import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Router } from 'express';
const KILL_PATH = process.env.FINOPS_KILL_PATH || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'config', 'finops.kill.json');
function readKillRaw() {
    try {
        const raw = fs.readFileSync(KILL_PATH, 'utf8');
        return JSON.parse(raw);
    }
    catch {
        return { version: 1, agents_off: [] };
    }
}
function readKillAdmin() {
    const v1 = readKillRaw();
    const agents = {};
    for (const a of v1.agents_off)
        agents[a] = true;
    return { agents, departments: {} };
}
function writeKillAdmin(cfg) {
    const v1 = { version: 1, agents_off: [] };
    if (cfg.agents) {
        v1.agents_off = Object.entries(cfg.agents)
            .filter(([, enabled]) => !!enabled)
            .map(([agent]) => agent);
    }
    fs.mkdirSync(path.dirname(KILL_PATH), { recursive: true });
    fs.writeFileSync(KILL_PATH, JSON.stringify(v1, null, 2));
}
export const adminFinopsRouter = Router();
adminFinopsRouter.get('/v1/admin/finops/killswitch', (_req, res) => {
    const cfg = readKillAdmin();
    res.json({ killswitch: cfg });
});
adminFinopsRouter.patch('/v1/admin/finops/killswitch', (req, res) => {
    const { agent_key, department_key, enabled } = req.body ?? {};
    if (typeof enabled !== 'boolean' || (!agent_key && !department_key)) {
        return res.status(400).json({ title: 'Bad Request', detail: 'agent_key o department_key requerido; enabled boolean' });
    }
    const cfg = readKillAdmin();
    if (agent_key) {
        cfg.agents = cfg.agents ?? {};
        cfg.agents[agent_key] = !!enabled;
    }
    if (department_key) {
        cfg.departments = cfg.departments ?? {};
        cfg.departments[department_key] = !!enabled;
    }
    writeKillAdmin(cfg);
    res.status(200).json({ ok: true, killswitch: cfg });
});
export default adminFinopsRouter;
//# sourceMappingURL=admin.finops.js.map