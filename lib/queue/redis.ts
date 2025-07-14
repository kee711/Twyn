import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
  console.warn('⚠️  REDIS_URL not found. BullMQ features will be disabled.');
}

// Redis 연결 설정
export const redis = REDIS_URL ? new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  lazyConnect: true,
}) : null;

if (redis) {
  redis.on('connect', () => {
    console.log('📡 Connected to Redis');
  });

  redis.on('error', (err) => {
    console.error('❌ Redis connection error:', err);
  });

  redis.on('ready', () => {
    console.log('✅ Redis is ready');
  });
}