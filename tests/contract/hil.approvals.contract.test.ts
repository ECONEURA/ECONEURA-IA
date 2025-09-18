import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
// @ts-ignore
import app from '../../apps/api/src/index';

describe('HIL approvals contract (alias /v1/hitl → /v1/hil)', () => {
  beforeAll(() => {
    process.env.AAD_REQUIRED = 'false';
    process.env.AUTH_REQUIRED = 'false';
  });

  it('POST /v1/hil/approvals/:task_id/approve returns 202', async () => {
    const res = await request(app)
      .post('/v1/hil/approvals/T123/approve')
      .set('X-Correlation-Id', 'cid-test');
    expect([200,202]).toContain(res.status);
    expect(res.headers['x-route']).toBeDefined();
  });

  it('POST /v1/hitl/approvals/:task_id/approve (alias) returns 202', async () => {
    const res = await request(app)
      .post('/v1/hitl/approvals/T123/approve')
      .set('X-Correlation-Id', 'cid-test');
    expect([200,202]).toContain(res.status);
    expect(res.headers['x-route']).toBeDefined();
  });
});
