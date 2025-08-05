import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { decryptToken } from '@/lib/utils/crypto';

export async function GET(request: NextRequest) {
  console.log('[GET /api/threads/profile-picture] Starting request');
  
  try {
    console.log('[GET /api/threads/profile-picture] Getting server session...');
    const session = await getServerSession(authOptions);
    console.log('[GET /api/threads/profile-picture] Session:', session ? { userId: session.user?.id, email: session.user?.email } : 'No session');
    
    if (!session?.user?.id) {
      console.log('[GET /api/threads/profile-picture] No authenticated user, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const socialId = searchParams.get('socialId');
    console.log('[GET /api/threads/profile-picture] Social ID:', socialId);

    if (!socialId) {
      console.log('[GET /api/threads/profile-picture] Missing socialId parameter');
      return NextResponse.json({ error: 'socialId is required' }, { status: 400 });
    }

    console.log('[GET /api/threads/profile-picture] Creating Supabase client...');
    const supabase = await createClient();
    console.log('[GET /api/threads/profile-picture] Supabase client created');

    // Get the access token for the social account
    console.log('[GET /api/threads/profile-picture] Fetching social account from database...');
    const { data: account, error: accountError } = await supabase
      .from('social_accounts')
      .select('access_token, platform')
      .eq('social_id', socialId)
      .eq('owner', session.user.id)
      .single();
    
    console.log('[GET /api/threads/profile-picture] Database response:', {
      hasAccount: !!account,
      platform: account?.platform,
      error: accountError ? {
        message: accountError.message,
        details: accountError.details,
        code: accountError.code
      } : null
    });

    if (accountError || !account) {
      console.error('[GET /api/threads/profile-picture] Social account not found:', accountError);
      return NextResponse.json({ error: 'Social account not found' }, { status: 404 });
    }

    if (account.platform !== 'threads') {
      console.log('[GET /api/threads/profile-picture] Invalid platform:', account.platform);
      return NextResponse.json({ error: 'Only Threads accounts supported' }, { status: 400 });
    }

    // Decrypt the access token
    console.log('[GET /api/threads/profile-picture] Decrypting access token...');
    const decryptedToken = decryptToken(account.access_token);
    console.log('[GET /api/threads/profile-picture] Access token decrypted');

    // Fetch fresh profile picture URL from Threads API
    console.log('[GET /api/threads/profile-picture] Fetching profile picture from Threads API...');
    const threadsResponse = await fetch(
      `https://graph.threads.net/v1.0/me?fields=threads_profile_picture_url&access_token=${decryptedToken}`
    );
    
    console.log('[GET /api/threads/profile-picture] Threads API response status:', threadsResponse.status);

    if (!threadsResponse.ok) {
      const errorText = await threadsResponse.text();
      console.error('[GET /api/threads/profile-picture] Threads API error:', {
        status: threadsResponse.status,
        statusText: threadsResponse.statusText,
        error: errorText
      });
      return NextResponse.json({ 
        error: 'Failed to fetch profile picture', 
        details: `Threads API returned ${threadsResponse.status}` 
      }, { status: 500 });
    }

    const userData = await threadsResponse.json();
    console.log('[GET /api/threads/profile-picture] Threads API data:', {
      hasProfilePicture: !!userData.threads_profile_picture_url
    });

    const response = {
      profilePictureUrl: userData.threads_profile_picture_url || null
    };
    console.log('[GET /api/threads/profile-picture] Returning response:', response);
    
    return NextResponse.json(response);

  } catch (error) {
    console.error('[GET /api/threads/profile-picture] Unexpected error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}