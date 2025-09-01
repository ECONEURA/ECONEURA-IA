import { describe, it, expect } from 'vitest';
import { setIdempotency, getIdempotency } from './idempotency';

describe('idempotency store', () => {
  it('stores and retrieves values in memory fallback', async () => {
    const key = `test-${Date.now()}`;
    const value = { status: 200, body: { ok: true } };
    await setIdempotency(key, value, 1);
    const got = await getIdempotency(key);
    expect(got).not.toBeNull();
    expect(got?.status).toBe(200);
  });
});
