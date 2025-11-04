import { NextResponse } from 'next/server'

// Farcaster Hosted Manifest URL
const FARCASTER_HOSTED_MANIFEST_URL = 'https://api.farcaster.xyz/miniapps/hosted-manifest/019a4ecb-c799-a2bd-6083-8b0d1d61bf90'

export async function GET() {
  // Redirect to Farcaster Hosted Manifest with 307 (Temporary Redirect)
  return NextResponse.redirect(FARCASTER_HOSTED_MANIFEST_URL, 307)
}
