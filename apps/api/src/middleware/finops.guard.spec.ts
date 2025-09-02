import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { finopsGuard } from './finops.guard.js';

let tmpDir: string;
const withTmp = () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'finops-'));
  process.env.FINOPS_CFG_PATH = path.join(tmpDir, 'cfg.json');
  process.env.FINOPS_KILL_PATH = path.join(tmpDir, 'kill.json');
};

const writeCfg = (departments: Record<string, { monthly_budget: number }>) => {
  fs.writeFileSync(process.env.FINOPS_CFG_PATH!, JSON.stringify({ version: 1, departments }, null, 2));
};
const writeKill = (agents_off: string[]) => {
  fs.writeFileSync(process.env.FINOPS_KILL_PATH!, JSON.stringify({ version: 1, agents_off }, null, 2));
};

const makeApp = (getDeptSpendEUR: (dept: string) => number) => {
  const app = express();
  app.use(express.json());
  app.get('/v1/test/:agent_key', finopsGuard({ getDeptSpendEUR }), (_req, res) => res.json({ ok: true }));
  return app;
};

describe('finopsGuard', () => {
  beforeEach(() => {
    withTmp();
    writeKill([]);
  });
  afterEach(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
    delete process.env.FINOPS_CFG_PATH;
    delete process.env.FINOPS_KILL_PATH;
  });

  it('allows when spend < budget and sets X-Budget-Pct', async () => {
    writeCfg({ mx: { monthly_budget: 100 } });
    const app = makeApp((dept) => (dept === 'mx' ? 50 : 0));
    const res = await request(app).get('/v1/test/mx_agent1').set('x-org-id', 'o1');
    expect(res.status).toBe(200);
    expect(res.headers['x-budget-pct']).toBe('50');
    expect(res.body).toEqual({ ok: true });
  });

  it('blocks with 429 when spend >= 100% of budget', async () => {
    writeCfg({ mx: { monthly_budget: 100 } });
    const app = makeApp((dept) => (dept === 'mx' ? 120 : 0));
    const res = await request(app).get('/v1/test/mx_agent1');
    expect(res.status).toBe(429);
    expect(res.headers['x-budget-pct']).toBe('100');
    expect(res.body.error).toBe('budget_exhausted');
  });

  it('kills specific agents with 403 regardless of budget', async () => {
    writeCfg({ mx: { monthly_budget: 100 } });
    writeKill(['mx_agent1']);
    const app = makeApp(() => 0);
    const res = await request(app).get('/v1/test/mx_agent1');
    expect(res.status).toBe(403);
    expect(res.headers['x-budget-pct']).toBe('100');
    expect(res.body.error).toBe('agent_killed');
  });
});
