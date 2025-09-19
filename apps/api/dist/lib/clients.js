import { getEnv } from '@econeura/shared';
let _redis = null;
export async function getRedis() {
    if (_redis)
        return _redis;
    const env = getEnv();
    if (!env.REDIS_URL)
        return null;
    try {
        const { default: IORedis } = await import('ioredis');
        const client = new IORedis(env.REDIS_URL);
        try {
            const c = client;
            if (c && typeof c.on === 'function')
                c.on('error', () => { });
        }
        catch { }
        _redis = client;
        return _redis;
    }
    catch (e) {
        return null;
    }
}
//# sourceMappingURL=clients.js.map