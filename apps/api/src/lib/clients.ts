import { getEnv } from '@econeura/shared';
let _redis: any;
export async function getRedis() {
  if (_redis) return _redis;
  const env = getEnv();
  if (!env.REDIS_URL) return null;
  const { default: IORedis } = await import('ioredis');
  _redis = new (IORedis as any)(env.REDIS_URL);
  _redis.on?.('error', ()=>{});
  return _redis;
}
