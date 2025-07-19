import { Queue } from 'bullmq';
import { redis } from './redis';

export interface ThreadJobData {
  parentThreadId: string;
  threads: Array<{
    content: string;
    mediaUrls: string[];
    mediaType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'CAROUSEL';
  }>;
  socialId: string;
  accessToken: string;
  userId: string;
}

// BullMQ 큐 설정
export const threadQueue = redis ? new Queue('thread-processing', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
}) : null;

/**
 * 스레드 체인을 BullMQ 큐에 추가
 */
export async function enqueueThreadChain(data: ThreadJobData): Promise<{ success: boolean; jobId?: string; error?: string }> {
  console.log(`📥 [BullMQ] Enqueueing thread chain:`, {
    parentThreadId: data.parentThreadId,
    threadsCount: data.threads.length,
    socialId: data.socialId,
    userId: data.userId,
    hasAccessToken: !!data.accessToken,
    accessTokenLength: data.accessToken?.length || 0,
    accessTokenPreview: data.accessToken ? `${data.accessToken.substring(0, 10)}...` : 'undefined'
  });

  if (!threadQueue) {
    console.error('❌ [BullMQ] Redis not available, falling back to direct processing');
    return { success: false, error: 'Redis not available' };
  }

  try {
    const job = await threadQueue.add('process-thread-chain', data, {
      priority: 1,
      delay: 0,
    });

    console.log(`✅ [BullMQ] Job enqueued successfully:`, {
      jobId: job.id,
      parentThreadId: data.parentThreadId,
      threadsCount: data.threads.length
    });

    return { success: true, jobId: job.id };
  } catch (error) {
    console.error('❌ [BullMQ] Failed to enqueue job:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * 큐 상태 조회
 */
export async function getQueueStatus() {
  if (!threadQueue) {
    return { pending: 0, active: 0, completed: 0, failed: 0 };
  }

  try {
    const [pending, active, completed, failed] = await Promise.all([
      threadQueue.getWaiting(),
      threadQueue.getActive(),
      threadQueue.getCompleted(),
      threadQueue.getFailed(),
    ]);

    const status = {
      pending: pending.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length
    };

    console.log(`📊 [BullMQ] Queue status:`, status);
    return status;
  } catch (error) {
    console.error('❌ [BullMQ] Failed to get queue status:', error);
    return { pending: 0, active: 0, completed: 0, failed: 0 };
  }
}

/**
 * 큐 정리 (완료된 작업 삭제)
 */
export async function cleanupQueue(): Promise<void> {
  if (!threadQueue) {
    console.warn('⚠️  [BullMQ] Queue not available for cleanup');
    return;
  }

  try {
    console.log('🧹 [BullMQ] Starting queue cleanup...');
    
    // 완료된 작업 정리 (24시간 이상 된 것)
    await threadQueue.clean(24 * 60 * 60 * 1000, 100, 'completed');
    
    // 실패한 작업 정리 (24시간 이상 된 것)
    await threadQueue.clean(24 * 60 * 60 * 1000, 100, 'failed');
    
    console.log('✅ [BullMQ] Queue cleanup completed');
  } catch (error) {
    console.error('❌ [BullMQ] Queue cleanup failed:', error);
  }
}