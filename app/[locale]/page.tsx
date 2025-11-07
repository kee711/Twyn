import { generatePageMetadata } from '@/lib/generatePageMetadata';
import HomeClient from './HomeClient';
import { getTranslations } from 'next-intl/server';
import { featureFlags } from '@/lib/config/web3';
import { AutoLogout } from './AutoLogout';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'landing' });

  return {
    title: t('description'),
    description: t('description')
  };
}

export default function Home() {
  // In web3 mode, perform auto logout and redirect to signin
  if (featureFlags.enableDirectSigninRouting()) {
    return <AutoLogout />;
  }

  // Regular mode: show landing page
  return <HomeClient />;
}