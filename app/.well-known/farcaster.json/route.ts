import { NextResponse } from 'next/server'

import { miniAppManifest } from '../../../config/miniapp'

export async function GET() {
  return NextResponse.json(miniAppManifest)
}
