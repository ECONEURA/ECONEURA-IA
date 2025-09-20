type Resolved = { run_id: string; status: 'ok' | 'queued' };
export interface IdempotencyStore {
  setFirst(key: string, value: Resolved, ttlSec: number): Promise<boolean>;
  get(key: string): Promise<Resolved | null>;
}

class MemoryStore implements IdempotencyStore {
  private m = new Map<string, { v: Resolved; exp: number }>();
  async setFirst(key: string, value: Resolved, ttlSec: number) {
    const now = Date.now();
    const cur = this.m.get(key);
    if (cur && cur.exp > now) return false;
    this.m.set(key, { v: value, exp: now + ttlSec * 1000 });
    return true;
  }
  async get(key: string) {
    const cur = this.m.get(key);
    if (!cur) return null;
    if (cur.exp < Date.now()) { this.m.delete(key); return null; }
    return cur.v;
  }
}

export function createIdempotencyStore(): IdempotencyStore {
  const url = process.env.REDIS_URL;
  if (!url) return new MemoryStore();
  // lazy require to avoid optional dep failure in dev
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createClient } = require('redis');
  const client = createClient({ url });
  client.connect().catch(() => {});
  return {
    async setFirst(key, value, ttlSec) {
      const ok = await client.set(key, JSON.stringify(value), { NX: true, EX: ttlSec });
      return ok === 'OK';
    },
    async get(key) {
      const raw = await client.get(key);
      return raw ? JSON.parse(raw) as Resolved : null;
    }
  };
}
