import { generatePageMetadata } from '@/lib/generatePageMetadata';
import HomeClient from './HomeClient';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'landing'});
  
  return {
    title: t('description'),
    description: t('description')
  };
}

export default function Home() {
  return <HomeClient />;
}