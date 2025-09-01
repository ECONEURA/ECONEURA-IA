import express from 'express';
import type { Request } from 'express';
import { z } from 'zod';
import { AGENTS_MASTER, AgentSchema } from '../config/agents.master';

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
  // TODO: implement HMAC verification using X-Timestamp and X-Signature
  return true;
}

async function checkIdempotency(_key: string) {
  // TODO: lookup idempotency store (TTL 15min)
  return null; // return stored response if exists
}

async function finopsAllow(_departmentKey: string): Promise<{allowed:boolean, reason?:string, estCostEur?:number}> {
  // TODO: compute budget pct and decide
  return { allowed: true, estCostEur: 0.05 };
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
  if (prev) return res.status(200).json(prev);

  // FinOps guard
  const fin = await finopsAllow(agentDef.department_key);
  if (!fin.allowed) {
    res.setHeader('X-Est-Cost-EUR', '0.00');
    return res.status(200).json({ status: 'ok', run_id: null, preview: 'BUDGET_STOP' });
  }

  // enqueue the run (stub)
  const runId = '00000000-0000-4000-8000-000000000000';

  res.setHeader('X-Est-Cost-EUR', String(fin.estCostEur ?? 0));
  res.setHeader('X-Latency-ms', '0');
  return res.status(202).json({ status: 'queued', run_id: runId, preview: undefined });
});

export const agentsRoutes = router;
