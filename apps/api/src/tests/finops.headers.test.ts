import request from 'supertest';
import express from 'express';
import { finopsHeaders } from '../middleware/finops.js';

describe('FinOps headers middleware', () => {
  it('adds FinOps headers on /v1 routes', async () => {
    const app = express();
    app.use('/v1', finopsHeaders(0.0012, 10));
    app.get('/v1/ping', (req, res) => res.json({ ok: true }));

    const res = await request(app).get('/v1/ping');
    expect(res.headers['x-correlation-id']).toBeTruthy();
    expect(res.headers['x-est-cost-eur']).toBe('0.0012');
    expect(res.headers['x-budget-pct']).toBe('10');
    expect(res.headers['x-route']).toBe('/v1/ping');
    expect(res.status).toBe(200);
  });
});
