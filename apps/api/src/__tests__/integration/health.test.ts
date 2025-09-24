import request from 'supertest';
import { describe, test, expect } from 'vitest';
import app from '../../index';

describe('Health Endpoints', () => {
  test('GET /health/live should return 200', async () => {
    const response = await request(app)
      .get('/health/live')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'ok');
  });
});
