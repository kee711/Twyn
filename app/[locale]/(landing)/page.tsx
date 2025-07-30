import HomeClient from './HomeClient';

export async function generateStaticParams() {
  return [
    { locale: 'ko' },
    { locale: 'en' }
  ];
}

export default function Home({ params }: { params: { locale: string } }) {
  return <HomeClient />;
}