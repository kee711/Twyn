import { NextResponse } from 'next/server';
import { cleanupQueue } from '@/lib/queue/threadQueue';

export async function POST() {
  try {
    console.log('🧹 [API] Queue cleanup request received');
    
    await cleanupQueue();
    
    return NextResponse.json({
      success: true,
      message: 'Queue cleanup completed'
    });
  } catch (error) {
    console.error('❌ [API] Queue cleanup error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}