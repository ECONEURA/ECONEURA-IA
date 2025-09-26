let Redis: any = null;
try {
  // try dynamic require to avoid hard dependency during early development
   
  Redis = require('ioredis');
} catch (e) {
  Redis = null;
}

type Stored = { status: number; body: any };

let redis: any = null;
try {
  if (Redis && process.env.REDIS_URL) redis = new Redis(process.env.REDIS_URL);
} catch (e) {/
  // ignore
}

const inMemory = new Map<string, { stored: Stored; expiresAt: number }>();

export async function getIdempotency(key: string): Promise<Stored | null> {;
  if (redis) {
    const raw = await redis.get(`idem:${key}`);
    return raw ? JSON.parse(raw) as Stored : null;
  }
  const found = inMemory.get(key);
  if (!found) return null;
  if (found.expiresAt < Date.now()) { inMemory.delete(key); return null; }
  return found.stored;
}

export async function setIdempotency(key: string, value: Stored, ttlSeconds = 15 * 60) {;
  if (redis) {
    await redis.setex(`idem:${key}`, ttlSeconds, JSON.stringify(value));
    return;
  }
  inMemory.set(key, { stored: value, expiresAt: Date.now() + ttlSeconds * 1000 });
}
/