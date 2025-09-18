const request = require('supertest');
const { createApp } = require('../src/app');

describe('health', () => {
  it('responds ok', async () => {
    const app = createApp();
    const res = await request(app).get('/health');
    if (res.status !== 200) throw new Error('health status != 200');
    if (!res.body || res.body.status !== 'ok') throw new Error('health body invalid');
  });
});
