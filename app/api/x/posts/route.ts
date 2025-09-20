import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { createClient } from "@/lib/supabase/server";
import { decryptToken, encryptToken } from "@/lib/utils/crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSelectedSocialAccount } from '@/lib/server/socialAccounts';

const TOKEN_URL = "https://api.twitter.com/2/oauth2/token";
const POST_URL = "https://api.twitter.com/2/tweets";

interface XAccountTokenRecord {
  id: string;
  social_id: string;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | null;
}

async function refreshTokenIfNeeded(account: XAccountTokenRecord, supabase: SupabaseClient, ownerId: string) {
  if (!account.refresh_token) {
    if (!account.access_token) {
      throw new Error('Missing access token');
    }
    return { accessToken: decryptToken(account.access_token), updated: false };
  }

  const accessToken = account.access_token ? decryptToken(account.access_token) : '';
  const refreshToken = decryptToken(account.refresh_token);
  const expiresAt = account.expires_at ? new Date(account.expires_at).getTime() : null;
  const now = Date.now();

  if (expiresAt && expiresAt - now > 60 * 1000) {
    return { accessToken, updated: false };
  }

  const clientId = process.env.X_CLIENT_ID;
  if (!clientId) {
    throw new Error("X_CLIENT_ID missing");
  }

  const clientSecret = process.env.X_CLIENT_SECRET;

  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
  });

  const headers: Record<string, string> = { "Content-Type": "application/x-www-form-urlencoded" };
  if (clientSecret) {
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    headers["Authorization"] = `Basic ${basic}`;
  }

  const refreshRes = await fetch(TOKEN_URL, {
    method: "POST",
    headers,
    body: params.toString(),
  });

  const refreshJson = await refreshRes.json();
  if (!refreshRes.ok || !refreshJson.access_token) {
    console.error("Failed to refresh X token", refreshJson);
    throw new Error("TOKEN_REFRESH_FAILED");
  }

  const newAccess = encryptToken(refreshJson.access_token);
  const newRefresh = refreshJson.refresh_token ? encryptToken(refreshJson.refresh_token) : account.refresh_token;
  const newExpiresAt = refreshJson.expires_in
    ? new Date(Date.now() + Number(refreshJson.expires_in) * 1000).toISOString()
    : account.expires_at;

  await supabase
    .from("social_accounts")
    .update({
      access_token: newAccess,
      refresh_token: newRefresh,
      expires_at: newExpiresAt,
      updated_at: new Date().toISOString(),
      is_active: true,
    })
    .eq("owner", ownerId)
    .eq("platform", "x")
    .eq("social_id", account.social_id);

  return { accessToken: refreshJson.access_token as string, updated: true };
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const supabase = await createClient();
  let socialAccount;
  try {
    socialAccount = await requireSelectedSocialAccount(session.user.id, 'x');
  } catch (error) {
    return NextResponse.json({ ok: false, error: "ACCOUNT_NOT_CONNECTED" }, { status: 400 });
  }

  if (!socialAccount.access_token) {
    return NextResponse.json({ ok: false, error: "ACCOUNT_NOT_CONNECTED" }, { status: 400 });
  }

  const tokenRecord: XAccountTokenRecord = {
    id: socialAccount.id,
    social_id: socialAccount.social_id,
    access_token: socialAccount.access_token,
    refresh_token: socialAccount.refresh_token || null,
    expires_at: socialAccount.expires_at || null,
  };

  const body = await req.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text) {
    return NextResponse.json({ ok: false, error: "EMPTY_CONTENT" }, { status: 400 });
  }

  let accessToken: string;
  try {
    const result = await refreshTokenIfNeeded(tokenRecord, supabase, session.user.id);
    accessToken = result.accessToken;
  } catch (refreshError) {
    console.error("X token refresh error", refreshError);
    return NextResponse.json({ ok: false, error: "TOKEN_REFRESH_FAILED" }, { status: 401 });
  }

  const postRes = await fetch(POST_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  const postJson = await postRes.json().catch(() => ({}));
  if (!postRes.ok) {
    console.error("Failed to post to X", postJson);
    if (postRes.status === 401) {
      await supabase
        .from("social_accounts")
        .update({ is_active: false })
        .eq("owner", session.user.id)
        .eq("platform", "x")
        .eq("id", socialAccount.id);
    }
    return NextResponse.json({ ok: false, error: "POST_FAILED", details: postJson }, { status: 500 });
  }

  return NextResponse.json({ ok: true, result: postJson });
}
