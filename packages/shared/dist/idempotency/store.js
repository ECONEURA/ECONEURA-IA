class MemoryStore {
    m = new Map();
    async setFirst(key, value, ttlSec) {
        const now = Date.now();
        const cur = this.m.get(key);
        if (cur && cur.exp > now)
            return false;
        this.m.set(key, { v: value, exp: now + ttlSec * 1000 });
        return true;
    }
    async get(key) {
        const cur = this.m.get(key);
        if (!cur)
            return null;
        if (cur.exp < Date.now()) {
            this.m.delete(key);
            return null;
        }
        return cur.v;
    }
}
export function createIdempotencyStore() {
    const url = process.env.REDIS_URL;
    if (!url)
        return new MemoryStore();
    const { createClient } = require('redis');
    const client = createClient({ url });
    client.connect().catch(() => { });
    return {
        async setFirst(key, value, ttlSec) {
            const ok = await client.set(key, JSON.stringify(value), { NX: true, EX: ttlSec });
            return ok === 'OK';
        },
        async get(key) {
            const raw = await client.get(key);
            return raw ? JSON.parse(raw) : null;
        }
    };
}
//# sourceMappingURL=store.js.map