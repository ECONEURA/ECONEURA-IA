import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
// Desactivar AAD para pruebas
beforeAll(() => {
  process.env.AUTH_REQUIRED = 'false';
  process.env.AAD_REQUIRED = 'false';
});
 
// @ts-ignore
import app from '../../src/index';

const AGENT = 'cfo_dunning';

describe('FinOps kill-switch API', () => {
  it('GET /v1/admin/finops/killswitch devuelve estado', async () => {
    const res = await request(app).get('/v1/admin/finops/killswitch');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('killswitch');
  });

  it('PATCH toggle por agent_key y bloquea trigger cuando enabled=true', async () => {
    const up = await request(app)
      .patch('/v1/admin/finops/killswitch')
      .send({ agent_key: AGENT, enabled: true });
    expect(up.status).toBe(200);

    const body = { request_id: '00000000-0000-4000-8000-000000000001', org_id: 'org_demo', actor: 'cockpit', payload: {}, dryRun: true };
    // Construir firma válida con body-only variante soportada por verifyHmac
    const crypto = await import('node:crypto');
    const secret = 'dev';
    const digest = crypto.createHmac('sha256', secret).update(JSON.stringify(body)).digest('hex');
    const res = await request(app)
      .post(`/v1/agents/${AGENT}/trigger`)
      .set({ 'Content-Type': 'application/json', 'X-Correlation-Id': 'test', 'Idempotency-Key': 'k1', 'X-Timestamp': 't', 'X-Signature': 'sha256=' + digest })
      .send(body);
    expect([403, 429]).toContain(res.status);

    const down = await request(app)
      .patch('/v1/admin/finops/killswitch')
      .send({ agent_key: AGENT, enabled: false });
    expect(down.status).toBe(200);
  });
});
