'use client';

import { createContext, useContext } from 'react';
import { useTranslations } from '@/lib/i18n';

interface LocaleContextType {
  locale: string;
  t: (key: string, variables?: Record<string, any>) => string;
}

const LocaleContext = createContext<LocaleContextType | null>(null);

export function LocaleProvider({ 
  children, 
  locale 
}: { 
  children: React.ReactNode;
  locale: string;
}) {
  const t = useTranslations(locale);

  return (
    <LocaleContext.Provider value={{ locale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocaleContext() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocaleContext must be used within LocaleProvider');
  }
  return context;
}