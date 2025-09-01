import { Router } from 'express';
import { z } from 'zod';
import { hmacVerify } from '@econeura/shared/src/security/hmac';
import { createIdempotencyStore } from '@econeura/shared/src/idempotency/store';
import { shouldStopForBudget, estimateCostEUR } from '../services/finops';
import crypto from 'node:crypto';

const r = Router();
const store = createIdempotencyStore();

const TriggerReq = z.object({
  request_id: z.string().uuid(),
  org_id: z.string().min(1),
  actor: z.literal('cockpit'),
  payload: z.record(z.any()).default({}),
  dryRun: z.boolean().default(false),
});

function deptFromAgentKey(agent_key: string): string {
  const m = agent_key.match(/^([a-z]+)_/);
  return m ? m[1] : 'misc';
}

r.post('/v1/agents/:agent_key/trigger', async (req, res) => {
  const t0 = Date.now();
  const auth = req.headers.authorization;
  const corr = req.headers['x-correlation-id'];
  const idem = req.headers['idempotency-key'];
  const ts   = req.headers['x-timestamp'] as string;
  const sig  = req.headers['x-signature'] as string;
  if (!auth || !corr || !idem || !ts || !sig) {
    return res.status(400).json({ code: 'bad_request', message: 'missing required headers' });
  }

  const raw = (req as any)._rawBody ?? '{}';
  const ok = hmacVerify(String(ts), raw, String(sig), { secret: process.env.MAKE_SIGNING_SECRET || 'dev' }, 300);
  if (!ok) return res.status(401).json({ code: 'unauthorized', message: 'bad signature or window' });

  const parsed = TriggerReq.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ code: 'bad_request', message: parsed.error.message });

  const { agent_key } = req.params;
  const { org_id, dryRun, payload } = parsed.data;

  const existing = await store.get(String(idem));
  if (existing) {
    res.setHeader('X-Est-Cost-EUR', estimateCostEUR(agent_key, payload));
    res.setHeader('X-Latency-ms', String(Date.now() - t0));
    return res.status(200).json({ status: existing.status, run_id: existing.run_id });
  }

  const { stop } = await shouldStopForBudget(org_id, deptFromAgentKey(agent_key));
  if (stop) {
    const run_id = crypto.randomUUID();
    await store.setFirst(String(idem), { run_id, status: 'queued' }, 15 * 60);
    res.setHeader('X-Est-Cost-EUR', '0.00');
    res.setHeader('X-Latency-ms', String(Date.now() - t0));
    return res.status(200).json({ status: 'queued', run_id, preview: 'BUDGET_STOP' });
  }

  const run_id = crypto.randomUUID();
  await store.setFirst(String(idem), { run_id, status: 'queued' }, 15 * 60);

  res.setHeader('X-Est-Cost-EUR', estimateCostEUR(agent_key, payload));
  res.setHeader('X-Latency-ms', String(Date.now() - t0));
  return res.status(202).json({ status: 'queued', run_id, preview: dryRun ? 'DRY_RUN' : undefined });
});

export const agentsRoutes = r;
import express from 'express';
import type { Request } from 'express';
import { z } from 'zod';
import { AGENTS_MASTER, AgentSchema } from '../config/agents.master';
import { verifyHmacSignature } from '@econeura/shared/security';
import { getIdempotency, setIdempotency } from '@econeura/shared/security';
import fs from 'fs';
import path from 'path';

const router = express.Router();

const TriggerReq = z.object({
  request_id: z.string().uuid(),
  org_id: z.string().min(1),
  actor: z.literal('cockpit'),
  payload: z.record(z.any()).default({}),
  dryRun: z.boolean().default(false)
});

// Helpers (stubs - implement fully in PR-16)
function verifyHmac(req: Request): boolean {
  const ts = (req.headers['x-timestamp'] || req.headers['X-Timestamp']) as string | undefined;
  const sig = (req.headers['x-signature'] || req.headers['X-Signature']) as string | undefined;
  if (!ts || !sig) return false;
  const body = JSON.stringify(req.body || {});
  const secret = process.env.MAKE_SIGNING_SECRET || '';
  return verifyHmacSignature(ts, body, String(sig), secret);
}

async function checkIdempotency(key: string) {
  return await getIdempotency(key);
}

async function finopsAllow(departmentKey: string): Promise<{allowed:boolean, reason?:string, estCostEur?:number}> {
  try {
    const p = path.join(__dirname, '..', '..', '..', 'config', 'finops.departments.json');
    const raw = fs.readFileSync(p, 'utf8');
    const arr = JSON.parse(raw) as Array<{department_key:string, monthly_budget_eur:number}>;
    const cfg = arr.find(x => x.department_key === departmentKey);
    if (!cfg) return { allowed: true, estCostEur: 0 };
    // naive estimator: fixed 0.05 per call
    const est = 0.05;
    return { allowed: true, estCostEur: est };
  } catch (e) {
    return { allowed: true, estCostEur: 0 };
  }
}

router.post('/agents/:agent_key/trigger', async (req, res) => {
  const agentKey = req.params.agent_key;
  const agentDef = AGENTS_MASTER.find(a => a.agent_key === agentKey);
  if (!agentDef) return res.status(404).json({ code: 'not_found', message: 'agent not found' });

  // headers validation
  if (!req.header('X-Correlation-Id')) return res.status(400).json({ code: 'missing_header', message: 'X-Correlation-Id required' });
  if (!req.header('Idempotency-Key')) return res.status(400).json({ code: 'missing_header', message: 'Idempotency-Key required' });

  // HMAC
  if (!verifyHmac(req)) return res.status(401).json({ code: 'invalid_signature', message: 'invalid HMAC' });

  // body validation
  const parse = TriggerReq.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ code: 'invalid_body', message: parse.error.message });

  // idempotency check
  const idemKey = req.header('Idempotency-Key') as string;
  const prev = await checkIdempotency(idemKey);
  if (prev) {
    res.setHeader('X-Est-Cost-EUR', String(prev.body?.estCostEur ?? 0));
    res.setHeader('X-Latency-ms', '0');
    return res.status(prev.status).json(prev.body);
  }

  // FinOps guard
  const fin = await finopsAllow(agentDef.department_key);
  if (!fin.allowed) {
    res.setHeader('X-Est-Cost-EUR', '0.00');
    return res.status(200).json({ status: 'ok', run_id: null, preview: 'BUDGET_STOP' });
  }

  // enqueue the run (stub)
  const runId = '00000000-0000-4000-8000-000000000000';

  const body = { status: 'queued', run_id: runId, preview: undefined, estCostEur: fin.estCostEur };
  await setIdempotency(idemKey, { status: 202, body }, 15 * 60);

  res.setHeader('X-Est-Cost-EUR', String(fin.estCostEur ?? 0));
  res.setHeader('X-Latency-ms', '0');
  return res.status(202).json(body);
});

export const agentsRoutes = router;
