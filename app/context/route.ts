import { NextResponse } from 'next/server'

import { miniAppManifest } from '@/config/miniapp'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    miniapp: {
      name: miniAppManifest.miniapp?.name,
      version: miniAppManifest.miniapp?.version,
    },
  })
}
