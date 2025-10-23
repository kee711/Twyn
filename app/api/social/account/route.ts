import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: 'Unauthenticated' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const socialAccountId = body?.socialAccountId as string | undefined;
    const platform = body?.platform as string | undefined;

    if (!socialAccountId || !platform) {
      return NextResponse.json({ ok: false, error: 'Missing parameters' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: account, error: fetchError } = await supabase
      .from('social_accounts')
      .select('id, owner, platform, social_id')
      .eq('id', socialAccountId)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json({ ok: false, error: fetchError.message }, { status: 500 });
    }

    if (!account || account.owner !== session.user.id || account.platform !== platform) {
      return NextResponse.json({ ok: false, error: 'Account not found' }, { status: 404 });
    }

    await supabase
      .from('user_selected_accounts')
      .delete()
      .eq('user_id', session.user.id)
      .eq('platform', platform)
      .eq('social_account_id', socialAccountId);

    if (platform === 'farcaster') {
      const fid = Number(account.social_id);
      if (!Number.isNaN(fid)) {
        await supabase
          .from('farcaster_accounts')
          .delete()
          .eq('owner', session.user.id)
          .eq('fid', fid);
      }
    }

    const { error: deleteError } = await supabase
      .from('social_accounts')
      .delete()
      .eq('id', socialAccountId)
      .eq('owner', session.user.id);

    if (deleteError) {
      return NextResponse.json({ ok: false, error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[social/account] delete failed', error);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
