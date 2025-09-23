import { NextResponse } from "next/server";
import * as ed from "@noble/ed25519";
import axios from "axios";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { createClient } from "@/lib/supabase/server";
import { encryptToken } from "@/lib/utils/crypto";
import { mnemonicToAccount } from "viem/accounts";

const FARCASTER_API_URL = process.env.FARCASTER_API_URL || "https://api.farcaster.xyz";

const SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN = {
  name: "Farcaster SignedKeyRequestValidator",
  version: "1",
  chainId: 10,
  verifyingContract: "0x00000000fc700472606ed4fa22623acf62c60553",
} as const;

const SIGNED_KEY_REQUEST_TYPE = [
  { name: "requestFid", type: "uint256" },
  { name: "key", type: "bytes" },
  { name: "deadline", type: "uint256" },
] as const;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: "Unauthenticated" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const providedFid = typeof body?.fid === "number" ? body.fid : undefined;
    const redirectUrl = typeof body?.redirectUrl === "string" ? body.redirectUrl : undefined;

    const supabase = await createClient();

    const { data: fa } = await supabase
      .from('farcaster_accounts')
      .select('fid, username, custody_address')
      .eq('owner', session.user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const userFid = providedFid ?? fa?.fid;
    if (!userFid) {
      return NextResponse.json({ ok: false, error: "No Farcaster fid for user. Connect with AuthKit first." }, { status: 400 });
    }

    const appFid = process.env.NEXT_PUBLIC_FARCASTER_APP_FID;
    const appMnemonic = process.env.FARCASTER_APP_MNEMONIC;
    if (!appFid || !appMnemonic) {
      return NextResponse.json({ ok: false, error: "Missing NEXT_PUBLIC_FARCASTER_APP_FID or FARCASTER_APP_MNEMONIC" }, { status: 500 });
    }

    // 1) Generate Ed25519 keypair
    const privateKeyBytes = ed.utils.randomSecretKey();
    const publicKeyBytes = await ed.getPublicKey(privateKeyBytes);
    const publicKeyHex = "0x" + Buffer.from(publicKeyBytes).toString("hex");

    // 2) EIP-712 signature by app custody wallet
    const account = mnemonicToAccount(appMnemonic);
    const deadline = Math.floor(Date.now() / 1000) + 86400; // 24h

    const signature = await account.signTypedData({
      domain: SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN,
      types: { SignedKeyRequest: SIGNED_KEY_REQUEST_TYPE as any },
      primaryType: "SignedKeyRequest",
      message: {
        requestFid: BigInt(appFid),
        key: publicKeyHex,
        deadline: BigInt(deadline),
      },
    });

    // 3) Call Farcaster API
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const apiKey = process.env.FARCASTER_API_KEY;
    if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

    const { data: createData } = await axios.post(
      `${FARCASTER_API_URL}/v2/signed-key-requests`,
      {
        key: publicKeyHex,
        requestFid: appFid,
        signature,
        deadline,
        ...(redirectUrl ? { redirectUrl } : {}),
      },
      { headers }
    );

    const token = createData?.result?.signedKeyRequest?.token as string | undefined;
    const deeplinkUrl = createData?.result?.signedKeyRequest?.deeplinkUrl as string | undefined;
    if (!token || !deeplinkUrl) {
      return NextResponse.json({ ok: false, error: "Invalid response from Farcaster API" }, { status: 502 });
    }

    // 4) Persist signer (encrypted)
    const encryptedPriv = encryptToken(Buffer.from(privateKeyBytes).toString('base64'));
    const expiresAtIso = new Date(deadline * 1000).toISOString();
    const nowIso = new Date().toISOString();

    const basePayload: Record<string, unknown> = {
      owner: session.user.id,
      fid: Number(userFid),
      signer_public_key_hex: publicKeyHex,
      signer_private_key_enc: encryptedPriv,
      signed_key_request_token: token,
      signed_key_request_state: 'pending',
      signed_key_request_expires_at: expiresAtIso,
      signer_approved_at: null,
      is_active: false,
      updated_at: nowIso,
    };

    if (fa?.username) basePayload.username = fa.username;
    if (fa?.custody_address) basePayload.custody_address = fa.custody_address;

    const { error: upErr } = await supabase
      .from('farcaster_accounts')
      .upsert(basePayload, { onConflict: 'owner,fid' });

    if (upErr) {
      return NextResponse.json({ ok: false, error: `DB error: ${upErr.message}` }, { status: 500 });
    }

    return NextResponse.json({ ok: true, token, deeplinkUrl });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
