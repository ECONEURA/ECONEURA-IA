import { getEnv } from '@econeura/shared';
let _redis: unknown | null = null;
export async function getRedis(): Promise<unknown | null> {
  if (_redis) return _redis;
  const env = getEnv();
  if (!env.REDIS_URL) return null;
  try {
    const { default: IORedis } = await import('ioredis');
    // Construct client in a try/catch to avoid failing startup in CI without redis
    const client = new (IORedis as unknown as { new(url: string): unknown })(env.REDIS_URL);
    try {
      const c = client as unknown as { on?: (...args: any[]) => void } | null;
      if (c && typeof c.on === 'function') c.on('error', () => {});
    } catch {}
    _redis = client;
    return _redis;
  } catch (e) {
    // If import or construction fails, return null and keep process running
    return null;
  }
}
