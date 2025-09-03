import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Invite code is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if invite code exists and is valid
    const { data: inviteCode, error } = await supabase
      .from('invite_codes')
      .select('*')
      .eq('code', code)
      .single();

    if (error || !inviteCode) {
      return NextResponse.json(
        { success: false, error: 'Invalid invite code' },
        { status: 400 }
      );
    }

    // Check if code is expired
    if (inviteCode.expires_at && new Date(inviteCode.expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Invite code has expired' },
        { status: 400 }
      );
    }

    // Check if code has reached max usage
    if (inviteCode.max_usage && inviteCode.used_count >= inviteCode.max_usage) {
      return NextResponse.json(
        { success: false, error: 'Invite code usage limit reached' },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      inviteCodeId: inviteCode.id 
    });
  } catch (error) {
    console.error('Error validating invite code:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}