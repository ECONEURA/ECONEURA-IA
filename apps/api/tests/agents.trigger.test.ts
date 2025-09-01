import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/index';
import { hmacSign } from '@econeura/shared/src/security/hmac';
import crypto from 'node:crypto';

describe('POST /v1/agents/:agent_key/trigger', () => {
  const ts = Math.floor(Date.now()/1000).toString();
  const body = {
    request_id: crypto.randomUUID(),
    org_id: 'org_test',
    actor: 'cockpit',
    payload: { x: 1 },
    dryRun: true
  };
  function headers(b: any) {
    const raw = JSON.stringify(b);
    const sig = hmacSign(ts, raw, { secret: process.env.MAKE_SIGNING_SECRET || 'dev' });
    return {
      Authorization: 'Bearer test',
      'X-Correlation-Id': crypto.randomUUID(),
      'Idempotency-Key': crypto.randomUUID(),
      'X-Timestamp': ts,
      'X-Signature': `sha256=${sig}`,
      'Content-Type': 'application/json'
    };
  }

  it('acepta y encola', async () => {
    const res = await request(app)
      .post('/v1/agents/cfo_dunning/trigger')
      .set(headers(body))
      .send(body);
    expect([200,202]).toContain(res.status);
    expect(res.body.run_id).toBeDefined();
    expect(res.headers['x-latency-ms']).toBeDefined();
  });

  it('rechaza firma inválida', async () => {
    const bad = await request(app)
      .post('/v1/agents/cfo_dunning/trigger')
      .set({ ...headers(body), 'X-Signature': 'sha256=deadbeef' })
      .send(body);
    expect(bad.status).toBe(401);
  });
});
