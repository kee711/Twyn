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
      header: '',
      payload: '',
      signature: ''
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
      tagline: 'Your AI Twin for Contents Creation',
      ogTitle: 'twyn | Grow faster on Threads',
      ogDescription: 'Your AI Twin for Contents Creation',
      ogImageUrl: 'https://twyn.sh/opengraph.png',
      noindex: true
    }
  }

  // Optionally drop empty properties if any
  const sanitized = withValidProperties(manifest as any)
  return NextResponse.json(sanitized)
}


