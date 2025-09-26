import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';

import express from 'express';
import { z } from 'zod';
import { getIdempotency, setIdempotency, hmacVerify, sha256Hex } from '@econeura/shared/security';

import { AGENTS_MASTER } from '../config/agents.master.js';
import { requireAAD } from '../middleware/aad.js';
const router = express.Router();
router.use('/v1', requireAAD);
const TriggerReq = z.object({
    request_id: z.string().uuid(),
    org_id: z.string().min(1),
    actor: z.literal('cockpit'),
    payload: z.record(z.any()).default({}),
    dryRun: z.boolean().default(false)
});
function deptFromAgentKey(agent_key) {
    const m = agent_key.match(/^([a-z]+)_/);
    return m ? m[1] : 'misc';
}
function verifyHmac(req) {
    const ts = (req.headers['x-timestamp'] || req.headers['X-Timestamp']);
    const sig = (req.headers['x-signature'] || req.headers['X-Signature']);
    if (!ts || !sig)
        return false;
    const body = JSON.stringify(req.body || {});
    const secret = process.env.API_HMAC_SECRET
        || process.env.MAKE_SIGNING_SECRET
        || (process.env.NODE_ENV === 'test' ? 'dev' : '');
    const provided = String(sig).replace(/^sha256=/, '');
    if (hmacVerify(ts, body, provided, { secret }))
        return true;
    const legacyDot = sha256Hex(`${ts}.${body}`, secret);
    try {
        if (Buffer.from(legacyDot).length === Buffer.from(provided).length &&
            require('node:crypto').timingSafeEqual(Buffer.from(legacyDot), Buffer.from(provided))) {
            return true;
        }
    }
    catch (e) {
    }
    const bodyOnly = sha256Hex(body, secret);
    try {
        if (Buffer.from(bodyOnly).length === Buffer.from(provided).length &&
            require('node:crypto').timingSafeEqual(Buffer.from(bodyOnly), Buffer.from(provided))) {
            return true;
        }
    }
    catch (e) {
    }
    return false;
}
async function checkIdempotency(key) {
    return await getIdempotency(key);
}
async function finopsAllow(departmentKey) {
    try {
        const p = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'config', 'finops.departments.json');
        const raw = fs.readFileSync(p, 'utf8');
        const arr = JSON.parse(raw);
        const cfg = arr.find(x => x.department_key === departmentKey);
        if (!cfg)
            return { allowed: true, estCostEur: 0 };
        const est = 0.05;
        return { allowed: true, estCostEur: est };
    }
    catch (e) {
        return { allowed: true, estCostEur: 0 };
    }
}
router.post('/v1/agents/:agent_key/trigger', async (req, res) => {
    const agentKey = req.params.agent_key;
    const agentDef = AGENTS_MASTER.find(a => a.agent_key === agentKey);
    if (!agentDef)
        return res.status(404).json({ code: 'not_found', message: 'agent not found' });
    if (!req.header('X-Correlation-Id'))
        return res.status(400).json({ code: 'missing_header', message: 'X-Correlation-Id required' });
    if (!req.header('Idempotency-Key'))
        return res.status(400).json({ code: 'missing_header', message: 'Idempotency-Key required' });
    if (!verifyHmac(req))
        return res.status(401).json({ code: 'invalid_signature', message: 'invalid HMAC' });
    const parse = TriggerReq.safeParse(req.body);
    if (!parse.success)
        return res.status(400).json({ code: 'invalid_body', message: parse.error.message });
    const idemKey = req.header('Idempotency-Key');
    const prev = await checkIdempotency(idemKey);
    if (prev) {
        res.setHeader('X-Est-Cost-EUR', String(prev.body?.estCostEur ?? 0));
        res.setHeader('X-Latency-ms', '0');
        return res.status(prev.status).json(prev.body);
    }
    const fin = await finopsAllow(agentDef.department_key);
    if (!fin.allowed) {
        res.setHeader('X-Est-Cost-EUR', '0.00');
        return res.status(200).json({ status: 'ok', run_id: null, preview: 'BUDGET_STOP' });
    }
    const runId = '00000000-0000-4000-8000-000000000000';
    const body = { status: 'queued', run_id: runId, preview: undefined, estCostEur: fin.estCostEur };
    await setIdempotency(idemKey, { status: 202, body }, 15 * 60);
    res.setHeader('X-Est-Cost-EUR', String(fin.estCostEur ?? 0));
    res.setHeader('X-Latency-ms', '0');
    return res.status(202).json(body);
});
export const agentsRoutes = router;
//# sourceMappingURL=agents.js.map