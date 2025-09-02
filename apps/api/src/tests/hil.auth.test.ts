import request from 'supertest';
import express from 'express';
import hilRouter from '../routes/hil.js';

describe('HIL auth middleware', () => {
  it('returns 401 when AAD_REQUIRED and no token', async () => {
    process.env.AAD_REQUIRED = 'true';
    const app = express();
    app.use(express.json());
    app.use(hilRouter);
    const res = await request(app).get('/v1/hitl');
    expect(res.status).toBe(401);
  });
});
