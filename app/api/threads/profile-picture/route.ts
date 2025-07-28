import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { decryptToken } from '@/lib/utils/crypto';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const socialId = searchParams.get('socialId');

    if (!socialId) {
      return NextResponse.json({ error: 'socialId is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get the access token for the social account
    const { data: account, error: accountError } = await supabase
      .from('social_accounts')
      .select('access_token, platform')
      .eq('social_id', socialId)
      .eq('owner', session.user.id)
      .single();

    if (accountError || !account) {
      return NextResponse.json({ error: 'Social account not found' }, { status: 404 });
    }

    if (account.platform !== 'threads') {
      return NextResponse.json({ error: 'Only Threads accounts supported' }, { status: 400 });
    }

    // Decrypt the access token
    const decryptedToken = decryptToken(account.access_token);

    // Fetch fresh profile picture URL from Threads API
    const threadsResponse = await fetch(
      `https://graph.threads.net/v1.0/me?fields=threads_profile_picture_url&access_token=${decryptedToken}`
    );

    if (!threadsResponse.ok) {
      const errorText = await threadsResponse.text();
      console.error('Threads API error:', errorText);
      return NextResponse.json({ error: 'Failed to fetch profile picture' }, { status: 500 });
    }

    const userData = await threadsResponse.json();

    return NextResponse.json({
      profilePictureUrl: userData.threads_profile_picture_url || null
    });

  } catch (error) {
    console.error('Profile picture fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}