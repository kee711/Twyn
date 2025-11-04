import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    console.log('[farcaster/account] Request received');

    const body = await req.json();
    const { fid, username, isSignIn } = body || {};
    if (!fid) {
      console.warn('[farcaster/account] Missing fid in payload', body);
      return NextResponse.json({ ok: false, error: "Missing fid" }, { status: 400 });
    }

    const supabase = await createClient();

    // Handle sign-in flow (user creation/authentication)
    if (isSignIn) {
      // Check if user already exists with this Farcaster FID
      const { data: existingUser, error: userFetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('farcaster_fid', Number(fid))
        .maybeSingle();

      if (userFetchError && userFetchError.code !== 'PGRST116') {
        console.error('[farcaster/account] Error fetching user:', userFetchError);
        return NextResponse.json({ ok: false, error: userFetchError.message }, { status: 500 });
      }

      let userId: string;
      let userEmail: string;

      if (existingUser) {
        // User exists, use existing data
        userId = existingUser.user_id;
        userEmail = existingUser.email;

        // Update user profile with latest Farcaster data
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({
            farcaster_username: username,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        if (updateError) {
          console.error('[farcaster/account] Error updating user profile:', updateError);
        }
      } else {
        // Create new user
        userId = `fc_${fid}_${Date.now()}`;
        userEmail = `${username || fid}@farcaster.local`;

        const { error: createError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: userId,
            email: userEmail,
            name: username || `Farcaster User ${fid}`,
            farcaster_fid: Number(fid),
            farcaster_username: username,
            provider: 'farcaster',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (createError) {
          console.error('[farcaster/account] Error creating user:', createError);
          return NextResponse.json({ ok: false, error: createError.message }, { status: 500 });
        }
      }

      // Create or update Farcaster account
      const { data: existingFarcasterAccount } = await supabase
        .from('farcaster_accounts')
        .select('*')
        .eq('owner', userId)
        .eq('fid', Number(fid))
        .maybeSingle();

      const farcasterAccountPayload = {
        username: username || null,
        updated_at: new Date().toISOString(),
      };

      if (existingFarcasterAccount) {
        const { error: updateError } = await supabase
          .from('farcaster_accounts')
          .update(farcasterAccountPayload)
          .eq('owner', userId)
          .eq('fid', Number(fid));

        if (updateError) {
          console.error('[farcaster/account] Error updating Farcaster account:', updateError);
        }
      } else {
        const { error: insertError } = await supabase
          .from('farcaster_accounts')
          .insert({
            owner: userId,
            fid: Number(fid),
            ...farcasterAccountPayload,
            created_at: new Date().toISOString(),
          });

        if (insertError) {
          console.error('[farcaster/account] Error creating Farcaster account:', insertError);
        }
      }

      // Create or update social account
      const socialId = String(fid);
      const { data: existingSocialAccount } = await supabase
        .from('social_accounts')
        .select('id')
        .eq('owner', userId)
        .eq('platform', 'farcaster')
        .eq('social_id', socialId)
        .maybeSingle();

      let socialAccountId: string | undefined = existingSocialAccount?.id;

      if (socialAccountId) {
        const { error: updateSocialError } = await supabase
          .from('social_accounts')
          .update({
            username: username || socialId,
            is_active: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', socialAccountId);

        if (updateSocialError) {
          console.warn('[farcaster/account] Failed to update social_accounts entry:', updateSocialError);
        }
      } else {
        const { data: insertedSocial, error: insertSocialError } = await supabase
          .from('social_accounts')
          .insert({
            owner: userId,
            platform: 'farcaster',
            social_id: socialId,
            username: username || socialId,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select('id')
          .single();

        if (insertSocialError) {
          console.warn('[farcaster/account] Failed to insert social_accounts entry:', insertSocialError);
        } else {
          socialAccountId = insertedSocial?.id;
        }
      }

      // Set as selected account
      if (socialAccountId) {
        const { error: selectionError } = await supabase
          .from('user_selected_accounts')
          .upsert({
            user_id: userId,
            platform: 'farcaster',
            social_account_id: socialAccountId,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id,platform' });

        if (selectionError) {
          console.warn('[farcaster/account] Failed to upsert user_selected_accounts:', selectionError);
        }
      }

      return NextResponse.json({
        ok: true,
        message: 'Farcaster authentication successful',
        user: {
          id: userId,
          email: userEmail,
          name: username || `Farcaster User ${fid}`,
          fid: Number(fid),
        },
        socialAccountId,
      });
    }

    // Regular account linking flow (existing functionality)
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.warn('[farcaster/account] Unauthenticated request for account linking');
      return NextResponse.json({ ok: false, error: "Unauthenticated" }, { status: 401 });
    }

    // Reuse the supabase client from above
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
