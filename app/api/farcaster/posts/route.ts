import { NextResponse } from "next/server";
import axios from "axios";
import {
  FarcasterNetwork,
  Message,
  NobleEd25519Signer,
  makeCastAdd,
  CastType,
} from "@farcaster/hub-web";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { createClient } from "@/lib/supabase/server";
import { decryptToken } from "@/lib/utils/crypto";

function getHubBaseUrl(): string {
  const host = process.env.FARCASTER_HUB_HOST || "127.0.0.1";
  const port = process.env.FARCASTER_HUB_PORT || "3381";
  const useSSL = String(process.env.FARCASTER_HUB_USE_SSL || "false") === "true";
  const scheme = useSSL ? "https" : "http";
  return `${scheme}://${host}:${port}`;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ ok: false, error: "Unauthenticated" }, { status: 401 });

    const body = await req.json();
    const text: string = String(body.text || "");
    const embeds: Array<{ url?: string; cast_id?: { fid: number; hash: string } }>
      = Array.isArray(body.embeds) ? body.embeds : [];
    const mentions: number[] = Array.isArray(body.mentions) ? body.mentions : [];
    const mentionsPositions: number[] = Array.isArray(body.mentionsPositions) ? body.mentionsPositions : [];
    const parentCast = body.parentCast as { fid?: number | null; hash?: string | null } | undefined;
    const parentUrl = typeof body.parentUrl === "string" ? body.parentUrl : undefined;

    const supabase = await createClient();
    const { data: acct } = await supabase
      .from("farcaster_accounts")
      .select("fid, signer_private_key_enc")
      .eq("owner", session.user.id)
      .eq("is_active", true)
      .maybeSingle();
    if (!acct?.fid || !acct?.signer_private_key_enc) {
      return NextResponse.json({ ok: false, error: "No active signer or fid. Connect signer first." }, { status: 400 });
    }

    const b64 = decryptToken(acct.signer_private_key_enc);
    const keyBytes = new Uint8Array(Buffer.from(b64, "base64"));
    if (keyBytes.length !== 32) return NextResponse.json({ ok: false, error: "Invalid signer key" }, { status: 500 });
    const signer = new NobleEd25519Signer(keyBytes);

    const networkEnv = (process.env.FARCASTER_NETWORK || "MAINNET").toUpperCase();
    const network = FarcasterNetwork[networkEnv as keyof typeof FarcasterNetwork];
    if (typeof network !== "number") return NextResponse.json({ ok: false, error: "Invalid FARCASTER_NETWORK" }, { status: 500 });

    const dataOptions = { fid: Number(acct.fid), network };
    const castBody = {
      text,
      embeds,
      embedsDeprecated: [],
      mentions,
      mentionsPositions,
      parentUrl,
      parentCastId: parentCast?.fid && parentCast?.hash ? { fid: parentCast.fid, hash: parentCast.hash } : undefined,
      type: CastType.CAST,
    } as const;

    const castResult = await makeCastAdd(castBody, dataOptions, signer);
    if (castResult.isErr()) {
      return NextResponse.json({ ok: false, error: String(castResult.error) }, { status: 400 });
    }

    const messageBytes = Message.encode(castResult.value).finish();
    const hubBaseUrl = getHubBaseUrl();
    const headers: Record<string, string> = { "Content-Type": "application/octet-stream" };
    const auth = (process.env.FARCASTER_HUB_USERNAME && process.env.FARCASTER_HUB_PASSWORD)
      ? { username: process.env.FARCASTER_HUB_USERNAME!, password: process.env.FARCASTER_HUB_PASSWORD! }
      : undefined;

    if (body.validate === true) {
      await axios.post(`${hubBaseUrl}/v1/validateMessage`, messageBytes, { headers, auth });
    }

    const { data } = await axios.post(`${hubBaseUrl}/v1/submitMessage`, messageBytes, { headers, auth });
    return NextResponse.json({ ok: true, result: data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}



