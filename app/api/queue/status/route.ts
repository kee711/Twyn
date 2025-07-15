import { NextResponse } from 'next/server';
import { testRedisConnection, redis } from '@/lib/queue/redis';

export async function GET() {
  try {
    console.log('🔍 Checking Redis connection status...');

    const isConnected = await testRedisConnection();

    // Redis URL 정보 수집 (보안상 마스킹)
    const redisUrl = process.env.REDIS_URL;
    let redisUrlInfo = { configured: false, masked: '', protocol: '', host: '', port: '' };

    if (redisUrl) {
      redisUrlInfo.configured = true;
      redisUrlInfo.masked = redisUrl.replace(/:[^:@]+@/, ':***@');

      try {
        const url = new URL(redisUrl.startsWith('//') ? 'redis:' + redisUrl : redisUrl);
        redisUrlInfo.protocol = url.protocol;
        redisUrlInfo.host = url.hostname;
        redisUrlInfo.port = url.port || '6379';
      } catch (parseError) {
        console.error('Redis URL parsing failed:', parseError);
      }
    }

    const status = {
      redis: {
        connected: isConnected,
        configured: redisUrlInfo.configured,
        urlInfo: redisUrlInfo,
        clientExists: !!redis,
        timestamp: new Date().toISOString()
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        platform: process.platform,
        isLocalDev: !process.env.VERCEL && !process.env.RAILWAY_ENVIRONMENT
      }
    };

    console.log('📊 Detailed Redis status:', status);

    return NextResponse.json(status, {
      status: isConnected ? 200 : 503
    });

  } catch (error) {
    console.error('❌ Status check failed:', error);

    return NextResponse.json({
      redis: {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        platform: process.platform,
        isLocalDev: !process.env.VERCEL && !process.env.RAILWAY_ENVIRONMENT
      }
    }, { status: 500 });
  }
}