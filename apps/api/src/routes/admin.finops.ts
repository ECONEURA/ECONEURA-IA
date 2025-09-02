import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';

// Archivo de configuración de kill-switch (persistencia simple en disco)
const KILL_PATH = process.env.FINOPS_KILL_PATH || path.resolve(__dirname, '..', 'config', 'finops.kill.json');

type KillConfigV1 = {
  version: number;
  agents_off: string[];
};

type KillConfigAdmin = {
  agents?: Record<string, boolean>;
  departments?: Record<string, boolean>;
};

function readKillRaw(): KillConfigV1 {
  try {
    const raw = fs.readFileSync(KILL_PATH, 'utf8');
    return JSON.parse(raw) as KillConfigV1;
  } catch {
    return { version: 1, agents_off: [] };
  }
}

function readKillAdmin(): KillConfigAdmin {
  const v1 = readKillRaw();
  const agents: Record<string, boolean> = {};
  for (const a of v1.agents_off) agents[a] = true;
  return { agents, departments: {} };
}

function writeKillAdmin(cfg: KillConfigAdmin) {
  const v1: KillConfigV1 = { version: 1, agents_off: [] };
  if (cfg.agents) {
    v1.agents_off = Object.entries(cfg.agents)
      .filter(([, enabled]) => !!enabled)
      .map(([agent]) => agent);
  }
  fs.mkdirSync(path.dirname(KILL_PATH), { recursive: true });
  fs.writeFileSync(KILL_PATH, JSON.stringify(v1, null, 2));
}

export const adminFinopsRouter = Router();

// GET estado actual
adminFinopsRouter.get('/v1/admin/finops/killswitch', (_req, res) => {
  const cfg = readKillAdmin();
  res.json({ killswitch: cfg });
});

// PATCH por agente o departamento
// body: { agent_key?: string, department_key?: string, enabled: boolean }
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
