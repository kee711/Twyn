import { NextResponse } from "next/server";
import axios from "axios";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { createClient } from "@/lib/supabase/server";

const FARCASTER_API_URL = process.env.FARCASTER_API_URL || "https://api.farcaster.xyz";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: "Unauthenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    if (!token) return NextResponse.json({ ok: false, error: "Missing token" }, { status: 400 });

    const headers: Record<string, string> = {};
    const apiKey = process.env.FARCASTER_API_KEY;
    if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

    const { data } = await axios.get(`${FARCASTER_API_URL}/v2/signed-key-request`, { params: { token }, headers });
    const skr = data?.result?.signedKeyRequest;
    if (!skr) return NextResponse.json({ ok: false, error: "Invalid response" }, { status: 502 });

    if (skr.state === "completed" && skr.userFid) {
      const supabase = await createClient();
      const { error: upErr } = await supabase
        .from("farcaster_account")
        .update({ is_active: true, updated_at: new Date().toISOString() })
        .eq("owner", session.user.id)
        .eq("fid", Number(skr.userFid))
        .eq("signed_key_request_token", token);
      if (upErr) return NextResponse.json({ ok: false, error: `DB error: ${upErr.message}` }, { status: 500 });
    }

    return NextResponse.json({ ok: true, signedKeyRequest: skr });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}




