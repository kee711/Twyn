import type { Metadata } from "next";
import { Inter } from 'next/font/google';

import { fcMiniAppMetadata, miniAppName } from '@/config/miniapp'
import { MiniAppInitializer } from '@/components/MiniAppInitializer'

const baseTitle = `${miniAppName} | Grow faster on Threads`

export const metadata: Metadata = {
  title: baseTitle,
  description: "스레드에서 더 빠르게 성장하세요. AI가 콘텐츠를 생성하고 최적의 시간에 자동 게시해드립니다.",
  keywords: ['threads', 'social media', 'ai', 'content creation', 'automation', 'marketing', '스레드', '소셜미디어', '마케팅'],
  authors: [{ name: miniAppName }],
  creator: miniAppName,
  publisher: miniAppName,
  metadataBase: new URL('https://app.twyn.sh'),
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '16x16' },
      { url: '/favicon.ico', sizes: '32x32' },
    ],
    apple: '/favicon.ico',
    shortcut: '/favicon.ico',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: baseTitle,
    description: '스레드에서 더 빠르게 성장하세요. AI가 콘텐츠를 생성하고 최적의 시간에 자동 게시해드립니다.',
    url: 'https://app.twyn.sh',
    siteName: 'twyn',
    images: [
      {
        url: '/opengraph.png',
        width: 1200,
        height: 630,
        alt: 'twyn | Grow faster on Threads',
      },
    ],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: baseTitle,
    description: '스레드에서 더 빠르게 성장하세요. AI가 콘텐츠를 생성하고 최적의 시간에 자동 게시해드립니다.',
    images: '/opengraph.png',
    creator: '@twyn',
  },
  verification: {
    google: 'google-site-verification-code',
  },
  category: 'technology',
  other: {
    'fc:miniapp': JSON.stringify(fcMiniAppMetadata),
  },
};

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning className="h-full">
      <body className={`h-full bg-muted ${inter.className}`}>
        <MiniAppInitializer />
        {children}
      </body>
    </html>
  );
}
