import { NextResponse } from 'next/server'

import { miniAppManifest } from '@/public/.well-known/farcaster.json'

export async function GET() {
  return NextResponse.json(miniAppManifest)
}
