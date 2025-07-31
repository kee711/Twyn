import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner';
import { Providers } from './providers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { LocaleProvider } from '@/components/providers/LocaleProvider';
import { headers } from 'next/headers';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "twyn | Grow faster on Threads",
  description: "스레드에서 더 빠르게 성장하세요. AI가 콘텐츠를 생성하고 최적의 시간에 자동 게시해드립니다.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const headersList = await headers();
  const locale = headersList.get('x-locale') || 'en';

  return (
    <html lang={locale} suppressHydrationWarning className="h-full">
      <body className={`h-full bg-muted ${inter.className}`}>
        <Providers session={session}>
          <LocaleProvider locale={locale}>
            {children}
            <Toaster />
          </LocaleProvider>
        </Providers>
      </body>
    </html>
  );
}
