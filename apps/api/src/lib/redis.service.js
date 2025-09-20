import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

// Connection event handlers
redis.on('connect', () => {
  console.log('Redis connected');
});

// @ts-ignore
redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

export function getRedisService() {
  return redis;
}

export default redis;