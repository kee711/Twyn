import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
  console.warn('⚠️  REDIS_URL not found. BullMQ features will be disabled.');
}

// Redis URL 형식 검증 및 수정
function validateAndFixRedisUrl(url: string): string {
  console.log('🔍 Original Redis URL format check:', {
    url: url.replace(/:[^:@]+@/, ':***@'), // 비밀번호 마스킹
    length: url.length,
    startsWithRedis: url.startsWith('redis://'),
    startsWithDoubleSlash: url.startsWith('//')
  });

  // 잘못된 환경변수 형식 감지 (예: "redis_url=redis")
  if (url.includes('=') && !url.startsWith('redis://')) {
    console.error('❌ Invalid Redis URL format detected - contains "=" character');
    console.error('❌ Check your environment variable configuration');
    throw new Error(`Invalid Redis URL format: ${url.substring(0, 20)}...`);
  }

  // redis:// 접두사가 없는 경우 추가
  if (url.startsWith('//')) {
    const fixedUrl = 'redis:' + url;
    console.log('🔧 Fixed Redis URL by adding redis: prefix');
    return fixedUrl;
  }

  // redis:// 접두사가 이미 있는 경우 그대로 반환
  if (url.startsWith('redis://')) {
    console.log('✅ Redis URL format is correct');
    return url;
  }

  // 기타 경우 redis:// 접두사 추가
  const fixedUrl = 'redis://' + url;
  console.log('🔧 Fixed Redis URL by adding redis:// prefix');
  return fixedUrl;
}

// Redis 연결 설정
export const redis = REDIS_URL ? (() => {
  try {
    return new Redis(validateAndFixRedisUrl(REDIS_URL), {
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
      lazyConnect: true,
      connectTimeout: 10000,
      commandTimeout: 5000,
    });
  } catch (error) {
    console.error('❌ Failed to create Redis client:', error);
    console.error('❌ BullMQ features will be disabled');
    return null;
  }
})() : null;

if (redis) {
  redis.on('connect', () => {
    console.log('📡 Connected to Redis');
  });

  redis.on('error', (err) => {
    console.error('❌ Redis connection error:', err);
    console.error('❌ Redis URL format issue. Check REDIS_URL environment variable.');
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