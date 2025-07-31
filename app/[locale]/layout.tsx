import {NextIntlClientProvider, hasLocale} from 'next-intl';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
import { Toaster } from 'sonner';
import { Providers } from '../providers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import {getMessages} from 'next-intl/server';

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}) {
  // Ensure that the incoming `locale` is valid
  const {locale} = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const session = await getServerSession(authOptions);
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning className="h-full">
      <body className={`h-full bg-muted`}>
        <Providers session={session}>
          <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
            <Toaster />
          </NextIntlClientProvider>
        </Providers>
      </body>
    </html>
  );
}