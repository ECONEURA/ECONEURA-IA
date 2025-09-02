import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import app from '../../apps/api/src/index';

describe('HIL approvals contract', () => {
  beforeAll(() => {
    // Para las rutas stub v1 no exigimos AAD
    process.env.AAD_REQUIRED = 'false';
    process.env.AUTH_REQUIRED = 'false';
  });

  it('POST /v1/hitl/:id/approve (stub v1) returns 202', async () => {
    const res = await request(app)
      .post('/v1/hitl/abc123/approve')
      .set('x-bypass-auth', 'true');
    expect(res.status).toBe(202);
    expect(res.body).toMatchObject({ taskId: 'abc123', state: 'approved' });
  });

  it('POST /v1/hil/:id/approve (v2 role-guarded) returns 403 without role', async () => {
    const res = await request(app).post('/v1/hil/abc123/approve');
    expect([401,403,503]).toContain(res.status);
  });

  it('GET /v1/hil?state=pending_approval returns 200 even without DB', async () => {
    const res = await request(app).get('/v1/hil?state=pending_approval');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('items');
  });
});
