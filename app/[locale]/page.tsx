import { generatePageMetadata } from '@/lib/generatePageMetadata';
import HomeClient from './HomeClient';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { featureFlags } from '@/lib/config/web3';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'landing' });

  return {
    title: t('description'),
    description: t('description')
  };
}

export default function Home() {
  // In web3 mode, redirect directly to topic-finder
  if (featureFlags.enableDirectTopicFinderRouting()) {
    redirect('/contents/topic-finder');
  }

  // Regular mode: show landing page
  return <HomeClient />;
}