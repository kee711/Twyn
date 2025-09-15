import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ ok: false, error: "Unauthenticated" }, { status: 401 });

    const body = await req.json();
    const { fid, username } = body || {};
    if (!fid) return NextResponse.json({ ok: false, error: "Missing fid" }, { status: 400 });

    const supabase = await createClient();
    const { error } = await supabase
      .from("farcaster_accounts")
      .upsert(
        {
          owner: session.user.id,
          fid: Number(fid),
          username: typeof username === "string" ? username : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "owner,fid" }
      );

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
