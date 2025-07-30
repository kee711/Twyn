'use client';

import { usePathname } from 'next/navigation';

export function useLocale() {
  const pathname = usePathname();
  const locale = pathname.split('/')[1];
  return ['en', 'ko'].includes(locale) ? locale : 'en';
}