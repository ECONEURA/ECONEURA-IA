let Redis = null;
try {
    Redis = require('ioredis');
}
catch (e) {
    Redis = null;
}
let redis = null;
try {
    if (Redis && process.env.REDIS_URL)
        redis = new Redis(process.env.REDIS_URL);
}
catch (e) {
}
const inMemory = new Map();
export async function getIdempotency(key) {
    if (redis) {
        const raw = await redis.get(`idem:${key}`);
        return raw ? JSON.parse(raw) : null;
    }
    const found = inMemory.get(key);
    if (!found)
        return null;
    if (found.expiresAt < Date.now()) {
        inMemory.delete(key);
        return null;
    }
    return found.stored;
}
export async function setIdempotency(key, value, ttlSeconds = 15 * 60) {
    if (redis) {
        await redis.setex(`idem:${key}`, ttlSeconds, JSON.stringify(value));
        return;
    }
    inMemory.set(key, { stored: value, expiresAt: Date.now() + ttlSeconds * 1000 });
}
//# sourceMappingURL=idempotency.js.map