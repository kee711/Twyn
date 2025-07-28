import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner';
import { Providers } from './providers'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/authOptions'

const inter = Inter({ subsets: ["latin"] });


export const metadata: Metadata = {
  title: "twyn | Grow faster on Threads",
  description: "스레드에서 더 빠르게 성장하세요. AI가 콘텐츠를 생성하고 최적의 시간에 자동 게시해드립니다.",
  keywords: ['threads', 'social media', 'ai', 'content creation', 'automation', 'marketing', '스레드', '소셜미디어', '마케팅'],
  authors: [{ name: 'twyn' }],
  creator: 'twyn',
  publisher: 'twyn',
  metadataBase: new URL('https://twyn.sh'),
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
    title: 'twyn | Grow faster on Threads',
    description: '스레드에서 더 빠르게 성장하세요. AI가 콘텐츠를 생성하고 최적의 시간에 자동 게시해드립니다.',
    url: 'https://twyn.sh',
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
    title: 'twyn | Grow faster on Threads',
    description: '스레드에서 더 빠르게 성장하세요. AI가 콘텐츠를 생성하고 최적의 시간에 자동 게시해드립니다.',
    images: '/opengraph.png',
    creator: '@twyn',
  },
  verification: {
    google: 'google-site-verification-code',
  },
  category: 'technology',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="ko" suppressHydrationWarning className="h-full">
      <body className={`h-full bg-muted ${inter.className}`}>
        <div className="h-full">
          <Providers session={session}>
            {children}
          </Providers>
        </div>
        <Toaster
          position="bottom-center"
          richColors
          closeButton
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.fbAsyncInit = function() {
                FB.init({
                  appId      : '2367583083616415',
                  xfbml      : true,
                  version    : 'v22.0'
                });
                FB.AppEvents.logPageView();
              };
              (function(d, s, id){
                var js, fjs = d.getElementsByTagName(s)[0];
                if (d.getElementById(id)) {return;}
                js = d.createElement(s); js.id = id;
                js.src = "https://connect.facebook.net/en_US/sdk.js";
                fjs.parentNode.insertBefore(js, fjs);
              }(document, 'script', 'facebook-jssdk'));
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "twyn",
              "description": {
                "ko": "스레드에서 더 빠르게 성장하세요. AI가 콘텐츠를 생성하고 최적의 시간에 자동 게시해드립니다.",
                "en": "Grow faster on Threads with your AI twin. Automated content creation and optimal posting times."
              },
              "url": "https://twyn.sh",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Web",
              "offers": {
                "@type": "Offer",
                "category": "Software"
              },
              "provider": {
                "@type": "Organization",
                "name": "twyn"
              },
              "featureList": {
                "ko": [
                  "AI 콘텐츠 생성",
                  "자동 게시 스케줄링",
                  "트렌드 분석",
                  "성과 통계",
                  "댓글 관리"
                ],
                "en": [
                  "AI Content Generation",
                  "Automated Post Scheduling",
                  "Trend Analysis",
                  "Performance Analytics",
                  "Comment Management"
                ]
              },
              "inLanguage": ["ko", "en"]
            })
          }}
        />
      </body>
    </html>
  );
}
