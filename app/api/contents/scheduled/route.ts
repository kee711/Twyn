import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  console.log('[GET /api/contents/scheduled] Starting request');
  
  try {
    console.log('[GET /api/contents/scheduled] Environment variables check:', {
      SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set',
      SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set'
    });

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('[GET /api/contents/scheduled] Missing environment variables');
      return NextResponse.json({ 
        error: 'Server configuration error', 
        details: 'Missing Supabase environment variables' 
      }, { status: 500 });
    }

    console.log('[GET /api/contents/scheduled] Creating Supabase client...');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    console.log('[GET /api/contents/scheduled] Supabase client created');

    console.log('[GET /api/contents/scheduled] Fetching scheduled contents from database...');
    const { data, error } = await supabase
      .from('my_contents')
      .select('*')
      .or('publish_status.eq.scheduled,publish_status.eq.posted')
      .order('scheduled_at', { ascending: true });
    
    console.log('[GET /api/contents/scheduled] Database response:', {
      dataCount: data?.length || 0,
      error: error ? {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      } : null
    });

    if (error) {
      console.error('[GET /api/contents/scheduled] Database error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return NextResponse.json({ 
        error: 'Database query failed', 
        details: error.message 
      }, { status: 500 });
    }

    console.log('[GET /api/contents/scheduled] Returning data with', data?.length || 0, 'items');
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('[GET /api/contents/scheduled] Unexpected error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ 
      error: 'Unexpected server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}