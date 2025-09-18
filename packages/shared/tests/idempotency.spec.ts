import { describe, it, expect } from 'vitest';
import { createIdempotencyStore } from '../src/idempotency/store.js';

describe('Idempotency', () => {
  it('crea y reutiliza', async () => {
    const s = createIdempotencyStore();
    const first = await s.setFirst('k', { run_id: 'r1', status: 'queued' }, 1);
    expect(first).toBe(true);
    const second = await s.setFirst('k', { run_id: 'r2', status: 'ok' }, 1);
    expect(second).toBe(false);
    const cur = await s.get('k');
    expect(cur?.run_id).toBe('r1');
  });
});
