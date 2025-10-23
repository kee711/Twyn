import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    console.log('[farcaster/account] Request received');
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.warn('[farcaster/account] Unauthenticated request');
      return NextResponse.json({ ok: false, error: "Unauthenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { fid, username } = body || {};
    if (!fid) {
      console.warn('[farcaster/account] Missing fid in payload', body);
      return NextResponse.json({ ok: false, error: "Missing fid" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: existingAccount, error: fetchError } = await supabase
      .from('farcaster_accounts')
      .select('custody_address, signer_public_key_hex, signer_private_key_enc, signed_key_request_token, signed_key_request_state, signed_key_request_expires_at, signer_approved_at, is_active')
      .eq('owner', session.user.id)
      .eq('fid', Number(fid))
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json({ ok: false, error: fetchError.message }, { status: 500 });
    }

    const basePayload: Record<string, unknown> = {
      username: typeof username === 'string' ? username : null,
      updated_at: new Date().toISOString(),
    };

    if (existingAccount?.custody_address) basePayload.custody_address = existingAccount.custody_address;
    if (existingAccount?.signer_public_key_hex) basePayload.signer_public_key_hex = existingAccount.signer_public_key_hex;
    if (existingAccount?.signer_private_key_enc) basePayload.signer_private_key_enc = existingAccount.signer_private_key_enc;
    if (existingAccount?.signed_key_request_token) basePayload.signed_key_request_token = existingAccount.signed_key_request_token;
    if (existingAccount?.signed_key_request_state) basePayload.signed_key_request_state = existingAccount.signed_key_request_state;
    if (existingAccount?.signed_key_request_expires_at) basePayload.signed_key_request_expires_at = existingAccount.signed_key_request_expires_at;
    if (existingAccount?.signer_approved_at) basePayload.signer_approved_at = existingAccount.signer_approved_at;
    if (typeof existingAccount?.is_active === 'boolean') basePayload.is_active = existingAccount.is_active;

    if (existingAccount) {
      const { error: updateError } = await supabase
        .from('farcaster_accounts')
        .update(basePayload)
        .eq('owner', session.user.id)
        .eq('fid', Number(fid));

      if (updateError) {
        return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
      }
    } else {
      const insertPayload = {
        owner: session.user.id,
        fid: Number(fid),
        ...basePayload,
        created_at: new Date().toISOString(),
      };

      const { error: insertError } = await supabase
        .from('farcaster_accounts')
        .insert(insertPayload);

      if (insertError) {
        return NextResponse.json({ ok: false, error: insertError.message }, { status: 500 });
      }
    }

    // social_accounts에 Farcaster 계정 동기화
    const socialId = String(fid);
    const { data: existingSocialAccount } = await supabase
      .from('social_accounts')
      .select('id')
      .eq('owner', session.user.id)
      .eq('platform', 'farcaster')
      .eq('social_id', socialId)
      .maybeSingle();

    let socialAccountId: string | undefined = existingSocialAccount?.id;

    if (socialAccountId) {
      const { error: updateSocialError } = await supabase
        .from('social_accounts')
        .update({
          username: typeof username === 'string' ? username : socialId,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', socialAccountId);

      if (updateSocialError) {
        console.warn('Failed to update social_accounts entry for Farcaster', updateSocialError);
      }
    } else {
      const { data: insertedSocial, error: insertSocialError } = await supabase
        .from('social_accounts')
        .insert({
          owner: session.user.id,
          platform: 'farcaster',
          social_id: socialId,
          username: typeof username === 'string' ? username : socialId,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (insertSocialError) {
        console.warn('Failed to insert social_accounts entry for Farcaster', insertSocialError);
      } else {
        socialAccountId = insertedSocial?.id;
      }
    }

    if (socialAccountId) {
      const { error: selectionError } = await supabase
        .from('user_selected_accounts')
        .upsert({
          user_id: session.user.id,
          platform: 'farcaster',
          social_account_id: socialAccountId,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,platform' });

      if (selectionError) {
        console.warn('Failed to upsert user_selected_accounts for Farcaster', selectionError);
      }
    }

    return NextResponse.json({
      ok: true,
      message: 'Farcaster account linked successfully',
      socialAccountId: socialAccountId,
      fid: Number(fid)
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
