import { Env } from '@econeura/shared/src/env';
let _redis: any;
export async function getRedis() {
  if (_redis) return _redis;
  if (!Env.REDIS_URL) return null;
  const { createClient } = await import('redis');
  _redis = createClient({ url: Env.REDIS_URL });
  _redis.on?.('error', ()=>{});
  await _redis.connect().catch(()=>{});
  return _redis;
}
