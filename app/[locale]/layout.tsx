import {NextIntlClientProvider, hasLocale} from 'next-intl';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
import {getMessages} from 'next-intl/server';
import {setRequestLocale} from 'next-intl/server';
import { Inter } from "next/font/google";
import "../globals.css";
import { Toaster } from 'sonner';
import { Providers } from '../providers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { MixpanelProvider } from '@/components/analytics/MixpanelProvider';
import Script from 'next/script';

const inter = Inter({ subsets: ["latin"] });

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

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

  // Enable static rendering
  setRequestLocale(locale);

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();
  const session = await getServerSession(authOptions);

  return (
    <html lang={locale} suppressHydrationWarning className="h-full">
      <head>
        {/* Google Analytics 4 */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-LTQDELH3V7"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-LTQDELH3V7');
          `}
        </Script>
      </head>
      <body className={`h-full bg-muted ${inter.className}`}>
        <div className="h-full">
          <Providers session={session}>
            <NextIntlClientProvider messages={messages}>
              <MixpanelProvider>
                {children}
              </MixpanelProvider>
            </NextIntlClientProvider>
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
      </body>
    </html>
  );
}