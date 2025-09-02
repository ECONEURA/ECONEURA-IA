import { Router, type Router as ExpressRouter } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { withSpan } from '../lib/trace';

export const makeHealthRouter: ExpressRouter = Router();

type Agent = {
  agent_key: string;
  make_scenario_id?: string;
  webhook_url?: string;
};

async function ping(url: string) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), 2000);
  try {
    const res = await fetch(url, { method: 'HEAD', signal: ctrl.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(id);
  }
}

makeHealthRouter.get('/v1/integrations/make/health', async (_req, res) => {
  const seedPath = path.join(process.cwd(), 'seed', 'agents_master.json');
  const agents: Agent[] = fs.existsSync(seedPath) ? JSON.parse(fs.readFileSync(seedPath, 'utf8')) : [];
  const targets = agents.filter((a) => a.webhook_url);
  const attrs: Record<string, any> = { 'make.health.targets': targets.length };
  await withSpan('make.health', async () => {
    const failures: string[] = [];
    await Promise.allSettled(
      targets.map(async (a) => {
        const ok = await ping(a.webhook_url!);
        if (!ok) failures.push(a.agent_key);
        await sleep(5);
      })
    );
    const status = failures.length ? 'degraded' : 'ok';
    attrs['make.health.status'] = status;
    attrs['make.health.failures'] = failures.join(',');
    res.json({ status, checked: targets.length, failures });
  }, attrs);
});

export default makeHealthRouter;
