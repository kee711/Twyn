import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { cookies } from "next/headers";
import { randomBytes, createHash } from "node:crypto";

const X_AUTH_URL = "https://twitter.com/i/oauth2/authorize";

function base64Url(buffer: Uint8Array | Buffer) {
  return Buffer.from(buffer)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const clientId = process.env.X_CLIENT_ID;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/x/oauth/callback`;
  if (!clientId || !redirectUri) {
    console.error("X OAuth 환경변수 누락");
    return NextResponse.json({ error: "OAuth misconfigured" }, { status: 500 });
  }

  const codeVerifier = base64Url(randomBytes(64));
  const codeChallenge = base64Url(createHash("sha256").update(codeVerifier).digest());

  const state = `${session.user.id}:${Date.now()}`;

  const cookieStore = cookies();
  cookieStore.set("x_oauth_code_verifier", codeVerifier, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60, // 10 minutes
  });
  cookieStore.set("x_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });

  const authUrl = new URL(X_AUTH_URL);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", "tweet.read tweet.write users.read offline.access");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge", codeChallenge);
  authUrl.searchParams.set("code_challenge_method", "S256");

  return NextResponse.redirect(authUrl);
}
