import { NextResponse } from 'next/server';
import { getQueueStatus } from '@/lib/queue/threadQueue';

export async function GET() {
  try {
    console.log('📊 [API] Queue status request received');
    
    const status = await getQueueStatus();
    
    return NextResponse.json({
      success: true,
      status,
      message: 'Queue status retrieved successfully'
    });
  } catch (error) {
    console.error('❌ [API] Queue status error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}