import Redis from 'ioredis';

const REDIS_PUBLIC_URL = process.env.REDIS_PUBLIC_URL;

// Redis 연결 설정
export const redis = REDIS_PUBLIC_URL ? new Redis(REDIS_PUBLIC_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: false,
  lazyConnect: true,
  connectTimeout: 10000,
  commandTimeout: 5000,
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

  redis.on('close', () => {
    console.log('🔌 Redis connection closed');
  });

  redis.on('reconnecting', () => {
    console.log('🔄 Redis reconnecting...');
  });
}

// Redis 연결 테스트 함수
export async function testRedisConnection(): Promise<boolean> {
  if (!redis) {
    console.log('⚠️ Redis not configured');
    return false;
  }

  try {
    console.log('🧪 Testing Redis connection...');
    const result = await redis.ping();
    console.log('✅ Redis ping result:', result);
    return result === 'PONG';
  } catch (error) {
    console.error('❌ Redis connection test failed:', error);
    return false;
  }
}