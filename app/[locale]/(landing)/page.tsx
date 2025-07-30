'use client';

import HomeClient from './HomeClient';

// export async function generateStaticParams() {
//   return [
//     { locale: 'ko' },
//     { locale: 'en' }
//   ];
// }
export const dynamic = 'force-dynamic';

export default function Home() {
  return <HomeClient />;
}