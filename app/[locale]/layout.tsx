import { notFound } from 'next/navigation';
import { Toaster } from 'sonner';
import { Providers } from '../providers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { Inter } from "next/font/google";
import { LocaleProvider } from '@/components/providers/LocaleProvider';

const inter = Inter({ subsets: ["latin"] });
const locales = ['en', 'ko'];

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  if (!locales.includes(locale as any)) {
    notFound();
  }

  const session = await getServerSession(authOptions);

  return (
    <html lang={locale} suppressHydrationWarning className="h-full">
      <body className={`h-full bg-muted ${inter.className}`}>
        <div className="h-full">
          <Providers session={session}>
            <LocaleProvider locale={locale}>
              {children}
            </LocaleProvider>
          </Providers>
        </div>
        <Toaster
          position="bottom-center"
          richColors
          closeButton
        />
      </body>
    </html>
  );
}