import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/authOptions'

export async function GET() {
  console.log('[GET /api/user/get-publish-times] Starting request');
  
  try {
    console.log('[GET /api/user/get-publish-times] Getting server session...');
    const session = await getServerSession(authOptions)
    console.log('[GET /api/user/get-publish-times] Session:', session ? { userId: session.user?.id, email: session.user?.email } : 'No session');

    if (!session || !session.user) {
      console.log('[GET /api/user/get-publish-times] No authenticated user, returning 401');
      return NextResponse.json({ error: 'No authenticated user' }, { status: 401 })
    }

    const userId = session.user.id
    console.log('[GET /api/user/get-publish-times] User ID:', userId);
    
    console.log('[GET /api/user/get-publish-times] Creating Supabase client...');
    const supabase = await createClient()
    console.log('[GET /api/user/get-publish-times] Supabase client created');

    console.log('[GET /api/user/get-publish-times] Fetching publish_times from database...');
    const { data, error } = await supabase
      .from('user_profiles')
      .select('publish_times')
      .eq('user_id', userId)
      .single()
    
    console.log('[GET /api/user/get-publish-times] Database response:', { data, error });

    if (error) {
      console.error('[GET /api/user/get-publish-times] Database error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return NextResponse.json({ error: 'Failed to fetch publish_times', details: error.message }, { status: 500 })
    }

    const publishTimes = data?.publish_times || [];
    console.log('[GET /api/user/get-publish-times] Returning publish_times:', publishTimes);
    return NextResponse.json(publishTimes)
  } catch (error) {
    console.error('[GET /api/user/get-publish-times] Unexpected error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ 
      error: 'Unexpected server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}