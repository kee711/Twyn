import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { encryptToken } from "@/lib/utils/crypto";

const TOKEN_URL = "https://api.twitter.com/2/oauth2/token";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/social-connect?error=unauthenticated`);
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/social-connect?error=invalid_code`);
  }

  const cookieStore = cookies();
  const storedState = cookieStore.get("x_oauth_state")?.value;
  const codeVerifier = cookieStore.get("x_oauth_code_verifier")?.value;
  cookieStore.delete("x_oauth_state");
  cookieStore.delete("x_oauth_code_verifier");

  if (!codeVerifier || storedState !== state || !state.startsWith(session.user.id)) {
    console.error("X OAuth state mismatch", { storedState, state, user: session.user.id });
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/social-connect?error=invalid_state`);
  }

  const clientId = process.env.X_CLIENT_ID;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/x/oauth/callback`;
  if (!clientId) {
    console.error("X OAuth client id missing");
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/social-connect?error=server_error`);
  }

  const clientSecret = process.env.X_CLIENT_SECRET;

  const params = new URLSearchParams({
    code,
    grant_type: "authorization_code",
    client_id: clientId,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });

  const headers: Record<string, string> = { "Content-Type": "application/x-www-form-urlencoded" };
  if (clientSecret) {
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    headers["Authorization"] = `Basic ${basic}`;
  }

  const tokenRes = await fetch(TOKEN_URL, {
    method: "POST",
    headers,
    body: params.toString(),
  });

  const tokenJson = await tokenRes.json();
  if (!tokenRes.ok || !tokenJson.access_token) {
    console.error("Failed to exchange X OAuth token", tokenJson);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/social-connect?error=token_exchange`);
  }

  const accessToken: string = tokenJson.access_token;
  const refreshToken: string | undefined = tokenJson.refresh_token;
  const expiresIn: number | undefined = tokenJson.expires_in;
  const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null;

  const userRes = await fetch("https://api.twitter.com/2/users/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!userRes.ok) {
    console.error("Failed to fetch X user info", await userRes.text());
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/social-connect?error=user_info_fetch`);
  }

  const userJson = await userRes.json();
  const xUserId = userJson?.data?.id;
  const username = userJson?.data?.username || xUserId;
  if (!xUserId) {
    console.error("X user id missing", userJson);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/social-connect?error=user_info_fetch`);
  }

  const supabase = await createClient();

  const { data: existingAccount } = await supabase
    .from("social_accounts")
    .select("id, onboarding_completed")
    .eq("owner", session.user.id)
    .eq("social_id", xUserId)
    .eq("platform", "x")
    .maybeSingle();

  const encryptedAccess = encryptToken(accessToken);
  const encryptedRefresh = refreshToken ? encryptToken(refreshToken) : null;

  let accountId: string | undefined;
  let needsOnboarding = false;

  if (existingAccount) {
    accountId = existingAccount.id;
    needsOnboarding = !existingAccount.onboarding_completed;
    const { error: updateError } = await supabase
      .from("social_accounts")
      .update({
        access_token: encryptedAccess,
        refresh_token: encryptedRefresh,
        expires_at: expiresAt,
        username,
        updated_at: new Date().toISOString(),
        is_active: true,
      })
      .eq("id", accountId);

    if (updateError) {
      console.error("Failed to update X account", updateError);
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/social-connect?error=db_error`);
    }
  } else {
    needsOnboarding = true;
    const { data: inserted, error: insertError } = await supabase
      .from("social_accounts")
      .insert({
        owner: session.user.id,
        platform: "x",
        access_token: encryptedAccess,
        refresh_token: encryptedRefresh,
        social_id: xUserId,
        username,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
        is_active: true,
        onboarding_completed: false,
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      console.error("Failed to insert X account", insertError);
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/social-connect?error=db_error`);
    }
    accountId = inserted.id;
  }

  const { error: xAccountError } = await supabase
    .from("x_accounts")
    .upsert({
      owner: session.user.id,
      social_id: xUserId,
      username,
      access_token: encryptedAccess,
      refresh_token: encryptedRefresh,
      expires_at: expiresAt,
      is_active: true,
      updated_at: new Date().toISOString()
    }, { onConflict: "owner,social_id" });

  if (xAccountError) {
    console.error("Failed to upsert x_accounts", xAccountError);
  }

  // 선택된 소셜 계정 미설정 시 기본값으로 설정
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("selected_social_id")
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (!profile?.selected_social_id) {
    const { error: profileError } = await supabase
      .from("user_profiles")
      .update({ selected_social_id: xUserId })
      .eq("user_id", session.user.id);

    if (profileError) {
      console.warn("Failed to update selected_social_id for X", profileError);
    }
  }

  const { error: selectionError } = await supabase
    .from('user_selected_accounts')
    .upsert({
      user_id: session.user.id,
      platform: 'x',
      social_account_id: accountId!,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,platform' });

  if (selectionError) {
    console.warn('Failed to update user_selected_accounts for X', selectionError);
  }

  if (needsOnboarding) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/onboarding?type=social&account_id=${accountId}`);
  }

  return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/contents/topic-finder`);
}
