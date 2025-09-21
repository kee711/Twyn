import { NextResponse } from 'next/server'

function withValidProperties(properties: Record<string, undefined | string | string[] | boolean | number | object>) {
  return Object.fromEntries(
    Object.entries(properties).filter(([_, value]) => (Array.isArray(value) ? value.length > 0 : !!value))
  )
}

export async function GET() {
  // NOTE: Keep this in sync with public/.well-known/farcaster.json
  const manifest = {
    accountAssociation: {
      header: "eyJmaWQiOjEzMjQ1MzcsInR5cGUiOm51bGwsImtleSI6IjB4QUY4MjBEM2EyMzQ2QzhCNEVCMzI4MDYwYzM5OEZkYkIzOTRGMzYzMiJ9",
      payload: "eyJkb21haW4iOiJ0d3luLnNoIn0",
      signature: "MHgwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDIwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwNDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAyMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwYzAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMTIwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAxNzAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDE4NWM4NmU5Yzk5ZThmNTQ2NWNhNmVkNGZlZmVkMWQ0NTM1OTk4YWM3ZjkxYzAxZjAwNGQzOTE5ZTZhNzY2ZTMwNThjNzVmMGZlOTQxNTg2NDJkMzIzNWY3NzFlODk5N2MzOGRiODc5YzYxZjg4MmI3MWUzYzc4NDU0YmI4OTU2YjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMjVmMTk4MDg2YjJkYjE3MjU2NzMxYmM0NTY2NzNiOTZiY2VmMjNmNTFkMWZiYWNkZDdjNDM3OWVmNjU0NjU1NzJmMWQwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwOGE3YjIyNzQ3OTcwNjUyMjNhMjI3NzY1NjI2MTc1NzQ2ODZlMmU2NzY1NzQyMjJjMjI2MzY4NjE2YzZjNjU2ZTY3NjUyMjNhMjI2NTdhMzkzNjMwNWEzMjY2NzY3MTRjNDY2NTQ3NTk1OTY3NjM0ZjYyNDE3OTU5NGU0NTRjNTU1NDRmNGEzMTM4NjUzNDRmNDI0YzM3Nzc2MTQ5N2E1OTIyMmMyMjZmNzI2OTY3Njk2ZTIyM2EyMjY4NzQ3NDcwNzMzYTJmMmY2YjY1Nzk3MzJlNjM2ZjY5NmU2MjYxNzM2NTJlNjM2ZjZkMjIyYzIyNjM3MjZmNzM3MzRmNzI2OTY3Njk2ZTIyM2E2NjYxNmM3MzY1N2QwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMA",
    },
    baseBuilder: {
      allowedAddresses: ["0xAF820D3a2346C8B4EB328060c398FdbB394F3632"]
    },
    miniapp: {
      version: '1',
      name: 'twyn',
      homeUrl: 'https://twyn.sh',
      iconUrl: 'https://twyn.sh/opengraph.png',
      splashImageUrl: 'https://twyn.sh/opengraph.png',
      splashBackgroundColor: '#000000',
      webhookUrl: 'https://twyn.sh/api/webhook',
      subtitle: 'Grow faster on Threads',
      description: 'AI가 콘텐츠를 생성하고 최적 시간에 자동 게시합니다.',
      screenshotUrls: [
        'https://twyn.sh/opengraph.png'
      ],
      primaryCategory: 'social',
      tags: [
        'twyn',
        'miniapp',
        'baseapp'
      ],
      heroImageUrl: 'https://twyn.sh/opengraph.png',
      tagline: 'Create contents nonstop',
      ogTitle: 'twyn | Grow faster on Threads',
      ogDescription: 'Your AI Twin for Contents Creation',
      ogImageUrl: 'https://twyn.sh/opengraph.png',
      noindex: true,
      buttonTitle: 'Open twyn'
    }
  }

  // Optionally drop empty properties if any
  const sanitized = withValidProperties(manifest as any)
  return NextResponse.json(sanitized)
}


