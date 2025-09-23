import { NextResponse } from 'next/server'

import { miniAppManifest } from '@/config/miniapp/manifest.json'

export async function GET() {
  return NextResponse.json(miniAppManifest)
}
